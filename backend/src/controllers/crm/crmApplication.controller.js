import CrmCandidateApplication from "../../models/CrmCandidateApplication.js";
import CandidateApplication from "../../models/CandidateApplication.js";
import Candidate from "../../models/Candidate.js";
import CrmOverseasClient from "../../models/CrmOverseasClient.js";
import CrmNotification from "../../models/CrmNotification.js";
import NotificationService, { resolveActorInfo } from "../../services/notification.service.js";
import ActivityService from "../../services/activity.service.js";
import { recordCandidateActivity } from "../../services/candidateActivity.service.js";
import { verifyAndFetchRazorpayPayment } from "../../services/razorpayVerification.service.js";
import { emitRealtimeEvent } from "../../services/realtime.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { generateNextCandidateApplicationId } from "../../utils/idGenerator.js";
import {
  findProjectAcrossSources,
  fetchAllMergedProjects,
  resolveProjectMilestonesData,
  normalizeMilestoneStages,
} from "../../utils/projectResolver.js";
import {
  isRefundReassignEligible,
  checkApplicationRefundLock,
  markApplicationRefundsReassigned,
} from "../../utils/refundLock.js";

const getVendorAllowedSet = (req) =>
  new Set([req.vendorId, req.userId].filter(Boolean).map((v) => String(v).trim()));

const isVendorOwner = (req, targetVendorId) => {
  if (!req.isVendor) return true;
  if (!targetVendorId) return false;
  return getVendorAllowedSet(req).has(String(targetVendorId).trim());
};

const isProjectVisibleToVendor = (project, allowedVendorIds) => {
  if (!project) return false;
  const visType = project.vendorAssignmentType || project.vendorVisibility || "";
  if (visType !== "Specific Vendor" && visType !== "specific") return true;
  const assigned = project.assignedVendors || project.assignedVendorIds || [];
  return (
    Array.isArray(assigned) &&
    assigned.some((v) => {
      const vid = typeof v === "object" ? v.vendorId || v.id || v._id : v;
      return vid && allowedVendorIds.has(String(vid).trim());
    })
  );
};

const normalizeStageValue = (val) => {
  if (!val) return "Applied";
  const s = String(val).trim();
  if (s === "Interview") return "Interview Scheduled";
  if (s === "Visa Allotted") return "Visa Issued";
  if (s === "Submitted" || s === "Under Review") return "Screening";
  return s;
};

const POST_SELECTION_STATUSES = new Set([
  "Selected",
  "Processing",
  "Completed",
  "Offer Released",
  "Offer Accepted",
  "Visa Processing",
  "Visa Issued",
  "Visa Allotted",
  "Joined",
  "Deployed",
]);

export const getApplications = asyncHandler(async (req, res) => {
  const { vendorId, projectId } = req.query;
  const filter = {};
  if (req.isVendor) {
    const allowedVendorIds = Array.from(getVendorAllowedSet(req));
    filter.vendorId = allowedVendorIds.length > 1 ? { $in: allowedVendorIds } : allowedVendorIds[0] || "";
  } else if (vendorId) {
    filter.vendorId = String(vendorId);
  }
  if (projectId) filter.projectId = String(projectId);

  const [crmApps, directApps, mergedProjects] = await Promise.all([
    CrmCandidateApplication.find(filter).sort({ createdAt: -1 }).lean(),
    CandidateApplication.find(filter).sort({ createdAt: -1 }).lean(),
    fetchAllMergedProjects(),
  ]);

  const projectById = new Map();
  const projectByName = new Map();
  (mergedProjects || []).forEach((p) => {
    const cids = Array.isArray(p.rawIdCandidates) ? p.rawIdCandidates : [p.projectId || p.id];
    cids.filter(Boolean).forEach((cid) => projectById.set(String(cid), p));
    if (p.projectName) projectByName.set(String(p.projectName).trim().toLowerCase(), p);
  });

  const mergedMap = new Map();
  const upsertMerged = (rec, source) => {
    const appId = String(rec.applicationId || rec._id || "");
    const pairKey =
      rec.candidateId && rec.projectId ? `${String(rec.candidateId)}::${String(rec.projectId)}` : appId;
    const key = appId || pairKey;
    const existing = mergedMap.get(key) || (pairKey !== key ? Array.from(mergedMap.values()).find((x) => `${x.candidateId}::${x.projectId}` === pairKey) : null);

    if (!existing) {
      mergedMap.set(key, {
        ...rec,
        id: rec.applicationId || rec._id.toString(),
        applicationId: rec.applicationId || rec._id.toString(),
        _primarySource: source,
      });
    } else {
      const existingTs = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const incomingTs = new Date(rec.updatedAt || rec.createdAt || 0).getTime();
      const newer = incomingTs >= existingTs ? rec : existing;
      const older = incomingTs >= existingTs ? existing : rec;
      const combinedMilestones =
        Array.isArray(newer.processMilestones) && newer.processMilestones.length > 0
          ? newer.processMilestones
          : older.processMilestones || [];
      const mergedObj = {
        ...older,
        ...newer,
        id: existing.applicationId || rec.applicationId || existing.id,
        applicationId: existing.applicationId || rec.applicationId || existing.id,
        processMilestones: combinedMilestones,
        candidateData: {
          ...(older.candidateData || {}),
          ...(newer.candidateData || {}),
        },
        interview: newer.interview?.scheduledDate ? newer.interview : older.interview,
        interviewDetails:
          newer.interviewDetails?.dateTime || newer.interviewDetails?.scheduledDate
            ? newer.interviewDetails
            : older.interviewDetails,
      };
      const existingMapKey = existing.applicationId || existing.id;
      mergedMap.set(existingMapKey, mergedObj);
    }
  };

  (crmApps || []).forEach((a) => upsertMerged(a, "CRM"));
  (directApps || []).forEach((a) => upsertMerged(a, "DIRECT"));

  const formatted = Array.from(mergedMap.values()).map((a) => {
    const effectiveStatus = a.status || a.recruitmentStage || "Submitted";
    const matchedProj =
      projectById.get(String(a.projectId || "")) ||
      projectByName.get(String(a.projectName || "").trim().toLowerCase()) ||
      null;

    let processMilestones = Array.isArray(a.processMilestones) ? a.processMilestones : [];
    let totalAmount = Number(a.paymentPlan?.totalAmount || 0);

    if (POST_SELECTION_STATUSES.has(effectiveStatus) || POST_SELECTION_STATUSES.has(a.recruitmentStage) || processMilestones.length > 0) {
      if (matchedProj && !a.milestonesOverridden) {
        const resolved = resolveProjectMilestonesData(matchedProj, processMilestones, false);
        if (resolved.processMilestones.length > 0) {
          processMilestones = resolved.processMilestones;
          totalAmount = resolved.totalAmount;
        } else {
          processMilestones = normalizeMilestoneStages(processMilestones);
          totalAmount = processMilestones.reduce(
            (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
            0
          );
        }
      } else {
        processMilestones = normalizeMilestoneStages(processMilestones);
        totalAmount = processMilestones.reduce(
          (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
          0
        );
      }
    }

    const cleanEmail = (val) =>
      val && !String(val).toLowerCase().includes("@candidate.local") ? String(val).trim() : "";

    return {
      ...a,
      id: a.applicationId || a.id || a._id?.toString(),
      candidateEmail: cleanEmail(a.candidateEmail || a.candidateData?.email),
      ...(a.candidateData
        ? {
            candidateData: {
              ...a.candidateData,
              email: cleanEmail(a.candidateData.email || a.candidateEmail),
            },
          }
        : {}),
      status: effectiveStatus,
      recruitmentStage: a.recruitmentStage || effectiveStatus,
      projectName: matchedProj?.projectName || a.projectName || "",
      country: matchedProj?.country || a.country || "",
      destinationCountry: matchedProj?.country || a.destinationCountry || a.country || "",
      salary: matchedProj?.salary !== undefined && matchedProj?.salary !== "" ? matchedProj.salary : a.salary || "",
      currency: matchedProj?.currency !== undefined && matchedProj?.currency !== "" ? matchedProj.currency : a.currency || "",
      processMilestones,
      paymentPlan: {
        ...(a.paymentPlan || { currency: "INR" }),
        totalAmount,
        milestones: processMilestones,
      },
    };
  });

  formatted.sort((x, y) => new Date(y.createdAt || 0) - new Date(x.createdAt || 0));

  return res.status(200).json({ success: true, applications: formatted });
});

const isRestrictedStageActor = (req) => {
  const normalizedRole = String(req.userRole || req.user?.role || "")
    .toUpperCase()
    .replace(/[\s_-]/g, "");
  return Boolean(
    req.isVendor || ["VENDOR", "CANDIDATE", "EMPLOYEE"].includes(normalizedRole)
  );
};

const PROTECTED_RESTRICTED_APP_FIELDS = [
  "refundStatus",
  "refundDetails",
  "adminRemark",
  "adminRemarks",
  "rejectionReason",
  "rejectionDate",
  "holdReason",
  "holdDate",
  "didNotJoinReason",
  "milestonesOverridden",
  "payments",
  "interview",
  "interviewDetails",
  "processing",
  "visaDocument",
];

const resolveAuthoritativeAppMilestones = async (app) => {
  if (Array.isArray(app?.processMilestones) && app.processMilestones.length > 0) {
    return normalizeMilestoneStages(app.processMilestones);
  }
  let matchedProj = app?.projectId ? await findProjectAcrossSources(app.projectId) : null;
  if (!matchedProj && app?.projectName) {
    const merged = await fetchAllMergedProjects().catch(() => []);
    const targetName = String(app.projectName).trim().toLowerCase();
    matchedProj =
      merged.find((p) => String(p.projectName || "").trim().toLowerCase() === targetName) || null;
  }
  if (!matchedProj) return [];
  const resolved = resolveProjectMilestonesData(matchedProj, [], Boolean(app?.milestonesOverridden));
  return Array.isArray(resolved?.processMilestones) ? resolved.processMilestones : [];
};

const validateRestrictedApplicationMutation = async (app, nextUpdate, req, lockState = null) => {
  if (!app) {
    if (
      nextUpdate.status ||
      nextUpdate.recruitmentStage ||
      Array.isArray(nextUpdate.processMilestones) ||
      nextUpdate.paymentPlan ||
      PROTECTED_RESTRICTED_APP_FIELDS.some((k) => nextUpdate[k] !== undefined)
    ) {
      return "Only Admin, Super Admin, or Vendor HR can update processing stages.";
    }
    return null;
  }

  const eligibleForPoolReassign =
    app.status === "Rejected" ||
    app.status === "On Hold" ||
    isRefundReassignEligible(app) ||
    isRefundReassignEligible(lockState?.refund);

  const isPoolReassign =
    eligibleForPoolReassign &&
    (nextUpdate.status === "Submitted" || nextUpdate.status === "Applied") &&
    Boolean(nextUpdate.projectId) &&
    String(nextUpdate.projectId) !== String(app.projectId || "") &&
    (!Array.isArray(nextUpdate.processMilestones) || nextUpdate.processMilestones.length === 0);

  if (isPoolReassign) {
    if (nextUpdate.candidateId && String(nextUpdate.candidateId) !== String(app.candidateId || "")) {
      return "Immutable application identity fields cannot be modified.";
    }
    let targetProj = await findProjectAcrossSources(nextUpdate.projectId);
    if (!targetProj && nextUpdate.projectName) {
      const merged = await fetchAllMergedProjects().catch(() => []);
      const targetName = String(nextUpdate.projectName).trim().toLowerCase();
      targetProj =
        merged.find((p) => String(p.projectName || "").trim().toLowerCase() === targetName) || null;
    }
    if (req.isVendor && targetProj && !isProjectVisibleToVendor(targetProj, getVendorAllowedSet(req))) {
      return "Forbidden: Target project is not assigned to your vendor account.";
    }

    const sanitizedReassign = {
      projectId: String(targetProj?.projectId || nextUpdate.projectId),
      projectName: targetProj?.projectName || nextUpdate.projectName || app.projectName,
      clientId: targetProj?.clientId ?? app.clientId ?? "",
      clientName: targetProj?.clientName ?? app.clientName ?? "",
      position: nextUpdate.position || app.position || "",
      jobTitle: nextUpdate.jobTitle || nextUpdate.position || app.jobTitle || app.position || "",
      requirementCode: nextUpdate.requirementCode || app.requirementCode || "",
      status: "Submitted",
      recruitmentStage: "Screening",
      rejectionReason: "",
      rejectionDate: null,
      holdReason: "",
      holdDate: null,
      didNotJoinReason: "",
      refundStatus: "",
      refundDetails: null,
      processMilestones: [],
      paymentPlan: { totalAmount: 0, currency: "INR", milestones: [] },
      milestonesOverridden: false,
      processing: null,
      visaDocument: null,
    };
    Object.keys(nextUpdate).forEach((k) => delete nextUpdate[k]);
    Object.assign(nextUpdate, sanitizedReassign);
    return null;
  }

  if (
    (nextUpdate.candidateId !== undefined &&
      String(nextUpdate.candidateId || "") !== String(app.candidateId || "")) ||
    (nextUpdate.vendorId !== undefined &&
      String(nextUpdate.vendorId || "") !== String(app.vendorId || "")) ||
    (nextUpdate.clientId !== undefined &&
      String(nextUpdate.clientId || "") !== String(app.clientId || "")) ||
    (nextUpdate.selectionDate !== undefined &&
      JSON.stringify(nextUpdate.selectionDate ?? null) !== JSON.stringify(app.selectionDate ?? null))
  ) {
    return "Immutable application identity fields cannot be modified.";
  }

  for (const field of PROTECTED_RESTRICTED_APP_FIELDS) {
    if (nextUpdate[field] !== undefined) {
      const prevVal = field === "adminRemarks" ? app.adminRemarks ?? app.adminRemark ?? "" : app[field] ?? null;
      if (JSON.stringify(nextUpdate[field] ?? null) !== JSON.stringify(prevVal)) {
        return "Only Admin, Super Admin, or Vendor HR can modify protected application, refund, interview, or stage fields.";
      }
      delete nextUpdate[field];
    }
  }

  if (
    nextUpdate.status !== undefined &&
    normalizeStageValue(nextUpdate.status) !== normalizeStageValue(app.status || "Submitted")
  ) {
    return "Only Admin, Super Admin, or Vendor HR can update application or processing status.";
  }

  if (
    nextUpdate.recruitmentStage !== undefined &&
    normalizeStageValue(nextUpdate.recruitmentStage) !==
      normalizeStageValue(app.recruitmentStage || app.status || "Applied")
  ) {
    return "Only Admin, Super Admin, or Vendor HR can update processing stages.";
  }

  const rv = req.body?.razorpayVerification;
  const verifiedMilestoneIds = new Set();

  if (Array.isArray(nextUpdate.processMilestones)) {
    const existingMilestones = await resolveAuthoritativeAppMilestones(app);
    if (
      existingMilestones.length === 0 ||
      nextUpdate.processMilestones.length !== existingMilestones.length
    ) {
      return "Milestone structure cannot be created or altered by your role.";
    }

    for (let mIdx = 0; mIdx < nextUpdate.processMilestones.length; mIdx += 1) {
      const m = nextUpdate.processMilestones[mIdx];
      const exM = existingMilestones.find((em) => String(em?.id || "") === String(m?.id || ""));
      if (!exM) {
        return "Unknown or unauthorized milestone ID.";
      }

      const expectedFee = Number(exM.paymentAmount ?? exM.amount ?? 0);
      const incomingFee = Number(m?.paymentAmount ?? m?.amount ?? 0);
      if (incomingFee !== expectedFee) {
        return "Milestone payment amount cannot be modified.";
      }
      if (String(m?.name || "").trim() !== String(exM.name || "").trim()) {
        return "Milestone title cannot be modified.";
      }

      const nextPayStatus = String(m?.paymentStatus || "").trim();
      const prevPayStatus = String(exM.paymentStatus || "").trim();

      if (nextPayStatus === "Paid" && prevPayStatus !== "Paid") {
        return "Only Admin, Super Admin, or Vendor HR can mark milestone payments as paid.";
      }

      if (prevPayStatus === "Approved" && nextPayStatus !== "Approved") {
        return "Approved milestone payments cannot be downgraded.";
      }

      const wantsOnlineApproval = nextPayStatus === "Approved" && prevPayStatus !== "Approved";
      if (wantsOnlineApproval) {
        if (
          !rv ||
          String(rv.milestoneId || "") !== String(m?.id || "") ||
          !rv.razorpay_order_id ||
          !rv.razorpay_payment_id ||
          !rv.razorpay_signature
        ) {
          return "Only Admin, Super Admin, or Vendor HR can approve milestone payments unless verified by Razorpay.";
        }

        await verifyAndFetchRazorpayPayment({
          orderId: rv.razorpay_order_id,
          paymentId: rv.razorpay_payment_id,
          signature: rv.razorpay_signature,
          expectedAmountInr: expectedFee,
          applicationId: app.applicationId || app.id || req.params.id,
          milestoneId: m.id,
          actorId: req.vendorId || req.userId || "",
          actorRole: req.userRole || "VENDOR",
          consume: true,
        });

        m.paymentMode = "Razorpay Online";
        m.approvedBy = "Razorpay Gateway (Verified)";
        m.paymentRef = `[Razorpay] TXN: ${String(rv.razorpay_payment_id).trim()} | Date: ${new Date().toISOString().split("T")[0]} | Remark: Paid Online via Razorpay`;
        verifiedMilestoneIds.add(String(m.id));
      }

      if (nextPayStatus === "Rejected" && prevPayStatus !== "Rejected") {
        return "Only Admin, Super Admin, or Vendor HR can reject milestone payments.";
      }

      if (
        JSON.stringify(m?.clearanceDocuments || []) !==
        JSON.stringify(exM.clearanceDocuments || [])
      ) {
        return "Only Admin, Super Admin, or Vendor HR can update milestone documents.";
      }

      const nextStages = Array.isArray(m?.stages) ? m.stages : [];
      const prevStages = Array.isArray(exM.stages) ? exM.stages : [];
      if (nextStages.length !== prevStages.length) {
        return "Processing stage structure cannot be modified.";
      }

      for (let sIdx = 0; sIdx < nextStages.length; sIdx += 1) {
        const s = nextStages[sIdx];
        const exS = prevStages.find((ps) => String(ps?.id || "") === String(s?.id || ""));
        if (!exS) {
          return "Unknown or unauthorized processing stage ID.";
        }
        const prevSStatus = exS.status || "Pending";
        const nextSStatus = s?.status || "Pending";

        if (nextSStatus !== prevSStatus) {
          const allowedUnlock =
            verifiedMilestoneIds.has(String(m?.id || "")) &&
            prevSStatus === "Locked" &&
            (nextSStatus === "Pending" || nextSStatus === "In Progress");
          if (!allowedUnlock) {
            return "Only Admin, Super Admin, or Vendor HR can update processing stages.";
          }
        }

        if (
          (s?.completedAt || null) !== (exS.completedAt || null) ||
          (s?.completedBy || null) !== (exS.completedBy || null) ||
          (s?.visaDocumentUrl || null) !== (exS.visaDocumentUrl || null) ||
          (s?.visaFileName || null) !== (exS.visaFileName || null) ||
          (s?.remark || "") !== (exS.remark || "") ||
          JSON.stringify(s?.document || null) !== JSON.stringify(exS.document || null)
        ) {
          return "Only Admin, Super Admin, or Vendor HR can update processing stages.";
        }
      }
    }
  } else {
    delete nextUpdate.paymentPlan;
  }

  return null;
};

export const submitApplication = asyncHandler(async (req, res) => {
  const appData = { ...(req.body || {}) };
  delete appData._id;
  delete appData.__v;
  if (req.isVendor) {
    appData.vendorId = req.vendorId || req.userId;
    if (!appData.vendorName && req.vendorName) {
      appData.vendorName = req.vendorName;
    }
  }
  if (isRestrictedStageActor(req)) {
    const allowedInitial = new Set(["Submitted", "Applied", "Under Review", "Screening"]);
    const requestedStatus = String(appData.status || "Submitted").trim();
    appData.status = allowedInitial.has(requestedStatus) ? requestedStatus : "Submitted";
    appData.recruitmentStage =
      appData.status === "Under Review" || appData.status === "Screening"
        ? "Screening"
        : appData.status;
    delete appData.processMilestones;
    delete appData.paymentPlan;
    delete appData.processing;
    delete appData.visaDocument;
    delete appData.refundStatus;
    delete appData.refundDetails;
    delete appData.adminRemark;
    delete appData.adminRemarks;
    delete appData.rejectionReason;
    delete appData.rejectionDate;
    delete appData.holdReason;
    delete appData.holdDate;
    delete appData.didNotJoinReason;
    delete appData.milestonesOverridden;
    delete appData.payments;
    delete appData.interview;
    delete appData.interviewDetails;
    delete appData.selectionDate;
  }
  const missingFields = [];
  if (!String(appData.candidateId || "").trim()) missingFields.push("candidateId");
  if (!String(appData.candidateName || "").trim()) missingFields.push("candidateName");
  if (!String(appData.vendorId || "").trim()) missingFields.push("vendorId");
  if (!String(appData.projectId || "").trim()) missingFields.push("projectId");
  if (!String(appData.projectName || "").trim()) missingFields.push("projectName");
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required application fields: ${missingFields.join(", ")}`,
    });
  }
  if (req.isVendor && appData.projectId) {
    const matchedProj = await findProjectAcrossSources(appData.projectId);
    if (matchedProj && !isProjectVisibleToVendor(matchedProj, getVendorAllowedSet(req))) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: This project is not assigned to your vendor account.",
      });
    }
  }
  const appId =
    appData.id ||
    appData.applicationId ||
    (await generateNextCandidateApplicationId());

  const created = await CrmCandidateApplication.create({
    ...appData,
    applicationId: appId,
    status: appData.status || "Submitted",
  });

  try {
    let candObjectId = undefined;
    if (appData.candidateId) {
      const candDoc = await Candidate.findOne({ candidateId: String(appData.candidateId) })
        .select("_id email phone")
        .lean();
      if (candDoc?._id) candObjectId = candDoc._id;
    }

    const rawCandidateEmail = appData.candidateEmail || appData.candidateData?.email || "";
    const cleanCandidateEmail = String(rawCandidateEmail).toLowerCase().includes("@candidate.local")
      ? ""
      : rawCandidateEmail;

    await CandidateApplication.findOneAndUpdate(
      { applicationId: appId },
      {
        $setOnInsert: {
          applicationId: appId,
          candidateId: String(appData.candidateId || appId),
          candidateObjectId: candObjectId,
          candidateName: appData.candidateName || "Candidate",
          candidateEmail: cleanCandidateEmail,
          candidatePhone: appData.candidatePhone || appData.candidateData?.phone || "",
          projectId: String(appData.projectId || ""),
          projectName: appData.projectName || "Overseas Project",
          clientId: String(appData.clientId || ""),
          clientName: appData.clientName || "",
          destinationCountry: appData.destinationCountry || appData.country || "",
          position: appData.position || appData.trade || "",
          jobTitle: appData.position || appData.trade || "",
          vendorId: String(appData.vendorId || ""),
          vendorName: appData.vendorName || "",
          recruitmentStage: normalizeStageValue(appData.status || "Applied"),
          status: normalizeStageValue(appData.status || "Applied"),
          processMilestones: Array.isArray(appData.processMilestones)
            ? appData.processMilestones
            : [],
          paymentPlan: appData.paymentPlan || { totalAmount: 0, currency: "INR", milestones: [] },
        },
      },
      { upsert: true, returnDocument: "after" }
    );
  } catch (mirrorErr) {
    console.warn("Mirroring application to CandidateApplication failed:", mirrorErr.message);
  }

  try {
    const adminMsg = `Vendor ${appData.vendorName || appData.vendorId || "Partner"} submitted ${appData.candidateName} for "${appData.projectName}" (${appData.position || "Role"}).`;
    const actorMeta = req.user ? resolveActorInfo(req.user) : { actorId: appData.vendorId ? String(appData.vendorId) : null, actorRole: "VENDOR" };

    await CrmNotification.create({
      notificationId: `notif-adm-${Date.now()}`,
      recipientRole: "ADMIN",
      vendorId: appData.vendorId ? String(appData.vendorId) : null,
      actorId: actorMeta.actorId,
      actorRole: actorMeta.actorRole,
      title: "New Candidate Assigned to Project",
      message: adminMsg,
      type: "info",
      link: "/admin/vendor/submissions",
    });

    await NotificationService.createNotification({
      type: "DOCUMENT_UPLOAD",
      title: "New Candidate Assigned to Project",
      message: adminMsg,
      targetRole: "ADMIN",
      targetRoles: ["SUPER_ADMIN", "ADMIN", "VENDOR_HR"],
      targetType: "ALL",
      targetVendorId: appData.vendorId ? String(appData.vendorId) : null,
      actorId: actorMeta.actorId,
      actorRole: actorMeta.actorRole,
      moduleScope: "VENDOR",
      metadata: {
        vendorId: appData.vendorId || null,
        applicationId: appId,
        projectId: appData.projectId || null,
        link: "/admin/vendor/submissions",
      },
    });
  } catch {}

  emitRealtimeEvent({
    events: [
      "immigo:application-update",
      "immigo:dashboard-update",
      "immigo:vendor-hr-refresh",
      "immigo:notification-update",
      "immigo:admin-notification",
    ],
    roles: ["SUPER_ADMIN", "ADMIN", "VENDOR_HR", "VENDOR"],
    vendorId: created.vendorId || null,
    detail: { applicationId: appId },
  });

  return res.status(201).json({
    success: true,
    application: { ...created.toObject(), id: created.applicationId || created._id.toString() },
  });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body && typeof req.body === "object" ? req.body : {};

  const queryConditions = [
    { applicationId: id },
    { id: id },
  ];
  if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    queryConditions.push({ _id: id });
  }

  let app = await CrmCandidateApplication.findOne({ $or: queryConditions });

  if (!app && updateData.candidateId && updateData.projectId) {
    app = await CrmCandidateApplication.findOne({
      candidateId: updateData.candidateId,
      projectId: updateData.projectId,
    });
  }

  if (app && req.isVendor && !isVendorOwner(req, app.vendorId)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: You are not authorized to modify another vendor's application.",
    });
  }

  const prevStatus = app ? app.status : "Applied";
  const prevStage = app?.candidateData?.stage || "";
  const prevMilestone = app?.currentMilestone || "";
  const prevProjectId = app?.projectId || "";
  const prevProjectName = app?.projectName || "";

  const nextUpdate = { ...updateData };
  delete nextUpdate._id;
  delete nextUpdate.__v;
  delete nextUpdate.id;
  delete nextUpdate._primarySource;
  delete nextUpdate.createdAt;
  delete nextUpdate.updatedAt;
  delete nextUpdate.razorpayVerification;
  if (req.isVendor && nextUpdate.vendorId && !isVendorOwner(req, nextUpdate.vendorId)) {
    delete nextUpdate.vendorId;
  }

  const isReassignTransition = Boolean(
    app &&
      nextUpdate.projectId &&
      (String(nextUpdate.projectId) !== String(app.projectId || "") ||
        (nextUpdate.position && String(nextUpdate.position) !== String(app.position || ""))) &&
      (nextUpdate.status === "Submitted" || nextUpdate.status === "Applied") &&
      (!Array.isArray(nextUpdate.processMilestones) || nextUpdate.processMilestones.length === 0)
  );

  let lockState = null;
  if (app) {
    lockState = await checkApplicationRefundLock(app);
    if (isReassignTransition) {
      if (
        lockState.refundStatus === "Pending Admin Approval" ||
        String(app.refundStatus || "").trim() === "Pending Admin Approval"
      ) {
        return res.status(409).json({
          success: false,
          message: "Cannot reassign candidate while a refund claim is awaiting Admin approval.",
        });
      }
      if (!isRestrictedStageActor(req)) {
        nextUpdate.refundStatus = "";
        nextUpdate.refundDetails = null;
        nextUpdate.didNotJoinReason = "";
        nextUpdate.rejectionReason = "";
        nextUpdate.rejectionDate = null;
        nextUpdate.processMilestones = [];
        nextUpdate.paymentPlan = { totalAmount: 0, currency: "INR", milestones: [] };
        nextUpdate.milestonesOverridden = false;
        nextUpdate.recruitmentStage = normalizeStageValue(nextUpdate.status || "Submitted");
      }
    } else if (lockState.locked) {
      const milestonesMutated =
        Array.isArray(nextUpdate.processMilestones) &&
        JSON.stringify(normalizeMilestoneStages(nextUpdate.processMilestones)) !==
          JSON.stringify(normalizeMilestoneStages(app.processMilestones || []));
      const statusChangedAwayFromDidNotJoin =
        nextUpdate.status !== undefined &&
        normalizeStageValue(nextUpdate.status) !== normalizeStageValue(app.status || "Submitted") &&
        nextUpdate.status !== "Did Not Join";
      const stageChanged =
        nextUpdate.recruitmentStage !== undefined &&
        normalizeStageValue(nextUpdate.recruitmentStage) !==
          normalizeStageValue(app.recruitmentStage || app.status || "Applied");
      const processingChanged =
        (nextUpdate.processing !== undefined &&
          JSON.stringify(nextUpdate.processing) !== JSON.stringify(app.processing || null)) ||
        (nextUpdate.visaDocument !== undefined &&
          JSON.stringify(nextUpdate.visaDocument) !== JSON.stringify(app.visaDocument || null));

      if (milestonesMutated || statusChangedAwayFromDidNotJoin || stageChanged || processingChanged) {
        return res.status(409).json({
          success: false,
          message: `Action locked: candidate has an active refund claim (${lockState.refundStatus || "Pending Admin Approval"}). Resolve or reject the refund before updating payment or processing.`,
        });
      }
    }
  }

  if (isRestrictedStageActor(req)) {
    const forbiddenReason = await validateRestrictedApplicationMutation(app, nextUpdate, req, lockState);
    if (forbiddenReason) {
      return res.status(403).json({
        success: false,
        message: forbiddenReason,
      });
    }
  }

  if (Array.isArray(nextUpdate.processMilestones)) {
    nextUpdate.processMilestones = normalizeMilestoneStages(nextUpdate.processMilestones);
    const totalAmt = nextUpdate.processMilestones.reduce(
      (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
      0
    );
    nextUpdate.paymentPlan = {
      ...(nextUpdate.paymentPlan || app?.paymentPlan || { currency: "INR" }),
      totalAmount: totalAmt,
      milestones: nextUpdate.processMilestones,
    };
  } else if (POST_SELECTION_STATUSES.has(normalizeStageValue(nextUpdate.status)) && !(app?.milestonesOverridden)) {
    try {
      const targetProjId = nextUpdate.projectId || app?.projectId;
      const proj = targetProjId ? await findProjectAcrossSources(targetProjId) : null;
      if (proj) {
        const resolved = resolveProjectMilestonesData(
          proj,
          app?.processMilestones || [],
          false
        );
        if (resolved.processMilestones.length > 0) {
          nextUpdate.processMilestones = resolved.processMilestones;
          nextUpdate.paymentPlan = {
            ...(app?.paymentPlan || { currency: "INR" }),
            totalAmount: resolved.totalAmount,
            milestones: resolved.processMilestones,
          };
        }
      }
    } catch {}
  }

  if (!app) {
    const mirrorSeedQuery = [
      { applicationId: id },
      ...(id && id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : []),
    ];
    const seedDirect = await CandidateApplication.findOne({ $or: mirrorSeedQuery }).lean();
    if (!seedDirect && isRestrictedStageActor(req)) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }
    if (seedDirect && req.isVendor && !isVendorOwner(req, seedDirect.vendorId)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to modify another vendor's application.",
      });
    }
    const fallbackFields = seedDirect
      ? {
          candidateId: nextUpdate.candidateId || seedDirect.candidateId,
          candidateName: nextUpdate.candidateName || seedDirect.candidateName || "Candidate",
          vendorId: nextUpdate.vendorId || seedDirect.vendorId || "",
          vendorName: nextUpdate.vendorName || seedDirect.vendorName || "",
          projectId: nextUpdate.projectId || seedDirect.projectId || "",
          projectName: nextUpdate.projectName || seedDirect.projectName || "Overseas Project",
          clientId: nextUpdate.clientId || seedDirect.clientId || "",
          clientName: nextUpdate.clientName || seedDirect.clientName || "",
          position: nextUpdate.position || seedDirect.position || seedDirect.jobTitle || "",
        }
      : {};
    if (
      !seedDirect &&
      (!nextUpdate.candidateId ||
        !nextUpdate.candidateName ||
        !nextUpdate.vendorId ||
        !nextUpdate.projectId ||
        !nextUpdate.projectName)
    ) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }
    app = await CrmCandidateApplication.create({
      ...fallbackFields,
      ...nextUpdate,
      applicationId: nextUpdate.applicationId || id,
      status: nextUpdate.status || "Submitted",
    });
  } else {
    Object.assign(app, nextUpdate);
    await app.save();
  }

  if (isReassignTransition) {
    try {
      await markApplicationRefundsReassigned({
        applicationId: app.applicationId || id,
        candidateId: app.candidateId,
        oldProjectId: prevProjectId,
        oldProjectName: prevProjectName,
        targetProjectId: app.projectId,
        targetProjectName: app.projectName,
        targetPosition: app.position,
      });
    } catch {}
  }

  try {
    const mirrorQuery = [
      { applicationId: app.applicationId || id },
      ...(id && id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : []),
    ];
    const directApp = await CandidateApplication.findOne({ $or: mirrorQuery });
    const normStatus = normalizeStageValue(nextUpdate.status || app.status || "Applied");
    const interviewPatch = nextUpdate.interviewDetails
      ? {
          scheduledDate:
            nextUpdate.interviewDetails.scheduledDate ||
            (nextUpdate.interviewDetails.dateTime
              ? String(nextUpdate.interviewDetails.dateTime).split("T")[0]
              : ""),
          scheduledTime:
            nextUpdate.interviewDetails.scheduledTime ||
            (nextUpdate.interviewDetails.dateTime &&
            String(nextUpdate.interviewDetails.dateTime).includes("T")
              ? String(nextUpdate.interviewDetails.dateTime).split("T")[1].slice(0, 5)
              : ""),
          mode: nextUpdate.interviewDetails.mode || "Google Meet",
          locationOrLink:
            nextUpdate.interviewDetails.meetingUrl ||
            nextUpdate.interviewDetails.meetingLink ||
            nextUpdate.interviewDetails.locationOrLink ||
            "",
          interviewerName: nextUpdate.interviewDetails.interviewer || "",
          remarks: nextUpdate.interviewDetails.notes || "",
          updatedAt: new Date(),
        }
      : nextUpdate.interview || undefined;

    if (directApp) {
      if (nextUpdate.status) {
        directApp.status = normStatus;
        directApp.recruitmentStage = normStatus;
      }
      if (nextUpdate.rejectionReason !== undefined) {
        directApp.rejectionReason = nextUpdate.rejectionReason;
      }
      if (nextUpdate.didNotJoinReason !== undefined) {
        directApp.didNotJoinReason = nextUpdate.didNotJoinReason;
      }
      if (nextUpdate.refundStatus !== undefined) {
        directApp.refundStatus = nextUpdate.refundStatus;
      }
      if (nextUpdate.refundDetails !== undefined) {
        directApp.refundDetails = nextUpdate.refundDetails;
      }
      if (nextUpdate.adminRemark !== undefined) {
        directApp.adminRemarks = nextUpdate.adminRemark;
      }
      if (nextUpdate.processMilestones !== undefined) {
        directApp.processMilestones = nextUpdate.processMilestones;
        directApp.markModified("processMilestones");
      }
      if (nextUpdate.paymentPlan !== undefined) {
        directApp.paymentPlan = nextUpdate.paymentPlan;
        directApp.markModified("paymentPlan");
      }
      if (nextUpdate.milestonesOverridden !== undefined) {
        directApp.set("milestonesOverridden", Boolean(nextUpdate.milestonesOverridden));
      }
      if (nextUpdate.interviewDetails !== undefined) {
        directApp.set("interviewDetails", nextUpdate.interviewDetails);
      }
      if (nextUpdate.projectId) directApp.projectId = String(nextUpdate.projectId);
      if (nextUpdate.projectName) directApp.projectName = nextUpdate.projectName;
      if (nextUpdate.clientId !== undefined) directApp.clientId = String(nextUpdate.clientId || "");
      if (nextUpdate.clientName !== undefined) directApp.clientName = nextUpdate.clientName || "";
      if (nextUpdate.position !== undefined) {
        directApp.position = nextUpdate.position;
        directApp.jobTitle = nextUpdate.position;
      }
      if (interviewPatch) directApp.interview = interviewPatch;
      await directApp.save();
    } else if (app.candidateId && app.projectId) {
      await CandidateApplication.create({
        applicationId: app.applicationId || id,
        candidateId: String(app.candidateId),
        candidateName: app.candidateName || "Candidate",
        candidateEmail:
          app.candidateData?.email && !String(app.candidateData.email).includes("@candidate.local")
            ? app.candidateData.email
            : "",
        candidatePhone: app.candidateData?.phone || "",
        projectId: String(app.projectId),
        projectName: app.projectName || "Overseas Project",
        clientId: String(app.clientId || ""),
        clientName: app.clientName || "",
        position: app.position || "",
        jobTitle: app.position || "",
        vendorId: String(app.vendorId || ""),
        vendorName: app.vendorName || "",
        recruitmentStage: normStatus,
        status: normStatus,
        rejectionReason: app.rejectionReason || "",
        adminRemarks: app.adminRemark || "",
        processMilestones: Array.isArray(app.processMilestones) ? app.processMilestones : [],
        paymentPlan: app.paymentPlan || { totalAmount: 0, currency: "INR", milestones: [] },
        ...(interviewPatch ? { interview: interviewPatch } : {}),
      });
    }
  } catch (syncErr) {
    console.warn("Mirroring status update to CandidateApplication failed:", syncErr.message);
  }

  try {
    const updaterName = req.user?.name || req.user?.companyName || "Admin";
    const updaterRole = req.userRole || req.user?.role || "ADMIN";
    const updaterId = req.userId || req.user?._id || "";

    await recordCandidateActivity({
      candidateId: app.candidateId,
      candidateName: app.candidateName,
      updatedByUserId: updaterId,
      updatedByName: updaterName,
      updatedByRole: updaterRole,
      vendorId: app.vendorId,
      vendorName: app.vendorName,
      actionType:
        updateData.status && updateData.status !== prevStatus
          ? "STATUS_UPDATE"
          : updateData.stage
          ? "STAGE_UPDATE"
          : updateData.milestone
          ? "MILESTONE_UPDATE"
          : "PROCESS_UPDATE",
      previousStatus: prevStatus,
      newStatus: app.status,
      previousStage: prevStage,
      newStage: updateData.stage || app?.candidateData?.stage || "",
      previousMilestone: prevMilestone,
      newMilestone: updateData.currentMilestone || updateData.milestone || "",
      remarks: updateData.adminRemark || updateData.remarks || updateData.rejectionReason || "",
    });
  } catch (err) {
    console.warn("Candidate activity logging failed in crmApplication:", err.message);
  }

  if (updateData.status) {
    try {
      const statusTitle =
        updateData.status === "Selected"
          ? "Candidate Selected! 🎉"
          : updateData.status === "Rejected"
          ? "Candidate Application Rejected"
          : updateData.status === "Interview" || updateData.status === "Interview Scheduled"
          ? "Interview Scheduled 🎥"
          : updateData.status === "On Hold"
          ? "Candidate Put On Hold ⏸️"
          : `Candidate Status Updated: ${updateData.status}`;

      const statusMsg =
        updateData.status === "Selected"
          ? `${app.candidateName} has been selected for ${app.projectName} (${app.position || "Role"}). Processing timeline initiated.`
          : updateData.status === "Rejected"
          ? `${app.candidateName} was not selected for ${app.projectName}. Reason: ${app.rejectionReason || "Criteria not met"}. Candidate returned to pool for reuse.`
          : updateData.status === "Interview" || updateData.status === "Interview Scheduled"
          ? `Interview scheduled for ${app.candidateName} on ${app.projectName}. Date: ${app.interviewDetails?.dateTime || "TBD"}.`
          : updateData.status === "On Hold"
          ? `${app.candidateName} was put On Hold for ${app.projectName}. Candidate is reusable for other projects.`
          : `Candidate ${app.candidateName} status changed to "${updateData.status}" on project ${app.projectName}.`;

      const actorMeta = resolveActorInfo(req.user);
      if (app.vendorId) {
        await CrmNotification.create({
          notificationId: `notif-ven-${Date.now()}`,
          recipientRole: "VENDOR",
          vendorId: String(app.vendorId),
          actorId: actorMeta.actorId,
          actorRole: actorMeta.actorRole,
          title: statusTitle,
          message: statusMsg,
          type: updateData.status === "Selected" ? "success" : updateData.status === "Rejected" ? "warning" : "info",
          link: updateData.status === "Selected" ? "/vendor/selected" : updateData.status === "Rejected" ? "/vendor/rejected" : "/vendor/applications",
        });
      }

      if (actorMeta.actorRole === "ADMIN" || actorMeta.actorRole === "SUPER_ADMIN" || actorMeta.actorRole === "VENDOR_HR") {
        await NotificationService.notifyStaffAction({
          actor: req.user,
          type: "UPDATE",
          title: statusTitle,
          message: statusMsg,
          moduleScope: "CANDIDATE",
          targetVendorId: app.vendorId || null,
          metadata: {
            applicationId: app.applicationId,
            candidateId: app.candidateId,
            link: updateData.status === "Selected"
              ? "/admin/vendor/selected"
              : updateData.status === "Rejected"
              ? "/admin/vendor/rejected"
              : "/admin/vendor/submissions",
          },
        });
      }

      if (updateData.status === "Selected") {
        try {
          const clientId = app.clientId;
          let clientDoc = null;
          if (clientId) {
            const clientQueries = [{ clientId: String(clientId) }, { id: String(clientId) }];
            if (typeof clientId === "string" && /^[0-9a-fA-F]{24}$/.test(clientId)) {
              clientQueries.push({ _id: clientId });
            }
            clientDoc = await CrmOverseasClient.findOne({ $or: clientQueries });
          }
          if (!clientDoc && app.projectId) {
            clientDoc = await CrmOverseasClient.findOne({ "projects.id": app.projectId });
          }

          if (clientDoc && Array.isArray(clientDoc.paymentMilestones)) {
            const msIdx = clientDoc.paymentMilestones.findIndex(
              (m) =>
                m.status === "Pending" &&
                (m.condition?.toLowerCase().includes("select") ||
                  m.name?.toLowerCase().includes("select") ||
                  m.condition?.toLowerCase().includes("candidate"))
            );

            if (msIdx !== -1) {
              const ms = clientDoc.paymentMilestones[msIdx];
              ms.status = "Due";
              ms.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              ms.relatedCandidateId = app.candidateId || "";
              ms.relatedCandidateName = app.candidateName || "";
              ms.relatedProjectId = app.projectId || "";
              ms.relatedProjectName = app.projectName || "";
              clientDoc.paymentMilestones[msIdx] = ms;
              clientDoc.markModified("paymentMilestones");
              await clientDoc.save();

              await ActivityService.log({
                userType: "SYSTEM",
                action: "CLIENT_MILESTONE_DUE",
                title: `Client Milestone Due: ${ms.name}`,
                description: `Milestone "${ms.name}" (₹${Number(ms.amount).toLocaleString()}) became DUE for ${clientDoc.companyName} upon selection of candidate ${app.candidateName}.`,
                entityType: "Client",
                entityId: clientDoc.clientId || clientDoc._id.toString(),
                entityName: clientDoc.companyName,
                status: "Due",
                visibility: "ADMIN",
                metadata: { candidateName: app.candidateName, milestoneId: ms.id },
              });
            }
          }

          await ActivityService.log({
            userType: "ADMIN",
            action: "CANDIDATE_SELECTED",
            title: `Candidate Selected: ${app.candidateName}`,
            description: `${app.candidateName} selected for ${app.projectName} (${app.position || "Role"}).`,
            entityType: "Candidate",
            entityId: app.candidateId || app._id.toString(),
            entityName: app.candidateName,
            status: "Selected",
            visibility: "ADMIN",
          });
        } catch (selErr) {
          console.error("Failed to trigger milestone on candidate selection:", selErr.message);
        }
      }
    } catch (notifErr) {
      console.error("Failed to create vendor notification:", notifErr.message);
    }
  }

  emitRealtimeEvent({
    events: [
      "immigo:application-update",
      "immigo:dashboard-update",
      "immigo:vendor-hr-refresh",
      "immigo:notification-update",
      "immigo:admin-notification",
      "immigo:vendor-notification",
    ],
    roles: ["SUPER_ADMIN", "ADMIN", "VENDOR_HR", "VENDOR", "CANDIDATE"],
    vendorId: app.vendorId || null,
    candidateId: app.candidateId || null,
    detail: { applicationId: app.applicationId || id, status: app.status },
  });

  return res.status(200).json({
    success: true,
    application: { ...app.toObject(), id: app.applicationId || app._id.toString() },
  });
});
