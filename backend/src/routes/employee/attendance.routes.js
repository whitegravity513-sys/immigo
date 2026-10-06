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
} from "../../controllers/employee.controller.js";
import { getAnnouncements } from "../../controllers/adminAnnouncement.controller.js";
import { verifyEmployee } from "../../middleware/auth.middleware.js";

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

export default router;
