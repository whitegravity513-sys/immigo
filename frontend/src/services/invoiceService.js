import apiClient from "./apiClient.js";

export const getAllInvoices = async () => {
  const res = await apiClient.get("/admin/invoices/all");
  return res.data;
};

export const getInvoices = getAllInvoices;

export const getInvoicesByProject = async (projectId) => {
  const res = await apiClient.get(`/admin/invoices/project/${projectId}`);
  return res.data;
};

export const getInvoiceById = async (id) => {
  const res = await apiClient.get(`/admin/invoices/${id}`);
  return res.data;
};

export const createInvoice = async (payload) => {
  const res = await apiClient.post("/admin/invoices", payload);
  return res.data;
};

export const updateInvoice = async (id, payload) => {
  const res = await apiClient.put(`/admin/invoices/${id}`, payload);
  return res.data;
};

export const deleteInvoice = async (id) => {
  const res = await apiClient.delete(`/admin/invoices/${id}`);
  return res.data;
};

export default {
  getAllInvoices,
  getInvoices,
  getInvoicesByProject,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
