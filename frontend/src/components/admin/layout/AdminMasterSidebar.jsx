import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  Briefcase,
  Settings,
  LogOut,
  X,
  Shield,
  ShieldCheck,
  Receipt,
  UserCheck,
  KeyRound,
} from "lucide-react";
import { ImmiGoLogo, ImmiGoIcon } from "../../common/ImmiGoLogo.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { usePermissions } from "../../../context/PermissionContext.jsx";

export function AdminMasterSidebar({
  mobileOpen = false,
  setMobileOpen = () => {},
  collapsed = false,
  setCollapsed = () => {},
}) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { canAccessModule, isSuperAdmin, hasPermission, role } = usePermissions();
  const currentPath = location.pathname;

  const isActive = (path) => {
    if (!path) return false;
    if (path === "/admin/dashboard" || path === "/super-admin/dashboard") {
      return (
        currentPath === "/admin/dashboard" ||
        currentPath === "/super-admin/dashboard" ||
        currentPath === "/dashboard" ||
        currentPath === "/"
      );
    }
    if (path === "/super-admin/permissions" || path === "/admin/permissions") {
      return (
        currentPath.startsWith("/super-admin/permissions") ||
        currentPath.startsWith("/admin/permissions") ||
        currentPath.startsWith("/super-admin/admins")
      );
    }
    if (path === "/admin/dashboard/workforce") {
      return currentPath.startsWith("/admin/dashboard/workforce") || currentPath.startsWith("/hr");
    }
    if (path === "/client/dashboard") {
      return currentPath === "/client/dashboard" || currentPath.startsWith("/client/clients");
    }
    if (path === "/client/ledger") {
      return currentPath.startsWith("/client/ledger") || currentPath.startsWith("/admin/client-ledger");
    }
    if (path === "/client/projects") {
      return currentPath.startsWith("/client/projects") || currentPath.includes("/projects");
    }
    if (path === "/admin/vendor") {
      return currentPath.startsWith("/admin/vendor");
    }
    if (path === "/admin/candidates/dashboard") {
      return currentPath.startsWith("/admin/candidates");
    }
    if (path === "/admin/settings") {
      return currentPath.startsWith("/admin/settings");
    }
    return currentPath === path;
  };

  // Base navigation definition with module mappings
  const rawNavItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: isSuperAdmin ? "/super-admin/dashboard" : "/admin/dashboard",
      alwaysVisible: true,
    },
    {
      title: "HR Management",
      icon: Users,
      path: "/admin/dashboard/workforce",
      moduleId: "employees",
      check: () => true,
    },
    {
      title: "Client Management",
      icon: Building2,
      path: "/client/dashboard",
      moduleId: "clients",
      check: () => true,
    },
    {
      title: "Projects",
      icon: FolderKanban,
      path: "/client/projects",
      moduleId: "projects",
      check: () => true,
    },
    {
      title: "Vendor Management",
      icon: Briefcase,
      path: "/admin/vendor",
      moduleId: "vendors",
      check: () => true,
    },
    {
      title: "Candidate Management",
      icon: Users,
      path: "/admin/candidates/dashboard",
      moduleId: "candidates",
      check: () => true,
    },
    {
      title: "Permissions & Admins",
      icon: KeyRound,
      path: "/super-admin/permissions",
      check: () => Boolean(isSuperAdmin),
      badge: "Super",
    },
  ];

  // Filter items dynamically: check function takes highest priority
  const navItems = rawNavItems.filter((item) => {
    if (typeof item.check === "function") return item.check();
    if (item.alwaysVisible) return true;
    if (item.moduleId) return canAccessModule(item.moduleId);
    return true;
  });

  const adminName =
    (typeof user?.name === "string" ? user.name : user?.name?.first) ||
    user?.email?.split("@")[0] ||
    (isSuperAdmin ? "Super Admin" : "System Admin");

  const displayRole = isSuperAdmin
    ? "Super Admin"
    : role === "HR"
    ? "HR Manager"
    : "Administrator";

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
        {/* Top Header */}
        <div
          className={`h-[52px] min-h-[52px] px-4 border-b border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center gap-2 shadow-xs shrink-0 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {collapsed ? (
              <ImmiGoIcon size="md" />
            ) : (
              <ImmiGoLogo
                size="sm"
                subtitle={isSuperAdmin ? "Super Admin" : "Operations Portal"}
                theme="light"
              />
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden w-7 h-7 flex items-center justify-center text-blue-200 hover:text-white hover:bg-blue-800/60 rounded-lg cursor-pointer shrink-0"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Dynamic Navigation Items */}
        <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          {!collapsed && (
            <p className="text-[11px] font-bold text-blue-900/60 uppercase tracking-[0.14em] px-3 mb-2 mt-1">
              {isSuperAdmin ? "Super Admin Operations" : "Management Modules"}
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isItemActive = isActive(item.path);
            return (
              <Link
                key={item.title}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  isItemActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold"
                    : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-950"
                }`}
                title={collapsed ? item.title : undefined}
              >
                <Icon
                  size={16}
                  className={`shrink-0 ${isItemActive ? "text-white" : "text-slate-500"}`}
                />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0 pr-1">
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-sans shadow-2xs">
                        {item.badge}
                      </span>
                    )}
                    {isItemActive && !item.badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    )}
                  </div>
                )}
              </Link>
            );
          })}

        </div>

        {/* Footer matching Dashboard Footer height (48px) with clean Sign Out button */}
        <div className="h-[48px] min-h-[48px] border-t border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 px-3 flex items-center justify-center shadow-xs shrink-0">
          <button
            type="button"
            onClick={logout}
            className={`flex items-center justify-center gap-2 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-all duration-150 cursor-pointer active:scale-95 group ${
              collapsed ? "w-8 h-8 px-0" : "w-full px-3"
            }`}
            title="Sign Out"
          >
            <LogOut size={13} className="shrink-0 transition-transform group-hover:-translate-x-0.5" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminMasterSidebar;
