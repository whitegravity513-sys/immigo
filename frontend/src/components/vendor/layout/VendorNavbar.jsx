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

  const refreshNotifications = () => {
    const list = crmVendorService.getNotifications(vendor?.id);
    setNotifications(list);
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 10000);
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
    crmVendorService.markAllNotificationsRead(vendor?.id);
    refreshNotifications();
  };

  const handleNotificationClick = (notif) => {
    crmVendorService.markNotificationRead(notif.id);
    refreshNotifications();
    setShowNotifications(false);
    if (notif.link) {
      navigate(notif.link);
    }
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
            className="relative p-2 text-slate-300 hover:text-white hover:bg-indigo-900/50 rounded-xl transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-indigo-950" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 text-xs">
              <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-2.5 ${
                        !n.read ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === "success" && <CheckCircle2 size={15} className="text-emerald-500" />}
                        {n.type === "warning" && <AlertTriangle size={15} className="text-amber-500" />}
                        {n.type === "error" && <X size={15} className="text-rose-500" />}
                        {n.type === "info" && <Info size={15} className="text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="font-bold text-slate-900 truncate text-[11px]">{n.title}</h5>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
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
