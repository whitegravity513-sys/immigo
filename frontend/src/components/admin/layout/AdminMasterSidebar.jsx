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
  Calendar,
  ArrowLeft,
  Activity,
  Layers,
  ExternalLink,
  FileCheck,
  CheckCircle2,
  History,
  User as UserIcon,
  Plane,
} from "lucide-react";
import { ImmiGoLogo, ImmiGoIcon } from "../../common/ImmiGoLogo.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { usePermissions } from "../../../context/PermissionContext.jsx";
import appConfig from "../../../config/appConfig.js";

export function AdminMasterSidebar({
  mobileOpen = false,
  setMobileOpen = () => {},
  collapsed = false,
  setCollapsed = () => {},
}) {
  const location = useLocation();
  const { user, logout, isVendorHR, isHR } = useAuth();
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
    if (path === "/hr/vendor-dashboard") {
      return currentPath.startsWith("/hr/vendor-dashboard");
    }
    if (path === "/admin/meetings" || path === "/hr/meetings") {
      return currentPath.includes("/meetings");
    }
    if (path === "/super-admin/permissions" || path === "/admin/permissions") {
      return (
        currentPath.startsWith("/super-admin/permissions") ||
        currentPath.startsWith("/admin/permissions") ||
        currentPath.startsWith("/super-admin/admins")
      );
    }
    if (path === "/admin/dashboard/workforce" || path === "/hr/dashboard") {
      return (
        currentPath.startsWith("/admin/dashboard/workforce") ||
        (currentPath.startsWith("/hr") &&
          !currentPath.includes("vendor-dashboard") &&
          !currentPath.includes("meetings"))
      );
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
    if (path.startsWith("/admin/hr-activities")) {
      const searchTab = new URLSearchParams(location.search).get("tab") || "vendorHRDashboard";
      const targetTab = new URLSearchParams(path.split("?")[1] || "").get("tab");
      const searchView = new URLSearchParams(location.search).get("view") || "overview";
      const targetView = new URLSearchParams(path.split("?")[1] || "").get("view");
      if (targetView) {
        return (
          currentPath.startsWith("/admin/hr-activities") &&
          searchTab === targetTab &&
          searchView === targetView
        );
      }
      if (targetTab) {
        return currentPath.startsWith("/admin/hr-activities") && searchTab === targetTab;
      }
      return currentPath.startsWith("/admin/hr-activities");
    }
    return currentPath === path;
  };

  const rawNavItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: isVendorHR
        ? "/hr/vendor-dashboard"
        : isSuperAdmin
        ? "/super-admin/dashboard"
        : isHR
        ? "/hr/dashboard"
        : "/admin/dashboard",
      alwaysVisible: true,
    },
    {
      title: "Assign to HR",
      icon: UserCheck,
      path: "/admin/hr-activities?tab=vendorHRDashboard&view=assignments",
      check: () => Boolean(isSuperAdmin || role === "ADMIN"),
      badge: "Allocation",
    },
    {
      title: "Vendor HR Dashboard",
      icon: ShieldCheck,
      path: isVendorHR ? "/hr/vendor-dashboard" : "/admin/hr-activities?tab=vendorHRDashboard&view=overview",
      badge: isVendorHR ? "" : "Live",
      check: () => Boolean(isSuperAdmin || role === "ADMIN" || isVendorHR),
    },
    {
      title: "HR Management",
      icon: Users,
      path: isHR ? "/hr/dashboard" : "/admin/dashboard/workforce",
      moduleId: "employees",
      check: () => !isVendorHR,
    },
    {
      title: "Vendor Management",
      icon: Briefcase,
      path: "/admin/vendor",
      moduleId: "vendors",
      check: () => true,
    },
    {
      title: "Client Management",
      icon: Building2,
      path: "/client/dashboard",
      moduleId: "clients",
      check: () => !isVendorHR,
    },
    {
      title: "Projects",
      icon: FolderKanban,
      path: "/client/projects",
      moduleId: "projects",
      check: () => !isVendorHR,
    },
    {
      title: "Candidate Management",
      icon: Users,
      path: "/admin/candidates/dashboard",
      moduleId: "candidates",
      check: () => !appConfig.FEATURE_FLAGS?.HIDE_CANDIDATE_MODULE,
    },
    {
      title: "Role & Permissions",
      icon: KeyRound,
      path: isSuperAdmin ? "/super-admin/permissions" : "/admin/permissions",
      check: () => Boolean(isSuperAdmin || role === "ADMIN"),
      badge: isSuperAdmin ? "Super" : "HR",
    },
    {
      title: "Meetings & Calendar",
      icon: Calendar,
      path: isHR ? "/hr/meetings" : "/admin/meetings",
      alwaysVisible: true,
    },
  ];

  // Filter items dynamically: check function takes highest priority
  const navItems = rawNavItems.filter((item) => {
    if (typeof item.check === "function") return item.check();
    if (item.alwaysVisible) return true;
    if (item.moduleId) return canAccessModule(item.moduleId);
    return true;
  });

  const currentView = new URLSearchParams(location.search).get("view") || "overview";
  const isHRActivitySection =
    currentPath.startsWith("/admin/hr-activities") && currentView !== "assignments";

  const hrActivityNavItems = [
    {
      title: "Overview",
      icon: LayoutDashboard,
      path: "/admin/hr-activities?tab=vendorHRDashboard&view=overview",
      view: "overview",
    },
    {
      title: "My Projects",
      icon: FolderKanban,
      path: "/admin/hr-activities?tab=vendorHRDashboard&view=projects",
      view: "projects",
    },
    {
      title: "Jobs",
      icon: Briefcase,
      path: "/admin/hr-activities?tab=vendorHRDashboard&view=jobs",
      view: "jobs",
    },
    {
      title: "Candidates",
      icon: Users,
      path: "/admin/hr-activities?tab=vendorHRDashboard&view=candidates",
      view: "candidates",
    },
    {
      title: "Recruitment Pipeline",
      icon: Layers,
      path: "/admin/hr-activities?tab=vendorHRDashboard&view=pipeline",
      view: "pipeline",
    },
    {
      title: "Interviews",
      icon: Calendar,
      path: "/admin/hr-activities?tab=vendorHRDashboard&view=interviews",
      view: "interviews",
    },
    {
      title: "Visa Issued & Granted",
      icon: Plane,
      path: "/admin/hr-activities?tab=vendorHRDashboard&view=visaIssued",
      view: "visaIssued",
    },
    {
      title: "Activity History",
      icon: History,
      path: "/admin/hr-activities?tab=vendorHRDashboard&view=activity",
      view: "activity",
    },
    {
      title: "Profile",
      icon: UserIcon,
      path: "/admin/hr-activities?tab=vendorHRDashboard&view=profile",
      view: "profile",
    },
  ];

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
          {isHRActivitySection ? (
            <>
              {/* Back to Main Admin Dashboard Button */}
              <div className="mb-2.5">
                <Link
                  to={isSuperAdmin ? "/super-admin/dashboard" : "/admin/dashboard"}
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
                <p className="text-[11px] font-bold text-blue-900/60 uppercase tracking-[0.14em] px-3 mb-2 mt-1">
                  Vendor HR Workspace
                </p>
              )}

              {hrActivityNavItems.map((item, idx) => {
                if (item.isHeader) {
                  if (collapsed) return <hr key={idx} className="border-blue-200/60 my-2" />;
                  return (
                    <p
                      key={idx}
                      className="text-[10px] font-extrabold text-blue-900/60 uppercase tracking-[0.14em] px-3 pt-3 pb-1"
                    >
                      {item.title}
                    </p>
                  );
                }

                const Icon = item.icon;
                const isItemActive = item.view
                  ? currentView === item.view || (item.view === "visaIssued" && currentView === "offers")
                  : isActive(item.path);

                return (
                  <Link
                    key={item.title}
                    to={item.path}
                    target={item.target}
                    onClick={() => setMobileOpen(false)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12.5px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                      isItemActive
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold"
                        : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-950"
                    }`}
                    title={collapsed ? item.title : undefined}
                  >
                    <Icon
                      size={15}
                      className={`shrink-0 ${isItemActive ? "text-white" : "text-slate-500"}`}
                    />
                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0 pr-1">
                        <span className="truncate">{item.title}</span>
                        {isItemActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </>
          ) : (
            <>
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
            </>
          )}
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
