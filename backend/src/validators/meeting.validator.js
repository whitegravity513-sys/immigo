import { ApiError } from "../utils/apiError.js";

export const validateCreateMeeting = (req, res, next) => {
  const { title, date } = req.body;
  const errors = [];

  if (!title || !String(title).trim()) {
    errors.push("Meeting title is required");
  }

  if (!date) {
    errors.push("Meeting date is required");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "Validation Failed", errors));
  }

  next();
};

export default {
  validateCreateMeeting,
};
