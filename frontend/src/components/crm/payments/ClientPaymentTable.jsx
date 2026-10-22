import React from "react";
import { Link } from "react-router-dom";
import {
  Receipt,
  Plus,
  ExternalLink,
  Eye,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import LoadingSkeleton from "../ui/LoadingSkeleton.jsx";

const STATUS_COLORS = {
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Reversed: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function ClientPaymentTable({
  loading,
  payments = [],
  totalCount,
  limit,
  setLimit,
  page,
  setPage,
  totalPages,
  formatDate,
  onViewPayment,
  onOpenReversal,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Payment Transactions</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Showing {payments.length} of {totalCount} payment transactions recorded.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalCount > 5 && (
            <button
              type="button"
              onClick={() => {
                if (limit === 5) {
                  setLimit(50);
                  setPage(1);
                } else {
                  setLimit(5);
                  setPage(1);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
            >
              <span>{limit === 5 ? `See All (${totalCount})` : "Show 5 per page"}</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-6">
          <LoadingSkeleton type="table" rows={5} />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 px-4">
          <Receipt size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-800">No payment transactions found</p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            No matching records found for the selected filters. Clear filters or record a new milestone payment.
          </p>
          <Link
            to="/client/ledger/new"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus size={15} />
            <span>Record Payment</span>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2 px-3 text-[10px]">Payment ID & Date</th>
                <th className="py-2 px-3 text-[10px]">Client Name</th>
                <th className="py-2 px-3 text-[10px]">Milestone</th>
                <th className="py-2 px-3 text-[10px]">Amount Paid</th>
                <th className="py-2 px-3 text-[10px]">Status</th>
                <th className="py-2 px-3 text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p._id || p.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-1.5 px-3 whitespace-nowrap">
                    <div className="font-mono font-bold text-blue-700">
                      {p.paymentId || (p._id ? p._id.slice(-8) : "—")}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{formatDate(p.paymentDate)}</div>
                  </td>

                  <td className="py-1.5 px-3">
                    <Link
                      to={`/client/clients/${p.clientId}`}
                      className="font-bold text-gray-900 hover:text-blue-600 flex items-center gap-1"
                    >
                      <span>{p.clientName}</span>
                      <ExternalLink size={11} className="text-gray-400" />
                    </Link>
                    {p.projectName && <div className="text-[11px] text-gray-500 mt-0.5">{p.projectName}</div>}
                  </td>

                  <td className="py-1.5 px-3">
                    <div className="font-semibold text-gray-900">{p.milestoneName}</div>
                    {p.candidateName ? (
                      <div className="text-[11px] text-blue-600 font-medium mt-0.5">
                        Candidate: {p.candidateName}
                      </div>
                    ) : p.remarks ? (
                      <div className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{p.remarks}</div>
                    ) : null}
                  </td>

                  <td className="py-1.5 px-3 whitespace-nowrap font-mono">
                    <div className="font-bold text-gray-950 text-sm">
                      ₹{Number(p.amountPaid || 0).toLocaleString("en-IN")}
                    </div>
                    {p.gstAmount > 0 ? (
                      <div className="text-[10px] text-indigo-600 font-semibold">
                        Incl. GST ₹{Number(p.gstAmount).toLocaleString("en-IN")}
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-400 font-normal">
                        Method: {p.paymentMethod || "Bank"}
                      </div>
                    )}
                  </td>

                  <td className="py-1.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        STATUS_COLORS[p.paymentStatus] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {p.paymentStatus || "Completed"}
                    </span>
                    {p.isReversed && (
                      <div className="text-[10px] text-rose-500 font-semibold mt-0.5">Reversed</div>
                    )}
                  </td>

                  <td className="py-1.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewPayment(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                        title="Open all transaction details"
                      >
                        <Eye size={13} />
                        <span>Open</span>
                      </button>

                      {p.paymentStatus === "Completed" && !p.isReversed && (
                        <button
                          type="button"
                          onClick={() => onOpenReversal(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                          title="Reverse payment entry with audit trail"
                        >
                          <RotateCcw size={12} />
                          <span>Reverse</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="p-4 bg-gray-50/80 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-gray-500 font-medium">
            Showing page {page} of {totalPages} ({totalCount} total entries)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(Math.max(1, page - 1))}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>

            <span className="px-2 font-bold text-gray-800">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
