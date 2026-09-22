import AttendanceService from "../services/attendance.service.js";
import LeaveService from "../services/leave.service.js";
import HolidayService from "../services/holiday.service.js";
import EmployeeService from "../services/employee.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Enterprise Employee Portal Controller
 */
export const getEmployeeStatus = asyncHandler(async (req, res) => {
  const status = await AttendanceService.getEmployeeStatus(req.user.id || req.user._id);
  return res.status(200).json(status);
});

export const checkIn = asyncHandler(async (req, res) => {
  const record = await AttendanceService.checkIn(req.user.id || req.user._id, req.body.location);
  return res.status(200).json({
    message: "Checked in successfully",
    attendance: record,
    record,
  });
});

export const startBreak = asyncHandler(async (req, res) => {
  const record = await AttendanceService.startBreak(req.user.id || req.user._id, req.body.breakType);
  return res.status(200).json({
    message: "Break started",
    attendance: record,
    record,
  });
});

export const endBreak = asyncHandler(async (req, res) => {
  const record = await AttendanceService.endBreak(req.user.id || req.user._id);
  return res.status(200).json({
    message: "Break ended. Work resumed.",
    attendance: record,
    record,
  });
});

export const checkOut = asyncHandler(async (req, res) => {
  const record = await AttendanceService.checkOut(
    req.user.id || req.user._id,
    req.body.location,
    req.body.checkOutNote
  );
  return res.status(200).json({
    message: "Checked out successfully",
    attendance: record,
    record,
  });
});

export const applyLeave = asyncHandler(async (req, res) => {
  const leave = await LeaveService.applyLeave(req.user.id || req.user._id, req.body);
  return res.status(201).json({
    message: "Leave application submitted successfully",
    leave,
  });
});

export const getLeaveHistory = asyncHandler(async (req, res) => {
  const history = await LeaveService.getLeaveHistory(req.user.id || req.user._id);
  return res.status(200).json(history);
});

export const getHolidays = asyncHandler(async (req, res) => {
  const holidays = await HolidayService.getHolidays();
  return res.status(200).json(holidays);
});

export const getMyMonthlyDetails = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const details = await EmployeeService.getEmployeeMonthlyDetails(
    req.user.id || req.user._id,
    month,
    year
  );
  return res.status(200).json(details);
});

// --- Employee Self-Service Profile & Document Vault Handlers ---
export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await EmployeeService.getEmployeeProfile(req.user.id || req.user._id);
  return res.status(200).json(profile);
});

export const updateMyContact = asyncHandler(async (req, res) => {
  const profile = await EmployeeService.updateContactDetails(
    req.user.id || req.user._id,
    req.body
  );
  return res.status(200).json({
    message: "Contact details updated successfully",
    employee: profile,
  });
});

export const updateMyPhoto = asyncHandler(async (req, res) => {
  const profile = await EmployeeService.updateProfilePhoto(
    req.user.id || req.user._id,
    req.body.profileImage
  );
  return res.status(200).json({
    message: "Profile photo updated successfully",
    profileImage: profile.profileImage,
    employee: profile,
  });
});

export const uploadMyDocument = asyncHandler(async (req, res) => {
  const profile = await EmployeeService.uploadDocument(
    req.user.id || req.user._id,
    req.body,
    "Employee"
  );
  return res.status(201).json({
    message: "Document uploaded successfully",
    documents: profile.documents,
    employee: profile,
  });
});

export const deleteMyDocument = asyncHandler(async (req, res) => {
  const profile = await EmployeeService.deleteDocument(
    req.user.id || req.user._id,
    req.params.docId
  );
  return res.status(200).json({
    message: "Document deleted successfully",
    documents: profile.documents,
    employee: profile,
  });
});

export default {
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
};
