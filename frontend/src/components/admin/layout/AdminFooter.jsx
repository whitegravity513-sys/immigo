import React from "react";
import AppFooter from "../../common/AppFooter.jsx";

export const AdminFooter = ({ navigate }) => {
  return (
    <AppFooter
      role="admin"
      onNavigate={(path) => {
        if (navigate) {
          const cleanPath = path.startsWith("/") ? path : `/admin/dashboard/${path}`;
          navigate(cleanPath);
        }
      }}
    />
  );
};

export default AdminFooter;

