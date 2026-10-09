const getApiBaseUrl = () => {
  const isBrowser = typeof window !== "undefined";
  const isLocalHost = isBrowser && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  let rawUrl = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || "";

  // If running on production / deployed domain (e.g. Vercel) and URL is either empty or pointing to localhost
  if (!isLocalHost) {
    if (!rawUrl || rawUrl.includes("localhost") || rawUrl.includes("127.0.0.1")) {
      rawUrl = "https://immigo.onrender.com/api";
    }
  }

  if (!rawUrl) {
    rawUrl = "http://localhost:5000/api";
  }

  rawUrl = rawUrl.trim().replace(/\/+$/, "");
  if (!rawUrl.endsWith("/api")) {
    rawUrl = `${rawUrl}/api`;
  }

  return rawUrl;
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

