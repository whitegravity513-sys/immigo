import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  RotateCcw,
  Search,
  TrendingDown,
  Edit3,
  ArrowRight,
  FileText,
  Check,
  X,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import refundService, { isRefundReassignEligible } from "../../../services/refundService.js";

const REFUND_STORAGE_KEYS = new Set([
  "immigo_crm_refunds_v3",
  "immigo_crm_applications_v3",
]);

export default function AdminRefundsList() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAll, setShowAll] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [processTotalPaid, setProcessTotalPaid] = useState("");
  const [processRefundAmount, setProcessRefundAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [processRemarks, setProcessRemarks] = useState("");
  const [modalError, setModalError] = useState("");
  const [savingAction, setSavingAction] = useState(false);

  const [rejectRefundModal, setRejectRefundModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [editRefundModal, setEditRefundModal] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editTotalPaid, setEditTotalPaid] = useState("");
  const [editRefundAmount, setEditRefundAmount] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editPaymentRef, setEditPaymentRef] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [feedback, setFeedback] = useState(null);
  const lastFetchAtRef = useRef(0);

  const loadRefunds = useCallback(async (silent = false) => {
    lastFetchAtRef.current = Date.now();
    try {
      if (silent !== true) {
        setLoading(true);
      }
      const data = await refundService.getAllRefunds();
      setRefunds(data || []);
    } catch (err) {
      console.error("Failed to load refunds:", err);
    } finally {
      if (silent !== true) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadRefunds(false);
    }, 0);
    let debounceTimer = null;
    const handleUpdate = (e) => {
      if (e?.type === "storage" && (!e.key || !REFUND_STORAGE_KEYS.has(e.key))) {
        return;
      }
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadRefunds(true);
      }, 60);
    };
    const handleFocusOrVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      if (Date.now() - lastFetchAtRef.current < 3000) {
        return;
      }
      loadRefunds(true);
    };
    window.addEventListener("immigo:refund-update", handleUpdate);
    window.addEventListener("immigo:application-update", handleUpdate);
    window.addEventListener("immigo:admin-notification", handleFocusOrVisible);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        loadRefunds(true);
      }
    }, 25000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("immigo:refund-update", handleUpdate);
      window.removeEventListener("immigo:application-update", handleUpdate);
      window.removeEventListener("immigo:admin-notification", handleFocusOrVisible);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
    };
  }, [loadRefunds]);

  const handleOpenProcessModal = (r) => {
    setSelectedRefund(r);
    setModalError("");
    const totPaid = Number(r.totalPaid || 0);
    setProcessTotalPaid(totPaid);
    const refAmt =
      r.refundAmount !== undefined && r.refundAmount !== null && Number(r.refundAmount) >= 0
        ? r.refundAmount
        : totPaid;
    setProcessRefundAmount(refAmt);
    setPaymentRef(r.paymentRef || "");
    setProcessRemarks(r.remarks || "");
  };

  const resetProcessModal = () => {
    setSelectedRefund(null);
    setPaymentRef("");
    setProcessRefundAmount("");
    setProcessTotalPaid("");
    setProcessRemarks("");
    setModalError("");
  };

  const handleSavePendingPayout = async () => {
    if (!selectedRefund) return;
    const amtToRefund = Number(processRefundAmount);
    if (processRefundAmount === "" || Number.isNaN(amtToRefund) || amtToRefund < 0) {
      setModalError("Please enter a valid payable refund amount.");
      return;
    }
    const totalPaidVal = Number(processTotalPaid) || Number(selectedRefund.totalPaid || 0);
    try {
      setSavingAction(true);
      setModalError("");
      await refundService.updateRefundStatus(
        selectedRefund.id,
        "Refund Pending",
        paymentRef.trim(),
        amtToRefund,
        totalPaidVal,
        processRemarks.trim()
      );
      const candName = selectedRefund.candidateName;
      resetProcessModal();
      await loadRefunds(true);
      setFeedback({
        type: "success",
        text: `Approved refund payout of ₹${amtToRefund.toLocaleString()} saved for ${candName} (Status: Refund Pending).`,
      });
    } catch (err) {
      setModalError(err.message || "Failed to save refund payout details.");
    } finally {
      setSavingAction(false);
    }
  };

  const handleCompleteRefund = async () => {
    if (!selectedRefund) return;
    const amtToRefund = Number(processRefundAmount);
    if (processRefundAmount === "" || Number.isNaN(amtToRefund) || amtToRefund < 0) {
      setModalError("Please enter a valid refund amount.");
      return;
    }
    const cleanRef = paymentRef.trim();
    if (amtToRefund > 0 && !cleanRef) {
      setModalError("Please enter a Payment Reference / Transaction ID to confirm payout, or click Save Amount & Keep Pending.");
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
      setSavingAction(true);
      setModalError("");
      await refundService.updateRefundStatus(
        selectedRefund.id,
        finalStatus,
        cleanRef,
        amtToRefund,
        totalPaidVal,
        processRemarks.trim()
      );
      const candName = selectedRefund.candidateName;
      resetProcessModal();
      await loadRefunds(true);
      setFeedback({
        type: "success",
        text: `Refund of ₹${amtToRefund.toLocaleString()} settled (${finalStatus})${cleanRef ? ` with Ref: ${cleanRef}` : ""} for ${candName}.`,
      });
    } catch (err) {
      setModalError(err.message || "Failed to complete refund.");
    } finally {
      setSavingAction(false);
    }
  };

  const handleApproveRefund = async (refund) => {
    try {
      setSavingAction(true);
      setFeedback(null);
      const updated = await refundService.updateRefundStatus(refund.id, "Refund Pending");
      await loadRefunds(true);
      setFeedback({
        type: "success",
        text: `Refund request for ${refund.candidateName} approved. Enter the refund payout amount and payment reference ID.`,
      });
      handleOpenProcessModal(updated || { ...refund, refundStatus: "Refund Pending" });
    } catch (err) {
      setFeedback({ type: "error", text: err.message || "Failed to approve refund request." });
    } finally {
      setSavingAction(false);
    }
  };

  const handleConfirmRejectRefund = async () => {
    if (!rejectRefundModal) return;
    if (!rejectReason.trim()) {
      setModalError("Please enter a rejection reason.");
      return;
    }
    try {
      setSavingAction(true);
      setModalError("");
      await refundService.updateRefundStatus(
        rejectRefundModal.id,
        "Rejected",
        "",
        0,
        rejectRefundModal.totalPaid ?? 0,
        rejectReason.trim()
      );
      const candName = rejectRefundModal.candidateName;
      setRejectRefundModal(null);
      setRejectReason("");
      await loadRefunds(true);
      setFeedback({
        type: "success",
        text: `Refund request for ${candName} has been rejected.`,
      });
    } catch (err) {
      setModalError(err.message || "Failed to reject refund request.");
    } finally {
      setSavingAction(false);
    }
  };

  const handleEditRefund = async () => {
    if (!editRefundModal) return;
    try {
      setSavingAction(true);
      setModalError("");
      const amt = Number(editRefundAmount);
      const paid = Number(editTotalPaid);
      await refundService.updateRefund(editRefundModal.id, {
        refundStatus: editStatus,
        refundReason: editReason,
        paymentRef: editPaymentRef.trim(),
        remarks: editRemarks.trim(),
        refundAmount: Number.isNaN(amt) ? 0 : amt,
        totalPaid: Number.isNaN(paid) ? editRefundModal.totalPaid : paid,
      });
      const candName = editRefundModal.candidateName;
      setEditRefundModal(null);
      await loadRefunds(true);
      setFeedback({
        type: "success",
        text: `Refund record updated for ${candName}.`,
      });
    } catch (err) {
      setModalError(err.message || "Failed to update refund record.");
    } finally {
      setSavingAction(false);
    }
  };

  const statusCounts = {
    All: refunds.length,
    "Pending Admin Approval": refunds.filter((r) => r.refundStatus === "Pending Admin Approval").length,
    "Refund Pending": refunds.filter((r) => r.refundStatus === "Refund Pending").length,
    REFUNDED_ALL: refunds.filter((r) => r.refundStatus === "Fully Refunded" || r.refundStatus === "Partially Refunded").length,
    Rejected: refunds.filter((r) => r.refundStatus === "Rejected" || r.refundStatus === "No Refund").length,
  };

  const filtered = refunds.filter((r) => {
    if (statusFilter === "REFUNDED_ALL") {
      if (r.refundStatus !== "Fully Refunded" && r.refundStatus !== "Partially Refunded") return false;
    } else if (statusFilter === "Rejected") {
      if (r.refundStatus !== "Rejected" && r.refundStatus !== "No Refund") return false;
    } else if (statusFilter !== "All" && r.refundStatus !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.candidateName?.toLowerCase().includes(q) ||
        String(r.candidateId || "").toLowerCase().includes(q) ||
        String(r.id || "").toLowerCase().includes(q) ||
        r.vendorName?.toLowerCase().includes(q) ||
        r.projectName?.toLowerCase().includes(q) ||
        r.clientName?.toLowerCase().includes(q) ||
        r.refundReason?.toLowerCase().includes(q) ||
        r.paymentRef?.toLowerCase().includes(q)
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
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-300">Pending Approval</span>;
      case "Rejected":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] rounded bg-slate-100 font-semibold">{status}</span>;
    }
  };

  const totalRefundAmount = refunds.reduce(
    (acc, r) =>
      r.refundStatus === "Rejected" || r.refundStatus === "No Refund"
        ? acc
        : acc + (Number(r.refundAmount) || 0),
    0
  );

  return (
    <div className="space-y-3 max-w-7xl mx-auto font-sans p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Refund Management</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Manage refund requests for selected candidates who did not join or deploy on project site.
          </p>
        </div>

        <div className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5">
          <TrendingDown size={18} className="text-rose-600 shrink-0" />
          <div>
            <span className="text-[9px] font-semibold text-rose-700 uppercase tracking-wider block">
              Total Refund Pool
            </span>
            <span className="text-xs sm:text-sm font-bold text-rose-900 leading-none">
              ₹{totalRefundAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 border ${
            feedback.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "error" ? (
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
            ) : (
              <Check size={15} className="text-emerald-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate, vendor, project, reason, or ref ID..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: "All", label: "All" },
            { key: "Pending Admin Approval", label: "Pending Approval" },
            { key: "Refund Pending", label: "Approved (Pending Payout)" },
            { key: "REFUNDED_ALL", label: "Refunded" },
            { key: "Rejected", label: "Rejected / No Refund" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer inline-flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusFilter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {statusCounts[tab.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

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
          <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
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
            <table className="w-full min-w-[880px] text-left text-xs">
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
                    <td className="py-2.5 px-3.5 max-w-[200px] text-slate-600 text-xs">
                      <span className="truncate block" title={r.refundReason}>{r.refundReason}</span>
                      {r.remarks && (
                        <span className="text-[10px] text-slate-500 block mt-0.5 truncate" title={r.remarks}>
                          Note: {r.remarks}
                        </span>
                      )}
                      {r.refundDocument && (
                        r.refundDocumentData ? (
                          <a
                            href={r.refundDocumentData}
                            download={r.refundDocument}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:underline mt-0.5"
                          >
                            <FileText size={10} />
                            <span className="truncate max-w-[160px]">{r.refundDocument}</span>
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                            <FileText size={10} />
                            <span className="truncate max-w-[160px]">{r.refundDocument}</span>
                          </span>
                        )
                      )}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="flex flex-col items-start gap-1">
                        {getRefundBadge(r.refundStatus)}
                        {r.paymentRef && r.refundStatus !== "Rejected" && (
                          <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            Ref: {r.paymentRef}
                          </span>
                        )}
                        {r.reassigned && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Reassigned{r.reassignedProjectName ? ` → ${r.reassignedProjectName}` : ""}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {r.refundStatus === "Pending Admin Approval" ? (
                          <>
                            <button
                              type="button"
                              disabled={savingAction}
                              onClick={() => handleApproveRefund(r)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-2xs disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={savingAction}
                              onClick={() => {
                                setRejectRefundModal(r);
                                setRejectReason("");
                                setModalError("");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold cursor-pointer disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        ) : (r.refundStatus === "Fully Refunded" || r.refundStatus === "Partially Refunded" || r.refundStatus === "Rejected" || r.refundStatus === "No Refund") ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditRefundModal(r);
                              setEditStatus(r.refundStatus);
                              setEditTotalPaid(r.totalPaid !== undefined ? r.totalPaid : 0);
                              setEditRefundAmount(r.refundAmount !== undefined ? r.refundAmount : r.totalPaid || 0);
                              setEditReason(r.refundReason || "");
                              setEditPaymentRef(r.paymentRef || "");
                              setEditRemarks(r.remarks || "");
                              setModalError("");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition inline-flex items-center gap-1 cursor-pointer border border-slate-300"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Details</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenProcessModal(r)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-2xs inline-flex items-center gap-1"
                          >
                            <IndianRupee className="w-3 h-3" />
                            <span>Set Payout / Pay</span>
                          </button>
                        )}
                        {isRefundReassignEligible(r) && (
                          <Link
                            to={`/admin/vendor/reassign?appId=${encodeURIComponent(r.applicationId)}&refundId=${encodeURIComponent(r.id || "")}`}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold inline-flex items-center gap-1 shadow-2xs transition"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reassign Candidate</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

      {selectedRefund && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Approve &amp; Set Refund Payout</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Candidate: <strong className="text-slate-800">{selectedRefund.candidateName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={resetProcessModal}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2 border border-rose-200">
                <AlertCircle size={14} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500 font-medium">Vendor Agency:</span>
                <span className="font-bold text-slate-800 text-right">{selectedRefund.vendorName || "Vendor Partner"}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-500 font-medium">Project:</span>
                <span className="font-bold text-slate-800 text-right">{selectedRefund.projectName}</span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-500 font-medium shrink-0">Refund Reason:</span>
                <span className="text-slate-700 text-right">{selectedRefund.refundReason || "Did not join"}</span>
              </div>
            </div>

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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Refund Amount to Pay (₹) <span className="text-rose-500">*</span>
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
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border-2 border-rose-300 text-sm font-mono font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-rose-50/30"
                />
              </div>

              {Number(processTotalPaid) > 0 && (
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Reference / Transaction ID
              </label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. RTGS-88992211 / UTR / UPI Ref"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">
                Leave empty if payout is pending and save amount first; enter Ref ID once transferred.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Remarks (Optional)
              </label>
              <input
                type="text"
                value={processRemarks}
                onChange={(e) => setProcessRemarks(e.target.value)}
                placeholder="Optional settlement note for vendor..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={savingAction}
                  onClick={handleSavePendingPayout}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold cursor-pointer border border-amber-300 disabled:opacity-50"
                >
                  Save Amount &amp; Keep Pending
                </button>
                <button
                  type="button"
                  disabled={savingAction}
                  onClick={handleCompleteRefund}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  Confirm Refund (₹{Number(processRefundAmount || 0).toLocaleString()})
                </button>
              </div>
              <button
                type="button"
                onClick={resetProcessModal}
                className="w-full py-1.5 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectRefundModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto my-auto p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reject Refund Request</h3>
            <p className="text-xs text-slate-500">
              Rejecting refund request for <strong>{rejectRefundModal.candidateName}</strong>. Please provide a reason.
            </p>
            {modalError && (
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                {modalError}
              </div>
            )}
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 outline-none"
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setRejectRefundModal(null);
                  setModalError("");
                }}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingAction}
                onClick={handleConfirmRejectRefund}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {editRefundModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Refund Record</h3>
              <button
                type="button"
                onClick={() => {
                  setEditRefundModal(null);
                  setModalError("");
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                {modalError}
              </div>
            )}

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
                <label className="block text-xs font-bold text-slate-700 mb-1">Refund Amount to Pay (₹)</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Reference ID (if settled)</label>
                <input
                  type="text"
                  value={editPaymentRef}
                  onChange={(e) => setEditPaymentRef(e.target.value)}
                  placeholder="e.g. RTGS-88992211"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Remarks (Optional)</label>
                <input
                  type="text"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Optional note..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setEditRefundModal(null);
                  setModalError("");
                }}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingAction}
                onClick={handleEditRefund}
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-2xs disabled:opacity-50"
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
