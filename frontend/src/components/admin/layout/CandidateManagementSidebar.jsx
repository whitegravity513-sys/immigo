import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  FileCheck2,
  Briefcase,
  UserCheck,
  Calendar,
  Award,
  XCircle,
  X,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { ImmiGoLogo, ImmiGoIcon } from "../../common/ImmiGoLogo.jsx";

export function CandidateManagementSidebar({
  mobileOpen = false,
  setMobileOpen = () => {},
  collapsed = false,
  setCollapsed = () => {},
}) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => {
    if (path === "/admin/candidates/dashboard") {
      return (
        currentPath === "/admin/candidates" ||
        currentPath === "/admin/candidates/" ||
        currentPath === "/admin/candidates/dashboard"
      );
    }
    return currentPath === path;
  };

  const candidateSubmenuItems = [
    {
      title: "Candidate Dashboard",
      icon: LayoutDashboard,
      path: "/admin/candidates/dashboard",
    },
    {
      title: "New Registrations",
      icon: UserPlus,
      path: "/admin/candidates/new-registrations",
    },
    {
      title: "All Candidates",
      icon: Users,
      path: "/admin/candidates/all",
    },
    {
      title: "Document Verification",
      icon: FileCheck2,
      path: "/admin/candidates/documents",
    },
    {
      title: "Job Applications",
      icon: Briefcase,
      path: "/admin/candidates/applications",
    },
    {
      title: "Shortlisted Candidates",
      icon: UserCheck,
      path: "/admin/candidates/shortlisted",
    },
    {
      title: "Interviews",
      icon: Calendar,
      path: "/admin/candidates/interviews",
    },
    {
      title: "Selected Candidates",
      icon: Award,
      path: "/admin/candidates/selected",
    },
    {
      title: "Rejected Applications",
      icon: XCircle,
      path: "/admin/candidates/rejected",
    },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 flex flex-col shrink-0 h-screen bg-gradient-to-b from-[#eef5ff] via-[#e8f2fe] to-[#edf4fe] text-slate-800 transition-all duration-300 ease-in-out border-r border-blue-200/80 shadow-[1px_0_6px_rgba(37,99,235,0.06)] select-none ${
          collapsed ? "w-[72px]" : "w-[250px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div
          className={`h-[60px] min-h-[60px] px-4 border-b border-blue-900 bg-gradient-to-r from-[#0f2744] via-[#163660] to-[#0f2744] text-white flex items-center gap-2 shadow-xs shrink-0 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <Link
            to="/admin/candidates/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 min-w-0"
          >
            {collapsed ? (
              <ImmiGoIcon size="md" />
            ) : (
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-white leading-tight">
                  Candidate Portal
                </span>
                <span className="text-[10px] text-sky-300 font-semibold uppercase tracking-wider">
                  Admin Management
                </span>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden w-7 h-7 flex items-center justify-center text-blue-200 hover:text-white hover:bg-blue-800/60 rounded-lg cursor-pointer shrink-0"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="mb-2">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-100/60 transition-colors"
            >
              <ArrowLeft size={14} />
              {!collapsed && <span>Back to Main Admin</span>}
            </Link>
          </div>

          {!collapsed && (
            <p className="text-[11px] font-extrabold text-blue-900/70 uppercase tracking-[0.14em] px-3 mb-2 mt-2">
              Candidate Operations
            </p>
          )}

          {candidateSubmenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                  active
                    ? "bg-[#0f2744] text-white shadow-sm font-semibold"
                    : "text-slate-700 hover:bg-blue-100/70 hover:text-[#0f2744]"
                }`}
                title={collapsed ? item.title : undefined}
              >
                <Icon
                  size={17}
                  className={`shrink-0 ${active ? "text-sky-300" : "text-slate-500"}`}
                />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0 pr-1">
                    <span className="truncate">{item.title}</span>
                    {active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        <div
          className={`h-[48px] min-h-[48px] border-t border-blue-900 bg-gradient-to-r from-[#0f2744] via-[#163660] to-[#0f2744] px-3.5 flex items-center shadow-xs text-blue-200 text-xs shrink-0 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!collapsed ? (
            <div className="flex items-center gap-1.5">
              <Shield size={12} className="text-sky-400" />
              <span className="text-[11px] font-bold text-sky-200 uppercase tracking-wider">
                Candidate Module Active
              </span>
            </div>
          ) : (
            <span
              className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
              title="Module Active"
            />
          )}
        </div>
      </aside>
    </>
  );
}

export default CandidateManagementSidebar;
