import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  XCircle,
  Clock,
  CreditCard,
  Sliders,
  FileText,
  ArrowLeft,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Ban,
  LogOut,
} from "lucide-react";
import { ImmiGoLogo, ImmiGoIcon } from "../../common/ImmiGoLogo.jsx";
import { useAuth } from "../../../context/useAuth.js";

export function VendorManagementSidebar({
  mobileOpen = false,
  setMobileOpen = () => { },
  collapsed = false,
}) {
  const { logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isVendorsActive =
    currentPath.includes("/vendors") || currentPath === "/admin/vendor/vendors";

  const isCandidatesActive =
    currentPath.includes("/candidates") ||
    currentPath.includes("/submissions") ||
    currentPath.includes("/selected") ||
    currentPath.includes("/rejected");

  const isProcessActive =
    currentPath.includes("/processing") || currentPath.includes("/milestones");

  const isPaymentsActive = currentPath.includes("/payments");
  const isRefundsActive = currentPath.includes("/refunds");

  const [vendorsMenuOpen, setVendorsMenuOpen] = useState(isVendorsActive);
  const [candidatesMenuOpen, setCandidatesMenuOpen] = useState(true);
  const [processMenuOpen, setProcessMenuOpen] = useState(isProcessActive);

  const isActive = (path) => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab")?.toLowerCase() || "";

    if (path === "/admin/vendor/dashboard") {
      return (
        currentPath === "/admin/vendor" ||
        currentPath === "/admin/vendor/" ||
        currentPath === "/admin/vendor/dashboard"
      );
    }
    if (path === "/admin/vendor/candidates") {
      return (
        currentPath === "/admin/vendor/candidates" &&
        (!tabParam || tabParam === "all")
      );
    }
    if (path === "/admin/vendor/candidates?tab=shortlisted") {
      return (
        currentPath === "/admin/vendor/candidates" &&
        tabParam === "shortlisted"
      );
    }
    if (path === "/admin/vendor/candidates?tab=on+hold") {
      return (
        currentPath === "/admin/vendor/candidates" &&
        (tabParam === "on hold" || tabParam === "on-hold" || tabParam === "hold")
      );
    }
    if (path === "/admin/vendor/selected") {
      return currentPath.includes("/selected");
    }
    if (path === "/admin/vendor/rejected") {
      return currentPath.includes("/rejected");
    }
    if (path === "/admin/vendor/milestones") {
      return currentPath.includes("/milestones");
    }
    if (path === "/admin/vendor/processing") {
      return currentPath.includes("/processing");
    }
    if (path === "/admin/vendor/payments") {
      return (
        currentPath.includes("/payments") &&
        (!location.search || location.search === "?tab=pending")
      );
    }
    if (path === "/admin/vendor/refunds") {
      return currentPath.includes("/refunds");
    }
    if (path === "/admin/vendor/vendors?tab=all") {
      return (
        currentPath === "/admin/vendor/vendors" &&
        (!location.search || location.search === "?tab=all")
      );
    }
    if (path === "/admin/vendor/vendors?tab=registered") {
      return (
        currentPath === "/admin/vendor/vendors" &&
        (location.search === "?tab=registered" || location.search === "?tab=pending")
      );
    }
    const [pathname, search] = path.split("?");
    if (search) {
      return currentPath === pathname && location.search === `?${search}`;
    }
    return currentPath === pathname && !location.search;
  };

  const mainNavItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/admin/vendor/dashboard" },
  ];

  const vendorSubItems = [
    { title: "All Vendors", icon: Building2, path: "/admin/vendor/vendors?tab=all" },
    { title: "Registered (Pending)", icon: Clock, path: "/admin/vendor/vendors?tab=registered" },
    { title: "MOU In-Process", icon: FileText, path: "/admin/vendor/vendors?tab=mou" },
    { title: "Verified & Approved", icon: UserCheck, path: "/admin/vendor/vendors?tab=approved" },
    { title: "Suspended", icon: Ban, path: "/admin/vendor/vendors?tab=suspended" },
    { title: "Rejected", icon: XCircle, path: "/admin/vendor/vendors?tab=rejected" },
  ];

  const candidateSubItems = [
    { title: "All Candidates", icon: Users, path: "/admin/vendor/candidates" },
    { title: "Shortlisted", icon: Clock, path: "/admin/vendor/candidates?tab=shortlisted" },
    { title: "Selected", icon: UserCheck, path: "/admin/vendor/selected" },
    { title: "On Hold", icon: Clock, path: "/admin/vendor/candidates?tab=on+hold" },
    { title: "Rejected", icon: XCircle, path: "/admin/vendor/rejected" },
  ];

  const processSubItems = [
    { title: "Milestones", icon: Sliders, path: "/admin/vendor/milestones" },
    { title: "Process Timeline", icon: Clock, path: "/admin/vendor/processing" },
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
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 flex flex-col shrink-0 h-[100dvh] bg-gradient-to-b from-[#eef5ff] via-[#e8f2fe] to-[#edf4fe] text-slate-800 transition-all duration-300 ease-in-out border-r border-blue-200/80 shadow-[1px_0_6px_rgba(37,99,235,0.06)] select-none ${
          collapsed ? "w-[72px]" : "w-[240px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div
          className={`h-[52px] min-h-[52px] px-4 border-b border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center gap-2 shadow-xs shrink-0 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <Link
            to="/admin/vendor/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 min-w-0"
          >
            {collapsed ? (
              <ImmiGoIcon size="md" />
            ) : (
              <ImmiGoLogo size="sm" subtitle="Vendor Portal" theme="light" />
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

        <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
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
            <p className="text-[11px] font-bold text-blue-900/60 uppercase tracking-[0.14em] px-3 mb-2 mt-1">
              Vendor Management
            </p>
          )}

          {mainNavItems.map((item) => {
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
                title={collapsed ? item.title : undefined}
              >
                <Icon size={16} className={`shrink-0 ${active ? "text-white" : "text-slate-500"}`} />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0 pr-1">
                    <span className="truncate">{item.title}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                  </div>
                )}
              </Link>
            );
          })}

          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => { if (!collapsed) setVendorsMenuOpen(!vendorsMenuOpen); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                isVendorsActive
                  ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25"
                  : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-950"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Building2
                  size={16}
                  className={`shrink-0 ${isVendorsActive ? "text-white" : "text-slate-500"}`}
                />
                {!collapsed && <span className="truncate font-semibold">Vendors</span>}
              </div>
              {!collapsed && (
                vendorsMenuOpen ? (
                  <ChevronDown size={14} className={`shrink-0 ${isVendorsActive ? "text-white" : "text-slate-500"}`} />
                ) : (
                  <ChevronRight size={14} className={`shrink-0 ${isVendorsActive ? "text-white" : "text-slate-400"}`} />
                )
              )}
            </button>
            {!collapsed && (vendorsMenuOpen || isVendorsActive) && (
              <div className="ml-3.5 pl-3 border-l-2 border-blue-400 space-y-1 my-1">
                {vendorSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const active = isActive(sub.path);
                  return (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      onClick={() => setMobileOpen(false)}
                      className={`relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-semibold transition-all duration-150 ${
                        active
                          ? "bg-blue-100/90 text-blue-950 font-bold shadow-xs shadow-blue-500/10"
                          : "text-slate-600 hover:bg-blue-100/60 hover:text-blue-900"
                      }`}
                    >
                      {active && (
                        <span className="absolute -left-[14px] top-1.5 bottom-1.5 w-[3px] bg-blue-600 rounded-full" />
                      )}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SubIcon
                          size={14}
                          className={`shrink-0 ${active ? "text-blue-700" : "text-slate-500"}`}
                        />
                        <span className="truncate">{sub.title}</span>
                      </div>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => { if (!collapsed) setCandidatesMenuOpen(!candidatesMenuOpen); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                isCandidatesActive
                  ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25"
                  : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-950"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Users
                  size={16}
                  className={`shrink-0 ${isCandidatesActive ? "text-white" : "text-slate-500"}`}
                />
                {!collapsed && <span className="truncate font-semibold">Candidates</span>}
              </div>
              {!collapsed && (
                candidatesMenuOpen ? (
                  <ChevronDown size={14} className={`shrink-0 ${isCandidatesActive ? "text-white" : "text-slate-500"}`} />
                ) : (
                  <ChevronRight size={14} className={`shrink-0 ${isCandidatesActive ? "text-white" : "text-slate-400"}`} />
                )
              )}
            </button>
            {!collapsed && (candidatesMenuOpen || isCandidatesActive) && (
              <div className="ml-3.5 pl-3 border-l-2 border-blue-400 space-y-1 my-1">
                {candidateSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const active = isActive(sub.path);
                  return (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      onClick={() => setMobileOpen(false)}
                      className={`relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-semibold transition-all duration-150 ${
                        active
                          ? "bg-blue-100/90 text-blue-950 font-bold shadow-xs shadow-blue-500/10"
                          : "text-slate-600 hover:bg-blue-100/60 hover:text-blue-900"
                      }`}
                    >
                      {active && (
                        <span className="absolute -left-[14px] top-1.5 bottom-1.5 w-[3px] bg-blue-600 rounded-full" />
                      )}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SubIcon
                          size={14}
                          className={`shrink-0 ${active ? "text-blue-700" : "text-slate-500"}`}
                        />
                        <span className="truncate">{sub.title}</span>
                      </div>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => { if (!collapsed) setProcessMenuOpen(!processMenuOpen); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                isProcessActive
                  ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25"
                  : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-950"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Sliders
                  size={16}
                  className={`shrink-0 ${isProcessActive ? "text-white" : "text-slate-500"}`}
                />
                {!collapsed && <span className="truncate font-semibold">Candidate Process</span>}
              </div>
              {!collapsed && (
                processMenuOpen ? (
                  <ChevronDown size={14} className={`shrink-0 ${isProcessActive ? "text-white" : "text-slate-500"}`} />
                ) : (
                  <ChevronRight size={14} className={`shrink-0 ${isProcessActive ? "text-white" : "text-slate-400"}`} />
                )
              )}
            </button>
            {!collapsed && (processMenuOpen || isProcessActive) && (
              <div className="ml-3.5 pl-3 border-l-2 border-blue-400 space-y-1 my-1">
                {processSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const active = isActive(sub.path);
                  return (
                    <Link
                      key={sub.title}
                      to={sub.path}
                      onClick={() => setMobileOpen(false)}
                      className={`relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-semibold transition-all duration-150 ${
                        active
                          ? "bg-blue-100/90 text-blue-950 font-bold shadow-xs shadow-blue-500/10"
                          : "text-slate-600 hover:bg-blue-100/60 hover:text-blue-900"
                      }`}
                    >
                      {active && (
                        <span className="absolute -left-[14px] top-1.5 bottom-1.5 w-[3px] bg-blue-600 rounded-full" />
                      )}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SubIcon
                          size={14}
                          className={`shrink-0 ${active ? "text-blue-700" : "text-slate-500"}`}
                        />
                        <span className="truncate">{sub.title}</span>
                      </div>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            to="/admin/vendor/payments"
            onClick={() => setMobileOpen(false)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
              isPaymentsActive
                ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25"
                : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-950"
            }`}
          >
            <CreditCard
              size={16}
              className={`shrink-0 ${isPaymentsActive ? "text-white" : "text-slate-500"}`}
            />
            {!collapsed && <span className="truncate font-semibold">Payments</span>}
          </Link>

          <Link
            to="/admin/vendor/refunds"
            onClick={() => setMobileOpen(false)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
              isRefundsActive
                ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25"
                : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-950"
            }`}
          >
            <RotateCcw
              size={16}
              className={`shrink-0 ${isRefundsActive ? "text-white" : "text-slate-500"}`}
            />
            {!collapsed && <span className="truncate font-semibold">Refunds</span>}
          </Link>
        </div>

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

export default VendorManagementSidebar;
