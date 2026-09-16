import { useState, useEffect, useRef } from "react";
import { apiClient } from "../../services/apiClient.js";
import {
  Bell,
  CheckCheck,
  Trash2,
  LogIn,
  LogOut,
  Coffee,
  Play,
  Calendar,
  Sparkles,
  X,
} from "lucide-react";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get("/admin/notifications?limit=25");
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Live polling every 10 seconds for real-time notification updates
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

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

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put("/admin/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOneAsRead = async (id) => {
    try {
      await apiClient.put(`/admin/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await apiClient.delete("/admin/notifications");
      setNotifications([]);
      setUnreadCount(0);
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

  const getIconAndColor = (type) => {
    switch (type) {
      case "CHECK_IN":
        return {
          icon: <LogIn size={15} className="text-emerald-500" />,
          bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
          tag: "Check In",
        };
      case "CHECK_OUT":
        return {
          icon: <LogOut size={15} className="text-rose-500" />,
          bg: "bg-rose-50 border-rose-200 text-rose-700",
          tag: "Check Out",
        };
      case "BREAK_START":
        return {
          icon: <Coffee size={15} className="text-amber-500" />,
          bg: "bg-amber-50 border-amber-200 text-amber-700",
          tag: "Break Start",
        };
      case "BREAK_END":
        return {
          icon: <Play size={15} className="text-cyan-500" />,
          bg: "bg-cyan-50 border-cyan-200 text-cyan-700",
          tag: "Break End",
        };
      case "LEAVE_APPLY":
        return {
          icon: <Calendar size={15} className="text-purple-500" />,
          bg: "bg-purple-50 border-purple-200 text-purple-700",
          tag: "Leave Request",
        };
      default:
        return {
          icon: <Sparkles size={15} className="text-blue-500" />,
          bg: "bg-blue-50 border-blue-200 text-blue-700",
          tag: "Notice",
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center justify-center cursor-pointer border border-slate-200/80 shadow-xs focus:outline-none"
        title="Live Notifications"
      >
        <Bell size={19} className="text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-84 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-200 text-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={17} className="text-indigo-600" />
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Live Activity Feed</h3>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                  {unreadCount} New
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/80 cursor-pointer font-medium"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} className="text-indigo-600" />
                  <span className="text-[11px]">Read All</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* List of Notifications */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">No recent activities</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Live check-ins, breaks & leave requests will appear here.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const conf = getIconAndColor(item.type);
                const empDisplay = item.employeeName || (item.metadata?.name ? `${item.metadata.name} (${item.metadata.employeeId || "EMP"})` : null);
                return (
                  <div
                    key={item.id}
                    onClick={() => !item.read && handleMarkOneAsRead(item.id)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 ${
                      !item.read ? "bg-cyan-50/40 border-l-3 border-cyan-500" : ""
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5 border border-slate-200">
                      {conf.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${conf.bg}`}
                          >
                            {conf.tag}
                          </span>
                          {empDisplay && (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200/80 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block"></span>
                              {empDisplay}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Auto-updates in real-time</span>
            <button
              onClick={fetchNotifications}
              className="text-cyan-600 hover:text-cyan-700 font-semibold cursor-pointer"
            >
              Refresh Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
