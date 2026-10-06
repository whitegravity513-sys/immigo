import { ApiError } from "../utils/apiError.js";

export const validateCreateEmployee = (req, res, next) => {
  const { name, email } = req.body;
  const errors = [];

  if (!name || !name.trim()) {
    errors.push("Employee name is required");
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    errors.push("A valid work email is required");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "Validation Failed", errors));
  }

  next();
};

export const validateUpdateEmployee = (req, res, next) => {
  const { name, email } = req.body;
  const errors = [];

  if (name !== undefined && !name.trim()) {
    errors.push("Employee name cannot be empty");
  }

  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    errors.push("A valid email address is required");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "Validation Failed", errors));
  }

  next();
};

export default {
  validateCreateEmployee,
  validateUpdateEmployee,
};
