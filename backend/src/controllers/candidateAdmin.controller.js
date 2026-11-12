import Candidate from "../models/Candidate.js";
import CandidateApplication from "../models/CandidateApplication.js";
import CrmCandidateApplication from "../models/CrmCandidateApplication.js";
import ActivityLog from "../models/ActivityLog.js";
import NotificationService, { resolveActorInfo } from "../services/notification.service.js";
import CrmNotification from "../models/CrmNotification.js";
import CrmOverseasClient from "../models/CrmOverseasClient.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  findProjectAcrossSources,
  resolveProjectMilestonesData,
  normalizeMilestoneStages,
} from "../utils/projectResolver.js";
import { checkApplicationRefundLock } from "../utils/refundLock.js";
import { escapeRegex } from "../utils/regex.js";
import { emitRealtimeEvent } from "../services/realtime.service.js";

const emitCandidateSync = (appOrCandidate) => {
  emitRealtimeEvent({
    events: [
      "immigo:candidate-update",
      "immigo:application-update",
      "immigo:dashboard-update",
      "immigo:vendor-hr-refresh",
      "immigo:notification-update",
      "immigo:admin-notification",
      "immigo:vendor-notification",
    ],
    roles: ["SUPER_ADMIN", "ADMIN", "VENDOR_HR", "VENDOR", "CANDIDATE"],
    vendorId:
      appOrCandidate?.vendorId &&
      appOrCandidate.vendorId !== "DIRECT" &&
      appOrCandidate.vendorId !== "undefined"
        ? String(appOrCandidate.vendorId)
        : null,
    candidateId: appOrCandidate?.candidateId ? String(appOrCandidate.candidateId) : null,
  });
};
import {
  sendCandidateApprovalEmail,
  sendCandidateRejectionEmail,
  sendCandidateInterviewEmail,
  sendCandidateSelectionEmail,
  sendCandidateMilestoneUpdateEmail,
  sendCandidatePaymentReceiptEmail,
} from "../services/email.service.js";

export const getCandidateStats = asyncHandler(async (req, res) => {
  const [
    totalCandidates,
    pendingRegistrations,
    approvedAccounts,
    pendingDocuments,
    documentsRequiringReupload,
    eligibleCandidates,
    totalApplications,
    interviewsScheduled,
    selectedCandidates,
    rejectedApplications,
  ] = await Promise.all([
    Candidate.countDocuments({}),
    Candidate.countDocuments({ accountStatus: "Pending Approval" }),
    Candidate.countDocuments({ accountStatus: "Approved" }),
    Candidate.countDocuments({ documentStatus: "Pending Verification" }),
    Candidate.countDocuments({ documentStatus: "Re-upload Required" }),
    Candidate.countDocuments({ jobApplicationAccess: "Unlocked" }),
    CandidateApplication.countDocuments({}),
    CandidateApplication.countDocuments({
      status: { $in: ["Interview Scheduled", "Interview Rescheduled"] },
    }),
    CandidateApplication.countDocuments({ status: "Selected" }),
    CandidateApplication.countDocuments({ status: "Rejected" }),
  ]);

  return res.status(200).json({
    success: true,
    stats: {
      totalCandidates,
      pendingRegistrations,
      approvedAccounts,
      pendingDocuments,
      documentsRequiringReupload,
      eligibleCandidates,
      totalApplications,
      interviewsScheduled,
      selectedCandidates,
      rejectedApplications,
    },
  });
});

export const getCandidates = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 15,
    search = "",
    accountStatus,
    documentStatus,
    jobApplicationAccess,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = {};

  if (accountStatus && accountStatus !== "All") {
    query.accountStatus = accountStatus;
  }

  if (documentStatus && documentStatus !== "All") {
    query.documentStatus = documentStatus;
  }

  if (jobApplicationAccess && jobApplicationAccess !== "All") {
    query.jobApplicationAccess = jobApplicationAccess;
  }

  if (search && String(search).trim()) {
    const regex = new RegExp(escapeRegex(String(search).trim()), "i");
    query.$or = [
      { candidateId: regex },
      { fullName: regex },
      { email: regex },
      { phone: regex },
      { "profile.trade": regex },
      { "profile.preferredJobRole": regex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const sortDirection = sortOrder === "asc" ? 1 : -1;
  const sortOptions = { [sortBy]: sortDirection };

  const [candidates, total] = await Promise.all([
    Candidate.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
    Candidate.countDocuments(query),
  ]);

  return res.status(200).json({
    success: true,
    candidates,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
    },
  });
});

export const getCandidateById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { candidateId: id }] } : { candidateId: id };

  const candidate = await Candidate.findOne(query).lean();
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found." });
  }

  const applications = await CandidateApplication.find({ candidateId: candidate.candidateId })
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    candidate,
    applications,
  });
});

export const approveCandidateRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { candidateId: id }] } : { candidateId: id };

  const candidate = await Candidate.findOne(query);
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found." });
  }

  candidate.accountStatus = "Approved";
  candidate.approvalDate = new Date();
  candidate.approvedBy = req.user?.name || "Admin";

  if (!candidate.documentStatus) {
    candidate.documentStatus = "Not Submitted";
  }
  candidate.jobApplicationAccess = "Locked";

  let emailResult = { success: true };
  if (!candidate.approvalEmailSent) {
    try {
      emailResult = await sendCandidateApprovalEmail({
        to: candidate.email,
        candidateName: candidate.fullName,
        candidateId: candidate.candidateId,
        portalUrl: process.env.FRONTEND_URL,
      });

      if (emailResult.success) {
        candidate.approvalEmailSent = true;
        candidate.approvalEmailSentAt = new Date();
        candidate.approvalEmailError = "";
      } else {
        candidate.approvalEmailError = emailResult.error || "Email delivery failed";
      }
    } catch (mailErr) {
      candidate.approvalEmailError = mailErr.message;
    }
  }

  await candidate.save();

  try {
    await ActivityLog.create({
      action: "APPROVE_REGISTRATION",
      module: "CANDIDATE",
      targetId: candidate.candidateId,
      description: `Registration approved for candidate ${candidate.fullName} (${candidate.candidateId}) by ${candidate.approvedBy}.`,
      performedBy: candidate.approvedBy,
      performedByRole: "admin",
    });
  } catch {}

  emitCandidateSync(candidate);

  return res.status(200).json({
    success: true,
    message: `Candidate ${candidate.fullName} (${candidate.candidateId}) approved successfully. Login access activated.`,
    candidate: candidate.toJSON(),
    emailSent: candidate.approvalEmailSent,
  });
});

export const rejectCandidateRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  if (!rejectionReason || !String(rejectionReason).trim()) {
    return res.status(400).json({ success: false, message: "A rejection reason is required." });
  }

  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { candidateId: id }] } : { candidateId: id };

  const candidate = await Candidate.findOne(query);
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found." });
  }

  candidate.accountStatus = "Rejected";
  candidate.rejectionReason = String(rejectionReason).trim();

  try {
    await sendCandidateRejectionEmail({
      to: candidate.email,
      candidateName: candidate.fullName,
      candidateId: candidate.candidateId,
      reason: candidate.rejectionReason,
    });
  } catch {}

  await candidate.save();

  try {
    await ActivityLog.create({
      action: "REJECT_REGISTRATION",
      module: "CANDIDATE",
      targetId: candidate.candidateId,
      description: `Registration rejected for candidate ${candidate.fullName} (${candidate.candidateId}). Reason: ${candidate.rejectionReason}`,
      performedBy: req.user?.name || "Admin",
      performedByRole: "admin",
    });
  } catch {}

  emitCandidateSync(candidate);

  return res.status(200).json({
    success: true,
    message: `Candidate registration has been rejected. Notification sent.`,
    candidate: candidate.toJSON(),
  });
});

export const updateCandidateInternalRemarks = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { internalRemarks } = req.body;

  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { candidateId: id }] } : { candidateId: id };

  const candidate = await Candidate.findOne(query);
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found." });
  }

  candidate.internalRemarks = internalRemarks || "";
  await candidate.save();

  emitCandidateSync(candidate);

  return res.status(200).json({
    success: true,
    message: "Internal remarks updated successfully.",
    internalRemarks: candidate.internalRemarks,
  });
});

export const verifyCandidateDocument = asyncHandler(async (req, res) => {
  const { id, docId } = req.params;
  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { candidateId: id }] } : { candidateId: id };

  const candidate = await Candidate.findOne(query);
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found." });
  }

  const doc = (candidate.documents || []).find((d) => d.id === docId || d._id?.toString() === docId);
  if (!doc) {
    return res.status(404).json({ success: false, message: "Document not found." });
  }

  doc.status = "Verified";
  doc.verifiedAt = new Date();
  doc.verifiedBy = req.user?.name || "Admin";
  doc.rejectionReason = "";

  const docs = candidate.documents || [];
  const anyRejected = docs.some((d) => d.status === "Re-upload Required" || d.status === "Rejected");

  if (anyRejected) {
    candidate.documentStatus = "Re-upload Required";
    candidate.jobApplicationAccess = "Locked";
  } else {
    candidate.documentStatus = "Verified";
    candidate.jobApplicationAccess = "Unlocked";
    if (candidate.profile) {
      candidate.profile.profileCompleted = true;
      candidate.profile.profileCompletionPercent = Math.max(
        candidate.profile.profileCompletionPercent || 0,
        100
      );
    }
  }

  await candidate.save();

  try {
    await ActivityLog.create({
      action: "VERIFY_DOCUMENT",
      module: "CANDIDATE",
      targetId: candidate.candidateId,
      description: `Document "${doc.name}" verified for candidate ${candidate.fullName} by ${doc.verifiedBy}.`,
      performedBy: doc.verifiedBy,
      performedByRole: "admin",
    });
  } catch {}

  emitCandidateSync(candidate);

  return res.status(200).json({
    success: true,
    message: `Document "${doc.name}" has been verified.`,
    candidate: candidate.toJSON(),
  });
});

export const rejectCandidateDocument = asyncHandler(async (req, res) => {
  const { id, docId } = req.params;
  const { rejectionReason, markAsRejected } = req.body;

  if (!rejectionReason || !String(rejectionReason).trim()) {
    return res.status(400).json({ success: false, message: "Rejection reason is mandatory." });
  }

  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { candidateId: id }] } : { candidateId: id };

  const candidate = await Candidate.findOne(query);
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found." });
  }

  const doc = (candidate.documents || []).find((d) => d.id === docId || d._id?.toString() === docId);
  if (!doc) {
    return res.status(404).json({ success: false, message: "Document not found." });
  }

  doc.status = markAsRejected ? "Rejected" : "Re-upload Required";
  doc.rejectionReason = String(rejectionReason).trim();
  doc.verifiedAt = new Date();
  doc.verifiedBy = req.user?.name || "Admin";

  candidate.documentStatus = "Re-upload Required";
  candidate.jobApplicationAccess = "Locked";

  await candidate.save();

  try {
    await ActivityLog.create({
      action: "REJECT_DOCUMENT",
      module: "CANDIDATE",
      targetId: candidate.candidateId,
      description: `Document "${doc.name}" rejected for candidate ${candidate.fullName}. Reason: ${doc.rejectionReason}`,
      performedBy: doc.verifiedBy,
      performedByRole: "admin",
    });
  } catch {}

  emitCandidateSync(candidate);

  return res.status(200).json({
    success: true,
    message: `Document marked as ${doc.status}. Candidate notified to re-upload.`,
    candidate: candidate.toJSON(),
  });
});

export const getCandidateApplications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15, status, search = "" } = req.query;

  const query = {};

  if (status && status !== "All") {
    if (status === "Interviews") {
      query.status = { $in: ["Interview Scheduled", "Interview Rescheduled", "Interview Completed"] };
    } else if (status === "Selected") {
      query.status = {
        $in: [
          "Selected",
          "Processing",
          "Offer Released",
          "Offer Accepted",
          "Visa Processing",
          "Visa Issued",
          "Visa Allotted",
          "Joined",
          "Deployed",
          "Completed",
        ],
      };
    } else {
      query.status = status;
    }
  }

  if (search && String(search).trim()) {
    const regex = new RegExp(escapeRegex(String(search).trim()), "i");
    query.$or = [
      { applicationId: regex },
      { candidateId: regex },
      { candidateName: regex },
      { candidateEmail: regex },
      { projectName: regex },
      { position: regex },
      { destinationCountry: regex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [applications, total] = await Promise.all([
    CandidateApplication.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    CandidateApplication.countDocuments(query),
  ]);

  return res.status(200).json({
    success: true,
    applications,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
    },
  });
});

export const getDefaultCandidateMilestones = () => [];

export const getMilestonesForApplication = async (app) => {
  try {
    const project = app?.projectId
      ? await findProjectAcrossSources(app.projectId)
      : null;

    let targetProject = project;
    if (!targetProject && app?.projectName) {
      const clients = await CrmOverseasClient.find({}).lean();
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
    }

    if (targetProject) {
      const resolved = resolveProjectMilestonesData(
        targetProject,
        app?.processMilestones || [],
        Boolean(app?.milestonesOverridden)
      );
      if (resolved.processMilestones.length > 0 || resolved.totalAmount > 0) {
        return {
          processMilestones: resolved.processMilestones,
          paymentPlan: {
            totalAmount: resolved.totalAmount,
            currency: app?.paymentPlan?.currency || "INR",
            milestones: resolved.processMilestones,
          },
        };
      }
    }
  } catch (err) {
    console.error("Error finding project milestones:", err);
  }

  const existing = normalizeMilestoneStages(app?.processMilestones || []);
  const totalAmount = existing.reduce(
    (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
    0
  );
  return {
    processMilestones: existing,
    paymentPlan: {
      totalAmount,
      currency: app?.paymentPlan?.currency || "INR",
      milestones: existing,
    },
  };
};

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, remarks, rejectionReason } = req.body;

  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { applicationId: id }] } : { applicationId: id };

  const app = await CandidateApplication.findOne(query);
  if (!app) {
    return res.status(404).json({ success: false, message: "Application not found." });
  }

  const lockState = await checkApplicationRefundLock(app);
  if (lockState.locked) {
    return res.status(409).json({
      success: false,
      message: `Action locked: candidate has an active refund claim (${lockState.refundStatus || "Pending Admin Approval"}). Resolve or reject the refund claim first.`,
    });
  }

  const validStatuses = [
    "Applied",
    "Shortlisted",
    "Interview Scheduled",
    "Interview Rescheduled",
    "Interview Completed",
    "Selected",
    "Rejected",
    "No Show",
  ];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid application status." });
  }

  const previousStatus = app.status;
  if (status) app.status = status;
  if (remarks !== undefined) app.adminRemarks = remarks;
  if (rejectionReason !== undefined) app.rejectionReason = rejectionReason;

  if (status === "Selected" && !(app.milestonesOverridden)) {
    const plan = await getMilestonesForApplication(app);
    if (plan.processMilestones.length > 0) {
      app.processMilestones = plan.processMilestones;
      app.paymentPlan = plan.paymentPlan;
    } else if (!app.paymentPlan) {
      app.paymentPlan = { totalAmount: 0, currency: "INR", milestones: [] };
    }
    if (!Array.isArray(app.payments)) {
      app.payments = [];
    }
  }

  app.statusHistory.push({
    status: status || app.status,
    updatedBy: req.user?.name || "Admin",
    note: remarks || rejectionReason || `Status updated to ${status}`,
    date: new Date(),
  });

  await app.save();

  if (status === "Selected" && previousStatus !== "Selected") {
    try {
      const actorMeta = resolveActorInfo(req.user);
      await CrmNotification.create({
        notificationId: `notif-cand-${Date.now()}`,
        recipientRole: "CANDIDATE",
        candidateId: app.candidateId,
        actorId: actorMeta.actorId,
        actorRole: actorMeta.actorRole,
        title: "Congratulations! You are Selected! 🎉",
        message: `You have been selected for ${app.projectName} (${app.position || "Specialist"}). Your deployment milestone process has commenced!`,
        link: "/candidate/dashboard",
        type: "success",
      });

      await NotificationService.notifyStaffAction({
        actor: req.user,
        type: "UPDATE",
        title: "Direct Candidate Selected 🎉",
        message: `${app.candidateName} has been selected for ${app.projectName} (${app.position || "Specialist"}). Milestone workflow initiated.`,
        moduleScope: "CANDIDATE",
        targetVendorId: app.vendorId && app.vendorId !== "DIRECT" ? app.vendorId : null,
        metadata: {
          candidateId: app.candidateId,
          applicationId: app.applicationId,
          link: `/admin/candidates/milestones-manage?appId=${app.applicationId}`,
        },
      });

      await CrmNotification.create({
        notificationId: `notif-adm-${Date.now()}`,
        recipientRole: actorMeta.actorRole === "ADMIN" ? "SUPER_ADMIN" : "ADMIN",
        actorId: actorMeta.actorId,
        actorRole: actorMeta.actorRole,
        vendorId: app.vendorId && app.vendorId !== "DIRECT" ? String(app.vendorId) : null,
        title: "Candidate Selected & Milestones Initiated 🎯",
        message: `${app.candidateName} on "${app.projectName}" is now marked Selected. Milestones & processing stages are active.`,
        link: `/admin/candidates/milestones-manage?appId=${app.applicationId}`,
        type: "success",
      });

      await sendCandidateSelectionEmail({
        to: app.candidateEmail,
        candidateName: app.candidateName,
        projectName: app.projectName,
        position: app.position,
        totalAmount: app.paymentPlan?.totalAmount || 0,
      });
    } catch (notifErr) {
      console.warn("Notification error during candidate selection:", notifErr);
    }
  }

  try {
    await ActivityLog.create({
      action: "UPDATE_APPLICATION_STATUS",
      module: "CANDIDATE",
      targetId: app.applicationId,
      description: `Application ${app.applicationId} for candidate ${app.candidateName} updated to "${app.status}"`,
      performedBy: req.user?.name || "Admin",
      performedByRole: "admin",
    });
  } catch {}

  emitCandidateSync(app);

  return res.status(200).json({
    success: true,
    message: `Application updated to ${app.status}.`,
    application: app.toJSON(),
  });
});

export const scheduleCandidateInterview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { scheduledDate, scheduledTime, mode, locationOrLink, interviewerName, remarks } = req.body;

  if (!scheduledDate || !scheduledTime) {
    return res.status(400).json({ success: false, message: "Interview date and time are required." });
  }

  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { applicationId: id }] } : { applicationId: id };

  const app = await CandidateApplication.findOne(query);
  if (!app) {
    return res.status(404).json({ success: false, message: "Application not found." });
  }

  const lockState = await checkApplicationRefundLock(app);
  if (lockState.locked) {
    return res.status(409).json({
      success: false,
      message: `Action locked: candidate has an active refund claim (${lockState.refundStatus || "Pending Admin Approval"}).`,
    });
  }

  const isReschedule = app.status === "Interview Scheduled" || app.status === "Interview Rescheduled";
  app.status = isReschedule ? "Interview Rescheduled" : "Interview Scheduled";

  app.interview = {
    scheduledDate,
    scheduledTime,
    mode: mode || "Video Call",
    locationOrLink: locationOrLink || "",
    interviewerName: interviewerName || req.user?.name || "Immigo Recruiter",
    remarks: remarks || "",
    updatedAt: new Date(),
  };

  app.statusHistory.push({
    status: app.status,
    updatedBy: req.user?.name || "Admin",
    note: `Interview scheduled on ${scheduledDate} at ${scheduledTime} (${app.interview.mode})`,
    date: new Date(),
  });

  await app.save();

  try {
    await sendCandidateInterviewEmail({
      to: app.candidateEmail,
      candidateName: app.candidateName,
      projectName: app.projectName,
      position: app.position,
      interview: app.interview,
    });
  } catch {}

  try {
    await ActivityLog.create({
      action: "SCHEDULE_INTERVIEW",
      module: "CANDIDATE",
      targetId: app.applicationId,
      description: `Interview scheduled for candidate ${app.candidateName} on ${scheduledDate} at ${scheduledTime}`,
      performedBy: req.user?.name || "Admin",
      performedByRole: "admin",
    });
  } catch {}

  emitCandidateSync(app);

  return res.status(200).json({
    success: true,
    message: `Interview has been scheduled and details sent to ${app.candidateEmail}.`,
    application: app.toJSON(),
  });
});

export const getApplicationMilestones = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { applicationId: id }] } : { applicationId: id };

  let app = await CandidateApplication.findOne(query);
  if (!app) {
    const crmApp = await CrmCandidateApplication.findOne(query).lean();
    if (!crmApp) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }
    app = await CandidateApplication.create({
      applicationId: crmApp.applicationId || crmApp._id.toString(),
      candidateId: String(crmApp.candidateId || ""),
      candidateName: crmApp.candidateName || "Candidate",
      candidateEmail:
        crmApp.candidateData?.email && !String(crmApp.candidateData.email).includes("@candidate.local")
          ? crmApp.candidateData.email
          : "",
      candidatePhone: crmApp.candidateData?.phone || "",
      projectId: String(crmApp.projectId || ""),
      projectName: crmApp.projectName || "Overseas Project",
      clientId: String(crmApp.clientId || ""),
      clientName: crmApp.clientName || "",
      position: crmApp.position || "",
      vendorId: String(crmApp.vendorId || ""),
      vendorName: crmApp.vendorName || "",
      recruitmentStage: crmApp.status || "Selected",
      status: crmApp.status || "Selected",
      processMilestones: Array.isArray(crmApp.processMilestones) ? crmApp.processMilestones : [],
      paymentPlan: crmApp.paymentPlan || { totalAmount: 0, currency: "INR", milestones: [] },
    });
  }

  if (!app.milestonesOverridden) {
    const plan = await getMilestonesForApplication(app);
    if (plan.processMilestones.length > 0) {
      app.processMilestones = plan.processMilestones;
      app.paymentPlan = plan.paymentPlan;
      if (!Array.isArray(app.payments)) {
        app.payments = [];
      }
      app.markModified("processMilestones");
      app.markModified("paymentPlan");
      await app.save();
    }
  }

  return res.status(200).json({
    success: true,
    application: app.toJSON(),
    processMilestones: app.processMilestones,
    paymentPlan: app.paymentPlan,
    payments: app.payments || [],
  });
});

export const updateApplicationMilestones = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { totalAmount, milestones } = req.body;

  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { applicationId: id }] } : { applicationId: id };

  const app = await CandidateApplication.findOne(query);
  if (!app) {
    return res.status(404).json({ success: false, message: "Application not found." });
  }

  const lockState = await checkApplicationRefundLock(app);
  if (lockState.locked) {
    return res.status(409).json({
      success: false,
      message: `Action locked: candidate has an active refund claim (${lockState.refundStatus || "Pending Admin Approval"}).`,
    });
  }

  const rawFormatted = (milestones || []).map((m, mIdx) => {
    const isPaid = m.status === "Paid" || m.paymentStatus === "Approved" || m.status === "Completed";
    const amt = Number(m.paymentAmount ?? m.amount ?? 0);
    return {
      id: m.id || `m${mIdx}`,
      name: m.name || `Milestone ${mIdx + 1}`,
      amount: amt,
      paymentAmount: amt,
      status: m.status || (isPaid ? "Completed" : mIdx === 0 ? (amt > 0 ? "Payment Required" : "Active") : "Locked"),
      paymentStatus: isPaid ? "Approved" : amt === 0 ? "Not Required" : m.paymentStatus || (mIdx === 0 ? "Payment Required" : "Locked"),
      paymentDate: m.paymentDate || (isPaid ? new Date().toISOString().split("T")[0] : null),
      paymentRef: m.paymentRef || null,
      approvedBy: isPaid ? (m.approvedBy || req.user?.name || "Admin") : null,
      clearanceDocuments: Array.isArray(m.clearanceDocuments) ? m.clearanceDocuments : [],
      stages: (m.stages || []).map((s, sIdx) => ({
        id: s.id || `s${mIdx}_${sIdx}`,
        name: s.name || `Process Step ${sIdx + 1}`,
        status: s.status || "Pending",
        remark: s.remark || "",
        completedAt: s.completedAt || null,
        document: s.document || null,
      })),
    };
  });

  const formattedMilestones = normalizeMilestoneStages(rawFormatted);
  const sumMilestones = formattedMilestones.reduce(
    (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
    0
  );
  const finalTotal =
    sumMilestones > 0
      ? sumMilestones
      : totalAmount !== undefined && totalAmount !== null && totalAmount !== ""
      ? Number(totalAmount)
      : 0;
  const shouldMarkOverridden = req.body?.customized !== false;

  app.paymentPlan = {
    totalAmount: finalTotal,
    currency: "INR",
    milestones: formattedMilestones,
  };
  app.processMilestones = formattedMilestones;
  if (shouldMarkOverridden) {
    app.set("milestonesOverridden", true);
  }
  app.markModified("paymentPlan");
  app.markModified("processMilestones");

  await app.save();

  try {
    const syncSet = {
      processMilestones: formattedMilestones,
      paymentPlan: app.paymentPlan,
    };
    if (shouldMarkOverridden) {
      syncSet.milestonesOverridden = true;
    }
    await CrmCandidateApplication.findOneAndUpdate(
      { applicationId: app.applicationId },
      {
        $set: syncSet,
      }
    );
  } catch {}

  try {
    const actorMeta = resolveActorInfo(req.user);
    await CrmNotification.create({
      notificationId: `notif-cand-${Date.now()}`,
      recipientRole: "CANDIDATE",
      candidateId: app.candidateId,
      actorId: actorMeta.actorId,
      actorRole: actorMeta.actorRole,
      title: "Milestone Plan Configured 📋",
      message: `Your processing milestone plan for ${app.projectName} (Total Fee: ₹${Number(finalTotal).toLocaleString()}) has been updated. Milestone 1 is active.`,
      link: "/candidate/dashboard",
      type: "info",
    });

    await NotificationService.notifyStaffAction({
      actor: req.user,
      type: "UPDATE",
      title: "Direct Candidate Milestones Configured",
      message: `Milestone plan updated for ${app.candidateName} on ${app.projectName} (₹${Number(finalTotal).toLocaleString()})`,
      moduleScope: "CANDIDATE",
      targetVendorId: app.vendorId && app.vendorId !== "DIRECT" && app.vendorId !== "undefined" ? app.vendorId : null,
      metadata: {
        candidateId: app.candidateId,
        applicationId: app.applicationId,
        link: `/admin/candidates/milestones-manage?appId=${app.applicationId}`,
      },
    });

    if (app.vendorId && app.vendorId !== "DIRECT" && app.vendorId !== "undefined") {
      await CrmNotification.create({
        notificationId: `notif-vnd-${Date.now()}`,
        recipientRole: "VENDOR",
        vendorId: String(app.vendorId),
        actorId: actorMeta.actorId,
        actorRole: actorMeta.actorRole,
        title: "Candidate Milestones & Documents Updated 📋",
        message: `Milestone progress and clearance documents updated for candidate ${app.candidateName} on "${app.projectName}".`,
        link: `/vendor/candidates`,
        type: "info",
      });
    }

    await ActivityLog.create({
      action: "UPDATE_MILESTONES",
      module: "CANDIDATE",
      targetId: app.applicationId,
      description: `Configured ${formattedMilestones.length} milestones for ${app.candidateName} on ${app.projectName}`,
      performedBy: req.user?.name || "Admin",
      performedByRole: "admin",
    });
  } catch {}

  emitCandidateSync(app);

  return res.status(200).json({
    success: true,
    message: "Milestones and processing stages successfully updated.",
    application: app.toJSON(),
  });
});

export const updateStageStatus = asyncHandler(async (req, res) => {
  const { id, milestoneId, stageId } = req.params;
  const { status, remark, document } = req.body;

  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { applicationId: id }] } : { applicationId: id };

  const app = await CandidateApplication.findOne(query);
  if (!app) {
    return res.status(404).json({ success: false, message: "Application not found." });
  }

  const lockState = await checkApplicationRefundLock(app);
  if (lockState.locked) {
    return res.status(409).json({
      success: false,
      message: `Action locked: candidate has an active refund claim (${lockState.refundStatus || "Pending Admin Approval"}). Processing stages are frozen.`,
    });
  }

  const milestones = [...(app.processMilestones || [])];
  const mIdx = milestones.findIndex((m) => String(m.id) === String(milestoneId));
  if (mIdx === -1) {
    return res.status(404).json({ success: false, message: "Milestone not found." });
  }

  const stages = [...(milestones[mIdx].stages || [])];
  const sIdx = stages.findIndex((s) => String(s.id) === String(stageId));
  if (sIdx === -1) {
    return res.status(404).json({ success: false, message: "Stage not found." });
  }

  const prevStatus = stages[sIdx].status;
  if (status) stages[sIdx].status = status;
  if (remark !== undefined) stages[sIdx].remark = remark;
  if (document !== undefined) stages[sIdx].document = document;

  if (status === "Completed") {
    stages[sIdx].completedAt = new Date().toISOString();
    if (sIdx + 1 < stages.length) {
      if (stages[sIdx + 1].status === "Locked" || stages[sIdx + 1].status === "Pending") {
        stages[sIdx + 1].status = "In Progress";
      }
    }
  } else if (prevStatus === "Completed" && status !== "Completed") {
    stages[sIdx].completedAt = null;
  }

  milestones[mIdx].stages = stages;

  const allStagesCompleted = stages.every((s) => s.status === "Completed");
  if (allStagesCompleted) {
    milestones[mIdx].status = "Completed";
    if (mIdx + 1 < milestones.length) {
      const nextM = milestones[mIdx + 1];
      const nextAmt = Number(nextM.amount || nextM.paymentAmount || 0);
      const isNextPaid = nextM.paymentStatus === "Approved" || nextM.status === "Paid";

      if (isNextPaid || nextAmt === 0) {
        nextM.status = "Active";
        if (!isNextPaid) nextM.paymentStatus = "Not Required";
        if (Array.isArray(nextM.stages) && nextM.stages.length > 0) {
          nextM.stages.forEach((stg, idx) => {
            if (stg.status === "Locked") {
              stg.status = idx === 0 ? "In Progress" : "Pending";
            } else if (idx === 0 && stg.status === "Pending") {
              stg.status = "In Progress";
            }
          });
        }
      } else {
        nextM.status = "Payment Required";
        nextM.paymentStatus = "Payment Required";
      }
    } else {
      app.status = "Selected";
      app.deploymentStatus = "Deployed";
    }
  }

  app.processMilestones = normalizeMilestoneStages(milestones);
  if (app.paymentPlan) {
    app.paymentPlan.milestones = app.processMilestones;
  }
  app.markModified("processMilestones");
  app.markModified("paymentPlan");

  await app.save();

  try {
    await CrmCandidateApplication.findOneAndUpdate(
      { applicationId: app.applicationId },
      {
        $set: {
          processMilestones: app.processMilestones,
          paymentPlan: app.paymentPlan,
        },
      }
    );
  } catch {}

  try {
    const actorMeta = resolveActorInfo(req.user);
    const stageTitle = stages[sIdx].name;
    await CrmNotification.create({
      notificationId: `notif-cand-${Date.now()}`,
      recipientRole: "CANDIDATE",
      candidateId: app.candidateId,
      actorId: actorMeta.actorId,
      actorRole: actorMeta.actorRole,
      title: `Processing Step: ${status || "Updated"} 🚀`,
      message: `"${stageTitle}" on project ${app.projectName} is now ${status}. ${remark ? `Note: ${remark}` : ""}`,
      link: "/candidate/dashboard",
      type: status === "Completed" ? "success" : "info",
    });

    await NotificationService.notifyStaffAction({
      actor: req.user,
      type: "UPDATE",
      title: `Candidate Stage ${status}`,
      message: `${app.candidateName} - ${stageTitle} marked ${status} by ${req.user?.name || "Admin"}`,
      moduleScope: "CANDIDATE",
      targetVendorId: app.vendorId && app.vendorId !== "DIRECT" && app.vendorId !== "undefined" ? app.vendorId : null,
      metadata: {
        candidateId: app.candidateId,
        applicationId: app.applicationId,
        link: `/admin/candidates/milestones-manage?appId=${app.applicationId}`,
      },
    });

    await sendCandidateMilestoneUpdateEmail({
      to: app.candidateEmail,
      candidateName: app.candidateName,
      projectName: app.projectName,
      milestoneName: milestones[mIdx].name,
      stageName: stageTitle,
      stageStatus: status,
      remarks: remark,
    });
  } catch (notifErr) {
    console.warn("Notification error during stage update:", notifErr);
  }

  emitCandidateSync(app);

  return res.status(200).json({
    success: true,
    message: "Stage updated successfully.",
    application: app.toJSON(),
  });
});

export const recordApplicationPayment = asyncHandler(async (req, res) => {
  const { id, milestoneId } = req.params;
  const { amount, paymentMode = "Bank Transfer", referenceNumber = "", paymentDate, remarks = "" } = req.body;

  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { applicationId: id }] } : { applicationId: id };

  const app = await CandidateApplication.findOne(query);
  if (!app) {
    return res.status(404).json({ success: false, message: "Application not found." });
  }

  const lockState = await checkApplicationRefundLock(app);
  if (lockState.locked) {
    return res.status(409).json({
      success: false,
      message: `Action locked: candidate has an active refund claim (${lockState.refundStatus || "Pending Admin Approval"}). Processing stages are frozen.`,
    });
  }

  const milestones = [...(app.processMilestones || [])];
  const mIdx = milestones.findIndex((m) => String(m.id) === String(milestoneId));
  if (mIdx === -1) {
    return res.status(404).json({ success: false, message: "Milestone not found." });
  }

  const paidAmt =
    amount !== undefined && amount !== null && amount !== "" && !isNaN(Number(amount))
      ? Number(amount)
      : Number(milestones[mIdx].paymentAmount ?? milestones[mIdx].amount ?? 0);
  const isCash = String(paymentMode).toLowerCase().includes("cash");
  const refNum = referenceNumber.trim() || (isCash ? `CASH-${Date.now().toString().slice(-6)}` : `REF-${Date.now().toString().slice(-6)}`);
  const receiptNum = `INV-${app.applicationId || app.id}-${milestoneId}`;
  const payDate = paymentDate || new Date().toISOString().split("T")[0];

  milestones[mIdx].paymentStatus = "Approved";
  milestones[mIdx].status = "Active";
  milestones[mIdx].paymentAmount = paidAmt;
  milestones[mIdx].paymentMode = paymentMode;
  milestones[mIdx].paymentRef = refNum;
  milestones[mIdx].paymentDate = payDate;
  milestones[mIdx].approvedBy = req.user?.name || "Admin";
  milestones[mIdx].paymentRemark = remarks || `Payment (${paymentMode}) recorded & verified by ${req.user?.name || "Admin"}`;

  if (Array.isArray(milestones[mIdx].stages) && milestones[mIdx].stages.length > 0) {
    milestones[mIdx].stages.forEach((stg, sIdx) => {
      if (stg.status === "Locked") {
        stg.status = sIdx === 0 ? "In Progress" : "Pending";
      } else if (sIdx === 0 && stg.status === "Pending") {
        stg.status = "In Progress";
      }
    });
  }

  if (!Array.isArray(app.payments)) {
    app.payments = [];
  }

  const paymentRecord = {
    id: `pay-${Date.now()}`,
    milestoneId: milestoneId,
    milestoneName: milestones[mIdx].name,
    amount: paidAmt,
    paymentMode,
    referenceNumber: refNum,
    receiptNumber: receiptNum,
    paymentDate: payDate,
    status: "Verified",
    verifiedBy: req.user?.name || "Admin",
    notes: remarks || "Milestone payment approved by Admin",
    createdAt: new Date(),
  };

  app.payments.push(paymentRecord);
  app.processMilestones = normalizeMilestoneStages(milestones);
  if (app.paymentPlan) {
    app.paymentPlan.milestones = app.processMilestones;
  }
  app.markModified("processMilestones");
  app.markModified("paymentPlan");
  app.markModified("payments");

  await app.save();

  try {
    await CrmCandidateApplication.findOneAndUpdate(
      { applicationId: app.applicationId },
      {
        $set: {
          processMilestones: app.processMilestones,
          paymentPlan: app.paymentPlan,
        },
      }
    );
  } catch {}

  try {
    const actorMeta = resolveActorInfo(req.user);
    await CrmNotification.create({
      notificationId: `notif-cand-${Date.now()}`,
      recipientRole: "CANDIDATE",
      candidateId: app.candidateId,
      actorId: actorMeta.actorId,
      actorRole: actorMeta.actorRole,
      title: "Payment Received & Verified! 💳",
      message: `Payment of ₹${Number(paidAmt).toLocaleString()} for "${milestones[mIdx].name}" has been verified. Processing stages are active.`,
      link: `/invoice/${app.applicationId}/${milestoneId}`,
      type: "success",
    });

    await NotificationService.notifyStaffAction({
      actor: req.user,
      type: "UPDATE",
      title: "Milestone Payment Recorded",
      message: `₹${Number(paidAmt).toLocaleString()} received for ${app.candidateName} (${milestones[mIdx].name})`,
      moduleScope: "CANDIDATE",
      targetVendorId: app.vendorId && app.vendorId !== "DIRECT" && app.vendorId !== "undefined" ? app.vendorId : null,
      metadata: {
        candidateId: app.candidateId,
        applicationId: app.applicationId,
        link: `/admin/candidates/milestones-manage?appId=${app.applicationId}`,
      },
    });

    await sendCandidatePaymentReceiptEmail({
      to: app.candidateEmail,
      candidateName: app.candidateName,
      projectName: app.projectName,
      milestoneName: milestones[mIdx].name,
      amount: paidAmt,
      receiptNumber: receiptNum,
      paymentMode,
    });

    await ActivityLog.create({
      action: "RECORD_PAYMENT",
      module: "CANDIDATE",
      targetId: app.applicationId,
      description: `Recorded payment of ₹${Number(paidAmt).toLocaleString()} for ${app.candidateName} (${milestones[mIdx].name})`,
      performedBy: req.user?.name || "Admin",
      performedByRole: "admin",
    });
  } catch (notifErr) {
    console.warn("Notification error during payment recording:", notifErr);
  }

  emitCandidateSync(app);

  return res.status(200).json({
    success: true,
    message: "Payment successfully recorded and receipt generated.",
    application: app.toJSON(),
    receiptNumber: receiptNum,
    payment: paymentRecord,
  });
});

export const deleteCandidate = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { candidateId: id }] } : { candidateId: id };

  const candidate = await Candidate.findOne(query);
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found." });
  }

  await CandidateApplication.deleteMany({
    $or: [{ candidateId: candidate.candidateId }, { candidate: candidate._id }],
  });

  try {
    await ActivityLog.create({
      action: "DELETE_CANDIDATE",
      module: "CANDIDATE",
      targetId: candidate.candidateId,
      description: `Deleted candidate ${candidate.fullName} (${candidate.candidateId})`,
      performedBy: req.user?.name || req.user?.email || "Admin",
      performedByRole: "admin",
    });
  } catch (logErr) {
    console.warn("Failed to log activity for candidate deletion:", logErr);
  }

  await Candidate.deleteOne({ _id: candidate._id });

  emitCandidateSync(candidate);

  return res.status(200).json({
    success: true,
    message: `Candidate ${candidate.fullName} (${candidate.candidateId}) deleted successfully.`,
  });
});
