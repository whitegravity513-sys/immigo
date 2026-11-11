import { Plus, CheckCircle2 } from "lucide-react";

export default function VendorMilestonesTab({
  milestones,
  onOpenCreateMilestoneModal,
  onOpenDirectPayModal,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Vendor Payment Milestones</h3>
          <p className="text-xs text-slate-400">
            Direct milestone management and payment settlement (Super Admin / Admin only)
          </p>
        </div>
        <button
          onClick={onOpenCreateMilestoneModal}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Milestone</span>
        </button>
      </div>

      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-semibold">Milestone Name</th>
              <th className="py-3 px-4 font-semibold">Project</th>
              <th className="py-3 px-4 font-semibold">Amount</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Paid Amount</th>
              <th className="py-3 px-4 font-semibold">Ref / Due Date</th>
              <th className="py-3 px-4 font-semibold text-right">Direct Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {milestones.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500">
                  No payment milestones configured for this vendor.
                </td>
              </tr>
            ) : (
              milestones.map((m) => (
                <tr key={m.milestoneId || m._id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{m.milestoneName}</div>
                    <div className="text-slate-400 text-[11px] font-mono">{m.milestoneId}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{m.projectName}</td>
                  <td className="py-3 px-4 font-bold text-white">₹{m.amount?.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        m.status === "Paid"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : m.status === "Approved"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-emerald-400">
                    ₹{(m.paidAmount || (m.status === "Paid" ? m.amount : 0)).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {m.paymentReference || (m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "—")}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {m.status !== "Paid" ? (
                      <button
                        onClick={() => onOpenDirectPayModal(m)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                      >
                        Mark as Paid
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-semibold text-xs flex items-center justify-end space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Settled</span>
                      </span>
                    )}
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

