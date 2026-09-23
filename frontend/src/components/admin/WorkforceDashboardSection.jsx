import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserCheck,
  Coffee,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Eye,
  Search,
  Check,
  X,
  UserPlus,
  RefreshCw,
  Edit3,
  Download,
  Mail,
  User,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { apiClient } from "../../services/apiClient.js";
import { EmployeeIdBadge } from "../common/ImmiGoLogo.jsx";

export default function WorkforceDashboardSection({
  employees = [],
  attendanceReport = [],
  leavesReport = [],
  openEmployeeDetail = () => { },
  openAddModal = () => { },
  fetchAdminReports = () => { },
  openLeaveAction = () => { },
  navigateTo = () => { },
  formatTime = (t) => t,
  formatDate = (d) => d,
  setEditingAttendance = () => { },
  isFullRegisterPage = false,
}) {
  const [workLogs, setWorkLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");

  const todayDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [dateAttendance, setDateAttendance] = useState(null);
  const [loadingDateAttendance, setLoadingDateAttendance] = useState(false);

  // Modal to show staff list when clicking Total Staff, Present, On Leave, Absent
  const [metricModal, setMetricModal] = useState(null);
  const [metricModalSearch, setMetricModalSearch] = useState("");

  const openMetricListModal = (type) => {
    let list = [];
    let title = "";
    let color = "";
    let icon = null;

    if (type === "total") {
      list = currentAttendanceList.length > 0 ? currentAttendanceList : employees;
      title = "Total Registered Staff";
      color = "text-blue-700 bg-blue-100";
      icon = <Users size={18} className="text-blue-600" />;
    } else if (type === "present") {
      list = currentAttendanceList.filter((r) => getAttendanceInfo(r).isPresent);
      title = selectedDate === todayDate ? "Present Today" : "Present on Date";
      color = "text-emerald-700 bg-emerald-100";
      icon = <UserCheck size={18} className="text-emerald-600" />;
    } else if (type === "leave") {
      list = currentAttendanceList.filter((r) => getAttendanceInfo(r).isOnLeave);
      title = "Employees On Leave";
      color = "text-purple-700 bg-purple-100";
      icon = <Calendar size={18} className="text-purple-600" />;
    } else if (type === "absent") {
      list = currentAttendanceList.filter((r) => getAttendanceInfo(r).isAbsent);
      title = "Absent Employees";
      color = "text-rose-700 bg-rose-100";
      icon = <AlertCircle size={18} className="text-rose-600" />;
    }

    setMetricModalSearch("");
    setMetricModal({
      type,
      title,
      color,
      icon,
      list,
    });
  };

  const modalFilteredList = useMemo(() => {
    if (!metricModal || !metricModal.list) return [];
    const q = metricModalSearch.trim().toLowerCase();
    if (!q) return metricModal.list;
    return metricModal.list.filter((emp) => {
      const name =
        typeof emp?.name === "string"
          ? emp.name
          : emp?.name?.first
          ? `${emp.name.first} ${emp.name.last}`
          : "";
      const code = emp.employeeCode || emp.employeeId || "";
      const dept = emp.department || "";
      const email = emp.email || "";
      return (
        name.toLowerCase().includes(q) ||
        code.toLowerCase().includes(q) ||
        dept.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q)
      );
    });
  }, [metricModal, metricModalSearch]);

  // Fetch employee daily work logs for the selected date
  const fetchWorkLogs = async (targetDate = selectedDate) => {
    setLoadingLogs(true);
    try {
      const res = await apiClient.get("/admin/worklogs", {
        params: { date: targetDate },
      });
      setWorkLogs(res.data?.logs || []);
    } catch (err) {
      console.error("Failed to load work logs for workforce dashboard:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch attendance report for a specific date (today or past dates)
  const fetchDateAttendance = async (dateToFetch) => {
    setLoadingDateAttendance(true);
    try {
      const res = await apiClient.get("/admin/attendance", {
        params: { date: dateToFetch },
      });
      setDateAttendance(res.data?.report || []);
    } catch (err) {
      console.error("Failed to load attendance for date:", dateToFetch, err);
    } finally {
      setLoadingDateAttendance(false);
    }
  };

  // When selectedDate changes, fetch appropriate records
  useEffect(() => {
    if (selectedDate !== todayDate) {
      fetchDateAttendance(selectedDate);
    } else {
      setDateAttendance(null); // Fallback to live attendanceReport from props
    }
    fetchWorkLogs(selectedDate);
  }, [selectedDate, todayDate]);

  // Current active attendance list for display
  const currentAttendanceList =
    selectedDate === todayDate && !dateAttendance ? attendanceReport : dateAttendance || attendanceReport;

  // Date manipulation helpers
  const handleDateChange = (newDate) => {
    if (!newDate) return;
    setSelectedDate(newDate);
  };

  // Format date display (e.g., "Saturday, 19 Sept 2026")
  const formattedSelectedDateDisplay = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Comprehensive helper to determine attendance status cleanly
  const getAttendanceInfo = (rep) => {
    const isCheckedOut =
      rep.status === "Checked Out" ||
      rep.status === "Present" ||
      Boolean(rep.checkOutTime);
    const isActive = rep.status === "Active" && !rep.checkOutTime;
    const isOnBreak = rep.status === "On Break";
    const isOnLeave = rep.status === "On Leave";
    const isHalfDay = rep.status === "Half Day";
    const isPresent = Boolean(rep.checkInTime) || isCheckedOut || isActive || isOnBreak || isHalfDay;

    let label = "Absent";
    let badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
    let icon = <XCircle size={11} className="text-rose-500" />;

    if (isActive) {
      label = "Active Now";
      badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
      icon = <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />;
    } else if (isOnBreak) {
      label = "On Break";
      badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
      icon = <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />;
    } else if (isCheckedOut) {
      label = "Checked Out";
      badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
      icon = <CheckCircle2 size={11} className="text-blue-600" />;
    } else if (isOnLeave) {
      label = "On Leave";
      badgeClass = "bg-purple-50 text-purple-700 border-purple-200";
      icon = <Calendar size={11} className="text-purple-600" />;
    } else if (isHalfDay) {
      label = "Half Day";
      badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
      icon = <Clock size={11} className="text-indigo-600" />;
    }

    return { label, badgeClass, icon, isPresent, isOnLeave, isAbsent: !isPresent && !isOnLeave };
  };

  // KPIs for the selected date (Streamlined to 4 crisp cards)
  const totalEmployeesCount = employees.length || currentAttendanceList.length || 0;
  const presentCount = currentAttendanceList.filter((r) => getAttendanceInfo(r).isPresent).length;
  const onLeaveCount = currentAttendanceList.filter((r) => getAttendanceInfo(r).isOnLeave).length;
  const absentCount = currentAttendanceList.filter((r) => getAttendanceInfo(r).isAbsent).length;

  const pendingLeaves = leavesReport.filter((l) => l.status === "Pending");

  // Extract departments
  const departments = ["All", ...new Set(employees.map((e) => e.department).filter(Boolean))];

  // Filtered work logs
  const filteredLogs = workLogs.filter((item) => {
    const name = item.employee?.name || "";
    const dept = item.employee?.department || "";
    const text = item.logText || "";
    const q = logSearch.toLowerCase();
    const matchSearch =
      name.toLowerCase().includes(q) || text.toLowerCase().includes(q);
    const matchDept = selectedDept === "All" || dept.toLowerCase() === selectedDept.toLowerCase();
    return matchSearch && matchDept;
  });

  const formatISTTime = (isoString) => {
    if (!isoString) return "—";
    try {
      return new Date(isoString).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "—";
    }
  };

  const [liveSearch, setLiveSearch] = useState("");
  const [liveStatusFilter, setLiveStatusFilter] = useState("All"); // "All" | "Present" | "On Leave" | "Absent"

  // Filtered attendance records for Shift Tracker
  const filteredAttendance = currentAttendanceList.filter((rep) => {
    const safeName =
      typeof rep?.name === "string"
        ? rep.name
        : rep?.name?.first
          ? `${rep.name.first} ${rep.name.last}`
          : String(rep?.name || "");
    const empCode = rep.employeeCode || rep.employeeId || "";
    const dept = rep.department || "";
    const email = rep.email || "";
    const personalEmail = rep.personalEmail || "";
    const q = liveSearch.toLowerCase();
    const matchSearch =
      !q ||
      safeName.toLowerCase().includes(q) ||
      empCode.toLowerCase().includes(q) ||
      dept.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      personalEmail.toLowerCase().includes(q);

    let matchStatus = true;
    const info = getAttendanceInfo(rep);
    if (liveStatusFilter === "Present") {
      matchStatus = info.isPresent;
    } else if (liveStatusFilter === "On Leave") {
      matchStatus = info.isOnLeave;
    } else if (liveStatusFilter === "Absent") {
      matchStatus = info.isAbsent;
    }

    return matchSearch && matchStatus;
  });

  // Export filtered attendance records to CSV for selected date
  const handleExportCSV = () => {
    const headers = [
      "Employee Name",
      "Employee ID / Code",
      "Official Company Email",
      "Personal Email",
      "Department",
      "Designation",
      "Employee Status",
      "Attendance Status",
      "Check In Time",
      "Check Out Time",
      "Breaks (Minutes)",
      "Net Work Hours",
      "Date",
    ];

    const rows = filteredAttendance.map((rep) => {
      const safeName =
        typeof rep?.name === "string"
          ? rep.name
          : rep?.name?.first
            ? `${rep.name.first} ${rep.name.last}`
            : String(rep?.name || "");
      const totalWorkSec = rep.totalWorkSeconds || 0;
      const hrs = Math.floor(totalWorkSec / 3600);
      const mins = Math.floor((totalWorkSec % 3600) / 60);
      const workDurStr = totalWorkSec > 0 ? `${hrs}h ${mins}m` : "—";
      const breakMins = rep.totalBreakSeconds ? Math.floor(rep.totalBreakSeconds / 60) : 0;
      const info = getAttendanceInfo(rep);

      return [
        `"${safeName.replace(/"/g, '""')}"`,
        `"${(rep.employeeCode || rep.employeeId || "").replace(/"/g, '""')}"`,
        `"${(rep.email || "").replace(/"/g, '""')}"`,
        `"${(rep.personalEmail || "").replace(/"/g, '""')}"`,
        `"${(rep.department || "").replace(/"/g, '""')}"`,
        `"${(rep.designation || "").replace(/"/g, '""')}"`,
        `"${rep.employeeStatus || "active"}"`,
        `"${info.label}"`,
        `"${formatTime(rep.checkInTime) || "—"}"`,
        `"${formatTime(rep.checkOutTime) || "—"}"`,
        `"${breakMins}"`,
        `"${workDurStr}"`,
        `"${selectedDate}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayedAttendance = useMemo(() => {
    return isFullRegisterPage ? filteredAttendance : filteredAttendance.slice(0, 4);
  }, [isFullRegisterPage, filteredAttendance]);

  return (
    <div className="space-y-5 text-slate-800">
      {/* ── 1. TOP HEADER & QUICK ACTIONS ── */}
      {isFullRegisterPage ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigateTo("workforce")}
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
              title="Return to Main Dashboard"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                <span>All Attendance</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {filteredAttendance.length} Total
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 truncate">
                Full company attendance register with past calendar history and shifts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                fetchAdminReports();
                if (selectedDate !== todayDate) {
                  fetchDateAttendance(selectedDate);
                }
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw size={13} className={loadingDateAttendance ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-blue-600/20 active:scale-95 cursor-pointer"
            >
              <UserPlus size={13} />
              <span>Register Employee</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold shadow-2xs shrink-0">
                <Users size={18} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">
                  Workforce Operations Dashboard
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 truncate">
                  Real-time staff tracker, leave approvals & attendance register
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                fetchAdminReports();
                fetchWorkLogs();
                if (selectedDate !== todayDate) {
                  fetchDateAttendance(selectedDate);
                }
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Refresh dashboard data"
            >
              <RefreshCw size={13} className={loadingDateAttendance ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-blue-600/20 active:scale-95 cursor-pointer"
            >
              <UserPlus size={13} />
              <span>Register Employee</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 2. STREAMLINED 4-METRIC STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Staff */}
        <div
          onClick={() => openMetricListModal("total")}
          className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs hover:shadow-md hover:border-blue-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group"
          title="Click to view all registered staff"
        >
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="group-hover:text-blue-600 transition-colors">Total Staff</span>
            <Users size={15} className="text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {totalEmployeesCount}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center justify-between">
            <span>Registered employees</span>
            <span className="text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">View list →</span>
          </div>
        </div>

        {/* Present on Date */}
        <div
          onClick={() => openMetricListModal("present")}
          className="bg-white rounded-xl border border-emerald-200/80 bg-emerald-50/20 p-3.5 shadow-2xs hover:shadow-md hover:border-emerald-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group"
          title="Click to view present employees"
        >
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
            <span>{selectedDate === todayDate ? "Present Today" : "Present on Date"}</span>
            <UserCheck size={15} className="text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
            {presentCount}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center justify-between">
            <span>Checked in & attended</span>
            <span className="text-emerald-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">View list →</span>
          </div>
        </div>

        {/* On Leave */}
        <div
          onClick={() => openMetricListModal("leave")}
          className="bg-white rounded-xl border border-purple-200/80 bg-purple-50/20 p-3.5 shadow-2xs hover:shadow-md hover:border-purple-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group"
          title="Click to view employees on leave"
        >
          <div className="flex items-center justify-between text-[10px] font-bold text-purple-600 uppercase tracking-wider">
            <span>On Leave</span>
            <Calendar size={15} className="text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-900 mt-1">
            {onLeaveCount}
          </div>
          <div className="text-[10px] text-purple-700 font-semibold mt-0.5 flex items-center justify-between">
            <span>Approved leaves for date</span>
            <span className="text-purple-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">View list →</span>
          </div>
        </div>

        {/* Absent */}
        <div
          onClick={() => openMetricListModal("absent")}
          className="bg-white rounded-xl border border-rose-200/80 bg-rose-50/20 p-3.5 shadow-2xs hover:shadow-md hover:border-rose-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group"
          title="Click to view absent employees"
        >
          <div className="flex items-center justify-between text-[10px] font-bold text-rose-600 uppercase tracking-wider">
            <span>Absent</span>
            <AlertCircle size={15} className="text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-900 mt-1">
            {absentCount}
          </div>
          <div className="text-[10px] text-rose-700 font-semibold mt-0.5 flex items-center justify-between">
            <span>Did not attend</span>
            <span className="text-rose-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">View list →</span>
          </div>
        </div>
      </div>

      {/* ── 3. MAIN ATTENDANCE TRACKER SECTION ── */}
      {isFullRegisterPage && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Header: Title + Calendar Date Picker */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/20 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
          {/* Left: Title + Compact Calendar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  All Employees Attendance Register
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {selectedDate === todayDate
                    ? "Live shift attendance for Today"
                    : `Showing attendance for ${formattedSelectedDateDisplay}`}
                </p>
              </div>
            </div>

            {/* Compact Calendar & Date Picker Widget (Past dates & Today only) */}
            <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/90 rounded-xl p-1 text-xs flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg shadow-2xs border border-slate-200/80 shrink-0">
                <Calendar size={13} className="text-blue-600 shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  max={todayDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer max-w-[125px]"
                  title="Select date to inspect past attendance"
                />
              </div>

              {selectedDate !== todayDate && (
                <button
                  type="button"
                  onClick={() => handleDateChange(todayDate)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-extrabold bg-blue-600 text-white shadow-2xs hover:bg-blue-700 transition-all cursor-pointer shrink-0"
                  title="Jump back to today's live shift"
                >
                  <span>Go to Today</span>
                </button>
              )}

              {loadingDateAttendance && (
                <span className="text-[10px] text-slate-400 font-semibold px-1 animate-pulse">
                  Loading...
                </span>
              )}
            </div>
          </div>

          {/* Right: Search + Export CSV */}
          <div className="flex flex-col md:flex-row md:items-center gap-2.5 w-full xl:w-auto">
            {/* Search */}
            <div className="relative w-full md:w-auto">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={liveSearch}
                onChange={(e) => setLiveSearch(e.target.value)}
                placeholder="Search staff..."
                className="w-full md:w-36 lg:w-44 pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 shrink-0"
                title="Download CSV for this date"
              >
                <Download size={13} />
                <span className="inline">Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 1. MOBILE & TABLET ATTENDANCE CARDS (< lg) ── */}
        <div className="block lg:hidden p-3 sm:p-4 space-y-3">
          {displayedAttendance.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Clock size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">No attendance records found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting search or status filter.</p>
            </div>
          ) : (
            displayedAttendance.map((rep) => {
              const actualEmpId =
                rep.employeeId ||
                (typeof rep._id === "string" ? rep._id.replace(/^virtual-/, "") : rep._id);
              const safeName =
                typeof rep?.name === "string"
                  ? rep.name
                  : rep?.name?.first
                    ? `${rep.name.first} ${rep.name.last}`
                    : String(rep?.name || "Employee");

              const totalWorkSec = rep.totalWorkSeconds || 0;
              const hrs = Math.floor(totalWorkSec / 3600);
              const mins = Math.floor((totalWorkSec % 3600) / 60);
              const workDurStr = totalWorkSec > 0 ? `${hrs}h ${mins}m` : "—";
              const info = getAttendanceInfo(rep);

              return (
                <div
                  key={`card-${rep.employeeId || rep._id || actualEmpId}`}
                  className="p-3.5 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white shadow-2xs space-y-3 transition-all"
                >
                  {/* Top: Employee Avatar, Name, Code & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {safeName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                            {safeName}
                          </h4>
                          <EmployeeIdBadge
                            id={rep.employeeCode || rep.employeeId}
                            size="xs"
                            onClick={() => openEmployeeDetail(rep._id || rep.employeeId || rep.id)}
                            title="Click to view employee profile details"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {rep.department || "Staff"} • {rep.designation || "Member"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider shrink-0 ${info.badgeClass}`}
                    >
                      {info.icon}
                      {info.label}
                    </span>
                  </div>

                  {/* Timing & Work Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Check In</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatTime(rep.checkInTime) || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Check Out</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatTime(rep.checkOutTime) || (info.isPresent ? "In Shift" : "—")}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Breaks</span>
                      <span className={`font-mono ${rep.totalBreakSeconds > 3600 ? "text-rose-600 font-bold" : "text-slate-600"}`}>
                        {rep.totalBreakSeconds ? `${Math.floor(rep.totalBreakSeconds / 60)}m` : "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Net Work</span>
                      <span className="font-mono font-black text-blue-900">
                        {workDurStr}
                      </span>
                    </div>
                  </div>

                  {/* Emails */}
                  {(rep.email || rep.personalEmail) && (
                    <div className="space-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      {rep.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate text-slate-700 font-medium">{rep.email}</span>
                        </div>
                      )}
                      {rep.personalEmail && (
                        <div className="flex items-center gap-1.5 truncate">
                          <User size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate text-slate-400">Personal: {rep.personalEmail}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAttendance({
                          ...rep,
                          date: selectedDate,
                        });
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-amber-200 shadow-2xs"
                    >
                      <Edit3 size={12} />
                      <span>Edit Time</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEmployeeDetail(actualEmpId)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                    >
                      <Eye size={12} />
                      <span>Profile</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── 2. DESKTOP ATTENDANCE TABLE (≥ lg) ── */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                <th className="px-4 py-3">Employee & Emails</th>
                <th className="px-3 py-3">Department & Role</th>
                <th className="px-3 py-3">Attendance Status</th>
                <th className="px-3 py-3">Check In</th>
                <th className="px-3 py-3">Check Out</th>
                <th className="px-3 py-3">Break Taken</th>
                <th className="px-3 py-3">Net Work Time</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayedAttendance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-xs font-semibold">
                    No attendance records found for this date and filter.
                  </td>
                </tr>
              ) : (
                displayedAttendance.map((rep) => {
                  const actualEmpId =
                    rep.employeeId ||
                    (typeof rep._id === "string" ? rep._id.replace(/^virtual-/, "") : rep._id);
                  const safeName =
                    typeof rep?.name === "string"
                      ? rep.name
                      : rep?.name?.first
                        ? `${rep.name.first} ${rep.name.last}`
                        : String(rep?.name || "Employee");

                  const totalWorkSec = rep.totalWorkSeconds || 0;
                  const hrs = Math.floor(totalWorkSec / 3600);
                  const mins = Math.floor((totalWorkSec % 3600) / 60);
                  const workDurStr = totalWorkSec > 0 ? `${hrs}h ${mins}m` : "—";
                  const info = getAttendanceInfo(rep);

                  return (
                    <tr
                      key={rep.employeeId || rep._id || actualEmpId}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      {/* Employee name, code, company email & personal email */}
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                            {safeName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900">{safeName}</span>
                              <EmployeeIdBadge
                                id={rep.employeeCode || rep.employeeId}
                                size="xs"
                                onClick={() => openEmployeeDetail(rep._id || rep.employeeId || rep.id)}
                                title="Click to view employee profile details"
                              />
                            </div>

                            {/* Company Email */}
                            {rep.email && (
                              <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1 mt-0.5 truncate">
                                <Mail size={11} className="text-slate-400 shrink-0" />
                                <span className="truncate">{rep.email}</span>
                              </div>
                            )}

                            {/* Personal Email */}
                            {rep.personalEmail && (
                              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5 truncate">
                                <User size={10} className="text-slate-400 shrink-0" />
                                <span className="truncate">Personal: {rep.personalEmail}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-800 text-xs">
                          {rep.department || "General"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {rep.designation || "Staff"}
                          {rep.employeeStatus === "inactive" && (
                            <span className="ml-1.5 text-rose-500 font-semibold">(Inactive)</span>
                          )}
                        </div>
                      </td>

                      {/* Attendance Status (Always renders clear badge) */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${info.badgeClass}`}
                        >
                          {info.icon}
                          {info.label}
                        </span>
                      </td>

                      {/* Check In Time */}
                      <td className="px-3 py-3 font-mono font-bold text-slate-700 text-xs">
                        {formatTime(rep.checkInTime)}
                      </td>

                      {/* Check Out Time */}
                      <td className="px-3 py-3 font-mono font-bold text-slate-700 text-xs">
                        {formatTime(rep.checkOutTime)}
                      </td>

                      {/* Breaks Used */}
                      <td className="px-3 py-3 font-mono text-slate-600 text-xs">
                        {rep.totalBreakSeconds ? (
                          <span className={rep.totalBreakSeconds > 3600 ? "text-rose-600 font-bold" : ""}>
                            {Math.floor(rep.totalBreakSeconds / 60)}m
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Net Work Time */}
                      <td className="px-3 py-3 font-mono font-bold text-blue-900 text-xs">
                        {workDurStr}
                      </td>

                      {/* Action buttons: Edit Time & View Profile */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Admin Edit Time Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAttendance({
                                ...rep,
                                date: selectedDate,
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-amber-200 shadow-2xs"
                            title="Edit / Adjust attendance time (Admin only)"
                          >
                            <Edit3 size={11} />
                            <span>Edit Time</span>
                          </button>

                          {/* Profile Button */}
                          <button
                            type="button"
                            onClick={() => openEmployeeDetail(actualEmpId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200/80"
                            title="View Profile"
                          >
                            <Eye size={11} />
                            <span>Profile</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: Preview banner with "See All" button on Dashboard, or full count with Back button */}
        {!isFullRegisterPage ? (
          <div className="p-3.5 sm:p-4 bg-slate-50/90 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600 font-medium">
              Showing preview of <span className="font-bold text-slate-900">{Math.min(4, filteredAttendance.length)}</span> of{" "}
              <span className="font-bold text-slate-900">{filteredAttendance.length}</span> employees
            </div>
            <button
              type="button"
              onClick={() => navigateTo("attendance-all")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <span>See All Attendance ({filteredAttendance.length})</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600 font-medium">
              Showing all <span className="font-bold text-slate-900">{filteredAttendance.length}</span> records for{" "}
              <span className="font-bold text-slate-900">{formattedSelectedDateDisplay}</span>
            </div>
            <button
              type="button"
              onClick={() => navigateTo("workforce")}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        )}
      </div>
      )}

      {/* ── 4. WORKFORCE OPERATIONS (Leave Applications) ── */}
      {!isFullRegisterPage && (
        <div className="w-full space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-rose-50/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Calendar size={15} />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    Leave Applications
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 font-bold">
                      {pendingLeaves.length} Pending
                    </span>
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Review and approve or reject employee leave requests
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigateTo("leaves")}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
              >
                View all →
              </button>
            </div>

            {/* List of Leave Applications */}
            <div className="p-3 sm:p-4 space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {pendingLeaves.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400 opacity-80" />
                  <p className="font-bold text-slate-600">All leave requests are up to date!</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">No pending leaves awaiting approval.</p>
                </div>
              ) : (
                pendingLeaves.map((leave) => {
                  const emp = leave.employeeId || leave.employee || {};
                  return (
                    <div
                      key={leave._id || leave.id}
                      className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-2xs space-y-2.5 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                            {emp.profileImage ? (
                              <img
                                src={emp.profileImage}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (emp.name || "E")[0].toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {emp.name || "Employee"}
                              </span>
                              <EmployeeIdBadge
                                id={emp.employeeId}
                                size="xs"
                                onClick={() => openEmployeeDetail(emp._id || emp.id)}
                                title="Click to view employee profile details"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium truncate block">
                              {emp.department || "Staff"} • {emp.designation || "Employee"}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
                          {leave.leaveType || "Casual Leave"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-medium bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Calendar size={12} className="text-slate-400" />
                          <span>
                            {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                          </span>
                        </div>
                        <span className="font-black text-blue-700 text-xs">
                          {leave.totalDays} Day{leave.totalDays > 1 ? "s" : ""}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/40 p-2 rounded-lg border border-slate-100/80">
                        <strong className="text-slate-500 font-semibold block text-[10px] uppercase">Reason:</strong>
                        {leave.reason}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => openEmployeeDetail(emp._id || emp.id)}
                          className="text-[11px] text-slate-500 hover:text-blue-600 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={12} /> Profile
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openLeaveAction(leave._id || leave.id, "Rejected", leave)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                          >
                            <X size={12} /> Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => openLeaveAction(leave._id || leave.id, "Approved", leave)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Check size={12} /> Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: STAFF LIST BY METRIC (TOTAL, PRESENT, LEAVE, ABSENT) ── */}
      {metricModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setMetricModal(null)}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white shadow-2xs border border-slate-200/80 flex items-center justify-center font-bold shrink-0">
                  {metricModal.icon}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>{metricModal.title}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${metricModal.color}`}>
                      {metricModal.list.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Showing for {formattedSelectedDateDisplay} • Click employee or ID badge to view full details
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMetricModal(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer text-sm font-bold shrink-0"
                title="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Search Filter in Modal */}
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={metricModalSearch}
                  onChange={(e) => setMetricModalSearch(e.target.value)}
                  placeholder="Filter by name, ID code (e.g. VESTA-001), department..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Modal Body / Staff List */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100/80">
              {modalFilteredList.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Users size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-600">No employees found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">No staff matched this category or search filter.</p>
                </div>
              ) : (
                modalFilteredList.map((emp) => {
                  const actualEmpId =
                    emp.employeeId ||
                    (typeof emp._id === "string" ? emp._id.replace(/^virtual-/, "") : emp._id) ||
                    emp.id;
                  const safeName =
                    typeof emp?.name === "string"
                      ? emp.name
                      : emp?.name?.first
                      ? `${emp.name.first} ${emp.name.last}`
                      : "Employee";
                  const empCode = emp.employeeCode || emp.employeeId || "VESTA-001";
                  const info = getAttendanceInfo(emp);

                  return (
                    <div
                      key={`metric-staff-${actualEmpId}-${emp.date || ""}`}
                      className="pt-2.5 first:pt-0 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                          {emp.profileImage ? (
                            <img src={emp.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            safeName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              onClick={() => {
                                setMetricModal(null);
                                openEmployeeDetail(actualEmpId);
                              }}
                              className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer truncate"
                              title="Click to view Profile"
                            >
                              {safeName}
                            </h4>
                            <EmployeeIdBadge
                              id={empCode}
                              size="sm"
                              onClick={() => {
                                setMetricModal(null);
                                openEmployeeDetail(actualEmpId);
                              }}
                              title="Click to view Employee Profile"
                            />
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            {emp.department || "General"} • {emp.designation || "Staff"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${info.badgeClass}`}>
                          {info.icon}
                          {info.label}
                        </span>

                        {info.isPresent && emp.checkInTime && (
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                            In: {formatTime(emp.checkInTime)}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setMetricModal(null);
                            openEmployeeDetail(actualEmpId);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-blue-200 hover:border-blue-600 shadow-2xs active:scale-95"
                          title="Open Employee Profile"
                        >
                          <Eye size={12} />
                          <span>Detail</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {modalFilteredList.length} of {metricModal.list.length} records</span>
              <button
                type="button"
                onClick={() => setMetricModal(null)}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg font-bold border border-slate-200 cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
