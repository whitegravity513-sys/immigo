import { ApiError } from "../utils/apiError.js";

/**
 * Enterprise Request Validation Runner Middleware
 * Executes an array of validator checks or validation functions.
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    try {
      const errors = [];
      for (const validation of validations) {
        if (typeof validation === "function") {
          const result = await validation(req);
          if (result && !result.valid) {
            errors.push(result.message || "Validation failed");
          }
        }
      }

      if (errors.length > 0) {
        return next(new ApiError(400, errors[0], errors));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default validate;
