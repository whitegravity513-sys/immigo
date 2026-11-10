import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  Video,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Edit3,
  RefreshCw,
  Award,
  CheckSquare,
  X,
  Building2,
  User,
  FileText,
  Radio,
} from "lucide-react";
import meetingService from "../../../services/meetingService.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import DynamicMeetingParticipantSelector from "./DynamicMeetingParticipantSelector.jsx";
import DateInput, { MonthYearSelector } from "../DateInput.jsx";

export default function MeetingCalendarSection({
  role = "ADMIN",
  assignedVendors = [],
  filterCandidateId = null,
  compact = false,
}) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayMeetingsCount: 0,
    upcomingMeetingsCount: 0,
    completedMeetingsCount: 0,
    cancelledMeetingsCount: 0,
    next7DaysMeetingsCount: 0,
    totalScheduledMeetings: 0,
    nextMeeting: null,
  });

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("day"); // Default: 'day' | 'week' | 'list' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedMeetingDetail, setSelectedMeetingDetail] = useState(null);
  const [meetingToReschedule, setMeetingToReschedule] = useState(null);
  const [meetingToCancel, setMeetingToCancel] = useState(null);
  const [meetingToRecordOutcome, setMeetingToRecordOutcome] = useState(null);

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    meetingType: "CANDIDATE_INTERVIEW",
    date: new Date().toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "11:00",
    meetingLink: "",
    platform: "Google Meet",
    candidateId: filterCandidateId || "",
    candidateName: "",
    candidateEmail: "",
    vendorId: assignedVendors.length === 1 ? assignedVendors[0] : "",
    vendorName: "",
    description: "",
  });

  const [targetMode, setTargetMode] = useState("SPECIFIC");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [candidateData, setCandidateData] = useState({
    candidateId: filterCandidateId || "",
    candidateName: "",
    candidateEmail: "",
    vendorId: assignedVendors.length === 1 ? assignedVendors[0] : "",
    vendorName: "",
    jobTitle: "",
    projectName: "",
  });

  const handleMeetingTypeChange = (newType) => {
    setSelectedParticipants([]);
    setTargetMode("SPECIFIC");
    const defaultTitles = {
      CANDIDATE_INTERVIEW: "Candidate Interview Round",
      VENDOR_DISCUSSION: "Vendor Agency Coordination Sync",
      INTERNAL_HR: "HR Operations & Recruitment Review",
      EMPLOYEE: "Employee One-on-One Discussion",
      GENERAL: "Company Operations Sync",
    };
    setScheduleForm((prev) => ({
      ...prev,
      meetingType: newType,
      title: defaultTitles[newType] || prev.title,
    }));
  };

  const handleAddParticipant = (p) => {
    setSelectedParticipants((prev) => {
      const next = [...prev, p];
      if (
        next.length === 1 &&
        (!scheduleForm.title ||
          scheduleForm.title.includes("Discussion") ||
          scheduleForm.title.includes("Sync") ||
          scheduleForm.title.includes("Round"))
      ) {
        setScheduleForm((f) => ({
          ...f,
          title: `Discussion with ${p.name || p.companyName}`,
        }));
      }
      return next;
    });
  };

  const handleRemoveParticipant = (id) => {
    setSelectedParticipants((prev) =>
      prev.filter((p) => (p.id || p.code || p.name) !== id)
    );
  };

  const handleCandidateChange = (cand) => {
    setCandidateData(cand);
    if (cand.candidateName) {
      setScheduleForm((f) => ({
        ...f,
        candidateId: cand.candidateId || "",
        candidateName: cand.candidateName || "",
        candidateEmail: cand.candidateEmail || "",
        vendorId: cand.vendorId || "",
        vendorName: cand.vendorName || "",
        title: `Interview: ${cand.candidateName}${
          cand.jobTitle ? ` - ${cand.jobTitle}` : ""
        }`,
      }));
    }
  };

  const [rescheduleForm, setRescheduleForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    meetingLink: "",
    remarks: "",
  });

  const [cancelReason, setCancelReason] = useState("");

  const [outcomeForm, setOutcomeForm] = useState({
    attendance: "Present",
    outcome: "Selected",
    outcomeRemarks: "",
  });

  useEffect(() => {
    loadData();
  }, [currentDate.getMonth(), currentDate.getFullYear(), statusFilter]);

  const showToast = (msg, type = "success") => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");

      const [statsData, meetingsData] = await Promise.all([
        meetingService.getCalendarStats().catch(() => ({ stats: {} })),
        meetingService.getMeetings({
          month,
          year,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          candidateId: filterCandidateId || undefined,
        }).catch(() => []),
      ]);

      if (statsData?.stats) {
        setStats(statsData.stats);
      }
      const list = Array.isArray(meetingsData)
        ? meetingsData
        : Array.isArray(meetingsData?.meetings)
        ? meetingsData.meetings
        : Array.isArray(meetingsData?.data)
        ? meetingsData.data
        : [];
      setMeetings(list);
    } catch (err) {
      console.error("Failed to load meetings:", err);
    } finally {
      setLoading(false);
    }
  };

  // Month Calendar Grid Calculation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month filler days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        dayNumber: d,
        dateStr: prevDate.toISOString().split("T")[0],
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(year, month, d);
      // Format as YYYY-MM-DD
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
      });
    }

    // Next month filler days to complete grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Filtered Meetings for view
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          m.title?.toLowerCase().includes(q) ||
          m.candidateName?.toLowerCase().includes(q) ||
          m.vendorName?.toLowerCase().includes(q) ||
          m.createdByName?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [meetings, searchQuery]);

  // Selected date meetings
  const selectedDateMeetings = useMemo(() => {
    return filteredMeetings.filter((m) => m.date === selectedDateStr);
  }, [filteredMeetings, selectedDateStr]);

  // Week days for week view
  const weekDays = useMemo(() => {
    const curr = new Date(selectedDateStr || new Date());
    const first = curr.getDate() - curr.getDay();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.setDate(first + i));
      days.push({
        date: d,
        dateStr: d.toISOString().split("T")[0],
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
      });
    }
    return days;
  }, [selectedDateStr]);

  // Actions
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      const targetEmployees = selectedParticipants
        .filter((p) => p.role === "EMPLOYEE" || scheduleForm.meetingType === "EMPLOYEE")
        .map((p) => p.id || p._id);

      const targetVendors = selectedParticipants
        .filter((p) => p.role === "VENDOR" || scheduleForm.meetingType === "VENDOR_DISCUSSION")
        .map((p) => p.code || p.id || p.vendorId);

      const targetHRs = selectedParticipants
        .filter((p) => p.role?.includes("HR") || scheduleForm.meetingType === "INTERNAL_HR")
        .map((p) => p.id || p._id);

      const attendees = selectedParticipants.map((p) => ({
        id: p.id || p._id || p.code || "",
        name: p.name || p.companyName,
        email: p.email || "",
        role: p.role || scheduleForm.meetingType,
        code: p.code || "",
        companyName: p.companyName || "",
        designation: p.designation || "",
      }));

      const payload = {
        title: scheduleForm.title.trim(),
        description: scheduleForm.description.trim(),
        meetingType: scheduleForm.meetingType,
        date: scheduleForm.date,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        meetingLink: scheduleForm.meetingLink.trim(),
        platform: scheduleForm.platform,
        targetType: targetMode,
        targetEmployees,
        targetVendors,
        targetHRs,
        attendees,
        candidateId: candidateData.candidateId || scheduleForm.candidateId || "",
        candidateName: candidateData.candidateName || scheduleForm.candidateName || "",
        candidateEmail: candidateData.candidateEmail || scheduleForm.candidateEmail || "",
        vendorId:
          candidateData.vendorId ||
          scheduleForm.vendorId ||
          (targetVendors.length === 1 ? targetVendors[0] : ""),
        vendorName: candidateData.vendorName || scheduleForm.vendorName || "",
      };

      await meetingService.createMeeting(payload);
      showToast("Meeting scheduled successfully! Invitations sent.");
      setShowScheduleModal(false);
      setScheduleForm({
        title: "",
        meetingType: "CANDIDATE_INTERVIEW",
        date: new Date().toISOString().split("T")[0],
        startTime: "10:00",
        endTime: "11:00",
        meetingLink: "",
        platform: "Google Meet",
        candidateId: "",
        candidateName: "",
        candidateEmail: "",
        vendorId: "",
        vendorName: "",
        description: "",
      });
      setSelectedParticipants([]);
      setTargetMode("SPECIFIC");
      setCandidateData({
        candidateId: "",
        candidateName: "",
        candidateEmail: "",
        vendorId: "",
        vendorName: "",
        jobTitle: "",
        projectName: "",
      });
      loadData();
      window.dispatchEvent(new CustomEvent("immigo:meeting-update"));
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to schedule meeting", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!meetingToReschedule) return;
    try {
      setSubmitting(true);
      await meetingService.rescheduleMeeting(meetingToReschedule.id || meetingToReschedule._id, rescheduleForm);
      showToast("Meeting rescheduled successfully.");
      setMeetingToReschedule(null);
      loadData();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to reschedule", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!meetingToCancel) return;
    try {
      setSubmitting(true);
      await meetingService.cancelMeeting(meetingToCancel.id || meetingToCancel._id, cancelReason);
      showToast("Meeting cancelled.");
      setMeetingToCancel(null);
      setCancelReason("");
      loadData();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to cancel meeting", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOutcomeSubmit = async (e) => {
    e.preventDefault();
    if (!meetingToRecordOutcome) return;
    try {
      setSubmitting(true);
      await meetingService.updateMeeting(meetingToRecordOutcome.id || meetingToRecordOutcome._id, outcomeForm);
      showToast("Meeting attendance and outcome recorded.");
      setMeetingToRecordOutcome(null);
      loadData();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save outcome", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200">
      {/* Toast Notice */}
      {notice && (
        <div
          className={`px-4 py-2.5 text-xs font-bold text-center border-b flex items-center justify-center gap-2 ${
            notice.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {notice.type === "error" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          <span>{notice.msg}</span>
        </div>
      )}

      {/* Header with Title, View Toggles & Schedule Button */}
      <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-b border-slate-200 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-cyan-300 shadow-inner shrink-0">
            <Calendar size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-tight">
                Meeting Calendar & Scheduling
              </h3>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                Live System
              </span>
            </div>
            <p className="text-[11px] text-blue-200/80 leading-tight">
              Scheduled appointments, candidate interviews, and partnership conferences.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Buttons: Day first, Month last */}
          <div className="flex items-center bg-white/10 p-0.5 rounded-lg border border-white/15 text-xs font-semibold">
            {["day", "week", "list", "month"].map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-2.5 py-1 rounded-md capitalize transition-all cursor-pointer ${
                  viewMode === v ? "bg-white text-slate-900 font-bold shadow-xs" : "text-blue-100 hover:text-white"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* Sleek Compact KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 p-2 px-4 bg-slate-50/70 border-b border-slate-200 text-xs">
        <div className="px-2.5 py-1 bg-white rounded-lg border border-slate-200/90 shadow-2xs flex items-center justify-between sm:flex-col sm:items-start">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's</span>
          <span className="text-sm font-extrabold text-blue-600 leading-tight">{stats.todayMeetingsCount || 0}</span>
        </div>

        <div className="px-2.5 py-1 bg-white rounded-lg border border-slate-200/90 shadow-2xs flex items-center justify-between sm:flex-col sm:items-start">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upcoming</span>
          <span className="text-sm font-extrabold text-indigo-600 leading-tight">{stats.upcomingMeetingsCount || 0}</span>
        </div>

        <div className="px-2.5 py-1 bg-white rounded-lg border border-slate-200/90 shadow-2xs flex items-center justify-between sm:flex-col sm:items-start col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next</span>
          <span className="text-xs font-bold text-slate-900 truncate max-w-full">
            {stats.nextMeeting?.title || "None Scheduled"}
          </span>
        </div>

        <div className="px-2.5 py-1 bg-white rounded-lg border border-slate-200/90 shadow-2xs flex items-center justify-between sm:flex-col sm:items-start">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
          <span className="text-sm font-extrabold text-slate-900 leading-tight">{stats.totalScheduledMeetings || 0}</span>
        </div>

        <div className="px-2.5 py-1 bg-white rounded-lg border border-slate-200/90 shadow-2xs flex items-center justify-between sm:flex-col sm:items-start">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">7 Days</span>
          <span className="text-sm font-extrabold text-purple-600 leading-tight">{stats.next7DaysMeetingsCount || 0}</span>
        </div>

        <div className="px-2.5 py-1 bg-white rounded-lg border border-slate-200/90 shadow-2xs flex items-center justify-between sm:flex-col sm:items-start">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
          <span className="text-sm font-extrabold text-emerald-600 leading-tight">{stats.completedMeetingsCount || 0}</span>
        </div>

        <div className="px-2.5 py-1 bg-white rounded-lg border border-slate-200/90 shadow-2xs flex items-center justify-between sm:flex-col sm:items-start">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cancelled</span>
          <span className="text-sm font-extrabold text-rose-500 leading-tight">{stats.cancelledMeetingsCount || 0}</span>
        </div>
      </div>

      {/* Main Calendar / View Container */}
      <div className="p-3 sm:p-4">
        {/* Navigation Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {viewMode === "month" ? (
              <MonthYearSelector
                zeroBased
                month={currentDate.getMonth()}
                year={currentDate.getFullYear()}
                onChange={(m, y) => setCurrentDate(new Date(y, m, 1))}
                minYear={2020}
                maxYear={new Date().getFullYear() + 5}
              />
            ) : (
              <>
                <button
                  onClick={() => {
                    const prev = new Date(currentDate);
                    if (viewMode === "week") {
                      prev.setDate(prev.getDate() - 7);
                      setSelectedDateStr(prev.toISOString().split("T")[0]);
                    } else {
                      prev.setDate(prev.getDate() - 1);
                      setSelectedDateStr(prev.toISOString().split("T")[0]);
                    }
                    setCurrentDate(prev);
                  }}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                  title="Previous"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="font-extrabold text-xs sm:text-sm text-slate-900 min-w-[130px] text-center">
                  {viewMode === "day"
                    ? currentDate.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : currentDate.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                </span>
                <button
                  onClick={() => {
                    const next = new Date(currentDate);
                    if (viewMode === "week") {
                      next.setDate(next.getDate() + 7);
                      setSelectedDateStr(next.toISOString().split("T")[0]);
                    } else {
                      next.setDate(next.getDate() + 1);
                      setSelectedDateStr(next.toISOString().split("T")[0]);
                    }
                    setCurrentDate(next);
                  }}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                  title="Next"
                >
                  <ChevronRight size={15} />
                </button>
              </>
            )}
            <button
              onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                setSelectedDateStr(today.toISOString().split("T")[0]);
              }}
              className="px-2 py-0.5 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              Today
            </button>

            {viewMode === "day" && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700">
                {selectedDateMeetings.length} {selectedDateMeetings.length === 1 ? "Meeting" : "Meetings"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-52">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search meeting or candidate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* 1. DAY VIEW (DEFAULT) */}
        {viewMode === "day" && (
          <div className="space-y-2.5">
            {selectedDateMeetings.length === 0 ? (
              <div className="text-center py-7 border border-dashed border-slate-200 rounded-xl bg-slate-50/70 p-4 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                  <Calendar size={18} />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-xs">No meetings scheduled for {selectedDateStr}</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    There are no interviews, vendor discussions, or internal appointments booked for this day.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setScheduleForm((prev) => ({ ...prev, date: selectedDateStr }));
                    setShowScheduleModal(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Schedule Meeting for this Day</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDateMeetings.map((m) => (
                  <MeetingCard
                    key={m._id || m.id}
                    meeting={m}
                    onViewDetails={setSelectedMeetingDetail}
                    onReschedule={setMeetingToReschedule}
                    onCancel={setMeetingToCancel}
                    onRecordOutcome={setMeetingToRecordOutcome}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. WEEK VIEW */}
        {viewMode === "week" && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {weekDays.map((wDay) => {
              const dayMeetings = filteredMeetings.filter((m) => m.date === wDay.dateStr);
              const isToday = wDay.dateStr === todayStr;

              return (
                <div
                  key={wDay.dateStr}
                  className={`p-2.5 rounded-xl border ${
                    isToday ? "border-blue-400 bg-blue-50/20" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase">{wDay.dayName}</div>
                      <div className={`text-base font-bold ${isToday ? "text-blue-600" : "text-slate-800"}`}>
                        {wDay.dayNum}
                      </div>
                    </div>
                    {dayMeetings.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                        {dayMeetings.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar">
                    {dayMeetings.map((m) => (
                      <MeetingCard
                        key={m._id || m.id}
                        meeting={m}
                        compact={true}
                        onViewDetails={setSelectedMeetingDetail}
                        onReschedule={setMeetingToReschedule}
                        onCancel={setMeetingToCancel}
                        onRecordOutcome={setMeetingToRecordOutcome}
                      />
                    ))}
                    {dayMeetings.length === 0 && (
                      <div className="text-[11px] text-slate-400 py-4 text-center">Empty</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. LIST VIEW */}
        {viewMode === "list" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMeetings.length === 0 ? (
                <div className="col-span-full text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-xs">
                  No meetings match your filter criteria.
                </div>
              ) : (
                filteredMeetings.map((m) => (
                  <MeetingCard
                    key={m._id || m.id}
                    meeting={m}
                    onViewDetails={setSelectedMeetingDetail}
                    onReschedule={setMeetingToReschedule}
                    onCancel={setMeetingToCancel}
                    onRecordOutcome={setMeetingToRecordOutcome}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. MONTH VIEW (LAST) */}
        {viewMode === "month" && (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-1 border border-slate-200 rounded-xl overflow-hidden bg-slate-100">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                <div
                  key={dayName}
                  className="py-2 text-center text-[11px] font-bold text-slate-600 bg-slate-50 uppercase tracking-wider"
                >
                  {dayName}
                </div>
              ))}

              {calendarDays.map((day, idx) => {
                const dayMeetings = filteredMeetings.filter((m) => m.date === day.dateStr);
                const isSelected = selectedDateStr === day.dateStr;
                const isToday = day.dateStr === todayStr;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateStr(day.dateStr)}
                    className={`min-h-[46px] sm:min-h-[58px] p-1.5 bg-white transition-all cursor-pointer flex flex-col justify-between ${
                      !day.isCurrentMonth ? "opacity-35 bg-slate-50/50" : ""
                    } ${
                      isSelected
                        ? "ring-2 ring-blue-600 ring-inset bg-blue-50/30"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? "bg-blue-600 text-white"
                            : isSelected
                            ? "bg-blue-100 text-blue-900"
                            : "text-slate-700"
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                      {dayMeetings.length > 0 && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-full border border-blue-200">
                          {dayMeetings.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 my-1 overflow-hidden">
                      {dayMeetings.slice(0, 2).map((m) => (
                        <div
                          key={m._id || m.id}
                          className={`text-[9.5px] font-semibold px-1 py-0.5 rounded truncate border ${
                            m.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : m.status === "CANCELLED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : m.status === "RESCHEDULED"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                          title={`${m.startTime} - ${m.title}`}
                        >
                          {m.startTime} {m.title}
                        </div>
                      ))}
                      {dayMeetings.length > 2 && (
                        <div className="text-[9px] text-slate-500 font-bold px-1">
                          +{dayMeetings.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Date Meetings Section */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CalendarDays size={16} className="text-blue-600" />
                  <span>Meetings for {selectedDateStr}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {selectedDateMeetings.length} scheduled
                  </span>
                </h4>
              </div>

              {selectedDateMeetings.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs">
                  No meetings scheduled for this date. Click "+ Schedule Meeting" above to book one.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedDateMeetings.map((m) => (
                    <MeetingCard
                      key={m._id || m.id}
                      meeting={m}
                      onViewDetails={setSelectedMeetingDetail}
                      onReschedule={setMeetingToReschedule}
                      onCancel={setMeetingToCancel}
                      onRecordOutcome={setMeetingToRecordOutcome}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. LIST VIEW */}
        {viewMode === "list" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMeetings.length === 0 ? (
                <div className="col-span-full text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-xs">
                  No meetings match your filter criteria.
                </div>
              ) : (
                filteredMeetings.map((m) => (
                  <MeetingCard
                    key={m._id || m.id}
                    meeting={m}
                    onViewDetails={setSelectedMeetingDetail}
                    onReschedule={setMeetingToReschedule}
                    onCancel={setMeetingToCancel}
                    onRecordOutcome={setMeetingToRecordOutcome}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: SCHEDULE NEW MEETING */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-lg w-full shadow-2xl space-y-3 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Video size={16} className="text-blue-600" />
                <span>Schedule New Meeting / Interview</span>
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technical Interview Round 1"
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Meeting Type</label>
                  <select
                    value={scheduleForm.meetingType}
                    onChange={(e) => handleMeetingTypeChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="CANDIDATE_INTERVIEW">Candidate Interview</option>
                    <option value="VENDOR_DISCUSSION">Vendor Discussion</option>
                    <option value="INTERNAL_HR">Internal HR Meeting</option>
                    <option value="EMPLOYEE">Employee Discussion</option>
                    <option value="GENERAL">General Conference</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Platform</label>
                  <select
                    value={scheduleForm.platform}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, platform: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Adaptive Participant Selector directly under Meeting Type */}
              <DynamicMeetingParticipantSelector
                meetingType={scheduleForm.meetingType}
                targetMode={targetMode}
                onTargetModeChange={setTargetMode}
                selectedParticipants={selectedParticipants}
                onAddParticipant={handleAddParticipant}
                onRemoveParticipant={handleRemoveParticipant}
                candidateData={candidateData}
                onCandidateChange={handleCandidateChange}
              />

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date *</label>
                  <DateInput
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.startTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Time</label>
                  <input
                    type="time"
                    value={scheduleForm.endTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Meeting Link (URL) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/xyz-abc or Zoom link"
                  value={scheduleForm.meetingLink}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Add agenda, requirements or interview instructions..."
                  value={scheduleForm.description}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  {submitting ? "Booking..." : "Schedule & Send Invites"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MEETING DETAILS */}
      {selectedMeetingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-md w-full shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Video size={16} className="text-blue-600" />
                <span>Meeting Details</span>
              </h3>
              <button
                onClick={() => setSelectedMeetingDetail(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <h4 className="font-bold text-sm text-slate-900">{selectedMeetingDetail.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-100 text-blue-800">
                    {selectedMeetingDetail.status}
                  </span>
                  <span className="text-slate-500 font-semibold">
                    {selectedMeetingDetail.platform}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 space-y-1.5 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Date:</span>
                  <span className="font-bold text-slate-800">{selectedMeetingDetail.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Time:</span>
                  <span className="font-bold text-slate-800">
                    {selectedMeetingDetail.startTime} - {selectedMeetingDetail.endTime || "TBD"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Host / Organizer:</span>
                  <span className="font-bold text-slate-800">
                    {selectedMeetingDetail.createdByName} ({selectedMeetingDetail.organizerRole || "Admin"})
                  </span>
                </div>
                {selectedMeetingDetail.candidateName && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Candidate:</span>
                    <span className="font-bold text-indigo-700">
                      {selectedMeetingDetail.candidateName} ({selectedMeetingDetail.candidateId || "ID"})
                    </span>
                  </div>
                )}
                {selectedMeetingDetail.vendorName && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Vendor Partner:</span>
                    <span className="font-bold text-slate-800">{selectedMeetingDetail.vendorName}</span>
                  </div>
                )}
                {selectedMeetingDetail.outcome && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Outcome:</span>
                    <span className="font-bold text-emerald-700">{selectedMeetingDetail.outcome}</span>
                  </div>
                )}
              </div>

              {selectedMeetingDetail.description && (
                <div>
                  <div className="font-bold text-slate-700">Description:</div>
                  <p className="text-slate-600 mt-0.5">{selectedMeetingDetail.description}</p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-2 border-t">
                <a
                  href={selectedMeetingDetail.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 text-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <ExternalLink size={14} />
                  <span>Join Meeting Now</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RESCHEDULE */}
      {meetingToReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-sm w-full shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <RefreshCw size={15} className="text-amber-600" />
                <span>Reschedule Meeting</span>
              </h3>
              <button
                onClick={() => setMeetingToReschedule(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-2.5 text-xs">
              <p className="text-slate-600 font-medium">
                Rescheduling: <strong className="text-slate-900">{meetingToReschedule.title}</strong>
              </p>

              <div>
                <label className="block text-slate-700 font-bold mb-1">New Date *</label>
                <DateInput
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={rescheduleForm.date || meetingToReschedule.date}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Start Time *</label>
                  <input
                    type="time"
                    required
                    value={rescheduleForm.startTime || meetingToReschedule.startTime}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, startTime: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">New End Time</label>
                  <input
                    type="time"
                    value={rescheduleForm.endTime || meetingToReschedule.endTime}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, endTime: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Updated Link (Optional)</label>
                <input
                  type="url"
                  placeholder="Leave blank to keep existing link"
                  value={rescheduleForm.meetingLink}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, meetingLink: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reschedule Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Candidate requested later time slot"
                  value={rescheduleForm.remarks}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, remarks: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setMeetingToReschedule(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                >
                  {submitting ? "Updating..." : "Confirm Reschedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CANCEL */}
      {meetingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-sm w-full shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-rose-600">
                <XCircle size={16} />
                <span>Cancel Meeting</span>
              </h3>
              <button
                onClick={() => setMeetingToCancel(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-2.5 text-xs">
              <p className="text-slate-600">
                Are you sure you want to cancel{" "}
                <strong className="text-slate-900">{meetingToCancel.title}</strong>? All participants will be
                notified.
              </p>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Cancellation Reason *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="State the reason for cancellation..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setMeetingToCancel(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  {submitting ? "Cancelling..." : "Cancel Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RECORD OUTCOME & ATTENDANCE */}
      {meetingToRecordOutcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-sm w-full shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-emerald-600">
                <Award size={16} />
                <span>Record Attendance & Outcome</span>
              </h3>
              <button
                onClick={() => setMeetingToRecordOutcome(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleOutcomeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Attendance Status</label>
                <select
                  value={outcomeForm.attendance}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, attendance: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Interview / Meeting Outcome</label>
                <select
                  value={outcomeForm.outcome}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, outcome: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-900"
                >
                  <option value="Selected">Selected 🎉</option>
                  <option value="Next Round">Next Round ⏭️</option>
                  <option value="On Hold">On Hold ⏸️</option>
                  <option value="Rejected">Rejected ❌</option>
                  <option value="Reschedule Required">Reschedule Required 🔄</option>
                  <option value="Completed">Completed Successfully ✅</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Remarks / Feedback</label>
                <textarea
                  rows={2}
                  placeholder="Add evaluation feedback, strengths, next steps..."
                  value={outcomeForm.outcomeRemarks}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, outcomeRemarks: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setMeetingToRecordOutcome(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Outcome"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// MEETING CARD COMPONENT (Section 10 specification)
function MeetingCard({
  meeting,
  compact = false,
  onViewDetails,
  onReschedule,
  onCancel,
  onRecordOutcome,
}) {
  const isCancelled = meeting.status === "CANCELLED";
  const isCompleted = meeting.status === "COMPLETED";

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between group ${
        isCancelled
          ? "bg-rose-50/40 border-rose-200"
          : isCompleted
          ? "bg-emerald-50/30 border-emerald-200"
          : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
              isCompleted
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : isCancelled
                ? "bg-rose-100 text-rose-800 border-rose-200"
                : meeting.status === "RESCHEDULED"
                ? "bg-amber-100 text-amber-800 border-amber-200"
                : "bg-blue-100 text-blue-800 border-blue-200"
            }`}
          >
            {meeting.status}
          </span>

          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {meeting.platform || "Online"}
          </span>
        </div>

        {/* Meeting Title */}
        <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {meeting.title}
        </h4>

        {/* Date and Time */}
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600 font-semibold">
          <Clock size={13} className="text-blue-600 shrink-0" />
          <span>
            {meeting.date} &bull; {meeting.startTime}
            {meeting.endTime ? ` - ${meeting.endTime}` : ""}
          </span>
        </div>

        {/* Participants: kis kis ke beech meeting hai */}
        <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="text-slate-500 font-medium">Host / By:</span>
            <span className="font-bold text-slate-800 truncate max-w-[150px]">
              {meeting.createdByName || "Organizer"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="text-slate-500 font-medium">Meeting With:</span>
            <span className="font-bold text-blue-700 truncate max-w-[150px]">
              {meeting.candidateName || meeting.vendorName || meeting.targetType || "Attendee"}
            </span>
          </div>
          {meeting.candidateName && meeting.vendorName && (
            <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500">
              <span>Vendor:</span>
              <span className="font-medium text-slate-700 truncate max-w-[150px]">{meeting.vendorName}</span>
            </div>
          )}
        </div>

        {/* Attendance & Outcome Badges if recorded */}
        {(meeting.outcome || meeting.attendance) && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
            {meeting.attendance && (
              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 text-slate-700">
                Attended: {meeting.attendance}
              </span>
            )}
            {meeting.outcome && (
              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800">
                Outcome: {meeting.outcome}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Buttons Strip */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1.5">
        {!isCancelled && meeting.meetingLink && (
          <a
            href={meeting.meetingLink}
            target="_blank"
            rel="noreferrer"
            className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
          >
            <Video size={13} />
            <span>Join Meeting</span>
          </a>
        )}

        <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-500">
          <button
            onClick={() => onViewDetails(meeting)}
            className="hover:text-blue-600 cursor-pointer"
          >
            Details
          </button>

          {!isCancelled && !isCompleted && (
            <>
              <button
                onClick={() => onReschedule(meeting)}
                className="hover:text-amber-600 cursor-pointer"
              >
                Reschedule
              </button>
              <button
                onClick={() => onRecordOutcome(meeting)}
                className="hover:text-emerald-600 cursor-pointer"
              >
                Outcome
              </button>
              <button
                onClick={() => onCancel(meeting)}
                className="hover:text-rose-600 cursor-pointer"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

