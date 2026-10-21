import React from "react";
import {
  LayoutDashboard,
  Clock,
  Calendar,
  LogIn,
  Coffee,
  CalendarPlus,
  FileText,
  Video,
  Receipt,
  User,
  LogOut,
  X,
  ChevronRight,
  ShieldCheck,
  BellRing
} from "lucide-react";
import { ImmiGoLogo, EmployeeIdBadge } from "../../common/ImmiGoLogo.jsx";

export default function EmpSidebar({
  view,
  setView,
  onLogout,
  user,
  status = "Checked Out",
  statusColor = "bg-slate-400",
  sidebarOpen,
  setSidebarOpen,
}) {
  const navSections = [
    {
      title: "Main",
      items: [
        { key: "home", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Attendance & Leaves",
      items: [
        { key: "checkinout", label: "Check In / Out", icon: LogIn },
        { key: "calendar", label: "Attendance Calendar", icon: Calendar },
        { key: "leaves", label: "Leave Management", icon: CalendarPlus },
      ],
    },
    {
      title: "Work & Communication",
      items: [
        { key: "meetings", label: "Meetings", icon: Video },
        { key: "announcements", label: "Announcements", icon: BellRing },
        { key: "expenses", label: "Expenses & Claims", icon: Receipt },
        { key: "profile-docs", label: "Profile & Documents", icon: User },
      ],
    },
  ];

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col shrink-0 w-64 sm:w-72 bg-gradient-to-b from-[#eef5ff] via-[#e4f0fe] to-[#edf5ff] text-slate-800 border-r border-blue-200/90 shadow-lg transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="h-[52px] min-h-[52px] px-5 border-b border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <ImmiGoLogo size="sm" subtitle="Employee Dashboard" theme="light" />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-7 h-7 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 rounded-lg cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>


        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 custom-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 mb-2 text-xs font-extrabold uppercase tracking-wider text-blue-900/70">
                {section.title}
              </div>
              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    view === item.key ||
                    (item.key === "home" && (view === "tracker" || view === "breaks")) ||
                    (item.key === "leaves" && (view === "apply-leave" || view === "leave-history"));
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setView(item.key);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-[13px] transition-all duration-150 cursor-pointer group ${isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 font-bold"
                        : "text-slate-700 hover:text-blue-950 hover:bg-white/90 font-bold"
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={18}
                          className={`shrink-0 transition-colors ${isActive
                            ? "text-white"
                            : "text-blue-600/70 group-hover:text-blue-800"
                            }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="h-[48px] min-h-[48px] px-3 border-t border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-center shadow-md">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 hover:text-white border border-rose-400/30 transition-all cursor-pointer shadow-2xs group"
            title="Sign Out"
          >
            <LogOut size={13} className="text-rose-400 group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
