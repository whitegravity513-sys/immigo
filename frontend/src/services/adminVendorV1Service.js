import apiClient from "./apiClient.js";

export const adminVendorV1Service = {
  async getVendors(params = {}) {
    const response = await apiClient.get("/v1/vendors", { params });
    return response.data?.data || response.data;
  },

  async getVendorDetails(id) {
    const response = await apiClient.get(`/v1/vendors/${id}`);
    return response.data?.data || response.data;
  },

  async createVendor(data) {
    const response = await apiClient.post("/v1/vendors", data);
    return response.data?.data || response.data;
  },

  async updateVendor(id, data) {
    const response = await apiClient.put(`/v1/vendors/${id}`, data);
    return response.data?.data || response.data;
  },

  async assignVendorToProject(data) {
    const response = await apiClient.post("/v1/assignments/vendor", data);
    return response.data?.data || response.data;
  },

  async removeVendorFromProject(data) {
    const response = await apiClient.post("/v1/assignments/remove-vendor", data);
    return response.data?.data || response.data;
  },

  async assignVendorHRToProject(data) {
    const response = await apiClient.post("/v1/assignments/vendor-hr", data);
    return response.data?.data || response.data;
  },

  async batchAssignHRToProjectsAndVendors(data) {
    const response = await apiClient.post("/v1/assignments/batch-hr", data);
    return response.data?.data || response.data;
  },

  async removeAssignment(data) {
    const response = await apiClient.post("/v1/assignments/remove", data);
    return response.data?.data || response.data;
  },

  async createMilestone(data) {
    const response = await apiClient.post("/v1/vendor-payments/milestones", data);
    return response.data?.data || response.data;
  },

  async updateMilestone(id, data) {
    const response = await apiClient.put(`/v1/vendor-payments/milestones/${id}`, data);
    return response.data?.data || response.data;
  },

  async markPaymentAsPaid(id, data) {
    const response = await apiClient.post(`/v1/vendor-payments/milestones/${id}/pay`, data);
    return response.data?.data || response.data;
  },

  async getMilestones(params = {}) {
    const response = await apiClient.get("/v1/vendor-payments/milestones", { params });
    return response.data?.data || response.data;
  },

  async getPaymentAnalytics() {
    const response = await apiClient.get("/v1/vendor-payments/analytics");
    return response.data?.data || response.data;
  },

  async getAssignments(params = {}) {
    const response = await apiClient.get("/v1/assignments", { params });
    return response.data?.data || response.data;
  },

  async getHRActivities(params = {}) {
    const response = await apiClient.get("/v1/hr-activities", { params });
    return response.data?.data || response.data;
  },
};

export default adminVendorV1Service;
