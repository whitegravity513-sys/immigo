import AdminDashboard from "../admin/AdminDashboard.jsx";
import VendorHRDashboardPage from "../vendor-hr/VendorHRDashboardPage.jsx";
import { useAuth } from "../../context/useAuth.js";

export function HRDashboard() {
  const { user, token, logout, isVendorHR } = useAuth();

  if (isVendorHR) {
    return <VendorHRDashboardPage />;
  }

  return <AdminDashboard user={user} token={token} onLogout={logout} />;
}

export default HRDashboard;
