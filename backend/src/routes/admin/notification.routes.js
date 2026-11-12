import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  deleteNotification,
} from "../../controllers/notification.controller.js";
import { getAdminWorkLogs } from "../../controllers/worklog.controller.js";
import { authenticateRBAC, requireRoles, blockVendorHR } from "../../middleware/rbac.middleware.js";

const router = express.Router();
const staffNotificationGuard = [
  authenticateRBAC,
  requireRoles("SUPER_ADMIN", "ADMIN", "HR", "EMPLOYEE_HR", "VENDOR_HR"),
];
const internalWorkforceGuard = [
  authenticateRBAC,
  blockVendorHR,
  requireRoles("SUPER_ADMIN", "ADMIN", "HR", "EMPLOYEE_HR"),
];

router.get("/notifications", ...staffNotificationGuard, getNotifications);
router.put("/notifications/:id/read", ...staffNotificationGuard, markAsRead);
router.put("/notifications/read-all", ...staffNotificationGuard, markAllAsRead);
router.delete("/notifications/:id", ...staffNotificationGuard, deleteNotification);
router.delete("/notifications", ...staffNotificationGuard, clearAllNotifications);
router.get("/worklogs", ...internalWorkforceGuard, getAdminWorkLogs);

export default router;
