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
      localStorage.getItem("token") ||
      localStorage.getItem("vista_auth_token") ||
      localStorage.getItem("immigo_token");
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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
