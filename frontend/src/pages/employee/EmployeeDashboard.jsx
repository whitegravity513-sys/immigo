import { useState, useEffect, useRef } from "react";
import { apiClient } from "../../services/apiClient.js";
import {
  Clock, Coffee, Calendar, FileText, Eye, LogOut, AlertCircle,
  CheckCircle, Play, FileUp, Award, Menu, X, ArrowRightFromLine,
  ArrowLeftFromLine, Timer, Sandwich, Pause, LogIn, Video, ExternalLink, ChevronRight,
  IndianRupee, User, ShieldCheck,
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
import EmployeeProfileDocsTab from "../../components/employee/EmployeeProfileDocsTab.jsx";
import EmployeeExpensesTab from "../../components/employee/EmployeeExpensesTab.jsx";
import { ImmiGoLogo, DashboardWatermark, EmployeeIdBadge } from "../../components/common/ImmiGoLogo.jsx";
import AppFooter from "../../components/common/AppFooter.jsx";
import CRMDashboard from "../../components/crm/CRMDashboard.jsx";
import EmpSidebar from "../../components/employee/layout/EmpSidebar.jsx";
import EmpTopbar from "../../components/employee/layout/EmpTopbar.jsx";
import EmpHomeOverview from "../../components/employee/dashboard/EmpHomeOverview.jsx";

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
  const [view, setView] = useState("home");     // home | tracker | checkinout | breaks | apply-leave | leave-history | meetings
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

  /* ── sales employee check ── */
  const isSalesEmployee = user?.department?.toLowerCase?.()?.includes?.("sales");

  /* ══════════════════════════ SHELL ══════════════════════════ */
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans relative overflow-x-hidden">
      {/* Light Background Watermark Logo */}
      <DashboardWatermark />

      {/* Enterprise Dark Navy Sidebar */}
      <EmpSidebar
        view={view}
        setView={setView}
        onLogout={onLogout}
        user={user}
        status={status}
        statusColor={statusColor}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSalesEmployee={isSalesEmployee}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Enterprise White Topbar */}
        <EmpTopbar
          view={view}
          setView={setView}
          onLogout={onLogout}
          user={user}
          token={token}
          isSalesEmployee={isSalesEmployee}
          status={status}
          statusColor={statusColor}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main Body View */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {errorMsg && <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium mb-6"><AlertCircle size={16} className="shrink-0" /><span>{errorMsg}</span></div>}
          {successMsg && <div className="flex items-center gap-2.5 p-4 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-2xl text-sm font-medium mb-6"><CheckCircle size={16} className="shrink-0" /><span>{successMsg}</span></div>}

          {/* ── 0. Home Dashboard Overview (New Default) ── */}
          {view === "home" && (
            <EmpHomeOverview
              user={user}
              statusRecord={statusRecord}
              status={status}
              statusColor={statusColor}
              workSeconds={workSeconds}
              lunchSeconds={lunchSeconds}
              breakSeconds={breakSeconds}
              fmtDur={fmtDur}
              fmtTime={fmtTime}
              leaveBalance={leaveBalance}
              leaveHistory={leaveHistory}
              todayMeetings={todayMeetings}
              announcements={announcements}
              holidays={holidays}
              setView={setView}
              handleCheckIn={handleCheckIn}
              handleCheckOut={handleCheckOut}
              loading={loading}
              isHolidayToday={isHolidayToday}
              todayHoliday={todayHoliday}
              isWeeklyOffToday={isWeeklyOffToday}
              weeklyOffReason={weeklyOffReason}
            />
          )}

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
            <>
              {/* ── Employee Profile Card ── */}
              <div className="mb-6 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Hero gradient band */}
                <div className="h-16 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 relative">
                  {isHolidayToday && (
                    <span className="absolute right-4 top-4 px-3 py-1 bg-amber-400/90 text-amber-950 text-[10px] font-black rounded-lg uppercase tracking-wider">
                      🌟 Holiday: {todayHoliday?.title}
                    </span>
                  )}
                  {isWeeklyOffToday && !isHolidayToday && (
                    <span className="absolute right-4 top-4 px-3 py-1 bg-slate-400/80 text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                      {weeklyOffReason}
                    </span>
                  )}
                </div>
                <div className="px-6 pb-5 pt-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-7">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center border-4 border-white shadow-md shrink-0">
                      {statusRecord?.profileImage
                        ? <img src={statusRecord.profileImage} alt="" className="w-full h-full object-cover rounded-xl" />
                        : (user?.name || "E")[0].toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0 pt-2 sm:pt-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black text-slate-900 leading-tight">{user?.name || "Employee"}</h2>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          isOnBreak ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : isActive ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : isCheckedOut ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : "bg-rose-100 text-rose-700 border border-rose-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusColor} ${isActive || isOnBreak ? "animate-pulse" : ""}`} />
                          {status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                        {user?.employeeId && <span>ID: <span className="font-bold text-slate-700">{user.employeeId}</span></span>}
                        {user?.department && <span>Dept: <span className="font-bold text-slate-700">{user.department}</span></span>}
                        {user?.designation && <span>Role: <span className="font-bold text-slate-700">{user.designation}</span></span>}
                      </div>
                    </div>
                    {/* Today's Time Stats */}
                    <div className="flex gap-4 shrink-0 text-center">
                      <div>
                        <div className="text-lg font-black tabular-nums text-slate-900">{fmtDur(workSeconds)}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Work Time</div>
                      </div>
                      <div className="w-px bg-slate-200" />
                      <div>
                        <div className="text-lg font-black tabular-nums text-amber-700">{fmtDur((lunchSeconds||0)+(breakSeconds||0))}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Break Time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
            </>
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
          {view === "profile-docs" && (
            <EmployeeProfileDocsTab user={user} token={token} />
          )}
          {view === "expenses" && (
            <EmployeeExpensesTab user={user} token={token} />
          )}
          {view === "meetings" && (
            <EmployeeMeetingsTab token={token} />
          )}
          {view === "crm" && (
            <CRMDashboard user={user} />
          )}
        </main>
        
        {/* Unified App Footer */}
        <AppFooter
          role="employee"
          onNavigate={(key) => setView(key)}
        />
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
