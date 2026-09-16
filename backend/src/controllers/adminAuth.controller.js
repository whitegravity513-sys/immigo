import AdminAuthService from "../services/adminAuth.service.js";
import { getCookieOptions, getClearCookieOptions } from "../config/security.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Enterprise Admin Authentication Controller
 */

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await AdminAuthService.login(email, password);
  res.cookie("refreshToken", result.refreshToken, getCookieOptions(req));
  return res.status(200).json({
    message: "Admin login successful",
    accessToken: result.accessToken,
    admin: result.admin,
  });
});

export const verifyAdminOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await AdminAuthService.verifyOtp(email, otp);
  res.cookie("refreshToken", result.refreshToken, getCookieOptions(req));
  return res.status(200).json({
    message: "Admin login successful",
    accessToken: result.accessToken,
    admin: result.admin,
  });
});

export const getAdmin = asyncHandler(async (req, res) => {
  const admin = await AdminAuthService.getAdminProfile(req.user.id || req.user._id);
  return res.status(200).json({
    message: "Admin fetched",
    admin,
  });
});

export const refreshAdminToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  const result = await AdminAuthService.refreshToken(refreshToken);
  res.cookie("refreshToken", result.newRefreshToken, getCookieOptions(req));
  return res.status(200).json({
    message: "Token refreshed",
    accessToken: result.accessToken,
  });
});

export const logoutAdmin = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  await AdminAuthService.logout(refreshToken);
  res.clearCookie("refreshToken", getClearCookieOptions(req));
  return res.status(200).json({ message: "Admin logged out" });
});

export const logoutAllAdmin = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  await AdminAuthService.logoutAll(refreshToken);
  res.clearCookie("refreshToken", getClearCookieOptions(req));
  return res.status(200).json({ message: "Admin logged out from all devices" });
});

export default {
  adminLogin,
  verifyAdminOtp,
  getAdmin,
  refreshAdminToken,
  logoutAdmin,
  logoutAllAdmin,
};
