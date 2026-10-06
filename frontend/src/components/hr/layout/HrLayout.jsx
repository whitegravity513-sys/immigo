import React, { useState } from "react";
import HrSidebar from "./HrSidebar.jsx";
import HrNavbar from "./HrNavbar.jsx";
import AppFooter from "../../common/AppFooter.jsx";

export function HrLayout({
  children,
  title = "HR Dashboard",
  subtitle = "Workforce directory, attendance monitoring, and leave administration.",
  breadcrumbs = [
    { label: "Admin", path: "/admin/dashboard" },
    { label: "HR", path: "/hr/dashboard" },
    { label: "Dashboard" },
  ],
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <HrSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <HrNavbar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          title={title}
          subtitle={subtitle}
          breadcrumbs={breadcrumbs}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Footer */}
        <AppFooter role="admin" />
      </div>
    </div>
  );
}

export default HrLayout;
