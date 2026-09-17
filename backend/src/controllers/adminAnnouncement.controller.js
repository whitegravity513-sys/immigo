import Announcement from "../models/Announcement.js";
import NotificationService from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

export const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find().sort({ createdAt: -1 });
  return res.status(200).json(announcements);
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, date, category, priority } = req.body;
  if (!title || !message) {
    throw new ApiError(400, "Title and message are required");
  }

  const announcement = await Announcement.create({
    title: title.trim(),
    message: message.trim(),
    date: date || new Date().toISOString().split("T")[0],
    category: category || "Company Notification",
    priority: priority || "Medium",
    createdBy: req.admin?._id || req.user?._id,
  });

  // Broadcast to all employees
  try {
    NotificationService.createNotification({
      type: "ANNOUNCEMENT",
      title: `Announcement: ${title}`,
      message,
      targetType: "ALL",
      metadata: {
        announcementId: announcement._id,
        category: announcement.category,
        date: announcement.date,
      },
    });
  } catch (e) {
    // Non-blocking
  }

  return res.status(201).json({
    message: "Announcement created and broadcasted successfully",
    announcement,
  });
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) {
    throw new ApiError(404, "Announcement not found");
  }
  return res.status(200).json({ message: "Announcement deleted successfully" });
});
