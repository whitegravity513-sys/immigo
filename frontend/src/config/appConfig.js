/**
 * Enterprise Frontend Application Configuration
 */
const getApiBaseUrl = () => {
  // If explicitly specified in environment, prioritize it
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  
  // If running in production browser on Vercel or remote domain, use Render backend
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://immigo.onrender.com/api";
  }

  // Local development default
  return "http://localhost:5000/api";
};

export const appConfig = {
  API_BASE_URL: getApiBaseUrl(),
  APP_NAME: "immiGo HRMS & Operations Platform",
  STORAGE_KEYS: {
    TOKEN: "token",
    USER: "user",
    ROLE: "role",
    SESSION_TIMESTAMP: "sessionTimestamp",
  },
};

export default appConfig;

