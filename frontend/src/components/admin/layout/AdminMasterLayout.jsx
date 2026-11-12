import { useState } from "react";
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
    <div className="min-h-[100dvh] lg:h-[100dvh] overflow-x-hidden lg:overflow-hidden bg-slate-50 flex text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <AdminMasterSidebar
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

        <main className="flex-1 p-2.5 sm:p-4 lg:p-5 w-full overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-[1680px] mx-auto">{children}</div>
        </main>

        <AppFooter role="admin" />
      </div>
    </div>
  );
}

export default AdminMasterLayout;
