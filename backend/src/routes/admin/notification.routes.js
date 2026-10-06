import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
} from "../../controllers/notification.controller.js";
import { getAdminWorkLogs } from "../../controllers/worklog.controller.js";
import { verifyAdmin } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/notifications", verifyAdmin, getNotifications);
router.put("/notifications/:id/read", verifyAdmin, markAsRead);
router.put("/notifications/read-all", verifyAdmin, markAllAsRead);
router.delete("/notifications", verifyAdmin, clearAllNotifications);
router.get("/worklogs", verifyAdmin, getAdminWorkLogs);

export default router;
