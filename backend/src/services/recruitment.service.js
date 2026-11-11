import Candidate from "../models/Candidate.js";
import CrmCandidate from "../models/CrmCandidate.js";
import CandidateApplication from "../models/CandidateApplication.js";
import CrmCandidateApplication from "../models/CrmCandidateApplication.js";
import Job from "../models/Job.js";
import Interview from "../models/Interview.js";
import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import ProjectAssignment from "../models/ProjectAssignment.js";
import ActivityLog from "../models/ActivityLog.js";
import CrmNotification from "../models/CrmNotification.js";
import { ApiError } from "../utils/apiError.js";
import { saveBase64File } from "../utils/fileStorage.js";
import {
  generateNextCandidateId,
  generateNextCandidateApplicationId,
} from "../utils/idGenerator.js";
import {
  findProjectAcrossSources,
  fetchAllMergedProjects,
  resolveProjectMilestonesData,
  normalizeMilestoneStages,
} from "../utils/projectResolver.js";
import {
  checkApplicationRefundLock,
  markApplicationRefundsReassigned,
} from "../utils/refundLock.js";

const isValidObjectId = (val) =>
  typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val.trim());

const sanitizeCandidateEmail = (val) => {
  const s = String(val || "").trim();
  if (!s || s.toLowerCase().includes("@candidate.local")) return "";
  return s;
};

const normalizeStageAlias = (stage) => {
  if (!stage) return "";
  const s = String(stage).trim();
  if (s === "Interview") return "Interview Scheduled";
  if (s === "Visa Allotted") return "Visa Issued";
  if (s === "Submitted" || s === "Under Review") return "Screening";
  return s;
};

const resolveLogUserType = (actorUser) => {
  const roleUpper = String(actorUser?.role || "").toUpperCase();
  if (actorUser?.isSuperAdmin || roleUpper === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (roleUpper === "ADMIN") return "ADMIN";
  if (roleUpper === "HR" || roleUpper === "VENDOR_HR" || roleUpper === "EMPLOYEE_HR") return "HR";
  return "SYSTEM";
};

const getFreshVendorAccess = async (actorUser) => {
  const userId = actorUser?._id?.toString() || actorUser?.id || "";
  let list = Array.isArray(actorUser?.assignedVendors)
    ? actorUser.assignedVendors.map(String)
    : [];
  if (userId) {
    try {
      const freshUser = await User.findById(userId).select("assignedVendors").lean();
      if (freshUser && Array.isArray(freshUser.assignedVendors)) {
        list = freshUser.assignedVendors.map(String);
      }
    } catch { }
  }
  const hexIds = list.filter(isValidObjectId);
  const vendorDocs =
    list.length > 0
      ? await Vendor.find({
        $or: [
          { vendorId: { $in: list } },
          { id: { $in: list } },
          ...(hexIds.length > 0 ? [{ _id: { $in: hexIds } }] : []),
        ],
      })
        .select("vendorId _id companyName")
        .lean()
      : [];
  const expanded = Array.from(
    new Set(
      [...list, ...vendorDocs.flatMap((v) => [v.vendorId, v._id?.toString()].filter(Boolean))].map(
        String
      )
    )
  );
  return { userId, primaryIds: list, expandedIds: expanded, vendorDocs };
};

const ensureVendorHRAccessToApp = async (actorUser, application) => {
  if (actorUser?.hrType !== "VENDOR_HR") return;
  const { userId, expandedIds } = await getFreshVendorAccess(actorUser);
  if (application.vendorId && expandedIds.includes(String(application.vendorId))) {
    return;
  }
  if (userId && String(application.vendorHrId || "") === userId) {
    return;
  }
  const appProjectId = String(application.projectId || "");
  if (appProjectId) {
    const [assignments, allProjects] = await Promise.all([
      ProjectAssignment.find({
        status: "Active",
        $or: [
          ...(expandedIds.length > 0 ? [{ vendorId: { $in: expandedIds } }] : []),
          ...(userId ? [{ userId }, { vendorHRUserId: userId }] : []),
        ],
      }).lean(),
      fetchAllMergedProjects(),
    ]);
    const assignedProjIds = new Set();
    (assignments || []).forEach((a) => {
      if (a.projectId) assignedProjIds.add(String(a.projectId));
      if (a.projectRef) assignedProjIds.add(String(a.projectRef));
    });
    const expandedSet = new Set(expandedIds.map(String));
    (allProjects || []).forEach((p) => {
      const hasV = (p.assignedVendors || []).some((v) =>
        expandedSet.has(String(v.vendorId || v.id || v._id || v))
      );
      const hasH = (p.assignedVendorHRs || []).some(
        (h) => userId && String(h.userId || h._id || "") === userId
      );
      if (hasV || hasH) {
        (p.rawIdCandidates || [p.projectId]).filter(Boolean).forEach((cid) => assignedProjIds.add(String(cid)));
      }
    });
    if (assignedProjIds.has(appProjectId)) return;
  }
  throw new ApiError(403, "You can only update candidates belonging to your assigned vendor or project.");
};

const findOrMirrorApplication = async (applicationId) => {
  const idStr = String(applicationId || "").trim();
  const query = [
    { applicationId: idStr },
    { id: idStr },
    ...(isValidObjectId(idStr) ? [{ _id: idStr }] : []),
  ];
  let application = await CandidateApplication.findOne({ $or: query });
  if (application) return application;

  const crmDoc = await CrmCandidateApplication.findOne({ $or: query }).lean();
  if (!crmDoc) return null;

  let candObjectId = undefined;
  let fallbackEmail = crmDoc.candidateData?.email || "";
  let fallbackPhone = crmDoc.candidateData?.phone || "";

  if (crmDoc.candidateId) {
    const [cand, crmCand] = await Promise.all([
      Candidate.findOne({ candidateId: String(crmDoc.candidateId) }).select("_id email phone").lean(),
      CrmCandidate.findOne({
        $or: [{ candidateId: String(crmDoc.candidateId) }, { id: String(crmDoc.candidateId) }],
      }).lean(),
    ]);
    if (cand) {
      candObjectId = cand._id;
      fallbackEmail = fallbackEmail || cand.email || "";
      fallbackPhone = fallbackPhone || cand.phone || "";
    }
    if (crmCand) {
      fallbackEmail = fallbackEmail || crmCand.email || "";
      fallbackPhone = fallbackPhone || crmCand.phone || "";
    }
  }

  const normStage = normalizeStageAlias(crmDoc.status || "Applied") || "Applied";
  const resolvedAppId = crmDoc.applicationId || idStr || crmDoc._id.toString();

  application = await CandidateApplication.findOneAndUpdate(
    { applicationId: resolvedAppId },
    {
      $setOnInsert: {
        applicationId: resolvedAppId,
        candidateId: String(crmDoc.candidateId || resolvedAppId),
        candidateObjectId: candObjectId,
        candidateName: crmDoc.candidateName || "Candidate",
        candidateEmail: sanitizeCandidateEmail(fallbackEmail),
        candidatePhone: fallbackPhone || "",
        projectId: String(crmDoc.projectId || ""),
        projectName: crmDoc.projectName || "Overseas Project",
        clientId: String(crmDoc.clientId || ""),
        clientName: crmDoc.clientName || "",
        position: crmDoc.position || "",
        jobTitle: crmDoc.position || "",
        vendorId: String(crmDoc.vendorId || ""),
        vendorName: crmDoc.vendorName || "",
        recruitmentStage: normStage,
        status: normStage,
        processMilestones: Array.isArray(crmDoc.processMilestones) ? crmDoc.processMilestones : [],
        paymentPlan: crmDoc.paymentPlan || { totalAmount: 0, currency: "INR", milestones: [] },
        rejectionReason: crmDoc.rejectionReason || "",
        didNotJoinReason: crmDoc.didNotJoinReason || "",
        refundStatus: crmDoc.refundStatus || "",
        refundDetails: crmDoc.refundDetails ?? null,
        adminRemarks: crmDoc.adminRemark || "",
      },
    },
    { upsert: true, new: true }
  );
  return application;
};

const syncCrmApplicationMirror = async (application, extra = {}) => {
  try {
    const idCandidates = [application.applicationId].filter(Boolean);
    if (application.applicationId && isValidObjectId(application.applicationId)) {
      idCandidates.push({ _id: application.applicationId });
    }
    const existing = await CrmCandidateApplication.findOne({
      $or: [
        { applicationId: application.applicationId },
        { id: application.applicationId },
        ...(application.candidateId && application.projectId
          ? [{ candidateId: application.candidateId, projectId: application.projectId }]
          : []),
      ],
    });

    const patch = {
      status: application.recruitmentStage || application.status,
      recruitmentStage: application.recruitmentStage || application.status,
      projectId: application.projectId,
      projectName: application.projectName,
      clientId: application.clientId || "",
      position: application.position || application.jobTitle || "",
      jobId: application.jobId || "",
      jobTitle: application.jobTitle || application.position || "",
      rejectionReason: application.rejectionReason || "",
      didNotJoinReason: application.didNotJoinReason || "",
      refundStatus: application.refundStatus || "",
      refundDetails: application.refundDetails ?? null,
      adminRemark: application.adminRemarks || "",
      processMilestones: Array.isArray(application.processMilestones)
        ? application.processMilestones
        : [],
      paymentPlan: application.paymentPlan || { totalAmount: 0, currency: "INR", milestones: [] },
      ...(extra.milestonesOverridden !== undefined
        ? { milestonesOverridden: Boolean(extra.milestonesOverridden) }
        : {}),
      ...(application.interview?.scheduledDate
        ? {
          interviewDetails: {
            dateTime: application.interview.scheduledDate
              ? `${application.interview.scheduledDate}${application.interview.scheduledTime
                ? `T${application.interview.scheduledTime}`
                : ""
              }`
              : "",
            scheduledDate: application.interview.scheduledDate || "",
            scheduledTime: application.interview.scheduledTime || "",
            mode: application.interview.mode || "Google Meet",
            meetingLink: application.interview.locationOrLink || "",
            interviewer: application.interview.interviewerName || "",
            notes: application.interview.remarks || "",
          },
        }
        : {}),
    };

    if (existing) {
      Object.assign(existing, patch);
      await existing.save();
    } else if (application.vendorId && application.projectId) {
      await CrmCandidateApplication.create({
        applicationId: application.applicationId,
        candidateId: application.candidateId,
        candidateName: application.candidateName,
        vendorId: application.vendorId,
        vendorName: application.vendorName || "",
        projectId: application.projectId,
        projectName: application.projectName,
        clientId: application.clientId || "",
        clientName: application.clientName || "",
        position: application.position || application.jobTitle || "",
        ...patch,
      });
    }
  } catch (err) {
    console.warn("syncCrmApplicationMirror warning:", err.message);
  }
};

export class RecruitmentService {
  static async submitCandidate({
    fullName,
    email = "",
    phone = "",
    passportNumber = "",
    projectId,
    jobId,
    jobTitle,
    vendorId,
    vendorName,
    resumeUrl = "",
    resumeFileName = "",
    documents = [],
    experience = "",
    experienceYears = "",
    skills = [],
    location = "",
    notes = "",
    actorUser,
  }) {
    if (!fullName || !projectId) {
      throw new ApiError(400, "Candidate name and project ID are required.");
    }

    const sanitizedEmail = sanitizeCandidateEmail(email);
    const cleanEmail = sanitizedEmail ? sanitizedEmail.toLowerCase() : "";
    const cleanPhone = String(phone || "").trim();
    const cleanPassport = String(passportNumber || "").trim().toUpperCase();
    const parsedExp = Number(experienceYears || experience || 0) || 0;
    const skillsArr = Array.isArray(skills)
      ? skills.map((s) => String(s).trim()).filter(Boolean)
      : String(skills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const savedResumeUrl = resumeUrl
      ? String(resumeUrl).startsWith("data:")
        ? saveBase64File(resumeUrl, "documents", resumeFileName || "resume.pdf")
        : String(resumeUrl).trim()
      : "";

    const normalizedDocs = Array.isArray(documents)
      ? documents
        .filter((d) => d && (d.fileUrl || d.url || d.fileName || d.name))
        .map((d, idx) => {
          const rawUrl = String(d.fileUrl || d.url || "").trim();
          const fName = String(d.fileName || d.name || `document-${idx + 1}`).trim();
          const savedUrl = rawUrl.startsWith("data:")
            ? saveBase64File(rawUrl, "documents", fName)
            : rawUrl;
          return {
            id: d.id || `doc-${Date.now()}-${idx}`,
            docType: d.docType || d.type || "Resume / CV",
            type: d.type || d.docType || "Resume / CV",
            name: d.name || fName,
            fileName: fName,
            fileUrl: savedUrl,
            status: "Verified",
            uploadedAt: d.uploadedAt || new Date(),
          };
        })
        .filter((d) => Boolean(d.fileUrl))
      : [];

    if (savedResumeUrl && !normalizedDocs.some((d) => d.fileUrl === savedResumeUrl)) {
      normalizedDocs.unshift({
        id: `doc-cv-${Date.now()}`,
        docType: "Resume / CV",
        type: "Resume / CV",
        name: resumeFileName || "Resume / CV",
        fileName: resumeFileName || "resume.pdf",
        fileUrl: savedResumeUrl,
        status: "Verified",
        uploadedAt: new Date(),
      });
    }

    const resolvedProject = await findProjectAcrossSources(projectId);
    if (!resolvedProject) throw new ApiError(404, "Project not found.");

    let job = null;
    if (jobId) {
      const jStr = String(jobId).trim();
      job = await Job.findOne({
        $or: [{ jobId: jStr }, ...(isValidObjectId(jStr) ? [{ _id: jStr }] : [])],
      });
    }

    const isVendorHR = actorUser?.hrType === "VENDOR_HR";
    const isEmployeeHR = actorUser?.hrType === "EMPLOYEE_HR";

    let freshVendors = { primaryIds: [], expandedIds: [], vendorDocs: [] };
    if (isVendorHR) {
      freshVendors = await getFreshVendorAccess(actorUser);
      if (vendorId && !freshVendors.expandedIds.includes(String(vendorId))) {
        throw new ApiError(403, "You can only submit candidates for your assigned vendor.");
      }
    }

    const effectiveVendorId =
      vendorId || (isVendorHR ? freshVendors.primaryIds[0] || "" : "");
    let resolvedVendorDoc = freshVendors.vendorDocs.find(
      (v) => v.vendorId === effectiveVendorId || v._id?.toString() === effectiveVendorId
    );
    if (!resolvedVendorDoc && effectiveVendorId) {
      resolvedVendorDoc = await Vendor.findOne({
        $or: [
          { vendorId: effectiveVendorId },
          ...(isValidObjectId(effectiveVendorId) ? [{ _id: effectiveVendorId }] : []),
        ],
      })
        .select("vendorId companyName")
        .lean();
    }
    const finalVendorId = resolvedVendorDoc?.vendorId || effectiveVendorId;
    const effectiveVendorName =
      vendorName || resolvedVendorDoc?.companyName || (isVendorHR ? actorUser?.name : "");
    const resolvedTradeTitle = job ? job.title : jobTitle || resolvedProject.projectName;

    let candidate = null;
    if (cleanEmail) {
      candidate = await Candidate.findOne({ email: cleanEmail });
    } else if (cleanPhone) {
      candidate = await Candidate.findOne({ phone: cleanPhone });
    }

    let crmCandidate = null;
    if (!candidate) {
      if (cleanEmail) {
        const candidateId = await generateNextCandidateId();
        candidate = await Candidate.create({
          candidateId,
          fullName: fullName.trim(),
          email: cleanEmail,
          phone: cleanPhone || "N/A",
          password: "TempPassword123!",
          accountStatus: "Approved",
          documentStatus: normalizedDocs.length > 0 ? "Verified" : "Not Submitted",
          jobApplicationAccess: "Unlocked",
          profile: {
            trade: resolvedTradeTitle,
            passportNumber: cleanPassport,
            experienceYears: parsedExp,
            skills: skillsArr,
            address: location || "",
            preferredJobRole: resolvedTradeTitle,
          },
          documents: normalizedDocs.map((d) => ({
            id: d.id,
            docType: d.docType,
            name: d.name,
            fileName: d.fileName,
            fileUrl: d.fileUrl,
            status: "Verified",
            uploadedAt: d.uploadedAt,
          })),
        });
      } else {
        if (cleanPhone) {
          crmCandidate = await CrmCandidate.findOne({
            phone: cleanPhone,
            ...(finalVendorId ? { vendorId: finalVendorId } : {}),
          });
        }
        if (crmCandidate) {
          const mergedDocs = [
            ...(Array.isArray(crmCandidate.documents) ? crmCandidate.documents : []),
            ...normalizedDocs.filter(
              (nd) =>
                !(crmCandidate.documents || []).some(
                  (ed) => ed.fileUrl && ed.fileUrl === nd.fileUrl
                )
            ),
          ];
          crmCandidate.fullName = fullName.trim() || crmCandidate.fullName;
          if (cleanPassport) crmCandidate.passportNumber = cleanPassport;
          if (parsedExp) crmCandidate.experienceYears = parsedExp;
          if (skillsArr.length > 0) crmCandidate.skills = skillsArr;
          if (location) crmCandidate.location = location;
          if (mergedDocs.length > 0) crmCandidate.documents = mergedDocs;
          await crmCandidate.save();
        } else {
          const candidateId = await generateNextCandidateId();
          crmCandidate = await CrmCandidate.create({
            candidateId,
            vendorId: finalVendorId || "DIRECT",
            vendorName: effectiveVendorName || "",
            fullName: fullName.trim(),
            email: "",
            phone: cleanPhone,
            passportNumber: cleanPassport,
            currentPosition: resolvedTradeTitle,
            experienceYears: parsedExp,
            skills: skillsArr,
            location: location || "",
            preferredCountry: resolvedProject.destinationCountry || "",
            verificationStatus: normalizedDocs.length > 0 ? "Verified" : "Pending",
            documents: normalizedDocs,
          });
        }
      }
    } else {
      const existingDocs = Array.isArray(candidate.documents) ? [...candidate.documents] : [];
      const existingUrls = new Set(existingDocs.map((d) => d.fileUrl).filter(Boolean));
      normalizedDocs.forEach((d) => {
        if (d.fileUrl && !existingUrls.has(d.fileUrl)) {
          existingDocs.push({
            id: d.id,
            docType: d.docType,
            name: d.name,
            fileName: d.fileName,
            fileUrl: d.fileUrl,
            status: "Verified",
            uploadedAt: d.uploadedAt,
          });
        }
      });
      candidate.documents = existingDocs;
      if (cleanPhone && (!candidate.phone || candidate.phone === "N/A")) {
        candidate.phone = cleanPhone;
      }
      candidate.profile = {
        ...(candidate.profile || {}),
        passportNumber: cleanPassport || candidate.profile?.passportNumber || "",
        experienceYears: parsedExp || candidate.profile?.experienceYears || 0,
        skills: skillsArr.length > 0 ? skillsArr : candidate.profile?.skills || [],
        address: location || candidate.profile?.address || "",
        trade: candidate.profile?.trade || resolvedTradeTitle,
      };
      if (existingDocs.length > 0) {
        candidate.documentStatus = "Verified";
      }
      await candidate.save();
    }

    const finalCandidateId = candidate?.candidateId || crmCandidate?.candidateId;
    const finalCandidateName = candidate?.fullName || crmCandidate?.fullName || fullName.trim();
    const finalCandidateEmail = cleanEmail || sanitizeCandidateEmail(candidate?.email || "");
    const finalCandidatePhone = cleanPhone || candidate?.phone || crmCandidate?.phone || "";
    const finalResumeUrl =
      savedResumeUrl ||
      normalizedDocs[0]?.fileUrl ||
      candidate?.documents?.[0]?.fileUrl ||
      crmCandidate?.documents?.[0]?.fileUrl ||
      "";

    const applicationId = await generateNextCandidateApplicationId();

    const application = await CandidateApplication.create({
      applicationId,
      candidateId: finalCandidateId,
      ...(candidate?._id ? { candidateObjectId: candidate._id } : {}),
      candidateName: finalCandidateName,
      candidateEmail: finalCandidateEmail,
      candidatePhone: finalCandidatePhone === "N/A" ? "" : finalCandidatePhone,
      passportNumber: cleanPassport || candidate?.profile?.passportNumber || crmCandidate?.passportNumber || "",
      experienceYears: parsedExp ? String(parsedExp) : String(experience || ""),
      skills: skillsArr,
      location: location || candidate?.profile?.address || "",
      notes: notes || "",
      resumeUrl: finalResumeUrl,
      documents: normalizedDocs,
      candidateData: {
        email: finalCandidateEmail,
        phone: finalCandidatePhone === "N/A" ? "" : finalCandidatePhone,
        passportNumber: cleanPassport || candidate?.profile?.passportNumber || "",
        experienceYears: parsedExp ? String(parsedExp) : String(experience || ""),
        skills: skillsArr,
        location: location || "",
        notes: notes || "",
        resumeUrl: finalResumeUrl,
        documents: normalizedDocs,
      },
      projectId: resolvedProject.projectId,
      projectName: resolvedProject.projectName,
      clientId: resolvedProject.clientId || "",
      clientName: resolvedProject.clientName || "",
      destinationCountry: resolvedProject.destinationCountry || "",
      jobId: job ? job.jobId : jobId || "",
      jobTitle: resolvedTradeTitle,
      vendorId: finalVendorId,
      vendorName: effectiveVendorName,
      vendorHrId: isVendorHR ? actorUser?._id?.toString() : "",
      vendorHrName: isVendorHR ? actorUser?.name : "",
      employeeHrId: isEmployeeHR ? actorUser?._id?.toString() : "",
      employeeHrName: isEmployeeHR ? actorUser?.name : "",
      recruitmentStage: "Applied",
      status: "Applied",
      position: resolvedTradeTitle || "Candidate",
      appliedAt: new Date(),
    });

    await syncCrmApplicationMirror(application);

    await ActivityLog.create({
      userType: resolveLogUserType(actorUser),
      userId: actorUser?._id?.toString() || actorUser?.id || "System",
      userName: actorUser?.name || "HR Manager",
      action: "CANDIDATE_SUBMITTED",
      title: `Submitted Candidate [${finalCandidateName}]`,
      description: `Submitted for job ${resolvedTradeTitle} under project ${resolvedProject.projectName}.`,
      entityType: "Candidate",
      entityId: finalCandidateId,
      entityName: finalCandidateName,
      candidateId: finalCandidateId,
      candidateName: finalCandidateName,
      vendorId: finalVendorId,
      vendorName: effectiveVendorName,
      status: "Applied",
      newStatus: "Applied",
      visibility: "ALL",
      remarks: notes || `Submitted by ${actorUser?.name}`,
    });

    return { candidate: candidate || crmCandidate, application };
  }

  static async updateCandidateStage({
    applicationId,
    newStage,
    newStatus,
    remarks = "",
    offerDetails,
    visaDetails,
    processMilestones,
    milestonesOverridden,
    newDocument,
    documents,
    actorUser,
  }) {
    if (!applicationId || (!newStage && !Array.isArray(processMilestones))) {
      throw new ApiError(400, "Application ID and new recruitment stage are required.");
    }

    const application = await findOrMirrorApplication(applicationId);

    if (!application) {
      throw new ApiError(404, "Candidate application not found.");
    }

    await ensureVendorHRAccessToApp(actorUser, application);

    const lockState = await checkApplicationRefundLock(application);
    if (lockState.locked) {
      throw new ApiError(
        409,
        `Action locked: candidate has an active refund claim (${lockState.refundStatus || "Pending Admin Approval"}). Wait for Admin decision before updating payment or stages.`
      );
    }

    const normalizedStage = normalizeStageAlias(
      newStage || application.recruitmentStage || application.status || "Selected"
    );
    const normalizedStatus = newStatus ? normalizeStageAlias(newStatus) : normalizedStage;

    const previousStage = application.recruitmentStage || application.status || "Applied";

    application.recruitmentStage = normalizedStage;
    application.status = normalizedStatus;
    if (normalizedStage === "Rejected" && remarks) {
      application.rejectionReason = remarks;
    } else if (remarks) {
      application.adminRemarks = remarks;
    }

    if (offerDetails) {
      application.offerDetails = { ...(application.offerDetails?.toObject?.() || application.offerDetails || {}), ...offerDetails };
    }
    if (visaDetails) {
      application.visaDetails = { ...(application.visaDetails?.toObject?.() || application.visaDetails || {}), ...visaDetails };
    }

    let finalOverridden = milestonesOverridden !== undefined
      ? Boolean(milestonesOverridden)
      : Boolean(application.get?.("milestonesOverridden") || application.milestonesOverridden);

    if (Array.isArray(processMilestones)) {
      const normalizedMs = normalizeMilestoneStages(processMilestones);
      const totalAmt = normalizedMs.reduce(
        (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
        0
      );
      application.processMilestones = normalizedMs;
      application.paymentPlan = {
        ...(application.paymentPlan?.toObject?.() || application.paymentPlan || { currency: "INR" }),
        totalAmount: totalAmt,
        milestones: normalizedMs,
      };
      if (milestonesOverridden !== undefined) {
        application.set("milestonesOverridden", Boolean(milestonesOverridden));
      }
      application.markModified("processMilestones");
      application.markModified("paymentPlan");
    } else if (
      ["Selected", "Processing", "Offer Released", "Offer Accepted", "Visa Processing", "Visa Issued", "Completed"].includes(
        normalizedStage
      ) &&
      !finalOverridden
    ) {
      const resolvedProject = application.projectId
        ? await findProjectAcrossSources(application.projectId)
        : null;
      if (resolvedProject) {
        const resolvedMs = resolveProjectMilestonesData(
          resolvedProject,
          application.processMilestones || [],
          false
        );
        if (resolvedMs.processMilestones.length > 0 || resolvedMs.totalAmount > 0) {
          application.processMilestones = resolvedMs.processMilestones;
          application.paymentPlan = {
            ...(application.paymentPlan?.toObject?.() || application.paymentPlan || { currency: "INR" }),
            totalAmount: resolvedMs.totalAmount,
            milestones: resolvedMs.processMilestones,
          };
          application.markModified("processMilestones");
          application.markModified("paymentPlan");
        }
      }
    }

    if (newDocument && (newDocument.fileUrl || newDocument.name || newDocument.fileName)) {
      application.documents = application.documents || [];
      const docEntry = {
        id: newDocument.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        docType: newDocument.docType || "Compliance Document",
        name: newDocument.name || newDocument.fileName || "Candidate Document",
        fileName: newDocument.fileName || newDocument.name || "document.pdf",
        fileUrl: newDocument.fileUrl || "",
        fileSize: newDocument.fileSize || 0,
        status: "Verified",
        uploadedAt: new Date(),
        uploadedBy: actorUser?.name || "HR Staff",
        uploadedByRole: actorUser?.role || "HR",
        visibleToVendor: true,
      };
      application.documents.push(docEntry);

      try {
        const candidateDoc = await Candidate.findOne({
          $or: [
            ...(application.candidateObjectId ? [{ _id: application.candidateObjectId }] : []),
            ...(application.candidateId ? [{ candidateId: application.candidateId }] : []),
          ],
        });
        if (candidateDoc) {
          candidateDoc.documents = candidateDoc.documents || [];
          candidateDoc.documents.push({
            id: docEntry.id,
            docType: docEntry.docType,
            name: docEntry.name,
            fileName: docEntry.fileName,
            fileUrl: docEntry.fileUrl,
            fileSize: docEntry.fileSize,
            status: "Verified",
            uploadedAt: new Date(),
            verifiedAt: new Date(),
            verifiedBy: actorUser?.name || "HR Staff",
          });
          await candidateDoc.save();
        }
      } catch (candErr) {
        console.warn("Could not sync uploaded document to Candidate record:", candErr.message);
      }
    } else if (Array.isArray(documents) && documents.length > 0) {
      application.documents = documents;
    }

    application.statusHistory = application.statusHistory || [];
    application.statusHistory.push({
      status: `${normalizedStage} (${application.status})`,
      updatedBy: actorUser?.name || "HR Staff",
      note: remarks || `Recruitment stage updated to ${normalizedStage}`,
      date: new Date(),
    });

    await application.save();
    await syncCrmApplicationMirror(application, { milestonesOverridden: finalOverridden });

    try {
      if (application.vendorId) {
        await CrmNotification.create({
          notificationId: `notif-hr-${Date.now()}`,
          recipientRole: "VENDOR",
          vendorId: String(application.vendorId),
          actorId: actorUser?._id?.toString() || actorUser?.id || null,
          actorRole: actorUser?.hrType || actorUser?.role || "HR",
          title:
            normalizedStage === "Selected"
              ? "Candidate Selected"
              : normalizedStage === "Rejected"
                ? "Candidate Application Rejected"
                : normalizedStage === "On Hold"
                  ? "Candidate Placed On Hold"
                  : `Candidate Stage Updated: ${normalizedStage}`,
          message: `${application.candidateName} (${application.projectName}) stage updated to "${normalizedStage}" by ${actorUser?.name || "HR Team"}.`,
          type: normalizedStage === "Selected" ? "success" : normalizedStage === "Rejected" ? "warning" : "info",
          link:
            normalizedStage === "Selected"
              ? "/vendor/selected"
              : normalizedStage === "Rejected"
                ? "/vendor/rejected"
                : "/vendor/candidates",
        });
      }
    } catch { }

    await ActivityLog.create({
      userType: resolveLogUserType(actorUser),
      userId: actorUser?._id?.toString() || actorUser?.id || "System",
      userName: actorUser?.name || "HR Staff",
      action: "RECRUITMENT_STAGE_UPDATED",
      title: `Stage Updated: [${application.candidateName}] -> ${normalizedStage}`,
      description: `Candidate application ${application.applicationId} transitioned from [${previousStage}] to [${normalizedStage}].`,
      entityType: "Candidate",
      entityId: application.candidateId,
      entityName: application.candidateName,
      candidateId: application.candidateId,
      candidateName: application.candidateName,
      vendorId: application.vendorId,
      vendorName: application.vendorName,
      previousStatus: previousStage,
      newStatus: normalizedStage,
      status: application.status,
      visibility: "ALL",
      remarks: remarks || `Updated by ${actorUser?.name} (${actorUser?.role || "HR"})`,
    });

    return application;
  }

  static async scheduleInterview({
    applicationId,
    round = "L1 Interview",
    scheduledDate,
    startTime,
    endTime = "",
    interviewMode = "Google Meet",
    interviewLink = "",
    interviewerName = "",
    interviewerEmail = "",
    actorUser,
  }) {
    if (!applicationId || !scheduledDate || !startTime) {
      throw new ApiError(400, "Application ID, date, and start time are required.");
    }

    const application = await findOrMirrorApplication(applicationId);

    if (!application) throw new ApiError(404, "Candidate application not found.");

    await ensureVendorHRAccessToApp(actorUser, application);

    const lockState = await checkApplicationRefundLock(application);
    if (lockState.locked) {
      throw new ApiError(
        409,
        `Action locked: candidate has an active refund claim (${lockState.refundStatus || "Pending Admin Approval"}).`
      );
    }

    const interviewId = `INT-${Date.now().toString().slice(-6)}`;

    const interview = await Interview.create({
      interviewId,
      candidateId: application.candidateId,
      candidateRef: application.candidateObjectId,
      candidateName: application.candidateName,
      candidateEmail: application.candidateEmail,
      applicationId: application.applicationId,
      applicationRef: application._id,
      projectId: application.projectId,
      projectName: application.projectName,
      jobId: application.jobId || "",
      jobTitle: application.jobTitle || application.position,
      vendorId: application.vendorId,
      vendorName: application.vendorName,
      round,
      scheduledDate,
      startTime,
      endTime,
      interviewMode,
      interviewLink,
      interviewerName: interviewerName || actorUser?.name || "Interviewer",
      interviewerEmail,
      status: "Scheduled",
      scheduledBy: actorUser?._id?.toString() || actorUser?.id || "System",
      scheduledByName: actorUser?.name || "HR Staff",
      scheduledByRole: actorUser?.role || "HR",
    });

    application.recruitmentStage = "Interview Scheduled";
    application.status = "Interview Scheduled";
    application.interview = {
      scheduledDate,
      scheduledTime: startTime,
      mode: interviewMode,
      locationOrLink: interviewLink,
      interviewerName: interviewerName || actorUser?.name || "Interviewer",
      remarks: `Round: ${round}`,
      updatedAt: new Date(),
    };
    await application.save();
    await syncCrmApplicationMirror(application);

    try {
      if (application.vendorId) {
        await CrmNotification.create({
          notificationId: `notif-int-${Date.now()}`,
          recipientRole: "VENDOR",
          vendorId: String(application.vendorId),
          actorId: actorUser?._id?.toString() || actorUser?.id || null,
          actorRole: actorUser?.hrType || actorUser?.role || "HR",
          title: "Candidate Interview Scheduled",
          message: `${round} scheduled for ${application.candidateName} on ${scheduledDate} at ${startTime} (${interviewMode}).`,
          type: "info",
          link: "/vendor/candidates",
        });
      }
    } catch { }

    await ActivityLog.create({
      userType: resolveLogUserType(actorUser),
      userId: actorUser?._id?.toString() || actorUser?.id || "System",
      userName: actorUser?.name || "HR Staff",
      action: "INTERVIEW_SCHEDULED",
      title: `Scheduled ${round} for [${application.candidateName}]`,
      description: `Interview on ${scheduledDate} at ${startTime} via ${interviewMode}.`,
      entityType: "Candidate",
      entityId: application.candidateId,
      entityName: application.candidateName,
      candidateId: application.candidateId,
      candidateName: application.candidateName,
      vendorId: application.vendorId,
      vendorName: application.vendorName,
      status: "Interview Scheduled",
      visibility: "ALL",
      remarks: `Link: ${interviewLink || "N/A"}`,
    });

    return interview;
  }

  static async recordInterviewFeedback({
    interviewId,
    rating,
    feedback,
    recommendation,
    actorUser,
  }) {
    const interview = await Interview.findOne({
      $or: [
        { interviewId },
        { _id: interviewId.match(/^[0-9a-fA-F]{24}$/) ? interviewId : null },
      ],
    });

    if (!interview) throw new ApiError(404, "Interview record not found.");

    interview.rating = rating || interview.rating;
    interview.feedback = feedback || interview.feedback;
    interview.recommendation = recommendation || interview.recommendation;
    interview.status = "Completed";
    await interview.save();

    const application = await findOrMirrorApplication(interview.applicationId);
    if (application) {
      if (recommendation === "Selected") {
        application.recruitmentStage = "Selected";
        application.status = "Selected";
        if (!(application.get?.("milestonesOverridden") || application.milestonesOverridden)) {
          const resolvedProject = application.projectId
            ? await findProjectAcrossSources(application.projectId)
            : null;
          if (resolvedProject) {
            const resolvedMs = resolveProjectMilestonesData(
              resolvedProject,
              application.processMilestones || [],
              false
            );
            if (resolvedMs.processMilestones.length > 0 || resolvedMs.totalAmount > 0) {
              application.processMilestones = resolvedMs.processMilestones;
              application.paymentPlan = {
                ...(application.paymentPlan?.toObject?.() || application.paymentPlan || { currency: "INR" }),
                totalAmount: resolvedMs.totalAmount,
                milestones: resolvedMs.processMilestones,
              };
              application.markModified("processMilestones");
              application.markModified("paymentPlan");
            }
          }
        }
      } else if (recommendation === "Rejected") {
        application.recruitmentStage = "Rejected";
        application.status = "Rejected";
        application.rejectionReason = feedback || "Did not clear technical evaluation";
      } else if (recommendation === "Hold" || recommendation === "On Hold") {
        application.recruitmentStage = "On Hold";
        application.status = "On Hold";
      } else {
        application.recruitmentStage = "Interview Completed";
        application.status = "In Progress";
      }
      await application.save();
      await syncCrmApplicationMirror(application);
    }

    await ActivityLog.create({
      userType: resolveLogUserType(actorUser),
      userId: actorUser?._id?.toString() || actorUser?.id || "System",
      userName: actorUser?.name || "Interviewer",
      action: "INTERVIEW_FEEDBACK_UPDATED",
      title: `Interview Feedback: [${interview.candidateName}] -> ${recommendation}`,
      description: `Feedback recorded for round ${interview.round}. Rating: ${rating}/5.`,
      entityType: "Candidate",
      entityId: interview.candidateId,
      entityName: interview.candidateName,
      candidateId: interview.candidateId,
      candidateName: interview.candidateName,
      vendorId: interview.vendorId,
      vendorName: interview.vendorName,
      status: recommendation,
      visibility: "ALL",
      remarks: feedback,
    });

    return interview;
  }

  static async reassignCandidateApplication({
    applicationId,
    projectId,
    projectName,
    jobId,
    jobTitle,
    notes = "",
    actorUser,
  }) {
    if (!applicationId || !projectId) {
      throw new ApiError(400, "Application ID and target Project ID are required.");
    }

    const application = await findOrMirrorApplication(applicationId);

    if (!application) {
      throw new ApiError(404, "Candidate application not found.");
    }

    await ensureVendorHRAccessToApp(actorUser, application);

    const lockState = await checkApplicationRefundLock(application);
    if (
      lockState.refundStatus === "Pending Admin Approval" ||
      String(application.refundStatus || "").trim() === "Pending Admin Approval"
    ) {
      throw new ApiError(
        409,
        "Cannot reassign candidate while the refund request is awaiting Admin approval."
      );
    }

    const resolvedProject = await findProjectAcrossSources(projectId);
    const targetProjectName =
      projectName || resolvedProject?.projectName || resolvedProject?.title || "Overseas Project";

    let job = null;
    if (jobId) {
      const jStr = String(jobId).trim();
      job = await Job.findOne({
        $or: [{ jobId: jStr }, ...(isValidObjectId(jStr) ? [{ _id: jStr }] : [])],
      });
    }
    const targetJobTitle = jobTitle || job?.title || application.jobTitle || targetProjectName;

    const prevProjId = application.projectId;
    const prevProj = application.projectName;
    application.projectId = resolvedProject?.projectId || projectId;
    application.projectName = targetProjectName;
    application.clientId = resolvedProject?.clientId || application.clientId || "";
    application.jobId = job?.jobId || jobId || "";
    application.jobTitle = targetJobTitle;
    application.position = targetJobTitle;
    application.recruitmentStage = "Applied";
    application.status = "Applied";
    application.rejectionReason = "";
    application.didNotJoinReason = "";
    application.refundStatus = "";
    application.refundDetails = null;
    application.interview = null;
    application.processMilestones = [];
    application.paymentPlan = { totalAmount: 0, currency: "INR", milestones: [] };
    application.set("milestonesOverridden", false);
    application.offerDetails = { offerStatus: "Pending", salary: "" };
    application.visaDetails = { visaStatus: "Not Started", visaNumber: "" };

    application.statusHistory = application.statusHistory || [];
    application.statusHistory.push({
      status: "Reassigned to New Project",
      updatedBy: actorUser?.name || "HR Staff",
      note: notes || `Reassigned from [${prevProj}] to [${targetProjectName}] - ${targetJobTitle}`,
      date: new Date(),
    });

    await application.save();
    await syncCrmApplicationMirror(application, { milestonesOverridden: false });
    await markApplicationRefundsReassigned({
      applicationId: application.applicationId,
      candidateId: application.candidateId,
      oldProjectId: prevProjId,
      oldProjectName: prevProj,
      targetProjectId: application.projectId,
      targetProjectName: application.projectName,
      targetPosition: application.position,
    });

    await ActivityLog.create({
      userType: resolveLogUserType(actorUser),
      userId: actorUser?._id?.toString() || actorUser?.id || "System",
      userName: actorUser?.name || "HR Staff",
      action: "CANDIDATE_REASSIGNED_PROJECT",
      title: `Candidate Reassigned: [${application.candidateName}] -> ${targetProjectName}`,
      description: `Candidate reallocated from [${prevProj}] to [${targetProjectName}] for trade [${targetJobTitle}].`,
      entityType: "Candidate",
      entityId: application.candidateId,
      entityName: application.candidateName,
      candidateId: application.candidateId,
      candidateName: application.candidateName,
      vendorId: application.vendorId,
      vendorName: application.vendorName,
      status: "Applied",
      newStatus: "Applied",
      visibility: "ALL",
      remarks: notes || `Reassigned by ${actorUser?.name} (${actorUser?.role || "HR"})`,
    });

    return application;
  }
}

export default RecruitmentService;
