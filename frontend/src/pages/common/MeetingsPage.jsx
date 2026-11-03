import React from "react";
import AdminMasterLayout from "../../components/admin/layout/AdminMasterLayout.jsx";
import { VendorLayout } from "../../components/vendor/layout/VendorLayout.jsx";
import MeetingCalendarSection from "../../components/common/meeting/MeetingCalendarSection.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export function MeetingsPage() {
  const { role, isSuperAdmin, isVendor, assignedVendors } = useAuth();

  const userRole = isSuperAdmin
    ? "SUPER_ADMIN"
    : role === "HR"
    ? "VENDOR_HR"
    : role || "ADMIN";

  const calendarContent = (
    <div className="space-y-4">
      <MeetingCalendarSection
        role={userRole}
        assignedVendors={assignedVendors}
      />
    </div>
  );

  if (isVendor) {
    return (
      <VendorLayout title="Meeting Calendar">
        <div className="p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto custom-scrollbar">
          {calendarContent}
        </div>
      </VendorLayout>
    );
  }

  return (
    <AdminMasterLayout>
      <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
        {calendarContent}
      </div>
    </AdminMasterLayout>
  );
}

export default MeetingsPage;

