/**
 * Enterprise Frontend Application Configuration
 */
export const appConfig = {
  API_BASE_URL: import.meta.env.VITE_API_BASE || "http://localhost:5000/api",
  APP_NAME: "Vista HRMS & CRM Enterprise",
  STORAGE_KEYS: {
    TOKEN: "token",
    USER: "user",
    ROLE: "role",
    SESSION_TIMESTAMP: "sessionTimestamp",
  },
};

export default appConfig;
