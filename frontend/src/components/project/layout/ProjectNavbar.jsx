import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Shield,
  LayoutDashboard,
  FolderPlus,
} from "lucide-react";
import { ImmiGoLogo } from "../../common/ImmiGoLogo.jsx";

export function ProjectNavbar({
  mobileOpen,
  setMobileOpen,
  collapsed,
  setCollapsed,
  title = "Projects Directory",
}) {
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    if (path === "/client/projects") return "Projects Directory";
    if (path.endsWith("/new")) return "Add New Project";
    if (path.includes("/projects/")) return "Project Details";
    return title;
  };

  return (
    <header className="h-[52px] min-h-[52px] bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white px-4 sm:px-6 sticky top-0 z-30 flex items-center border-b border-blue-800/80 shadow-md shrink-0">
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
                {getTitle()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/40 hover:bg-blue-600 text-cyan-200 hover:text-white border border-cyan-400/30 transition-all duration-150 cursor-pointer text-xs font-bold shadow-xs"
            title="Admin Dashboard"
          >
            <LayoutDashboard size={14} className="text-cyan-400" />
            <span className="hidden sm:inline">Admin Dashboard</span>
          </Link>

          <Link
            to="/client/projects/new"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-400/30 transition-all duration-150 cursor-pointer text-xs font-bold shadow-xs"
          >
            <FolderPlus size={14} />
            <span className="hidden sm:inline">New Project</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-800/60 border border-blue-600/40 text-[10px] font-bold text-cyan-300 uppercase tracking-widest">
            <Shield size={11} className="text-cyan-400" />
            <span>Admin</span>
          </div>

        </div>
      </div>
    </header>
  );
}

export default ProjectNavbar;
