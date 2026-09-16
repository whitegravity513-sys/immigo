import apiClient from "./apiClient.js";

export const getExpenseCategories = async () => {
  const res = await apiClient.get("/admin/expense-categories");
  return res.data;
};

export const createExpenseCategory = async (payload) => {
  const res = await apiClient.post("/admin/expense-categories", payload);
  return res.data;
};

export const updateExpenseCategory = async (id, payload) => {
  const res = await apiClient.put(`/admin/expense-categories/${id}`, payload);
  return res.data;
};

export const deleteExpenseCategory = async (id) => {
  const res = await apiClient.delete(`/admin/expense-categories/${id}`);
  return res.data;
};

export default {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
};
