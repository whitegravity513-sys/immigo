import React from "react";
import { CreditCard, CheckCircle2, X } from "lucide-react";

export default function CandidatePaymentModal({
  isOpen = false,
  onClose = () => {},
  selectedMilestone,
  paymentTypeTab,
  setPaymentTypeTab,
  submittingPayment,
  paymentRefInput,
  setPaymentRefInput,
  paymentNotesInput,
  setPaymentNotesInput,
  onPayMilestone,
}) {
  if (!isOpen || !selectedMilestone) return null;

  const amt = Number(
    selectedMilestone.paymentAmount || selectedMilestone.amount || 15000
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="p-3 sm:p-3.5 bg-gradient-to-r from-[#163868] via-[#1e4a82] to-[#2563eb] text-white flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-cyan-300" />
              <span>Pay Milestone Fee via Razorpay</span>
            </h3>
            <p className="text-[10px] text-blue-100 mt-0.5 truncate">
              {selectedMilestone.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 cursor-pointer transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-3.5 space-y-3 text-xs text-slate-800">
          <div className="bg-blue-50/80 p-2.5 rounded-lg border border-blue-200 flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase font-semibold text-blue-700 block">
                Total Due For This Milestone
              </span>
              <span className="text-sm font-bold text-blue-950">
                ₹{amt.toLocaleString()}
              </span>
            </div>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-semibold text-[10px]">
              Phase Payment
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 border-b border-slate-200 pb-2.5">
            <button
              type="button"
              onClick={() => setPaymentTypeTab("online")}
              className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition ${
                paymentTypeTab === "online"
                  ? "bg-[#163868] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              ⚡ Razorpay Online (UPI/Cards)
            </button>
            <button
              type="button"
              onClick={() => setPaymentTypeTab("manual")}
              className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition ${
                paymentTypeTab === "manual"
                  ? "bg-[#163868] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              🏦 Bank Transfer / NEFT
            </button>
          </div>

          {paymentTypeTab === "online" ? (
            <div className="space-y-2.5 py-0.5">
              <p className="text-[11px] text-slate-600 leading-normal">
                Pay securely via <strong>Razorpay Payment Gateway</strong> using UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Card, or NetBanking.
              </p>

              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-[10px] text-emerald-800 space-y-1">
                <div className="font-semibold flex items-center gap-1 text-emerald-900">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Instant Automated Approval via Razorpay</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[9px] text-emerald-700">
                  <span className="px-1.5 py-0.5 rounded bg-white/80 border border-emerald-200 font-medium">Google Pay</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/80 border border-emerald-200 font-medium">PhonePe</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/80 border border-emerald-200 font-medium">Paytm</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/80 border border-emerald-200 font-medium">UPI QR</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/80 border border-emerald-200 font-medium">Cards & NetBanking</span>
                </div>
              </div>

              <button
                type="button"
                disabled={submittingPayment}
                onClick={() => onPayMilestone(true)}
                className="w-full py-2.5 rounded-lg bg-[#163868] hover:bg-[#1e4a82] text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition disabled:opacity-50"
              >
                {submittingPayment ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CreditCard size={13} />
                )}
                <span>
                  Pay ₹{amt.toLocaleString()} via Razorpay
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 py-0.5">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5 text-slate-700 font-mono text-[10px]">
                <div className="font-semibold text-slate-900 font-sans text-[11px] mb-0.5">
                  Company Account Details:
                </div>
                <div>
                  Bank: <strong>HDFC Bank Ltd.</strong>
                </div>
                <div>
                  A/C Name: <strong>Immigo Global Mobility Pvt Ltd</strong>
                </div>
                <div>
                  A/C No: <strong>50200084920192</strong>
                </div>
                <div>
                  IFSC: <strong>HDFC0001234</strong>
                </div>
                <div>
                  UPI ID: <strong>immigo.recruitment@hdfcbank</strong>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-0.5">
                  Transaction Ref / UTR Number *
                </label>
                <input
                  type="text"
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  placeholder="e.g. UTR9281729381"
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 font-mono text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-0.5">
                  Optional Payment Notes / Bank Name
                </label>
                <input
                  type="text"
                  value={paymentNotesInput}
                  onChange={(e) => setPaymentNotesInput(e.target.value)}
                  placeholder="e.g. Paid from SBI Account"
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="button"
                disabled={submittingPayment}
                onClick={() => onPayMilestone(false)}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition disabled:opacity-50"
              >
                {submittingPayment ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 size={13} />
                )}
                <span>Submit Payment Reference for Admin Approval</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
