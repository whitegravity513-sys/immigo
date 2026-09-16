import apiClient from "./apiClient.js";

export const adminLogin = async (email, password) => {
  const res = await apiClient.post("/auth/admin/login", { email, password });
  return res.data;
};

export const adminVerifyOTP = async (email, otp) => {
  const res = await apiClient.post("/auth/admin/verify-otp", { email, otp });
  return res.data;
};

export const adminRefreshToken = async () => {
  const res = await apiClient.post("/auth/admin/refresh-token", {});
  return res.data;
};

export const adminLogout = async () => {
  const res = await apiClient.post("/auth/admin/logout", {});
  return res.data;
};

export const employeeLogin = async (identifier, password) => {
  const res = await apiClient.post("/auth/employee/login", {
    email: identifier,
    employeeId: identifier,
    password,
  });
  return res.data;
};

export default {
  adminLogin,
  adminVerifyOTP,
  adminRefreshToken,
  adminLogout,
  employeeLogin,
};
