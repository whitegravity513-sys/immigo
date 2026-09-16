import { useState, useEffect, useRef } from "react";
import { apiClient } from "../../services/apiClient.js";
import {
  Clock, Coffee, Calendar, FileText, Eye, LogOut, AlertCircle,
  CheckCircle, Play, FileUp, Award, Menu, X, ArrowRightFromLine,
  ArrowLeftFromLine, Timer, Sandwich, Pause, LogIn, Video, ExternalLink, ChevronRight,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

import CheckInOutSection from "../../components/employee/CheckInOutSection.jsx";
import BreaksSection from "../../components/employee/BreaksSection.jsx";
import AttendanceCalendarTab from "../../components/employee/AttendanceCalendarTab.jsx";
import MonthlyTrackerTab from "../../components/employee/MonthlyTrackerTab.jsx";
import ApplyLeaveModal from "../../components/employee/ApplyLeaveModal.jsx";
import LeaveHistorySection from "../../components/employee/LeaveHistorySection.jsx";
import EmployeeNotificationBell from "../../components/employee/EmployeeNotificationBell.jsx";
import EmployeeMeetingsTab from "../../components/employee/EmployeeMeetingsTab.jsx";
import EmployeeAnnouncementsTab from "../../components/employee/EmployeeAnnouncementsTab.jsx";
import { ImmiGoLogo, DashboardWatermark, EmployeeIdBadge } from "../../components/common/ImmiGoLogo.jsx";

/* ─────────────────────────── helpers ─────────────────────────── */
const fmtDur = (s) => {
  if (!s || s < 0) s = 0;
  s = Math.floor(s);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
};
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const fmtTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};
const getIndiaDateString = () => {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
};
const getDateKey = (dateValue) => {
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const isDateInLeaveRange = (dateKey, leave) => {
  if (!leave?.startDate || !leave?.endDate) return false;
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  const current = new Date(`${dateKey}T00:00:00`);
  return current >= start && current <= end;
};

/* ─────────────────────────── component ─────────────────────────── */
export default function EmployeeDashboard({ user, token, onLogout }) {
  // ── nav state ──
  const [view, setView] = useState("tracker");     // tracker | checkinout | breaks | apply-leave | leave-history | meetings
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── today's meetings (for banner) ──
  const [todayMeetings, setTodayMeetings] = useState([]);

  // ── ui feedback ──
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ── data ──
  const [statusRecord, setStatusRecord] = useState(null);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [monthlyData, setMonthlyData] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ startDate: "", endDate: "", reason: "", document: "" });
  const [fileLabel, setFileLabel] = useState("");
  const [checkOutNote, setCheckOutNote] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // ── live timers ──
  const [workSeconds, setWorkSeconds] = useState(0);
  const [lunchSeconds, setLunchSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const timerRef = useRef(null);

  /* ── auto-clear notifications ── */
  useEffect(() => { if (errorMsg) { const t = setTimeout(() => setErrorMsg(""), 6000); return () => clearTimeout(t); } }, [errorMsg]);
  useEffect(() => { if (successMsg) { const t = setTimeout(() => setSuccessMsg(""), 6000); return () => clearTimeout(t); } }, [successMsg]);

  /* ── live background polling ── */
  useEffect(() => {
    if (!token) return;
    fetchAll();
    const iv = setInterval(() => {
      fetchAll();
      if (view === "calendar") {
        fetchMonthlyAttendance(calendarMonth, calendarYear, true);
      }
    }, 3500);
    return () => clearInterval(iv);
  }, [token, view, calendarMonth, calendarYear]);

  useEffect(() => {
    if (token && (view === "calendar" || view === "tracker")) {
      fetchMonthlyAttendance();
    }
  }, [token, view, calendarMonth, calendarYear]);

  // ── fetch today's meetings for banner ──
  useEffect(() => {
    if (!token) return;
    const todayStr = new Date().toISOString().split("T")[0];
    apiClient.get(`/employee/meetings`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      const all = Array.isArray(res.data) ? res.data : [];
      setTodayMeetings(all.filter((m) => m.date === todayStr));
    }).catch(() => {});
    const iv = setInterval(() => {
      const ts = new Date().toISOString().split("T")[0];
      apiClient.get(`/employee/meetings`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        const all = Array.isArray(res.data) ? res.data : [];
        setTodayMeetings(all.filter((m) => m.date === ts));
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(iv);
  }, [token]);

  async function fetchAll() {
    try {
      const [sRes, lRes, hRes, aRes] = await Promise.all([
        apiClient.get(`/employee/status`),
        apiClient.get(`/employee/leaves`),
        apiClient.get(`/employee/holidays`).catch(() => ({ data: [] })),
        apiClient.get(`/employee/announcements`).catch(() => ({ data: [] })),
      ]);
      setStatusRecord(sRes.data);
      setLeaveHistory(lRes.data);
      setHolidays(hRes.data || []);
      setAnnouncements(aRes.data || []);
    } catch (err) {
      console.error("Failed to load employee data across refresh:", err);
    }
  }

  async function fetchMonthlyAttendance(month = calendarMonth, year = calendarYear, silent = false) {
    if (!silent) setMonthlyLoading(true);
    try {
      const res = await apiClient.get(`/employee/monthly?month=${month}&year=${year}`);
      setMonthlyData(res.data);
    } catch (err) {
      console.error("Failed to load monthly attendance", err);
    } finally {
      if (!silent) setMonthlyLoading(false);
    }
  }

  /* ── live timer ── */
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!statusRecord) return;
    const { status, checkInTime, lunchBreakSeconds: ls = 0, otherBreakSeconds: os = 0, totalBreakSeconds: ts = 0, breaks = [] } = statusRecord;

    if (status === "Active" && checkInTime) {
      const start = new Date(checkInTime).getTime();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        setWorkSeconds(Math.max(0, elapsed - ts));
        setLunchSeconds(ls);
        setBreakSeconds(os);
      }, 1000);
    } else if (status === "On Break" && checkInTime) {
      const lastBreak = breaks[breaks.length - 1];
      const start = new Date(checkInTime).getTime();
      timerRef.current = setInterval(() => {
        const breakElapsed = Math.floor((Date.now() - new Date(lastBreak.startTime).getTime()) / 1000);
        const curLunch = lastBreak.type === "Lunch" ? ls + breakElapsed : ls;
        const curOther = lastBreak.type !== "Lunch" ? os + breakElapsed : os;
        const elapsed = Math.floor((Date.now() - start) / 1000);
        setWorkSeconds(Math.max(0, elapsed - (curLunch + curOther)));
        setLunchSeconds(curLunch);
        setBreakSeconds(curOther);
      }, 1000);
    } else if (status === "Checked Out") {
      setWorkSeconds(statusRecord.totalWorkSeconds || 0);
      setLunchSeconds(ls);
      setBreakSeconds(os);
    } else {
      setWorkSeconds(0); setLunchSeconds(0); setBreakSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [statusRecord]);

  /* ── location / device utils ── */
  const getDevice = () => {
    const ua = navigator.userAgent;
    const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iOS" : /Win/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "MacOS" : "Linux";
    const br = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Browser";
    return `${os} (${br})`;
  };
  const getLoc = () => new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ latitude: null, longitude: null, address: "Not supported" });
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude, address: `${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}` }),
      () => resolve({ latitude: null, longitude: null, address: "Permission Denied" }),
      { enableHighAccuracy: false, timeout: 3000 }
    );
  });

  /* ── actions ── */
  const apiCall = async (fn) => { setLoading(true); setErrorMsg(""); try { await fn(); } catch (err) { setErrorMsg(err.response?.data?.message || "Action failed."); } finally { setLoading(false); } };

  const handleCheckIn = () => apiCall(async () => {
    const loc = await getLoc(); loc.device = getDevice();
    const res = await apiClient.post(`/employee/check-in`, { location: loc });
    setStatusRecord(res.data.record); setSuccessMsg(res.data.message);
  });

  const handleCheckOut = () => apiCall(async () => {
    const loc = await getLoc(); loc.device = getDevice();
    const res = await apiClient.post(`/employee/check-out`, { location: loc, checkOutNote });
    setStatusRecord(res.data.record); setSuccessMsg(res.data.message);
    setCheckOutNote("");
  });

  const handleBreakStart = (type) => apiCall(async () => {
    const res = await apiClient.post(`/employee/break/start`, { breakType: type });
    setStatusRecord(res.data.record); setSuccessMsg(res.data.message);
  });

  const handleBreakEnd = () => apiCall(async () => {
    const res = await apiClient.post(`/employee/break/end`);
    setStatusRecord(res.data.record); setSuccessMsg(res.data.message);
  });

  const handleLeaveFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2000000) { setErrorMsg("File too large (max 2 MB)."); return; }
    setFileLabel(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setLeaveForm((p) => ({ ...p, document: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) { setErrorMsg("Fill all required fields."); return; }
    apiCall(async () => {
      const res = await apiClient.post(`/employee/leaves`, leaveForm);
      setSuccessMsg(res.data.message);
      setLeaveForm({ startDate: "", endDate: "", reason: "", document: "" });
      setFileLabel("");
      fetchAll();
    });
  };

  /* ── derived ── */
  const status = statusRecord?.status || "Absent";
  const leaveBalance = statusRecord?.leaveBalance ?? 0;
  const nextMonthLeaves = statusRecord?.nextMonthLeaves ?? 0;
  const isOnBreak = status === "On Break";
  const isActive = status === "Active";
  const isCheckedOut = status === "Checked Out";
  const lastBreak = statusRecord?.breaks?.[statusRecord.breaks.length - 1];
  const overLimit = (lunchSeconds + breakSeconds) > 3600;
  const todayDateStr = getIndiaDateString();
  const todayHoliday = holidays.find((h) => h.date === todayDateStr);
  const isHolidayToday = Boolean(todayHoliday);

  const todayDateObj = new Date();
  const dayOfWeekToday = todayDateObj.getDay();
  const isSundayToday = dayOfWeekToday === 0;
  let isOffSatToday = false;
  if (dayOfWeekToday === 6) {
    const dayOfMonth = todayDateObj.getDate();
    const satCount = Math.ceil(dayOfMonth / 7);
    if (satCount === 2 || satCount === 4) isOffSatToday = true;
  }
  const isWeeklyOffToday = isSundayToday || isOffSatToday;
  const weeklyOffReason = isSundayToday ? "Sunday Off" : isOffSatToday ? "2nd/4th Saturday Off" : "";

  /* ── status colours ── */
  const statusColor = {
    Active: "bg-indigo-500", "On Break": "bg-amber-500",
    "Checked Out": "bg-slate-400", Absent: "bg-rose-500",
    "Weekly Off": "bg-slate-400", Holiday: "bg-indigo-500",
  }[status] || "bg-slate-400";

  /* ── sidebar nav items ── */
  const navItems = [
    { key: "tracker", icon: <Clock size={18} />, label: "Live Tracker" },
    { key: "calendar", icon: <Calendar size={18} />, label: "Attendance Calendar" },
    { key: "checkinout", icon: <LogIn size={18} />, label: "Check In / Out" },
    { key: "breaks", icon: <Coffee size={18} />, label: "Breaks" },
    { key: "apply-leave", icon: <Calendar size={18} />, label: "Apply Leave" },
    { key: "leave-history", icon: <FileText size={18} />, label: "Leave History" },
    { key: "announcements", icon: <FileText size={18} />, label: "Announcements" },
    { key: "meetings", icon: <Video size={18} />, label: "Meetings" },
  ];

  /* ══════════════════════════ SHELL ══════════════════════════ */
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans relative overflow-x-hidden">
      {/* Light Background Watermark Logo */}
      <DashboardWatermark />

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col shrink-0 w-60 bg-gradient-to-b from-[#eef5ff] via-[#e8f2fe] to-[#edf4fe] border-r border-blue-200/80 shadow-[1px_0_6px_rgba(37,99,235,0.06)] transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>

        {/* Integrated Brand + Employee Header */}
        <div className="px-4 pt-4 pb-3 border-b border-blue-200/60 bg-white/75 backdrop-blur-xs flex items-center justify-between gap-2">
          <ImmiGoLogo size="sm" subtitle="Employee Portal" />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex-shrink-0">
            <X size={15} />
          </button>
        </div>

        {/* Employee Info chip */}
        <div className="mx-3 mt-3 px-3 py-2.5 bg-white/95 border border-blue-200/80 rounded-xl flex items-center gap-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-[12px] flex items-center justify-center shrink-0 shadow-xs">
            {(user?.name || "E")[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-slate-800 text-[12px] truncate leading-tight mb-1">{user?.name || "Employee"}</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <EmployeeIdBadge id={user?.employeeId} size="sm" />
              <span className={`text-[10px] font-bold ${status === "Active" ? "text-blue-600" : status === "On Break" ? "text-amber-500" : "text-slate-400"}`}>
                &bull; {status}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1 custom-scrollbar">
          <p className="text-[11px] font-extrabold text-blue-900/60 uppercase tracking-[0.14em] px-3 mb-2 mt-1">Navigation</p>
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                view === item.key
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold"
                  : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-950"
              }`}
              onClick={() => { setView(item.key); setSidebarOpen(false); }}
            >
              <span className={`shrink-0 ${view === item.key ? "text-white" : "text-slate-500"}`}>{item.icon}</span>
              <span className={view === item.key ? "text-white" : "text-slate-700 font-semibold"}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer Logout — full width, pinned to bottom */}
        <div className="border-t border-blue-200/70 bg-white/50 p-3">
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-rose-600 hover:text-white bg-white hover:bg-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            onClick={onLogout}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header with soft light blue gradient tint */}
        <header className="h-[72px] min-h-[72px] bg-gradient-to-r from-white via-blue-50/25 to-white backdrop-blur-md px-4 sm:px-6 sticky top-0 z-30 flex items-center justify-between border-b border-slate-300 shadow-xs">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button className="lg:hidden w-9 h-9 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 cursor-pointer" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 truncate">
                <span className="hidden sm:flex items-end gap-0.5 select-none font-black text-lg tracking-tighter leading-none text-slate-900">
                  <span>immi</span>
                  <span className="text-blue-600">Go</span>
                  <svg viewBox="0 0 20 20" fill="none" className="w-2.5 h-2.5 text-orange-500 mb-0.5 ml-0.5 shrink-0">
                    <path d="M3 10h14M10 3l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <ChevronRight size={13} className="text-slate-400 shrink-0 hidden sm:inline" />
                <span className="text-slate-900 font-extrabold text-sm sm:text-[15px] tracking-tight truncate">
                  Welcome, {user?.name || "Employee"}
                </span>
              </div>
              <div className="hidden md:flex items-center gap-2 mt-0.5">
                <EmployeeIdBadge id={user?.employeeId} size="sm" />
                <span className="text-[10px] text-blue-700 font-bold tracking-wide">Portal Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-time Notification Bell */}
            <EmployeeNotificationBell token={token} />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700">
              <span className={`w-2 h-2 rounded-full ${statusColor}`} />
              <span className="hidden sm:inline">{status}</span>
              <span className="sm:hidden">EMPLOYEE</span>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-5xl w-full mx-auto">
          {errorMsg && <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium mb-6"><AlertCircle size={16} className="shrink-0" /><span>{errorMsg}</span></div>}
          {successMsg && <div className="flex items-center gap-2.5 p-4 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-2xl text-sm font-medium mb-6"><CheckCircle size={16} className="shrink-0" /><span>{successMsg}</span></div>}

          {view === "tracker" && announcements.length > 0 && (
            <div className="mb-5 bg-white border border-slate-300 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-indigo-500" /> Company Announcements
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {announcements.map((a) => (
                  <div key={a._id} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h4 className="font-bold text-indigo-900 text-sm leading-tight">{a.title}</h4>
                      <span className="text-[10px] text-indigo-500 font-semibold shrink-0">{fmtDate(a.createdAt)}</span>
                    </div>
                    <p className="text-xs text-indigo-700 whitespace-pre-wrap leading-relaxed">{a.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's meetings banner (only on tracker view) */}
          {view === "tracker" && todayMeetings.length > 0 && (
            <div className="mb-5 p-4 rounded-2xl border border-indigo-300 bg-indigo-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 rounded-xl">
                  <Video size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-indigo-900 uppercase tracking-wider">You have {todayMeetings.length} meeting{todayMeetings.length > 1 ? "s" : ""} today</p>
                  <p className="text-xs text-indigo-700 font-semibold">{todayMeetings.map(m => `${m.title} @ ${m.startTime}`).join(" · ")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {todayMeetings[0]?.meetingLink && (
                  <a
                    href={todayMeetings[0].meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <ExternalLink size={12} /> Join Now
                  </a>
                )}
                <button
                  onClick={() => setView("meetings")}
                  className="px-3 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  View All
                </button>
              </div>
            </div>
          )}

          {view === "tracker" && (
            <MonthlyTrackerTab
              holidays={holidays}
              status={status}
              statusColor={statusColor}
              workSeconds={workSeconds}
              lunchSeconds={lunchSeconds}
              breakSeconds={breakSeconds}
              fmtDur={fmtDur}
              overLimit={overLimit}
              statusRecord={statusRecord}
              fmtTime={fmtTime}
            />
          )}
          {view === "calendar" && (
            <AttendanceCalendarTab
              calendarMonth={calendarMonth}
              calendarYear={calendarYear}
              setCalendarMonth={setCalendarMonth}
              setCalendarYear={setCalendarYear}
              monthlyData={monthlyData}
              monthlyLoading={monthlyLoading}
              holidays={holidays}
              leaveHistory={leaveHistory}
              isDateInLeaveRange={isDateInLeaveRange}
              getDateKey={getDateKey}
              getIndiaDateString={getIndiaDateString}
              status={status}
              statusRecord={statusRecord}
              fmtTime={fmtTime}
              lunchSeconds={lunchSeconds}
              breakSeconds={breakSeconds}
              fmtDur={fmtDur}
            />
          )}
          {view === "checkinout" && (
            <CheckInOutSection
              status={status}
              statusColor={statusColor}
              workSeconds={workSeconds}
              lunchSeconds={lunchSeconds}
              breakSeconds={breakSeconds}
              fmtDur={fmtDur}
              statusRecord={statusRecord}
              fmtTime={fmtTime}
              isHolidayToday={isHolidayToday}
              todayHoliday={todayHoliday}
              isWeeklyOffToday={isWeeklyOffToday}
              weeklyOffReason={weeklyOffReason}
              loading={loading}
              handleCheckIn={handleCheckIn}
              handleCheckOut={handleCheckOut}
              checkOutNote={checkOutNote}
              setCheckOutNote={setCheckOutNote}
            />
          )}
          {view === "breaks" && (
            <BreaksSection
              isOnBreak={isOnBreak}
              lastBreak={lastBreak}
              status={status}
              statusColor={statusColor}
              lunchSeconds={lunchSeconds}
              breakSeconds={breakSeconds}
              workSeconds={workSeconds}
              statusRecord={statusRecord}
              fmtDur={fmtDur}
              fmtTime={fmtTime}
              overLimit={overLimit}
              isCheckedOut={isCheckedOut}
              isActive={isActive}
              loading={loading}
              isHolidayToday={isHolidayToday}
              handleBreakStart={handleBreakStart}
              handleBreakEnd={handleBreakEnd}
            />
          )}
          {view === "apply-leave" && (
            <ApplyLeaveModal
              leaveBalance={leaveBalance}
              leaveForm={leaveForm}
              setLeaveForm={setLeaveForm}
              handleLeaveSubmit={handleLeaveSubmit}
              handleLeaveFile={handleLeaveFile}
              fileLabel={fileLabel}
              loading={loading}
            />
          )}
          {view === "leave-history" && (
            <LeaveHistorySection
              leaveBalance={leaveBalance}
              leaveHistory={leaveHistory}
              fmtDate={fmtDate}
              setPreviewDoc={setPreviewDoc}
            />
          )}
          {view === "announcements" && (
            <EmployeeAnnouncementsTab
              announcements={announcements}
              fmtDate={fmtDate}
            />
          )}
          {view === "meetings" && (
            <EmployeeMeetingsTab token={token} />
          )}
        </main>
        
        {/* Footer */}
        <footer className="px-4 sm:px-6 py-4 select-none shrink-0 bg-gradient-to-r from-slate-50 via-blue-50/25 to-slate-50 border-t border-slate-300 mt-auto">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-end gap-0.5 select-none font-black text-base tracking-tighter leading-none text-slate-900">
                <span>immi</span>
                <span className="text-blue-600">Go</span>
                <svg viewBox="0 0 20 20" fill="none" className="w-2.5 h-2.5 text-orange-500 mb-0.5 ml-0.5 shrink-0">
                  <path d="M3 10h14M10 3l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>System Online</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <Award size={14} className="text-blue-500" />
              <span>&copy; {new Date().getFullYear()} immiGo &middot; HRMS & Operations Platform</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Document preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-800">Supporting Document</h3>
              <button className="text-slate-400 hover:text-slate-700 text-xl cursor-pointer p-1" onClick={() => setPreviewDoc(null)}>×</button>
            </div>
            <div className="p-6 flex justify-center items-center">
              {previewDoc.startsWith("data:image/") ? <img src={previewDoc} className="max-h-[450px] w-auto object-contain rounded-lg shadow-sm" alt="Doc" />
                : previewDoc.startsWith("data:application/pdf") ? <iframe src={previewDoc} style={{ width: "100%", height: "450px", border: "none", borderRadius: "8px" }} />
                : <div className="text-center py-8"><FileText size={48} className="mb-4 text-blue-600 mx-auto" /><a href={previewDoc} download="attachment" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-block cursor-pointer">Download</a></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
