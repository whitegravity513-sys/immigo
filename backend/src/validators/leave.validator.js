import { ApiError } from "../utils/apiError.js";

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

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    errors.push("Start date cannot be after end date");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "Validation Failed", errors));
  }

  next();
};

export default {
  validateApplyLeave,
};
