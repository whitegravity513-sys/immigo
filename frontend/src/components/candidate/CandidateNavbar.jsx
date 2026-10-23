import React, { useRef, useEffect } from "react";
import { Menu, Bell } from "lucide-react";
import UnifiedNotificationPopover from "../common/UnifiedNotificationPopover.jsx";

export default function CandidateNavbar({
  activeTabTitle = "Candidate Portal",
  accountStatus = "Active",
  unreadNotifCount = 0,
  notifications = [],
  notifDropdownOpen = false,
  setNotifDropdownOpen = () => {},
  onMarkNotificationRead = () => {},
  onOpenMobile = () => {},
}) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    }
    if (notifDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifDropdownOpen, setNotifDropdownOpen]);

  return (
    <header className="h-[52px] min-h-[52px] px-4 sm:px-6 bg-gradient-to-r from-[#0f274a] via-[#163868] to-[#1e4a82] border-b border-blue-900/60 text-white flex items-center justify-between shrink-0 z-30 shadow-xs">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-1.5 text-white hover:bg-white/10 rounded-lg cursor-pointer"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-xs sm:text-sm font-semibold text-white tracking-tight">
          {activeTabTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-cyan-300 border border-white/15 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Status: {accountStatus}</span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setNotifDropdownOpen((prev) => !prev)}
            className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition flex items-center justify-center"
            title="Notifications"
          >
            <Bell size={16} />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
              </span>
            )}
          </button>

          <UnifiedNotificationPopover
            isOpen={notifDropdownOpen}
            onClose={() => setNotifDropdownOpen(false)}
            notifications={notifications}
            unreadCount={unreadNotifCount}
            onMarkOneRead={onMarkNotificationRead}
            onMarkAllRead={() => {
              notifications.forEach((n) => {
                if (!n.read) onMarkNotificationRead(n.id || n._id);
              });
            }}
          />
        </div>
      </div>
    </header>
  );
}
