import { useState, useEffect, useMemo } from "react";
import apiClient from "../../../services/apiClient.js";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Users,
  User,
  Plus,
  Link,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  CheckCircle2,
  Send,
  X,
  Sparkles,
} from "lucide-react";

export default function CalendarMeetings() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("calendar"); // "calendar" | "list"
  const [meetings, setMeetings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [filterType, setFilterType] = useState("all"); // "all" | "upcoming" | "today" | "past"

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [selectedDayMeetings, setSelectedDayMeetings] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Form State
  const initialFormState = {
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "11:00",
    endTime: "12:00",
    meetingLink: "",
    platform: "Google Meet",
    targetType: "ALL", // "ALL" | "SPECIFIC"
    targetEmployees: [],
  };
  const [formData, setFormData] = useState(initialFormState);
  const [empSearch, setEmpSearch] = useState("");

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  // Fetch Meetings
  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/meetings");
      setMeetings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load meetings:", err);
      showFeedback("error", err.response?.data?.message || "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Employees for Target Selection
  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get("/admin/employee/list");
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load employees:", err);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchEmployees();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 5000);
  };

  // Calendar Helpers
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered Meetings
  const todayStr = new Date().toISOString().split("T")[0];

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (filterType === "today") return m.date === todayStr;
      if (filterType === "upcoming") return m.date >= todayStr;
      if (filterType === "past") return m.date < todayStr;
      return true;
    });
  }, [meetings, filterType, todayStr]);

  // Open Create Modal
  const handleOpenCreateModal = (prefilledDate = null) => {
    const today = new Date().toISOString().split("T")[0];
    const targetDate = prefilledDate && prefilledDate < today ? today : (prefilledDate || today);
    setEditingMeeting(null);
    setFormData({
      ...initialFormState,
      date: targetDate,
    });
    setEmpSearch("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title || "",
      description: meeting.description || "",
      date: meeting.date || "",
      startTime: meeting.startTime || "10:00",
      endTime: meeting.endTime || "11:00",
      meetingLink: meeting.meetingLink || "",
      platform: meeting.platform || "Google Meet",
      targetType: meeting.targetType || "ALL",
      targetEmployees: Array.isArray(meeting.targetEmployees)
        ? meeting.targetEmployees.map((e) => (typeof e === "object" ? e._id : e))
        : [],
    });
    setEmpSearch("");
    setIsModalOpen(true);
  };

  // Submit Meeting (Create or Update)
  const handleSubmitMeeting = async (e) => {
    e.preventDefault();

    const today = new Date().toISOString().split("T")[0];
    if (formData.date < today) {
      showFeedback("error", "Meetings cannot be scheduled in the past. Date must be today or a future date.");
      return;
    }

    if (!formData.title.trim()) {
      showFeedback("error", "Please provide a meeting title");
      return;
    }
    if (!formData.meetingLink.trim()) {
      showFeedback("error", "Please provide a valid meeting link");
      return;
    }
    if (formData.targetType === "SPECIFIC" && formData.targetEmployees.length === 0) {
      showFeedback("error", "Please select at least one employee for specific meeting");
      return;
    }

    setActionLoading(true);
    try {
      if (editingMeeting) {
        await apiClient.put(`/admin/meetings/${editingMeeting._id || editingMeeting.id}`, formData);
        showFeedback("success", "Meeting updated and notifications sent to participants!");
      } else {
        await apiClient.post("/admin/meetings", formData);
        showFeedback("success", "Meeting scheduled and notifications dispatched immediately!");
      }
      setIsModalOpen(false);
      fetchMeetings();
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to save meeting");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Meeting
  const handleDeleteMeeting = async (id, title) => {
    if (!window.confirm(`Are you sure you want to cancel & delete the meeting "${title}"? A cancellation alert will be sent.`)) {
      return;
    }
    try {
      await apiClient.delete(`/admin/meetings/${id}`);
      showFeedback("success", "Meeting deleted and cancellation notice sent.");
      fetchMeetings();
      if (selectedDayMeetings) {
        setSelectedDayMeetings((prev) => (prev ? prev.filter((m) => (m._id || m.id) !== id) : null));
      }
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to delete meeting");
    }
  };

  const handleCopyLink = (link, id) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleEmployeeSelection = (empId) => {
    setFormData((prev) => {
      const exists = prev.targetEmployees.includes(empId);
      return {
        ...prev,
        targetEmployees: exists
          ? prev.targetEmployees.filter((id) => id !== empId)
          : [...prev.targetEmployees, empId],
      };
    });
  };

  const filteredEmployeesForSelect = useMemo(() => {
    if (!empSearch.trim()) return employees;
    const q = empSearch.toLowerCase();
    return employees.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.employeeId?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q)
    );
  }, [employees, empSearch]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <CalendarIcon size={20} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Company Calendar & Meetings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Schedule meetings, paste meeting links (Google Meet, Zoom, etc.), and automatically notify all or specific employees directly on their dashboard.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "calendar" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "list" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              List View
            </button>
          </div>

          <button
            onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold border ${
            feedback.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {feedback.type === "error" ? (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === "calendar" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Calendar Header Controls */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-800">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <button
                onClick={handleToday}
                className="text-[11px] px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-md font-bold cursor-pointer"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Days Grid Header */}
          <div className="grid grid-cols-7 border-b-2 border-slate-300 text-center py-2 bg-slate-100 text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-300" style={{border: "1px solid #cbd5e1"}}>
            {/* Blank cells for offset */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[72px] bg-slate-50 p-1 border-r border-slate-300" />
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(
                dayNum
              ).padStart(2, "0")}`;
              const isToday = dateStr === todayStr;

              // Find meetings on this date
              const dayMeetings = meetings.filter((m) => m.date === dateStr);

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`min-h-[72px] p-1.5 relative flex flex-col border-r border-slate-300 transition-colors hover:bg-blue-50/30 ${
                    isToday ? "bg-indigo-50" : "bg-white"
                  }`}
                >
                  {/* Day number row */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[12px] font-extrabold inline-flex items-center justify-center w-5 h-5 rounded-full ${
                        isToday
                          ? "bg-indigo-600 text-white"
                          : "text-slate-900"
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Schedule + button: only for today or future dates */}
                    {dateStr >= todayStr ? (
                      <button
                        onClick={() => handleOpenCreateModal(dateStr)}
                        className="w-5 h-5 flex items-center justify-center text-slate-700 hover:bg-indigo-600 hover:text-white rounded cursor-pointer border border-slate-300 hover:border-indigo-600 transition-all"
                        title="Schedule meeting on this day"
                      >
                        <Plus size={11} />
                      </button>
                    ) : (
                      <span className="w-5 h-5 flex items-center justify-center text-slate-300 text-[10px]" title="Past date">
                        —
                      </span>
                    )}
                  </div>

                  {/* Meeting Chips */}
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {dayMeetings.slice(0, 2).map((m) => (
                      <div
                        key={m._id || m.id}
                        onClick={() => setSelectedDayMeetings(dayMeetings)}
                        className={`text-[10px] px-1.5 py-0.5 rounded leading-tight truncate cursor-pointer font-bold border ${
                          m.targetType === "ALL"
                            ? "bg-indigo-100 text-indigo-900 border-indigo-300"
                            : "bg-emerald-100 text-emerald-900 border-emerald-300"
                        }`}
                        title={`${m.title} (${m.startTime})`}
                      >
                        <span className="truncate">{m.title}</span>
                      </div>
                    ))}

                    {dayMeetings.length > 2 && (
                      <button
                        onClick={() => setSelectedDayMeetings(dayMeetings)}
                        className="text-[10px] text-slate-900 font-extrabold hover:text-indigo-700 hover:underline px-0.5 cursor-pointer"
                      >
                        +{dayMeetings.length - 2} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW / SCHEDULE CARDS */}
      {(viewMode === "list" || selectedDayMeetings) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Video size={18} className="text-indigo-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                {selectedDayMeetings ? "Meetings for Selected Date" : "Scheduled Meetings Directory"}
              </h2>
              {selectedDayMeetings && (
                <button
                  onClick={() => setSelectedDayMeetings(null)}
                  className="text-xs text-indigo-600 font-bold hover:underline ml-2 cursor-pointer"
                >
                  Show All
                </button>
              )}
            </div>

            {!selectedDayMeetings && (
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                {["all", "upcoming", "today", "past"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterType(tab)}
                    className={`px-3 py-1 rounded-lg capitalize cursor-pointer transition-all ${
                      filterType === tab ? "bg-white text-indigo-700 font-bold shadow-xs" : "hover:text-slate-900"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cards List */}
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading meetings...</p>
            </div>
          ) : (selectedDayMeetings || filteredMeetings).length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Video size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold text-slate-600">No scheduled meetings found</p>
              <p className="text-xs text-slate-400 mt-1">
                Click "+ Schedule Meeting" above to set up a meeting with a Google Meet or Zoom link.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(selectedDayMeetings || filteredMeetings).map((meeting) => {
                const isUpcoming = meeting.date >= todayStr;
                return (
                  <div
                    key={meeting._id || meeting.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between gap-3"
                  >
                    <div>
                      {/* Header tags */}
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200 tracking-wider">
                            {meeting.platform || "Google Meet"}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider ${
                              meeting.targetType === "ALL"
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : "bg-emerald-100 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {meeting.targetType === "ALL"
                              ? "👥 All Employees"
                              : `👤 ${meeting.targetEmployees?.length || 0} Employees`}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isUpcoming ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {isUpcoming ? "Upcoming" : "Past"}
                        </span>
                      </div>

                      {/* Title & Timing */}
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug mb-1">
                        {meeting.title}
                      </h3>
                      {meeting.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                          {meeting.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold mb-3">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon size={14} className="text-indigo-600" />
                          <span>{meeting.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-indigo-600" />
                          <span>
                            {meeting.startTime} {meeting.endTime ? `— ${meeting.endTime}` : ""}
                          </span>
                        </div>
                      </div>

                      {/* Specific employee names if any */}
                      {meeting.targetType === "SPECIFIC" && Array.isArray(meeting.targetEmployees) && (
                        <div className="mb-3">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Participants:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {meeting.targetEmployees.map((emp, i) => (
                              <span
                                key={i}
                                className="text-[11px] px-2 py-0.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700"
                              >
                                {typeof emp === "object" ? emp.name : emp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {/* Direct Join Button */}
                        <a
                          href={meeting.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                        >
                          <ExternalLink size={13} />
                          <span>Join Meeting</span>
                        </a>

                        {/* Copy Link */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(meeting.meetingLink, meeting._id || meeting.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                          title="Copy meeting link"
                        >
                          {copiedId === (meeting._id || meeting.id) ? (
                            <>
                              <Check size={13} className="text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(meeting)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Meeting"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMeeting(meeting._id || meeting.id, meeting.title)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Cancel / Delete Meeting"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SCHEDULE / EDIT MEETING MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Video size={18} className="text-indigo-600" />
                <h3 className="text-base font-black text-slate-800">
                  {editingMeeting ? "Edit Scheduled Meeting" : "Schedule New Meeting"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl cursor-pointer p-1"
              >
                ×
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitMeeting} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              {/* Meeting Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Performance & Growth Review"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Platform & Meeting Link */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white font-medium cursor-pointer"
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Microsoft Teams">MS Teams</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Meeting Link (URL) *
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      placeholder="https://meet.google.com/xyz-abcd-efg"
                      value={formData.meetingLink}
                      onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white font-medium"
                    />
                    <Link size={15} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Date, Start Time, End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>
              </div>

              {/* Target Audience: All vs Specific */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Notify & Invite Audience *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetType: "ALL" })}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                      formData.targetType === "ALL"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-900 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Users size={16} className={formData.targetType === "ALL" ? "text-indigo-600" : "text-slate-400"} />
                    <div>
                      <div className="text-xs">All Employees</div>
                      <div className="text-[10px] text-slate-500 font-normal">Company-wide notification</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, targetType: "SPECIFIC" })}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                      formData.targetType === "SPECIFIC"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-900 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <User size={16} className={formData.targetType === "SPECIFIC" ? "text-indigo-600" : "text-slate-400"} />
                    <div>
                      <div className="text-xs">Specific Employee(s)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Particular members only</div>
                    </div>
                  </button>
                </div>

                {/* Specific Employee Multi-Selection */}
                {formData.targetType === "SPECIFIC" && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700">
                        Selected: {formData.targetEmployees.length} employee(s)
                      </span>
                      {formData.targetEmployees.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, targetEmployees: [] })}
                          className="text-[11px] text-rose-600 font-semibold hover:underline cursor-pointer"
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search employee by name or ID..."
                        value={empSearch}
                        onChange={(e) => setEmpSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                      />
                      <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {filteredEmployeesForSelect.map((emp) => {
                        const isSelected = formData.targetEmployees.includes(emp._id || emp.id);
                        return (
                          <div
                            key={emp._id || emp.id}
                            onClick={() => toggleEmployeeSelection(emp._id || emp.id)}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-indigo-100/80 border border-indigo-200 text-indigo-950 font-bold"
                                : "bg-white hover:bg-slate-100 text-slate-700 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                                {emp.name?.[0]?.toUpperCase() || "E"}
                              </span>
                              <div>
                                <span>{emp.name}</span>
                                <span className="text-[10px] text-slate-400 ml-1 font-normal">
                                  ({emp.employeeId || emp.designation || "Emp"})
                                </span>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="accent-indigo-600 cursor-pointer"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Description / Agenda */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Agenda / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Points to discuss, preparations required..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={15} />
                  <span>
                    {actionLoading
                      ? "Saving & Notifying..."
                      : editingMeeting
                      ? "Update & Notify"
                      : "Schedule & Notify Employees"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
