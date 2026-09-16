import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const toLocalDateStr = (d) => {
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const useAdminDashboard = (user, token, navigate, location, view) => {
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [employeeMenuOpen, setEmployeeMenuOpen] = useState(true);
  const [expenseMenuOpen, setExpenseMenuOpen] = useState(true);
  const [clientMenuOpen, setClientMenuOpen] = useState(true);
  const [projectMenuOpen, setProjectMenuOpen] = useState(true);
  const [invoiceMenuOpen, setInvoiceMenuOpen] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leavesReport, setLeavesReport] = useState([]);
  const [filterStart, setFilterStart] = useState(null);
  const [filterEnd, setFilterEnd] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employeeHistory, setEmployeeHistory] = useState(null);
  const [employeeHistoryLoading, setEmployeeHistoryLoading] = useState(false);
  const [detailFromDate, setDetailFromDate] = useState(null);
  const [detailToDate, setDetailToDate] = useState(null);
  const [previousPath, setPreviousPath] = useState("/admin/dashboard/employees");
  const [leaveActionModal, setLeaveActionModal] = useState(null);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [leaveActionRemark, setLeaveActionRemark] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({ name: "", email: "", password: "", role: "", joiningDate: "", employeeId: "" });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", designation: "", joiningDate: "", leavingDate: "", leaveBalance: 0, nextMonthLeaves: 0, password: "" });
  const [summaryData, setSummaryData] = useState([]);
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1);
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [inlineLeaveEdit, setInlineLeaveEdit] = useState(null);
  const [inlineLeaveLoading, setInlineLeaveLoading] = useState(false);
  const [notesData, setNotesData] = useState([]);
  const [notesDate, setNotesDate] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);

  const [holidays, setHolidays] = useState([]);
  const [holidayForm, setHolidayForm] = useState({ date: "", title: "", description: "" });
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [employeeDetailView, setEmployeeDetailView] = useState("table");
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [pastAttendanceModal, setPastAttendanceModal] = useState(null);
  const [textModalData, setTextModalData] = useState(null);

  // Expense tracker states
  const [expenses, setExpenses] = useState([]);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ date: toLocalDateStr(new Date()), type: "Expense", amount: "", name: "", project: "", description: "" });
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseFilterDate, setExpenseFilterDate] = useState(null);

  // Renewal states
  const [renewals, setRenewals] = useState([]);
  const [renewalAlerts, setRenewalAlerts] = useState({ expired: [], expiringSoon: [] });
  const [renewalLoading, setRenewalLoading] = useState(false);

  useEffect(() => {
    const effectiveToken = token || localStorage.getItem("vista_auth_token") || localStorage.getItem("token");
    if (effectiveToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${effectiveToken}`;
    }
  }, [token]);

  useEffect(() => { if (errorMsg) { const t = setTimeout(() => setErrorMsg(""), 6000); return () => clearTimeout(t); } }, [errorMsg]);
  useEffect(() => { if (successMsg) { const t = setTimeout(() => setSuccessMsg(""), 6000); return () => clearTimeout(t); } }, [successMsg]);
  useEffect(() => { if (token) fetchAdminReports(); }, [token, view]);
  useEffect(() => { if (token && (view === "live" || view === "dashboard")) fetchNotes(null); }, [view, token]);

  useEffect(() => {
    if (view === "employee-detail" && token) {
      const parts = location.pathname.split("/");
      const empId = parts[parts.indexOf("employee") + 1];
      if (empId) {
        setSelectedEmployeeId(empId);
        fetchEmployeeHistoryById(empId);
        fetchHolidays();
      }
    }
  }, [view, token, location.pathname]);

  // Auto-refresh admin live tracker only when on live view to optimize response time & prevent lag
  useEffect(() => {
    if (token && (view === "live" || view === "dashboard")) {
      const iv = setInterval(() => fetchAdminReports(), 6000);
      return () => clearInterval(iv);
    }
  }, [view, token]);

  async function fetchAdminReports() {
    try {
      const effectiveToken = token || localStorage.getItem("vista_auth_token") || localStorage.getItem("token");
      const authHeaders = effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {};

      if (view === "live" || view === "dashboard") {
        let url = `${API_BASE}/admin/attendance`;
        if (filterStart && filterEnd) url = `${API_BASE}/admin/attendance/range?start=${filterStart.toISOString().split('T')[0]}&end=${filterEnd.toISOString().split('T')[0]}`;
        const r = await axios.get(url, { headers: { ...authHeaders, 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0' } });
        setAttendanceReport(r.data);
      } else if (view === "employees") {
        const r = await axios.get(`${API_BASE}/admin/employee/list`, { headers: authHeaders });
        setEmployees(Array.isArray(r.data) ? r.data : (r.data.employees || []));
      } else if (view === "leaves") {
        const r = await axios.get(`${API_BASE}/admin/leaves`, { headers: authHeaders });
        setLeavesReport(r.data);
      } else if (view === "summary") {
        fetchSummary();
      } else if (view === "expenses") {
        fetchExpenses();
      } else if (view === "renewals") {
        fetchRenewals();
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    }
  }

  async function fetchSummary() {
    setSummaryLoading(true);
    try {
      const effectiveToken = token || localStorage.getItem("vista_auth_token") || localStorage.getItem("token");
      const r = await axios.get(`${API_BASE}/admin/attendance/summary?month=${summaryMonth}&year=${summaryYear}`, {
        headers: effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}
      });
      setSummaryData(r.data.summary || []);
    } catch { setErrorMsg("Failed to load attendance summary."); }
    finally { setSummaryLoading(false); }
  }

  async function fetchNotes(dateObj) {
    const effectiveToken = token || localStorage.getItem("vista_auth_token") || localStorage.getItem("token");
    if (!effectiveToken) return;
    setNotesLoading(true);
    try {
      const dateStr = dateObj ? (typeof dateObj === "string" ? dateObj : dateObj.toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
      const r = await axios.get(`${API_BASE}/admin/attendance/notes?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${effectiveToken}` }
      });
      setNotesData(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      console.warn("fetchNotes:", err?.message);
      setNotesData([]);
    }
    finally { setNotesLoading(false); }
  }

  async function fetchHolidays() {
    try {
      const r = await axios.get(`${API_BASE}/admin/holidays`);
      setHolidays(r.data);
    } catch { setErrorMsg("Failed to load holidays."); }
  }

  async function fetchExpenses() {
    setExpenseLoading(true);
    try {
      const r = await axios.get(`${API_BASE}/admin/expenses`);
      setExpenses(r.data || []);
    } catch {
      setErrorMsg("Failed to load expense records.");
    } finally {
      setExpenseLoading(false);
    }
  }

  async function fetchRenewals() {
    setRenewalLoading(true);
    try {
      const r = await axios.get(`${API_BASE}/admin/renewals`);
      setRenewals(r.data || []);
    } catch {
      setErrorMsg("Failed to load renewals.");
    } finally {
      setRenewalLoading(false);
    }
  }

  async function fetchRenewalAlerts() {
    try {
      const r = await axios.get(`${API_BASE}/admin/renewals/alerts`);
      setRenewalAlerts(r.data);
    } catch (err) {
      console.error("Failed to fetch renewal alerts:", err);
    }
  }

  useEffect(() => {
    if (token && view === "dashboard") {
      fetchRenewalAlerts();
    }
  }, [token, view]);

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (expenseForm._id) {
        // Edit mode
        await axios.put(`${API_BASE}/admin/expenses/${expenseForm._id}`, expenseForm);
        setSuccessMsg("Expense record updated successfully");
      } else {
        // Create mode
        await axios.post(`${API_BASE}/admin/expenses`, expenseForm);
        setSuccessMsg("Expense record saved successfully");
      }
      setExpenseForm({
        date: toLocalDateStr(new Date()),
        type: "Expense",
        amount: "",
        name: "",
        project: "",
        description: ""
      });
      fetchExpenses();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save expense record.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpenseClick = (rec) => {
    setExpenseForm({
      _id: rec._id,
      date: rec.date,
      type: rec.type,
      amount: rec.amount,
      name: rec.name,
      project: rec.project || "",
      description: rec.description || ""
    });
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense record?")) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/admin/expenses/${id}`);
      setSuccessMsg("Expense record deleted successfully");
      fetchExpenses();
    } catch {
      setErrorMsg("Failed to delete expense record.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHolidaySubmit = async (e) => {
    e.preventDefault();
    setHolidayLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const r = await axios.post(`${API_BASE}/admin/holidays`, holidayForm);
      setSuccessMsg(r.data.message);
      setHolidayForm({ date: "", title: "", description: "" });
      fetchHolidays();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save holiday.");
    } finally {
      setHolidayLoading(false);
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    if (!window.confirm("Are you sure you want to delete this holiday?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const r = await axios.delete(`${API_BASE}/admin/holidays/${holidayId}`);
      setSuccessMsg(r.data.message);
      fetchHolidays();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to delete holiday.");
    }
  };

  const handleSavePastAttendance = async () => {
    if (!pastAttendanceModal.date) {
      setErrorMsg("Date is required!");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      let status = pastAttendanceModal.status;
      let halfSalaryDeduct = pastAttendanceModal.halfSalaryDeduct;
      if (status === "Half Day") {
        status = "Present";
        halfSalaryDeduct = true;
      } else if (status === "Present") {
        halfSalaryDeduct = false;
      }
      
      const payload = {
        employeeId: selectedEmployeeId,
        date: pastAttendanceModal.date,
        status,
        checkInTime: pastAttendanceModal.checkInTime ? new Date(`${pastAttendanceModal.date}T${pastAttendanceModal.checkInTime}:00`).toISOString() : null,
        checkOutTime: pastAttendanceModal.checkOutTime ? new Date(`${pastAttendanceModal.date}T${pastAttendanceModal.checkOutTime}:00`).toISOString() : null,
        checkOutNote: pastAttendanceModal.checkOutNote || "",
        halfSalaryDeduct,
      };
      
      await axios.post(`${API_BASE}/admin/attendance/update`, payload);
      setSuccessMsg("Attendance recorded successfully!");
      setPastAttendanceModal(null);
      fetchEmployeeHistoryById(selectedEmployeeId);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update attendance.");
    } finally {
      setLoading(false);
    }
  };

  const openTextModal = (title, content) => {
    if (!content) return;
    setTextModalData({ title, content });
  };


  const handleSetLeaveBalance = async () => {
    if (!inlineLeaveEdit) return;
    setInlineLeaveLoading(true);
    try {
      await axios.put(`${API_BASE}/admin/employee/${inlineLeaveEdit.empId}/leave-balance`, {
        leaveBalance: inlineLeaveEdit.leaveBalance,
        nextMonthLeaves: inlineLeaveEdit.nextMonthLeaves,
      });
      setSuccessMsg("Leave balance updated!");
      setInlineLeaveEdit(null);
      fetchSummary();
    } catch (err) { setErrorMsg(err.response?.data?.message || "Failed to update leave balance."); }
    finally { setInlineLeaveLoading(false); }
  };

  const openEmployeeDetail = (empId, fromPath) => {
    setSelectedEmployeeId(empId);
    setPreviousPath(fromPath || location.pathname);
    setDetailFromDate(null); setDetailToDate(null); setEmployeeHistory(null);
    navigate(`/admin/dashboard/employee/${empId}`);
    fetchEmployeeHistoryById(empId);
  };

  const handleGoBack = () => {
    if (previousPath.startsWith("/")) {
      navigate(previousPath);
    } else {
      navigate(`/admin/dashboard/${previousPath}`);
    }
  };

  async function fetchEmployeeHistoryById(empId, fromDate, toDate) {
    setEmployeeHistoryLoading(true);
    try {
      const r = await axios.get(`${API_BASE}/admin/employee/${empId}/history`);
      let data = r.data;
      if (fromDate || toDate) {
        const from = fromDate ? fromDate.toISOString().split("T")[0] : null;
        const to = toDate ? toDate.toISOString().split("T")[0] : null;
        data = { ...data, attendanceHistory: data.attendanceHistory.filter(a => { if (from && a.date < from) return false; if (to && a.date > to) return false; return true; }) };
      }
      setEmployeeHistory(data);
    } catch { setErrorMsg("Failed to load employee details."); }
    finally { setEmployeeHistoryLoading(false); }
  }

  const handleOpenAddModal = async () => {
    setLoading(true); setErrorMsg("");
    try {
      const r = await axios.get(`${API_BASE}/admin/employee/next-id`);
      setEmployeeForm({ name: "", email: "", password: "", role: "", joiningDate: new Date().toISOString().split("T")[0], employeeId: r.data.employeeId });
      setIsAddModalOpen(true);
    } catch { setErrorMsg("Failed to generate next employee ID."); }
    finally { setLoading(false); }
  };

  const handleCreateEmployeeSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setErrorMsg("");
    try {
      const r = await axios.post(`${API_BASE}/admin/employee/create`, employeeForm);
      setSuccessMsg(r.data.message);
      setEmployeeForm({ name: "", email: "", password: "", role: "", joiningDate: "", employeeId: "" });
      setIsAddModalOpen(false); fetchAdminReports();
    } catch (err) { setErrorMsg(err.response?.data?.message || "Failed to create employee."); }
    finally { setLoading(false); }
  };

  const handleDeactivateEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this employee? Their historical logs will remain.")) return;
    setLoading(true); setErrorMsg(""); setSuccessMsg("");
    try {
      const r = await axios.put(`${API_BASE}/admin/employee/deactivate/${id}`);
      setSuccessMsg(r.data.message); fetchAdminReports();
    } catch (err) { setErrorMsg(err.response?.data?.message || "Failed to deactivate employee."); }
    finally { setLoading(false); }
  };

  const handleEditClick = (emp) => {
    setEditingEmployee(emp);
    setEditForm({ name: emp.name, email: emp.email, designation: emp.designation || emp.role || "", joiningDate: emp.joiningDate ? emp.joiningDate.split("T")[0] : "", leavingDate: emp.leavingDate ? emp.leavingDate.split("T")[0] : "", leaveBalance: emp.leaveBalance || 0, nextMonthLeaves: emp.nextMonthLeaves || 0, password: "" });
  };

  const handleUpdateEmployeeSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setErrorMsg("");
    try {
      const r = await axios.put(`${API_BASE}/admin/employee/update/${editingEmployee._id}`, editForm);
      setSuccessMsg(r.data.message); setEditingEmployee(null); fetchAdminReports();
    } catch (err) { setErrorMsg(err.response?.data?.message || "Failed to update employee."); }
    finally { setLoading(false); }
  };

  const openLeaveActionModal = (leaveId, action, leave = null) => {
    setLeaveActionRemark("");
    setLeaveActionModal({ leaveId, action, leave });
  };

  const handleSubmitLeaveAction = async () => {
    if (!leaveActionModal) return;
    const { leaveId, action } = leaveActionModal;
    if (action === "Rejected" && !leaveActionRemark.trim()) { setErrorMsg("Rejection remark is required!"); return; }
    setLoading(true);
    try {
      const r = await axios.put(`${API_BASE}/admin/leaves/${leaveId}`, { status: action, adminRemark: leaveActionRemark.trim() });
      setSuccessMsg(r.data.message); setLeaveActionModal(null); setLeaveActionRemark(""); fetchAdminReports();
    } catch (err) { setErrorMsg(err.response?.data?.message || "Failed to update leave status."); }
    finally { setLoading(false); }
  };

  const formatDuration = (s) => {
    if (isNaN(s) || s < 0) return "00:00:00";
    s = Math.floor(s);
    return [Math.floor(s/3600), Math.floor((s%3600)/60), s%60].map(v => String(v).padStart(2,"0")).join(":");
  };
  const formatDate = (ds) => { if (!ds) return "-"; return new Date(ds).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }); };
  const formatTime = (ts) => { if (!ts) return "-"; return new Date(ts).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12: true }); };
  const navigateTo = (path) => { navigate(`/admin/dashboard/${path}`); setSidebarMobileOpen(false); };

  // ── LIVE TRACKER ──────────────────────────────────────────────────────────
  

  return {
    sidebarCollapsed,
    sidebarMobileOpen,
    employeeMenuOpen,
    expenseMenuOpen,
    clientMenuOpen,
    projectMenuOpen,
    invoiceMenuOpen,
    selectedProject,
    previewDoc,
    loading,
    errorMsg,
    successMsg,
    attendanceReport,
    employees,
    leavesReport,
    filterStart,
    filterEnd,
    selectedEmployeeId,
    employeeHistory,
    employeeHistoryLoading,
    detailFromDate,
    detailToDate,
    previousPath,
    leaveActionModal,
    editingAttendance,
    leaveActionRemark,
    isAddModalOpen,
    employeeForm,
    editingEmployee,
    editForm,
    summaryData,
    summaryMonth,
    summaryYear,
    summaryLoading,
    inlineLeaveEdit,
    inlineLeaveLoading,
    notesData,
    notesDate,
    notesLoading,
    holidays,
    holidayForm,
    holidayLoading,
    employeeDetailView,
    calendarMonth,
    calendarYear,
    pastAttendanceModal,
    textModalData,
    expenses,
    expenseLoading,
    expenseForm,
    editingExpense,
    expenseFilterDate,
    renewals,
    renewalAlerts,
    renewalLoading,
    setSidebarCollapsed,
    setSidebarMobileOpen,
    setEmployeeMenuOpen,
    setExpenseMenuOpen,
    setClientMenuOpen,
    setProjectMenuOpen,
    setInvoiceMenuOpen,
    setSelectedProject,
    setPreviewDoc,
    setLoading,
    setErrorMsg,
    setSuccessMsg,
    setAttendanceReport,
    setEmployees,
    setLeavesReport,
    setFilterStart,
    setFilterEnd,
    setSelectedEmployeeId,
    setEmployeeHistory,
    setEmployeeHistoryLoading,
    setDetailFromDate,
    setDetailToDate,
    setPreviousPath,
    setLeaveActionModal,
    setEditingAttendance,
    setLeaveActionRemark,
    setIsAddModalOpen,
    setEmployeeForm,
    setEditingEmployee,
    setEditForm,
    setSummaryData,
    setSummaryMonth,
    setSummaryYear,
    setSummaryLoading,
    setInlineLeaveEdit,
    setInlineLeaveLoading,
    setNotesData,
    setNotesDate,
    setNotesLoading,
    setHolidays,
    setHolidayForm,
    setHolidayLoading,
    setEmployeeDetailView,
    setCalendarMonth,
    setCalendarYear,
    setPastAttendanceModal,
    setTextModalData,
    setExpenses,
    setExpenseLoading,
    setExpenseForm,
    setEditingExpense,
    setExpenseFilterDate,
    setRenewals,
    setRenewalLoading,
    fetchRenewals,
    fetchRenewalAlerts,
    fetchAdminReports,
    fetchSummary,
    fetchNotes,
    fetchHolidays,
    fetchExpenses,
    handleExpenseSubmit,
    handleEditExpenseClick,
    handleDeleteExpense,
    handleCreateHolidaySubmit,
    handleDeleteHoliday,
    handleSavePastAttendance,
    openTextModal,
    handleSetLeaveBalance,
    openEmployeeDetail,
    handleGoBack,
    fetchEmployeeHistoryById,
    handleOpenAddModal,
    handleCreateEmployeeSubmit,
    handleDeactivateEmployee,
    handleEditClick,
    handleUpdateEmployeeSubmit,
    openLeaveActionModal,
    handleSubmitLeaveAction,
    formatDuration,
    formatDate,
    formatTime,
    navigateTo
  };
};
