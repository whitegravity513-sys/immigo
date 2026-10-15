import apiClient from "./apiClient.js";

export const adminLogin = async (email, password) => {
  const res = await apiClient.post("/auth/admin/login", { email, password });
  return res.data;
};

export const adminVerifyOTP = async (email, otp) => {
  const res = await apiClient.post("/auth/admin/verify-otp", { email, otp });
  return res.data;
};

export const adminForgotPassword = async (email) => {
  const res = await apiClient.post("/auth/admin/forgot-password", { email });
  return res.data;
};

export const adminResetPassword = async (email, otp, newPassword) => {
  const res = await apiClient.post("/auth/admin/reset-password", { email, otp, newPassword });
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

export const employeeLogin = async (employeeId, password) => {
  const res = await apiClient.post("/auth/employee/login", {
    employeeId: String(employeeId).trim(),
    password,
  });
  return res.data;
};

export const vendorForgotPassword = async (emailOrId) => {
  const res = await apiClient.post("/auth/vendor/forgot-password", { emailOrId });
  return res.data;
};

export const vendorResetPassword = async (email, otp, newPassword) => {
  const res = await apiClient.post("/auth/vendor/reset-password", { email, otp, newPassword });
  return res.data;
};

export default {
  adminLogin,
  adminVerifyOTP,
  adminForgotPassword,
  adminResetPassword,
  adminRefreshToken,
  adminLogout,
  employeeLogin,
  vendorForgotPassword,
  vendorResetPassword,
};
