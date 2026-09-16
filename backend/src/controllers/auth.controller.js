import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import * as authService from "../services/auth.service.js";
import * as tokenService from "../services/token.service.js";
import { OTP_PURPOSES } from "../models/Otp.js";
import { requestAndSendOtp } from "../services/otp.service.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";

/**
 * Register User Controller
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const ipAddress = req.ip || req.connection?.remoteAddress;

  const user = await authService.register({
    name,
    email,
    password,
    role,
    ipAddress,
  });

  return ApiResponse.send(
    res,
    201,
    "User registered successfully. A verification OTP has been sent to your email.",
    { user }
  );
});

/**
 * Login User Controller
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection?.remoteAddress;
  const userAgent = req.headers["user-agent"];

  const result = await authService.login({
    email,
    password,
    ipAddress,
    userAgent,
    req,
  });

  // Set secure refresh token cookie
  res.cookie(
    "refreshToken",
    result.refreshToken,
    tokenService.getRefreshTokenCookieOptions()
  );

  return ApiResponse.send(res, 200, "Login successful", {
    accessToken: result.accessToken,
    user: result.user,
  });
});

/**
 * Refresh Access Token Controller
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is missing");
  }

  const result = await authService.refreshTokens({
    incomingRefreshToken,
    req,
  });

  // Rotate cookie
  res.cookie(
    "refreshToken",
    result.newRefreshToken,
    tokenService.getRefreshTokenCookieOptions()
  );

  return ApiResponse.send(res, 200, "Access token refreshed successfully", {
    accessToken: result.accessToken,
  });
});

/**
 * Logout User Controller (Current Device)
 */
export const logout = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (incomingRefreshToken) {
    await authService.logout({ incomingRefreshToken });
  }

  // Clear cookie
  res.clearCookie(
    "refreshToken",
    tokenService.getClearRefreshTokenCookieOptions()
  );

  return ApiResponse.send(res, 200, "Logged out successfully");
});

/**
 * Logout User from All Devices Controller
 */
export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user._id);

  res.clearCookie(
    "refreshToken",
    tokenService.getClearRefreshTokenCookieOptions()
  );

  return ApiResponse.send(res, 200, "Logged out from all devices successfully");
});

/**
 * Get Current Logged-in User Profile Controller
 */
export const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.send(res, 200, "Profile retrieved successfully", {
    user: req.user,
  });
});

/**
 * Verify Email via 6-digit OTP Controller
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const result = await authService.verifyEmailWithOtp({ email, otp });

  return ApiResponse.send(
    res,
    200,
    "Email verified successfully. You can now login.",
    { user: result.user }
  );
});

/**
 * Resend Verification OTP Controller
 */
export const resendVerificationOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const ipAddress = req.ip || req.connection?.remoteAddress;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "No account associated with this email");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified. Please proceed to login.");
  }

  await requestAndSendOtp({
    email,
    purpose: OTP_PURPOSES.EMAIL_VERIFICATION,
    ipAddress,
  });

  return ApiResponse.send(
    res,
    200,
    "A fresh 6-digit verification OTP has been sent to your email."
  );
});

export default {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  verifyEmail,
  resendVerificationOtp,
};
