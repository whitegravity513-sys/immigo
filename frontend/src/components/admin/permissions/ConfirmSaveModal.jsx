import { ShieldCheck } from "lucide-react";

export default function ConfirmSaveModal({
  isOpen,
  onClose,
  selectedAdminName,
  changesDiff,
  onConfirm,
  saving,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border-l border-slate-200 p-4 sm:p-5 max-w-sm w-full h-[100dvh] shadow-2xl space-y-3 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-blue-600">
          <ShieldCheck size={20} />
          <h3 className="font-bold text-slate-900 text-sm">Confirm Permission Update</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          You are updating access rights for{" "}
          <strong className="text-slate-900">{selectedAdminName}</strong>.
        </p>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
          <div className="text-emerald-700 font-medium">
            + {changesDiff.added.length} newly granted capabilities
          </div>
          <div className="text-rose-700 font-medium">
            - {changesDiff.removed.length} revoked capabilities
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer text-xs"
          >
            {saving ? "Saving..." : "Confirm & Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

