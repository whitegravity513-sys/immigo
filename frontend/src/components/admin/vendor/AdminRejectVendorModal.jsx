
export function AdminRejectVendorModal({
  isOpen,
  onClose,
  selectedVendor,
  rejectionReason,
  setRejectionReason,
  onConfirmReject,
}) {
  if (!isOpen || !selectedVendor) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-md w-full h-[100dvh] p-4 sm:p-6 shadow-2xl border-l border-slate-200 space-y-4 overflow-y-auto animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-slate-900">Confirm Rejection</h3>
        <p className="text-xs text-slate-500">
          {selectedVendor.mouSigned ||
          selectedVendor.mouStatus === "Under Review" ||
          String(selectedVendor.status || "").includes("MOU")
            ? "Please enter the reason for rejecting the submitted MOU for "
            : "Please enter the reason for rejecting "}
          <strong>{selectedVendor.companyName}</strong>.
        </p>

        <textarea
          rows={3}
          required
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="e.g. MEA recruitment license expired or invalid commercial registration doc..."
          className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
        />

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmReject}
            className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}
