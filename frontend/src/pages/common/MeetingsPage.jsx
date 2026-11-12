import AdminMasterLayout from "../../components/admin/layout/AdminMasterLayout.jsx";
import MeetingCalendarSection from "../../components/common/meeting/MeetingCalendarSection.jsx";
import { useAuth } from "../../context/useAuth.js";

export function MeetingsPage() {
  const { user, role, isSuperAdmin, isVendor, assignedVendors } = useAuth();

  const userRole = isSuperAdmin
    ? "SUPER_ADMIN"
    : isVendor
    ? "VENDOR"
    : role === "HR"
    ? user?.hrType || "VENDOR_HR"
    : role || "ADMIN";

  const scopedVendors = isVendor
    ? [user?.vendorId || user?.id || user?._id].filter(Boolean)
    : assignedVendors;

  const calendarContent = (
    <div className="space-y-4">
      <MeetingCalendarSection
        role={userRole}
        assignedVendors={scopedVendors}
      />
    </div>
  );

  if (isVendor) {
    return (
      <div className="p-3 sm:p-6 overflow-y-auto max-w-[1680px] mx-auto w-full custom-scrollbar">
        {calendarContent}
      </div>
    );
  }

  return (
    <AdminMasterLayout>
      <div className="p-3 sm:p-6 space-y-4 max-w-[1680px] mx-auto w-full">
        {calendarContent}
      </div>
    </AdminMasterLayout>
  );
}

export default MeetingsPage;

