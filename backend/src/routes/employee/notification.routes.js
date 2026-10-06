import express from "express";
import {
  getEmployeeNotifications,
  markEmployeeNotificationAsRead,
  markAllEmployeeNotificationsAsRead,
} from "../../controllers/notification.controller.js";
import { verifyEmployee } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/notifications", verifyEmployee, getEmployeeNotifications);
router.put("/notifications/read-all", verifyEmployee, markAllEmployeeNotificationsAsRead);
router.put("/notifications/:id/read", verifyEmployee, markEmployeeNotificationAsRead);

export default router;
