import DailyWorkLog from "../models/DailyWorkLog.js";
import Employee from "../models/Employee.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

/**
 * Get IST date string in YYYY-MM-DD
 */
const getISTDate = () => {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
};

/**
 * Save or update employee's daily work log for today
 */
export const saveTodayWorkLog = asyncHandler(async (req, res) => {
  const employeeId = req.user.id || req.user._id;
  const { logText, date } = req.body;

  if (!logText || !logText.trim()) {
    throw new ApiError(400, "Please enter your work details before saving.");
  }

  const targetDate = date || getISTDate();

  const emp = await Employee.findById(employeeId).select("name employeeId department designation");
  if (!emp) {
    throw new ApiError(404, "Employee not found");
  }

  const log = await DailyWorkLog.findOneAndUpdate(
    { employee: employeeId, date: targetDate },
    {
      employee: employeeId,
      date: targetDate,
      logText: logText.trim(),
      updatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json({
    success: true,
    message: "Work log saved successfully",
    log,
  });
});

/**
 * Get logged-in employee's work log for today
 */
export const getTodayWorkLog = asyncHandler(async (req, res) => {
  const employeeId = req.user.id || req.user._id;
  const targetDate = req.query.date || getISTDate();

  const log = await DailyWorkLog.findOne({
    employee: employeeId,
    date: targetDate,
  });

  return res.status(200).json({
    success: true,
    date: targetDate,
    log: log || null,
  });
});

/**
 * Get logged-in employee's recent work log history
 */
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

/**
 * Admin / Team Lead: View work logs of all employees for a date or department
 */
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
