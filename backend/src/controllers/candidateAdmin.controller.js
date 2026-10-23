import Candidate from "../models/Candidate.js";
import CandidateApplication from "../models/CandidateApplication.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";
import CrmNotification from "../models/CrmNotification.js";
import CrmOverseasClient from "../models/CrmOverseasClient.js";
import { asyncHandler } from "../utils/asyncHandler.js";
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

export const getDefaultCandidateMilestones = () => [
  {
    id: "m0",
    name: "Milestone 1: Selection & Document Clearance",
    paymentAmount: 15000,
    amount: 15000,
    paymentStatus: "Payment Required",
    status: "Active",
    stages: [
      {
        id: "s0_1",
        name: "Trade Skill & Technical Screening",
        status: "Completed",
        completedAt: new Date().toISOString(),
        remark: "Candidate cleared technical assessment",
        document: null,
      },
      {
        id: "s0_2",
        name: "Client Selection & Offer Letter Clearance",
        status: "In Progress",
        completedAt: null,
        remark: "Offer letter issued and cleared",
        document: null,
      },
      {
        id: "s0_3",
        name: "Document Verification & Attestation",
        status: "Pending",
        completedAt: null,
        remark: "",
        document: null,
      },
    ],
  },
  {
    id: "m1",
    name: "Milestone 2: Medical & Visa Processing",
    paymentAmount: 15000,
    amount: 15000,
    paymentStatus: "Locked",
    status: "Locked",
    stages: [
      {
        id: "s1_1",
        name: "GAMCA Medical Fitness Clearance",
        status: "Locked",
        completedAt: null,
        remark: "",
        document: null,
      },
      {
        id: "s1_2",
        name: "Visa Application & Official Work Permit",
        status: "Locked",
        completedAt: null,
        remark: "",
        document: null,
      },
    ],
  },
  {
    id: "m2",
    name: "Milestone 3: Emigration Clearance & Flight Deployment",
    paymentAmount: 10000,
    amount: 10000,
    paymentStatus: "Locked",
    status: "Locked",
    stages: [
      {
        id: "s2_1",
        name: "Emigration Clearance (Poe/Protector)",
        status: "Locked",
        completedAt: null,
        remark: "",
        document: null,
      },
      {
        id: "s2_2",
        name: "Air Ticket Booking & Travel Insurance",
        status: "Locked",
        completedAt: null,
        remark: "",
        document: null,
      },
      {
        id: "s2_3",
        name: "Airport Mobilization & Deployment",
        status: "Locked",
        completedAt: null,
        remark: "",
        document: null,
      },
    ],
  },
];

export const getMilestonesForApplication = async (app) => {
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
      const synced = pMilestones.map((pm, mIdx) => {
        const amt = Number(pm.amount || pm.paymentAmount || 0);
        const stages = (Array.isArray(pm.stages) && pm.stages.length > 0
          ? pm.stages
          : [{ id: `s${mIdx}_1`, name: `${pm.name || `Milestone ${mIdx + 1}`} Verification` }]
        ).map((stg, sIdx) => ({
          id: String(stg.id || `s${mIdx}_${sIdx}`),
          name: stg.name || `Stage ${sIdx + 1}`,
          status: mIdx === 0 && sIdx === 0 && amt === 0 ? "In Progress" : "Locked",
          completedAt: null,
          remark: "",
        }));

        return {
          id: String(pm.id || `m${mIdx}`),
          name: pm.name || `Milestone ${mIdx + 1}`,
          amount: amt,
          paymentAmount: amt,
          paymentStatus: mIdx === 0 && amt > 0 ? "Payment Required" : "Not Required",
          status: mIdx === 0 ? "Active" : "Locked",
          paymentDate: null,
          paymentRef: null,
          paymentRemark: "",
          approvedBy: null,
          stages,
        };
      });

      const totalAmt = synced.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
      return {
        processMilestones: synced,
        paymentPlan: {
          totalAmount: totalAmt,
          currency: "INR",
          milestones: synced,
        },
      };
    }
  } catch (err) {
    console.error("Error finding project milestones:", err);
  }

  const defaults = getDefaultCandidateMilestones();
  return {
    processMilestones: defaults,
    paymentPlan: {
      totalAmount: 40000,
      currency: "INR",
      milestones: defaults,
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

  if (status === "Selected" && (!app.processMilestones || app.processMilestones.length === 0)) {
    const plan = await getMilestonesForApplication(app);
    app.processMilestones = plan.processMilestones;
    app.paymentPlan = plan.paymentPlan;
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
      await CrmNotification.create({
        notificationId: `notif-cand-${Date.now()}`,
        recipientRole: "CANDIDATE",
        candidateId: app.candidateId,
        title: "Congratulations! You are Selected! 🎉",
        message: `You have been selected for ${app.projectName} (${app.position || "Specialist"}). Your deployment milestone process has commenced!`,
        link: "/candidate/dashboard",
        type: "success",
      });

      await Notification.create({
        type: "UPDATE",
        title: "Direct Candidate Selected 🎉",
        message: `${app.candidateName} has been selected for ${app.projectName} (${app.position || "Specialist"}). Milestone workflow initiated.`,
        targetRole: "ADMIN",
        targetType: "ALL",
      });

      await CrmNotification.create({
        notificationId: `notif-adm-${Date.now()}`,
        recipientRole: "ADMIN",
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
        totalAmount: app.paymentPlan?.totalAmount || 40000,
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

export const getApplicationMilestones = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  const query = isObjectId ? { $or: [{ _id: id }, { applicationId: id }] } : { applicationId: id };

  let app = await CandidateApplication.findOne(query);
  if (!app) {
    return res.status(404).json({ success: false, message: "Application not found." });
  }

  if (!app.processMilestones || app.processMilestones.length === 0) {
    const plan = await getMilestonesForApplication(app);
    app.processMilestones = plan.processMilestones;
    app.paymentPlan = plan.paymentPlan;
    if (!Array.isArray(app.payments)) {
      app.payments = [];
    }
    await app.save();
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

  const finalTotal = Number(totalAmount) || 40000;
  const formattedMilestones = (milestones || []).map((m, mIdx) => {
    const isPaid = m.status === "Paid" || m.paymentStatus === "Approved" || m.status === "Completed";
    const amt = Number(m.amount || m.paymentAmount || 0);
    return {
      id: m.id || `m${mIdx}`,
      name: m.name || `Milestone ${mIdx + 1}`,
      amount: amt,
      paymentAmount: amt,
      status: m.status || (isPaid ? "Completed" : mIdx === 0 ? "Active" : "Locked"),
      paymentStatus: isPaid ? "Approved" : m.paymentStatus || (mIdx === 0 ? "Payment Required" : "Locked"),
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

  app.paymentPlan = {
    totalAmount: finalTotal,
    currency: "INR",
    milestones: formattedMilestones,
  };
  app.processMilestones = formattedMilestones;
  app.markModified("paymentPlan");
  app.markModified("processMilestones");

  await app.save();

  try {
    await CrmNotification.create({
      notificationId: `notif-cand-${Date.now()}`,
      recipientRole: "CANDIDATE",
      candidateId: app.candidateId,
      title: "Milestone Plan Configured 📋",
      message: `Your processing milestone plan for ${app.projectName} (Total Fee: ₹${Number(finalTotal).toLocaleString()}) has been updated. Milestone 1 is active.`,
      link: "/candidate/dashboard",
      type: "info",
    });

    await Notification.create({
      type: "UPDATE",
      title: "Direct Candidate Milestones Configured",
      message: `Milestone plan updated for ${app.candidateName} on ${app.projectName} (₹${Number(finalTotal).toLocaleString()})`,
      targetRole: "ADMIN",
      targetType: "ALL",
    });

    await ActivityLog.create({
      action: "UPDATE_MILESTONES",
      module: "CANDIDATE",
      targetId: app.applicationId,
      description: `Configured ${formattedMilestones.length} milestones for ${app.candidateName} on ${app.projectName}`,
      performedBy: req.user?.name || "Admin",
      performedByRole: "admin",
    });
  } catch {}

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

  if (status === "Completed" && prevStatus !== "Completed") {
    stages[sIdx].completedAt = new Date().toISOString();
  }

  milestones[mIdx].stages = stages;

  const allStagesCompleted = stages.every((s) => s.status === "Completed");
  if (allStagesCompleted) {
    milestones[mIdx].status = "Completed";
    if (mIdx + 1 < milestones.length) {
      if (milestones[mIdx + 1].status === "Locked") {
        milestones[mIdx + 1].status =
          (milestones[mIdx + 1].paymentAmount || 0) > 0 ? "Payment Required" : "Active";
        if (milestones[mIdx + 1].paymentStatus === "Locked") {
          milestones[mIdx + 1].paymentStatus =
            (milestones[mIdx + 1].paymentAmount || 0) > 0 ? "Payment Required" : "Not Required";
        }
      }
    }
  }

  app.processMilestones = milestones;
  if (app.paymentPlan) {
    app.paymentPlan.milestones = milestones;
  }
  app.markModified("processMilestones");
  app.markModified("paymentPlan");

  await app.save();

  try {
    const stageTitle = stages[sIdx].name;
    await CrmNotification.create({
      notificationId: `notif-cand-${Date.now()}`,
      recipientRole: "CANDIDATE",
      candidateId: app.candidateId,
      title: `Processing Step: ${status || "Updated"} 🚀`,
      message: `"${stageTitle}" on project ${app.projectName} is now ${status}. ${remark ? `Note: ${remark}` : ""}`,
      link: "/candidate/dashboard",
      type: status === "Completed" ? "success" : "info",
    });

    await Notification.create({
      type: "UPDATE",
      title: `Candidate Stage ${status}`,
      message: `${app.candidateName} - ${stageTitle} marked ${status} by ${req.user?.name || "Admin"}`,
      targetRole: "ADMIN",
      targetType: "ALL",
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

  const milestones = [...(app.processMilestones || [])];
  const mIdx = milestones.findIndex((m) => String(m.id) === String(milestoneId));
  if (mIdx === -1) {
    return res.status(404).json({ success: false, message: "Milestone not found." });
  }

  const paidAmt = Number(amount) || Number(milestones[mIdx].paymentAmount) || 15000;
  const refNum = referenceNumber.trim() || `REF-${Date.now().toString().slice(-6)}`;
  const receiptNum = `INV-${app.applicationId || app.id}-${milestoneId}`;
  const payDate = paymentDate || new Date().toISOString().split("T")[0];

  milestones[mIdx].paymentStatus = "Approved";
  milestones[mIdx].status = "Active";
  milestones[mIdx].paymentAmount = paidAmt;
  milestones[mIdx].paymentRef = refNum;
  milestones[mIdx].paymentDate = payDate;
  milestones[mIdx].approvedBy = req.user?.name || "Admin";
  milestones[mIdx].paymentRemark = remarks || `Payment recorded by ${req.user?.name || "Admin"}`;

  if (Array.isArray(milestones[mIdx].stages) && milestones[mIdx].stages.length > 0) {
    if (milestones[mIdx].stages[0].status === "Locked") {
      milestones[mIdx].stages[0].status = "In Progress";
    }
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
  app.processMilestones = milestones;
  if (app.paymentPlan) {
    app.paymentPlan.milestones = milestones;
  }
  app.markModified("processMilestones");
  app.markModified("paymentPlan");
  app.markModified("payments");

  await app.save();

  try {
    await CrmNotification.create({
      notificationId: `notif-cand-${Date.now()}`,
      recipientRole: "CANDIDATE",
      candidateId: app.candidateId,
      title: "Payment Received & Verified! 💳",
      message: `Payment of ₹${Number(paidAmt).toLocaleString()} for "${milestones[mIdx].name}" has been verified. Processing stages are active.`,
      link: `/invoice/${app.applicationId}/${milestoneId}`,
      type: "success",
    });

    await Notification.create({
      type: "UPDATE",
      title: "Milestone Payment Recorded",
      message: `₹${Number(paidAmt).toLocaleString()} received for ${app.candidateName} (${milestones[mIdx].name})`,
      targetRole: "ADMIN",
      targetType: "ALL",
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

  // Remove linked applications
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

  return res.status(200).json({
    success: true,
    message: `Candidate ${candidate.fullName} (${candidate.candidateId}) deleted successfully.`,
  });
});

