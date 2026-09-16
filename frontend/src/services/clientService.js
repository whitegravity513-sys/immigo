import apiClient from "./apiClient.js";

export const getClients = async (search = "") => {
  const res = await apiClient.get(`/admin/clients?search=${encodeURIComponent(search)}`);
  return res.data;
};

export const createClient = async (payload) => {
  const res = await apiClient.post("/admin/clients", payload);
  return res.data;
};

export const updateClient = async (id, payload) => {
  const res = await apiClient.put(`/admin/clients/${id}`, payload);
  return res.data;
};

export const deleteClient = async (id) => {
  const res = await apiClient.delete(`/admin/clients/${id}`);
  return res.data;
};

export default {
  getClients,
  createClient,
  updateClient,
  deleteClient,
};
