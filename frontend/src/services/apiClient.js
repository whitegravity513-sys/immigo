import axios from "axios";
import appConfig from "../config/appConfig.js";

/**
 * Enterprise Centralized Axios API Client
 * Automatically manages Authorization headers, credentials, and global errors.
 */
export const apiClient = axios.create({
  baseURL: appConfig.API_BASE_URL,
  withCredentials: true,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
});

// Request Interceptor: Attach Token dynamically from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(appConfig.STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    // Prevent browser disk cache from reusing 304 responses across dev ports (5173 / 5174)
    if (config.method?.toLowerCase() === "get") {
      config.params = { ...(config.params || {}), _t: Date.now() };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error and 401 Session Handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (Expired Session)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If refresh token route itself failed, clear storage
      if (originalRequest.url?.includes("/auth/admin/refresh-token")) {
        localStorage.removeItem(appConfig.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(appConfig.STORAGE_KEYS.USER);
        localStorage.removeItem(appConfig.STORAGE_KEYS.ROLE);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
