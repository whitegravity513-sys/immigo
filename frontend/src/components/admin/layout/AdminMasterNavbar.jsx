import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useAuth } from "../../../context/useAuth.js";
import NotificationBell from "../NotificationBell.jsx";
import { ImmiGoLogo } from "../../common/ImmiGoLogo.jsx";

export function AdminMasterNavbar({
  mobileOpen,
  setMobileOpen,
  collapsed,
  setCollapsed,
  title = "Admin Dashboard",
}) {
  const { user, isSuperAdmin } = useAuth();

  const adminName =
    (typeof user?.name === "string" ? user.name : user?.name?.first) ||
    user?.email?.split("@")[0] ||
    (isSuperAdmin ? "Super Admin" : "Admin");

  return (
    <header className="h-[52px] min-h-[52px] bg-gradient-to-r from-[#0f274a] via-[#163868] to-[#1e4a82] text-white px-4 sm:px-6 flex items-center border-b border-blue-900/60 shadow-xs shrink-0">
      <div className="w-full flex items-center justify-between gap-3 sm:gap-5">

        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 1024) setMobileOpen(!mobileOpen);
              else setCollapsed(!collapsed);
            }}
            className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl bg-blue-900/60 hover:bg-blue-800/90 text-blue-200 hover:text-white border border-blue-700/60 transition-all duration-150 cursor-pointer shrink-0 group shadow-xs"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu size={18} className="lg:hidden text-blue-200 group-hover:text-white" />
            <span className="hidden lg:flex items-center gap-2">
              {collapsed ? (
                <PanelLeftOpen size={16} className="text-cyan-400 group-hover:text-white transition-colors" />
              ) : (
                <PanelLeftClose size={16} className="text-blue-300 group-hover:text-white transition-colors" />
              )}
            </span>
          </button>

          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 truncate">
              <ImmiGoLogo size="xs" theme="light" className="hidden sm:flex" />
              <ChevronRight size={13} className="text-blue-400 shrink-0 hidden sm:inline" />
              <span className="text-white font-bold text-sm sm:text-[15px] tracking-tight truncate drop-shadow-2xs">
                {title}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-800/60 border border-blue-600/40 text-xs font-bold text-cyan-300 uppercase tracking-wider shadow-xs">
            <Shield size={13} className="text-cyan-400" />
            <span>{isSuperAdmin ? "Super Admin" : adminName}</span>
          </div>

          <NotificationBell className="relative p-2 rounded-xl bg-blue-900/60 hover:bg-blue-800/90 text-blue-200 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-blue-700/60 shadow-xs" />
        </div>
      </div>
    </header>
  );
}

export default AdminMasterNavbar;
