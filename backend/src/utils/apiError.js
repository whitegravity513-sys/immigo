/**
 * MNC Standard Custom ApiError class for operational errors
 * Compatible with Express centralized error handling middleware.
 */
export class ApiError extends Error {
  constructor(
    statusCode = 500,
    message = "Internal Server Error",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = Array.isArray(errors) ? errors : [errors];

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /** Factory: 400 Bad Request */
  static badRequest(message = "Bad Request", errors = []) {
    return new ApiError(400, message, errors);
  }

  /** Factory: 401 Unauthorized */
  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  /** Factory: 403 Forbidden */
  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  /** Factory: 404 Not Found */
  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  /** Factory: 409 Conflict */
  static conflict(message = "Conflict") {
    return new ApiError(409, message);
  }

  /** Factory: 500 Internal Server Error */
  static internal(message = "Internal Server Error") {
    return new ApiError(500, message);
  }
}

export default ApiError;
