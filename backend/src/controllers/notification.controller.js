import NotificationService from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Enterprise Notification Controller
 */

// ── Admin Handlers ──
export const getNotifications = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit || "30", 10);
  const result = await NotificationService.getNotifications(limit);
  return res.status(200).json(result);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await NotificationService.markAsRead(req.params.id);
  return res.status(200).json({ success: true, notification });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await NotificationService.markAllAsRead();
  return res.status(200).json({ success: true, message: "All notifications marked as read" });
});

export const clearAllNotifications = asyncHandler(async (req, res) => {
  await NotificationService.clearAll();
  return res.status(200).json({ success: true, message: "All notifications cleared" });
});

// ── Employee Handlers ──
export const getEmployeeNotifications = asyncHandler(async (req, res) => {
  const employeeId = req.user.id || req.user._id;
  const limit = parseInt(req.query.limit || "30", 10);
  const result = await NotificationService.getEmployeeNotifications(employeeId, limit);
  return res.status(200).json(result);
});

export const markEmployeeNotificationAsRead = asyncHandler(async (req, res) => {
  const employeeId = req.user.id || req.user._id;
  const { id } = req.params;
  await NotificationService.markAsReadForEmployee(id, employeeId);
  return res.status(200).json({ success: true, message: "Notification marked as read" });
});

export const markAllEmployeeNotificationsAsRead = asyncHandler(async (req, res) => {
  const employeeId = req.user.id || req.user._id;
  await NotificationService.markAllAsReadForEmployee(employeeId);
  return res.status(200).json({ success: true, message: "All notifications marked as read" });
});

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  getEmployeeNotifications,
  markEmployeeNotificationAsRead,
  markAllEmployeeNotificationsAsRead,
};
