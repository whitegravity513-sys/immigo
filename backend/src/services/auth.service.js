import { User } from "../models/User.js";
import { ROLES } from "../constants/roles.js";
import { OTP_PURPOSES } from "../models/Otp.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { requestAndSendOtp, verifyOtp } from "./otp.service.js";
import { createSession, revokeAllSessions } from "./token.service.js";
import { ApiError } from "../utils/apiError.js";

/**
 * Register a new user
 */
export const register = async ({ name, email, password, role = ROLES.USER, ipAddress = null }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, "An account with this email address already exists");
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: Object.values(ROLES).includes(role) ? role : ROLES.USER,
    isActive: true,
    isEmailVerified: false,
  });

  // Automatically trigger email verification OTP
  try {
    await requestAndSendOtp({
      email: normalizedEmail,
      purpose: OTP_PURPOSES.EMAIL_VERIFICATION,
      name: user.name,
      ipAddress,
    });
  } catch (error) {
    // Non-blocking for registration flow
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  };
};

/**
 * Login user with account lock protection
 */
export const login = async ({ email, password, ipAddress = null, userAgent = null, req = {} }) => {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

  // Prevent user enumeration: generic error
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated. Please contact support.");
  }

  // Account lockout check
  if (user.isLocked()) {
    const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000));
    throw new ApiError(
      423,
      `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingTime} minute(s).`
    );
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    user.failedLoginAttempts += 1;

    // Lock account after 5 consecutive failed attempts for 15 minutes
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }

    await user.save();
    throw new ApiError(401, "Invalid email or password");
  }

  // Reset lock & update last login
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  user.lastLoginIp = ipAddress;
  await user.save();

  // Create JWT session
  const session = await createSession(user, req);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
    ...session,
  };
};

/**
 * Send Password Reset OTP
 */
export const forgotPasswordOtp = async ({ email, ipAddress = null }) => {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email: normalizedEmail });

  // Security Best Practice: Don't disclose if user exists
  if (!user) {
    return {
      message: "If an account with this email exists, a 6-digit OTP verification code has been sent.",
    };
  }

  await requestAndSendOtp({
    email: normalizedEmail,
    purpose: OTP_PURPOSES.PASSWORD_RESET,
    name: user.name,
    ipAddress,
  });

  return {
    message: "If an account with this email exists, a 6-digit OTP verification code has been sent.",
  };
};

/**
 * Verify OTP and Reset Password
 */
export const resetPasswordWithOtp = async ({ email, otp, newPassword }) => {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !otp || !newPassword) {
    throw new ApiError(400, "Email, OTP, and new password are required");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "Password must contain at least 8 characters");
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new ApiError(400, "Invalid password reset request");
  }

  // Verify OTP
  await verifyOtp({
    email: normalizedEmail,
    otp,
    purpose: OTP_PURPOSES.PASSWORD_RESET,
  });

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  user.passwordHash = passwordHash;
  user.passwordChangedAt = new Date();
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  // Invalidate all existing sessions for security
  await revokeAllSessions(user._id);

  return {
    message: "Password has been successfully reset. Please log in with your new password.",
  };
};

/**
 * Verify Email with OTP
 */
export const verifyEmailWithOtp = async ({ email, otp }) => {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isEmailVerified) {
    return { message: "Email is already verified" };
  }

  await verifyOtp({
    email: normalizedEmail,
    otp,
    purpose: OTP_PURPOSES.EMAIL_VERIFICATION,
  });

  user.isEmailVerified = true;
  await user.save();

  return { message: "Email verified successfully" };
};

export default {
  register,
  login,
  forgotPasswordOtp,
  resetPasswordWithOtp,
  verifyEmailWithOtp,
};
