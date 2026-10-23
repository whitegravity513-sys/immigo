import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  User,
  Building2,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService.js";
import UnifiedNotificationPopover from "../../common/UnifiedNotificationPopover.jsx";

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

  const handleDeleteOne = (notifId, e) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== notifId && n._id !== notifId));
    crmVendorService.deleteNotification(notifId, vendor?.id);
    setTimeout(refreshNotifications, 100);
  };

  return (
    <header className="h-16 bg-gradient-to-r from-[#0f274a] via-[#163868] to-[#1e4a82] text-white border-b border-blue-900/60 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-xs font-sans">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-white/15">
            <Building2 size={18} className="text-cyan-300" />
            <span className="text-xs font-bold text-slate-200">Vendor Operations</span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
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
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
                Approved
              </span>
            ) : null}
          </div>
          <span className="text-[10px] font-mono font-semibold text-cyan-300">
            ID: {vendorId}
          </span>
        </div>

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer border border-white/15 bg-white/5"
            title="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <UnifiedNotificationPopover
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={handleMarkAllRead}
            onClearAll={handleClearAll}
            onMarkOneRead={(id) => {
              crmVendorService.markNotificationRead(id);
              setNotifications((prev) =>
                prev.map((n) => (n.id === id || n._id === id ? { ...n, read: true } : n))
              );
            }}
            onDeleteOne={handleDeleteOne}
            onItemClick={handleNotificationClick}
            viewAllLink="/vendor/candidates/selected"
          />
        </div>

        <Link
          to="/vendor/profile"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-slate-100 transition-colors text-xs font-semibold cursor-pointer"
          title="Vendor Profile"
        >
          <User size={15} className="text-cyan-300" />
          <span className="hidden sm:inline">Profile</span>
        </Link>
      </div>
    </header>
  );
}

export default VendorNavbar;
