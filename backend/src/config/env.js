import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const DEV_JWT_FALLBACK = "dev-local-jwt-secret-not-for-production";
const DEV_REFRESH_FALLBACK = "dev-local-refresh-secret-not-for-production";

const rawJwtSecret = String(process.env.JWT_SECRET || "").trim();
const rawAccessSecret = String(process.env.JWT_ACCESS_SECRET || "").trim();
const rawRefreshSecret = String(process.env.JWT_REFRESH_SECRET || "").trim();

if (isProduction) {
  if (!rawJwtSecret && !rawAccessSecret) {
    throw new Error("FATAL: JWT_SECRET or JWT_ACCESS_SECRET must be set in production.");
  }
  if (!rawRefreshSecret && !rawJwtSecret) {
    throw new Error("FATAL: JWT_REFRESH_SECRET must be set in production.");
  }
}

const extraCorsOrigins = String(process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vista",
  JWT_SECRET: rawJwtSecret || rawAccessSecret || DEV_JWT_FALLBACK,
  JWT_ACCESS_SECRET: rawAccessSecret || rawJwtSecret || DEV_JWT_FALLBACK,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.ACCESS_TOKEN_EXPIRES || "7d",
  JWT_REFRESH_SECRET: rawRefreshSecret || rawJwtSecret || DEV_REFRESH_FALLBACK,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || process.env.REFRESH_TOKEN_EXPIRES || "30d",
  EMAIL_HOST: process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com",
  EMAIL_PORT: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || "587", 10),
  EMAIL_USER: process.env.SMTP_USER || process.env.EMAIL_USER || "",
  EMAIL_PASS: process.env.SMTP_PASS || process.env.EMAIL_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "no-reply@vesta.in",
  VENDOR_NOTIFICATION_EMAIL: process.env.VENDOR_NOTIFICATION_EMAIL || "abhishekyadav36219@gmail.com",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  SUPERADMIN_NAME: process.env.SUPER_ADMIN_NAME || process.env.SUPERADMIN_NAME || "Admin",
  SUPERADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || "superadmin@vesta.in",
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || "superadmin@vesta.in",
  SUPERADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || process.env.SUPERADMIN_PASSWORD || "",
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  ALLOWED_ORIGINS: Array.from(
    new Set([
      "https://crm.vesta.in",
      "https://vesta.in",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:5177",
      "http://localhost:5178",
      "http://localhost:3000",
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim().replace(/\/+$/, "")] : []),
      ...extraCorsOrigins,
    ])
  ),
  isProduction,
};

export const getJwtVerificationSecrets = () =>
  Array.from(new Set([env.JWT_SECRET, env.JWT_ACCESS_SECRET].filter(Boolean)));

export default env;
