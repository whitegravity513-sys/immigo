import AttendanceService from "../services/attendance.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Enterprise Admin Attendance Controller
 */
export const getAttendanceReport = asyncHandler(async (req, res) => {
  const report = await AttendanceService.getAttendanceReport();
  return res.status(200).json(report);
});

export const getAttendanceByDate = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const records = await AttendanceService.getAttendanceByDate(startDate, endDate);
  return res.status(200).json(records);
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const record = await AttendanceService.updateAttendance(req.body);
  return res.status(200).json({ message: "Attendance updated successfully", attendance: record });
});

export const getAttendanceSummary = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const summary = await AttendanceService.getAttendanceSummary(month, year);
  return res.status(200).json(summary);
});

export const getDailyNotes = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const notes = await AttendanceService.getDailyNotes(date);
  return res.status(200).json(notes);
});

export default {
  getAttendanceReport,
  getAttendanceByDate,
  updateAttendance,
  getAttendanceSummary,
  getDailyNotes,
};
