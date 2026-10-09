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

app.use("/uploads", cors(corsOptions), express.static(path.join(process.cwd(), "uploads")));

app.use(compression({
  threshold: 1024, 
  level: 6,
}));

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.disable("x-powered-by");

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(sanitizeRequests);

app.set("etag", false);

app.use("/api", apiLimiter);

app.use("/api", (req, res, next) => {
  res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  res.header("Surrogate-Control", "no-store");
  res.header("Vary", "Origin");
  next();
});

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

app.use("/api", apiRouter);
// Fallback direct mount to prevent 404 if request is made without /api prefix
app.use(apiRouter);

app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`));
});

app.use(errorHandler);

export default app;