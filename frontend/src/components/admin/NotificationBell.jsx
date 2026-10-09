import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
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
  Briefcase,
  Receipt,
  ExternalLink,
} from "lucide-react";

export default function NotificationBell({ className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const audioRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      let backendNotifs = [];
      try {
        const res = await apiClient.get("/admin/notifications?limit=30");
        backendNotifs = res.data?.notifications || [];
      } catch {}

      const localAdminNotifs = (crmVendorService.getAdminNotifications() || []).map((n) => ({
        _id: n.id,
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.timestamp,
        isRead: !!n.read,
        read: !!n.read,
        type: n.type || "INFO",
        link: n.link,
      }));

      const all = [...localAdminNotifs, ...backendNotifs];
      const seen = new Set();
      const merged = all.filter((n) => {
        const key = n._id || n.id || `${n.title}-${n.createdAt}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const unread = merged.filter((n) => !n.isRead && !n.read).length;
      setNotifications(merged);
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2000);
    return () => clearInterval(interval);
  }, []);

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
    } catch (err) {}
    try {
      crmVendorService.markAllAdminNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleMarkOneAsRead = async (id) => {
    try {
      if (id.startsWith('admin-notif-')) {
        crmVendorService.markAdminNotificationRead(id);
      } else {
        await apiClient.put(`/admin/notifications/${id}/read`);
      }
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
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

  const handleDeleteOne = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      if (id && !id.startsWith("admin-notif-")) {
        await apiClient.delete(`/admin/notifications/${id}`);
      }
      setNotifications((prev) => {
        const item = prev.find((n) => n._id === id || n.id === id);
        if (item && !item.read && !item.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== id && n.id !== id);
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);

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
          tag: "On Break",
        };
      case "BREAK_END":
        return {
          icon: <Briefcase size={15} className="text-blue-500" />,
          bg: "bg-blue-50 border-blue-200 text-blue-700",
          tag: "Back to Work",
        };
      case "LEAVE_APPLY":
        return {
          icon: <Calendar size={15} className="text-purple-500" />,
          bg: "bg-purple-50 border-purple-200 text-purple-700",
          tag: "Leave Request",
        };
      case "EXPENSE_CLAIM":
        return {
          icon: <Receipt size={15} className="text-emerald-500" />,
          bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
          tag: "Expense Claim",
        };
      default:
        return {
          icon: <Bell size={15} className="text-indigo-500" />,
          bg: "bg-indigo-50 border-indigo-200 text-indigo-700",
          tag: "Activity",
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={className || "relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center justify-center cursor-pointer border border-slate-200/80 shadow-xs focus:outline-none"}
        title="Live Notifications"
      >
        <Bell size={18} className={className ? "text-blue-200 hover:text-white" : "text-slate-700"} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-84 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {}
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

          {}
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
              notifications.slice(0, 5).map((item) => {
                const conf = getIconAndColor(item.type);
                const empDisplay = item.employeeName || (item.metadata?.name ? `${item.metadata.name} (${item.metadata.employeeId || "EMP"})` : null);
                return (
                  <div
                    key={item.id}
                    onClick={() => !item.read && handleMarkOneAsRead(item.id)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 group relative ${
                      !item.read ? "bg-cyan-50/40 border-l-3 border-cyan-500" : ""
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5 border border-slate-200">
                      {conf.icon}
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
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

                    <div className="flex flex-col items-end gap-1.5 shrink-0 mt-0.5">
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteOne(item.id || item._id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* View All & Footer */}
          <Link
            to="/admin/dashboard/announcements"
            onClick={() => setIsOpen(false)}
            className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 border-t border-blue-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>View All Notifications {notifications.length > 0 ? `(${notifications.length} Total)` : ""}</span>
            <ExternalLink size={12} />
          </Link>

          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Showing top 5 • Real-time</span>
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
