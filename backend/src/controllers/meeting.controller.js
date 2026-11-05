import mongoose from "mongoose";
import Meeting from "../models/Meeting.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import CandidateApplication from "../models/CandidateApplication.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";
import NotificationService from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ROLES } from "../constants/roles.js";

export const logCandidateMeetingActivity = async ({
  meeting,
  actionType,
  previousStatus = "",
  newStatus = "",
  remarks = "",
  updater,
}) => {
  if (!meeting.candidateId) return;

  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const updaterRole = updater?.userRole || updater?.role || "ADMIN";
    const updaterName = updater?.name || updater?.companyName || "System";
    const updaterId = updater?._id?.toString() || updater?.id || updater?.vendorId || "";

    await ActivityLog.create({
      userType: updaterRole === ROLES.VENDOR ? "VENDOR" : "ADMIN",
      userId: updaterId,
      userName: updaterName,
      action: actionType,
      title: `Meeting: ${meeting.title} - ${actionType}`,
      description: remarks || `Meeting [${meeting.title}] updated for candidate ${meeting.candidateName || meeting.candidateId}.`,
      entityType: "Candidate",
      entityId: meeting.candidateId,
      entityName: meeting.candidateName || "Candidate",
      status: newStatus || meeting.status,
      visibility: "ALL",

      candidateId: meeting.candidateId,
      candidateName: meeting.candidateName || "",
      updatedByUserId: updaterId,
      updatedByName: updaterName,
      updatedByRole: updaterRole,
      vendorId: meeting.vendorId || "",
      vendorName: meeting.vendorName || "",
      actionType,
      previousStatus,
      newStatus,
      remarks: remarks || meeting.remarks || meeting.description || "",
      date: dateStr,
      time: timeStr,
      meetingRef: meeting._id.toString(),
      metadata: {
        meetingId: meeting._id.toString(),
        meetingDate: meeting.date,
        meetingTime: meeting.startTime,
        meetingLink: meeting.meetingLink,
        platform: meeting.platform,
        outcome: meeting.outcome || "",
        attendance: meeting.attendance || "",
      },
    });
  } catch (err) {
    console.error("Failed to log candidate meeting activity:", err.message);
  }
};

export const createMeeting = asyncHandler(async (req, res) => {
  const {
    title,
    description = "",
    meetingType = "GENERAL",
    date,
    startTime,
    endTime = "",
    meetingLink,
    platform = "Google Meet",
    targetType = "ALL",
    targetEmployees = [],
    targetVendors = [],
    targetHRs = [],
    attendees = [],
    candidateId = "",
    candidateName = "",
    candidateEmail = "",
    applicationId = "",
    vendorId = "",
    vendorName = "",
    hrId = "",
    hrName = "",
    remarks = "",
  } = req.body;

  if (!title || !date || !startTime || !meetingLink) {
    throw new ApiError(400, "Title, Date, Start Time, and Meeting Link are required.");
  }

  const todayStr = new Date().toISOString().split("T")[0];
  if (date < todayStr) {
    throw new ApiError(
      400,
      "Meeting date cannot be in the past. Please select today or a future date."
    );
  }

  const role = req.userRole || req.user?.role || "ADMIN";
  const isSuperAdmin = req.isSuperAdmin || role === ROLES.SUPER_ADMIN;
  const isVendor = req.isVendor || role === ROLES.VENDOR;
  const hrType = req.hrType || req.user?.hrType || "";
  const isEmployeeHR = role === ROLES.HR && (hrType === "EMPLOYEE_HR" || hrType === "");
  const isVendorHR = role === ROLES.HR && hrType === "VENDOR_HR";

  if (isVendor) {
    if (vendorId && req.vendorId && String(vendorId) !== String(req.vendorId)) {
      throw new ApiError(403, "Vendors can only schedule meetings for their own agency or assigned candidates.");
    }
  } else if (isVendorHR) {
    if (vendorId) {
      const assigned = req.assignedVendors || [];
      const hasAccess = assigned.some(
        (v) => String(v).toLowerCase() === String(vendorId).toLowerCase()
      );
      if (!hasAccess && !isSuperAdmin && role !== ROLES.ADMIN) {
        throw new ApiError(403, "You can only schedule meetings for vendors assigned to your account.");
      }
    }
  } else if (isEmployeeHR && !isSuperAdmin && role !== ROLES.ADMIN) {
    if (candidateId && !isSuperAdmin) {
      throw new ApiError(403, "Employee Management HR is restricted to workforce and internal meetings.");
    }
  }

  const organizerId = req.userId || req.user?._id?.toString() || req.user?.id || req.vendorId;
  const organizerName = req.user?.name || req.user?.companyName || req.vendorName || "Organizer";
  const organizerRole = isSuperAdmin
    ? "SUPER_ADMIN"
    : isVendor
    ? "VENDOR"
    : isVendorHR
    ? "VENDOR_HR"
    : isEmployeeHR
    ? "EMPLOYEE_HR"
    : role;

  let resolvedTargetEmployees = [];
  const processedAttendees = Array.isArray(attendees) ? [...attendees] : [];

  if (Array.isArray(targetEmployees) && targetEmployees.length > 0) {
    for (const empRef of targetEmployees) {
      if (!empRef) continue;
      let empDoc = null;
      if (mongoose.Types.ObjectId.isValid(empRef)) {
        empDoc = await Employee.findById(empRef);
      }
      if (!empDoc) {
        empDoc = await Employee.findOne({
          $or: [{ employeeId: empRef }, { email: empRef }, { name: empRef }],
        });
      }
      if (empDoc) {
        resolvedTargetEmployees.push(empDoc._id);
        if (!processedAttendees.some((a) => a.id === empDoc._id.toString() || a.email === empDoc.email)) {
          processedAttendees.push({
            id: empDoc._id.toString(),
            name: empDoc.name,
            email: empDoc.email,
            role: "EMPLOYEE",
            code: empDoc.employeeId,
            designation: empDoc.designation,
          });
        }
      } else if (mongoose.Types.ObjectId.isValid(empRef)) {
        resolvedTargetEmployees.push(empRef);
      }
    }
  }

  for (const att of processedAttendees) {
    if (att && (att.role === "EMPLOYEE" || att.name)) {
      const empDoc = await Employee.findOne({
        $or: [
          ...(att.id && mongoose.Types.ObjectId.isValid(att.id) ? [{ _id: att.id }] : []),
          ...(att.email ? [{ email: att.email }] : []),
          ...(att.name ? [{ name: att.name }] : []),
        ],
      });
      if (empDoc && !resolvedTargetEmployees.some((id) => id.toString() === empDoc._id.toString())) {
        resolvedTargetEmployees.push(empDoc._id);
      }
    }
  }

  const hasSpecificTargets =
    resolvedTargetEmployees.length > 0 ||
    (Array.isArray(targetVendors) && targetVendors.length > 0) ||
    (Array.isArray(targetHRs) && targetHRs.length > 0) ||
    targetType === "SPECIFIC";

  const effectiveTargetType = hasSpecificTargets ? "SPECIFIC" : targetType;

  const meeting = await Meeting.create({
    title: title.trim(),
    description: description.trim(),
    meetingType,
    date,
    startTime,
    endTime,
    meetingLink: meetingLink.trim(),
    platform,
    targetType: effectiveTargetType,
    targetEmployees: resolvedTargetEmployees,
    targetVendors: Array.isArray(targetVendors) ? targetVendors : [],
    targetHRs: Array.isArray(targetHRs) ? targetHRs : [],
    attendees: processedAttendees,
    candidateId,
    candidateName,
    candidateEmail,
    applicationId,
    vendorId: isVendor ? (req.vendorId || vendorId) : vendorId,
    vendorName: isVendor ? (req.vendorName || vendorName) : vendorName,
    hrId,
    hrName,
    remarks,
    status: "SCHEDULED",
    createdBy: organizerId,
    createdByName: organizerName,
    organizerRole,
    remindersSent: [],
  });

  if (candidateId) {
    await logCandidateMeetingActivity({
      meeting,
      actionType: "MEETING_SCHEDULED",
      previousStatus: "Pending",
      newStatus: "Meeting Scheduled",
      remarks: `Meeting scheduled: "${meeting.title}" on ${meeting.date} at ${meeting.startTime}. Link: ${meeting.meetingLink}`,
      updater: req.user,
    });
  }

  const meetingMetadata = {
    meetingId: meeting._id.toString(),
    meetingLink: meeting.meetingLink,
    date: meeting.date,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    platform: meeting.platform,
    title: meeting.title,
    candidateName: meeting.candidateName,
    vendorName: meeting.vendorName,
  };

  try {
    if (meetingType === "VENDOR_DISCUSSION") {
      if (effectiveTargetType === "ALL") {
        const activeVendors = await Vendor.find({ status: { $ne: "Rejected" } }).select("vendorId companyName email");
        for (const v of activeVendors) {
          await Notification.create({
            type: "MEETING",
            title: `📅 Vendor Conference: ${meeting.title}`,
            message: `A vendor conference "${meeting.title}" is scheduled on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
            targetRole: "VENDOR",
            targetVendorId: v.vendorId,
            metadata: meetingMetadata,
          });
        }
        const allVendorHRs = await User.find({ role: "HR", hrType: "VENDOR_HR" }).select("_id");
        for (const vhr of allVendorHRs) {
          await Notification.create({
            type: "MEETING",
            title: `📅 Vendor Conference: ${meeting.title}`,
            message: `A vendor conference "${meeting.title}" is scheduled on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
            targetRole: "VENDOR_HR",
            targetUserId: vhr._id.toString(),
            metadata: meetingMetadata,
          });
        }
      } else {
        const targetVList = [
          ...new Set([
            ...(Array.isArray(targetVendors) ? targetVendors : []),
            ...(meeting.vendorId ? [meeting.vendorId] : []),
            ...processedAttendees.filter((a) => a.role === "VENDOR").map((a) => a.code || a.id),
          ]),
        ].filter(Boolean);

        for (const vRef of targetVList) {
          await Notification.create({
            type: "MEETING",
            title: `📅 Vendor Discussion: ${meeting.title}`,
            message: `You are invited to a meeting "${meeting.title}" on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
            targetRole: "VENDOR",
            targetVendorId: vRef,
            metadata: meetingMetadata,
          });

          const assignedVHRs = await User.find({
            role: "HR",
            hrType: "VENDOR_HR",
            assignedVendors: vRef,
          }).select("_id");
          for (const vhr of assignedVHRs) {
            await Notification.create({
              type: "MEETING",
              title: `📅 Vendor Discussion: ${meeting.title}`,
              message: `Vendor meeting "${meeting.title}" involving agency ${vRef} is scheduled on ${meeting.date} at ${meeting.startTime} (${meeting.platform}).`,
              targetRole: "VENDOR_HR",
              targetUserId: vhr._id.toString(),
              metadata: meetingMetadata,
            });
          }
        }
      }
    }

    else if (meetingType === "INTERNAL_HR") {
      if (effectiveTargetType === "ALL") {
        const allHRs = await User.find({ role: "HR", isActive: { $ne: false } }).select("_id hrType");
        for (const hr of allHRs) {
          await Notification.create({
            type: "MEETING",
            title: `📅 HR Operations Sync: ${meeting.title}`,
            message: `HR Team sync "${meeting.title}" is scheduled on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
            targetRole: hr.hrType || "HR",
            targetUserId: hr._id.toString(),
            metadata: meetingMetadata,
          });
        }
      } else {
        const targetHRList = [
          ...new Set([
            ...(Array.isArray(targetHRs) ? targetHRs : []),
            ...(meeting.hrId ? [meeting.hrId] : []),
            ...processedAttendees.filter((a) => a.role?.includes("HR")).map((a) => a.id),
          ]),
        ].filter(Boolean);

        for (const hrUserId of targetHRList) {
          await Notification.create({
            type: "MEETING",
            title: `📅 HR Meeting: ${meeting.title}`,
            message: `You are invited to an HR meeting "${meeting.title}" on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
            targetRole: "HR",
            targetUserId: String(hrUserId),
            metadata: meetingMetadata,
          });
        }
      }
    }

    else if (meetingType === "EMPLOYEE") {
      if (effectiveTargetType === "ALL") {
        await NotificationService.createNotification({
          type: "MEETING",
          title: `📅 Company Meeting: ${meeting.title}`,
          message: `A company meeting is scheduled on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
          targetRole: "EMPLOYEE",
          targetType: "ALL",
          metadata: meetingMetadata,
        });
      } else if (resolvedTargetEmployees.length > 0) {
        await Promise.all(
          resolvedTargetEmployees.map((empId) =>
            NotificationService.createNotification({
              type: "MEETING",
              title: `📅 Meeting Invitation: ${meeting.title}`,
              message: `You are invited to a meeting "${meeting.title}" on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
              targetRole: "EMPLOYEE",
              targetType: "SPECIFIC",
              targetEmployeeId: empId,
              employeeId: empId,
              metadata: meetingMetadata,
            })
          )
        );
      }
    }

    else if (meetingType === "CANDIDATE_INTERVIEW") {
      if (meeting.vendorId && !isVendor) {
        await Notification.create({
          type: "MEETING",
          title: `📅 Candidate Interview: ${meeting.title}`,
          message: `An interview has been scheduled for candidate ${meeting.candidateName || "Partner"} on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
          targetRole: "VENDOR",
          targetVendorId: meeting.vendorId,
          metadata: meetingMetadata,
        });

        const vendorHRUsers = await User.find({
          role: "HR",
          hrType: "VENDOR_HR",
          assignedVendors: meeting.vendorId,
        }).select("_id name email");

        for (const vhr of vendorHRUsers) {
          await Notification.create({
            type: "MEETING",
            title: `📅 Candidate Interview: ${meeting.title}`,
            message: `Interview "${meeting.title}" for ${meeting.candidateName || "candidate"} is scheduled on ${meeting.date} at ${meeting.startTime} (${meeting.platform}).`,
            targetRole: "VENDOR_HR",
            targetUserId: vhr._id.toString(),
            metadata: meetingMetadata,
          });
        }
      }
      if (resolvedTargetEmployees.length > 0) {
        await Promise.all(
          resolvedTargetEmployees.map((empId) =>
            NotificationService.createNotification({
              type: "MEETING",
              title: `📅 Candidate Interview: ${meeting.title}`,
              message: `You are scheduled to interview candidate ${meeting.candidateName} on ${meeting.date} at ${meeting.startTime} (${meeting.platform}).`,
              targetRole: "EMPLOYEE",
              targetType: "SPECIFIC",
              targetEmployeeId: empId,
              employeeId: empId,
              metadata: meetingMetadata,
            })
          )
        );
      }
    }

    else {
      if (effectiveTargetType === "ALL") {
        await NotificationService.createNotification({
          type: "MEETING",
          title: `📅 General Meeting: ${meeting.title}`,
          message: `A meeting is scheduled on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
          targetRole: "ALL",
          targetType: "ALL",
          metadata: meetingMetadata,
        });
      }
    }
  } catch (err) {
    console.error("Failed to dispatch meeting notification:", err.message);
  }

  return res.status(201).json({
    success: true,
    message: "Meeting scheduled successfully",
    meeting,
  });
});

export const getAdminMeetings = asyncHandler(async (req, res) => {
  const { month, year, date, status, candidateId, vendorId, meetingType, upcoming } = req.query;
  const filter = {};

  const role = req.userRole || req.user?.role || "ADMIN";
  const isSuperAdmin = req.isSuperAdmin || role === ROLES.SUPER_ADMIN;
  const isVendor = req.isVendor || role === ROLES.VENDOR;
  const hrType = req.hrType || req.user?.hrType || "";
  const isEmployeeHR = role === ROLES.HR && (hrType === "EMPLOYEE_HR" || hrType === "");
  const isVendorHR = role === ROLES.HR && hrType === "VENDOR_HR";

  if (isVendor) {
    filter.$or = [
      { vendorId: req.vendorId },
      { targetVendors: req.vendorId },
      { createdBy: req.userId },
      { "attendees.id": req.vendorId },
      { "attendees.code": req.vendorId },
      { "attendees.email": req.user?.email },
      { targetType: "ALL", meetingType: "VENDOR_DISCUSSION" },
    ];
  } else if (isVendorHR && !isSuperAdmin && role !== ROLES.ADMIN) {
    const assigned = req.assignedVendors || [];
    filter.$or = [
      { vendorId: { $in: assigned } },
      { targetVendors: { $in: assigned } },
      { hrId: req.userId },
      { targetHRs: req.userId },
      { createdBy: req.userId },
      { "attendees.id": req.userId },
      { "attendees.email": req.user?.email },
      { targetType: "ALL", meetingType: { $in: ["VENDOR_DISCUSSION", "INTERNAL_HR"] } },
    ];
  } else if (isEmployeeHR && !isSuperAdmin && role !== ROLES.ADMIN) {
    filter.$or = [
      { meetingType: { $in: ["INTERNAL_HR", "EMPLOYEE", "GENERAL"] } },
      { createdBy: req.userId },
      { hrId: req.userId },
      { targetHRs: req.userId },
      { "attendees.id": req.userId },
      { "attendees.email": req.user?.email },
      { targetType: "ALL" },
    ];
  }

  if (date) {
    filter.date = date;
  } else if (month && year) {
    const formattedMonth = String(month).padStart(2, "0");
    filter.date = { $regex: `^${year}-${formattedMonth}` };
  }

  if (status && status !== "ALL") {
    filter.status = status;
  }

  if (candidateId) {
    filter.candidateId = candidateId;
  }

  if (vendorId && !isVendor) {
    filter.vendorId = vendorId;
  }

  if (meetingType && meetingType !== "ALL") {
    filter.meetingType = meetingType;
  }

  if (upcoming === "true") {
    const todayStr = new Date().toISOString().split("T")[0];
    filter.date = { $gte: todayStr };
    if (!status) {
      filter.status = { $in: ["SCHEDULED", "RESCHEDULED"] };
    }
  }

  const meetings = await Meeting.find(filter)
    .populate("targetEmployees", "name employeeId email designation")
    .sort({ date: 1, startTime: 1 })
    .lean();

  return res.status(200).json(meetings);
});

export const getMeetingCalendarStats = asyncHandler(async (req, res) => {
  const role = req.userRole || req.user?.role || "ADMIN";
  const isSuperAdmin = req.isSuperAdmin || role === ROLES.SUPER_ADMIN;
  const isVendor = req.isVendor || role === ROLES.VENDOR;
  const hrType = req.hrType || req.user?.hrType || "";
  const isEmployeeHR = role === ROLES.HR && (hrType === "EMPLOYEE_HR" || hrType === "");
  const isVendorHR = role === ROLES.HR && hrType === "VENDOR_HR";

  const baseFilter = {};
  if (isVendor) {
    baseFilter.$or = [
      { vendorId: req.vendorId },
      { targetVendors: req.vendorId },
      { createdBy: req.userId },
      { "attendees.id": req.vendorId },
      { "attendees.code": req.vendorId },
      { "attendees.email": req.user?.email },
      { targetType: "ALL", meetingType: "VENDOR_DISCUSSION" },
    ];
  } else if (isVendorHR && !isSuperAdmin && role !== ROLES.ADMIN) {
    const assigned = req.assignedVendors || [];
    baseFilter.$or = [
      { vendorId: { $in: assigned } },
      { targetVendors: { $in: assigned } },
      { hrId: req.userId },
      { targetHRs: req.userId },
      { createdBy: req.userId },
      { "attendees.id": req.userId },
      { "attendees.email": req.user?.email },
      { targetType: "ALL", meetingType: { $in: ["VENDOR_DISCUSSION", "INTERNAL_HR"] } },
    ];
  } else if (isEmployeeHR && !isSuperAdmin && role !== ROLES.ADMIN) {
    baseFilter.$or = [
      { meetingType: { $in: ["INTERNAL_HR", "EMPLOYEE", "GENERAL"] } },
      { createdBy: req.userId },
      { hrId: req.userId },
      { targetHRs: req.userId },
      { "attendees.id": req.userId },
      { "attendees.email": req.user?.email },
      { targetType: "ALL" },
    ];
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const next7DaysStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [
    todayMeetings,
    upcomingMeetings,
    completedMeetings,
    cancelledMeetings,
    next7DaysMeetings,
  ] = await Promise.all([
    Meeting.find({ ...baseFilter, date: todayStr }).sort({ startTime: 1 }).lean(),
    Meeting.find({
      ...baseFilter,
      date: { $gte: todayStr },
      status: { $in: ["SCHEDULED", "RESCHEDULED"] },
    })
      .sort({ date: 1, startTime: 1 })
      .limit(10)
      .lean(),
    Meeting.countDocuments({ ...baseFilter, status: "COMPLETED" }),
    Meeting.countDocuments({ ...baseFilter, status: "CANCELLED" }),
    Meeting.find({
      ...baseFilter,
      date: { $gte: todayStr, $lte: next7DaysStr },
      status: { $in: ["SCHEDULED", "RESCHEDULED"] },
    })
      .sort({ date: 1, startTime: 1 })
      .lean(),
  ]);

  const totalScheduled = await Meeting.countDocuments({
    ...baseFilter,
    status: { $in: ["SCHEDULED", "RESCHEDULED"] },
  });

  const nextMeeting = upcomingMeetings.length > 0 ? upcomingMeetings[0] : null;

  return res.status(200).json({
    success: true,
    stats: {
      todayMeetingsCount: todayMeetings.length,
      upcomingMeetingsCount: totalScheduled,
      completedMeetingsCount: completedMeetings,
      cancelledMeetingsCount: cancelledMeetings,
      next7DaysMeetingsCount: next7DaysMeetings.length,
      totalScheduledMeetings: totalScheduled,
      nextMeeting,
    },
    todayMeetings,
    upcomingMeetings,
    next7DaysMeetings,
  });
});

export const updateMeeting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const meeting = await Meeting.findById(id);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  const prevStatus = meeting.status;

  if (updateData.title) meeting.title = updateData.title.trim();
  if (updateData.description !== undefined) meeting.description = updateData.description.trim();
  if (updateData.meetingType) meeting.meetingType = updateData.meetingType;
  if (updateData.date) meeting.date = updateData.date;
  if (updateData.startTime) meeting.startTime = updateData.startTime;
  if (updateData.endTime !== undefined) meeting.endTime = updateData.endTime;
  if (updateData.meetingLink) meeting.meetingLink = updateData.meetingLink.trim();
  if (updateData.platform) meeting.platform = updateData.platform;
  if (updateData.status) meeting.status = updateData.status;
  if (updateData.remarks !== undefined) meeting.remarks = updateData.remarks;
  if (updateData.attendance) meeting.attendance = updateData.attendance;
  if (updateData.outcome) meeting.outcome = updateData.outcome;
  if (updateData.outcomeRemarks !== undefined) meeting.outcomeRemarks = updateData.outcomeRemarks;
  if (Array.isArray(updateData.attendees)) meeting.attendees = updateData.attendees;

  await meeting.save();

  if (meeting.candidateId && (updateData.status || updateData.outcome || updateData.attendance)) {
    await logCandidateMeetingActivity({
      meeting,
      actionType: updateData.outcome ? "MEETING_OUTCOME" : "MEETING_UPDATED",
      previousStatus: prevStatus,
      newStatus: updateData.status || meeting.status,
      remarks: updateData.outcomeRemarks || updateData.remarks || `Meeting updated: Outcome [${meeting.outcome || "N/A"}], Attendance [${meeting.attendance || "N/A"}].`,
      updater: req.user,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Meeting updated successfully",
    meeting,
  });
});

export const rescheduleMeeting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, startTime, endTime, meetingLink, remarks } = req.body;

  if (!date || !startTime) {
    throw new ApiError(400, "New date and start time are required to reschedule.");
  }

  const todayStr = new Date().toISOString().split("T")[0];
  if (date < todayStr) {
    throw new ApiError(400, "Rescheduled date cannot be in the past.");
  }

  const meeting = await Meeting.findById(id);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  const oldDate = meeting.date;
  const oldTime = meeting.startTime;

  meeting.date = date;
  meeting.startTime = startTime;
  if (endTime) meeting.endTime = endTime;
  if (meetingLink) meeting.meetingLink = meetingLink.trim();
  if (remarks) meeting.remarks = remarks.trim();
  meeting.status = "RESCHEDULED";
  meeting.remindersSent = []; // Reset reminders for new schedule

  await meeting.save();

  if (meeting.candidateId) {
    await logCandidateMeetingActivity({
      meeting,
      actionType: "MEETING_RESCHEDULED",
      previousStatus: "Scheduled",
      newStatus: "Rescheduled",
      remarks: remarks || `Meeting rescheduled from ${oldDate} ${oldTime} to ${date} ${startTime}.`,
      updater: req.user,
    });
  }

  try {
    const message = `Meeting "${meeting.title}" has been RESCHEDULED to ${meeting.date} at ${meeting.startTime}. Click to join.`;
    await Notification.create({
      type: "MEETING_RESCHEDULED",
      title: `🔄 Meeting Rescheduled: ${meeting.title}`,
      message,
      targetRole: "ALL",
      metadata: {
        meetingId: meeting._id.toString(),
        meetingLink: meeting.meetingLink,
        date: meeting.date,
        startTime: meeting.startTime,
      },
    });
  } catch (err) {
    console.error("Failed to notify of reschedule:", err.message);
  }

  return res.status(200).json({
    success: true,
    message: "Meeting rescheduled successfully and reminders updated.",
    meeting,
  });
});

export const cancelMeeting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = "" } = req.body;

  const meeting = await Meeting.findById(id);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  meeting.status = "CANCELLED";
  meeting.remarks = reason || meeting.remarks || "Meeting cancelled by organizer.";
  await meeting.save();

  if (meeting.candidateId) {
    await logCandidateMeetingActivity({
      meeting,
      actionType: "MEETING_CANCELLED",
      previousStatus: "Scheduled",
      newStatus: "Cancelled",
      remarks: reason || "Meeting was cancelled.",
      updater: req.user,
    });
  }

  try {
    await Notification.create({
      type: "MEETING_CANCELLED",
      title: `❌ Meeting Cancelled: ${meeting.title}`,
      message: `The meeting scheduled for ${meeting.date} at ${meeting.startTime} has been cancelled. Reason: ${reason || "Cancelled by host."}`,
      targetRole: "ALL",
      metadata: { meetingId: meeting._id.toString() },
    });
  } catch (err) {}

  return res.status(200).json({
    success: true,
    message: "Meeting cancelled successfully.",
    meeting,
  });
});

export const deleteMeeting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const meeting = await Meeting.findByIdAndDelete(id);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }
  return res.status(200).json({
    success: true,
    message: "Meeting record deleted permanently.",
  });
});

export const getMeetingEmployees = asyncHandler(async (req, res) => {
  const { search = "" } = req.query;
  const filter = { status: { $ne: "inactive" } };
  if (search) {
    const q = String(search).trim();
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { employeeId: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { designation: { $regex: q, $options: "i" } },
    ];
  }
  const employees = await Employee.find(filter)
    .select("_id employeeId name email designation department")
    .limit(50)
    .lean();

  return res.status(200).json({
    success: true,
    employees: employees.map((e) => ({
      id: e._id.toString(),
      _id: e._id.toString(),
      name: e.name,
      employeeId: e.employeeId,
      email: e.email,
      designation: e.designation || "Employee",
      department: e.department || "General",
    })),
  });
});

export const getMeetingVendors = asyncHandler(async (req, res) => {
  const { search = "" } = req.query;
  const filter = { status: { $ne: "Rejected" } };
  if (search) {
    const q = String(search).trim();
    filter.$or = [
      { companyName: { $regex: q, $options: "i" } },
      { vendorId: { $regex: q, $options: "i" } },
      { contactPerson: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }
  const vendors = await Vendor.find(filter)
    .select("_id vendorId companyName contactPerson email phone mobile status")
    .limit(50)
    .lean();

  return res.status(200).json({
    success: true,
    vendors: vendors.map((v) => ({
      id: v.vendorId || v._id.toString(),
      _id: v._id.toString(),
      vendorId: v.vendorId,
      companyName: v.companyName,
      name: v.companyName,
      contactPerson: v.contactPerson || v.companyName,
      email: v.email,
      phone: v.phone || v.mobile || "",
      status: v.status || "Active",
    })),
  });
});

export const getMeetingHRs = asyncHandler(async (req, res) => {
  const { search = "", hrType = "" } = req.query;
  const filter = { role: "HR", isActive: { $ne: false } };
  if (hrType) {
    filter.hrType = hrType;
  }
  if (search) {
    const q = String(search).trim();
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { department: { $regex: q, $options: "i" } },
    ];
  }
  const hrs = await User.find(filter)
    .select("_id name email role hrType assignedVendors department phone")
    .limit(50)
    .lean();

  return res.status(200).json({
    success: true,
    hrs: hrs.map((h) => ({
      id: h._id.toString(),
      _id: h._id.toString(),
      name: h.name,
      email: h.email,
      role: h.role,
      hrType: h.hrType || "EMPLOYEE_HR",
      assignedVendors: h.assignedVendors || [],
      department: h.department || "",
      phone: h.phone || "",
    })),
  });
});

export const getMeetingCandidates = asyncHandler(async (req, res) => {
  const { search = "", vendorId = "" } = req.query;
  const filter = {};
  if (vendorId) {
    filter.vendorId = vendorId;
  }
  if (search) {
    const q = String(search).trim();
    filter.$or = [
      { candidateName: { $regex: q, $options: "i" } },
      { candidateId: { $regex: q, $options: "i" } },
      { candidateEmail: { $regex: q, $options: "i" } },
      { position: { $regex: q, $options: "i" } },
      { projectName: { $regex: q, $options: "i" } },
    ];
  }
  const candidates = await CandidateApplication.find(filter)
    .select(
      "_id applicationId candidateId candidateName candidateEmail candidatePhone position projectName vendorId vendorName currentStage"
    )
    .limit(50)
    .lean();

  return res.status(200).json({
    success: true,
    candidates: candidates.map((c) => ({
      id: c.candidateId || c._id.toString(),
      _id: c._id.toString(),
      applicationId: c.applicationId,
      candidateId: c.candidateId,
      name: c.candidateName,
      candidateName: c.candidateName,
      email: c.candidateEmail,
      candidateEmail: c.candidateEmail,
      phone: c.candidatePhone,
      position: c.position || "Candidate",
      projectName: c.projectName || "",
      vendorId: c.vendorId || "",
      vendorName: c.vendorName || "",
      stage: c.currentStage || "Applied",
    })),
  });
});

export const getEmployeeMeetings = asyncHandler(async (req, res) => {
  const employeeId = req.employee?._id || req.user?._id;
  const employeeEmail = req.employee?.email || req.user?.email;
  const employeeName = req.employee?.name || req.user?.name;

  const query = {
    status: { $ne: "CANCELLED" },
  };

  const orConditions = [{ targetType: "ALL" }];
  if (employeeId) {
    orConditions.push({ targetEmployees: employeeId });
    orConditions.push({ targetEmployees: employeeId.toString() });
    orConditions.push({ "attendees.id": employeeId.toString() });
    orConditions.push({ "attendees.userId": employeeId.toString() });
  }
  if (employeeEmail) {
    orConditions.push({ "attendees.email": employeeEmail.toLowerCase() });
  }
  if (employeeName) {
    orConditions.push({ "attendees.name": { $regex: new RegExp(`^${employeeName}$`, "i") } });
  }
  query.$or = orConditions;

  if (req.query.upcoming === "true") {
    const todayStr = new Date().toISOString().split("T")[0];
    query.date = { $gte: todayStr };
    query.status = { $in: ["SCHEDULED", "RESCHEDULED"] };
  } else if (req.query.status && req.query.status !== "ALL") {
    query.status = req.query.status;
  }

  const meetings = await Meeting.find(query).sort({ date: 1, startTime: 1 });

  return res.status(200).json({
    success: true,
    count: meetings.length,
    meetings,
  });
});

export const sendBroadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, targetRole = "ALL" } = req.body;
  if (!title || !message) {
    throw new ApiError(400, "Title and Message are required");
  }

  const notification = await Notification.create({
    type: "SYSTEM_ALERT",
    title,
    message,
    targetRole,
    targetType: "ALL",
  });

  return res.status(201).json({
    success: true,
    message: "Broadcast notification dispatched",
    notification,
  });
});
