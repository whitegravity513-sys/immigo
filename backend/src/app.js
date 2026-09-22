import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import { corsOptions } from "./config/security.js";
import { sanitizeRequests } from "./middleware/sanitize.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import apiRouter from "./routes/index.js";
import { ApiResponse } from "./utils/apiResponse.js";
import { ApiError } from "./utils/apiError.js";

import path from "path";

const app = express();

// Serve uploaded documents, photos, and receipts statically
app.use("/uploads", cors(corsOptions), express.static(path.join(process.cwd(), "uploads")));

// High-speed response compression (Gzip / Deflate)
app.use(compression({
  threshold: 1024, // compress responses over 1KB
  level: 6,
}));

// ==========================================
// Security Middlewares (MNC & Enterprise Grade)
// ==========================================
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.disable("x-powered-by");

// Global CORS Middleware
app.use(cors(corsOptions));

// Body & Cookie Parsers with Payload Limits
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Enterprise NoSQL Query Injection & Input Sanitization
app.use(sanitizeRequests);

// Disable ETags to prevent browser from reusing 304 responses with cached CORS headers
app.set("etag", false);

// General API Rate Limiter
app.use("/api", apiLimiter);

// Cache control headers: APIs are live and must never be 304 cached across different dev origins
app.use("/api", (req, res, next) => {
  res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  res.header("Surrogate-Control", "no-store");
  res.header("Vary", "Origin");
  next();
});

// ==========================================
// Health & Diagnostic Routes
// ==========================================
app.get("/api/health", (req, res) => {
  return ApiResponse.send(res, 200, "Vista HRMS & Enterprise API is running smoothly", {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    nodeVersion: process.version,
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Vista HRMS & CRM Enterprise API is running successfully!",
  });
});

// ==========================================
// Master Application Routes (/api)
// ==========================================
app.use("/api", apiRouter);

// ==========================================
// 404 Not Found Handler
// ==========================================
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`));
});

// ==========================================
// Centralized Error Handler (Last Middleware)
// ==========================================
app.use(errorHandler);

export default app;