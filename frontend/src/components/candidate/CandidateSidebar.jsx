import React from "react";
import {
  User,
  LayoutDashboard,
  Upload,
  Briefcase,
  Calendar,
  Award,
  LogOut,
  X,
} from "lucide-react";

export default function CandidateSidebar({
  candidate,
  user,
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  onLogout,
  projectsCount = 0,
  applicationsCount = 0,
  selectedAppsCount = 0,
}) {
  const completionPercent = candidate?.profile?.profileCompletionPercent || 20;

  const navItems = [
    { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
    { id: "profile", label: "Complete Profile", icon: User },
    { id: "documents", label: "Upload Documents", icon: Upload },
    { id: "jobs", label: "Available Jobs", icon: Briefcase, badge: projectsCount },
    { id: "applications", label: "My Applications", icon: Calendar, badge: applicationsCount },
    { id: "processing", label: "Processing & Milestones", icon: Award, badge: selectedAppsCount },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#F3F7FC] border-r border-blue-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-[52px] min-h-[52px] flex items-center justify-between px-4 border-b border-blue-800/80 shrink-0 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-900/70 border border-blue-700/50 text-cyan-400 flex items-center justify-center font-semibold shadow-xs">
              <User size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 leading-none">
                <span className="font-bold text-white text-sm tracking-tight">immi</span>
                <span className="font-bold text-cyan-400 text-sm tracking-tight">Go</span>
              </div>
              <span className="text-[10px] uppercase font-semibold text-blue-200/80 tracking-wider mt-0.5">
                Candidate Portal
              </span>
            </div>
          </div>

          {mobileOpen && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-blue-200 hover:text-white rounded-lg cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="p-3 mx-3 mt-3 bg-blue-100/70 rounded-xl border border-blue-200 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {(candidate?.fullName || user?.name || "C").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-slate-900 truncate leading-tight">
                {candidate?.fullName || user?.name || "Candidate"}
              </h4>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] font-medium text-slate-600 truncate">
                  {candidate?.email || user?.email}
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 1024) setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all duration-150 cursor-pointer ${
                  active
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-800 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={15} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                      active
                        ? "bg-white text-blue-700"
                        : "bg-blue-200 text-blue-900"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="h-[48px] min-h-[48px] px-4 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 border-t border-blue-800/80 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Profile: {completionPercent}%</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1 text-[11px] font-medium text-rose-300 hover:text-white transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
