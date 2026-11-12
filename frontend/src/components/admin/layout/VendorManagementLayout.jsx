import { useState } from "react";
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
    <div className="min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] overflow-x-hidden lg:overflow-hidden bg-slate-50 flex text-slate-900 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      <VendorManagementSidebar
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
          breadcrumbs={[{ label: "Admin", path: "/admin/dashboard" }, { label: "Vendor Management" }]}
        />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 w-full overflow-y-auto overflow-x-hidden bg-slate-50/70">
          <div className="w-full max-w-[1680px] mx-auto">{children || <Outlet />}</div>
        </main>

        <AppFooter role="admin" />
      </div>
    </div>
  );
}

export default VendorManagementLayout;
