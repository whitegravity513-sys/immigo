import apiClient from "./apiClient.js";

export const getProjects = async () => {
  const res = await apiClient.get("/admin/projects");
  return res.data;
};

export const getProjectById = async (id) => {
  const res = await apiClient.get(`/admin/projects/${id}`);
  return res.data;
};

export const getProjectDetails = getProjectById;

export const createProject = async (payload) => {
  const res = await apiClient.post("/admin/projects", payload);
  return res.data;
};

export const updateProject = async (id, payload) => {
  const res = await apiClient.put(`/admin/projects/${id}`, payload);
  return res.data;
};

export const deleteProject = async (id) => {
  const res = await apiClient.delete(`/admin/projects/${id}`);
  return res.data;
};

export default {
  getProjects,
  getProjectById,
  getProjectDetails,
  createProject,
  updateProject,
  deleteProject,
};
