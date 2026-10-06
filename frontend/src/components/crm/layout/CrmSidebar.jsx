import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  X,
  ChevronRight,
  Shield,
  ArrowRightLeft,
  Sparkles,
  Plus,
  Users,
  Clock,
  UserCheck,
  FileText,
  Briefcase,
  Contact,
} from "lucide-react";
import { ImmiGoLogo, ImmiGoIcon } from "../../common/ImmiGoLogo.jsx";

export function CrmSidebar({
  mobileOpen = false,
  setMobileOpen = () => {},
  collapsed = false,
  setCollapsed = () => {},
  user,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isActive = (path) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard" || currentPath === "/";
    }
    if (path === "/clients") {
      return (
        currentPath === "/clients" ||
        (currentPath.startsWith("/clients/") && !currentPath.includes("/projects/"))
      );
    }
    if (path === "/projects") {
      return (
        currentPath === "/projects" ||
        currentPath === "/projects/new" ||
        currentPath.includes("/projects/")
      );
    }
    return currentPath === path;
  };

  const navItems = [
    {
      title: "Admin Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
  ];

  const clientManagementItems = [
    {
      title: "All Clients",
      icon: Building2,
      path: "/clients",
      addPath: "/clients/new",
      addTitle: "Add New Client",
      badge: null,
    },
    {
      title: "All Projects",
      icon: FolderKanban,
      path: "/projects",
      addPath: "/projects/new",
      addTitle: "Add New Project",
      badge: null,
    },
  ];

  const hrManagementItems = [
    {
      title: "HR Dashboard",
      icon: Users,
      path: "/admin/dashboard/workforce",
    },
    {
      title: "Attendance Register",
      icon: Clock,
      path: "/admin/dashboard/attendance-all",
    },
    {
      title: "Employees Directory",
      icon: UserCheck,
      path: "/admin/dashboard/employees",
    },
    {
      title: "Leave Approvals",
      icon: FileText,
      path: "/admin/dashboard/leaves",
    },
  ];

  const upcomingItems = [
    {
      title: "Vendor Network",
      icon: Briefcase,
      badge: "Soon",
    },
    {
      title: "Candidate Pool",
      icon: Contact,
      badge: "Soon",
    },
  ];

  const adminName =
    (typeof user?.name === "string" ? user.name : user?.name?.first) ||
    user?.email?.split("@")[0] ||
    "Operations Admin";

  const adminRole = "Super Admin";

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-2xs lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 flex flex-col shrink-0 h-screen bg-white border-r border-gray-200 transition-all duration-200 ease-in-out select-none shadow-xs ${
          collapsed ? "w-[72px]" : "w-[260px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand / Logo Top Bar */}
        <div className="h-16 px-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <Link
            to="/dashboard"
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
                    ImmiGo CRM
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
                    Manpower Supply
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

        {/* Navigation Body */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Main Dashboard item */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    active
                      ? "bg-blue-600 text-white shadow-2xs shadow-blue-500/30"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </Link>
              );
            })}
          </div>

          {/* Section: HR (Directly under Admin) */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                HR
              </p>
            )}

            {hrManagementItems.map((item) => {
              const active = currentPath === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    active
                      ? "bg-blue-600 text-white shadow-2xs shadow-blue-500/30"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </Link>
              );
            })}
          </div>

          {/* Section: Client (Under HR) */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Client
              </p>
            )}

            {clientManagementItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <div key={item.path} className="flex items-center gap-1 group">
                  <Link
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      active
                        ? "bg-blue-600 text-white shadow-2xs shadow-blue-500/30"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    title={collapsed ? item.title : undefined}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0 pr-1">
                        <span className="truncate">{item.title}</span>
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                      </div>
                    )}
                  </Link>

                  {!collapsed && item.addPath && (
                    <Link
                      to={item.addPath}
                      onClick={() => setMobileOpen(false)}
                      className={`p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer shrink-0 ${
                        active ? "text-blue-600 bg-blue-50/70" : ""
                      }`}
                      title={item.addTitle}
                    >
                      <Plus size={14} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {/* Section: Upcoming Modules */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Upcoming Modules
              </p>
            )}

            {upcomingItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-gray-400 bg-gray-50/50 cursor-not-allowed select-none"
                  title={`${item.title} (Phase 2)`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={16} className="shrink-0 text-gray-400" />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </div>
                  {!collapsed && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                      Soon
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Admin Profile */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/60">

          {/* Admin Profile Box */}
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
                  <Shield size={10} className="text-emerald-500" />
                  <span>{adminRole}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default CrmSidebar;
