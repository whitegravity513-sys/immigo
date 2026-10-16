import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  DollarSign,
  TrendingDown,
  Filter,
  Eye,
  FileText,
  Edit3,
  ArrowRight,
} from "lucide-react";
import refundService from "../../../services/refundService.js";

export default function AdminRefundsList() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAll, setShowAll] = useState(false);

  // Refund Action Modal
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [processTotalPaid, setProcessTotalPaid] = useState("");
  const [processRefundAmount, setProcessRefundAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [rejectRefundModal, setRejectRefundModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [editRefundModal, setEditRefundModal] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editTotalPaid, setEditTotalPaid] = useState("");
  const [editRefundAmount, setEditRefundAmount] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editPaymentRef, setEditPaymentRef] = useState("");

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const data = await refundService.getAllRefunds();
      setRefunds(data || []);
    } catch (err) {
      console.error("Failed to load refunds:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProcessModal = (r) => {
    setSelectedRefund(r);
    const totPaid = Number(r.totalPaid || 0);
    setProcessTotalPaid(totPaid);
    const refAmt =
      r.refundAmount !== undefined && r.refundAmount !== null && Number(r.refundAmount) > 0
        ? r.refundAmount
        : totPaid;
    setProcessRefundAmount(refAmt);
    setPaymentRef(r.paymentRef || "");
  };

  const handleCompleteRefund = async () => {
    if (!selectedRefund) return;
    const amtToRefund = Number(processRefundAmount);
    if (isNaN(amtToRefund) || amtToRefund < 0) {
      alert("Please enter a valid refund amount.");
      return;
    }

    const totalPaidVal = Number(processTotalPaid) || Number(selectedRefund.totalPaid || 0);
    const finalStatus =
      amtToRefund >= totalPaidVal && totalPaidVal > 0
        ? "Fully Refunded"
        : amtToRefund > 0
        ? (totalPaidVal > 0 ? "Partially Refunded" : "Fully Refunded")
        : "No Refund";

    try {
      await refundService.updateRefundStatus(
        selectedRefund.id,
        finalStatus,
        paymentRef || "Online / NEFT",
        amtToRefund,
        totalPaidVal
      );
      setSelectedRefund(null);
      setPaymentRef("");
      setProcessRefundAmount("");
      setProcessTotalPaid("");
      loadRefunds();
      alert(`Refund of ₹${amtToRefund.toLocaleString()} processed successfully for ${selectedRefund.candidateName}!`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproveRefund = async (refund) => {
    try {
      await refundService.updateRefundStatus(refund.id, "Refund Pending");
      loadRefunds();
      alert(`Refund request for ${refund.candidateName} approved. It is now in processing queue.`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmRejectRefund = async () => {
    if (!rejectRefundModal) return;
    if (!rejectReason.trim()) { alert("Please enter rejection reason."); return; }
    try {
      await refundService.updateRefundStatus(rejectRefundModal.id, "Rejected", rejectReason);
      setRejectRefundModal(null);
      setRejectReason("");
      loadRefunds();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditRefund = async () => {
    if (!editRefundModal) return;
    try {
      const amt = Number(editRefundAmount);
      const paid = Number(editTotalPaid);
      await refundService.updateRefund(editRefundModal.id, {
        refundStatus: editStatus,
        refundReason: editReason,
        paymentRef: editPaymentRef,
        refundAmount: isNaN(amt) ? 0 : amt,
        totalPaid: isNaN(paid) ? editRefundModal.totalPaid : paid,
      });
      setEditRefundModal(null);
      loadRefunds();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = refunds.filter((r) => {
    if (statusFilter !== "All" && r.refundStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.candidateName?.toLowerCase().includes(q) ||
        r.vendorName?.toLowerCase().includes(q) ||
        r.projectName?.toLowerCase().includes(q) ||
        r.refundReason?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const displayed =
    showAll || searchQuery.trim() || statusFilter !== "All"
      ? filtered
      : filtered.slice(0, 5);

  const getRefundBadge = (status) => {
    switch (status) {
      case "Fully Refunded":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Fully Refunded</span>;
      case "Partially Refunded":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Partially Refunded</span>;
      case "Refund Pending":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Refund Pending</span>;
      case "Pending Admin Approval":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-300">⏳ Pending Approval</span>;
      case "Rejected":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] rounded bg-slate-100 font-semibold">{status}</span>;
    }
  };

  const totalRefundAmount = refunds.reduce((acc, r) => acc + (Number(r.refundAmount) || 0), 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans p-3 sm:p-5">
      {/* Header (Compact & Refined) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Refund Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage refund requests for selected candidates who did not join or deploy on project site.
          </p>
        </div>

        <div className="px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5">
          <TrendingDown size={18} className="text-rose-600 shrink-0" />
          <div>
            <span className="text-[9px] font-semibold text-rose-700 uppercase tracking-wider block">
              Total Refund Pool
            </span>
            <span className="text-base font-bold text-rose-900 leading-none">
              ₹{totalRefundAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate, vendor, project, reason..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            <option value="All">All Refund Statuses</option>
            <option value="Pending Admin Approval">Pending Approval (Vendor Requests)</option>
            <option value="Refund Pending">Refund Pending</option>
            <option value="Partially Refunded">Partially Refunded</option>
            <option value="Fully Refunded">Fully Refunded</option>
            <option value="Rejected">Rejected</option>
            <option value="No Refund">No Refund</option>
          </select>
        </div>
      </div>

      {/* Refunds Table */}
      {loading ? (
        <div className="p-10 text-center bg-white rounded-xl border border-slate-200">
          <div className="w-7 h-7 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Loading refund records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-slate-200">
          <RotateCcw className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No refund records found</h3>
          <p className="text-xs text-slate-500 mt-1">No candidate refund requests match your current filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Top Control Bar (5 items default + See All toggle) */}
          <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Candidate Refund Claims
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                ({displayed.length} of {filtered.length} shown)
              </span>
            </div>

            {filtered.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-blue-600 transition cursor-pointer shadow-2xs"
              >
                <span>{showAll ? "Show Top 5 Only" : `See All (${filtered.length})`}</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5">Candidate</th>
                  <th className="py-2.5 px-3.5">Vendor</th>
                  <th className="py-2.5 px-3.5">Project</th>
                  <th className="py-2.5 px-3.5 text-right">Total Paid</th>
                  <th className="py-2.5 px-3.5 text-right">Refund Amount</th>
                  <th className="py-2.5 px-3.5">Refund Date</th>
                  <th className="py-2.5 px-3.5">Refund Reason</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">{r.candidateName}</td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-700">{r.vendorName}</td>
                    <td className="py-2.5 px-3.5 text-slate-800 font-medium">{r.projectName}</td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                      ₹{Number(r.totalPaid || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-rose-600">
                      {(r.refundStatus === "Rejected" || r.refundStatus === "No Refund") ? "-" : `₹${Number(r.refundAmount || 0).toLocaleString()}`}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500 text-[10px] font-medium">{r.refundDate || "-"}</td>
                    <td className="py-2.5 px-3.5 max-w-[200px] truncate text-slate-600 text-xs">{r.refundReason}</td>
                    <td className="py-2.5 px-3.5">{getRefundBadge(r.refundStatus)}</td>
                    <td className="py-2.5 px-3.5 text-right">
                      {r.refundStatus === "Pending Admin Approval" ? (
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => handleApproveRefund(r)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-2xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => { setRejectRefundModal(r); setRejectReason(""); }}
                            className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (r.refundStatus === "Fully Refunded" || r.refundStatus === "Partially Refunded" || r.refundStatus === "Rejected" || r.refundStatus === "No Refund") ? (
                        <button
                          onClick={() => {
                            setEditRefundModal(r);
                            setEditStatus(r.refundStatus);
                            setEditTotalPaid(r.totalPaid !== undefined ? r.totalPaid : 0);
                            setEditRefundAmount(r.refundAmount !== undefined ? r.refundAmount : r.totalPaid || 0);
                            setEditReason(r.refundReason || "");
                            setEditPaymentRef(r.paymentRef || "");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer border border-slate-300"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{(r.refundStatus === "Rejected" || r.refundStatus === "No Refund") ? r.refundStatus : `Settled (${r.paymentRef || "RTGS"})`} (Edit)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenProcessModal(r)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-2xs"
                        >
                          Process Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Bar: See All on Full Page */}
          {filtered.length > 5 && !showAll && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
              <button
                onClick={() => setShowAll(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                <span>See All ({filtered.length}) Refund Claims on Full Page</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Process Refund Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Process Candidate Refund</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Candidate: <strong className="text-slate-800">{selectedRefund.candidateName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRefund(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Candidate & Project Details */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Vendor Agency:</span>
                <span className="font-bold text-slate-800">{selectedRefund.vendorName || "Skyline HR Solutions"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Project:</span>
                <span className="font-bold text-slate-800">{selectedRefund.projectName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Refund Reason:</span>
                <span className="text-slate-700 italic">{selectedRefund.refundReason || "Did not join"}</span>
              </div>
            </div>

            {/* Total Paid by Vendor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Paid by Vendor (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  value={processTotalPaid}
                  onChange={(e) => setProcessTotalPaid(e.target.value)}
                  placeholder="Total amount paid by vendor..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Amount received from the vendor for this candidate.</p>
            </div>

            {/* Refund Amount to Return (Admin enters this) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Refund Amount to Return (₹) <span className="text-rose-500">*</span>
                </label>
                {Number(processTotalPaid) > 0 && (
                  <span className="text-[11px] font-bold text-slate-400">
                    Paid: ₹{Number(processTotalPaid).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  value={processRefundAmount}
                  onChange={(e) => setProcessRefundAmount(e.target.value)}
                  placeholder="Enter amount to refund..."
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border-2 border-rose-300 text-sm font-mono font-black text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-rose-50/30"
                />
              </div>

              {/* Quick Preset Buttons if totalPaid > 0 */}
              {Number(processTotalPaid) > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Set:</span>
                  <button
                    type="button"
                    onClick={() => setProcessRefundAmount(processTotalPaid)}
                    className="px-2 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-bold cursor-pointer"
                  >
                    100% Full (₹{Number(processTotalPaid).toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProcessRefundAmount(Math.round(processTotalPaid * 0.9))}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                  >
                    90% (₹{Math.round(processTotalPaid * 0.9).toLocaleString()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProcessRefundAmount(Math.round(processTotalPaid * 0.5))}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                  >
                    50% (₹{Math.round(processTotalPaid * 0.5).toLocaleString()})
                  </button>
                </div>
              )}
            </div>

            {/* Payment Reference */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Reference / Transaction ID
              </label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. RTGS-88992211 / UPI Ref / Cheque"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRefund(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteRefund}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
              >
                Confirm Refund (₹{Number(processRefundAmount || 0).toLocaleString()})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Refund Modal */}
      {rejectRefundModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reject Refund Request</h3>
            <p className="text-xs text-slate-500">
              Rejecting refund request for <strong>{rejectRefundModal.candidateName}</strong>. Please provide a reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 outline-none"
            />
            <div className="flex items-center gap-2 pt-1">
              <button type="button" onClick={() => setRejectRefundModal(null)} className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button type="button" onClick={handleConfirmRejectRefund} className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Refund Modal */}
      {editRefundModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Refund Record</h3>
              <button
                onClick={() => setEditRefundModal(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-slate-500">
              Editing refund for <strong>{editRefundModal.candidateName}</strong> (Vendor: {editRefundModal.vendorName}).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Fully Refunded">Fully Refunded</option>
                  <option value="Partially Refunded">Partially Refunded</option>
                  <option value="Refund Pending">Refund Pending</option>
                  <option value="Rejected">Rejected</option>
                  <option value="No Refund">No Refund</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Paid by Vendor (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={editTotalPaid}
                    onChange={(e) => setEditTotalPaid(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Refund Amount to Return (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={editRefundAmount}
                    onChange={(e) => setEditRefundAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
                <textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Reference (if settled)</label>
                <input
                  type="text"
                  value={editPaymentRef}
                  onChange={(e) => setEditPaymentRef(e.target.value)}
                  placeholder="e.g. RTGS-88992211"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditRefundModal(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditRefund}
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
