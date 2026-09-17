import Meeting from "../models/Meeting.js";
import Employee from "../models/Employee.js";
import NotificationService from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

/**
 * Enterprise Meeting & Scheduling Controller
 */

// ── Admin: Create Meeting ──
export const createMeeting = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    date,
    startTime,
    endTime,
    meetingLink,
    platform = "Google Meet",
    targetType = "ALL",
    targetEmployees = [],
  } = req.body;

  if (!title || !date || !startTime || !meetingLink) {
    throw new ApiError(400, "Title, Date, Start Time, and Meeting Link are required");
  }

  // Business Rule: calender ma meating uss date ya uske a bad dki date ma ho na ki usse phele add kene ka
  const todayStr = new Date().toISOString().split("T")[0];
  if (date < todayStr) {
    throw new ApiError(
      400,
      "Meeting date cannot be in the past. Please select today or a future date."
    );
  }

  // Create meeting record
  const meeting = await Meeting.create({
    title: title.trim(),
    description: description ? description.trim() : "",
    date,
    startTime,
    endTime: endTime || "",
    meetingLink: meetingLink.trim(),
    platform,
    targetType,
    targetEmployees: targetType === "SPECIFIC" ? targetEmployees : [],
    createdBy: req.user?.id || req.user?._id || null,
    createdByName: req.user?.name || "Admin",
  });

  // Populate target employees for response
  await meeting.populate("targetEmployees", "name employeeId email designation");

  // Automatically dispatch notification(s)
  const meetingMetadata = {
    meetingId: meeting._id.toString(),
    meetingLink: meeting.meetingLink,
    date: meeting.date,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    platform: meeting.platform,
    title: meeting.title,
  };

  if (targetType === "ALL") {
    await NotificationService.createNotification({
      type: "MEETING",
      title: `📅 New Meeting: ${meeting.title}`,
      message: `A meeting has been scheduled for ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
      targetRole: "EMPLOYEE",
      targetType: "ALL",
      metadata: meetingMetadata,
    });
  } else if (targetType === "SPECIFIC" && Array.isArray(targetEmployees) && targetEmployees.length > 0) {
    await Promise.all(
      targetEmployees.map((empId) =>
        NotificationService.createNotification({
          type: "MEETING",
          title: `📅 Meeting Invitation: ${meeting.title}`,
          message: `You are invited to a meeting on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
          targetRole: "EMPLOYEE",
          targetType: "SPECIFIC",
          targetEmployeeId: empId,
          metadata: meetingMetadata,
        })
      )
    );
  }

  return res.status(201).json({
    message: "Meeting scheduled and notifications dispatched successfully",
    meeting,
  });
});

// ── Admin: Get All Meetings ──
export const getAdminMeetings = asyncHandler(async (req, res) => {
  const { month, year, date, status } = req.query;
  const filter = {};

  if (date) {
    filter.date = date;
  } else if (month && year) {
    const formattedMonth = String(month).padStart(2, "0");
    const regexPattern = `^${year}-${formattedMonth}`;
    filter.date = { $regex: regexPattern };
  }

  if (status) {
    filter.status = status;
  }

  const meetings = await Meeting.find(filter)
    .populate("targetEmployees", "name employeeId email designation")
    .sort({ date: -1, startTime: 1 })
    .lean();

  return res.status(200).json(meetings);
});

// ── Admin: Update Meeting ──
export const updateMeeting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    date,
    startTime,
    endTime,
    meetingLink,
    platform,
    targetType,
    targetEmployees,
    status,
    notifyUpdate = true,
  } = req.body;

  const meeting = await Meeting.findById(id);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  if (title) meeting.title = title.trim();
  if (description !== undefined) meeting.description = description.trim();
  if (date) {
    const todayStr = new Date().toISOString().split("T")[0];
    if (date < todayStr) {
      throw new ApiError(
        400,
        "Meeting date cannot be in the past. Please select today or a future date."
      );
    }
    meeting.date = date;
  }
  if (startTime) meeting.startTime = startTime;
  if (endTime !== undefined) meeting.endTime = endTime;
  if (meetingLink) meeting.meetingLink = meetingLink.trim();
  if (platform) meeting.platform = platform;
  if (targetType) meeting.targetType = targetType;
  if (targetEmployees) meeting.targetEmployees = targetType === "SPECIFIC" ? targetEmployees : [];
  if (status) meeting.status = status;

  await meeting.save();
  await meeting.populate("targetEmployees", "name employeeId email designation");

  if (notifyUpdate) {
    const meetingMetadata = {
      meetingId: meeting._id.toString(),
      meetingLink: meeting.meetingLink,
      date: meeting.date,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      platform: meeting.platform,
      title: meeting.title,
    };

    if (meeting.targetType === "ALL") {
      await NotificationService.createNotification({
        type: "UPDATE",
        title: `🔄 Meeting Updated: ${meeting.title}`,
        message: `Meeting details updated for ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Please check the new details.`,
        targetRole: "EMPLOYEE",
        targetType: "ALL",
        metadata: meetingMetadata,
      });
    } else if (meeting.targetEmployees?.length > 0) {
      await Promise.all(
        meeting.targetEmployees.map((emp) => {
          const empId = emp._id || emp;
          return NotificationService.createNotification({
            type: "UPDATE",
            title: `🔄 Meeting Updated: ${meeting.title}`,
            message: `Your meeting on ${meeting.date} at ${meeting.startTime} has been updated.`,
            targetRole: "EMPLOYEE",
            targetType: "SPECIFIC",
            targetEmployeeId: empId,
            metadata: meetingMetadata,
          });
        })
      );
    }
  }

  return res.status(200).json({
    message: "Meeting updated successfully",
    meeting,
  });
});

// ── Admin: Delete Meeting ──
export const deleteMeeting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const meeting = await Meeting.findByIdAndDelete(id);

  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  // Send cancellation notification
  if (meeting.targetType === "ALL") {
    await NotificationService.createNotification({
      type: "UPDATE",
      title: `❌ Meeting Cancelled: ${meeting.title}`,
      message: `The meeting scheduled for ${meeting.date} at ${meeting.startTime} has been cancelled.`,
      targetRole: "EMPLOYEE",
      targetType: "ALL",
    });
  } else if (meeting.targetEmployees?.length > 0) {
    for (const empId of meeting.targetEmployees) {
      await NotificationService.createNotification({
        type: "UPDATE",
        title: `❌ Meeting Cancelled: ${meeting.title}`,
        message: `Your meeting scheduled for ${meeting.date} at ${meeting.startTime} has been cancelled.`,
        targetRole: "EMPLOYEE",
        targetType: "SPECIFIC",
        targetEmployeeId: empId,
      });
    }
  }

  return res.status(200).json({
    message: "Meeting deleted successfully",
  });
});

// ── Admin: Send Direct Broadcast / Update Notification ──
export const sendBroadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, targetType = "ALL", targetEmployeeId = null, type = "ANNOUNCEMENT" } = req.body;

  if (!title || !message) {
    throw new ApiError(400, "Title and message are required");
  }

  const notification = await NotificationService.createNotification({
    type,
    title: title.trim(),
    message: message.trim(),
    targetRole: "EMPLOYEE",
    targetType,
    targetEmployeeId: targetType === "SPECIFIC" ? targetEmployeeId : null,
  });

  return res.status(201).json({
    message: "Notification dispatched successfully to employee(s)",
    notification,
  });
});

// ── Employee: Get Assigned & Company Meetings ──
export const getEmployeeMeetings = asyncHandler(async (req, res) => {
  const employeeId = req.user.id || req.user._id;

  const meetings = await Meeting.find({
    $or: [
      { targetType: "ALL" },
      { targetEmployees: employeeId },
    ],
  })
    .sort({ date: 1, startTime: 1 })
    .lean();

  return res.status(200).json(meetings);
});

export default {
  createMeeting,
  getAdminMeetings,
  updateMeeting,
  deleteMeeting,
  sendBroadcastNotification,
  getEmployeeMeetings,
};
