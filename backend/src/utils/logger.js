
const maskSensitiveData = (data) => {
  if (!data || typeof data !== "object") return data;

  const sensitiveKeys = ["password", "passwordHash", "otp", "token", "refreshToken", "accessToken"];
  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      sanitized[key] = "********";
    } else if (typeof sanitized[key] === "object") {
      sanitized[key] = maskSensitiveData(sanitized[key]);
    }
  }

  return sanitized;
};

export const logger = {
  info: (msg, meta = {}) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, maskSensitiveData(meta));
  },
  warn: (msg, meta = {}) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, maskSensitiveData(meta));
  },
  error: (msg, err = null) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, err?.stack || err || "");
  },
};

export default logger;
