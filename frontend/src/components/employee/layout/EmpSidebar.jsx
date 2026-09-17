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
  Briefcase,
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
  isSalesEmployee,
}) {
  const navSections = [
    {
      title: "Main",
      items: [
        { key: "home", label: "Dashboard", icon: LayoutDashboard },
        { key: "tracker", label: "Live Tracker", icon: Clock },
      ],
    },
    {
      title: "Attendance & Leaves",
      items: [
        { key: "checkinout", label: "Check In / Out", icon: LogIn },
        { key: "calendar", label: "Attendance Calendar", icon: Calendar },
        { key: "breaks", label: "Breaks & Timing", icon: Coffee },
        { key: "apply-leave", label: "Apply Leave", icon: CalendarPlus },
        { key: "leave-history", label: "Leave History", icon: FileText },
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
    ...(isSalesEmployee
      ? [
          {
            title: "Sales & Clients",
            items: [
              { key: "crm", label: "Lead Management CRM", icon: Briefcase, badge: "PRO" },
            ],
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col shrink-0 w-64 bg-[#0a0f1d] border-r border-slate-800 text-slate-300 shadow-2xl transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-[68px] min-h-[68px] px-5 border-b border-slate-800/80 bg-[#070b16] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImmiGoLogo size="sm" subtitle="Workforce Suite" theme="light" />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* User Card */}
        <div className="px-4 py-3.5 border-b border-slate-800/60 bg-[#0d1424]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-sm flex items-center justify-center shadow-md">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user?.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  (user?.name || "E")[0].toUpperCase()
                )}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0f1d] ${statusColor}`}
                title={status}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-white text-xs truncate leading-tight">
                {user?.name || "Employee"}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <EmployeeIdBadge id={user?.employeeId} size="xs" />
                <span className="text-[10px] text-slate-400 truncate">
                  {user?.department || "Staff"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav Items List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = view === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setView(item.key);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer group ${
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-bold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={16}
                          className={`shrink-0 transition-colors ${
                            isActive
                              ? "text-white"
                              : "text-slate-400 group-hover:text-blue-400"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
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

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-[#070b16] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-400">Portal v2.6</span>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
