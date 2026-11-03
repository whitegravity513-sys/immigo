import apiClient from "./apiClient.js";

export const candidateActivityService = {
  getCandidateActivities: async (candidateId) => {
    try {
      const res = await apiClient.get(`/candidates/${candidateId}/activities`);
      return res.data?.activities || [];
    } catch (err) {
      console.warn("Failed to fetch candidate activities:", err.message);
      return [];
    }
  },

  addCandidateRemark: async (candidateId, data) => {
    const res = await apiClient.post(`/candidates/${candidateId}/remarks`, data);
    return res.data;
  },

  getCandidateProcessDetails: async (candidateId) => {
    const res = await apiClient.get(`/candidates/${candidateId}/process-details`);
    return res.data;
  },
};

export default candidateActivityService;

