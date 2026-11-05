import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Video,
  Calendar,
  Clock,
  CheckCircle2,
  ExternalLink,
  Users,
  Building2,
  User,
  Radio,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import meetingService from "../../../services/meetingService.js";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function ActiveMeetingAlertBanner({
  customRole = null,
  contextVendorId = null,
  className = "",
}) {
  const { user, role, isSuperAdmin, isVendor } = useAuth();
  const effectiveRole = customRole || (isSuperAdmin ? "SUPER_ADMIN" : role || "ADMIN");

  const [activeMeeting, setActiveMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const fetchActiveMeeting = async () => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];

      // If logged in as an Employee
      if (effectiveRole === "employee" || effectiveRole === "EMPLOYEE") {
        const res = await meetingService.getEmployeeMeetings({ upcoming: "true" });
        const list = Array.isArray(res) ? res : res?.meetings || [];
        const uncompleted = list.filter(
          (m) =>
            m &&
            m.status !== "COMPLETED" &&
            m.status !== "CANCELLED" &&
            (m.date >= todayStr || m.date === todayStr)
        );
        setActiveMeeting(uncompleted[0] || null);
        return;
      }

      // Other roles: Admin, HR, Vendor HR, Vendor
      const params = { upcoming: "true", status: "SCHEDULED" };
      if (contextVendorId) params.vendorId = contextVendorId;

      const res = await meetingService.getMeetings(params);
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.meetings)
        ? res.meetings
        : Array.isArray(res?.data)
        ? res.data
        : [];

      // Find the first scheduled/rescheduled meeting that is not completed
      const uncompleted = list.filter(
        (m) =>
          m &&
          m.status !== "COMPLETED" &&
          m.status !== "CANCELLED" &&
          (m.date >= todayStr || m.date === todayStr)
      );

      setActiveMeeting(uncompleted[0] || null);
    } catch (err) {
      // Non-blocking error
      setActiveMeeting(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveMeeting();

    const handleUpdate = () => fetchActiveMeeting();
    window.addEventListener("immigo:meeting-update", handleUpdate);
    const interval = setInterval(fetchActiveMeeting, 25000);

    return () => {
      window.removeEventListener("immigo:meeting-update", handleUpdate);
      clearInterval(interval);
    };
  }, [contextVendorId, effectiveRole]);

  const handleMarkCompleted = async () => {
    if (!activeMeeting) return;
    try {
      setActionLoading(true);
      const meetingId = activeMeeting._id || activeMeeting.id;
      await meetingService.markMeetingCompleted(meetingId, "Meeting completed via Dashboard");
      setNotice("Meeting marked as completed!");
      setActiveMeeting(null);
      window.dispatchEvent(new CustomEvent("immigo:meeting-update"));
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update meeting status");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !activeMeeting) {
    if (notice) {
      return (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span>✓ {notice}</span>
        </div>
      );
    }
    return null;
  }

  // Format participant info
  const empAttendee = activeMeeting.attendees?.find((a) => a.role === "EMPLOYEE");
  const attendeesList = Array.isArray(activeMeeting.attendees) ? activeMeeting.attendees : [];
  const attendeeNames = attendeesList.map((a) => a.name || a.companyName).filter(Boolean);
  const targetEmployeeName =
    empAttendee?.name ||
    (Array.isArray(activeMeeting.targetEmployees) && activeMeeting.targetEmployees[0]?.name) ||
    "";

  const participantLabel =
    attendeeNames.length > 0
      ? attendeeNames.length > 2
        ? `${attendeeNames.slice(0, 2).join(", ")} +${attendeeNames.length - 2} more`
        : attendeeNames.join(", ")
      : targetEmployeeName
      ? `Employee: ${targetEmployeeName}`
      : activeMeeting.candidateName
      ? `Candidate: ${activeMeeting.candidateName}`
      : activeMeeting.vendorName
      ? `Vendor: ${activeMeeting.vendorName}`
      : activeMeeting.targetType === "ALL"
      ? "All Team Members"
      : activeMeeting.createdByName
      ? `Host: ${activeMeeting.createdByName}`
      : "";

  const isToday =
    activeMeeting.date === new Date().toISOString().split("T")[0];

  const calendarLink =
    isVendor
      ? "/vendor/meetings"
      : effectiveRole === "employee" || effectiveRole === "EMPLOYEE"
      ? "/employee/dashboard"
      : effectiveRole === "HR" || effectiveRole === "VENDOR_HR"
      ? "/hr/meetings"
      : "/admin/meetings";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-3.5 sm:p-4 shadow-lg border border-blue-500/30 transition-all ${className}`}
    >
      {/* Background soft ambient glow */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
        {/* Left Info Column */}
        <div className="flex items-start gap-3 min-w-0">
          {/* Live pulsing dot icon */}
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-cyan-300 shadow-inner">
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-75"></span>
              <Video className="w-5 h-5 relative text-white" />
            </div>
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {isToday ? "Meeting Today" : "Active Scheduled Meeting"}
              </span>

              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-slate-200 border border-white/10">
                {activeMeeting.platform || "Google Meet"}
              </span>

              {participantLabel && (
                <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[200px]">
                  • {participantLabel}
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate">
              {activeMeeting.title}
            </h3>

            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium flex-wrap">
              <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {activeMeeting.startTime}{" "}
                  {activeMeeting.endTime ? `- ${activeMeeting.endTime}` : ""}
                </span>
              </span>

              <span className="flex items-center gap-1 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {new Date(activeMeeting.date).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Buttons Column */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap pt-2 md:pt-0 border-t border-white/10 md:border-t-0">
          {activeMeeting.meetingLink ? (
            <a
              href={activeMeeting.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow-md shadow-blue-500/30 flex items-center gap-1.5 transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Join Meeting</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>
          ) : (
            <span className="text-xs text-slate-400 italic">No link attached</span>
          )}

          {effectiveRole !== "employee" && effectiveRole !== "EMPLOYEE" && (
            <button
              onClick={handleMarkCompleted}
              disabled={actionLoading}
              title="Mark this meeting as completed"
              className="px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap border border-emerald-400/40"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{actionLoading ? "Updating..." : "Mark Complete"}</span>
            </button>
          )}

          <Link
            to={calendarLink}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/15 flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Calendar</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </Link>
        </div>
      </div>
    </div>
  );
}

