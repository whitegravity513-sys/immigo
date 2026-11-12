import rateLimit from "express-rate-limit";

// Treat managed hosting platforms as production even if NODE_ENV wasn't set explicitly.
const isHostedEnvironment = Boolean(
  process.env.RENDER ||
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.VERCEL ||
    process.env.FLY_APP_NAME
);
const isDev = process.env.NODE_ENV !== "production" && !isHostedEnvironment;

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 50000 : 2500,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, trustProxy: false },
  skip: (req) =>
    req.method === "OPTIONS" ||
    req.path === "/health" ||
    req.path === "/events/stream" ||
    Boolean(req.originalUrl && (req.originalUrl.startsWith("/api/health") || req.originalUrl.startsWith("/api/events/stream"))),
  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests from this IP. Please try again later.",
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, trustProxy: false },
  message: {
    success: false,
    statusCode: 429,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, trustProxy: false },
  message: {
    success: false,
    statusCode: 429,
    message: "Too many OTP requests. Please wait before requesting another OTP.",
  },
});

export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 300 : 150,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, trustProxy: false },
  message: {
    success: false,
    statusCode: 429,
    message: "Payment transaction rate limit reached. Please wait before retrying.",
  },
});

export default {
  apiLimiter,
  authLimiter,
  otpLimiter,
  paymentLimiter,
};