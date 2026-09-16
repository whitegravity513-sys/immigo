import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import * as authService from "../services/auth.service.js";

/**
 * Request Password Reset OTP Controller
 */
export const forgotPasswordOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const ipAddress = req.ip || req.connection?.remoteAddress;

  const result = await authService.forgotPasswordOtp({ email, ipAddress });

  return ApiResponse.send(res, 200, result.message);
});

/**
 * Verify OTP & Set New Password Controller
 */
export const resetPasswordOtp = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const result = await authService.resetPasswordWithOtp({
    email,
    otp,
    newPassword,
  });

  return ApiResponse.send(res, 200, result.message);
});

export default {
  forgotPasswordOtp,
  resetPasswordOtp,
};
