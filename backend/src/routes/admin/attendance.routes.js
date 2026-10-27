import express from "express";
import {
  getAttendanceReport,
  getAttendanceCalendarMonth,
  getAttendanceByDate,
  updateAttendance,
  getAttendanceSummary,
  getDailyNotes,
} from "../../controllers/adminAttendance.controller.js";
import { requirePermission } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.get("/attendance", requirePermission("attendance.view"), getAttendanceReport);
router.get("/attendance/calendar-month", requirePermission("attendance.view"), getAttendanceCalendarMonth);
router.get("/attendance/range", requirePermission("attendance.view"), getAttendanceByDate);
router.post("/attendance/update", requirePermission("attendance.update"), updateAttendance);
router.get("/attendance/summary", requirePermission("attendance.view"), getAttendanceSummary);
router.get("/attendance/notes", requirePermission("attendance.view"), getDailyNotes);

export default router;
