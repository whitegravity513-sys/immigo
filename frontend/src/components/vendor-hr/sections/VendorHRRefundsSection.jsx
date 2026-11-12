import { useState } from "react";
import {
  Search,
  X,
  RotateCcw,
  FileText,
  ArrowRight,
  Lock,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { isRefundReassignEligible } from "../../../services/refundService.js";
import { getCandidateInitials } from "../shared/vendorHRUtils.jsx";

export default function VendorHRRefundsSection({
  refunds = [],
  applications = [],
  hideProjectNames = false,
  openReassignModal,
  openCandidateModal,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const resolveMatchedApp = (refund) => {
    if (!refund) return null;
    const targetAppId = String(refund.applicationId || "").trim();
    const targetCandId = String(refund.candidateId || "").trim();
    const targetProjId = String(refund.projectId || "").trim();
    const targetProjName = String(refund.projectName || "").trim().toLowerCase();

    return (
      applications.find(
        (a) =>
          (targetAppId &&
            [a.applicationId, a.id, a._id]
              .filter(Boolean)
              .map(String)
              .includes(targetAppId)) ||
          (targetCandId &&
            String(a.candidateId || "").trim() === targetCandId &&
            (!targetProjId || !a.projectId || String(a.projectId) === targetProjId) &&
            (!targetProjName ||
              !a.projectName ||
              String(a.projectName).trim().toLowerCase() === targetProjName))
      ) || null
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending Admin Approval":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock size={10} />
            Pending Admin Review
          </span>
        );
      case "Refund Pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Clock size={10} />
            Approved (Payout Pending)
          </span>
        );
      case "Fully Refunded":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={10} />
            Fully Refunded
          </span>
        );
      case "Partially Refunded":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <CheckCircle2 size={10} />
            Partially Refunded
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle size={10} />
            Rejected
          </span>
        );
      case "No Refund":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            No Refund
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status || "Unknown"}
          </span>
        );
    }
  };

  const pendingApprovalCount = refunds.filter(
    (r) => r.refundStatus === "Pending Admin Approval"
  ).length;
  const approvedReadyCount = refunds.filter((r) => isRefundReassignEligible(r)).length;
  const settledAmount = refunds.reduce(
    (sum, r) =>
      r.refundStatus === "Fully Refunded" || r.refundStatus === "Partially Refunded"
        ? sum + (Number(r.refundAmount) || 0)
        : sum,
    0
  );

  const filterTabs = [
    { key: "ALL", label: "All Claims", count: refunds.length },
    {
      key: "Pending Admin Approval",
      label: "Pending Review",
      count: pendingApprovalCount,
    },
    {
      key: "Refund Pending",
      label: "Payout Pending",
      count: refunds.filter((r) => r.refundStatus === "Refund Pending").length,
    },
    {
      key: "REFUNDED",
      label: "Settled Refunds",
      count: refunds.filter(
        (r) => r.refundStatus === "Fully Refunded" || r.refundStatus === "Partially Refunded"
      ).length,
    },
    {
      key: "REJECTED_OR_NONE",
      label: "Rejected / No Refund",
      count: refunds.filter(
        (r) => r.refundStatus === "Rejected" || r.refundStatus === "No Refund"
      ).length,
    },
  ];

  const filteredRefunds = refunds.filter((r) => {
    if (statusFilter === "Pending Admin Approval" && r.refundStatus !== "Pending Admin Approval") {
      return false;
    }
    if (statusFilter === "Refund Pending" && r.refundStatus !== "Refund Pending") {
      return false;
    }
    if (
      statusFilter === "REFUNDED" &&
      r.refundStatus !== "Fully Refunded" &&
      r.refundStatus !== "Partially Refunded"
    ) {
      return false;
    }
    if (
      statusFilter === "REJECTED_OR_NONE" &&
      r.refundStatus !== "Rejected" &&
      r.refundStatus !== "No Refund"
    ) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(r.candidateName || "").toLowerCase().includes(q) ||
      String(r.candidateId || "").toLowerCase().includes(q) ||
      String(r.vendorName || "").toLowerCase().includes(q) ||
      String(r.refundReason || "").toLowerCase().includes(q) ||
      String(r.paymentRef || "").toLowerCase().includes(q) ||
      (!hideProjectNames && String(r.projectName || "").toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Refund Claims
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{refunds.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-amber-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Pending Admin Review
          </div>
          <div className="text-xl font-bold text-amber-900 mt-1">{pendingApprovalCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-blue-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
            Ready for Reassignment
          </div>
          <div className="text-xl font-bold text-blue-900 mt-1">{approvedReadyCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200/80 p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Settled Refund Amount
          </div>
          <div className="text-xl font-bold text-emerald-900 mt-1 font-mono">
            ₹{settledAmount.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Refund Requests &amp; Claims</h2>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 whitespace-nowrap">
                {filteredRefunds.length} Records
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidates with active refund claims are frozen from milestone payments and processing updates until Admin responds. Once approved, they can be reassigned to a new requirement.
            </p>
          </div>

          <div className="relative w-full lg:w-72 shrink-0">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate, agency, reason, ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer inline-flex items-center gap-1.5 ${statusFilter === tab.key
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-700"
                  }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {filteredRefunds.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <RotateCcw size={18} />
            </div>
            <h4 className="text-xs font-bold text-slate-700">No Refund Claims Found</h4>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              No candidate refund claims match your current search or status filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[920px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Vendor Agency</th>
                  <th className="py-3 px-4">{hideProjectNames ? "Requirement" : "Project"}</th>
                  <th className="py-3 px-3 text-right">Paid</th>
                  <th className="py-3 px-3 text-right">Refund Amt</th>
                  <th className="py-3 px-4">Reason &amp; Remarks</th>
                  <th className="py-3 px-4">Status &amp; Reference</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRefunds.map((r, idx) => {
                  const matchedApp = resolveMatchedApp(r);
                  const canReassign = isRefundReassignEligible(r) && typeof openReassignModal === "function";
                  const reassignTarget = matchedApp
                    ? {
                      ...matchedApp,
                      refundStatus: r.refundStatus,
                      refundDetails: r,
                    }
                    : {
                      id: r.applicationId,
                      applicationId: r.applicationId,
                      candidateId: r.candidateId,
                      candidateName: r.candidateName,
                      projectId: r.projectId,
                      projectName: r.projectName,
                      jobTitle: r.position || "",
                      vendorId: r.vendorId,
                      vendorName: r.vendorName,
                      refundStatus: r.refundStatus,
                      refundDetails: r,
                    };

                  return (
                    <tr key={r.id || r.applicationId || idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {getCandidateInitials(r.candidateName)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{r.candidateName}</div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {r.candidateId || r.applicationId || "-"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {r.vendorName || "Vendor Partner"}
                      </td>

                      <td className="py-3.5 px-4 text-slate-800 font-medium">
                        {hideProjectNames
                          ? r.position || "Assigned Requirement"
                          : r.projectName || "Project"}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-800">
                        ₹{Number(r.totalPaid || 0).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold text-rose-600">
                        {r.refundStatus === "Rejected" || r.refundStatus === "No Refund"
                          ? "-"
                          : `₹${Number(r.refundAmount || 0).toLocaleString()}`}
                      </td>

                      <td className="py-3.5 px-4 max-w-[220px] text-slate-600">
                        <div className="truncate font-medium" title={r.refundReason}>
                          {r.refundReason || "Did not join"}
                        </div>
                        {r.remarks && (
                          <div className="text-[10px] text-slate-500 truncate mt-0.5" title={r.remarks}>
                            Admin Note: {r.remarks}
                          </div>
                        )}
                        {r.refundDocument &&
                          (r.refundDocumentData ? (
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
                          ))}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          {getStatusBadge(r.refundStatus)}
                          {r.refundStatus === "Pending Admin Approval" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              <Lock size={9} />
                              Processing Frozen
                            </span>
                          )}
                          {r.paymentRef && r.refundStatus !== "Rejected" && (
                            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              Ref: {r.paymentRef}
                            </span>
                          )}
                          {r.reassigned && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Reassigned
                              {!hideProjectNames && r.reassignedProjectName
                                ? ` → ${r.reassignedProjectName}`
                                : ""}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {canReassign && (
                            <button
                              type="button"
                              onClick={() => openReassignModal(reassignTarget)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap"
                            >
                              <RotateCcw size={11} />
                              <span>Reassign Candidate</span>
                            </button>
                          )}
                          {matchedApp && typeof openCandidateModal === "function" && (
                            <button
                              type="button"
                              onClick={() => openCandidateModal(matchedApp)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                            >
                              <span>Details</span>
                              <ArrowRight size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
