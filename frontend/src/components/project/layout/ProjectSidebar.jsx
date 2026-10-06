import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FolderKanban,
  FolderPlus,
  ArrowLeft,
  X,
  Shield,
  LogOut,
} from "lucide-react";
import { ImmiGoLogo, ImmiGoIcon } from "../../common/ImmiGoLogo.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";

export function ProjectSidebar({
  mobileOpen = false,
  setMobileOpen = () => {},
  collapsed = false,
  setCollapsed = () => {},
}) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path) => {
    if (path === "/client/projects") return currentPath === "/client/projects" || (currentPath.includes("/projects") && !currentPath.endsWith("/new"));
    if (path === "/client/projects/new") return currentPath.endsWith("/projects/new");
    return currentPath === path;
  };

  const adminName =
    (typeof user?.name === "string" ? user.name : user?.name?.first) ||
    user?.email?.split("@")[0] ||
    "Project Lead";

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
          collapsed ? "w-[72px]" : "w-[240px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand Top Bar — dark navy like HR */}
        <div
          className={`h-[68px] min-h-[68px] px-4 border-b border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center gap-2 shadow-xs shrink-0 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <Link
            to="/client/projects"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 min-w-0"
          >
            {collapsed ? (
              <ImmiGoIcon size="md" />
            ) : (
              <ImmiGoLogo size="sm" subtitle="Project Portal" theme="light" />
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

        {/* Nav Body */}
        <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          {/* Back Button */}
          <div className="mb-2.5">
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileOpen(false)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-bold text-blue-800 bg-white/90 hover:bg-white hover:text-blue-900 border border-blue-200/80 rounded-xl transition-colors shadow-2xs ${
                collapsed ? "justify-center" : ""
              }`}
              title="Return to Main Admin Dashboard"
            >
              <ArrowLeft size={13} className="shrink-0 text-blue-600" />
              {!collapsed && <span className="truncate">Main Admin Dashboard</span>}
            </Link>
          </div>

          {!collapsed && (
            <p className="text-[11px] font-extrabold text-blue-900/60 uppercase tracking-[0.14em] px-3 mb-2 mt-1">
              Project Management
            </p>
          )}

          {[
            { label: "All Projects", icon: FolderKanban, path: "/client/projects" },
            { label: "Add Project", icon: FolderPlus, path: "/client/projects/new" },
          ].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold"
                    : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-950"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={16} className={`shrink-0 ${active ? "text-white" : "text-slate-500"}`} />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0 pr-1">
                    <span className="truncate">{item.label}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer Bar — dark navy like HR */}
        <div
          className={`h-[48px] min-h-[48px] border-t border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 px-3.5 flex items-center shadow-xs text-blue-200 text-xs shrink-0 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!collapsed ? (
            <div className="flex items-center gap-1.5">
              <Shield size={10} className="text-cyan-400" />
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Project Portal</span>
            </div>
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active"></span>
          )}
        </div>
      </aside>
    </>
  );
}

export default ProjectSidebar;
