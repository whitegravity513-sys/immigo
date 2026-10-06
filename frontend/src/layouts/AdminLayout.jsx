import { DashboardWatermark } from "../components/common/ImmiGoLogo.jsx";
import { AdminHeader, AdminSidebar, AdminFooter } from "../components/admin/layout";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function AdminLayout({
  user,
  sidebarCollapsed,
  setSidebarCollapsed,
  sidebarMobileOpen,
  setSidebarMobileOpen,
  sidebarNavItems,
  employeeMenuOpen,
  setEmployeeMenuOpen,
  expenseMenuOpen,
  setExpenseMenuOpen,
  clientMenuOpen,
  setClientMenuOpen,
  projectMenuOpen,
  setProjectMenuOpen,
  invoiceMenuOpen,
  setInvoiceMenuOpen,
  view,
  navigateTo,
  onLogout,
  navigate,
  errorMsg,
  successMsg,
  children,
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans relative overflow-x-hidden">
      <DashboardWatermark />

      <AdminSidebar
        user={user}
        sidebarCollapsed={sidebarCollapsed}
        sidebarMobileOpen={sidebarMobileOpen}
        setSidebarMobileOpen={setSidebarMobileOpen}
        sidebarNavItems={sidebarNavItems}
        employeeMenuOpen={employeeMenuOpen}
        setEmployeeMenuOpen={setEmployeeMenuOpen}
        expenseMenuOpen={expenseMenuOpen}
        setExpenseMenuOpen={setExpenseMenuOpen}
        clientMenuOpen={clientMenuOpen}
        setClientMenuOpen={setClientMenuOpen}
        projectMenuOpen={projectMenuOpen}
        setProjectMenuOpen={setProjectMenuOpen}
        invoiceMenuOpen={invoiceMenuOpen}
        setInvoiceMenuOpen={setInvoiceMenuOpen}
        view={view}
        navigateTo={navigateTo}
        onLogout={onLogout}
      />

      <div className="flex-1 flex flex-col min-h-screen min-w-0 bg-slate-50 text-slate-900 overflow-x-hidden">
        <AdminHeader
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          sidebarMobileOpen={sidebarMobileOpen}
          setSidebarMobileOpen={setSidebarMobileOpen}
          view={view}
          onLogout={onLogout}
        />

        <main className="flex-1 p-2.5 sm:p-4 md:p-6 max-w-[1440px] w-full mx-auto min-w-0">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm font-medium mb-6">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-medium mb-6">
              <CheckCircle size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {children}
        </main>

        <AdminFooter navigate={navigate} />
      </div>
    </div>
  );
}
