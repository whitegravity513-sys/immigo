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

router.post(
  "/register",
  authLimiter,
  validateRegister,
  authController.register
);

router.post(
  "/login",
  authLimiter,
  validateLogin,
  authController.login
);

router.post(
  "/refresh-token",
  authController.refreshToken
);

router.post(
  "/logout",
  authController.logout
);

router.post(
  "/logout-all",
  authenticate,
  authController.logoutAll
);

router.get(
  "/me",
  authenticate,
  authController.getMe
);

router.post(
  "/verify-email",
  authLimiter,
  validateVerifyEmailOtp,
  authController.verifyEmail
);

router.post(
  "/resend-verification-otp",
  otpLimiter,
  validateForgotPasswordOtp,
  authController.resendVerificationOtp
);

router.post(
  "/forgot-password-otp",
  otpLimiter,
  validateForgotPasswordOtp,
  passwordController.forgotPasswordOtp
);

router.post(
  "/reset-password-otp",
  authLimiter,
  validateResetPasswordOtp,
  passwordController.resetPasswordOtp
);

export default router;