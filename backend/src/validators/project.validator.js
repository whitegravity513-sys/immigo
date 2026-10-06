import { ApiError } from "../utils/apiError.js";

export const validateCreateProject = (req, res, next) => {
  const { title } = req.body;
  const errors = [];

  if (!title || !String(title).trim()) {
    errors.push("Project title is required");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "Validation Failed", errors));
  }

  next();
};

export const validateUpdateProject = (req, res, next) => {
  const { title } = req.body;
  const errors = [];

  if (title !== undefined && !String(title).trim()) {
    errors.push("Project title cannot be empty");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "Validation Failed", errors));
  }

  next();
};

export default {
  validateCreateProject,
  validateUpdateProject,
};
