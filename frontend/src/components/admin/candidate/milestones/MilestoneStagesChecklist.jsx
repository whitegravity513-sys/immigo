import { Plus, Upload, Trash2, FileText, Eye, X } from "lucide-react";

export default function MilestoneStagesChecklist({
  currentM,
  activeMilestoneIdx,
  milestonesList,
  onAddStage,
  onRemoveStage,
  onStageNameChange,
  onStageStatusChange,
  onStageRemarkChange,
  onFileUploadForStage,
  onRemoveStageDocument,
  autoSyncMilestones,
}) {
  return (
    <div className="p-3 sm:p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Processing Steps & Clearances Checklist
          </h4>
          <p className="text-[10px] text-slate-500">
            Update step statuses, remarks, and upload verification files.
          </p>
        </div>

        <button
          onClick={() => onAddStage(activeMilestoneIdx)}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 flex items-center gap-1 cursor-pointer transition"
        >
          <Plus size={12} />
          <span>Add Step</span>
        </button>
      </div>

      <div className="space-y-1.5">
        {(currentM.stages || []).map((stage, sIdx) => {
          const isDone = stage.status === "Completed";
          const inProgress = stage.status === "In Progress";

          return (
            <div
              key={stage.id || sIdx}
              className={`p-2 rounded-lg border transition-all ${
                isDone
                  ? "bg-slate-50/80 border-slate-200"
                  : inProgress
                  ? "bg-blue-50/40 border-blue-200"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {sIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) => onStageNameChange(activeMilestoneIdx, sIdx, e.target.value)}
                    onBlur={() => autoSyncMilestones(milestonesList)}
                    className="flex-1 px-2 py-0.5 rounded border border-transparent hover:border-slate-300 focus:border-[#163868] bg-transparent font-bold text-xs text-slate-900 focus:bg-white transition"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <select
                    value={stage.status}
                    onChange={(e) => onStageStatusChange(activeMilestoneIdx, sIdx, e.target.value)}
                    className={`px-2 py-1 rounded-md text-xs font-bold border focus:outline-none cursor-pointer ${
                      isDone
                        ? "bg-[#163868] text-white border-[#163868]"
                        : inProgress
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    <option value="Completed">✓ Completed</option>
                    <option value="In Progress">⏳ In Progress</option>
                    <option value="Pending">🔒 Pending</option>
                  </select>

                  <label className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1 cursor-pointer transition">
                    <Upload size={11} />
                    <span>Proof</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => onFileUploadForStage(activeMilestoneIdx, sIdx, e)}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => onRemoveStage(activeMilestoneIdx, sIdx)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="Remove stage"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex-1">
                  <input
                    type="text"
                    value={stage.remark || ""}
                    onChange={(e) => onStageRemarkChange(activeMilestoneIdx, sIdx, e.target.value)}
                    onBlur={() => autoSyncMilestones(milestonesList)}
                    placeholder="Add internal remarks / verification notes..."
                    className="w-full px-2 py-0.5 text-xs text-slate-600 placeholder-slate-400 border border-transparent hover:border-slate-200 focus:border-slate-300 rounded focus:outline-none bg-slate-50/50 focus:bg-white"
                  />
                </div>

                {stage.document && (
                  <div className="flex items-center gap-1.5 bg-blue-50 text-blue-900 px-2 py-0.5 rounded text-xs font-medium border border-blue-200 shrink-0">
                    <FileText size={11} className="text-[#163868]" />
                    <span className="truncate max-w-[130px] font-mono text-[10px]">
                      {stage.document.fileName || stage.document.name}
                    </span>
                    <a
                      href={stage.document.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-0.5 hover:text-[#163868]"
                      title="Preview file"
                    >
                      <Eye size={11} />
                    </a>
                    <button
                      onClick={() => onRemoveStageDocument(activeMilestoneIdx, sIdx)}
                      className="p-0.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Remove file"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

