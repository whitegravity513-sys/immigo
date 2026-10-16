import { apiClient } from "./apiClient.js";

export const activityService = {
  getAdminActivities: async (params = {}) => {
    try {
      const res = await apiClient.get("/admin/activities", { params });
      if (res.data?.success) {
        return res.data;
      }
    } catch (err) {
      console.warn("Failed to fetch admin activities from server:", err.message);
    }

    
    const raw = localStorage.getItem("crm_recent_activities_v1") || "[]";
    const list = JSON.parse(raw);
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const startIndex = (page - 1) * limit;

    return {
      activities: list.slice(startIndex, startIndex + limit),
      total: list.length,
      page,
      limit,
      totalPages: Math.ceil(list.length / limit) || 1,
    };
  },

  getEmployeeActivities: async (params = {}) => {
    try {
      const res = await apiClient.get("/employee/activities", { params });
      if (res.data?.success) {
        return res.data;
      }
    } catch (err) {
      console.warn("Failed to fetch employee activities from server:", err.message);
    }

    const raw = localStorage.getItem("crm_employee_activities_v1") || "[]";
    const list = JSON.parse(raw);
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const startIndex = (page - 1) * limit;

    return {
      activities: list.slice(startIndex, startIndex + limit),
      total: list.length,
      page,
      limit,
      totalPages: Math.ceil(list.length / limit) || 1,
    };
  },
};

export default activityService;
