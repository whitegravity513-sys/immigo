import React from "react";
import { RotateCcw } from "lucide-react";

export default function ClientPaymentReversalModal({
  isOpen,
  payment,
  reason,
  setReason,
  onClose,
  onSubmit,
  submitting,
}) {
  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
            <RotateCcw size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Reverse Payment Entry</h3>
            <p className="text-xs text-gray-500">
              Transaction: {payment.paymentId || payment._id}
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Reversing this entry will subtract the paid amount of{" "}
          <strong className="text-gray-900">
            ₹{Number(payment.amountPaid || 0).toLocaleString("en-IN")}
          </strong>{" "}
          from the client's balance and reinstate the milestone liability. An audit log will be permanently stored.
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Reason for Reversal <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Bank transfer returned, duplicate voucher entry, incorrect account details..."
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-600/25 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting ? "Reversing..." : "Confirm Reversal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
