import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightLeft,
  User,
  Clock,
  ArrowRight,
  Search,
  Plus,
  Check,
  AlertCircle,
  Upload,
  FileCheck,
  X,
} from "lucide-react";
import refundService from "../../services/refundService.js";
import crmVendorService from "../../services/crmVendorService.js";

const ELIGIBLE_REFUND_STATUSES = new Set([
  "Selected",
  "Completed",
  "Processing",
  "Offer Released",
  "Offer Accepted",
  "Visa Processing",
  "Visa Issued",
  "Visa Allotted",
  "Joined",
  "Deployed",
  "Did Not Join",
]);

const REFUND_STORAGE_KEYS = new Set([
  "immigo_crm_refunds_v3",
  "immigo_crm_applications_v3",
]);

export default function VendorRefunds() {
  const [vendor, setVendor] = useState(null);
  const [refunds, setRefunds] = useState([]);
  const [eligibleApps, setEligibleApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const [claimsSearch, setClaimsSearch] = useState("");
  const [showApplyPanel, setShowApplyPanel] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [selectedAppId, setSelectedAppId] = useState("");
  const [reason, setReason] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentData, setDocumentData] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const lastFetchAtRef = useRef(0);

  const loadRefunds = useCallback(async (silent = false) => {
    lastFetchAtRef.current = Date.now();
    try {
      if (silent !== true) setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      setVendor(curVendor);

      await crmVendorService.getAvailableProjects(curVendor?.id).catch(() => []);
      const [allRefunds, apps] = await Promise.all([
        refundService.getAllRefunds(curVendor?.id),
        crmVendorService.getApplications(curVendor?.id),
      ]);

      const refundList = allRefunds || [];
      setRefunds(refundList);

      const activeRefundAppIds = new Set(
        refundList
          .filter((r) => !r.reassigned && !r.appProjectMismatch && r.refundStatus !== "Rejected" && r.refundStatus !== "No Refund")
          .map((r) => String(r.applicationId || ""))
          .filter(Boolean)
      );

      const available = (apps || [])
        .map((a) => {
          const resolvedId = String(a.id || a.applicationId || a._id || "");
          const syncedMs = !a.milestonesOverridden
            ? crmVendorService.syncAppMilestonesWithProject(a)
            : [];
          const milestones =
            syncedMs.length > 0
              ? syncedMs
              : a.processMilestones?.length
              ? a.processMilestones
              : a.paymentPlan?.milestones || [];
          const paidAmount =
            milestones.reduce((sum, m) => {
              if (
                m.paymentStatus === "Approved" ||
                m.paymentStatus === "Paid" ||
                m.status === "Paid" ||
                m.status === "Completed"
              ) {
                return sum + (Number(m.paymentAmount ?? m.amount) || 0);
              }
              return sum;
            }, 0) || Number(a.paidAmount || a.totalPaid || 0);

          return {
            ...a,
            resolvedId,
            paidAmount,
          };
        })
        .filter((a) => {
          const isEligibleStatus =
            ELIGIBLE_REFUND_STATUSES.has(a.status) ||
            ELIGIBLE_REFUND_STATUSES.has(a.recruitmentStage) ||
            a.paidAmount > 0;
          const allIds = [a.id, a.applicationId, a._id, a.resolvedId].map(String);
          const alreadyActive = allIds.some((idStr) => activeRefundAppIds.has(idStr));
          return isEligibleStatus && !alreadyActive;
        });

      setEligibleApps(available);
    } catch (err) {
      console.error(err);
    } finally {
      if (silent !== true) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadRefunds(false);
    }, 0);

    let debounceTimer = null;
    const handleRefresh = (e) => {
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

    window.addEventListener("immigo:refund-update", handleRefresh);
    window.addEventListener("immigo:application-update", handleRefresh);
    window.addEventListener("immigo:dashboard-update", handleRefresh);
    window.addEventListener("immigo:vendor-notification", handleFocusOrVisible);
    window.addEventListener("storage", handleRefresh);
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
      window.removeEventListener("immigo:refund-update", handleRefresh);
      window.removeEventListener("immigo:application-update", handleRefresh);
      window.removeEventListener("immigo:dashboard-update", handleRefresh);
      window.removeEventListener("immigo:vendor-notification", handleFocusOrVisible);
      window.removeEventListener("storage", handleRefresh);
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
    };
  }, [loadRefunds]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Supporting document must be under 5MB.");
      return;
    }
    setFormError("");
    setDocumentName(file.name);
    if (file.size <= 1500 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentData(typeof reader.result === "string" ? reader.result : "");
      };
      reader.readAsDataURL(file);
    } else {
      setDocumentData("");
    }
  };

  const handleQuickRefundSubmit = async (e) => {
    e.preventDefault();
    const chosen = eligibleApps.find((a) => a.resolvedId === selectedAppId);
    if (!chosen) {
      setFormError("Please select an available candidate.");
      return;
    }
    if (!reason.trim()) {
      setFormError("Please provide a reason for the refund claim.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");
      setSuccessMsg("");

      await refundService.requestRefund({
        applicationId: chosen.resolvedId,
        candidateId: chosen.candidateId,
        candidateName: chosen.candidateName,
        vendorId: chosen.vendorId || vendor?.id,
        vendorName: chosen.vendorName || vendor?.companyName || vendor?.name || "Vendor Partner",
        projectId: chosen.projectId || "",
        projectName: chosen.projectName,
        clientName: chosen.clientName || "",
        position: chosen.position || "",
        totalPaid: chosen.paidAmount || 0,
        reason: reason.trim(),
        documentPath: documentName,
        documentData,
      });

      setSelectedAppId("");
      setReason("");
      setDocumentName("");
      setDocumentData("");
      setCandidateSearch("");
      setShowApplyPanel(false);
      setSuccessMsg(`Refund request submitted for ${chosen.candidateName} and sent to Admin.`);
      await loadRefunds(true);
    } catch (err) {
      setFormError(err.message || "Failed to submit refund request.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEligibleCandidates = eligibleApps.filter((app) => {
    if (!candidateSearch.trim()) return true;
    const q = candidateSearch.toLowerCase();
    return (
      app.candidateName?.toLowerCase().includes(q) ||
      String(app.candidateId || "").toLowerCase().includes(q) ||
      app.projectName?.toLowerCase().includes(q) ||
      app.position?.toLowerCase().includes(q) ||
      app.clientName?.toLowerCase().includes(q) ||
      app.status?.toLowerCase().includes(q)
    );
  });

  const filteredRefunds = refunds.filter((r) => {
    if (!claimsSearch.trim()) return true;
    const q = claimsSearch.toLowerCase();
    return (
      r.candidateName?.toLowerCase().includes(q) ||
      String(r.id || "").toLowerCase().includes(q) ||
      String(r.candidateId || "").toLowerCase().includes(q) ||
      r.projectName?.toLowerCase().includes(q) ||
      r.clientName?.toLowerCase().includes(q) ||
      r.refundReason?.toLowerCase().includes(q) ||
      r.refundStatus?.toLowerCase().includes(q)
    );
  });

  const displayedRefunds =
    showAll || claimsSearch.trim() ? filteredRefunds : filteredRefunds.slice(0, 5);

  return (
    <div className="p-2 sm:p-3 max-w-full w-full mx-auto space-y-3 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
              Settlements &amp; Claims
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Candidate Refund Requests
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Search eligible candidates, submit refund claims to Admin, and track settlement statuses.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => {
              setShowApplyPanel((prev) => !prev);
              setFormError("");
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${
              showApplyPanel
                ? "bg-slate-200 hover:bg-slate-300 text-slate-800"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {showApplyPanel ? <X size={13} /> : <Plus size={13} />}
            <span>{showApplyPanel ? "Close Refund Form" : "Request Refund"}</span>
          </button>

          <Link
            to="/vendor/candidates"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer"
          >
            <User size={13} />
            <span>Candidates Pool</span>
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Check size={15} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg("")}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {showApplyPanel && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-xs p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Search Available Candidates &amp; Request Refund
              </h2>
              <p className="text-[11px] text-slate-500">
                Eligible candidates without an active claim ({eligibleApps.length} available).
              </p>
            </div>
            <Link
              to="/vendor/refunds/new"
              className="text-[11px] font-bold text-blue-600 hover:underline self-start sm:self-auto"
            >
              Open Full Form Page
            </Link>
          </div>

          {formError && (
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-2 border border-rose-200">
              <AlertCircle size={14} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleQuickRefundSubmit} className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                placeholder="Search available candidates by name, ID, project, position, or client..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
              />
            </div>

            {filteredEligibleCandidates.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs text-center">
                {candidateSearch.trim()
                  ? `No available candidate matches "${candidateSearch}".`
                  : "No eligible candidates available for refund right now."}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50/60">
                {filteredEligibleCandidates.map((app) => (
                  <label
                    key={app.resolvedId}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      selectedAppId === app.resolvedId
                        ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400"
                        : "bg-white border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="radio"
                        name="refundCandidate"
                        value={app.resolvedId}
                        checked={selectedAppId === app.resolvedId}
                        onChange={() => setSelectedAppId(app.resolvedId)}
                        className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 border-slate-300 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-xs block truncate">
                          {app.candidateName}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {app.candidateId || app.resolvedId} • {app.position || "Trade"} • {app.projectName}
                          {app.clientName ? ` • ${app.clientName}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-6 sm:pl-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {app.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                        Paid: ₹{Number(app.paidAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Refund
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide reason (e.g. candidate dropped out, medically unfit, offer declined)..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Supporting Document (Optional)
                </label>
                {documentName ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs h-[62px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold truncate">{documentName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDocumentName("");
                        setDocumentData("");
                      }}
                      className="text-slate-500 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 h-[62px] border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs text-slate-500 transition">
                    <Upload size={14} className="text-blue-600" />
                    <span>Upload PDF / Image (Max 5MB)</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowApplyPanel(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedAppId}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={13} />
                <span>{submitting ? "Submitting..." : "Submit Refund Claim"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg px-3 py-2 flex items-start gap-2.5 text-xs text-blue-900">
        <Clock size={15} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Refund Policy &amp; Application Process:</span>{" "}
          <span>
            You can search eligible candidates right here using Request Refund or submit directly from a candidate profile. Admin is notified immediately upon submission.
          </span>
        </div>
      </div>

      {!loading && refunds.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={claimsSearch}
            onChange={(e) => setClaimsSearch(e.target.value)}
            placeholder="Search refund claims by candidate, claim ID, project, status..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs font-medium"
          />
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center bg-white rounded-xl border border-slate-200 space-y-2">
          <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading refund records...</p>
        </div>
      ) : filteredRefunds.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ArrowRightLeft size={20} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {claimsSearch.trim() ? "No matching refund claims" : "No Refund Requests Applied"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {claimsSearch.trim()
              ? "Try a different candidate name, claim ID, or project keyword."
              : "Search available candidates above or open Request Refund to submit your first refund claim."}
          </p>
          {!claimsSearch.trim() && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowApplyPanel(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer"
              >
                <Plus size={13} />
                <span>Search &amp; Request Refund</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="px-3 py-1.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Applied Refund Claims List
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                ({displayedRefunds.length} of {filteredRefunds.length} shown)
              </span>
            </div>

            {filteredRefunds.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-blue-600 transition cursor-pointer shadow-2xs"
              >
                <span>{showAll ? "Show Top 5 Only" : `See All (${filteredRefunds.length})`}</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] border-b border-slate-200/80">
                <tr>
                  <th className="py-1.5 px-2.5">Candidate &amp; Ref ID</th>
                  <th className="py-1.5 px-2.5">Project &amp; Employer</th>
                  <th className="py-1.5 px-2.5">Reason for Refund</th>
                  <th className="py-1.5 px-2.5 text-center">Amount</th>
                  <th className="py-1.5 px-2.5 text-center">Refund Status</th>
                  <th className="py-1.5 px-2.5 text-right">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRefunds.map((r, idx) => {
                  const status = r.refundStatus || "Refund Pending";
                  const isPending = status.toLowerCase().includes("pending");
                  const isRejected = status === "Rejected" || status === "No Refund";
                  const isSuccess = status.toLowerCase().includes("refunded") || status.toLowerCase().includes("approved");
                  const amount = isRejected ? 0 : Number(r.refundAmount ?? r.amount ?? r.totalPaid ?? 0);
                  const paidTotal = Number(r.totalPaid || 0);

                  return (
                    <tr key={r.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-1.5 px-2.5">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            <span>{r.candidateName || "Candidate"}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            Claim ID: {r.id || "RFD"}
                          </span>
                        </div>
                      </td>

                      <td className="py-1.5 px-2.5">
                        <div className="font-semibold text-slate-800">
                          {r.projectName || "General Project"}
                        </div>
                        {r.clientName && (
                          <span className="text-[10px] text-slate-500 block">
                            Client: {r.clientName}
                          </span>
                        )}
                      </td>

                      <td className="py-1.5 px-2.5 text-slate-600 max-w-xs">
                        <span className="line-clamp-2" title={r.refundReason}>
                          {r.refundReason || "No reason specified"}
                        </span>
                        {r.remarks && (
                          <span className="text-[10px] text-slate-500 block mt-0.5 truncate" title={r.remarks}>
                            Admin Note: {r.remarks}
                          </span>
                        )}
                        {r.refundDocument && (
                          <span className="text-[10px] text-blue-600 font-medium block mt-0.5 truncate">
                            Attachment: {r.refundDocument}
                          </span>
                        )}
                      </td>

                      <td className="py-1.5 px-2.5 text-center font-bold text-slate-900 font-mono">
                        {isRejected ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          <div>
                            <span>{amount > 0 ? `₹${amount.toLocaleString()}` : "As per policy"}</span>
                            {paidTotal > 0 && paidTotal !== amount && (
                              <span className="block text-[9.5px] font-normal text-slate-500">
                                Paid: ₹{paidTotal.toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-1.5 px-2.5 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isPending
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : isSuccess
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}
                          >
                            {status}
                          </span>
                          {r.paymentRef && !isRejected && (
                            <span className="text-[9px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              Ref: {r.paymentRef}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-1.5 px-2.5 text-right text-slate-500 font-mono text-[10px]">
                        {r.refundDate || new Date().toISOString().split("T")[0]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredRefunds.length > 5 && !showAll && !claimsSearch.trim() && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                <span>See All ({filteredRefunds.length}) Refund Claims on Full Page</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
