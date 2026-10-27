import React from "react";
import AppFooter from "../../common/AppFooter.jsx";

export const AdminFooter = ({ navigate, role = "admin" }) => {
  const isHr =
    (role || "").toLowerCase() === "hr" ||
    (typeof window !== "undefined" && window.location.pathname.startsWith("/hr"));
  const basePrefix = isHr ? "/hr/dashboard" : "/admin/dashboard";

  return (
    <AppFooter
      role={isHr ? "hr" : role}
      onNavigate={(path) => {
        if (navigate) {
          const cleanPath = path.startsWith("/") ? path : `${basePrefix}/${path}`;
          navigate(cleanPath);
        }
      }}
    />
  );
};

export default AdminFooter;

