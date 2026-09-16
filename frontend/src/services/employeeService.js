import apiClient from "./apiClient.js";

export const getEmployees = async () => {
  const res = await apiClient.get("/admin/employee/list");
  return res.data;
};

export const getEmployeeList = getEmployees;

export const getEmployeeHistory = async (id) => {
  const res = await apiClient.get(`/admin/employee/${id}/history`);
  return res.data;
};

export const getEmployeeDetails = async (id, month, year) => {
  let url = `/admin/employee/${id}/monthly`;
  if (month && year) {
    url += `?month=${month}&year=${year}`;
  }
  const res = await apiClient.get(url);
  return res.data;
};

export const getEmployeeLeaves = async (id) => {
  const res = await apiClient.get(`/admin/employee/${id}/leaves`);
  return res.data;
};

export const getEmployeeNote = async (id, date = "") => {
  const url = date ? `/admin/employee/${id}/note?date=${date}` : `/admin/employee/${id}/note`;
  const res = await apiClient.get(url);
  return res.data;
};

export const getEmployeeMonthlyReport = async (id, month, year) => {
  const res = await apiClient.get(`/admin/employee/${id}/monthly?month=${month}&year=${year}`);
  return res.data;
};

export const createEmployee = async (payload) => {
  const res = await apiClient.post("/admin/employee/create", payload);
  return res.data;
};

export const updateEmployee = async (id, payload) => {
  const res = await apiClient.put(`/admin/employee/update/${id}`, payload);
  return res.data;
};

export const deactivateEmployee = async (id) => {
  const res = await apiClient.put(`/admin/employee/deactivate/${id}`);
  return res.data;
};

export const setLeaveBalance = async (id, leaveBalance) => {
  const res = await apiClient.put(`/admin/employee/${id}/leave-balance`, { leaveBalance });
  return res.data;
};

export default {
  getEmployees,
  getEmployeeList,
  getEmployeeHistory,
  getEmployeeDetails,
  getEmployeeLeaves,
  getEmployeeNote,
  getEmployeeMonthlyReport,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  setLeaveBalance,
};
