import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  CreditCard,
  UserCheck,
  LogOut,
  X,
  FolderKanban,
  Calendar,
  Lock,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { ImmiGoLogo } from "../../common/ImmiGoLogo.jsx";

import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";

export function VendorSidebar({ mobileOpen, setMobileOpen, vendor, isPortalLocked = false }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/vendor/login");
  };

  const vendorName = vendor?.companyName || "Vendor Partner";
  const vendorId = vendor?.id || "VND-1001";
  const vendorLogo = vendor?.profileImage || vendor?.logo || vendor?.avatar || "";

  const [candidatesMenuOpen, setCandidatesMenuOpen] = React.useState(true);

  const renderContent = () => (
    <div className="flex flex-col h-full bg-[#F3F7FC] text-slate-800 font-sans border-r border-blue-200/80">
      {}
      <div className="h-16 flex items-center justify-between px-5 border-b border-blue-800/80 shrink-0 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950">
        <div className="flex items-center gap-2.5">
          <ImmiGoLogo size="sm" theme="light" subtitle="Vendor Portal" />
        </div>

        {}
        {mobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-blue-200 hover:text-white rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {}
      <div className="p-3.5 mx-3 mt-3 bg-blue-100/70 rounded-xl border border-blue-300 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-9 h-9 rounded-xl ${vendorLogo ? "bg-white" : "bg-blue-50 border border-blue-200 text-blue-600"} font-bold text-xs flex items-center justify-center shrink-0 shadow-xs overflow-hidden`}>
            {vendorLogo ? (
              <img src={vendorLogo} alt={vendorName} className="w-full h-full object-cover" />
            ) : (
              vendorName.charAt(0)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
              {vendorName}
            </h4>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-mono font-bold text-blue-700">
                {vendorId}
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {isPortalLocked && (
        <div className="mx-3 mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <Lock size={12} className="text-amber-600 shrink-0" />
            <span>Documents Required</span>
          </div>
          <p className="text-[10px] text-amber-700 mt-0.5 leading-snug">
            Upload compliance documents to unlock all portal fields.
          </p>
        </div>
      )}

      {}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavLink to="/vendor/dashboard" onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${isActive ? "bg-blue-600 text-white shadow-md font-bold" : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-800"}`}>
          <LayoutDashboard size={16} /> <span>Dashboard</span>
        </NavLink>

        {isPortalLocked ? (
          <>
            {[
              { label: "Projects", Icon: FolderKanban },
              { label: "Candidates", Icon: Users },
              { label: "Payments", Icon: CreditCard },
              { label: "Refunds", Icon: RotateCcw },
              { label: "Documents / MOU", Icon: FileCheck },
              { label: "Meeting Calendar", Icon: Calendar },
              { label: "Profile", Icon: UserCheck },
            ].map(({ label, Icon }) => (
              <button
                key={label}
                type="button"
                disabled
                title="Upload compliance documents to unlock"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl text-slate-400 bg-slate-100/70 opacity-65 cursor-not-allowed select-none"
              >
                <Icon size={16} className="text-slate-400 shrink-0" />
                <span className="truncate">{label}</span>
                <Lock size={12} className="ml-auto text-slate-400 shrink-0" />
              </button>
            ))}
          </>
        ) : (
          <>
            <NavLink
              to="/vendor/projects"
              onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md font-bold"
                    : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-800"
                }`
              }
            >
              <FolderKanban
                size={16}
                className={window.location.pathname.includes("/projects") ? "text-white" : "text-slate-500"}
              />
              <span>Projects</span>
            </NavLink>

            <div className="space-y-0.5">
              <button type="button" onClick={() => setCandidatesMenuOpen(!candidatesMenuOpen)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${window.location.pathname.includes('/candidates') || window.location.pathname.includes('/selected') || window.location.pathname.includes('/processing') || window.location.pathname.includes('/on-hold') || window.location.pathname.includes('/rejected') ? "bg-blue-600 text-white shadow-md" : "text-slate-700 hover:bg-blue-100/70"}`}>
                <div className="flex items-center gap-2.5"><Users size={16} className={window.location.pathname.includes('/candidates') || window.location.pathname.includes('/selected') || window.location.pathname.includes('/processing') || window.location.pathname.includes('/on-hold') || window.location.pathname.includes('/rejected') ? "text-white" : "text-slate-500"} /> <span>Candidates</span></div>
                {candidatesMenuOpen ? <ChevronDown size={14} className={window.location.pathname.includes('/candidates') || window.location.pathname.includes('/selected') || window.location.pathname.includes('/processing') || window.location.pathname.includes('/on-hold') || window.location.pathname.includes('/rejected') ? "text-white/80" : "text-slate-400"} /> : <ChevronRight size={14} className={window.location.pathname.includes('/candidates') || window.location.pathname.includes('/selected') || window.location.pathname.includes('/processing') || window.location.pathname.includes('/on-hold') || window.location.pathname.includes('/rejected') ? "text-white/80" : "text-slate-400"} />}
              </button>
              {candidatesMenuOpen && (
                <div className="ml-4 pl-3 border-l-2 border-blue-200/80 space-y-0.5 my-1">
                  <NavLink to="/vendor/candidates" end onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-100/70"}`}>My Candidates</NavLink>
                  <NavLink to="/vendor/candidates/assign" onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-100/70"}`}>Assign Candidate</NavLink>
                  <NavLink to="/vendor/selected" onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-100/70"}`}>Selected</NavLink>
                  <NavLink to="/vendor/processing" onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-100/70"}`}>Deployment Timeline</NavLink>
                  <NavLink to="/vendor/on-hold" onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-100/70"}`}>On Hold</NavLink>
                  <NavLink to="/vendor/rejected" onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-100/70"}`}>Rejected</NavLink>
                </div>
              )}
            </div>

            <NavLink to="/vendor/payments" onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${isActive ? "bg-blue-600 text-white shadow-md font-bold" : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-800"}`}>
              <CreditCard size={16} className={window.location.pathname.includes('/payments') ? "text-white" : "text-slate-500"} /> <span>Payments</span>
            </NavLink>
            <NavLink to="/vendor/refunds" onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${isActive ? "bg-blue-600 text-white shadow-md font-bold" : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-800"}`}>
              <RotateCcw size={16} className={window.location.pathname.includes('/refunds') ? "text-white" : "text-slate-500"} /> <span>Refunds</span>
            </NavLink>

            <NavLink to="/vendor/documents" onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${isActive ? "bg-blue-600 text-white shadow-md font-bold" : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-800"}`}>
              <FileCheck size={16} className={window.location.pathname.includes('/documents') ? "text-white" : "text-slate-500"} />{" "}
              <span>
                {vendor?.status === "Approved" ||
                vendor?.status === "Active" ||
                vendor?.mouStatus === "Approved" ||
                vendor?.mouStatus === "Sent" ||
                vendor?.mouStatus === "Under Review" ||
                vendor?.mouStatus === "Signed" ||
                vendor?.mouStatus === "Correction Required" ||
                vendor?.status === "MOU Pending" ||
                vendor?.status === "Pending MOU Approval" ||
                vendor?.status === "MOU Under Review" ||
                vendor?.status === "MOU Correction Required" ||
                vendor?.onboardingStage === "MOU_SENT" ||
                vendor?.onboardingStage === "MOU_UNDER_REVIEW" ||
                vendor?.onboardingStage === "MOU_SIGNED" ||
                vendor?.onboardingStage === "COMPLETED" ||
                vendor?.onboardingStage === "ACTIVE" ||
                vendor?.mouSigned
                  ? "Documents / MOU"
                  : "Compliance Docs"}
              </span>
            </NavLink>
            <NavLink to="/vendor/meetings" onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${isActive ? "bg-blue-600 text-white shadow-md font-bold" : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-800"}`}>
              <Calendar size={16} className={window.location.pathname.includes('/meetings') ? "text-white" : "text-slate-500"} /> <span>Meeting Calendar</span>
            </NavLink>
            <NavLink to="/vendor/profile" onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${isActive ? "bg-blue-600 text-white shadow-md font-bold" : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-800"}`}>
              <UserCheck size={16} className={window.location.pathname.includes('/profile') ? "text-white" : "text-slate-500"} /> <span>Profile</span>
            </NavLink>
          </>
        )}
      </nav>

      {}
      <div className="h-[48px] min-h-[48px] px-4 border-t border-blue-800/80 shrink-0 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 flex items-center">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-900/40 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-30 shadow-md">
        {renderContent()}
      </aside>

      {}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {renderContent()}
      </div>
    </>
  );
}

export default VendorSidebar;
