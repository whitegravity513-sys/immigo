import { useState, useEffect } from "react";
import axios from "axios";
import {
  Video,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Users,
  UserCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export default function EmployeeMeetingsTab({ token }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/employee/meetings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMeetings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load meetings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    const interval = setInterval(fetchMeetings, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const handleCopyLink = (link, id) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const todayMeetings = meetings.filter((m) => m.date === todayStr);
  const upcomingMeetings = meetings.filter((m) => m.date > todayStr);
  const pastMeetings = meetings.filter((m) => m.date < todayStr);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Video size={20} />
            </span>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              My Scheduled Meetings
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            View all meetings and group syncs assigned to you or all company staff. Click "Join Meeting" to enter.
          </p>
        </div>

        <button
          onClick={fetchMeetings}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          Refresh Schedule
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading your schedule...</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 shadow-xs">
          <Video size={40} className="mx-auto mb-3 opacity-30 text-slate-500" />
          <h3 className="text-base font-bold text-slate-700">No Meetings Scheduled</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You currently have no scheduled video meetings. When management organizes a meeting, it will appear here and notify you immediately.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today's Meetings */}
          {todayMeetings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Today's Meetings ({todayMeetings.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todayMeetings.map((m) => renderMeetingCard(m, true))}
              </div>
            </div>
          )}

          {/* Upcoming Meetings */}
          {upcomingMeetings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Upcoming Meetings ({upcomingMeetings.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingMeetings.map((m) => renderMeetingCard(m, false))}
              </div>
            </div>
          )}

          {/* Past Meetings */}
          {pastMeetings.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Past Meetings ({pastMeetings.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
                {pastMeetings.map((m) => renderMeetingCard(m, false, true))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  function renderMeetingCard(meeting, isToday = false, isPast = false) {
    const isAll = meeting.targetType === "ALL";
    const mId = meeting._id || meeting.id;

    return (
      <div
        key={mId}
        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
          isToday
            ? "bg-emerald-50/40 border-emerald-300 shadow-md shadow-emerald-500/5"
            : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 tracking-wider">
                {meeting.platform || "Google Meet"}
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider ${
                  isAll
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {isAll ? "All Staff" : "Direct Invite"}
              </span>
            </div>

            {isToday && (
              <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                Today
              </span>
            )}
          </div>

          <h4 className="font-extrabold text-slate-900 text-base leading-snug mb-1">
            {meeting.title}
          </h4>

          {meeting.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mb-3">
              {meeting.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold mt-2">
            <div className="flex items-center gap-1.5">
              <CalendarIcon size={14} className="text-emerald-600" />
              <span>{meeting.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-emerald-600" />
              <span>
                {meeting.startTime} {meeting.endTime ? `— ${meeting.endTime}` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <a
            href={meeting.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isPast
                ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
            }`}
          >
            <ExternalLink size={13} />
            <span>Join Meeting</span>
          </a>

          <button
            type="button"
            onClick={() => handleCopyLink(meeting.meetingLink, mId)}
            className="flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200 transition-colors"
            title="Copy link"
          >
            {copiedId === mId ? (
              <>
                <Check size={13} className="text-emerald-600" />
                <span className="text-emerald-600 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }
}
