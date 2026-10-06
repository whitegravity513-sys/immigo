import React, { useState } from "react";
import AdminMasterSidebar from "./AdminMasterSidebar.jsx";
import AdminMasterNavbar from "./AdminMasterNavbar.jsx";
import AppFooter from "../../common/AppFooter.jsx";

export function AdminMasterLayout({
  children,
  title = "Admin Dashboard",
  subtitle = "Overview of your organization's activities and operations.",
  breadcrumbs = [{ label: "Admin", path: "/admin/dashboard" }, { label: "Dashboard" }],
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Sidebar */}
      <AdminMasterSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <AdminMasterNavbar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          title={title}
          subtitle={subtitle}
          breadcrumbs={breadcrumbs}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-5 w-full overflow-y-auto">
          {children}
        </main>

        {/* Footer */}
        <AppFooter role="admin" />
      </div>
    </div>
  );
}

export default AdminMasterLayout;
