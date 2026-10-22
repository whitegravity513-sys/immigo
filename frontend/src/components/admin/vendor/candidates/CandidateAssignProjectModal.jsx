import React from "react";

export default function CandidateAssignProjectModal({
  isOpen,
  candidate,
  onClose,
  assignForm,
  setAssignForm,
  clients = [],
  onConfirm,
  loading,
}) {
  if (!isOpen || !candidate) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Assign Project to Candidate</h3>
            <p className="text-xs text-slate-500 mt-1">Assign {candidate.fullName} to an available project.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-lg"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Client & Project *</label>
            <select
              value={assignForm.projectId}
              onChange={(e) => {
                const projId = e.target.value;
                let cId = "";
                let defaultPos = "";
                for (const c of clients) {
                  const proj = c.projects?.find((p) => String(p.id) === String(projId));
                  if (proj) {
                    cId = c.id;
                    if (proj.manpowerRequirements?.length > 0) {
                      defaultPos =
                        proj.manpowerRequirements[0].position ||
                        proj.manpowerRequirements[0].positionTitle;
                    }
                    break;
                  }
                }
                setAssignForm({
                  ...assignForm,
                  projectId: projId,
                  clientId: cId,
                  position: defaultPos,
                });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-600 focus:outline-none"
            >
              <option value="">-- Select Project --</option>
              {clients.map((c) =>
                c.projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {c.companyName} - {p.projectName}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Trade / Position *</label>
            <input
              type="text"
              value={assignForm.position}
              onChange={(e) => setAssignForm({ ...assignForm, position: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-600 focus:outline-none"
              placeholder="e.g. Electrician, Heavy Driver"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || !assignForm.projectId || !assignForm.position}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? "Assigning..." : "Confirm Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}
