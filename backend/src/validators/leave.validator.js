import { ApiError } from "../utils/apiError.js";
import { getTodayDateString, normalizeDateString } from "../utils/dateUtils.js";

export const validateApplyLeave = (req, res, next) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  const errors = [];

  if (!leaveType) {
    errors.push("Leave type is required");
  }

  if (!startDate) {
    errors.push("Start date is required");
  }

  if (!endDate) {
    errors.push("End date is required");
  }

  if (!reason || !reason.trim()) {
    errors.push("Reason for leave is required");
  }

  const todayStr = getTodayDateString();
  const startStr = normalizeDateString(startDate);
  const endStr = normalizeDateString(endDate);

  if (startDate && !startStr) {
    errors.push("Invalid start date");
  }
  if (endDate && !endStr) {
    errors.push("Invalid end date");
  }
  if (startStr && startStr < todayStr) {
    errors.push("Leave cannot be applied for past dates");
  }
  if (endStr && endStr < todayStr) {
    errors.push("Leave end date cannot be in the past");
  }
  if (startStr && endStr && startStr > endStr) {
    errors.push("Start date cannot be after end date");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  next();
};

export default {
  validateApplyLeave,
};
