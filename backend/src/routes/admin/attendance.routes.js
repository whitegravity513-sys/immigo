import express from "express";
import {
  getAttendanceReport,
  getAttendanceCalendarMonth,
  getAttendanceByDate,
  updateAttendance,
  getAttendanceSummary,
  getDailyNotes,
} from "../../controllers/adminAttendance.controller.js";
import { verifyAdmin } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/attendance", verifyAdmin, getAttendanceReport);
router.get("/attendance/calendar-month", verifyAdmin, getAttendanceCalendarMonth);
router.get("/attendance/range", verifyAdmin, getAttendanceByDate);
router.post("/attendance/update", verifyAdmin, updateAttendance);
router.get("/attendance/summary", verifyAdmin, getAttendanceSummary);
router.get("/attendance/notes", verifyAdmin, getDailyNotes);

export default router;
