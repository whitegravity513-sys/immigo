import { ApiError } from "../utils/apiError.js";

const isValidEmail = (email) => {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(email));
};

const isStrongPassword = (password) => {
  // At least 8 characters
  return typeof password === "string" && password.length >= 8;
};

export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push("Name is required");
  }

  if (!email || !isValidEmail(email)) {
    errors.push("A valid email address is required");
  }

  if (!password || !isStrongPassword(password)) {
    errors.push("Password must be at least 8 characters long");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "Validation Failed", errors));
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push("A valid email is required");
  }

  if (!password) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "Validation Failed", errors));
  }

  next();
};

export const validateForgotPasswordOtp = (req, res, next) => {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    return next(new ApiError(400, "A valid email is required"));
  }

  next();
};

export const validateResetPasswordOtp = (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push("A valid email is required");
  }

  if (!otp || String(otp).trim().length !== 6) {
    errors.push("A valid 6-digit OTP code is required");
  }

  if (!newPassword || !isStrongPassword(newPassword)) {
    errors.push("New password must be at least 8 characters long");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "Validation Failed", errors));
  }

  next();
};

export const validateVerifyEmailOtp = (req, res, next) => {
  const { email, otp } = req.body;
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push("A valid email is required");
  }

  if (!otp || String(otp).trim().length !== 6) {
    errors.push("A valid 6-digit OTP code is required");
  }

  if (errors.length > 0) {
    return next(new ApiError(400, "Validation Failed", errors));
  }

  next();
};

export default {
  validateRegister,
  validateLogin,
  validateForgotPasswordOtp,
  validateResetPasswordOtp,
  validateVerifyEmailOtp,
};
