import React from "react";
import { Link } from "react-router-dom";
import {
  X,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { ImmiGoLogo, ImmiGoIcon } from "../../common/ImmiGoLogo.jsx";

export const AdminSidebar = ({
  user,
  sidebarCollapsed = false,
  sidebarMobileOpen = false,
  setSidebarMobileOpen = () => { },
  sidebarNavItems = [],
  employeeMenuOpen = true,
  setEmployeeMenuOpen = () => { },
  expenseMenuOpen = true,
  setExpenseMenuOpen = () => { },
  clientMenuOpen = true,
  setClientMenuOpen = () => { },
  projectMenuOpen = true,
  setProjectMenuOpen = () => { },
  invoiceMenuOpen = true,
  setInvoiceMenuOpen = () => { },
  view = "live",
  navigateTo = () => { },
  onLogout = () => { },
}) => {
  return (
    <>
      {}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col shrink-0 bg-gradient-to-b from-[#eef5ff] via-[#e4f0fe] to-[#edf5ff] text-slate-800 transition-all duration-300 ease-in-out border-r border-blue-200/90 shadow-lg
          ${sidebarCollapsed ? "w-[72px]" : "w-[240px]"}
          ${sidebarMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {}
        <div className={`h-[68px] min-h-[68px] px-4 border-b border-blue-600/30 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center gap-2 shadow-xs ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {sidebarCollapsed ? (
              <ImmiGoIcon size="md" />
            ) : (
              <ImmiGoLogo size="sm" subtitle="Admin Portal" theme="light" />
            )}
          </div>
          {!sidebarCollapsed && (
            <button onClick={() => setSidebarMobileOpen(false)} className="lg:hidden w-7 h-7 flex items-center justify-center text-blue-100 hover:text-white hover:bg-white/20 rounded-lg cursor-pointer flex-shrink-0">
              <X size={15} />
            </button>
          )}
        </div>

        {}
        {/* Main Admin Return Button & Menu */}
        <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="mb-2.5">
            <Link
              to="/admin/dashboard"
              className={`w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-bold text-blue-800 bg-white/90 hover:bg-white hover:text-blue-900 border border-blue-200/90 rounded-xl transition-colors shadow-2xs ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
              title="Return to Main Admin Dashboard"
            >
              <ArrowLeft size={13} className="shrink-0 text-blue-600" />
              {!sidebarCollapsed && <span className="truncate">Main Admin Dashboard</span>}
            </Link>
          </div>

          {!sidebarCollapsed && (
            <p className="text-[11px] font-extrabold text-blue-900/60 uppercase tracking-[0.14em] px-3 mb-2 mt-1">
              HR Management
            </p>
          )}

          {sidebarNavItems.map((item) => {
            if (item.isGroup) {
              const isGroupActive =
                item.key === "employee-group"
                  ? view === "workforce" || view === "employees" || view === "live" || view === "leaves" ||
                  view === "summary" || view === "holidays" || view === "monthly-report" ||
                  view === "employee-detail"
                  : item.key === "client-group"
                  ? typeof view === "string" && view.startsWith("client")
                  : typeof view === "string" && view.startsWith("expense");

              const isMenuOpen =
                item.key === "employee-group"
                  ? Boolean(employeeMenuOpen ?? true)
                  : item.key === "client-group"
                  ? Boolean(clientMenuOpen ?? true)
                  : Boolean(expenseMenuOpen ?? true);

              const setMenuOpen =
                item.key === "employee-group"
                  ? setEmployeeMenuOpen
                  : item.key === "client-group"
                  ? setClientMenuOpen
                  : setExpenseMenuOpen;

              return (
                <div key={item.key} className="space-y-0.5">
                  <button
                    type="button"
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${isGroupActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 font-bold"
                      : "text-slate-700 hover:bg-white/80 hover:text-blue-950 font-semibold"
                      }`}
                    onClick={() => {
                      if (!sidebarCollapsed && typeof setMenuOpen === "function") {
                        setMenuOpen(!isMenuOpen);
                      }
                    }}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`shrink-0 ${isGroupActive ? "text-white" : "text-blue-600/80"}`}>
                        {item.icon}
                      </span>
                      {!sidebarCollapsed && (
                        <span className={isGroupActive ? "text-white" : "text-slate-800 font-semibold"}>
                          {item.label}
                        </span>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      isMenuOpen
                        ? <ChevronDown size={14} className={isGroupActive ? "text-white shrink-0" : "text-slate-500 shrink-0"} />
                        : <ChevronRight size={14} className={isGroupActive ? "text-white/80 shrink-0" : "text-slate-400 shrink-0"} />
                    )}
                  </button>

                  {!sidebarCollapsed && isMenuOpen && (
                    <div className="ml-3.5 pl-3 border-l-2 border-blue-200 space-y-0.5 my-1">
                      {item.subItems.map((sub) => {
                        const isSubActive =
                          view === sub.key ||
                          (sub.key === "live" && view === "dashboard") ||
                          (sub.key === "employees" && view === "employee-detail");

                        return (
                          <button
                            key={sub.key}
                            type="button"
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] transition-all duration-150 cursor-pointer text-left ${isSubActive
                              ? "bg-blue-600 text-white font-bold shadow-xs shadow-blue-500/30"
                              : "text-slate-600 hover:bg-white/80 hover:text-blue-950 font-medium"
                              }`}
                            onClick={() => {
                              if (sub.onClick) sub.onClick();
                              else navigateTo(sub.key);
                              setSidebarMobileOpen(false);
                            }}
                          >
                            <span className={`shrink-0 ${isSubActive ? "text-white" : "text-blue-600/70"}`}>
                              {sub.icon}
                            </span>
                            <span className="truncate">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive =
              ((view === "live" || view === "dashboard" || view === "workforce") &&
                (item.key === "live" || item.key === "dashboard" || item.key === "workforce")) ||
              view === item.key ||
              (item.key === "employees" && (view === "employee-detail" || view === "edit-employee"));

            const isRegisterEmp = item.key === "register-employee";

            return (
              <button
                key={item.key}
                type="button"
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[12.5px] transition-all duration-150 whitespace-nowrap cursor-pointer group ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-600/25 translate-x-0.5"
                    : isRegisterEmp
                    ? "text-blue-800 bg-blue-100/70 hover:bg-blue-200/70 font-bold border border-blue-300/60"
                    : "text-slate-700 hover:bg-white/80 hover:text-blue-900 font-semibold"
                }`}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  else navigateTo(item.key);
                  setSidebarMobileOpen(false);
                }}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`shrink-0 transition-transform group-hover:scale-105 ${
                      isActive
                        ? "text-white"
                        : isRegisterEmp
                        ? "text-blue-600"
                        : "text-blue-600/70 group-hover:text-blue-800"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>

                {!sidebarCollapsed && isRegisterEmp && !isActive && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-600 text-white shadow-2xs">
                    New
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Status bar */}
        <div
          className={`h-[48px] min-h-[48px] border-t border-blue-200/80 bg-white/70 backdrop-blur-xs px-3.5 flex items-center shadow-xs text-xs ${
            sidebarCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between w-full text-blue-900/70 font-semibold text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-xs"></span>
                <span className="text-slate-600">Portal Online</span>
              </span>
              <span className="text-[10px] text-blue-700/60 font-mono">v2.6</span>
            </div>
          ) : (
            <span
              className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-xs"
              title="Portal Online"
            ></span>
          )}
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
