import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import Candidate from "../models/Candidate.js";
import CandidateApplication from "../models/CandidateApplication.js";
import Project from "../models/Project.js";
import CrmOverseasClient from "../models/CrmOverseasClient.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";
import CrmNotification from "../models/CrmNotification.js";
import { sendCandidatePaymentReceiptEmail } from "../services/email.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateNextCandidateId, generateNextCandidateApplicationId } from "../utils/idGenerator.js";
import { saveBase64File } from "../utils/fileStorage.js";

const calculateProfileCompletion = (candidate) => {
  let score = 20;
  const p = candidate.profile || {};

  if (p.dob && p.gender) score += 10;
  if (p.address && p.city && p.state) score += 10;
  if (p.trade || p.preferredJobRole) score += 15;
  if (p.skills && p.skills.length > 0) score += 10;
  if (p.education && p.education.length > 0) score += 10;
  if (p.experienceYears !== undefined && p.experienceYears > 0) score += 10;
  if (p.passportNumber) score += 10;
  if (candidate.documents && candidate.documents.length > 0) score += 15;

  return Math.min(100, score);
};

export const registerCandidate = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    phone,
    password,
    confirmPassword,
    termsAccepted,
    dob,
    gender,
    trade,
    experienceYears,
    passportNumber,
    city,
    state,
    address,
    skills,
    preferredJobRole,
  } = req.body;

  if (!fullName || !String(fullName).trim()) {
    return res.status(400).json({ success: false, message: "Full Name is required." });
  }

  if (!email || !String(email).trim()) {
    return res.status(400).json({ success: false, message: "Email address is required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizedEmail = String(email).trim().toLowerCase();
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address." });
  }

  if (!phone || !String(phone).trim()) {
    return res.status(400).json({ success: false, message: "Mobile number is required." });
  }

  if (!password || String(password).length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match." });
  }

  const existingEmail = await Candidate.findOne({ email: normalizedEmail });
  if (existingEmail) {
    return res.status(409).json({
      success: false,
      message: "An account with this email address already exists. Please log in or use a different email.",
    });
  }

  const candidateId = await generateNextCandidateId(dob, new Date());
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const initialProfile = {
    dob: dob || "",
    gender: gender || "",
    trade: trade || "",
    experienceYears: Number(experienceYears) || 0,
    passportNumber: passportNumber ? String(passportNumber).trim().toUpperCase() : "",
    city: city || "",
    state: state || "",
    address: address || "",
    preferredJobRole: preferredJobRole || trade || "",
    skills: Array.isArray(skills)
      ? skills
      : skills
      ? String(skills)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    profileCompletionPercent: 30,
  };

  const candidate = await Candidate.create({
    candidateId,
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    phone: String(phone).trim(),
    password: hashedPassword,
    termsAccepted: termsAccepted !== false,
    accountStatus: "Pending Approval",
    documentStatus: "Not Submitted",
    jobApplicationAccess: "Locked",
    profile: initialProfile,
  });

  // Calculate actual completion score based on provided details
  candidate.profile.profileCompletionPercent = calculateProfileCompletion(candidate);
  await candidate.save();

  try {
    await ActivityLog.create({
      action: "REGISTER",
      module: "CANDIDATE",
      targetId: candidate.candidateId,
      description: `New candidate registration submitted: ${candidate.fullName} (${candidate.candidateId})`,
      performedBy: candidate.fullName,
      performedByRole: "candidate",
    });
  } catch {}

  return res.status(201).json({
    success: true,
    message:
      "Your registration has been submitted successfully. Your account is awaiting administrative approval. You will receive an email notification once your registration has been reviewed.",
    candidateId: candidate.candidateId,
    candidate: {
      candidateId: candidate.candidateId,
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      accountStatus: candidate.accountStatus,
      documentStatus: candidate.documentStatus,
      jobApplicationAccess: candidate.jobApplicationAccess,
    },
  });
});

export const loginCandidate = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const candidate = await Candidate.findOne({ email: normalizedEmail });

  if (!candidate) {
    return res.status(401).json({ success: false, message: "Invalid email address or password." });
  }

  const isMatch = await bcrypt.compare(password, candidate.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Invalid email address or password." });
  }

  if (candidate.accountStatus === "Pending Approval") {
    return res.status(403).json({
      success: false,
      accountStatus: "Pending Approval",
      message:
        "Your account is awaiting administrative approval. You will receive an email notification once your registration has been reviewed.",
    });
  }

  if (candidate.accountStatus === "Rejected") {
    return res.status(403).json({
      success: false,
      accountStatus: "Rejected",
      message: `Your registration was not approved. Reason: ${candidate.rejectionReason || "Criteria not met"}.`,
    });
  }

  const tokenPayload = {
    id: candidate._id.toString(),
    candidateId: candidate.candidateId,
    email: candidate.email,
    name: candidate.fullName,
    role: "candidate",
  };

  const token = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn: "7d" });

  const candidateData = candidate.toJSON();

  return res.status(200).json({
    success: true,
    message: "Login successful.",
    token,
    role: "candidate",
    candidate: candidateData,
  });
});

export const findCandidateFromRequest = async (req) => {
  if (req.candidate) return req.candidate;
  const candidateId = req.user?.id || req.user?._id || req.user?.candidateId;
  const email = req.user?.email;

  const orList = [];
  if (candidateId) {
    if (typeof candidateId === "string" && /^[0-9a-fA-F]{24}$/.test(candidateId)) {
      orList.push({ _id: candidateId });
    }
    orList.push({ candidateId: String(candidateId) });
  }
  if (email) {
    orList.push({ email: String(email).trim().toLowerCase() });
  }

  if (orList.length === 0) return null;
  return await Candidate.findOne({ $or: orList });
};

export const getCandidateProfile = asyncHandler(async (req, res) => {
  const candidate = await findCandidateFromRequest(req);
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found." });
  }

  const candidateObj = candidate.toJSON();
  candidateObj.profile.profileCompletionPercent = calculateProfileCompletion(candidate);

  return res.status(200).json({
    success: true,
    candidate: candidateObj,
  });
});

export const updateCandidateProfile = asyncHandler(async (req, res) => {
  const candidate = await findCandidateFromRequest(req);
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found." });
  }

  const { fullName, phone } = req.body;

  if (fullName && String(fullName).trim()) {
    candidate.fullName = String(fullName).trim();
  }
  if (phone && String(phone).trim()) {
    candidate.phone = String(phone).trim();
  }

  // Support both nested req.body.profile and root fields, preserving all prior filled details
  const rawProfile = req.body.profile && typeof req.body.profile === "object"
    ? { ...req.body, ...req.body.profile }
    : { ...req.body };

  const profileUpdates = {};
  const allowedKeys = [
    "dob",
    "gender",
    "address",
    "city",
    "state",
    "pincode",
    "country",
    "countryPreference",
    "education",
    "skills",
    "trade",
    "experienceYears",
    "totalExperienceYears",
    "currentOccupation",
    "preferredJobRole",
    "languages",
    "passportNumber",
    "passportExpiry",
    "passportIssueCountry",
  ];

  allowedKeys.forEach((key) => {
    if (rawProfile[key] !== undefined && rawProfile[key] !== null && rawProfile[key] !== "") {
      profileUpdates[key] = rawProfile[key];
    }
  });

  candidate.profile = {
    ...(candidate.profile || {}),
    ...profileUpdates,
  };

  candidate.profile.profileCompletionPercent = calculateProfileCompletion(candidate);
  if (candidate.profile.profileCompletionPercent >= 80) {
    candidate.profile.profileCompleted = true;
  }
  const hasDocs = Array.isArray(candidate.documents) && candidate.documents.length > 0;
  if (
    candidate.profile.profileCompletionPercent >= 80 ||
    hasDocs ||
    candidate.documentStatus === "Verified"
  ) {
    candidate.jobApplicationAccess = "Unlocked";
  }

  await candidate.save();

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    candidate: candidate.toJSON(),
  });
});

export const uploadCandidateDocument = asyncHandler(async (req, res) => {
  const candidate = await findCandidateFromRequest(req);
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found." });
  }

  const docType = req.body.docType || req.body.category || "other_document";
  const fileData = req.body.fileData || req.body.file || req.body.document || "";
  const name = req.body.name || req.body.docName || docType.replace(/_/g, " ").toUpperCase();
  const fileName = req.body.fileName || `${docType}.pdf`;
  const fileSize = req.body.fileSize || 0;

  if (!docType || !fileData) {
    return res.status(400).json({ success: false, message: "Document type and file content are required." });
  }

  const savedUrl = saveBase64File(fileData, "documents", fileName);

  const existingIndex = (candidate.documents || []).findIndex(
    (d) => d.docType === docType || (d.id && d.id === req.body.documentId)
  );

  const docItem = {
    id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    docType,
    name: name || docType.replace(/_/g, " ").toUpperCase(),
    fileUrl: savedUrl,
    fileName: fileName,
    fileSize: fileSize || 0,
    status: "Pending Verification",
    rejectionReason: "",
    uploadedAt: new Date(),
    verifiedAt: null,
    verifiedBy: "",
  };

  if (existingIndex !== -1) {
    candidate.documents[existingIndex] = docItem;
  } else {
    candidate.documents.push(docItem);
  }

  candidate.documentStatus = "Pending Verification";
  candidate.profile.profileCompletionPercent = calculateProfileCompletion(candidate);
  if (candidate.profile.profileCompletionPercent >= 80 || candidate.profile.profileCompleted) {
    candidate.jobApplicationAccess = "Unlocked";
  }
  await candidate.save();

  try {
    await ActivityLog.create({
      action: "UPLOAD_DOCUMENT",
      module: "CANDIDATE",
      targetId: candidate.candidateId,
      description: `${candidate.fullName} uploaded document "${docItem.name}" for verification.`,
      performedBy: candidate.fullName,
      performedByRole: "candidate",
    });
  } catch {}

  return res.status(200).json({
    success: true,
    message: "Document uploaded successfully and submitted for administrative verification.",
    candidate: candidate.toJSON(),
    document: docItem,
    documents: candidate.documents,
    documentStatus: candidate.documentStatus,
    profileCompletionPercent: candidate.profile.profileCompletionPercent,
  });
});

export const getPublicAvailableProjects = asyncHandler(async (req, res) => {
  const clients = await CrmOverseasClient.find({}).lean();
  const directProjects = await Project.find({}).populate("clientId").lean().catch(() => []);

  const list = [];
  const seenIds = new Set();

  (clients || []).forEach((c) => {
    (c.projects || []).forEach((p) => {
      const status = (p.status || "Active").toLowerCase();
      if (status !== "inactive" && status !== "closed" && status !== "cancelled") {
        const pId = String(p.id || p.projectId || p._id?.toString() || "");
        if (pId && !seenIds.has(pId)) {
          seenIds.add(pId);
          list.push({
            id: pId,
            projectId: p.projectId || pId,
            projectName: p.projectName || p.name || p.title || "International Project",
            clientId: c.clientId || c._id.toString(),
            clientName: c.companyName || c.name || p.clientName || "International Employer",
            destinationCountry: p.country || c.country || "Overseas",
            position: p.requiredPosition || p.projectType || p.industryName || "General Worker / Skilled Trade",
            vacancies: p.vacancies || p.totalHeadcount || 10,
            experienceRequired: p.experienceRequired || "1-3 Years Experience",
            salary: p.salary || "$500 - $1,200 / Month",
            deadline: p.deadline || null,
            status: p.status || "Active",
            skills: p.skills || ["Reliability", "Trade Knowledge", "Communication"],
            eligibility: p.eligibility || "Valid Passport & Document Verification Required",
            manpowerRequirements: p.manpowerRequirements || [],
            paymentMilestones: p.paymentMilestones || p.processMilestones || p.milestones || [],
            totalMilestoneAmount: p.totalMilestoneAmount || p.totalAgreedAmount || 0,
          });
        }
      }
    });
  });

  (directProjects || []).forEach((dp) => {
    const pId = String(dp.projectId || dp.id || dp._id?.toString() || "");
    if (pId && !seenIds.has(pId)) {
      const status = (dp.status || "Pending").toLowerCase();
      if (status !== "inactive" && status !== "closed" && status !== "cancelled") {
        seenIds.add(pId);
        list.push({
          id: pId,
          projectId: dp.projectId || pId,
          projectName: dp.title || dp.projectName || "International Project",
          clientName: dp.clientId?.companyName || dp.clientId?.name || dp.clientName || "Direct Overseas Client",
          clientId: String(dp.clientId?.clientId || dp.clientId?._id?.toString() || "cli-admin"),
          destinationCountry: dp.country || dp.clientId?.country || "Overseas",
          position: dp.projectType || dp.industryName || dp.title || "Skilled Specialist",
          vacancies: dp.totalHeadcount || dp.manpower || 5,
          experienceRequired: "2+ Years Experience",
          salary: dp.budget ? `$${dp.budget} Monthly` : "$600 - $1,500 / Month",
          deadline: dp.deadline || null,
          status: dp.status || "Active",
          skills: ["Trade Certification", "Technical Competence"],
          eligibility: "Complete Profile & Verified Documents Required",
          manpowerRequirements: dp.manpowerRequirements || [],
        });
      }
    }
  });

  return res.status(200).json({ success: true, projects: list.reverse() });
});

export const applyForProject = asyncHandler(async (req, res) => {
  const candidate = await findCandidateFromRequest(req);
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found." });
  }

  if (candidate.accountStatus !== "Approved") {
    return res.status(403).json({
      success: false,
      message: "Your account is not approved. You cannot apply for projects at this time.",
    });
  }

  const hasDocuments = Array.isArray(candidate.documents) && candidate.documents.length > 0;
  const isProfileComplete = candidate.profile?.profileCompleted || (candidate.profile?.profileCompletionPercent || 0) >= 80;
  const isVerified = candidate.documentStatus === "Verified" || candidate.jobApplicationAccess === "Unlocked";

  if (!isVerified && (!isProfileComplete || !hasDocuments)) {
    return res.status(403).json({
      success: false,
      message:
        "Please complete your profile and upload your required documents before applying for projects.",
    });
  }

  candidate.jobApplicationAccess = "Unlocked";
  await candidate.save();

  const { projectId, projectName, clientName, destinationCountry, position, salary } = req.body;

  if (!projectId) {
    return res.status(400).json({ success: false, message: "Project ID is required." });
  }

  const existingApp = await CandidateApplication.findOne({
    candidateId: candidate.candidateId,
    projectId: String(projectId),
    status: { $ne: "Rejected" },
  });

  if (existingApp) {
    return res.status(409).json({
      success: false,
      message: "You have already applied for this project. Check 'My Applications' to track progress.",
    });
  }

  const applicationId = await generateNextCandidateApplicationId();

  const application = await CandidateApplication.create({
    applicationId,
    candidateId: candidate.candidateId,
    candidateObjectId: candidate._id,
    candidateName: candidate.fullName,
    candidateEmail: candidate.email,
    candidatePhone: candidate.phone,
    projectId: String(projectId),
    projectName: projectName || "International Deployment Project",
    clientName: clientName || "Immigo Global Partner",
    destinationCountry: destinationCountry || "Overseas",
    position: position || "Specialist",
    salary: salary || "Competitive Package",
    status: "Applied",
    statusHistory: [
      {
        status: "Applied",
        updatedBy: candidate.fullName,
        note: "Application submitted via Candidate Portal.",
        date: new Date(),
      },
    ],
  });

  try {
    await ActivityLog.create({
      action: "JOB_APPLICATION",
      module: "CANDIDATE",
      targetId: application.applicationId,
      description: `${candidate.fullName} (${candidate.candidateId}) applied for project "${application.projectName}"`,
      performedBy: candidate.fullName,
      performedByRole: "candidate",
    });
  } catch {}

  return res.status(201).json({
    success: true,
    message: "Application submitted successfully! Our recruitment team will review your application.",
    application,
  });
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const candidate = await findCandidateFromRequest(req);
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found." });
  }

  const applications = await CandidateApplication.find({ candidateId: candidate.candidateId })
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    applications,
  });
});

export const getCandidateApplicationMilestones = asyncHandler(async (req, res) => {
  const candidate = await findCandidateFromRequest(req);
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found." });
  }

  const { id } = req.params;
  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { applicationId: id }] } : { applicationId: id };

  const app = await CandidateApplication.findOne({
    ...query,
    candidateId: candidate.candidateId,
  });

  if (!app) {
    return res.status(404).json({ success: false, message: "Application not found for your profile." });
  }

  // Look up project milestones from CrmOverseasClient to ensure candidate sees the project's exact milestones
  try {
    const clients = await CrmOverseasClient.find({}).lean();
    let targetProject = null;
    for (const cl of clients) {
      const prj = (cl.projects || []).find(
        (p) =>
          String(p.id || p.projectId || p._id) === String(app.projectId) ||
          p.projectName === app.projectName
      );
      if (prj) {
        targetProject = prj;
        break;
      }
    }

    const pMilestones =
      targetProject?.paymentMilestones ||
      targetProject?.processMilestones ||
      targetProject?.milestones;

    if (Array.isArray(pMilestones) && pMilestones.length > 0) {
      const existingList = Array.isArray(app.processMilestones) ? app.processMilestones : [];
      const syncedMilestones = pMilestones.map((pm, mIdx) => {
        const pmId = String(pm.id || `m${mIdx}`);
        const existing = existingList.find(
          (em) => String(em.id) === pmId || em.name === pm.name
        );
        const amt = Number(pm.amount || pm.paymentAmount || 0);

        const stages = (Array.isArray(pm.stages) && pm.stages.length > 0
          ? pm.stages
          : [{ id: `s${mIdx}_1`, name: `${pm.name || `Milestone ${mIdx + 1}`} Verification` }]
        ).map((stg, sIdx) => {
          const stgId = String(stg.id || `s${mIdx}_${sIdx}`);
          const existingStg = existing?.stages?.find(
            (es) => String(es.id) === stgId || es.name === stg.name
          );
          return {
            id: stgId,
            name: stg.name || `Stage ${sIdx + 1}`,
            status:
              existingStg?.status ||
              (mIdx === 0 && sIdx === 0 && amt === 0 ? "In Progress" : "Locked"),
            completedAt: existingStg?.completedAt || null,
            remark: existingStg?.remark || "",
          };
        });

        return {
          id: pmId,
          name: pm.name || `Milestone ${mIdx + 1}`,
          amount: amt,
          paymentAmount: amt,
          paymentStatus:
            existing?.paymentStatus ||
            (mIdx === 0 && amt > 0 ? "Payment Required" : "Not Required"),
          status: existing?.status || (mIdx === 0 ? "Active" : "Locked"),
          paymentDate: existing?.paymentDate || null,
          paymentRef: existing?.paymentRef || null,
          paymentRemark: existing?.paymentRemark || "",
          approvedBy: existing?.approvedBy || null,
          clearanceDocuments: Array.isArray(existing?.clearanceDocuments) ? existing.clearanceDocuments : [],
          stages,
        };
      });

      const totalAmt = syncedMilestones.reduce(
        (acc, m) => acc + (Number(m.amount || m.paymentAmount) || 0),
        0
      );

      // Only save if empty or different
      if (!app.processMilestones || app.processMilestones.length === 0 || !app.milestonesSyncedWithProject) {
        app.processMilestones = syncedMilestones;
        app.paymentPlan = {
          totalAmount: totalAmt,
          currency: "INR",
          milestones: syncedMilestones,
        };
        app.milestonesSyncedWithProject = true;
        app.markModified("processMilestones");
        app.markModified("paymentPlan");
        await app.save();
      }
    }
  } catch (syncErr) {
    console.error("Error syncing project milestones to candidate application:", syncErr);
  }

  return res.status(200).json({
    success: true,
    application: app.toJSON(),
    processMilestones: app.processMilestones || [],
    paymentPlan: app.paymentPlan || { totalAmount: 40000, currency: "INR", milestones: [] },
    payments: app.payments || [],
  });
});

export const submitCandidateMilestonePayment = asyncHandler(async (req, res) => {
  const candidate = await findCandidateFromRequest(req);
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found." });
  }

  const { id } = req.params;
  const targetMilestoneId = req.params.milestoneId || req.body.milestoneId;
  const {
    amount,
    paymentMode = "Online UPI",
    referenceNumber = "",
    paymentReference = "",
    paymentNotes = "",
    remarks = "",
    isInstantMock = true,
  } = req.body;

  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { applicationId: id }] } : { applicationId: id };

  const app = await CandidateApplication.findOne({
    ...query,
    candidateId: candidate.candidateId,
  });

  if (!app) {
    return res.status(404).json({ success: false, message: "Application not found." });
  }

  const milestones = [...(app.processMilestones || [])];
  const mIdx = milestones.findIndex((m) => String(m.id) === String(targetMilestoneId));
  if (mIdx === -1) {
    return res.status(404).json({ success: false, message: "Milestone not found." });
  }

  const paidAmt = Number(amount) || Number(milestones[mIdx].paymentAmount) || 15000;
  const refNum =
    (referenceNumber || paymentReference || "").trim() ||
    `TXN-${Date.now().toString().slice(-8)}`;
  const receiptNum = `INV-${app.applicationId || app.id}-${targetMilestoneId}`;
  const payDate = new Date().toISOString().split("T")[0];
  const notesText = paymentNotes || remarks || `Paid via ${paymentMode}`;

  const isAutoApproved =
    isInstantMock ||
    paymentMode === "Online" ||
    paymentMode === "Razorpay Online" ||
    paymentMode === "Online UPI" ||
    paymentMode === "Card";

  if (isAutoApproved) {
    milestones[mIdx].paymentStatus = "Approved";
    milestones[mIdx].status = "Active";
    milestones[mIdx].paymentAmount = paidAmt;
    milestones[mIdx].paymentRef = refNum;
    milestones[mIdx].paymentDate = payDate;
    milestones[mIdx].approvedBy = paymentMode.includes("Razorpay") ? "Razorpay Gateway" : "Online Auto-Verify";
    milestones[mIdx].paymentRemark = notesText;

    if (Array.isArray(milestones[mIdx].stages) && milestones[mIdx].stages.length > 0) {
      if (milestones[mIdx].stages[0].status === "Locked") {
        milestones[mIdx].stages[0].status = "In Progress";
      }
    }
  } else {
    milestones[mIdx].paymentStatus = "Submitted";
    milestones[mIdx].paymentRef = refNum;
    milestones[mIdx].paymentRemark = paymentNotes || `Payment reference submitted by candidate (${paymentMode})`;
  }

  if (!Array.isArray(app.payments)) {
    app.payments = [];
  }

  const paymentRecord = {
    id: `pay-${Date.now()}`,
    milestoneId,
    milestoneName: milestones[mIdx].name,
    amount: paidAmt,
    paymentMode,
    referenceNumber: refNum,
    receiptNumber: receiptNum,
    paymentDate: payDate,
    status: isAutoApproved ? "Verified" : "Pending Verification",
    verifiedBy: isAutoApproved ? "Online Auto-Verify" : "Pending Admin Verification",
    notes: paymentNotes || `Candidate payment via ${paymentMode}`,
    createdAt: new Date(),
  };

  app.payments.push(paymentRecord);
  app.processMilestones = milestones;
  if (app.paymentPlan) {
    app.paymentPlan.milestones = milestones;
  }
  app.markModified("processMilestones");
  app.markModified("paymentPlan");
  app.markModified("payments");

  await app.save();

  try {
    await Notification.create({
      type: "EXPENSE_UPDATE",
      title: isAutoApproved ? "Candidate Milestone Paid Online! 💳" : "Candidate Submitted Payment Reference 📋",
      message: `${candidate.fullName} paid ₹${Number(paidAmt).toLocaleString()} for "${milestones[mIdx].name}" on project ${app.projectName} (Ref: ${refNum}).`,
      targetRole: "ADMIN",
      targetType: "ALL",
    });

    await CrmNotification.create({
      notificationId: `notif-cand-${Date.now()}`,
      recipientRole: "CANDIDATE",
      candidateId: candidate.candidateId,
      title: isAutoApproved ? "Payment Successful! 🎉" : "Payment Reference Submitted ⏳",
      message: isAutoApproved
        ? `Payment of ₹${Number(paidAmt).toLocaleString()} for ${milestones[mIdx].name} confirmed. Receipt #: ${receiptNum}`
        : `Your payment reference ${refNum} for ₹${Number(paidAmt).toLocaleString()} has been submitted for admin verification.`,
      link: isAutoApproved ? `/invoice/${app.applicationId}/${milestoneId}` : "/candidate/dashboard",
      type: "success",
    });

    if (isAutoApproved) {
      await sendCandidatePaymentReceiptEmail({
        to: candidate.email,
        candidateName: candidate.fullName,
        projectName: app.projectName,
        milestoneName: milestones[mIdx].name,
        amount: paidAmt,
        receiptNumber: receiptNum,
        paymentMode,
      });
    }

    await ActivityLog.create({
      action: "CANDIDATE_PAYMENT",
      module: "CANDIDATE",
      targetId: app.applicationId,
      description: `${candidate.fullName} paid ₹${Number(paidAmt).toLocaleString()} for ${milestones[mIdx].name}`,
      performedBy: candidate.fullName,
      performedByRole: "candidate",
    });
  } catch (notifErr) {
    console.warn("Notification error during candidate payment:", notifErr);
  }

  return res.status(200).json({
    success: true,
    message: isAutoApproved
      ? "Payment completed successfully! Milestone unlocked and receipt generated."
      : "Payment reference submitted! Verification in progress.",
    application: app.toJSON(),
    receiptNumber: receiptNum,
    payment: paymentRecord,
  });
});

export const getCandidateNotifications = asyncHandler(async (req, res) => {
  const candidate = await findCandidateFromRequest(req);
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found." });
  }

  const notifications = await CrmNotification.find({
    recipientRole: { $in: ["CANDIDATE", "ALL"] },
    $or: [
      { candidateId: candidate.candidateId },
      { candidateId: null },
      { candidateId: { $exists: false } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  const formatted = (notifications || []).map((n) => ({
    ...n,
    id: n.notificationId || n._id.toString(),
  }));

  const unreadCount = formatted.filter((n) => !n.read).length;

  return res.status(200).json({
    success: true,
    notifications: formatted,
    unreadCount,
  });
});

export const markCandidateNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { notificationId: id }] } : { notificationId: id };

  await CrmNotification.updateOne(query, { $set: { read: true } });

  return res.status(200).json({
    success: true,
    message: "Notification marked as read.",
  });
});

