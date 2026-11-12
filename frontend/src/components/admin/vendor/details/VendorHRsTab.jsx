import { UserPlus } from "lucide-react";

export default function VendorHRsTab({ vendorHRs, onOpenCreateHRModal }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white">Vendor HR Personnel</h3>
          <p className="text-xs text-slate-400">Users authorized to submit and manage candidates for this vendor</p>
        </div>
        <button
          onClick={onOpenCreateHRModal}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Create Vendor HR</span>
        </button>
      </div>

      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-semibold">Name</th>
              <th className="py-3 px-4 font-semibold">Email</th>
              <th className="py-3 px-4 font-semibold">Phone</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {vendorHRs.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-500">
                  No Vendor HR accounts provisioned yet.
                </td>
              </tr>
            ) : (
              vendorHRs.map((hr) => (
                <tr key={hr.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-white">{hr.name}</td>
                  <td className="py-3 px-4 text-slate-300">{hr.email}</td>
                  <td className="py-3 px-4 text-slate-400">{hr.phone || "—"}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        hr.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      {hr.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {hr.createdAt ? new Date(hr.createdAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

