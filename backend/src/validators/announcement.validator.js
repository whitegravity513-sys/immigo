import { ApiError } from "../utils/apiError.js";

export const validateCreateAnnouncement = (req, res, next) => {
  const { title, message } = req.body;
  const errors = [];

  if (!title || !String(title).trim()) {
    errors.push("Announcement title is required");
  }

  if (!message || !String(message).trim()) {
    errors.push("Announcement message is required");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "Validation Failed", errors));
  }

  next();
};

export default {
  validateCreateAnnouncement,
};
