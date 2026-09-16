import dotenv from "dotenv";
dotenv.config();

/**
 * Validated and centralized environment configuration.
 * Adheres to 12-factor application architecture.
 */
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vista",
  JWT_SECRET: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || "super-secret-jwt-key-change-in-prod-2026",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.ACCESS_TOKEN_EXPIRES || "7d",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "super-secret-refresh-key-change-in-prod-2026",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || process.env.REFRESH_TOKEN_EXPIRES || "30d",
  EMAIL_HOST: process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com",
  EMAIL_PORT: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || "587", 10),
  EMAIL_USER: process.env.SMTP_USER || process.env.EMAIL_USER || "",
  EMAIL_PASS: process.env.SMTP_PASS || process.env.EMAIL_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "no-reply@vesta.in",
  SUPERADMIN_NAME: process.env.SUPER_ADMIN_NAME || process.env.SUPERADMIN_NAME || "Super Admin",
  SUPERADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || "superadmin@vesta.in",
  SUPERADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || process.env.SUPERADMIN_PASSWORD || "SuperAdmin@2026!",
  ALLOWED_ORIGINS: [
    "https://crm.vesta.in",
    "https://vesta.in",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:5178",
    "http://localhost:3000",
  ],
  isProduction: process.env.NODE_ENV === "production",
};

export default env;
