import React from "react";
import {
  X,
  Receipt,
  Building2,
  Calendar,
  CreditCard,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  History,
  User,
  Tag,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FileText,
} from "lucide-react";

export function TransactionDetailModal({ isOpen, onClose, transaction, type = "payment", onEdit }) {
  if (!isOpen || !transaction) return null;

  const isPayment = type === "payment";

  const getStatusBadge = (status) => {
    switch (status) {
      case "Verified":
      case "Completed":
      case "Paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Pending Verification":
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Approved":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Reversed":
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Received":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return String(d);
    }
  };

  const formatDateTime = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(d);
    }
  };

  const proofUrl = transaction.paymentProofUrl || transaction.proofUrl || transaction.receipt;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isPayment ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}
            >
              {isPayment ? <Receipt size={20} /> : <TrendingDown size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  {isPayment ? "Payment Received Voucher" : "Client Expense Voucher"}
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                    transaction.status || transaction.paymentStatus
                  )}`}
                >
                  {transaction.status || transaction.paymentStatus || "Verified"}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Ref ID: {transaction.paymentId || transaction.id || transaction._id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Amount Card */}
          <div
            className={`rounded-xl p-5 border ${
              isPayment
                ? "bg-emerald-50/60 border-emerald-200/80"
                : "bg-rose-50/60 border-rose-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {isPayment ? "Total Received Amount" : "Expense Amount Paid"}
                </p>
                <p
                  className={`text-3xl font-black mt-1 ${
                    isPayment ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  ₹{Number(transaction.amountPaid || transaction.amount || 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Transaction Date</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {formatDate(transaction.paymentDate || transaction.date)}
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <span className="text-gray-400 block font-medium">Client Organization</span>
              <span className="font-bold text-gray-900 text-sm mt-0.5 block">
                {transaction.clientName || transaction.client?.name || transaction.client?.company || "—"}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <span className="text-gray-400 block font-medium">Project Name</span>
              <span className="font-bold text-gray-900 text-sm mt-0.5 block">
                {transaction.projectName || "General Client Engagement"}
              </span>
            </div>

            {isPayment ? (
              <>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <span className="text-gray-400 block font-medium">Milestone</span>
                  <span className="font-bold text-gray-900 mt-0.5 block">
                    {transaction.milestoneName || "Milestone Payment"}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <span className="text-gray-400 block font-medium">Received By</span>
                  <span className="font-bold text-gray-900 mt-0.5 block">
                    {transaction.receivedBy || transaction.recordedBy || "Admin"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <span className="text-gray-400 block font-medium">Expense Category</span>
                  <span className="font-bold text-blue-700 mt-0.5 block">
                    {transaction.categoryName || transaction.category?.name || "General"}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <span className="text-gray-400 block font-medium">Paid To</span>
                  <span className="font-bold text-gray-900 mt-0.5 block">
                    {transaction.paidTo || "Vendor / Employee"}
                  </span>
                </div>
              </>
            )}

            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <span className="text-gray-400 block font-medium">Payment Method</span>
              <span className="font-semibold text-gray-900 mt-0.5 block">
                {transaction.paymentMethod || transaction.paymentMode || "Bank Transfer"}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <span className="text-gray-400 block font-medium">UTR / Transaction Ref</span>
              <span className="font-mono font-bold text-blue-700 mt-0.5 block select-all">
                {transaction.transactionReference || transaction.transactionRef || "—"}
              </span>
            </div>
          </div>

          {/* Milestone Financial Breakdown (for Payments) */}
          {isPayment && (transaction.totalMilestoneAmount > 0 || transaction.agreedMilestoneAmount > 0) && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Milestone Settlement Context
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Total Milestone</span>
                  <span className="text-sm font-black text-gray-900 mt-0.5 block">
                    ₹{Number(transaction.totalMilestoneAmount || transaction.agreedMilestoneAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Previously Received</span>
                  <span className="text-sm font-black text-blue-600 mt-0.5 block">
                    ₹{Number(transaction.previouslyReceivedAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Remaining Balance</span>
                  <span className="text-sm font-black text-amber-600 mt-0.5 block">
                    ₹{Number(transaction.remainingMilestoneAmount !== undefined ? transaction.remainingMilestoneAmount : transaction.remainingMilestoneBalance || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Description / Remarks */}
          {(transaction.remarks || transaction.description || transaction.notes) && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Description & Remarks
              </h4>
              <p className="text-xs text-gray-700 leading-relaxed">
                {transaction.description || transaction.remarks || transaction.notes}
              </p>
            </div>
          )}

          {/* Attachment Preview */}
          {proofUrl && (
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <FileCheck size={14} className="text-emerald-600" />
                  <span>Payment Receipt / Proof Attachment</span>
                </span>
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink size={12} />
                  <span>Open Full Document</span>
                </a>
              </div>
              {proofUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(proofUrl) ? (
                <div className="rounded-lg overflow-hidden border border-gray-200 max-h-48 bg-white flex items-center justify-center">
                  <img src={proofUrl} alt="Receipt proof" className="max-h-48 object-contain" />
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-600">
                  <FileText size={18} className="text-gray-400" />
                  <span className="truncate flex-1 font-mono">
                    {transaction.paymentProofName || "receipt_attachment.pdf"}
                  </span>
                  <a
                    href={proofUrl}
                    download="payment_proof"
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded text-[11px]"
                  >
                    Download
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Audit History */}
          {Array.isArray(transaction.auditTrail) && transaction.auditTrail.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <History size={13} className="text-gray-500" />
                <span>Audit & Update History</span>
              </h4>
              <div className="space-y-2">
                {transaction.auditTrail.map((audit, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <span className="font-bold text-gray-900 block">
                        {audit.action?.replace(/_/g, " ")} by {audit.performedBy || audit.updatedBy || "Admin"}
                      </span>
                      {audit.note && <span className="text-gray-600 mt-0.5 block">{audit.note}</span>}
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono shrink-0 whitespace-nowrap">
                      {formatDateTime(audit.timestamp || audit.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(transaction);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Edit Transaction
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionDetailModal;
