import React from "react";
import { IndianRupee, X } from "lucide-react";

export default function MilestonePaymentModal({
  isOpen,
  onClose,
  currentM,
  paymentForm,
  setPaymentForm,
  onConfirmPayment,
}) {
  if (!isOpen || !currentM) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden">
        <div className="px-4 py-2.5 bg-[#163868] text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <IndianRupee size={15} />
            <h3 className="font-bold text-xs">Record Milestone Fee Payment</h3>
          </div>
          <button onClick={onClose} className="text-white hover:text-slate-200 cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={onConfirmPayment} className="p-3.5 space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Payment Amount (₹)
            </label>
            <input
              type="number"
              required
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-xs text-slate-900 focus:outline-none focus:border-[#163868]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Payment Mode
            </label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#163868] cursor-pointer"
            >
              <option value="Online">Online / UPI Gateway</option>
              <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
              <option value="Cash">Cash Receipt</option>
              <option value="Cheque">Demand Draft / Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Transaction / Reference ID *
            </label>
            <input
              type="text"
              required
              value={paymentForm.paymentRef}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentRef: e.target.value })}
              placeholder="e.g. TXN-98218-HDFC"
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#163868]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Remarks
            </label>
            <input
              type="text"
              value={paymentForm.remarks}
              onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
              placeholder="e.g. Paid via direct client bank portal"
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#163868]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#163868] hover:bg-[#1e4a82] text-white font-bold cursor-pointer text-xs shadow-2xs"
            >
              Confirm & Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

