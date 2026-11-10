import NotificationService from "../services/notification.service.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const buildStaffContext = async (user) => {
  const roleUpper = String(user?.role || "").toUpperCase();
  const superAdminEmails = [
    process.env.SUPER_ADMIN_EMAIL,
    process.env.SUPERADMIN_EMAIL,
    "admin@vista.com",
  ]
    .filter(Boolean)
    .map((e) => String(e).trim().toLowerCase());
  const isSuperAdmin =
    roleUpper === "SUPER_ADMIN" ||
    user?.isSuperAdmin === true ||
    (user?.email && superAdminEmails.includes(String(user.email).trim().toLowerCase()));

  const userId = user?.id || user?._id ? String(user.id || user._id) : null;
  let hrType = user?.hrType || "";
  let assignedVendors = Array.isArray(user?.assignedVendors) ? user.assignedVendors : null;

  if (roleUpper === "HR" && (!hrType || assignedVendors === null) && userId) {
    try {
      const dbUser = await User.findById(userId).select("hrType assignedVendors").lean();
      if (dbUser) {
        hrType = hrType || dbUser.hrType || "";
        assignedVendors = Array.isArray(dbUser.assignedVendors) ? dbUser.assignedVendors : [];
      }
    } catch {}
  }

  return {
    isSuperAdmin,
    role: roleUpper || user?.role,
    hrType,
    assignedVendors: assignedVendors || [],
    userId,
  };
};

export const getNotifications = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit || "30", 10);
  const ctx = await buildStaffContext(req.user);
  const result = await NotificationService.getNotifications(limit, ctx);
  return res.status(200).json(result);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await NotificationService.markAsRead(req.params.id);
  return res.status(200).json({ success: true, notification });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const ctx = await buildStaffContext(req.user);
  await NotificationService.markAllAsRead(ctx);
  return res.status(200).json({ success: true, message: "All notifications marked as read" });
});

export const clearAllNotifications = asyncHandler(async (req, res) => {
  const ctx = await buildStaffContext(req.user);
  await NotificationService.clearAll(ctx);
  return res.status(200).json({ success: true, message: "All notifications cleared" });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await NotificationService.deleteNotification(id);
  return res.status(200).json({ success: true, message: "Notification deleted successfully" });
});

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

export const deleteEmployeeNotification = asyncHandler(async (req, res) => {
  const employeeId = req.user.id || req.user._id;
  const { id } = req.params;
  await NotificationService.deleteEmployeeNotification(id, employeeId);
  return res.status(200).json({ success: true, message: "Notification deleted successfully" });
});

export const clearAllEmployeeNotifications = asyncHandler(async (req, res) => {
  const employeeId = req.user.id || req.user._id;
  await NotificationService.clearAllForEmployee(employeeId);
  return res.status(200).json({ success: true, message: "All notifications cleared" });
});

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  deleteNotification,
  getEmployeeNotifications,
  markEmployeeNotificationAsRead,
  markAllEmployeeNotificationsAsRead,
  deleteEmployeeNotification,
  clearAllEmployeeNotifications,
};
