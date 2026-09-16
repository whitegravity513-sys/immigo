import express from "express";
import {
  getEmployeeStatus,
  checkIn,
  startBreak,
  endBreak,
  checkOut,
  applyLeave,
  getLeaveHistory,
  getHolidays,
  getMyMonthlyDetails,
} from "../controllers/employee.controller.js";
import {
  getEmployeeNotifications,
  markEmployeeNotificationAsRead,
  markAllEmployeeNotificationsAsRead,
} from "../controllers/notification.controller.js";
import { getEmployeeMeetings } from "../controllers/meeting.controller.js";
import { getAnnouncements } from "../controllers/adminAnnouncement.controller.js";
import { verifyEmployee } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/status", verifyEmployee, getEmployeeStatus);
router.post("/check-in", verifyEmployee, checkIn);
router.post("/break/start", verifyEmployee, startBreak);
router.post("/break/end", verifyEmployee, endBreak);
router.post("/check-out", verifyEmployee, checkOut);
router.post("/leaves", verifyEmployee, applyLeave);
router.get("/leaves", verifyEmployee, getLeaveHistory);
router.get("/holidays", verifyEmployee, getHolidays);
router.get("/announcements", verifyEmployee, getAnnouncements);
router.get("/monthly", verifyEmployee, getMyMonthlyDetails);

// ─── NOTIFICATION ROUTES FOR EMPLOYEE ───
router.get("/notifications", verifyEmployee, getEmployeeNotifications);
router.put("/notifications/read-all", verifyEmployee, markAllEmployeeNotificationsAsRead);
router.put("/notifications/:id/read", verifyEmployee, markEmployeeNotificationAsRead);

// ─── MEETING ROUTES FOR EMPLOYEE ───
router.get("/meetings", verifyEmployee, getEmployeeMeetings);

export default router;
