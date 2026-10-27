import apiClient from "./apiClient.js";

export const permissionService = {
  async getMyPermissions() {
    const res = await apiClient.get("/auth/me/permissions");
    return res.data;
  },

  async getModulesAndPermissions() {
    const res = await apiClient.get("/permissions/modules");
    return res.data;
  },

  async getAdmins(params = {}) {
    const res = await apiClient.get("/admins", { params });
    return res.data;
  },

  async getAdminById(adminId) {
    const res = await apiClient.get(`/admins/${adminId}`);
    return res.data;
  },

  async createAdmin(data) {
    const res = await apiClient.post("/admins", data);
    return res.data;
  },

  async updateAdmin(adminId, data) {
    const res = await apiClient.patch(`/admins/${adminId}`, data);
    return res.data;
  },

  async deleteAdmin(adminId) {
    const res = await apiClient.delete(`/admins/${adminId}`);
    return res.data;
  },

  async getAdminPermissions(adminId) {
    const res = await apiClient.get(`/admins/${adminId}/permissions`);
    return res.data;
  },

  async updateAdminPermissions(adminId, { permissions, deniedPermissions = [], notes = "" }) {
    const res = await apiClient.put(`/admins/${adminId}/permissions`, {
      permissions,
      deniedPermissions,
      notes,
    });
    return res.data;
  },

  async getAuditLogs(params = {}) {
    const res = await apiClient.get("/permissions/audit-logs", { params });
    return res.data;
  },
};

export default permissionService;
