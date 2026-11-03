import React from "react";
import AdminDashboard from "../admin/AdminDashboard.jsx";
import VendorHRDashboard from "./VendorHRDashboard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export function HRDashboard() {
  const { user, token, logout, isVendorHR } = useAuth();

  if (isVendorHR) {
    return <VendorHRDashboard />;
  }

  return <AdminDashboard user={user} token={token} onLogout={logout} />;
}

export default HRDashboard;
