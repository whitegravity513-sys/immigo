import { Otp, OTP_PURPOSES } from "../models/Otp.js";
import { generateOtp, hashToken, timingSafeCompare } from "../utils/crypto.js";
import { sendOtpEmail } from "./email.service.js";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 3);
const OTP_RESEND_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60);

/**
 * Generate and dispatch an OTP to the given email
 */
export const requestAndSendOtp = async ({
  email,
  purpose,
  name = "User",
  ipAddress = null,
}) => {
  if (!email || !purpose) {
    throw new ApiError(400, "Email and OTP purpose are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check for active OTP to enforce resend cooldown
  const latestOtp = await Otp.findOne({
    email: normalizedEmail,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (latestOtp) {
    const elapsedSeconds = Math.floor(
      (Date.now() - new Date(latestOtp.lastSentAt || latestOtp.createdAt).getTime()) / 1000
    );

    if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
      const waitTime = OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds;
      throw new ApiError(
        429,
        `Please wait ${waitTime} seconds before requesting a new OTP.`
      );
    }

    // Invalidate previous OTP
    await Otp.deleteMany({ email: normalizedEmail, purpose });
  }

  // 2. Generate secure 6-digit OTP
  const rawOtp = generateOtp(6);
  const otpHash = hashToken(rawOtp);

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // 3. Save OTP record
  await Otp.create({
    email: normalizedEmail,
    otpHash,
    purpose,
    maxAttempts: OTP_MAX_ATTEMPTS,
    expiresAt,
    lastSentAt: new Date(),
    ipAddress,
  });

  // 4. Send email
  await sendOtpEmail({
    to: normalizedEmail,
    otp: rawOtp,
    purpose,
    name,
  });

  return {
    success: true,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
    cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  };
};

/**
 * Verify provided OTP against database records
 */
export const verifyOtp = async ({ email, otp, purpose }) => {
  if (!email || !otp || !purpose) {
    throw new ApiError(400, "Email, OTP, and purpose are required for verification");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    purpose,
    isUsed: false,
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw new ApiError(400, "No active OTP found or OTP has expired. Please request a new one.");
  }

  // Check if expired
  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  }

  // Check attempt limit
  if (otpRecord.attempts >= otpRecord.maxAttempts) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new ApiError(
      429,
      "Maximum verification attempts exceeded. This OTP is now invalid. Please request a new one."
    );
  }

  // Compute provided OTP hash & compare
  const providedOtpHash = hashToken(otp.trim());
  const isMatch = timingSafeCompare(providedOtpHash, otpRecord.otpHash);

  if (!isMatch) {
    otpRecord.attempts += 1;
    await otpRecord.save();

    const remainingAttempts = otpRecord.maxAttempts - otpRecord.attempts;
    if (remainingAttempts <= 0) {
      await Otp.deleteOne({ _id: otpRecord._id });
      throw new ApiError(
        400,
        "Invalid OTP. Maximum attempts exceeded. Please request a new OTP."
      );
    }

    throw new ApiError(
      400,
      `Invalid OTP. You have ${remainingAttempts} attempt(s) remaining.`
    );
  }

  // OTP is valid - mark as used and clean up
  otpRecord.isUsed = true;
  await otpRecord.save();

  // Delete all used/expired OTPs for this email and purpose
  await Otp.deleteMany({
    email: normalizedEmail,
    purpose,
    $or: [{ isUsed: true }, { expiresAt: { $lt: new Date() } }],
  });

  return true;
};

export default {
  requestAndSendOtp,
  verifyOtp,
  OTP_PURPOSES,
};
