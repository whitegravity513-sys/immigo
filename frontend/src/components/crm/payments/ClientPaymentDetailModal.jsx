import React from "react";
import { Link } from "react-router-dom";
import { Receipt, X, ExternalLink, RotateCcw, FileCheck } from "lucide-react";

export default function ClientPaymentDetailModal({
  viewingPayment,
  onClose,
  formatDate,
  onOpenReversal,
}) {
  if (!viewingPayment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-2xl w-full overflow-hidden my-6">
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Receipt size={20} className="text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {viewingPayment.paymentId || "Transaction Details"}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                  {viewingPayment.paymentStatus || "Completed"}
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Recorded on {formatDate(viewingPayment.paymentDate)} by {viewingPayment.recordedByName || "System"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Client Organization
              </span>
              <Link
                to={`/client/clients/${viewingPayment.clientId}`}
                className="font-bold text-sm text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
              >
                <span>{viewingPayment.clientName}</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Project & Candidate
              </span>
              <p className="font-semibold text-gray-900 mt-0.5">
                {viewingPayment.projectName || "General Account Disbursement"}
              </p>
              {viewingPayment.candidateName && (
                <p className="text-[11px] text-blue-600 font-medium">
                  Candidate: {viewingPayment.candidateName}
                </p>
              )}
            </div>
          </div>

          <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-200 space-y-2.5">
            <h4 className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
              Milestone Disbursement Summary
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-gray-500 text-[10px] block">Milestone Name</span>
                <span className="font-bold text-gray-900 text-xs">{viewingPayment.milestoneName}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Agreed Milestone</span>
                <span className="font-bold text-gray-900 text-xs font-mono">
                  ₹{Number(viewingPayment.agreedMilestoneAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Amount Paid</span>
                <span className="font-black text-emerald-700 text-sm font-mono">
                  ₹{Number(viewingPayment.amountPaid || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Milestone Balance</span>
                <span className="font-bold text-amber-700 text-xs font-mono">
                  ₹{Number(viewingPayment.remainingMilestoneBalance || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Banking & Reference
              </h4>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Method:</span>
                  <span className="font-semibold text-gray-900">
                    {viewingPayment.paymentMethod || "Bank Transfer"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction / UTR:</span>
                  <span className="font-mono font-bold text-blue-700">
                    {viewingPayment.transactionReference || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Date:</span>
                  <span className="text-gray-900 font-medium">
                    {formatDate(viewingPayment.paymentDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Tax & GST Handling
              </h4>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">GST Treatment:</span>
                  <span className="font-semibold text-gray-900">
                    {viewingPayment.gstTreatment || "Not Applicable"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">GST Amount:</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {viewingPayment.gstAmount > 0
                      ? `₹${Number(viewingPayment.gstAmount).toLocaleString("en-IN")} (${
                          viewingPayment.gstRate || 18
                        }%)`
                      : "₹0"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 font-bold">
                  <span className="text-gray-800">Total Transaction:</span>
                  <span className="font-mono text-emerald-700">
                    ₹
                    {Number(
                      viewingPayment.totalTransactionAmount || viewingPayment.amountPaid || 0
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {viewingPayment.remarks && (
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-amber-900">
              <span className="text-[10px] font-bold text-amber-700 uppercase block mb-0.5">
                Remarks / Notes
              </span>
              <p>{viewingPayment.remarks}</p>
            </div>
          )}

          {viewingPayment.paymentProofUrl && (
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-emerald-600" />
                <div>
                  <p className="font-bold text-gray-800">Payment Proof Attached</p>
                  <p className="text-[10px] text-gray-500">
                    {viewingPayment.paymentProofName || "Bank advice / voucher"}
                  </p>
                </div>
              </div>
              <a
                href={viewingPayment.paymentProofUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-blue-600 font-bold hover:bg-blue-50 transition-colors"
              >
                View Document
              </a>
            </div>
          )}

          {viewingPayment.isReversed && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 space-y-1">
              <span className="text-[10px] font-bold text-rose-700 uppercase block">
                Transaction Reversal Record
              </span>
              <p className="font-semibold">Reason: {viewingPayment.reversalReason || "No reason specified"}</p>
              <p className="text-[10px] text-rose-600">Reversed on: {formatDate(viewingPayment.reversedAt)}</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div>
            {!viewingPayment.isReversed && viewingPayment.paymentStatus === "Completed" && (
              <button
                type="button"
                onClick={() => onOpenReversal(viewingPayment)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reverse Payment</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
