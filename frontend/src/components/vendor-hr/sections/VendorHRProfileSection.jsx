import { getCandidateInitials } from "../shared/vendorHRUtils.jsx";

export default function VendorHRProfileSection({
  user,
  hrProfile = null,
  hrUserName = "",
  vendorName = "",
}) {
  const displayName = hrUserName || user?.name || "Vendor HR Officer";
  const displayEmail = hrProfile?.email || user?.email || "Not provided";
  const displayPhone = hrProfile?.phone || user?.phone || "Not provided";
  const displayStaffId =
    hrProfile?.hrId || user?.hrId || user?.employeeId || user?.id?.slice(0, 8) || "Assigned";
  const displayVendor = vendorName || "Not assigned";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center space-x-4 border-b border-slate-100 pb-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xl border-2 border-indigo-200 shadow-md shrink-0">
            {getCandidateInitials(displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-slate-900 truncate">{displayName}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>
            <p className="text-xs text-indigo-600 font-bold">Authorized Vendor HR Officer</p>
            <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold mb-0.5">Full Name</span>
            <span className="font-bold text-slate-800 text-sm">{displayName}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold mb-0.5">Designation / Role</span>
            <span className="font-bold text-indigo-700 text-sm">Vendor HR Officer</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold mb-0.5">Email Address</span>
            <span className="font-bold text-slate-800">{displayEmail}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold mb-0.5">Contact Phone</span>
            <span className="font-bold text-slate-800">{displayPhone}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold mb-0.5">HR Officer ID</span>
            <span className="font-bold text-slate-800 font-mono">
              {displayStaffId}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-semibold mb-0.5">Department</span>
            <span className="font-bold text-slate-800">Human Resources & Recruitment</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
            <span className="text-slate-400 block font-semibold mb-0.5">Assigned Agency Representation</span>
            <span className="font-bold text-slate-800">{displayVendor}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

