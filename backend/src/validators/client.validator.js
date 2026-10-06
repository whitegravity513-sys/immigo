import { ApiError } from "../utils/apiError.js";

export const validateCreateClient = (req, res, next) => {
  const { name, email } = req.body;
  const errors = [];

  if (!name || !String(name).trim()) {
    errors.push("Client or company name is required");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    errors.push("A valid email address is required");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "Validation Failed", errors));
  }

  next();
};

export const validateUpdateClient = (req, res, next) => {
  const { name, email } = req.body;
  const errors = [];

  if (name !== undefined && !String(name).trim()) {
    errors.push("Client name cannot be empty");
  }

  if (email !== undefined && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    errors.push("A valid email address is required");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "Validation Failed", errors));
  }

  next();
};

export default {
  validateCreateClient,
  validateUpdateClient,
};
