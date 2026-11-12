import { useState } from "react";
import ClientSidebar from "./ClientSidebar.jsx";
import ClientNavbar from "./ClientNavbar.jsx";
import { CrmToastContext } from "../../crm/layout/crmToastContext.js";
import { ToastNotification } from "../../crm/ui/ToastNotification.jsx";
import AppFooter from "../../common/AppFooter.jsx";

export function ClientLayout({
  children,
  title = "Client Dashboard",
  subtitle = "Overseas client contracts, deployment sites & manpower requirements.",
  breadcrumbs = null,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast({ message: "", type: "success" });
  };

  return (
    <CrmToastContext.Provider value={{ showToast }}>
      <div className="min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] overflow-x-hidden lg:overflow-hidden bg-slate-50 flex text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
        <ClientSidebar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh] lg:min-h-0 lg:h-full lg:overflow-hidden">
          <ClientNavbar
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            title={title}
            subtitle={subtitle}
            breadcrumbs={breadcrumbs}
          />

          <main className="flex-1 p-3 sm:p-5 w-full overflow-y-auto overflow-x-hidden">
            <div className="w-full max-w-[1680px] mx-auto">{children}</div>
          </main>

          <AppFooter role="admin" />
        </div>

        {toast.message && (
          <ToastNotification
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
        )}
      </div>
    </CrmToastContext.Provider>
  );
}

export default ClientLayout;

