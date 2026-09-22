import React from "react";
import {
  X,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  ShieldCheck,
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
      {/* Mobile Backdrop */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col shrink-0 bg-gradient-to-b from-[#eef5ff] via-[#e8f2fe] to-[#edf4fe] text-slate-800 transition-all duration-300 ease-in-out border-r border-blue-200/80 shadow-[1px_0_6px_rgba(37,99,235,0.06)]
          ${sidebarCollapsed ? "w-[72px]" : "w-[240px]"}
          ${sidebarMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Integrated Brand Header */}
        <div className={`h-[68px] min-h-[68px] px-4 border-b border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center gap-2 shadow-xs ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {sidebarCollapsed ? (
              <ImmiGoIcon size="md" />
            ) : (
              <ImmiGoLogo size="sm" subtitle="Admin Portal" theme="light" />
            )}
          </div>
          {!sidebarCollapsed && (
            <button onClick={() => setSidebarMobileOpen(false)} className="lg:hidden w-7 h-7 flex items-center justify-center text-blue-200 hover:text-white hover:bg-blue-800/60 rounded-lg cursor-pointer flex-shrink-0">
              <X size={15} />
            </button>
          )}
        </div>

        {/* User Info chip (top) */}
        {!sidebarCollapsed && (
          <div className="mx-3 mt-3 px-3 py-2 bg-white/90 border border-blue-200/80 rounded-xl flex items-center gap-2.5 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-xs">
              {String((typeof user?.name === 'string' ? user.name : user?.name?.first) || user?.email || "A").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-800 text-[12px] truncate leading-tight">{(typeof user?.name === 'string' ? user.name : (user?.name?.first ? `${user.name.first} ${user.name.last}` : String(user?.name || ""))) || user?.email?.split("@")[0] || "Administrator"}</div>
              <div className="text-[10px] text-slate-500 font-semibold truncate flex items-center gap-1">
                Admin <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5"></span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          {!sidebarCollapsed && (
            <p className="text-[11px] font-extrabold text-blue-900/60 uppercase tracking-[0.14em] px-3 mb-2 mt-1">
              Main Menu
            </p>
          )}

          {sidebarNavItems.map((item) => {
            if (item.isGroup) {
              const isGroupActive =
                item.key === "employee-group"
                  ? view === "workforce" || view === "employees" || view === "live" || view === "leaves" ||
                  view === "summary" || view === "holidays" || view === "monthly-report" ||
                  view === "employee-detail"
                  : typeof view === "string" && view.startsWith("expense");

              const isMenuOpen =
                item.key === "employee-group"
                  ? Boolean(employeeMenuOpen ?? true)
                  : Boolean(expenseMenuOpen ?? true);

              const setMenuOpen =
                item.key === "employee-group" ? setEmployeeMenuOpen : setExpenseMenuOpen;

              return (
                <div key={item.key} className="space-y-0.5">
                  <button
                    type="button"
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${isGroupActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold"
                      : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-950"
                      }`}
                    onClick={() => {
                      if (!sidebarCollapsed && typeof setMenuOpen === "function") {
                        setMenuOpen(!isMenuOpen);
                      }
                    }}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`shrink-0 ${isGroupActive ? "text-white" : "text-slate-500"}`}>
                        {item.icon}
                      </span>
                      {!sidebarCollapsed && (
                        <span className={isGroupActive ? "text-white" : "text-slate-700 font-semibold"}>
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
                    <div className="ml-3.5 pl-3 border-l-2 border-blue-200/80 space-y-0.5 my-1">
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
                              ? "bg-blue-600 text-white font-bold shadow-xs shadow-blue-500/20"
                              : "text-slate-600 hover:bg-blue-100/70 hover:text-blue-950 font-semibold"
                              }`}
                            onClick={() => {
                              if (sub.onClick) sub.onClick();
                              else navigateTo(sub.key);
                              setSidebarMobileOpen(false);
                            }}
                          >
                            <span className={`shrink-0 ${isSubActive ? "text-white" : "text-slate-500"}`}>
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
              ((view === "live" || view === "dashboard") && (item.key === "live" || item.key === "dashboard")) ||
              view === item.key;

            return (
              <button
                key={item.key}
                type="button"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer ${isActive
                  ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25"
                  : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-950"
                  }`}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  else navigateTo(item.key);
                  setSidebarMobileOpen(false);
                }}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className={`shrink-0 ${isActive ? "text-white" : "text-slate-500"}`}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <span className={isActive ? "text-white" : "text-slate-700 font-semibold"}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Sidebar Footer — exactly aligned with dashboard footer (h-[48px] min-h-[48px]) */}
        <div className={`h-[48px] min-h-[48px] border-t border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 px-3.5 flex items-center shadow-xs text-blue-200 text-xs ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
          {!sidebarCollapsed ? (
            <>


            </>
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="System Active"></span>
          )}
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
