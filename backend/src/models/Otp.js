import mongoose from "mongoose";

export const OTP_PURPOSES = {
  PASSWORD_RESET: "PASSWORD_RESET",
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  LOGIN_2FA: "LOGIN_2FA",
};

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: Object.values(OTP_PURPOSES),
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    maxAttempts: {
      type: Number,
      default: 3,
    },

    isUsed: {
      type: Boolean,
      default: false,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatic TTL cleanup in MongoDB
    },

    lastSentAt: {
      type: Date,
      default: Date.now,
    },

    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for quick lookup of active OTP for given email & purpose
otpSchema.index({ email: 1, purpose: 1, isUsed: 1 });

export const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
