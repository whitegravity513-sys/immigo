import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserCheck,
  Calendar,
  AlertCircle,
  UserPlus,
  RefreshCw,
  Download,
  ArrowLeft,
} from "lucide-react";
import { apiClient } from "../../services/apiClient.js";
import AdminWorkLogsModal from "./AdminWorkLogsModal.jsx";
import {
  WorkforceMetricCards,
  WorkforceMetricModal,
  WorkforceLeavesPanel,
  WorkforceAttendanceTable,
} from "./workforce/index.js";

export default function WorkforceDashboardSection({
  employees = [],
  attendanceReport = [],
  leavesReport = [],
  openEmployeeDetail = () => {},
  openAddModal = () => {},
  fetchAdminReports = () => {},
  openLeaveAction = () => {},
  navigateTo = () => {},
  formatTime = (t) => t,
  formatDate = (d) => d,
  setEditingAttendance = () => {},
  isFullRegisterPage = false,
}) {
  const [workLogs, setWorkLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [workLogsModalOpen, setWorkLogsModalOpen] = useState(false);

  const todayDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [dateAttendance, setDateAttendance] = useState(null);
  const [loadingDateAttendance, setLoadingDateAttendance] = useState(false);

  const [metricModal, setMetricModal] = useState(null);
  const [metricModalSearch, setMetricModalSearch] = useState("");

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

  useEffect(() => {
    if (selectedDate !== todayDate) {
      fetchDateAttendance(selectedDate);
    } else {
      setDateAttendance(null);
    }
    fetchWorkLogs(selectedDate);
  }, [selectedDate, todayDate]);

  const currentAttendanceList =
    selectedDate === todayDate && !dateAttendance ? attendanceReport : dateAttendance || attendanceReport;

  const handleDateChange = (newDate) => {
    if (!newDate) return;
    setSelectedDate(newDate);
  };

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
    let icon = <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />;

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
      icon = <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />;
    } else if (isOnLeave) {
      label = "On Leave";
      badgeClass = "bg-purple-50 text-purple-700 border-purple-200";
      icon = <Calendar size={11} className="text-purple-600" />;
    } else if (isHalfDay) {
      label = "Half Day";
      badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
      icon = <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />;
    }

    return { label, badgeClass, icon, isPresent, isOnLeave, isAbsent: !isPresent && !isOnLeave };
  };

  const totalEmployeesCount = employees.length || currentAttendanceList.length || 0;
  const presentCount = currentAttendanceList.filter((r) => getAttendanceInfo(r).isPresent).length;
  const onLeaveCount = currentAttendanceList.filter((r) => getAttendanceInfo(r).isOnLeave).length;
  const absentCount = currentAttendanceList.filter((r) => getAttendanceInfo(r).isAbsent).length;

  const pendingLeaves = leavesReport.filter((l) => l.status === "Pending");

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

  const [liveSearch, setLiveSearch] = useState("");

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
    return (
      !q ||
      safeName.toLowerCase().includes(q) ||
      empCode.toLowerCase().includes(q) ||
      dept.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      personalEmail.toLowerCase().includes(q)
    );
  });

  const displayedAttendance = useMemo(() => {
    return isFullRegisterPage ? filteredAttendance : filteredAttendance.slice(0, 4);
  }, [isFullRegisterPage, filteredAttendance]);

  const handleExportCSV = () => {
    const headers = [
      "Employee Name",
      "Employee ID / Code",
      "Official Company Email",
      "Personal Email",
      "Department",
      "Designation",
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

  return (
    <div className="space-y-3.5 text-slate-800">
      {isFullRegisterPage ? (
        <div className="bg-white rounded-xl border border-slate-200/90 px-3.5 py-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => navigateTo("workforce")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
              title="Return to Main Dashboard"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <div className="min-w-0 flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Daily Attendance</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {filteredAttendance.length} Total
                </span>
              </h1>
              <span className="hidden sm:inline text-slate-300">|</span>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Shift punches, work time & status logs
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
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw size={12} className={loadingDateAttendance ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Download attendance CSV"
            >
              <Download size={12} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

      {!isFullRegisterPage && (
        <WorkforceMetricCards
          totalEmployeesCount={totalEmployeesCount}
          presentCount={presentCount}
          onLeaveCount={onLeaveCount}
          absentCount={absentCount}
          selectedDate={selectedDate}
          todayDate={todayDate}
          openMetricListModal={openMetricListModal}
        />
      )}

      <WorkforceAttendanceTable
        filteredAttendance={filteredAttendance}
        displayedAttendance={displayedAttendance}
        isFullRegisterPage={isFullRegisterPage}
        selectedDate={selectedDate}
        todayDate={todayDate}
        handleDateChange={handleDateChange}
        loadingDateAttendance={loadingDateAttendance}
        liveSearch={liveSearch}
        setLiveSearch={setLiveSearch}
        formattedSelectedDateDisplay={formattedSelectedDateDisplay}
        getAttendanceInfo={getAttendanceInfo}
        formatTime={formatTime}
        setEditingAttendance={setEditingAttendance}
        openEmployeeDetail={openEmployeeDetail}
        navigateTo={navigateTo}
      />

      {!isFullRegisterPage && (
        <div className="w-full space-y-4">
          <WorkforceLeavesPanel
            pendingLeaves={pendingLeaves}
            openEmployeeDetail={openEmployeeDetail}
            openLeaveAction={openLeaveAction}
            navigateTo={navigateTo}
            formatDate={formatDate}
          />
        </div>
      )}

      {metricModal && (
        <WorkforceMetricModal
          metricModal={metricModal}
          setMetricModal={setMetricModal}
          metricModalSearch={metricModalSearch}
          setMetricModalSearch={setMetricModalSearch}
          modalFilteredList={modalFilteredList}
          formattedSelectedDateDisplay={formattedSelectedDateDisplay}
          openEmployeeDetail={openEmployeeDetail}
          getAttendanceInfo={getAttendanceInfo}
          formatTime={formatTime}
        />
      )}

      {workLogsModalOpen && (
        <AdminWorkLogsModal
          isOpen={workLogsModalOpen}
          onClose={() => setWorkLogsModalOpen(false)}
          workLogs={workLogs}
          loading={loadingLogs}
          selectedDate={selectedDate}
          formatDate={formatDate}
          formatTime={formatTime}
        />
      )}
    </div>
  );
}
