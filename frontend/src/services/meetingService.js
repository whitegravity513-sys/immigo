import apiClient from "./apiClient.js";

export const meetingService = {
  getCalendarStats: async () => {
    try {
      const res = await apiClient.get("/admin/meetings/calendar-stats");
      return res.data;
    } catch (err) {
      // Fallback if routed via /meetings
      try {
        const res = await apiClient.get("/meetings/calendar-stats");
        return res.data;
      } catch (e) {
        throw err;
      }
    }
  },

  getMeetings: async (params = {}) => {
    try {
      const res = await apiClient.get("/admin/meetings", { params });
      return res.data;
    } catch (err) {
      try {
        const res = await apiClient.get("/meetings", { params });
        return res.data;
      } catch (e) {
        throw err;
      }
    }
  },

  createMeeting: async (data) => {
    try {
      const res = await apiClient.post("/admin/meetings", data);
      return res.data;
    } catch (err) {
      try {
        const res = await apiClient.post("/meetings", data);
        return res.data;
      } catch (e) {
        throw err;
      }
    }
  },

  updateMeeting: async (id, data) => {
    try {
      const res = await apiClient.put(`/admin/meetings/${id}`, data);
      return res.data;
    } catch (err) {
      try {
        const res = await apiClient.put(`/meetings/${id}`, data);
        return res.data;
      } catch (e) {
        throw err;
      }
    }
  },

  rescheduleMeeting: async (id, data) => {
    try {
      const res = await apiClient.put(`/admin/meetings/${id}/reschedule`, data);
      return res.data;
    } catch (err) {
      try {
        const res = await apiClient.put(`/meetings/${id}/reschedule`, data);
        return res.data;
      } catch (e) {
        throw err;
      }
    }
  },

  cancelMeeting: async (id, reason = "") => {
    try {
      const res = await apiClient.put(`/admin/meetings/${id}/cancel`, { reason });
      return res.data;
    } catch (err) {
      try {
        const res = await apiClient.put(`/meetings/${id}/cancel`, { reason });
        return res.data;
      } catch (e) {
        throw err;
      }
    }
  },

  deleteMeeting: async (id) => {
    try {
      const res = await apiClient.delete(`/admin/meetings/${id}`);
      return res.data;
    } catch (err) {
      try {
        const res = await apiClient.delete(`/meetings/${id}`);
        return res.data;
      } catch (e) {
        throw err;
      }
    }
  },
};

export default meetingService;

