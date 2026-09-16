import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";

/**
 * MNC Standard Centralized Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose / DB Errors
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || (error.name === "ValidationError" || error.code === 11000 ? 400 : 500);

    let message = error.message || "Internal Server Error";
    let errors = [];

    // Duplicate key error (e.g. unique email)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || "field";
      message = `An account with this ${field} already exists`;
      errors = [`Duplicate value for ${field}`];
    } else if (error.name === "ValidationError") {
      message = "Validation Error";
      errors = Object.values(error.errors || {}).map((e) => e.message);
    } else if (error.name === "JsonWebTokenError") {
      message = "Invalid token signature";
    } else if (error.name === "TokenExpiredError") {
      message = "Token has expired";
    }

    error = new ApiError(statusCode, message, errors, err.stack);
  }

  // Log error
  if (error.statusCode >= 500) {
    logger.error(`[500 Server Error] ${req.method} ${req.originalUrl}:`, error);
  } else {
    logger.warn(`[${error.statusCode} Client Error] ${req.method} ${req.originalUrl}: ${error.message}`);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors?.length > 0 && { errors: error.errors }),
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };

  return res.status(error.statusCode).json(response);
};

export default errorHandler;