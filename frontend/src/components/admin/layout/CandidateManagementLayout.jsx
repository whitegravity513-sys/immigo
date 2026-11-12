import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminMasterNavbar from "./AdminMasterNavbar.jsx";
import CandidateManagementSidebar from "./CandidateManagementSidebar.jsx";
import AppFooter from "../../common/AppFooter.jsx";

export function CandidateManagementLayout({
  children,
  title = "Candidate Management",
  subtitle = "Recruitment pipeline, approvals, document verification, and interview workflow.",
  breadcrumbs = [{ label: "Admin", path: "/admin/dashboard" }, { label: "Candidate Management" }],
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] overflow-x-hidden lg:overflow-hidden bg-slate-50 flex text-slate-900 font-sans antialiased selection:bg-[#0f2744] selection:text-white">
      <CandidateManagementSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh] lg:min-h-0 lg:h-full lg:overflow-hidden">
        <AdminMasterNavbar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          title={title}
          subtitle={subtitle}
          breadcrumbs={breadcrumbs}
        />

        <main className="flex-1 p-3 sm:p-4 lg:p-5 w-full overflow-y-auto overflow-x-hidden bg-slate-50/80">
          <div className="w-full max-w-[1680px] mx-auto">{children || <Outlet />}</div>
        </main>

        <AppFooter role="admin" />
      </div>
    </div>
  );
}

export default CandidateManagementLayout;
