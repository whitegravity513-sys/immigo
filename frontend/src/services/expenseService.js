import apiClient from "./apiClient.js";

export const getExpenses = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await apiClient.get(`/admin/expenses${query ? `?${query}` : ""}`);
  return res.data;
};

export const createExpense = async (payload) => {
  const res = await apiClient.post("/admin/expenses", payload);
  return res.data;
};

export const updateExpense = async (id, payload) => {
  const res = await apiClient.put(`/admin/expenses/${id}`, payload);
  return res.data;
};

export const deleteExpense = async (id) => {
  const res = await apiClient.delete(`/admin/expenses/${id}`);
  return res.data;
};

export default {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
