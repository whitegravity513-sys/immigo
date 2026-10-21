import Candidate from "../models/Candidate.js";
import CandidateApplication from "../models/CandidateApplication.js";
import ActivityLog from "../models/ActivityLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  sendCandidateApprovalEmail,
  sendCandidateRejectionEmail,
  sendCandidateInterviewEmail,
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
    const regex = new RegExp(String(search).trim(), "i");
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
  const anyPending = docs.some((d) => d.status === "Pending Verification");
  const hasVerified = docs.some((d) => d.status === "Verified");

  if (anyRejected) {
    candidate.documentStatus = "Re-upload Required";
    candidate.jobApplicationAccess = "Locked";
  } else if (anyPending) {
    candidate.documentStatus = "Pending Verification";
  } else if (hasVerified) {
    candidate.documentStatus = "Verified";
    candidate.jobApplicationAccess = "Unlocked";
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
    } else {
      query.status = status;
    }
  }

  if (search && String(search).trim()) {
    const regex = new RegExp(String(search).trim(), "i");
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

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, remarks, rejectionReason } = req.body;

  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { applicationId: id }] } : { applicationId: id };

  const app = await CandidateApplication.findOne(query);
  if (!app) {
    return res.status(404).json({ success: false, message: "Application not found." });
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

  if (status) app.status = status;
  if (remarks !== undefined) app.adminRemarks = remarks;
  if (rejectionReason !== undefined) app.rejectionReason = rejectionReason;

  app.statusHistory.push({
    status: status || app.status,
    updatedBy: req.user?.name || "Admin",
    note: remarks || rejectionReason || `Status updated to ${status}`,
    date: new Date(),
  });

  await app.save();

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

  return res.status(200).json({
    success: true,
    message: `Interview has been scheduled and details sent to ${app.candidateEmail}.`,
    application: app.toJSON(),
  });
});
