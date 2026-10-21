import { useState, useEffect } from "react";
import apiClient from "../../services/apiClient.js";
import {
  Video,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

export default function EmployeeMeetingsTab({ token, initialMeetings = [] }) {
  const [meetings, setMeetings] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("cached_employee_meetings") || "[]");
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return Array.isArray(initialMeetings) ? initialMeetings : [];
  });
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const fetchMeetings = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await apiClient.get("/employee/meetings");
      const list = Array.isArray(res.data) ? res.data : [];
      setMeetings(list);
      try {
        localStorage.setItem("cached_employee_meetings", JSON.stringify(list));
      } catch {}
    } catch (err) {
      console.error("Failed to load meetings", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    const interval = setInterval(() => fetchMeetings(false), 25000);
    return () => clearInterval(interval);
  }, [token]);

  const handleCopyLink = (link, id) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const todayMeetings = meetings.filter((m) => m.date === todayStr);
  const upcomingMeetings = meetings.filter((m) => m.date > todayStr);
  const pastMeetings = meetings.filter((m) => m.date < todayStr);

  const displayedMeetings =
    activeTab === "today"
      ? todayMeetings
      : activeTab === "upcoming"
        ? upcomingMeetings
        : activeTab === "past"
          ? pastMeetings
          : meetings;

  return (
    <div className="space-y-3">
      {/* Compact Header with Tabs */}
      <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0">
            <Video size={14} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>My Scheduled Meetings</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {meetings.length}
              </span>
            </h2>
            <p className="text-[10px] text-slate-500">
              Live list of video syncs and group calls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
          {/* Quick filter pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer text-[10px] font-bold ${
                activeTab === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({meetings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("today")}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-1 ${
                activeTab === "today"
                  ? "bg-white text-emerald-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {todayMeetings.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
              Today ({todayMeetings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer text-[10px] font-bold ${
                activeTab === "upcoming"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Upcoming ({upcomingMeetings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("past")}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer text-[10px] font-bold ${
                activeTab === "past"
                  ? "bg-white text-slate-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Past ({pastMeetings.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchMeetings(true)}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Refresh Meetings"
          >
            <RefreshCw size={12} className={loading ? "animate-spin text-emerald-600" : ""} />
          </button>
        </div>
      </div>

      {/* Meetings List */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading && meetings.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading your meetings schedule...
          </div>
        ) : displayedMeetings.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            <Video size={24} className="mx-auto mb-1.5 text-slate-300" />
            <div className="font-bold text-slate-700">No {activeTab !== "all" ? activeTab : ""} meetings scheduled</div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              When meetings are created, they will show up in this list.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedMeetings.map((m) => {
              const isToday = m.date === todayStr;
              const isPast = m.date < todayStr;
              const isAll = m.targetType === "ALL";
              const mId = m._id || m.id;

              return (
                <div
                  key={mId}
                  className={`p-2.5 sm:px-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                    isToday ? "bg-emerald-50/30 hover:bg-emerald-50/60" : "hover:bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        isToday
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                          : isPast
                            ? "bg-slate-100 text-slate-500 border-slate-200"
                            : "bg-blue-50 text-blue-600 border-blue-200"
                      }`}
                    >
                      <Video size={13} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {m.title}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                            Today
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {m.platform || "Google Meet"}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                            isAll
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {isAll ? "All Staff" : "Direct Invite"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 text-[10px] text-slate-500 font-medium mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <CalendarIcon size={11} className={isToday ? "text-emerald-600" : "text-slate-400"} />
                          <span className={isToday ? "text-emerald-900 font-bold" : ""}>{m.date}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} className={isToday ? "text-emerald-600" : "text-slate-400"} />
                          <span>{m.startTime}{m.endTime ? ` — ${m.endTime}` : ""}</span>
                        </span>
                        {m.description && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-400 truncate max-w-xs">{m.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {m.meetingLink && (
                      <button
                        type="button"
                        onClick={() => handleCopyLink(m.meetingLink, mId)}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded text-[10px] font-semibold cursor-pointer border border-slate-200 transition-colors flex items-center gap-1"
                        title="Copy Link"
                      >
                        {copiedId === mId ? (
                          <>
                            <Check size={10} className="text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={10} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}

                    {m.meetingLink ? (
                      <a
                        href={m.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all shadow-2xs active:scale-95 ${
                          isPast
                            ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                        }`}
                      >
                        <ExternalLink size={11} />
                        <span>Join</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold px-2">No Link</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
