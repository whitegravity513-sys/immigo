import React, { useState, createContext, useContext } from "react";
import CrmSidebar from "./CrmSidebar.jsx";
import CrmNavbar from "./CrmNavbar.jsx";
import ToastNotification from "../ui/ToastNotification.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";

// Context for showing toast notifications anywhere in the CRM
export const CrmToastContext = createContext({
  showToast: () => {},
});

export const useCrmToast = () => useContext(CrmToastContext);

export function CrmLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const auth = useAuth?.() || {};
  const user = auth.user || { name: "Operations Admin", email: "admin@immigo.com" };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast({ message: "", type: "success" });
  };

  return (
    <CrmToastContext.Provider value={{ showToast }}>
      <div className="min-h-screen bg-[#F8FAFC] flex text-gray-900 font-sans antialiased overflow-x-hidden">
        {/* CRM Main Sidebar */}
        <CrmSidebar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          user={user}
        />

        {/* CRM Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
          {/* Top Navbar */}
          <CrmNavbar
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            user={user}
          />

          {/* Page Main Content Area */}
          <main className="flex-1 p-3 sm:p-4 md:p-5 max-w-[1536px] w-full mx-auto min-w-0">
            {children}
          </main>
        </div>

        {/* Global Toast */}
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

export default CrmLayout;
