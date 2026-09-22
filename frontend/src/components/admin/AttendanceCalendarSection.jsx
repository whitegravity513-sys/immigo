import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Clock,
  Coffee,
  Download,
  Search,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Users,
  Briefcase,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import apiClient from "../../services/apiClient.js";
import { EmployeeIdBadge } from "../common/ImmiGoLogo.jsx";

const formatDuration = (s) => {
  if (isNaN(s) || s <= 0) return "00h 00m";
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  return `${String(hrs).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m`;
};

const formatTime12 = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getTodayStr = () => {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
};

export default function AttendanceCalendarSection({
  setEditingAttendance,
  openEmployeeDetail,
  refreshTrigger = 0,
}) {
  const todayStr = useMemo(() => getTodayStr(), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());

  const [monthData, setMonthData] = useState(null);
  const [monthLoading, setMonthLoading] = useState(false);

  const [dateRecords, setDateRecords] = useState([]);
  const [dateLoading, setDateLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "active_present", "absent", "leave", "half_day"

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Fetch Month Level Calendar Statistics
  const fetchMonthCalendar = useCallback(async () => {
    setMonthLoading(true);
    try {
      const res = await apiClient.get(`/admin/attendance/calendar-month?month=${currentMonth}&year=${currentYear}`);
      setMonthData(res.data);
    } catch (err) {
      console.error("Failed to fetch calendar month data:", err);
    } finally {
      setMonthLoading(false);
    }
  }, [currentMonth, currentYear]);

  // Fetch Selected Date Complete Workforce Attendance
  const fetchDateAttendance = useCallback(async (date) => {
    setDateLoading(true);
    setErrorMsg("");
    try {
      const res = await apiClient.get(`/admin/attendance?date=${date}`);
      setDateRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch date attendance:", err);
      setErrorMsg("Failed to load attendance records for " + date);
    } finally {
      setDateLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonthCalendar();
  }, [fetchMonthCalendar, refreshTrigger]);

  useEffect(() => {
    if (selectedDate) {
      fetchDateAttendance(selectedDate);
    }
  }, [selectedDate, fetchDateAttendance, refreshTrigger]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const t = new Date();
    setCurrentMonth(t.getMonth() + 1);
    setCurrentYear(t.getFullYear());
    setSelectedDate(todayStr);
  };

  // Build Calendar Matrix
  const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sunday
  const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const leadingBlanks = Array.from({ length: firstDayIndex }, () => null);
  const calendarDays = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
  const allGridCells = [...leadingBlanks, ...calendarDays];

  // Map day data by date
  const dayStatsMap = useMemo(() => {
    const map = new Map();
    if (monthData?.days) {
      monthData.days.forEach((d) => {
        map.set(d.date, d);
      });
    }
    return map;
  }, [monthData]);

  // Filtered Date Records
  const filteredRecords = useMemo(() => {
    return dateRecords.filter((rec) => {
      const name = String(rec.name || "").toLowerCase();
      const code = String(rec.employeeCode || rec.employeeId || "").toLowerCase();
      const dept = String(rec.department || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || name.includes(q) || code.includes(q) || dept.includes(q);
      if (!matchesSearch) return false;

      if (statusFilter === "active_present") {
        return rec.isActiveOnDate || ["Present", "Active", "Checked Out", "On Break"].includes(rec.status);
      }
      if (statusFilter === "absent") {
        return !rec.isActiveOnDate && rec.status === "Absent";
      }
      if (statusFilter === "leave") {
        return rec.status === "On Leave";
      }
      if (statusFilter === "half_day") {
        return rec.halfSalaryDeduct || (rec.totalWorkSeconds > 0 && rec.totalWorkSeconds < 28800);
      }
      return true;
    });
  }, [dateRecords, searchQuery, statusFilter]);

  // Statistics for selected date
  const dateMetrics = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let halfDayCount = 0;
    let onBreakCount = 0;

    dateRecords.forEach((r) => {
      const isPres = r.isActiveOnDate || ["Present", "Active", "Checked Out", "On Break"].includes(r.status);
      if (isPres) {
        presentCount++;
        if (r.halfSalaryDeduct || (r.totalWorkSeconds > 0 && r.totalWorkSeconds < 28800)) {
          halfDayCount++;
        }
        if (r.status === "On Break") {
          onBreakCount++;
        }
      } else if (r.status === "On Leave") {
        leaveCount++;
      } else if (r.status === "Absent") {
        absentCount++;
      }
    });

    return {
      totalStaff: dateRecords.length,
      presentCount,
      absentCount,
      leaveCount,
      halfDayCount,
      onBreakCount,
    };
  }, [dateRecords]);

  // Export to CSV for selected date
  const handleExportCSV = () => {
    if (!dateRecords.length) return;

    const headers = [
      "Employee ID",
      "Name",
      "Company Email",
      "Personal Email",
      "Phone",
      "Department",
      "Designation",
      "Date",
      "Status",
      "Active on Date",
      "Check In Time",
      "Check Out Time",
      "Total Work Time",
      "Total Break Time",
      "Check Out Note",
    ];

    const rows = dateRecords.map((r) => [
      `"${r.employeeCode || r.employeeId || ""}"`,
      `"${r.name || ""}"`,
      `"${r.email || ""}"`,
      `"${r.personalEmail || ""}"`,
      `"${r.phone || ""}"`,
      `"${r.department || "General"}"`,
      `"${r.designation || "Employee"}"`,
      `"${r.date || selectedDate}"`,
      `"${r.status || "Absent"}"`,
      `"${r.isActiveOnDate ? "Yes" : "No"}"`,
      `"${r.checkInTime ? formatTime12(r.checkInTime) : ""}"`,
      `"${r.checkOutTime ? formatTime12(r.checkOutTime) : ""}"`,
      `"${formatDuration(r.totalWorkSeconds || 0)}"`,
      `"${formatDuration(r.totalBreakSeconds || 0)}"`,
      `"${(r.checkOutNote || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `workforce_attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Formatted date string for header
  const formattedSelectedDate = useMemo(() => {
    try {
      const d = new Date(`${selectedDate}T00:00:00`);
      return d.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="space-y-6 text-slate-800">
      {/* ── TOP SECTION: CALENDAR CONTROLS & HEADER ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-sm">
              <CalendarIcon size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Workforce Attendance Calendar
                <span className="text-[10px] uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-extrabold">
                  Date-Wise
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Inspect daily attendance of all employees • Track active vs absent staff • Export date-wise reports
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month & Year Jump Selectors */}
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {monthNames.map((mName, idx) => (
                <option key={mName} value={idx + 1}>
                  {mName}
                </option>
              ))}
            </select>

            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200/80">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-2xs transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Today</span>
            </button>
          </div>
        </div>

        {/* ── INTERACTIVE MONTH CALENDAR GRID ── */}
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[700px]">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[11px] font-black uppercase tracking-wider text-slate-500">
              <span className="text-rose-600">Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span className="text-indigo-600">Sat</span>
            </div>

            {/* Day Cells Grid */}
            <div className="grid grid-cols-7 gap-2">
              {allGridCells.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <div key={`blank-${idx}`} className="h-24 rounded-2xl bg-slate-50/50 border border-transparent" />;
                }

                const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const isSelected = dateStr === selectedDate;
                const isTodayDate = dateStr === todayStr;
                const stats = dayStatsMap.get(dateStr);

                const isOffDay = stats?.isWeeklyOff;
                const isHoliday = stats?.isHoliday;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-24 p-2 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer relative group ${
                      isSelected
                        ? "bg-blue-50/90 border-blue-500 shadow-md ring-2 ring-blue-500/20"
                        : isTodayDate
                        ? "bg-amber-50/60 border-amber-300 hover:border-blue-400"
                        : isOffDay || isHoliday
                        ? "bg-slate-50 border-slate-200/90 hover:border-slate-300"
                        : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs"
                    }`}
                  >
                    {/* Date Number & Special Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-black rounded-lg w-6 h-6 flex items-center justify-center ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : isTodayDate
                            ? "bg-amber-500 text-white"
                            : "text-slate-800"
                        }`}
                      >
                        {dayNum}
                      </span>

                      {isHoliday ? (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 truncate max-w-[75px]" title={stats?.holidayTitle}>
                          {stats?.holidayTitle || "Holiday"}
                        </span>
                      ) : isOffDay ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          Off
                        </span>
                      ) : isTodayDate ? (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                          Today
                        </span>
                      ) : null}
                    </div>

                    {/* Day Metrics Mini Summary */}
                    {stats ? (
                      <div className="space-y-0.5 text-[10px] font-bold">
                        {stats.presentCount > 0 ? (
                          <div className="flex items-center justify-between text-emerald-700">
                            <span>Present:</span>
                            <span className="tabular-nums font-extrabold">{stats.presentCount}</span>
                          </div>
                        ) : null}
                        {stats.absentCount > 0 ? (
                          <div className="flex items-center justify-between text-rose-600">
                            <span>Absent:</span>
                            <span className="tabular-nums font-extrabold">{stats.absentCount}</span>
                          </div>
                        ) : null}
                        {stats.leaveCount > 0 ? (
                          <div className="flex items-center justify-between text-blue-600">
                            <span>Leave:</span>
                            <span className="tabular-nums font-extrabold">{stats.leaveCount}</span>
                          </div>
                        ) : null}
                        {!stats.presentCount && !stats.absentCount && !stats.leaveCount && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            {isHoliday ? "Declared Holiday" : isOffDay ? "Weekend Off" : "No Activity"}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-300">...</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── SELECTED DATE WORKFORCE SECTION ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-6">
        {/* Date Header & Quick Picker */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                Selected Date View
              </span>
              {selectedDate === todayStr && (
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  Live Today
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1.5">
              {formattedSelectedDate}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Native Date Input to quickly pick any date */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <CalendarIcon size={15} className="text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    const parsed = new Date(e.target.value);
                    if (!isNaN(parsed.getTime())) {
                      setCurrentMonth(parsed.getMonth() + 1);
                      setCurrentYear(parsed.getFullYear());
                    }
                  }
                }}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>

            {/* Export to CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={dateLoading || dateRecords.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              title="Download Date Attendance CSV"
            >
              <Download size={14} />
              <span>Export CSV (Nikal Sake)</span>
            </button>
          </div>
        </div>

        {/* ── KPI METRIC CARDS FOR SELECTED DATE ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Total Staff</span>
              <Users size={16} />
            </div>
            <div className="text-2xl font-black text-slate-900">{dateMetrics.totalStaff}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Eligible employees on date</div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Active / Present</span>
              <UserCheck size={16} />
            </div>
            <div className="text-2xl font-black text-emerald-950">{dateMetrics.presentCount}</div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Checked in & worked</div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200">
            <div className="flex items-center justify-between text-rose-700 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Absent (Not Active)</span>
              <UserX size={16} />
            </div>
            <div className="text-2xl font-black text-rose-950">{dateMetrics.absentCount}</div>
            <div className="text-[10px] text-rose-700 mt-0.5">Did not attend shift</div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200">
            <div className="flex items-center justify-between text-blue-700 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Approved Leave</span>
              <Briefcase size={16} />
            </div>
            <div className="text-2xl font-black text-blue-950">{dateMetrics.leaveCount}</div>
            <div className="text-[10px] text-blue-700 mt-0.5">Approved time-off</div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider">Half Day</span>
              <Clock size={16} />
            </div>
            <div className="text-2xl font-black text-amber-950">{dateMetrics.halfDayCount}</div>
            <div className="text-[10px] text-amber-700 mt-0.5">Under 8 hours duration</div>
          </div>
        </div>

        {/* ── FILTER TABS & SEARCH BAR ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: "all", label: `All Staff (${dateRecords.length})` },
              { id: "active_present", label: `Active / Present (${dateMetrics.presentCount})` },
              { id: "absent", label: `Absent (${dateMetrics.absentCount})` },
              { id: "leave", label: `On Leave (${dateMetrics.leaveCount})` },
              { id: "half_day", label: `Half Day (${dateMetrics.halfDayCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or department…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* ── WORKFORCE ATTENDANCE TABLE ── */}
        {dateLoading ? (
          <div className="py-16 text-center text-slate-500 font-medium text-sm space-y-2">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading workforce records for {selectedDate}…</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-14 text-center text-slate-500 font-medium text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Users size={32} className="mx-auto text-slate-400 mb-2" />
            <p className="font-bold text-slate-700">No employees match the selected criteria.</p>
            <p className="text-xs text-slate-400 mt-0.5">Try resetting search or status filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3.5">Employee</th>
                  <th className="px-4 py-3.5">Contact Emails</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Attendance Status</th>
                  <th className="px-4 py-3.5">Check In</th>
                  <th className="px-4 py-3.5">Check Out</th>
                  <th className="px-4 py-3.5">Work / Break Time</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.map((emp) => {
                  const isPresent = emp.isActiveOnDate || ["Present", "Active", "Checked Out", "On Break"].includes(emp.status);
                  const statusBg =
                    emp.status === "Active"
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : emp.status === "Checked Out"
                      ? "bg-teal-50 text-teal-800 border-teal-200"
                      : emp.status === "On Break"
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : emp.status === "Present"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : emp.status === "On Leave"
                      ? "bg-blue-50 text-blue-800 border-blue-200"
                      : emp.status === "Holiday"
                      ? "bg-purple-50 text-purple-800 border-purple-200"
                      : emp.status === "Weekly Off"
                      ? "bg-slate-100 text-slate-700 border-slate-200"
                      : "bg-rose-50 text-rose-800 border-rose-200";

                  return (
                    <tr key={emp.id || emp.employeeId} className="hover:bg-slate-50/60 transition">
                      {/* Employee Identification */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => openEmployeeDetail && openEmployeeDetail(emp.employeeId || emp._id, "employees")}
                              className="font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer text-left block"
                            >
                              {emp.name}
                            </button>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <EmployeeIdBadge id={emp.employeeCode || emp.employeeId} size="xs" />
                              {emp.employeeStatus === "inactive" && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200 uppercase">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Work & Personal Emails */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5 font-medium">
                          <div className="text-slate-700 truncate max-w-[220px]" title={emp.email}>
                            {emp.email}
                          </div>
                          {emp.personalEmail ? (
                            <div className="text-[11px] text-slate-400 truncate max-w-[220px]" title={`Personal: ${emp.personalEmail}`}>
                              Personal: {emp.personalEmail}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-300 italic">No personal email</div>
                          )}
                        </div>
                      </td>

                      {/* Department / Role */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-700">{emp.department || "General"}</div>
                        <div className="text-[11px] text-slate-400">{emp.designation || "Employee"}</div>
                      </td>

                      {/* Attendance Status Badge */}
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${statusBg}`}>
                            {emp.status || "Absent"}
                          </span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 mt-1">
                          {isPresent ? (
                            <span className="text-emerald-600 font-extrabold">Active on Date ✓</span>
                          ) : (
                            <span className="text-rose-500 font-extrabold">Not Active ✕</span>
                          )}
                        </div>
                      </td>

                      {/* Check In */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {emp.checkInTime ? formatTime12(emp.checkInTime) : "—"}
                        </span>
                      </td>

                      {/* Check Out */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {emp.checkOutTime ? formatTime12(emp.checkOutTime) : "—"}
                        </span>
                      </td>

                      {/* Duration & Breaks */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <div className="font-mono font-bold text-blue-700">
                            Work: {formatDuration(emp.totalWorkSeconds || 0)}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            Break: {formatDuration(emp.totalBreakSeconds || 0)}
                          </div>
                        </div>
                      </td>

                      {/* Actions: Admin Time Edit */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (setEditingAttendance) {
                              setEditingAttendance({
                                employeeId: emp.employeeId || emp._id,
                                name: emp.name,
                                date: emp.date || selectedDate,
                                checkInTime: emp.checkInTime,
                                checkOutTime: emp.checkOutTime,
                                status: emp.status,
                                halfSalaryDeduct: emp.halfSalaryDeduct,
                              });
                            }
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1 ml-auto cursor-pointer shadow-2xs"
                          title="Admin: Change or adjust attendance timings"
                        >
                          <Pencil size={12} />
                          <span>Edit Time</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
