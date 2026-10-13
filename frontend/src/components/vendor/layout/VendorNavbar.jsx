import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  User,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  ExternalLink,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService.js";

export function VendorNavbar({ mobileOpen, setMobileOpen, vendor, title = "Vendor Portal" }) {
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const vendorName = vendor?.companyName || "Vendor Partner";
  const vendorId = vendor?.id || "VND-1001";

  const refreshNotifications = async () => {
    try {
      const list = await crmVendorService.getNotificationsAsync(vendor?.id);
      setNotifications(list || []);
    } catch {
      const local = crmVendorService.getNotifications(vendor?.id);
      setNotifications(local || []);
    }
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 3000);
    return () => clearInterval(interval);
  }, [vendor?.id]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    crmVendorService.markAllNotificationsRead(vendor?.id);
    setTimeout(refreshNotifications, 100);
  };

  const handleDeleteOne = (notifId, e) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== notifId && n._id !== notifId));
    crmVendorService.deleteNotification(notifId, vendor?.id);
    setTimeout(refreshNotifications, 100);
  };

  const handleClearAll = () => {
    setNotifications([]);
    crmVendorService.clearAllNotifications(vendor?.id);
    setTimeout(refreshNotifications, 100);
  };

  const handleNotificationClick = (notif) => {
    const notifId = notif.id || notif._id;
    crmVendorService.markNotificationRead(notifId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId || n._id === notifId ? { ...n, read: true } : n))
    );
    setShowNotifications(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diffMs = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diffMs)) return "";
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
    <header className="h-16 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white border-b border-blue-800/80 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-md font-sans">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-indigo-900/50 rounded-xl cursor-pointer"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-indigo-900/60">
            <Building2 size={18} className="text-blue-400" />
            <span className="text-xs font-bold text-slate-300">Vendor Operations</span>
          </div>
          <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Vendor Info, Notifications, Profile, Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Vendor Header Pill */}
        <div className="hidden md:flex flex-col text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-xs font-bold text-white max-w-[180px] truncate leading-tight">
              {vendorName}
            </span>
            {vendor?.status === "Pending MOU Approval" || (vendor?.mouSigned && vendor?.status !== "Approved") ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                Pending MOU Approval
              </span>
            ) : vendor?.status === "Approved" ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                Approved
              </span>
            ) : null}
          </div>
          <span className="text-[10px] font-mono font-semibold text-blue-400">
            ID: {vendorId}
          </span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-300 hover:text-white hover:bg-indigo-900/50 rounded-xl transition-colors cursor-pointer border border-blue-700/60 bg-blue-900/40"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-md animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Notifications</span>
                  {unreadCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                      {unreadCount} New
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                      {notifications.length} Total
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                      title="Mark all as read"
                    >
                      Read all
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Clear all notifications"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <Bell size={24} className="mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-xs">No notifications</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">MOU, candidate status and payment updates will appear here.</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const notifId = n.id || n._id;
                    return (
                      <div
                        key={notifId}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-2.5 group relative ${
                          !n.read ? "bg-blue-50/40 border-l-3 border-blue-600" : ""
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {n.type === "success" && <CheckCircle2 size={15} className="text-emerald-500" />}
                          {n.type === "warning" && <AlertTriangle size={15} className="text-amber-500" />}
                          {n.type === "error" && <X size={15} className="text-rose-500" />}
                          {n.type === "info" && <Info size={15} className="text-blue-500" />}
                          {!["success", "warning", "error", "info"].includes(n.type) && (
                            <Info size={15} className="text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className="font-bold text-slate-900 truncate text-[11px]">{n.title}</h5>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">
                              {formatTimeAgo(n.timestamp || n.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 mt-0.5">
                          {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteOne(notifId, e)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                            title="Delete notification"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Link */}
        <Link
          to="/vendor/profile"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-700/50 bg-indigo-950/40 hover:bg-indigo-900/60 text-slate-200 transition-colors text-xs font-semibold cursor-pointer"
          title="Vendor Profile"
        >
          <User size={15} className="text-blue-400" />
          <span className="hidden sm:inline">Profile</span>
        </Link>

      </div>
    </header>
  );
}

export default VendorNavbar;
