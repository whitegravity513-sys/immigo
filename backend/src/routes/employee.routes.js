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
  getMyProfile,
  updateMyContact,
  updateMyPhoto,
  uploadMyDocument,
  deleteMyDocument,
} from "../controllers/employee.controller.js";
import {
  getMyExpenses,
  submitMyExpense,
  getCategories,
} from "../controllers/expense.controller.js";
import { getClients } from "../controllers/client.controller.js";
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

// ─── PROFILE & CORPORATE DOCUMENT VAULT ───
router.get("/profile", verifyEmployee, getMyProfile);
router.put("/profile", verifyEmployee, updateMyContact);
router.put("/profile/photo", verifyEmployee, updateMyPhoto);
router.post("/documents", verifyEmployee, uploadMyDocument);
router.delete("/documents/:docId", verifyEmployee, deleteMyDocument);

// ─── EXPENSE SUBMISSION & TRACKING ───
router.get("/expenses", verifyEmployee, getMyExpenses);
router.post("/expenses", verifyEmployee, submitMyExpense);
router.get("/expense-categories", verifyEmployee, getCategories);
router.get("/clients", verifyEmployee, getClients);

// ─── NOTIFICATION ROUTES FOR EMPLOYEE ───
router.get("/notifications", verifyEmployee, getEmployeeNotifications);
router.put("/notifications/read-all", verifyEmployee, markAllEmployeeNotificationsAsRead);
router.put("/notifications/:id/read", verifyEmployee, markEmployeeNotificationAsRead);

// ─── MEETING ROUTES FOR EMPLOYEE ───
router.get("/meetings", verifyEmployee, getEmployeeMeetings);

export default router;
