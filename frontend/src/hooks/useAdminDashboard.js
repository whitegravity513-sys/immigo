import { useState, useEffect, useCallback } from "react";
import apiClient from "../services/apiClient.js";
import { toLocalDateStr, getIndiaDateString } from "../utils/formatters.js";

export const useAdminDashboard = (user, token, navigate, location, view) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [employeeMenuOpen, setEmployeeMenuOpen] = useState(true);
  const [expenseMenuOpen, setExpenseMenuOpen] = useState(true);
  const [clientMenuOpen, setClientMenuOpen] = useState(true);
  const [projectMenuOpen, setProjectMenuOpen] = useState(true);
  const [invoiceMenuOpen, setInvoiceMenuOpen] = useState(true);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leavesReport, setLeavesReport] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [employeeHistory, setEmployeeHistory] = useState(null);
  const [employeeHistoryLoading, setEmployeeHistoryLoading] = useState(false);
  const [detailFromDate, setDetailFromDate] = useState(null);
  const [detailToDate, setDetailToDate] = useState(null);
  const [leaveActionModal, setLeaveActionModal] = useState(null);
  const isHrContext =
    (user?.role || "").toUpperCase() === "HR" ||
    (typeof window !== "undefined" && window.location.pathname.startsWith("/hr"));
  const basePrefix = isHrContext ? "/hr/dashboard" : "/admin/dashboard";

  const [previousPath, setPreviousPath] = useState(`${basePrefix}/employees`);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [leaveActionRemark, setLeaveActionRemark] = useState("");

  const generateImmiEmployeeId = (joiningDate, dob) => {
    const formatPart = (dStr) => {
      if (!dStr) return null;
      const str = String(dStr).split("T")[0];
      const parts = str.split("-");
      if (parts.length === 3) {
        const yr = parts[0].slice(-2);
        const day = parts[2].padStart(2, "0");
        return `${day}${yr}`;
      }
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return null;
      const day = String(d.getDate()).padStart(2, "0");
      const yr = String(d.getFullYear()).slice(-2);
      return `${day}${yr}`;
    };

    const joinPart = formatPart(joiningDate) || formatPart(getIndiaDateString()) || "DDYY";
    const dobPart = formatPart(dob);
    if (!dobPart) {
      return `IMMI-${joinPart}-DDYY(DOB)`;
    }
    return `IMMI-${joinPart}-${dobPart}`;
  };

  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    email: "",
    personalEmail: "",
    password: "",
    role: "",
    department: "",
    phone: "",
    address: "",
    status: "active",
    previousCompany: "",
    previousPackage: "",
    currentPackage: "",
    experience: "",
    joiningDate: getIndiaDateString(),
    dob: "",
    employeeId: "",
    profileImage: "",
    documents: [],
  });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", designation: "", joiningDate: "", leavingDate: "", leaveBalance: 0, nextMonthLeaves: 0, password: "" });
  const [summaryData, setSummaryData] = useState([]);
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1);
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [holidays, setHolidays] = useState([]);
  const [holidayForm, setHolidayForm] = useState({ date: "", title: "", description: "" });
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [employeeDetailView, setEmployeeDetailView] = useState("table");
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [pastAttendanceModal, setPastAttendanceModal] = useState(null);
  const [textModalData, setTextModalData] = useState(null);

  const [expenses, setExpenses] = useState([]);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ date: toLocalDateStr(new Date()), type: "Expense", amount: "", name: "", project: "", description: "" });
  const [expenseFilterDate, setExpenseFilterDate] = useState(null);

  useEffect(() => {
    const effectiveToken = token || localStorage.getItem("immigo_token") || localStorage.getItem("token") || localStorage.getItem("vista_auth_token");
    if (effectiveToken) {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${effectiveToken}`;
    }
  }, [token]);

  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(""), 6000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 6000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const r = await apiClient.get(`/admin/attendance/summary?month=${summaryMonth}&year=${summaryYear}`);
      setSummaryData(r.data.summary || []);
    } catch {
      setErrorMsg("Failed to load attendance summary.");
    } finally {
      setSummaryLoading(false);
    }
  }, [summaryMonth, summaryYear]);

  const fetchHolidays = useCallback(async () => {
    try {
      const r = await apiClient.get(`/admin/holidays`);
      setHolidays(r.data);
    } catch {
      setErrorMsg("Failed to load holidays.");
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setExpenseLoading(true);
    try {
      const r = await apiClient.get(`/admin/expenses`);
      setExpenses(r.data || []);
    } catch (err) {
      if (err?.response?.status !== 401 && err?.response?.status !== 403) {
        setErrorMsg("Failed to load expense records.");
      }
    } finally {
      setExpenseLoading(false);
    }
  }, []);

  const fetchEmployeeHistoryById = useCallback(async (empId, fromDate, toDate) => {
    const cleanId = String(empId || "").replace(/^virtual-/, "").trim();
    setEmployeeHistoryLoading(true);
    try {
      const r = await apiClient.get(`/admin/employee/${cleanId}/history`);
      let data = r.data || {};

      const rawList = Array.isArray(data.attendanceHistory)
        ? data.attendanceHistory
        : (Array.isArray(data) ? data : []);

      if (fromDate || toDate) {
        const from = fromDate ? fromDate.toISOString().split("T")[0] : null;
        const to = toDate ? toDate.toISOString().split("T")[0] : null;
        const filtered = rawList.filter(a => {
          if (!a) return false;
          if (from && a.date < from) return false;
          if (to && a.date > to) return false;
          return true;
        });
        data = {
          ...data,
          attendanceHistory: filtered,
        };
      } else {
        data = {
          ...data,
          attendanceHistory: rawList,
        };
      }
      setEmployeeHistory(data);
    } catch {
      setErrorMsg("Failed to load employee details.");
    } finally {
      setEmployeeHistoryLoading(false);
    }
  }, []);

  const fetchAdminReports = useCallback(async () => {
    try {
      if (view === "workforce") {
        const [attRes, empRes, leaveRes] = await Promise.allSettled([
          apiClient.get(`/admin/attendance`, { headers: { "Cache-Control": "no-cache", "Pragma": "no-cache", "Expires": "0" } }),
          apiClient.get(`/admin/employee/list`),
          apiClient.get(`/admin/leaves`),
        ]);
        if (attRes.status === "fulfilled") setAttendanceReport(attRes.value.data);
        if (empRes.status === "fulfilled") {
          const d = empRes.value.data;
          setEmployees(Array.isArray(d) ? d : (d.employees || []));
        }
        if (leaveRes.status === "fulfilled") setLeavesReport(leaveRes.value.data);
      } else if (view === "live" || view === "dashboard") {
        const r = await apiClient.get(`/admin/attendance`, { headers: { "Cache-Control": "no-cache", "Pragma": "no-cache", "Expires": "0" } });
        setAttendanceReport(r.data);
      } else if (view === "employees") {
        const r = await apiClient.get(`/admin/employee/list`);
        setEmployees(Array.isArray(r.data) ? r.data : (r.data.employees || []));
      } else if (view === "leaves") {
        const r = await apiClient.get(`/admin/leaves`);
        setLeavesReport(r.data);
      } else if (view === "summary") {
        fetchSummary();
      } else if (view === "expenses") {
        fetchExpenses();
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    }
  }, [view, fetchSummary, fetchExpenses]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) fetchAdminReports();
    });
    return () => {
      cancelled = true;
    };
  }, [token, fetchAdminReports]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) fetchHolidays();
    });
    return () => {
      cancelled = true;
    };
  }, [token, fetchHolidays]);

  useEffect(() => {
    if (view !== "employee-detail" || !token) return;
    const parts = location.pathname.split("/");
    const empId = parts[parts.indexOf("employee") + 1];
    if (!empId) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setSelectedEmployeeId(empId);
      fetchEmployeeHistoryById(empId);
      fetchHolidays();
    });
    return () => {
      cancelled = true;
    };
  }, [view, token, location.pathname, fetchEmployeeHistoryById, fetchHolidays]);

  useEffect(() => {
    if (token) {
      const activeViews = ["live", "dashboard", "workforce", "attendance-all", "leaves", "employees", "employee-detail"];
      if (activeViews.includes(view)) {
        const iv = setInterval(() => {
          if (typeof document !== "undefined" && !document.hidden) {
            fetchAdminReports();
          }
        }, 20000);
        const handleFocus = () => fetchAdminReports();
        window.addEventListener("focus", handleFocus);
        return () => {
          clearInterval(iv);
          window.removeEventListener("focus", handleFocus);
        };
      }
    }
  }, [view, token, fetchAdminReports]);

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (expenseForm._id) {
        await apiClient.put(`/admin/expenses/${expenseForm._id}`, expenseForm);
        setSuccessMsg("Expense record updated successfully");
      } else {
        await apiClient.post("/admin/expenses", expenseForm);
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
      await apiClient.delete(`/admin/expenses/${id}`);
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
      const r = await apiClient.post("/admin/holidays", holidayForm);
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
      const r = await apiClient.delete(`/admin/holidays/${holidayId}`);
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
    const targetDateStr = String(pastAttendanceModal.date || "").split("T")[0];
    const holidayOnDate = (holidays || []).find(
      (h) => String(h?.date || "").split("T")[0] === targetDateStr
    );
    if (holidayOnDate) {
      setErrorMsg(
        `Official Holiday (${holidayOnDate.title || "Holiday"}) — Attendance cannot be marked on an official holiday.`
      );
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

      await apiClient.post("/admin/attendance/update", payload);
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

  const openEmployeeDetail = (empId, fromPath) => {
    const cleanId = String(empId || "").replace(/^virtual-/, "").trim();
    setSelectedEmployeeId(cleanId);
    setPreviousPath(fromPath || location.pathname);
    setDetailFromDate(null);
    setDetailToDate(null);
    setEmployeeHistory(null);
    if (fromPath === "summary" || fromPath?.includes("summary")) {
      setCalendarMonth(summaryMonth);
      setCalendarYear(summaryYear);
    }
    navigate(`${basePrefix}/employee/${cleanId}`);
    fetchEmployeeHistoryById(cleanId);
  };

  const handleGoBack = () => {
    if (previousPath.startsWith("/")) {
      navigate(previousPath);
    } else {
      navigate(`${basePrefix}/${previousPath}`);
    }
  };

  const handleOpenAddModal = () => {
    setErrorMsg("");
    const today = getIndiaDateString();
    const dynamicId = generateImmiEmployeeId(today, "");

    setEmployeeForm({
      name: "",
      email: "",
      personalEmail: "",
      password: "",
      role: "",
      department: "",
      phone: "",
      address: "",
      status: "active",
      previousCompany: "",
      previousPackage: "",
      currentPackage: "",
      experience: "",
      joiningDate: today,
      dob: "",
      employeeId: dynamicId,
      profileImage: "",
      documents: [],
    });
    navigateTo("register-employee");
  };

  const handleCreateEmployeeSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!employeeForm.name?.trim()) {
      setErrorMsg("Please enter employee full name.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!employeeForm.email || !emailRegex.test(employeeForm.email.trim())) {
      setErrorMsg("Please enter a valid company work email address (e.g. name@company.com).");
      return;
    }

    if (employeeForm.personalEmail && employeeForm.personalEmail.trim()) {
      if (!emailRegex.test(employeeForm.personalEmail.trim())) {
        setErrorMsg("Please enter a valid personal email address (e.g. name@gmail.com).");
        return;
      }
    }

    if (!employeeForm.password || !employeeForm.password.trim()) {
      setErrorMsg("Please enter portal password.");
      return;
    }

    if (!employeeForm.dob) {
      setErrorMsg("Please enter employee Date of Birth (DOB).");
      return;
    }

    if (!employeeForm.department?.trim()) {
      setErrorMsg("Please select employee department.");
      return;
    }

    const digitsOnly = (employeeForm.phone || "").replace(/\D/g, "");
    const cleanPhone = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
    if (cleanPhone && cleanPhone.length !== 10) {
      setErrorMsg("Contact phone number must be a 10-digit number (e.g. 9876543210).");
      return;
    }

    setLoading(true);
    try {
      const finalGeneratedId = generateImmiEmployeeId(employeeForm.joiningDate, employeeForm.dob);
      const payload = {
        ...employeeForm,
        employeeId: (!employeeForm.employeeId || employeeForm.employeeId.includes("XXXX"))
          ? finalGeneratedId
          : employeeForm.employeeId,
        name: employeeForm.name.trim(),
        email: employeeForm.email.trim().toLowerCase(),
        personalEmail: (employeeForm.personalEmail || "").trim().toLowerCase(),
        status: employeeForm.status === "inactive" ? "inactive" : "active",
        phone: cleanPhone,
      };
      const r = await apiClient.post("/admin/employee/create", payload);
      if (r.data?.emailSent === false && r.data?.emailError) {
        setSuccessMsg("");
        setErrorMsg(r.data.message);
      } else {
        setSuccessMsg(r.data.message || "Employee created successfully!");
      }
      setEmployeeForm({
        name: "",
        email: "",
        personalEmail: "",
        password: "",
        role: "",
        department: "",
        phone: "",
        address: "",
        status: "active",
        previousCompany: "",
        previousPackage: "",
        currentPackage: "",
        experience: "",
        joiningDate: "",
        dob: "",
        employeeId: "",
        profileImage: "",
        documents: [],
      });
      fetchAdminReports();
      navigateTo("employees");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to create employee.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateEmployee = async (id, currentStatus) => {
    const isCurrentlyInactive = currentStatus === "inactive";
    const actionText = isCurrentlyInactive ? "activate" : "make inactive";
    const confirmPrompt = isCurrentlyInactive
      ? "Are you sure you want to ACTIVATE this employee? They will be allowed to log in and mark attendance."
      : "Are you sure you want to mark this employee INACTIVE? They will NOT be able to mark attendance.";
    if (!window.confirm(confirmPrompt)) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const r = await apiClient.put(`/admin/employee/deactivate/${id}`, {
        status: isCurrentlyInactive ? "active" : "inactive"
      });
      setSuccessMsg(r.data.message || `Employee status updated successfully`);
      fetchAdminReports();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || `Failed to ${actionText} employee.`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (emp) => {
    setEditingEmployee(emp);
    const empName = typeof emp.name === "string" ? emp.name : (emp.name?.first ? `${emp.name.first} ${emp.name.last}` : String(emp.name || ""));
    const rawPass = emp.rawPassword || emp.plainPassword || (emp.password && !emp.password.startsWith("$2") ? emp.password : "");
    setEditForm({
      name: empName,
      email: emp.email || "",
      personalEmail: emp.personalEmail || "",
      designation: emp.designation || emp.role || "",
      department: emp.department || "",
      phone: emp.phone || "",
      address: emp.address || "",
      status: emp.status || "active",
      previousCompany: emp.previousCompany || "",
      previousPackage: emp.previousPackage || "",
      currentPackage: emp.currentPackage || "",
      monthlySalary: emp.monthlySalary || "",
      experience: emp.experience || "",
      profileImage: emp.profileImage || "",
      joiningDate: emp.joiningDate ? emp.joiningDate.split("T")[0] : "",
      dob: emp.dob ? emp.dob.split("T")[0] : "",
      employeeId: emp.employeeId || "",
      leavingDate: emp.leavingDate ? emp.leavingDate.split("T")[0] : "",
      leaveBalance: emp.leaveBalance ?? 18,
      allocatedLeaves: emp.allocatedLeaves ?? 18,
      nextMonthLeaves: emp.nextMonthLeaves || 0,
      previousPassword: rawPass,
      password: ""
    });
    navigateTo("edit-employee");
  };

  const handleUpdateEmployeeSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const r = await apiClient.put(`/admin/employee/update/${editingEmployee._id}`, editForm);
      if (r.data?.emailAttempted && r.data?.emailSent === false && r.data?.emailError) {
        setSuccessMsg("");
        setErrorMsg(r.data.message);
      } else {
        setSuccessMsg(r.data.message || "Employee updated successfully");
      }
      setEditingEmployee(null);
      fetchAdminReports();
      navigateTo("employees");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update employee.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmployeeCredentials = async (emp) => {
    const empId = emp?._id || emp?.id;
    if (!empId) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const r = await apiClient.post(`/admin/employee/${empId}/resend-credentials`);
      setSuccessMsg(r.data?.message || `Credentials emailed to ${emp.personalEmail || emp.email}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to resend employee credentials email.");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectLeaveAction = async (leaveId, action, remark = "") => {
    setLoading(true);
    setErrorMsg("");
    try {
      const finalRemark = (remark || "").trim();
      const r = await apiClient.put(`/admin/leaves/${leaveId}`, {
        status: action,
        adminRemark: finalRemark,
      });
      setSuccessMsg(r.data.message || `Leave ${action.toLowerCase()} successfully`);
      fetchAdminReports();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update leave status.");
    } finally {
      setLoading(false);
    }
  };

  const openLeaveActionModal = (leaveId, action, leave = null) => {
    setLeaveActionRemark("");
    setLeaveActionModal({ leaveId, action, leave });
  };

  const handleSubmitLeaveAction = async () => {
    if (!leaveActionModal) return;
    const { leaveId, action } = leaveActionModal;
    setLoading(true);
    setErrorMsg("");
    try {
      const r = await apiClient.put(`/admin/leaves/${leaveId}`, { status: action, adminRemark: leaveActionRemark.trim() });
      setSuccessMsg(r.data.message);
      setLeaveActionModal(null);
      setLeaveActionRemark("");
      fetchAdminReports();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update leave status.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ds) => {
    if (!ds) return "-";
    return new Date(ds).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };
  const formatTime = (ts) => {
    if (!ts) return "-";
    return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  };
  const navigateTo = (path) => {
    navigate(`${basePrefix}/${path}`);
    setSidebarMobileOpen(false);
  };

  return {
    sidebarCollapsed,
    sidebarMobileOpen,
    employeeMenuOpen,
    expenseMenuOpen,
    clientMenuOpen,
    projectMenuOpen,
    invoiceMenuOpen,
    previewDoc,
    loading,
    errorMsg,
    successMsg,
    attendanceReport,
    employees,
    leavesReport,
    selectedEmployeeId,
    employeeHistory,
    employeeHistoryLoading,
    detailFromDate,
    detailToDate,
    leaveActionModal,
    editingAttendance,
    leaveActionRemark,
    employeeForm,
    editingEmployee,
    editForm,
    summaryData,
    summaryMonth,
    summaryYear,
    summaryLoading,
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
    expenseFilterDate,
    setSidebarCollapsed,
    setSidebarMobileOpen,
    setEmployeeMenuOpen,
    setExpenseMenuOpen,
    setClientMenuOpen,
    setProjectMenuOpen,
    setInvoiceMenuOpen,
    setPreviewDoc,
    setDetailFromDate,
    setDetailToDate,
    setLeaveActionModal,
    setEditingAttendance,
    setLeaveActionRemark,
    setEmployeeForm,
    setEditingEmployee,
    setEditForm,
    setSummaryMonth,
    setSummaryYear,
    setHolidayForm,
    setEmployeeDetailView,
    setCalendarMonth,
    setCalendarYear,
    setPastAttendanceModal,
    setTextModalData,
    setExpenseForm,
    setExpenseFilterDate,
    fetchAdminReports,
    fetchSummary,
    fetchHolidays,
    fetchExpenses,
    handleExpenseSubmit,
    handleEditExpenseClick,
    handleDeleteExpense,
    handleCreateHolidaySubmit,
    handleDeleteHoliday,
    handleSavePastAttendance,
    openTextModal,
    openEmployeeDetail,
    handleGoBack,
    fetchEmployeeHistoryById,
    handleOpenAddModal,
    handleCreateEmployeeSubmit,
    handleDeactivateEmployee,
    handleEditClick,
    handleUpdateEmployeeSubmit,
    handleResendEmployeeCredentials,
    openLeaveActionModal,
    handleSubmitLeaveAction,
    handleDirectLeaveAction,
    formatDate,
    formatTime,
    navigateTo
  };
};
