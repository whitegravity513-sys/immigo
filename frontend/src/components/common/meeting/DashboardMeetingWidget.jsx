import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Video,
  Plus,
  ArrowRight,
  ExternalLink,
  Users,
  CheckCircle2,
  XCircle,
  Building2,
  RefreshCw,
  X,
} from "lucide-react";
import meetingService from "../../../services/meetingService.js";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function DashboardMeetingWidget({
  role = "ADMIN",
  assignedVendors = [],
}) {
  const { isVendor, isHR } = useAuth();
  const fullCalendarLink = isVendor ? "/vendor/meetings" : isHR ? "/hr/meetings" : "/admin/meetings";

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ todayMeetingsCount: 0, upcomingMeetingsCount: 0 });

  // Schedule modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    meetingType: "CANDIDATE_INTERVIEW",
    date: todayStr,
    startTime: "11:00",
    endTime: "12:00",
    meetingLink: "",
    candidateName: "",
    vendorName: "",
    description: "",
  });

  useEffect(() => {
    loadDateMeetings();
  }, [selectedDate]);

  const loadDateMeetings = async () => {
    try {
      setLoading(true);
      const [resMeetings, resStats] = await Promise.all([
        meetingService.getMeetings({ date: selectedDate }).catch(() => []),
        meetingService.getCalendarStats().catch(() => ({ stats: {} })),
      ]);

      const list = Array.isArray(resMeetings)
        ? resMeetings
        : Array.isArray(resMeetings?.meetings)
        ? resMeetings.meetings
        : Array.isArray(resMeetings?.data)
        ? resMeetings.data
        : [];

      setMeetings(list);
      if (resStats?.stats) {
        setStats(resStats.stats);
      }
    } catch {
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError("");
      const payload = {
        ...formData,
        candidateId: formData.candidateId || (formData.candidateName ? `CAND-${Date.now().toString().slice(-4)}` : ""),
        vendorId: formData.vendorId || (assignedVendors.length > 0 ? assignedVendors[0] : ""),
      };
      await meetingService.createMeeting(payload);
      setIsModalOpen(false);
      setFormData({
        title: "",
        meetingType: "CANDIDATE_INTERVIEW",
        date: todayStr,
        startTime: "11:00",
        endTime: "12:00",
        meetingLink: "",
        candidateName: "",
        vendorName: "",
        description: "",
      });
      loadDateMeetings();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to schedule meeting");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDisplayDate = (dStr) => {
    if (dStr === todayStr) return "Today";
    if (dStr === tomorrowStr) return "Tomorrow";
    const d = new Date(dStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Top Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Calendar size={16} />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
              Meetings & Daily Schedule
            </h3>
            <p className="text-[11px] text-slate-500">
              Showing schedule for:{" "}
              <strong className="text-blue-700 font-bold">{formatDisplayDate(selectedDate)}</strong>
            </p>
          </div>
        </div>

        {/* Date Selector & Action buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer ${
                selectedDate === todayStr ? "bg-blue-600 text-white font-bold" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(tomorrowStr)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer ${
                selectedDate === tomorrowStr ? "bg-blue-600 text-white font-bold" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Tomorrow
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-[11px] px-1.5 py-0.5 text-slate-600 border-l border-slate-200 focus:outline-hidden"
              title="Select custom date"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>Schedule</span>
          </button>

          <Link
            to={fullCalendarLink}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors"
            title="Open complete monthly & weekly calendar in sidebar"
          >
            <span>Full Calendar</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Meeting Cards List for the Selected Date */}
      <div className="p-3.5 sm:p-4">
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={13} className="animate-spin text-blue-600" />
            <span>Checking meetings...</span>
          </div>
        ) : meetings.length === 0 ? (
          <div className="py-6 text-center">
            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-1.5">
              <Calendar size={18} />
            </div>
            <p className="text-xs font-semibold text-slate-700">
              No meetings scheduled for {formatDisplayDate(selectedDate)}
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-xs text-blue-600 font-bold hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} />
              <span>Schedule meeting for this date</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {meetings.map((m) => {
              const mId = m.id || m._id;
              const isCancelled = m.status === "CANCELLED";
              const isCompleted = m.status === "COMPLETED";

              return (
                <div
                  key={mId}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all flex flex-col justify-between space-y-2 shadow-2xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="font-bold text-xs text-slate-900 truncate leading-tight flex-1">
                        {m.title}
                      </h4>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase shrink-0 ${
                          isCancelled
                            ? "bg-rose-100 text-rose-700"
                            : isCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {m.status || "SCHEDULED"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
                      <Clock size={11} className="text-blue-600" />
                      <span>
                        {m.startTime} {m.endTime ? `- ${m.endTime}` : ""}
                      </span>
                    </div>

                    {/* Participants: kis kis ke beech meeting hai */}
                    <div className="bg-slate-50/90 rounded-lg p-2 border border-slate-100 mt-1.5 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <span className="text-slate-500 font-medium">Host / By:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[150px]">
                          {m.createdByName || "Organizer"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <span className="text-slate-500 font-medium">Meeting With:</span>
                        <span className="font-bold text-blue-700 truncate max-w-[150px]">
                          {m.candidateName || m.vendorName || m.targetType || "Attendee"}
                        </span>
                      </div>
                      {m.candidateName && m.vendorName && (
                        <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500">
                          <span>Vendor:</span>
                          <span className="font-medium text-slate-700 truncate max-w-[150px]">{m.vendorName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {m.meetingLink && !isCancelled ? (
                      <a
                        href={m.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Video size={11} />
                        <span>Join</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">No link</span>
                    )}

                    <Link
                      to={fullCalendarLink}
                      className="text-[11px] text-slate-500 hover:text-blue-600 font-semibold inline-flex items-center gap-0.5"
                    >
                      <span>Details</span>
                      <ArrowRight size={10} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mini Footer Bar */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div>
          Today: <strong className="text-slate-800">{stats.todayMeetingsCount}</strong> &bull; Upcoming:{" "}
          <strong className="text-slate-800">{stats.upcomingMeetingsCount}</strong>
        </div>
        <Link
          to={fullCalendarLink}
          className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
        >
          <span>Open Full Monthly & Weekly Calendar</span>
          <ArrowRight size={11} />
        </Link>
      </div>

      {/* Quick Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Calendar size={15} className="text-blue-600" />
                <span>Schedule New Meeting</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technical Trade Interview"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start *</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">End</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Meeting Link (Meet / Zoom) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/xyz"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Candidate / Attendee Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.candidateName}
                  onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer text-xs"
                >
                  {submitting ? "Scheduling..." : "Schedule Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
