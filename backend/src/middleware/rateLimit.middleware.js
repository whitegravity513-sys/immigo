import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: isDev ? 10000 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests from this IP. Please try again later.",
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: isDev ? 500 : 30, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: isDev ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many OTP requests. Please wait before requesting another OTP.",
  },
});

export default {
  apiLimiter,
  authLimiter,
  otpLimiter,
};