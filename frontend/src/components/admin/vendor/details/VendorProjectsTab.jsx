import { Plus } from "lucide-react";

export default function VendorProjectsTab({ projects, onOpenAssignModal, onRemoveProject }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Assigned Projects</h3>
          <p className="text-xs text-slate-400">Projects where this vendor is authorized to supply candidates</p>
        </div>
        <button
          onClick={onOpenAssignModal}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Assign Project</span>
        </button>
      </div>

      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-semibold">Project Name</th>
              <th className="py-3 px-4 font-semibold">Project Code</th>
              <th className="py-3 px-4 font-semibold">Assigned Date</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Notes</th>
              <th className="py-3 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {projects.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500">
                  No projects currently assigned to this vendor.
                </td>
              </tr>
            ) : (
              projects.map((p) => (
                <tr key={p.id || p.projectId} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-white">{p.projectName}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{p.projectId}</td>
                  <td className="py-3 px-4 text-slate-300">
                    {p.assignedAt ? new Date(p.assignedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {p.status || "Active"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{p.notes || "—"}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onRemoveProject(p.projectId)}
                      className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                    >
                      Unassign
                    </button>
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

