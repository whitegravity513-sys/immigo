import React from "react";
import { Menu, Bell, CheckCircle2 } from "lucide-react";

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
  return (
    <header className="h-[52px] min-h-[52px] px-4 sm:px-6 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 border-b border-blue-800/80 text-white flex items-center justify-between shrink-0 z-30 shadow-xs">
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
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Status: {accountStatus}</span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifDropdownOpen((prev) => !prev)}
            className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition flex items-center justify-center"
            title="Notifications"
          >
            <Bell size={16} />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 text-slate-800 overflow-hidden">
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-cyan-400" />
                  <span className="text-xs font-semibold">Notifications</span>
                  {unreadNotifCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-semibold">
                      {unreadNotifCount} new
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setNotifDropdownOpen(false)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer font-medium"
                >
                  Close
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.read && onMarkNotificationRead(n.id)}
                      className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 ${
                        n.read ? "bg-white hover:bg-slate-50" : "bg-sky-50/70 hover:bg-sky-50"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.read ? "bg-slate-300" : "bg-blue-600 animate-pulse"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-semibold text-slate-900 truncate text-xs">
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
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
      </div>
    </header>
  );
}
