import React from "react";
import AdminDashboard from "../admin/AdminDashboard.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export function HRDashboard() {
  const { user, token, logout } = useAuth();
  return <AdminDashboard user={user} token={token} onLogout={logout} />;
}

export default HRDashboard;
