import { useState, useEffect, useRef } from "react";
import { apiClient } from "../../services/apiClient.js";

import CheckInOutSection from "../../components/employee/CheckInOutSection.jsx";
import BreaksSection from "../../components/employee/BreaksSection.jsx";
import AttendanceCalendarTab from "../../components/employee/AttendanceCalendarTab.jsx";
import MonthlyTrackerTab from "../../components/employee/MonthlyTrackerTab.jsx";
import ApplyLeaveModal from "../../components/employee/ApplyLeaveModal.jsx";
import LeaveHistorySection from "../../components/employee/LeaveHistorySection.jsx";
import LeaveManagementSection from "../../components/employee/LeaveManagementSection.jsx";
import EmployeeNotificationBell from "../../components/employee/EmployeeNotificationBell.jsx";
import EmployeeMeetingsTab from "../../components/employee/EmployeeMeetingsTab.jsx";
import EmployeeAnnouncementsTab from "../../components/employee/EmployeeAnnouncementsTab.jsx";
import EmployeeProfileDocsTab from "../../components/employee/EmployeeProfileDocsTab.jsx";
import EmployeeExpensesTab from "../../components/employee/EmployeeExpensesTab.jsx";
import { EmployeeLayout } from "../../layouts";
import DocPreviewModal from "../../components/admin/modals/DocPreviewModal.jsx";
import EmpHomeOverview from "../../components/employee/dashboard/EmpHomeOverview.jsx";
import {
  formatDuration as fmtDur,
  formatDate as fmtDate,
  formatTime as fmtTime,
  getIndiaDateString,
  getDateKey,
  isDateInLeaveRange,
} from "../../utils/formatters.js";

export default function EmployeeDashboard({ user, token, onLogout }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      return stored ? { ...user, ...stored } : user;
    } catch {
      return user;
    }
  });

  const handleProfileImageUpdate = (newImage) => {
    if (!newImage) return;
    setCurrentUser((prev) => {
      const updated = { ...(prev || {}), profileImage: newImage };
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, profileImage: newImage }));
      } catch (e) { }
      return updated;
    });
    setStatusRecord((prev) => (prev ? { ...prev, profileImage: newImage } : prev));
  };

  useEffect(() => {
    const onUserUpdated = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "null");
        if (stored?.profileImage) {
          handleProfileImageUpdate(stored.profileImage);
        }
      } catch (e) { }
    };
    window.addEventListener("user-updated", onUserUpdated);
    return () => window.removeEventListener("user-updated", onUserUpdated);
  }, []);

  const [employeeProfile, setEmployeeProfile] = useState(null);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await apiClient.get("/employee/profile");
      if (res.data) {
        setEmployeeProfile(res.data);
        if (res.data.profileImage) {
          handleProfileImageUpdate(res.data.profileImage);
        }
        if (res.data.department) {
          setCurrentUser((prev) => ({ ...(prev || {}), department: res.data.department }));
        }
      }
    } catch (e) { }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const REQUIRED_DOC_TYPES = [
    "Resume / CV",
    "Aadhaar / National ID",
    "PAN Card",
    "Offer Letter",
    "Educational Certificates",
    "Bank Proof / Cancelled Cheque",
  ];

  const profileDocs = employeeProfile?.documents || [];
  const missingDocs = REQUIRED_DOC_TYPES.filter(
    (type) => !profileDocs.some((d) => d.type === type)
  );
  const rejectedDocs = profileDocs.filter((d) => d.status === "Rejected");
  const isComplianceOnHold = missingDocs.length > 0 || rejectedDocs.length > 0;
  const complianceInfo = {
    isComplianceOnHold,
    missingDocs,
    rejectedDocs,
  };

  const [view, setView] = useState("home");     
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [todayMeetings, setTodayMeetings] = useState([]);

  const [liveAdminNotification, setLiveAdminNotification] = useState(null);

  useEffect(() => {
    const handleNewAdminNotif = (e) => {
      if (e?.detail) {
        setLiveAdminNotification(e.detail);
        if (e.detail?.type === "DOCUMENT_UPDATE") {
          fetchProfile();
        }
      }
    };
    window.addEventListener("new-admin-notification", handleNewAdminNotif);
    return () => window.removeEventListener("new-admin-notification", handleNewAdminNotif);
  }, []);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [statusRecord, setStatusRecord] = useState(null);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [monthlyData, setMonthlyData] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "Casual Leave",
    startDate: "",
    endDate: "",
    reason: "",
    document: "",
  });
  const [fileLabel, setFileLabel] = useState("");
  const [checkOutNote, setCheckOutNote] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const [workSeconds, setWorkSeconds] = useState(0);
  const [lunchSeconds, setLunchSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => { if (errorMsg) { const t = setTimeout(() => setErrorMsg(""), 6000); return () => clearTimeout(t); } }, [errorMsg]);
  useEffect(() => { if (successMsg) { const t = setTimeout(() => setSuccessMsg(""), 6000); return () => clearTimeout(t); } }, [successMsg]);

  useEffect(() => {
    if (!token) return;
    fetchAll();

    const todayStr = new Date().toISOString().split("T")[0];
    apiClient.get(`/employee/meetings`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      const all = Array.isArray(res.data) ? res.data : [];
      setTodayMeetings(all.filter((m) => m.date === todayStr));
    }).catch(() => { });

    // Real-time 2-second synchronization for immediate updates between Admin and Employee
    const iv = setInterval(() => {
      fetchAll(true);
    }, 2000);

    const handleFocus = () => fetchAll(true);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(iv);
      window.removeEventListener("focus", handleFocus);
    };
  }, [token]);

  useEffect(() => {
    if (token && (view === "calendar" || view === "tracker")) {
      fetchMonthlyAttendance(calendarMonth, calendarYear);
    }
  }, [token, view, calendarMonth, calendarYear]);

  async function fetchAll(silent = false) {
    try {
      const [sRes, lRes, hRes, aRes] = await Promise.all([
        apiClient.get(`/employee/status`),
        apiClient.get(`/employee/leaves`),
        apiClient.get(`/employee/holidays`).catch(() => ({ data: [] })),
        apiClient.get(`/employee/announcements`).catch(() => ({ data: [] })),
      ]);
      setStatusRecord(sRes.data);
      if (sRes.data?.profileImage) {
        handleProfileImageUpdate(sRes.data.profileImage);
      }
      if (sRes.data?.department && sRes.data.department !== currentUser?.department) {
        setCurrentUser((prev) => ({ ...(prev || {}), department: sRes.data.department }));
      }
      setLeaveHistory(lRes.data);
      setHolidays(hRes.data || []);
      setAnnouncements(aRes.data || []);
    } catch (err) {
      if (!silent) console.error("Failed to load employee data:", err);
    } finally {
      setInitialLoading(false);
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

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!statusRecord) return;
    const {
      status,
      checkInTime,
      lunchBreakSeconds: ls = 0,
      otherBreakSeconds: os = 0,
      totalBreakSeconds: ts = 0,
      breaks = []
    } = statusRecord;

    if (status === "Active" && checkInTime) {
      const start = new Date(checkInTime).getTime();
      const tick = () => {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        setWorkSeconds(Math.max(0, elapsed - ts));
        setLunchSeconds(ls);
        setBreakSeconds(os);
      };
      tick();
      timerRef.current = setInterval(tick, 1000);
    } else if (status === "On Break" && checkInTime) {
      const lastBreak = breaks && breaks.length > 0 ? breaks[breaks.length - 1] : null;
      const start = new Date(checkInTime).getTime();
      const breakStart = lastBreak?.startTime ? new Date(lastBreak.startTime).getTime() : Date.now();
      const tick = () => {
        const breakElapsed = Math.max(0, Math.floor((Date.now() - breakStart) / 1000));
        const isLunch = (lastBreak?.type === "Lunch" || lastBreak?.breakType === "Lunch");
        const curLunch = isLunch ? ls + breakElapsed : ls;
        const curOther = !isLunch ? os + breakElapsed : os;
        const elapsed = Math.floor((Date.now() - start) / 1000);
        setWorkSeconds(Math.max(0, elapsed - (curLunch + curOther)));
        setLunchSeconds(curLunch);
        setBreakSeconds(curOther);
      };
      tick();
      timerRef.current = setInterval(tick, 1000);
    } else if (status === "Checked Out") {
      setWorkSeconds(statusRecord.totalWorkSeconds || 0);
      setLunchSeconds(ls);
      setBreakSeconds(os);
    } else {
      setWorkSeconds(0);
      setLunchSeconds(0);
      setBreakSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [statusRecord]);

  const getDevice = () => {
    const ua = navigator.userAgent;
    const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iOS" : /Win/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "MacOS" : "Linux";
    const br = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Browser";
    return `${os} (${br})`;
  };
  const getLoc = () => new Promise((resolve) => {
    try {
      if (!navigator?.geolocation) {
        return resolve({ latitude: null, longitude: null, address: "Device Location" });
      }
      let resolved = false;
      const fallbackTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({ latitude: null, longitude: null, address: "Device Location" });
        }
      }, 500);

      navigator.geolocation.getCurrentPosition(
        (p) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(fallbackTimer);
            resolve({
              latitude: p.coords.latitude,
              longitude: p.coords.longitude,
              address: `${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`,
            });
          }
        },
        () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(fallbackTimer);
            resolve({ latitude: null, longitude: null, address: "Device Location" });
          }
        },
        { enableHighAccuracy: false, timeout: 500, maximumAge: 60000 }
      );
    } catch (e) {
      resolve({ latitude: null, longitude: null, address: "Device Location" });
    }
  });

  const apiCall = async (fn) => {
    setLoading(true);
    setErrorMsg("");
    try {
      await fn();
    } catch (err) {
      console.error("Action error:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = () => apiCall(async () => {
    const loc = { latitude: null, longitude: null, address: "Web Portal", device: getDevice() };
    const res = await apiClient.post(`/employee/check-in`, { location: loc });
    const rec = res.data?.record || res.data?.attendance;
    if (rec) setStatusRecord(rec);
    setSuccessMsg(res.data?.message || "Checked in successfully");
    await fetchAll(true);
  });

  const handleCheckOut = () => apiCall(async () => {
    try {
      const wlRes = await apiClient.get("/employee/worklog/today");
      const hasWorkLog = Boolean(wlRes.data?.log?.logText && wlRes.data.log.logText.trim().length > 0);
      if (!hasWorkLog && !checkOutNote.trim()) {
        setErrorMsg("⚠️ Please enter and save Today's Work Log before checking out! (Work log is mandatory)");
        const wlEl = document.getElementById("daily-worklog-section");
        if (wlEl) wlEl.scrollIntoView({ behavior: "smooth" });
        return;
      }
    } catch {
      // Proceed to let backend enforce validation
    }

    const loc = { latitude: null, longitude: null, address: "Web Portal", device: getDevice() };
    const res = await apiClient.post(`/employee/check-out`, { location: loc, checkOutNote });
    const rec = res.data?.record || res.data?.attendance;
    if (rec) setStatusRecord(rec);
    setSuccessMsg(res.data?.message || "Checked out successfully");
    setCheckOutNote("");
    await fetchAll(true);
  });

  const handleBreakStart = (type = "Break") => apiCall(async () => {
    const res = await apiClient.post(`/employee/break/start`, { breakType: type });
    const rec = res.data?.record || res.data?.attendance;
    if (rec) setStatusRecord(rec);
    setSuccessMsg(res.data?.message || "Break started. Work timer paused.");
    fetchAll(true);
  });

  const handleBreakEnd = () => apiCall(async () => {
    const res = await apiClient.post(`/employee/break/end`);
    const rec = res.data?.record || res.data?.attendance;
    if (rec) setStatusRecord(rec);
    setSuccessMsg(res.data?.message || "Break ended. Work timer resumed.");
    fetchAll(true);
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
      const payload = {
        ...leaveForm,
        leaveType: leaveForm.leaveType || "Casual Leave",
      };
      const res = await apiClient.post(`/employee/leaves`, payload);
      setSuccessMsg(res.data.message);
      setLeaveForm({ leaveType: "Casual Leave", startDate: "", endDate: "", reason: "", document: "" });
      setFileLabel("");
      fetchAll();
    });
  };

  const status = initialLoading && !statusRecord ? "Syncing..." : (statusRecord?.status || "Absent");
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

  const statusColor = {
    Active: "bg-emerald-500", "On Break": "bg-sky-500",
    "Checked Out": "bg-slate-400", Absent: "bg-rose-500",
    "Weekly Off": "bg-slate-400", Holiday: "bg-indigo-500",
    "Syncing...": "bg-sky-500 animate-pulse",
  }[status] || "bg-slate-400";

  return (
    <>
      <EmployeeLayout
        user={currentUser}
        view={view}
        setView={setView}
        onLogout={onLogout}
        token={token}
        status={status}
        statusColor={statusColor}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        liveAdminNotification={liveAdminNotification}
        setLiveAdminNotification={setLiveAdminNotification}
        todayHoliday={todayHoliday}
        isHolidayToday={isHolidayToday}
        announcements={announcements}
        errorMsg={errorMsg}
        successMsg={successMsg}
      >
        {}
          {(view === "home" || view === "tracker") && (
            <EmpHomeOverview
              user={currentUser}
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
              complianceInfo={complianceInfo}
              setView={setView}
              handleCheckIn={handleCheckIn}
              handleCheckOut={handleCheckOut}
              handleBreakStart={handleBreakStart}
              handleBreakEnd={handleBreakEnd}
              isOnBreak={isOnBreak}
              isActive={isActive}
              isCheckedOut={isCheckedOut}
              overLimit={overLimit}
              monthlyData={monthlyData}
              loading={loading}
              isHolidayToday={isHolidayToday}
              todayHoliday={todayHoliday}
              isWeeklyOffToday={isWeeklyOffToday}
              weeklyOffReason={weeklyOffReason}
              errorMsg={errorMsg}
              successMsg={successMsg}
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
              employeeProfile={employeeProfile}
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
              handleBreakStart={handleBreakStart}
              handleBreakEnd={handleBreakEnd}
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
          {(view === "leaves" || view === "apply-leave" || view === "leave-history") && (
            <LeaveManagementSection
              leaveBalance={leaveBalance}
              leaveForm={leaveForm}
              setLeaveForm={setLeaveForm}
              handleLeaveSubmit={handleLeaveSubmit}
              handleLeaveFile={handleLeaveFile}
              fileLabel={fileLabel}
              loading={loading}
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
          {(view === "profile-docs" || view === "profile") && (
            <EmployeeProfileDocsTab
              user={currentUser}
              token={token}
              onProfileUpdate={(img) => {
                if (img) handleProfileImageUpdate(img);
                fetchProfile();
              }}
            />
          )}
          {view === "expenses" && (
            <EmployeeExpensesTab user={currentUser} token={token} />
          )}
          {view === "meetings" && (
            <EmployeeMeetingsTab token={token} initialMeetings={todayMeetings} />
          )}
      </EmployeeLayout>

      <DocPreviewModal previewDoc={previewDoc} onClose={() => setPreviewDoc(null)} />
    </>
  );
}
