/**
 * MNC Standard API Response Wrapper
 */
export class ApiResponse {
  constructor(statusCode, message = "Success", data = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== null) {
      this.data = data;
    }
  }

  static send(res, statusCode, message = "Success", data = null) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data));
  }
}

export default ApiResponse;
