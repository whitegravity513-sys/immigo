import apiClient from "./apiClient.js";

export const getAllProjectPayments = async () => {
  const res = await apiClient.get("/admin/project-payments/all");
  return res.data;
};

export const getAllPayments = getAllProjectPayments;

export const getPaymentsByProject = async (projectId) => {
  const res = await apiClient.get(`/admin/project-payments/project/${projectId}`);
  return res.data;
};

export const createProjectPayment = async (payload) => {
  const res = await apiClient.post("/admin/project-payments", payload);
  return res.data;
};

export const createPayment = createProjectPayment;

export const updateProjectPayment = async (id, payload) => {
  const res = await apiClient.put(`/admin/project-payments/${id}`, payload);
  return res.data;
};

export const updatePayment = updateProjectPayment;

export const deleteProjectPayment = async (id) => {
  const res = await apiClient.delete(`/admin/project-payments/${id}`);
  return res.data;
};

export const deletePayment = deleteProjectPayment;

export default {
  getAllProjectPayments,
  getAllPayments,
  getPaymentsByProject,
  createProjectPayment,
  createPayment,
  updateProjectPayment,
  updatePayment,
  deleteProjectPayment,
  deletePayment,
};
