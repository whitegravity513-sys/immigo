import { useState, useEffect, useRef } from "react";
import apiClient from "../../services/apiClient.js";
import {
  Bell,
  CheckCheck,
  Video,
  ExternalLink,
  Sparkles,
  Info,
  Clock,
  Calendar,
  X,
} from "lucide-react";

export default function EmployeeNotificationBell({ token, onSelectMeeting, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get("/employee/notifications?limit=25");
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Silent error for polling
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 6000);
    return () => clearInterval(interval);
  }, [token]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkOneAsRead = async (id) => {
    try {
      await apiClient.put(`/employee/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id || n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put("/employee/notifications/read-all", {});
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={className || "relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center justify-center cursor-pointer border border-slate-200/80 shadow-xs focus:outline-none"}
        title="Live Notifications"
      >
        <Bell size={18} className={className ? "text-blue-200 hover:text-white" : "text-slate-700"} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-md animate-bounce">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                  {unreadCount} New
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/80 cursor-pointer font-semibold"
                title="Mark all as read"
              >
                <CheckCheck size={13} className="text-emerald-600" />
                <span className="text-[11px]">Read All</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No notifications</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Meeting invites and company announcements will appear here.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isMeeting = item.type === "MEETING" || item.metadata?.meetingLink;
                const meetingLink = item.metadata?.meetingLink;
                const notifId = item.id || item._id;

                return (
                  <div
                    key={notifId}
                    onClick={() => !item.read && handleMarkOneAsRead(notifId)}
                    className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-50 flex flex-col gap-1.5 ${
                      !item.read ? "bg-emerald-50/40 border-l-3 border-emerald-500" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border ${
                            isMeeting
                              ? "bg-purple-100 border-purple-200 text-purple-800"
                              : "bg-blue-100 border-blue-200 text-blue-800"
                          }`}
                        >
                          {isMeeting ? "Meeting" : item.type || "Update"}
                        </span>
                        {item.targetType === "ALL" ? (
                          <span className="text-[9px] font-semibold text-slate-500">
                            • All Staff
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-emerald-600">
                            • For You
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {item.message}
                    </p>

                    {/* Direct Meeting Link Button if applicable */}
                    {meetingLink && (
                      <div className="pt-1.5 flex items-center justify-between gap-2">
                        <a
                          href={meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
                        >
                          <Video size={12} />
                          <span>Join Meeting</span>
                          <ExternalLink size={10} />
                        </a>

                        {item.metadata?.startTime && (
                          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                            <Clock size={11} className="text-slate-400" />
                            {item.metadata.date ? `${item.metadata.date} ` : ""}
                            {item.metadata.startTime}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Updates automatically</span>
            <button
              onClick={fetchNotifications}
              className="text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
