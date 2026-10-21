import DailyWorkLog from "../models/DailyWorkLog.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

const getISTDate = () => {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
};

export const saveTodayWorkLog = asyncHandler(async (req, res) => {
  const employeeId = req.user.id || req.user._id;
  const { logText, date } = req.body;

  if (!logText || !logText.trim()) {
    throw new ApiError(400, "Please enter your work details before submitting.");
  }

  const targetDate = date || getISTDate();

  // 1. Cannot edit if already submitted
  const existingLog = await DailyWorkLog.findOne({
    employee: employeeId,
    date: targetDate,
  });

  if (existingLog) {
    throw new ApiError(
      400,
      "Your daily work log for today has already been submitted and cannot be edited."
    );
  }

  // 2. Can only submit after shift check-out
  const attendance = await Attendance.findOne({
    employeeId,
    date: targetDate,
  });

  if (!attendance || !attendance.checkOutTime) {
    throw new ApiError(
      400,
      "Daily work log can only be submitted after completing shift check-out."
    );
  }

  const emp = await Employee.findById(employeeId).select("name employeeId department designation");
  if (!emp) {
    throw new ApiError(404, "Employee not found");
  }

  const log = await DailyWorkLog.create({
    employee: employeeId,
    date: targetDate,
    logText: logText.trim(),
    submittedAt: new Date(),
    updatedAt: new Date(),
  });

  return res.status(200).json({
    success: true,
    message: "Work log submitted successfully and locked.",
    log,
  });
});

export const getTodayWorkLog = asyncHandler(async (req, res) => {
  const employeeId = req.user.id || req.user._id;
  const targetDate = req.query.date || getISTDate();

  const [log, attendance] = await Promise.all([
    DailyWorkLog.findOne({
      employee: employeeId,
      date: targetDate,
    }),
    Attendance.findOne({
      employeeId,
      date: targetDate,
    }),
  ]);

  const isCheckedOut = Boolean(attendance?.checkOutTime);

  return res.status(200).json({
    success: true,
    date: targetDate,
    log: log || null,
    isSubmitted: Boolean(log),
    isCheckedOut,
  });
});

export const getMyWorkLogHistory = asyncHandler(async (req, res) => {
  const employeeId = req.user.id || req.user._id;

  const logs = await DailyWorkLog.find({ employee: employeeId })
    .sort({ date: -1 })
    .limit(30)
    .lean();

  return res.status(200).json({
    success: true,
    logs,
  });
});

export const getAdminWorkLogs = asyncHandler(async (req, res) => {
  const { date, department, employeeId } = req.query;
  const targetDate = date || getISTDate();

  const query = { date: targetDate };

  if (employeeId) {
    query.employee = employeeId;
  }

  let logs = await DailyWorkLog.find(query)
    .populate("employee", "name employeeId department designation profileImage email")
    .sort({ updatedAt: -1 })
    .lean();

  if (department && department !== "All") {
    logs = logs.filter(
      (item) => item.employee && item.employee.department?.toLowerCase() === department.toLowerCase()
    );
  }

  return res.status(200).json({
    success: true,
    date: targetDate,
    total: logs.length,
    logs,
  });
});
