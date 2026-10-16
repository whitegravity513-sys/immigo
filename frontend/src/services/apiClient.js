import axios from "axios";
import appConfig from "../config/appConfig.js";

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

apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(appConfig.STORAGE_KEYS.TOKEN) ||
      localStorage.getItem("immigo_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken") ||
      localStorage.getItem("immigo_auth_token") ||
      localStorage.getItem("vista_auth_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    if (config.method?.toLowerCase() === "get") {
      config.params = { ...(config.params || {}), _t: Date.now() };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthUrl =
      originalRequest?.url?.includes("/login") ||
      originalRequest?.url?.includes("/register") ||
      originalRequest?.url?.includes("/refresh-token");

    const isAuthError = error.response?.status === 401 || (error.response?.status === 403 && (error.response?.data?.message?.toLowerCase().includes("token") || error.response?.data?.message?.toLowerCase().includes("expired")));
    if (isAuthError && !originalRequest?._retry && !isAuthUrl) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const isAdminSession =
          localStorage.getItem("immigo_user_role") === "ADMIN" ||
          localStorage.getItem("vista_user_role") === "ADMIN" ||
          localStorage.getItem("adminToken") ||
          originalRequest.url?.includes("/admin");

        const refreshEndpoint = isAdminSession
          ? `${appConfig.API_BASE_URL}/auth/admin/refresh-token`
          : `${appConfig.API_BASE_URL}/auth/refresh-token`;

        const refreshRes = await axios.post(
          refreshEndpoint,
          {},
          { withCredentials: true }
        );

        const newAccessToken =
          refreshRes.data?.accessToken ||
          refreshRes.data?.data?.accessToken ||
          refreshRes.data?.token;

        if (newAccessToken) {
          localStorage.setItem(appConfig.STORAGE_KEYS.TOKEN, newAccessToken);
          localStorage.setItem("token", newAccessToken);
          localStorage.setItem("vista_auth_token", newAccessToken);
          localStorage.setItem("immigo_token", newAccessToken);
          if (isAdminSession) {
            localStorage.setItem("adminToken", newAccessToken);
          }

          apiClient.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          processQueue(new Error("Refresh returned empty token"));
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
