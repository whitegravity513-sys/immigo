import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserPlus,
  Clock,
  FileText,
  FileCheck,
  Building,
  Award,
  BarChart3,
  ArrowLeft,
  X,
  Shield,
  LogOut,
} from "lucide-react";
import { ImmiGoLogo, ImmiGoIcon } from "../../common/ImmiGoLogo.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";

export function HrSidebar({
  mobileOpen = false,
  setMobileOpen = () => {},
  collapsed = false,
  setCollapsed = () => {},
}) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const currentPath = location.pathname;

  const hrNavItems = [
    {
      title: "HR Dashboard",
      icon: LayoutDashboard,
      path: "/hr/dashboard",
    },
    {
      title: "Employees (CRM)",
      icon: UserCheck,
      path: "/employee/dashboard",
    },
    {
      title: "Workforce Directory",
      icon: Users,
      path: "/admin/dashboard/employees",
    },
    {
      title: "Employee Onboarding",
      icon: UserPlus,
      path: "/admin/dashboard/workforce",
    },
    {
      title: "Attendance",
      icon: Clock,
      path: "/admin/dashboard/attendance-all",
    },
    {
      title: "Leaves",
      icon: FileText,
      path: "/admin/dashboard/leaves",
    },
    {
      title: "Documents",
      icon: FileCheck,
      path: "/admin/dashboard/workforce",
    },
    {
      title: "Departments",
      icon: Building,
      path: "/admin/dashboard/workforce",
    },
    {
      title: "Designations",
      icon: Award,
      path: "/admin/dashboard/workforce",
    },
    {
      title: "Reports",
      icon: BarChart3,
      path: "/admin/dashboard/monthly-report",
    },
  ];

  const adminName =
    (typeof user?.name === "string" ? user.name : user?.name?.first) ||
    user?.email?.split("@")[0] ||
    "HR Admin";

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-2xs lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 flex flex-col shrink-0 h-screen bg-white border-r border-gray-200 transition-all duration-200 ease-in-out select-none shadow-xs ${
          collapsed ? "w-[72px]" : "w-[260px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand Top Bar */}
        <div className="h-16 px-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <Link
            to="/hr/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 min-w-0"
          >
            {collapsed ? (
              <ImmiGoIcon size="md" />
            ) : (
              <div className="flex items-center gap-2.5">
                <ImmiGoIcon size="md" />
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm text-gray-900 tracking-tight leading-tight">
                    ImmiGo HR
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                    Workforce Portal
                  </span>
                </div>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Back to Main Admin Button */}
        <div className="px-3 pt-3">
          <Link
            to="/admin/dashboard"
            onClick={() => setMobileOpen(false)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-gray-600 hover:text-blue-700 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
            title="Return to Main Admin Dashboard"
          >
            <ArrowLeft size={14} className="shrink-0 text-blue-600" />
            {!collapsed && <span className="truncate">Main Admin Dashboard</span>}
          </Link>
        </div>

        {/* Navigation List */}
        <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          {!collapsed && (
            <p className="px-3 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
              HR Operations
            </p>
          )}

          {hrNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <Link
                key={item.title}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-2xs shadow-blue-500/30"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
                title={collapsed ? item.title : undefined}
              >
                <Icon size={17} className={`shrink-0 ${isActive ? "text-white" : "text-gray-500"}`} />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0 pr-1">
                    <span className="truncate">{item.title}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Profile Footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/60 space-y-2 shrink-0">
          <div
            className={`flex items-center gap-2.5 p-2 rounded-lg bg-white border border-gray-200 shadow-2xs ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {adminName.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-gray-900 truncate leading-tight">
                  {adminName}
                </div>
                <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                  <Shield size={10} className="text-blue-600" />
                  <span>HR Administrator</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={logout}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ${
              collapsed ? "justify-center" : ""
            }`}
            title="Sign Out"
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default HrSidebar;
