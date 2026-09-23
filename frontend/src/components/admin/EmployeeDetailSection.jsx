import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Eye,
  Phone,
  MapPin,
  HeartHandshake,
  FileText,
  UploadCloud,
  Trash2,
  ExternalLink,
  Plus,
  Save,
  Check,
  CheckCircle,
  XCircle,
  Clock,
  X,
  FolderLock,
  Calendar as CalendarIcon,
  Briefcase,
  Building,
  Award,
} from "lucide-react";
import { apiClient } from "../../services/apiClient.js";
import { EmployeeIdBadge } from "../common/ImmiGoLogo.jsx";

const formatHHMM = (val) => {
  if (!val) return '';
  if (typeof val === 'string' && /^\d{2}:\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const formatFileUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const apiBase = (apiClient.defaults?.baseURL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
  return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function EmployeeDetailSection({
  employeeHistory,
  employeeHistoryLoading,
  handleGoBack,
  employeeDetailView,
  setEmployeeDetailView,
  calendarMonth,
  calendarYear,
  setCalendarMonth,
  setCalendarYear,
  detailFromDate,
  detailToDate,
  setDetailFromDate,
  setDetailToDate,
  selectedEmployeeId,
  fetchEmployeeHistoryById,
  setPastAttendanceModal,
  formatTime,
  formatDate,
  openTextModal,
  holidays = []
}) {
  const emp = employeeHistory?.employee;
  const attendance = Array.isArray(employeeHistory?.attendanceHistory)
    ? employeeHistory.attendanceHistory
    : (Array.isArray(employeeHistory) ? employeeHistory : []);
  const leaves = Array.isArray(employeeHistory?.leaveHistory)
    ? employeeHistory.leaveHistory
    : [];
  const safeHolidays = Array.isArray(holidays) ? holidays : [];

  // Sub tab state
  const [activeTab, setActiveTab] = useState("attendance"); // attendance | documents | leaves

  // Document Vault state
  const [adminDocModalOpen, setAdminDocModalOpen] = useState(false);
  const [adminDocForm, setAdminDocForm] = useState({
    name: "",
    type: "Other",
    url: "",
  });
  const [adminDocLabel, setAdminDocLabel] = useState("");
  const [adminDocUploading, setAdminDocUploading] = useState(false);
  const [previewDocModal, setPreviewDocModal] = useState(null);

  const joiningDateStr = (() => {
    if (!emp?.joiningDate) return null;
    try {
      const d = new Date(emp.joiningDate);
      if (isNaN(d.getTime())) return null;
      return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
    } catch {
      return null;
    }
  })();

  const fmtDur = s => {
    if (!s || s === 0) return "—";
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  };

  const validAttendance = attendance.filter(a => a && (!joiningDateStr || a.date >= joiningDateStr));
  const presentCount = validAttendance.filter(a => ["Present", "Active", "Checked Out", "On Break"].includes(a.status)).length;
  const absentCount = validAttendance.filter(a => a.status === "Absent").length;
  const halfDayCount = validAttendance.filter(a => a.halfSalaryDeduct).length;

  const postDojWorkingDays = (() => {
    let count = 0;
    const totalDays = new Date(calendarYear, calendarMonth, 0).getDate();
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (joiningDateStr && dateStr < joiningDateStr) continue;
      const dt = new Date(calendarYear, calendarMonth - 1, d);
      const dayOfWeek = dt.getDay();
      if (dayOfWeek === 0) continue;
      if (dayOfWeek === 6) {
        const satCount = Math.ceil(d / 7);
        if (satCount === 2 || satCount === 4) continue;
      }
      const isHoli = holidays.some(h => {
        if (!h || !h.date) return false;
        const hDate = typeof h.date === "string" ? h.date.split("T")[0] : new Date(h.date).toISOString().split("T")[0];
        return hDate === dateStr;
      });
      if (isHoli) continue;
      count++;
    }
    return count;
  })();

  const sColor = s => {
    if (s === "Checked Out") return "bg-slate-100 text-slate-700 border-slate-200";
    if (s === "Active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "On Break") return "bg-amber-50 text-amber-700 border-amber-200";
    if (s === "Absent") return "bg-rose-50 text-rose-700 border-rose-200";
    if (s === "On Leave") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-slate-50 text-slate-500 border-slate-200";
  };

  const renderCalendarView = () => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    const firstDayIndex = new Date(calendarYear, calendarMonth - 1, 1).getDay();
    const totalDays = new Date(calendarYear, calendarMonth, 0).getDate();

    const blanks = Array.from({ length: firstDayIndex }, () => null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const gridItems = [...blanks, ...days];

    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (calendarMonth === 1) {
                  setCalendarMonth(12);
                  setCalendarYear(calendarYear - 1);
                } else {
                  setCalendarMonth(calendarMonth - 1);
                }
              }}
              className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 cursor-pointer font-bold"
            >
              ◀
            </button>
            <span className="font-bold text-slate-800 text-sm w-36 text-center">
              {months[calendarMonth - 1]} {calendarYear}
            </span>
            <button
              onClick={() => {
                if (calendarMonth === 12) {
                  setCalendarMonth(1);
                  setCalendarYear(calendarYear + 1);
                } else {
                  setCalendarMonth(calendarMonth + 1);
                }
              }}
              className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 cursor-pointer font-bold"
            >
              ▶
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={calendarMonth}
              onChange={e => setCalendarMonth(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer text-slate-700"
            >
              {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={calendarYear}
              onChange={e => setCalendarYear(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer text-slate-700"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="text-center font-bold text-slate-500 text-[10px] sm:text-xs uppercase py-1">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {gridItems.map((day, idx) => {
            if (day === null) {
              return <div key={`blank-${idx}`} className="bg-slate-50/20 rounded-xl h-24 border border-slate-100/40"></div>;
            }

            const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const rec = attendance.find(a => a && a.date === dateStr);
            const holiday = safeHolidays.find(h => h && h.date === dateStr);

            const isBeforeJoining = joiningDateStr && dateStr < joiningDateStr;

            const dayOfWeek = new Date(calendarYear, calendarMonth - 1, day).getDay();
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;
            let isOffSaturday = false;
            if (isSaturday) {
              const satCount = Math.ceil(day / 7);
              if (satCount === 2 || satCount === 4) isOffSaturday = true;
            }
            const isWeekendOff = isSunday || isOffSaturday;

            let cardBg = "bg-white hover:bg-slate-50/50";
            let statusPill = null;
            let checkInFmt = null;
            let checkOutFmt = null;

            if (isBeforeJoining) {
              cardBg = "bg-slate-50/40 border border-slate-200/50 opacity-60";
              statusPill = (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-400">
                  N/A
                </span>
              );
            } else if (rec) {
              let statusText = rec.status;
              let pillBg = "bg-slate-100 text-slate-700 border-slate-200";

              if (rec.halfSalaryDeduct) {
                statusText = "Half Day";
                pillBg = "bg-amber-100 text-amber-800 border-amber-200";
                cardBg = "bg-amber-50/20 hover:bg-amber-50/40 border border-amber-200";
              } else if (rec.status === "Present" || rec.status === "Active" || rec.status === "Checked Out" || rec.status === "On Break") {
                statusText = "Present";
                pillBg = "bg-emerald-100 text-emerald-800 border-emerald-200";
                cardBg = "bg-emerald-50/10 hover:bg-emerald-50/30 border border-emerald-200/60";
              } else if (rec.status === "Holiday" || (holiday && rec.status === "Absent")) {
                statusText = "Holiday";
                pillBg = "bg-indigo-100 text-indigo-800 border-indigo-200";
                cardBg = "bg-indigo-50/10 hover:bg-indigo-50/30 border border-indigo-200/60";
              } else if (rec.status === "Weekly Off" || rec.status === "Weekend" || (isWeekendOff && rec.status === "Absent")) {
                statusText = "Off";
                pillBg = "bg-slate-200 text-slate-600 border-slate-300";
                cardBg = "bg-slate-50 hover:bg-slate-100/80 border border-slate-150";
              } else if (rec.status === "Absent") {
                pillBg = "bg-rose-100 text-rose-800 border-rose-200";
                cardBg = "bg-rose-50/10 hover:bg-rose-50/30 border border-rose-200/60";
              } else if (rec.status === "On Leave") {
                pillBg = "bg-blue-100 text-blue-800 border-blue-200";
                cardBg = "bg-blue-50/10 hover:bg-blue-50/30 border border-blue-200/60";
              }

              statusPill = (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${pillBg}`}>
                  {statusText}
                </span>
              );

              if (rec.checkInTime) checkInFmt = new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              if (rec.checkOutTime) checkOutFmt = new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (holiday) {
              cardBg = "bg-indigo-50/20 hover:bg-indigo-50/40 border border-indigo-100";
              statusPill = (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-100 text-indigo-800 border border-indigo-200" title={holiday.description}>
                  Holiday
                </span>
              );
            } else if (isWeekendOff) {
              cardBg = "bg-slate-50 hover:bg-slate-100/80 border border-slate-150";
              statusPill = (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-200 text-slate-500 border border-slate-300">
                  Off
                </span>
              );
            } else {
              cardBg = "bg-white hover:bg-slate-50 border border-dashed border-slate-200";
              statusPill = (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-50 text-slate-400">
                  No Log
                </span>
              );
            }

            return (
              <div
                key={`day-${day}`}
                onClick={() => {
                  if (isBeforeJoining) return;
                  let prefilled = {
                    date: dateStr,
                    status: rec ? (rec.halfSalaryDeduct ? "Half Day" : rec.status) : "Present",
                    checkInTime: rec?.checkInTime ? formatHHMM(rec.checkInTime) : "10:00",
                    checkOutTime: rec?.checkOutTime ? formatHHMM(rec.checkOutTime) : "19:00",
                    checkOutNote: rec?.checkOutNote || rec?.notes || "",
                    halfSalaryDeduct: rec?.halfSalaryDeduct || false,
                    isDateEditable: false
                  };
                  setPastAttendanceModal(prefilled);
                }}
                className={`border border-slate-200/80 rounded-xl sm:rounded-2xl h-16 sm:h-24 p-1.5 sm:p-2.5 flex flex-col justify-between text-left cursor-pointer transition-all ${cardBg}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs">{day}</span>
                  {statusPill}
                </div>
                <div className="flex flex-col gap-0.5">
                  {holiday && <span className="text-[9px] text-indigo-700 font-extrabold truncate w-full" title={holiday.title}>{holiday.title}</span>}
                  {checkInFmt && <span className="text-[9px] text-slate-500 font-semibold">IN: {checkInFmt}</span>}
                  {checkOutFmt && <span className="text-[9px] text-slate-500 font-semibold">OUT: {checkOutFmt}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleAdminFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert("File size exceeds 15MB limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAdminDocForm(prev => ({
        ...prev,
        url: reader.result,
        name: prev.name || file.name,
      }));
      setAdminDocLabel(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleAdminSubmitDoc = async (e) => {
    e.preventDefault();
    if (!adminDocForm.name || !adminDocForm.url) {
      alert("Please select a file and provide a document name.");
      return;
    }
    try {
      setAdminDocUploading(true);
      await apiClient.post(`/admin/employee/${emp._id}/documents`, adminDocForm);
      setAdminDocModalOpen(false);
      setAdminDocForm({ name: "", type: "Other", url: "" });
      setAdminDocLabel("");
      if (fetchEmployeeHistoryById && selectedEmployeeId) {
        fetchEmployeeHistoryById(selectedEmployeeId, detailFromDate, detailToDate);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to upload document");
    } finally {
      setAdminDocUploading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Are you sure you want to remove this employee document?")) return;
    try {
      await apiClient.delete(`/admin/employee/${emp._id}/documents/${docId}`);
      if (fetchEmployeeHistoryById && selectedEmployeeId) {
        fetchEmployeeHistoryById(selectedEmployeeId, detailFromDate, detailToDate);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete document");
    }
  };

  const [rejectDocModal, setRejectDocModal] = useState(null); // { docId, docName, note }
  const [reviewingDoc, setReviewingDoc] = useState(false);

  const handleReviewDoc = async (docId, status, verificationNote = "") => {
    try {
      setReviewingDoc(true);
      await apiClient.put(`/admin/employee/${emp._id}/documents/${docId}/review`, {
        status,
        verificationNote,
      });
      setRejectDocModal(null);
      if (fetchEmployeeHistoryById && selectedEmployeeId) {
        fetchEmployeeHistoryById(selectedEmployeeId, detailFromDate, detailToDate);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update document review status");
    } finally {
      setReviewingDoc(false);
    }
  };

  const safeEmpName = typeof emp?.name === 'string' ? emp.name : (emp?.name?.first ? `${emp.name.first} ${emp.name.last}` : String(emp?.name || "Employee"));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold cursor-pointer transition-colors" onClick={handleGoBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg> Back
        </button>
        <div><h2 className="text-xl font-black text-slate-800">Employee Profile & Management</h2><p className="text-xs text-slate-500">Profile, compliance documents, leave balance & attendance</p></div>
      </div>
      {employeeHistoryLoading ? (
        <div className="flex items-center justify-center py-20"><div className="flex flex-col items-center gap-3"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div><span className="text-slate-500 text-sm font-semibold">Loading employee profile...</span></div></div>
      ) : !emp ? (
        <div className="text-center py-16 text-slate-500 font-semibold">Employee not found.</div>
      ) : (
        <>
          {/* Main Profile & Contact Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                {emp.profileImage ? (
                  <img src={formatFileUrl(emp.profileImage)} alt={safeEmpName} className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-sm shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-3xl shadow-md shrink-0">
                    {safeEmpName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{safeEmpName}</h3>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${emp.status === "inactive" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                      {emp.status ? emp.status.toUpperCase() : "ACTIVE"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 font-medium">
                    <EmployeeIdBadge id={emp.employeeId} />
                    <span>&bull;</span>
                    <span className="text-slate-500">{emp.department || "General Department"}</span>
                    <span>&bull;</span>
                    <span className="font-semibold text-slate-800">{emp.designation || "Employee"}</span>
                  </div>
                  <div className="text-sm text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                    <p><span className="text-slate-400 font-medium">Work Email:</span> <span className="font-semibold text-slate-700">{emp.email}</span></p>
                    {emp.personalEmail && (
                      <p><span className="text-slate-400 font-medium">Personal Email:</span> <span className="font-semibold text-slate-700">{emp.personalEmail}</span></p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details & Joining Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CalendarIcon size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[10px]">Joining Date</span>
                  <span className="font-bold text-slate-800">{emp.joiningDate ? formatDate(emp.joiningDate) : "Not specified"}</span>
                  {emp.leavingDate && <span className="text-rose-600 block font-semibold text-[11px]">Left: {formatDate(emp.leavingDate)}</span>}
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <Phone size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[10px]">Contact Phone</span>
                  <span className="font-bold text-slate-800">{emp.phone || "No phone added"}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <HeartHandshake size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[10px]">Emergency Contact</span>
                  <span className="font-bold text-slate-800">
                    {emp.emergencyContact?.name ? `${emp.emergencyContact.name} (${emp.emergencyContact.relation || "Contact"})` : "Not provided"}
                  </span>
                  {emp.emergencyContact?.phone && <span className="text-slate-500 block font-semibold text-[11px]">{emp.emergencyContact.phone}</span>}
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <MapPin size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[10px]">Residential Address</span>
                  <span className="font-bold text-slate-800 line-clamp-2">{emp.address || "Address not provided"}</span>
                </div>
              </div>
            </div>

            {/* Career, Experience & Compensation Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <Building size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[10px]">Previous Company</span>
                  <span className="font-bold text-slate-800">{emp.previousCompany || "Fresher / Not specified"}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <Award size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[10px]">Total Experience</span>
                  <span className="font-bold text-slate-800">{emp.experience || "Not specified"}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <Briefcase size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[10px]">Previous Package</span>
                  <span className="font-bold text-slate-800">{emp.previousPackage || "N/A"}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <Briefcase size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[10px]">Current Package / CTC</span>
                  <span className="font-bold text-emerald-700 font-black">{emp.currentPackage || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
              <div className="flex flex-col items-center bg-blue-50 rounded-xl py-3 border border-blue-100">
                <span className="text-2xl font-black text-blue-700">{postDojWorkingDays}</span>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mt-0.5">Working Days</span>
              </div>
              <div className="flex flex-col items-center bg-emerald-50 rounded-xl py-3 border border-emerald-100"><span className="text-2xl font-black text-emerald-600">{presentCount}</span><span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mt-0.5">Full Days</span></div>
              <div className="flex flex-col items-center bg-amber-50 rounded-xl py-3 border border-amber-100"><span className="text-2xl font-black text-amber-600">{halfDayCount}</span><span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mt-0.5">Half Days</span></div>
              <div className="flex flex-col items-center bg-rose-50 rounded-xl py-3 border border-rose-100"><span className="text-2xl font-black text-rose-600">{absentCount}</span><span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide mt-0.5">Absent</span></div>
            </div>
          </div>

          {/* Sub-Tabs Selector */}
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                activeTab === "attendance"
                  ? "border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <CalendarIcon size={16} /> Attendance History
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                activeTab === "documents"
                  ? "border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FolderLock size={16} /> Corporate Document Vault
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-700">
                {emp.documents?.length || 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("leaves")}
              className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                activeTab === "leaves"
                  ? "border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Briefcase size={16} /> Leave Applications
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-700">
                {leaves.length}
              </span>
            </button>
          </div>

          {/* TAB 1: ATTENDANCE HISTORY */}
          {activeTab === "attendance" && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-black text-slate-800">Attendance Log</h4>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/40">
                    <button
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${employeeDetailView === "table" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
                      onClick={() => setEmployeeDetailView("table")}
                    >
                      📋 Table
                    </button>
                    <button
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${employeeDetailView === "calendar" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
                      onClick={() => setEmployeeDetailView("calendar")}
                    >
                      📅 Calendar
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {employeeDetailView === "table" && (
                    <>
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5"><DatePicker selected={detailFromDate} onChange={d => setDetailFromDate(d)} placeholderText="From date" dateFormat="dd/MM/yyyy" maxDate={new Date()} className="text-xs font-semibold text-slate-700 bg-transparent outline-none w-20 cursor-pointer" /></div>
                      <span className="text-slate-500 text-xs">→</span>
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5"><DatePicker selected={detailToDate} onChange={d => setDetailToDate(d)} placeholderText="To date" dateFormat="dd/MM/yyyy" maxDate={new Date()} className="text-xs font-semibold text-slate-700 bg-transparent outline-none w-20 cursor-pointer" /></div>
                      <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs" onClick={() => fetchEmployeeHistoryById(selectedEmployeeId, detailFromDate, detailToDate)}>Filter</button>
                      {(detailFromDate || detailToDate) && <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer" onClick={() => { setDetailFromDate(null); setDetailToDate(null); fetchEmployeeHistoryById(selectedEmployeeId, null, null); }}>Clear</button>}
                    </>
                  )}

                  <button
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    onClick={() => {
                      const today = new Date().toISOString().split("T")[0];
                      const initialDate = joiningDateStr && today < joiningDateStr ? joiningDateStr : today;
                      setPastAttendanceModal({
                        date: initialDate,
                        status: "Present",
                        checkInTime: "10:00",
                        checkOutTime: "19:00",
                        checkOutNote: "",
                        halfSalaryDeduct: false,
                        isDateEditable: true
                      });
                    }}
                  >
                    ➕ Add Past Attendance
                  </button>
                </div>
              </div>

              {employeeDetailView === "table" ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead><tr>{["Date", "Status", "Check In", "Check Out", "Work Time", "Break", "Half Day?", "Checkout Note"].map(h => <th key={h} className="px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100 whitespace-nowrap">{h}</th>)}</tr></thead>
                    <tbody>
                      {attendance.map((a, idx) => {
                        const isBeforeJoining = joiningDateStr && a.date < joiningDateStr;
                        let workSec = a.totalWorkSeconds || 0;
                        if (!workSec && a.checkInTime && a.checkOutTime) {
                          const diff = Math.floor((new Date(a.checkOutTime).getTime() - new Date(a.checkInTime).getTime()) / 1000);
                          workSec = Math.max(0, diff - (a.totalBreakSeconds || 0));
                        }
                        const isHalfDay = a.halfSalaryDeduct || (workSec > 0 && workSec < 28800);
                        const hasTimes = Boolean(a.checkInTime && a.checkOutTime);

                        if (isBeforeJoining) {
                          return (
                            <tr key={idx} className="bg-slate-50/40 border-b border-slate-100 last:border-0 opacity-60">
                              <td className="px-4 py-3.5 text-sm font-semibold text-slate-500 whitespace-nowrap">{a.date}</td>
                              <td className="px-4 py-3.5">
                                <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-lg border bg-slate-100 text-slate-500 border-slate-200">
                                  Pre-Joining (Joined {emp.joiningDate ? formatDate(emp.joiningDate) : ""})
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-slate-400 text-xs">—</td>
                              <td className="px-4 py-3.5 text-slate-400 text-xs">—</td>
                              <td className="px-4 py-3.5 text-slate-400 text-xs">—</td>
                              <td className="px-4 py-3.5 text-slate-400 text-xs">—</td>
                              <td className="px-4 py-3.5 text-slate-400 text-xs">—</td>
                              <td className="px-4 py-3.5 text-slate-400 text-xs">—</td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={idx} className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                            <td className="px-4 py-3.5 text-sm font-bold text-slate-700 whitespace-nowrap">{a.date}</td>
                            <td className="px-4 py-3.5"><span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-lg border ${sColor(a.status)}`}>{a.status}</span></td>
                            <td className="px-4 py-3.5 text-xs font-semibold text-slate-600 whitespace-nowrap">{a.checkInTime ? formatTime(a.checkInTime) : <span className="text-slate-300">—</span>}</td>
                            <td className="px-4 py-3.5 text-xs font-semibold text-slate-600 whitespace-nowrap">{a.checkOutTime ? formatTime(a.checkOutTime) : <span className="text-slate-300">—</span>}</td>
                            <td className="px-4 py-3.5"><span className={`text-xs font-black ${workSec > 0 && workSec < 28800 ? "text-amber-600 font-bold" : "text-slate-700"}`}>{fmtDur(workSec)}</span></td>
                            <td className="px-4 py-3.5 text-xs text-slate-500 font-semibold">{fmtDur(a.totalBreakSeconds)}</td>
                            <td className="px-4 py-3.5">
                              {hasTimes || ["Present", "Checked Out", "Active"].includes(a.status) ? (
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${isHalfDay ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"}`}>
                                  {isHalfDay ? "Half Day (< 8h)" : "Full Day (8+ h)"}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 max-w-[180px]">
                              {a.checkOutNote ? (
                                <div className="flex items-center gap-1.5 justify-between">
                                  <span className="text-xs text-slate-700 truncate bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-lg max-w-[110px]" title={a.checkOutNote}>
                                    {a.checkOutNote}
                                  </span>
                                  <button
                                    onClick={() => openTextModal("Checkout Note", a.checkOutNote)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition shrink-0 cursor-pointer"
                                    title="View full note"
                                  >
                                    <Eye size={14} />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {attendance.length === 0 && <tr><td colSpan="8"><div className="text-center py-10 text-slate-500 font-semibold text-sm">No attendance records for this period.</div></td></tr>}
                    </tbody>
                  </table>
                </div>
              ) : (
                renderCalendarView()
              )}
            </div>
          )}

          {/* TAB 2: CORPORATE DOCUMENT VAULT */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <FolderLock size={18} className="text-blue-600" />
                    Employee Document Vault & Verification
                  </h4>
                  <p className="text-xs text-slate-500">Official onboarding contracts, compliance IDs, educational certificates & salary letters</p>
                </div>
                <button
                  onClick={() => setAdminDocModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition"
                >
                  <Plus size={15} /> Upload Official Document
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr>
                        {["Document Name", "Category / Type", "Uploaded At", "Verification", "Actions"].map(h => (
                          <th key={h} className="px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {emp.documents && emp.documents.length > 0 ? (
                        emp.documents.map((doc) => (
                          <tr key={doc._id} className="hover:bg-slate-50/40 transition border-b border-slate-100 last:border-0">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                                  <FileText size={16} />
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-slate-800 block">{doc.name}</span>
                                  <span className="text-[10px] text-slate-400">ID: {doc._id?.slice(-6)}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                {doc.type || "Other"}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                              {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="space-y-1">
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                                    doc.status === "Verified"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : doc.status === "Rejected"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  {doc.status === "Verified" ? (
                                    <CheckCircle size={12} />
                                  ) : doc.status === "Rejected" ? (
                                    <XCircle size={12} />
                                  ) : (
                                    <Clock size={12} />
                                  )}
                                  {doc.status || "Submitted"}
                                </span>
                                {doc.verificationNote && (
                                  <div
                                    className="text-[10px] text-slate-500 font-medium max-w-[180px] truncate"
                                    title={doc.verificationNote}
                                  >
                                    Note: {doc.verificationNote}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setPreviewDocModal(doc)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                                >
                                  <Eye size={13} /> View
                                </button>
                                {doc.status !== "Verified" && (
                                  <button
                                    type="button"
                                    onClick={() => handleReviewDoc(doc._id, "Verified")}
                                    disabled={reviewingDoc}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs disabled:opacity-50"
                                    title="Verify & Approve Document"
                                  >
                                    <Check size={12} /> Approve
                                  </button>
                                )}
                                {doc.status !== "Rejected" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setRejectDocModal({
                                        docId: doc._id,
                                        docName: doc.name,
                                        note: "",
                                      })
                                    }
                                    disabled={reviewingDoc}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                                    title="Reject Document"
                                  >
                                    <X size={12} /> Reject
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDoc(doc._id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Delete document"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">
                            <div className="text-center py-12 text-slate-400">
                              <FolderLock size={32} className="mx-auto text-slate-300 mb-2" />
                              <p className="text-sm font-semibold text-slate-600">No documents uploaded yet for this employee</p>
                              <p className="text-xs text-slate-400 mt-1">Upload appointment letters, contracts, or compliance IDs</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LEAVE HISTORY */}
          {activeTab === "leaves" && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-800">Leave History <span className="text-slate-500 font-semibold text-xs">({leaves.length} applications)</span></h4>
                  <p className="text-xs text-slate-400">Current leave balance: <strong className="text-blue-600">{emp.leaveBalance || 0} days remaining</strong></p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead><tr>{["Type", "Start", "End", "Days", "Reason", "Status", "Admin Remark"].map(h => <th key={h} className="px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100 whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>
                    {leaves.map(l => (
                      <tr key={l._id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3.5"><span className="text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-lg">{l.leaveType || "Casual"}</span></td>
                        <td className="px-4 py-3.5 text-sm text-slate-700 font-semibold whitespace-nowrap">{formatDate(l.startDate)}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-700 font-semibold whitespace-nowrap">{formatDate(l.endDate)}</td>
                        <td className="px-4 py-3.5 text-sm font-black text-slate-800 text-center">{l.totalDays}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-600 max-w-[200px]"><span className="line-clamp-2 cursor-pointer text-green-700 hover:underline" onClick={() => openTextModal("Leave Reason", l.reason)}>{l.reason}</span></td>
                        <td className="px-4 py-3.5"><span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-lg border ${l.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : l.status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{l.status}</span></td>
                        <td className="px-4 py-3.5 text-xs max-w-[160px]">{l.adminRemark ? <span className={`block px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer ${l.status === "Rejected" ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-600"}`} onClick={() => openTextModal("Admin Remark", l.adminRemark)}>{l.adminRemark}</span> : <span className="text-slate-300">—</span>}</td>
                      </tr>
                    ))}
                    {leaves.length === 0 && <tr><td colSpan="7"><div className="text-center py-10 text-slate-500 font-semibold text-sm">No leave applications found.</div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Admin Upload Document Modal */}
          {adminDocModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <UploadCloud size={18} className="text-blue-600" />
                    Upload Employee Document
                  </h3>
                  <button onClick={() => setAdminDocModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
                </div>

                <form onSubmit={handleAdminSubmitDoc} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Document Category</label>
                    <select
                      value={adminDocForm.type}
                      onChange={(e) => setAdminDocForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                    >
                      <option value="Resume/CV">Resume / CV</option>
                      <option value="Aadhaar / National ID">Aadhaar / National ID</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Offer Letter">Offer Letter</option>
                      <option value="Appointment Letter">Appointment Letter</option>
                      <option value="Salary Slip">Salary Slip</option>
                      <option value="Experience / Relieving Letter">Experience / Relieving Letter</option>
                      <option value="Degree / Marksheet">Degree / Marksheet</option>
                      <option value="Bank Account Proof / Cancelled Cheque">Bank Proof / Cancelled Cheque</option>
                      <option value="Address Proof">Address Proof</option>
                      <option value="NDA / Non-Disclosure Agreement">NDA / Agreement</option>
                      <option value="Other">Other Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Document Title / Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Appointment Letter signed"
                      value={adminDocForm.name}
                      onChange={(e) => setAdminDocForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Select File (PDF, Image, Doc)</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={handleAdminFileUpload}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {adminDocLabel && <p className="text-xs text-emerald-600 font-semibold mt-1">Selected: {adminDocLabel}</p>}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setAdminDocModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={adminDocUploading}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <UploadCloud size={14} /> {adminDocUploading ? "Uploading..." : "Save to Vault"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Document Preview Modal */}
          {previewDocModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-800">{previewDocModal.name}</h3>
                    <span className="text-xs text-blue-600 font-bold">{previewDocModal.type}</span>
                  </div>
                  <button onClick={() => setPreviewDocModal(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
                </div>

                <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-slate-50 rounded-xl">
                  {previewDocModal.url?.startsWith("data:image/") || /\.(png|jpe?g|webp|svg)$/i.test(previewDocModal.url || "") ? (
                    <img src={formatFileUrl(previewDocModal.url)} alt={previewDocModal.name} className="max-h-[60vh] object-contain rounded-lg" />
                  ) : (
                    <div className="text-center py-10 space-y-3">
                      <FileText size={48} className="mx-auto text-blue-500" />
                      <p className="text-sm font-semibold text-slate-700">Document ready for review</p>
                      <a
                        href={formatFileUrl(previewDocModal.url)}
                        target="_blank"
                        rel="noreferrer"
                        download={previewDocModal.name}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                      >
                        <ExternalLink size={14} /> Download / Open Document
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setPreviewDocModal(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Document Rejection Modal */}
          {rejectDocModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                      <XCircle size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800">Reject Compliance Document</h3>
                      <p className="text-xs text-slate-500">{rejectDocModal.docName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRejectDocModal(null)}
                    className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Reason for Rejection *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Blurred photocopy, missing signature, expired document, or mismatched name..."
                    value={rejectDocModal.note}
                    onChange={(e) =>
                      setRejectDocModal((prev) => ({ ...prev, note: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:border-rose-500 focus:bg-white resize-none"
                  />
                  <p className="text-[11px] text-slate-400">
                    The employee will receive an instant notification with this reason and an option to re-upload.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRejectDocModal(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={reviewingDoc}
                    onClick={() =>
                      handleReviewDoc(
                        rejectDocModal.docId,
                        "Rejected",
                        rejectDocModal.note || "Document rejected by HR, please re-upload a clear copy."
                      )
                    }
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {reviewingDoc ? "Rejecting..." : "Confirm Rejection"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
