import express from "express";
import * as authController from "../controllers/auth.controller.js";
import * as passwordController from "../controllers/password.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimit.middleware.js";
import {
  validateRegister,
  validateLogin,
  validateForgotPasswordOtp,
  validateResetPasswordOtp,
  validateVerifyEmailOtp,
} from "../validators/auth.validator.js";

const router = express.Router();

// ==========================================
// Authentication Routes
// ==========================================

// Register
router.post(
  "/register",
  authLimiter,
  validateRegister,
  authController.register
);

// Login
router.post(
  "/login",
  authLimiter,
  validateLogin,
  authController.login
);

// Refresh Access Token
router.post(
  "/refresh-token",
  authController.refreshToken
);

// Logout (Current Device)
router.post(
  "/logout",
  authController.logout
);

// Logout (All Devices)
router.post(
  "/logout-all",
  authenticate,
  authController.logoutAll
);

// Current User Profile
router.get(
  "/me",
  authenticate,
  authController.getMe
);

// ==========================================
// Email OTP Verification Routes
// ==========================================

// Verify Email via OTP
router.post(
  "/verify-email",
  authLimiter,
  validateVerifyEmailOtp,
  authController.verifyEmail
);

// Resend Verification OTP
router.post(
  "/resend-verification-otp",
  otpLimiter,
  validateForgotPasswordOtp,
  authController.resendVerificationOtp
);

// ==========================================
// Password Management (OTP-Based)
// ==========================================

// Forgot Password - Send 6-Digit OTP to Email
router.post(
  "/forgot-password-otp",
  otpLimiter,
  validateForgotPasswordOtp,
  passwordController.forgotPasswordOtp
);

// Reset Password with 6-Digit OTP
router.post(
  "/reset-password-otp",
  authLimiter,
  validateResetPasswordOtp,
  passwordController.resetPasswordOtp
);

export default router;