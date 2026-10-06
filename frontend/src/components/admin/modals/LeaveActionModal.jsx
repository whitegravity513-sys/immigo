export default function LeaveActionModal({
  leaveActionModal,
  setLeaveActionModal,
  leaveActionRemark,
  setLeaveActionRemark,
  handleSubmitLeaveAction,
  loading,
}) {
  if (!leaveActionModal) return null;

  const isApproved = leaveActionModal.action === "Approved";

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => setLeaveActionModal(null)}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${
            isApproved ? "bg-emerald-50" : "bg-rose-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-base ${
                isApproved ? "bg-emerald-600" : "bg-rose-600"
              }`}
            >
              {isApproved ? "✓" : "✕"}
            </span>
            <h3 className="text-base font-black text-slate-800">
              {isApproved ? "Approve Leave Application" : "Reject Leave Application"}
            </h3>
          </div>
          <button
            className="text-slate-500 text-xl cursor-pointer p-1"
            onClick={() => setLeaveActionModal(null)}
          >
            ×
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Admin Remark{" "}
              {!isApproved ? (
                <span className="text-rose-500">*</span>
              ) : (
                <span className="text-slate-500">(Optional)</span>
              )}
            </label>
            <textarea
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
              placeholder={
                !isApproved ? "Enter reason for rejection..." : "Enter optional remark..."
              }
              value={leaveActionRemark}
              onChange={(e) => setLeaveActionRemark(e.target.value)}
              autoFocus
            />
            {!isApproved && (
              <p className="text-[11px] text-rose-500 font-medium">
                Remark is required when rejecting a leave application.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              className={`flex-1 py-3 text-white font-bold rounded-xl cursor-pointer text-sm ${
                isApproved
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
              onClick={handleSubmitLeaveAction}
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : isApproved
                ? "✓ Confirm Approval"
                : "✕ Confirm Rejection"}
            </button>
            <button
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer text-sm"
              onClick={() => setLeaveActionModal(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
