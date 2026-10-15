import React from "react";
import { Link } from "react-router-dom";
import {
  IndianRupee,
  Receipt,
  TrendingUp,
  CreditCard,
  Plus,
  History,
  CheckCircle,
} from "lucide-react";
import LoadingSkeleton from "../../ui/LoadingSkeleton.jsx";

export function ClientMilestonesTab({
  client,
  clientPayments = [],
  loadingPayments = false,
  formatDate,
  setSelectedMilestone,
  setIsRecordPaymentOpen,
}) {
  if (!client) return null;

  const milestones = client.paymentMilestones || [];
  const totalAgreed =
    client.totalAgreedAmount ||
    milestones.reduce((s, m) => s + (Number(m.paymentAmount) || 0), 0);
  const totalPaid = client.totalPaidAmount || 0;
  const remaining =
    client.remainingAmount !== undefined
      ? client.remainingAmount
      : totalAgreed - totalPaid;
  const completedCount = milestones.filter((m) => m.paymentStatus === "Paid").length;
  const pendingDueCount = milestones.filter(
    (m) =>
      m.paymentStatus === "Pending" ||
      m.paymentStatus === "Due" ||
      m.paymentStatus === "Partially Paid"
  ).length;
  const overdueCount = milestones.filter((m) => m.paymentStatus === "Overdue").length;
  const paidPct =
    totalAgreed > 0
      ? Math.min(100, Math.round((totalPaid / totalAgreed) * 100))
      : 0;

  const statusColors = {
    Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Partially Paid": "bg-blue-50 text-blue-700 border-blue-200",
    Due: "bg-amber-50 text-amber-700 border-amber-200",
    Overdue: "bg-rose-50 text-rose-700 border-rose-200",
    Pending: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <IndianRupee size={13} className="text-blue-600" />
            Total Agreed Amount
          </p>
          <p className="text-2xl font-black text-gray-900 mt-1">
            ₹{Number(totalAgreed).toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Sum of {milestones.length} configured milestones
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Receipt size={13} className="text-emerald-600" />
            Total Amount Paid
          </p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            ₹{Number(totalPaid).toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-emerald-600/80 font-medium mt-1">
            {paidPct}% of agreed amount cleared
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={13} className="text-amber-600" />
            Remaining Balance
          </p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            ₹{Number(remaining).toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Outstanding client milestone obligation
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard size={13} className="text-indigo-600" />
            Milestones Status
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <div>
              <span className="text-xl font-black text-emerald-600">
                {completedCount}
              </span>
              <span className="text-[10px] block text-gray-400 uppercase font-bold">
                Paid
              </span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <span className="text-xl font-black text-blue-600">
                {pendingDueCount}
              </span>
              <span className="text-[10px] block text-gray-400 uppercase font-bold">
                Pending/Due
              </span>
            </div>
            {overdueCount > 0 && (
              <>
                <div className="h-6 w-px bg-gray-200" />
                <div>
                  <span className="text-xl font-black text-rose-600">
                    {overdueCount}
                  </span>
                  <span className="text-[10px] block text-rose-500 uppercase font-bold">
                    Overdue
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
              <span>Milestone Payment Progress</span>
              <span>{paidPct}% Completed</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  paidPct === 100
                    ? "bg-emerald-500"
                    : paidPct > 50
                    ? "bg-blue-600"
                    : "bg-indigo-600"
                }`}
                style={{ width: `${paidPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to={`/client/ledger?clientId=${client.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs transition-colors"
            >
              <Receipt size={14} className="text-gray-500" />
              <span>View in Payment Ledger</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setSelectedMilestone(null);
                setIsRecordPaymentOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/25 transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Record Payment</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Configured Payment Milestones
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Candidate selection and recruitment milestone obligations defined for this client.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-500">
            {milestones.length} Milestones Configured
          </span>
        </div>

        {milestones.length === 0 ? (
          <div className="text-center py-12 px-4">
            <CreditCard size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-700">
              No payment milestones configured
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Edit this client to define milestone schedules or record payments via the ledger.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Milestone Name</th>
                  <th className="py-3 px-4">Agreed Amount</th>
                  <th className="py-3 px-4">Paid / Balance</th>
                  <th className="py-3 px-4">Payment Trigger / Condition</th>
                  <th className="py-3 px-4">Timeline / Expected Date</th>
                  <th className="py-3 px-4">Actual Paid Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {milestones.map((m, idx) => {
                  const amount = Number(m.paymentAmount) || 0;
                  const paidAmt = Number(m.amountPaid) || 0;
                  const bal =
                    m.remainingBalance !== undefined
                      ? Number(m.remainingBalance)
                      : Math.max(0, amount - paidAmt);
                  const status = m.paymentStatus || "Pending";

                  return (
                    <tr key={m.id || idx} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{m.milestoneName}</div>
                        {m.remarks && (
                          <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                            {m.remarks}
                          </div>
                        )}
                        {(m.candidateName || m.projectName) && (
                          <div className="text-[10px] text-blue-600 mt-0.5">
                            {m.candidateName && <span>Candidate: {m.candidateName} </span>}
                            {m.projectName && <span>• Proj: {m.projectName}</span>}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        ₹{amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-emerald-700 font-semibold">
                          ₹{paidAmt.toLocaleString("en-IN")}
                        </div>
                        {bal > 0 && (
                          <div className="text-[11px] text-amber-600 font-medium">
                            Bal: ₹{bal.toLocaleString("en-IN")}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs">
                        <span className="inline-block bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          {m.paymentCondition || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {m.expectedTimeline ||
                          (m.expectedDate ? formatDate(m.expectedDate) : "—")}
                      </td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {m.actualPaymentDate ? formatDate(m.actualPaymentDate) : "—"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            statusColors[status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {status !== "Paid" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMilestone(m);
                              setIsRecordPaymentOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <CreditCard size={12} />
                            <span>Pay</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center gap-1">
                            <CheckCircle size={13} />
                            <span>Cleared</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <History size={16} className="text-blue-600" />
              <span>Client Payment History</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Immutable transaction log of payments made by the company to {client.companyName}.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            {clientPayments.length} Transactions Recorded
          </span>
        </div>

        {loadingPayments ? (
          <div className="p-6">
            <LoadingSkeleton type="card" count={2} />
          </div>
        ) : clientPayments.length === 0 ? (
          <div className="text-center py-10 px-4 text-xs text-gray-500">
            No payment transactions recorded for this client yet. Use "Record Payment" to submit payment vouchers.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Milestone</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Method & Reference</th>
                  <th className="py-3 px-4">GST Treatment</th>
                  <th className="py-3 px-4">Total Transaction</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientPayments.map((p) => (
                  <tr key={p._id || p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {p.paymentId || p._id?.slice(-8)}
                    </td>
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {p.milestoneName || "General Milestone"}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      ₹{Number(p.amountPaid || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-900 font-medium">{p.paymentMethod}</div>
                      {p.transactionReference && (
                        <div className="text-[11px] font-mono text-gray-500">
                          Ref: {p.transactionReference}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div>{p.gstTreatment || "Not Applicable"}</div>
                      {p.gstAmount > 0 && (
                        <div className="text-[11px] text-gray-500">
                          GST: ₹{Number(p.gstAmount).toLocaleString("en-IN")}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      ₹{Number(p.totalTransactionAmount || p.amountPaid || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {p.recordedByName || "Finance Admin"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.paymentStatus === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : p.paymentStatus === "Reversed"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {p.paymentStatus || "Completed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientMilestonesTab;
