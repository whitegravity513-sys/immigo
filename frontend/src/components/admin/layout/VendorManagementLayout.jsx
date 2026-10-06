import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminMasterNavbar from "./AdminMasterNavbar.jsx";
import VendorManagementSidebar from "./VendorManagementSidebar.jsx";
import AppFooter from "../../common/AppFooter.jsx";

export function VendorManagementLayout({
  children,
  title = "Vendor Management",
  subtitle = "Overview of vendors, candidates, submissions and payments",
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex text-slate-900 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      {/* Single Vendor Management Sidebar */}
      <VendorManagementSidebar
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
          breadcrumbs={[{ label: "Admin", path: "/admin/dashboard" }, { label: "Vendor Management" }]}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 w-full overflow-y-auto bg-slate-50/70">
          {children || <Outlet />}
        </main>

        <AppFooter role="admin" />
      </div>
    </div>
  );
}

export default VendorManagementLayout;
