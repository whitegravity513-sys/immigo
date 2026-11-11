import apiClient from "./apiClient.js";

const isVendorSession = () =>
  String(localStorage.getItem("role") || "").toUpperCase() === "VENDOR";

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

  searchEmployees: async (search = "") => {
    if (isVendorSession()) return [];
    try {
      const res = await apiClient.get("/admin/meetings/employees", {
        params: { search },
      });
      return res.data?.employees || [];
    } catch (err) {
      if (isVendorSession()) return [];
      try {
        const res = await apiClient.get("/admin/employee/list");
        const list = Array.isArray(res.data) ? res.data : res.data?.employees || [];
        if (!search) return list;
        const q = search.toLowerCase();
        return list.filter(
          (e) =>
            e.name?.toLowerCase().includes(q) ||
            e.employeeId?.toLowerCase().includes(q) ||
            e.email?.toLowerCase().includes(q)
        );
      } catch (e) {
        return [];
      }
    }
  },

  searchVendors: async (search = "") => {
    if (isVendorSession()) return [];
    try {
      const res = await apiClient.get("/admin/meetings/vendors", {
        params: { search },
      });
      return res.data?.vendors || [];
    } catch (err) {
      if (isVendorSession()) return [];
      try {
        const res = await apiClient.get("/v1/vendors", {
          params: { search },
        });
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.vendors)
          ? res.data.vendors
          : [];
        return list.map((v) => ({
          id: v.vendorId || v._id || v.id,
          vendorId: v.vendorId,
          companyName: v.companyName,
          name: v.companyName,
          contactPerson: v.contactPerson || v.companyName,
          email: v.email,
          phone: v.phone || v.mobile || "",
          status: v.status || "Active",
        }));
      } catch (e) {
        return [];
      }
    }
  },

  searchHRs: async (search = "", hrType = "") => {
    try {
      const res = await apiClient.get("/admin/meetings/hrs", {
        params: { search, hrType },
      });
      return res.data?.hrs || [];
    } catch (err) {
      if (isVendorSession()) {
        try {
          const res = await apiClient.get("/meetings/hrs", {
            params: { search, hrType },
          });
          return res.data?.hrs || [];
        } catch (e) {
          return [];
        }
      }
      try {
        const res = await apiClient.get("/admin", {
          params: { role: "HR" },
        });
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.admins)
          ? res.data.admins
          : [];
        return list.map((h) => ({
          id: h._id || h.id,
          name: h.name,
          email: h.email,
          role: h.role || "HR",
          hrType: h.hrType || "EMPLOYEE_HR",
          assignedVendors: h.assignedVendors || [],
          department: h.department || "",
          phone: h.phone || "",
        }));
      } catch (e) {
        return [];
      }
    }
  },

  searchCandidates: async (search = "", vendorId = "") => {
    if (isVendorSession()) return [];
    try {
      const res = await apiClient.get("/admin/meetings/candidates", {
        params: { search, vendorId },
      });
      return res.data?.candidates || [];
    } catch (err) {
      return [];
    }
  },

  getEmployeeMeetings: async (params = {}) => {
    try {
      const res = await apiClient.get("/employee/meetings", { params });
      return res.data;
    } catch (err) {
      return { meetings: [] };
    }
  },

  markMeetingCompleted: async (id, outcomeRemarks = "Meeting completed successfully") => {
    try {
      const res = await apiClient.put(`/admin/meetings/${id}`, {
        status: "COMPLETED",
        attendance: "Present",
        outcome: "Completed",
        outcomeRemarks,
      });
      return res.data;
    } catch (err) {
      try {
        const res = await apiClient.put(`/meetings/${id}`, {
          status: "COMPLETED",
          attendance: "Present",
          outcome: "Completed",
          outcomeRemarks,
        });
        return res.data;
      } catch (e) {
        throw err;
      }
    }
  },
};

export default meetingService;

