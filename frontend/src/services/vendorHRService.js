import apiClient from "./apiClient.js";

export const vendorHRService = {
  async login(email, password) {
    const response = await apiClient.post("/v1/vendor-hr/auth/login", { email, password });
    return response.data;
  },

  async getDashboard(params = {}) {
    const response = await apiClient.get("/v1/vendor-hr/dashboard", { params });
    return response.data?.data || response.data;
  },

  async getJobs(params = {}) {
    const response = await apiClient.get("/v1/jobs", { params });
    return response.data?.data || response.data;
  },

  async submitCandidate(candidateData) {
    const response = await apiClient.post("/v1/recruitment/candidates", candidateData);
    return response.data?.data || response.data;
  },

  async updateCandidateStage(applicationId, data) {
    const response = await apiClient.put(`/v1/recruitment/applications/${applicationId}/stage`, data);
    return response.data?.data || response.data;
  },

  async reassignCandidate(applicationId, data) {
    const response = await apiClient.post(`/v1/recruitment/applications/${applicationId}/reassign`, data);
    return response.data?.data || response.data;
  },

  async scheduleInterview(interviewData) {
    const response = await apiClient.post("/v1/recruitment/interviews", interviewData);
    return response.data?.data || response.data;
  },

  async recordInterviewFeedback(interviewId, feedbackData) {
    const response = await apiClient.put(`/v1/recruitment/interviews/${interviewId}/feedback`, feedbackData);
    return response.data?.data || response.data;
  },

  async getApplications(params = {}) {
    const response = await apiClient.get("/v1/recruitment/applications", { params });
    return response.data?.data || response.data;
  },

  async getInterviews(params = {}) {
    const response = await apiClient.get("/v1/recruitment/interviews", { params });
    return response.data?.data || response.data;
  },

  async getActivities(params = {}) {
    const response = await apiClient.get("/v1/hr-activities", { params });
    return response.data?.data || response.data;
  },
};

export default vendorHRService;
