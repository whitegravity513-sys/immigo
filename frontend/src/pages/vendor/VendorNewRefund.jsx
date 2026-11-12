import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Upload, AlertCircle, Search, FileCheck, X } from "lucide-react";
import crmVendorService from "../../services/crmVendorService";
import refundService from "../../services/refundService.js";

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

export default function VendorNewRefund() {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedAppId, setSelectedAppId] = useState("");
  const [reason, setReason] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentData, setDocumentData] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      setVendor(curVendor);

      await crmVendorService.getAvailableProjects(curVendor?.id).catch(() => []);
      const [apps, existingRefunds] = await Promise.all([
        crmVendorService.getApplications(curVendor?.id),
        refundService.getAllRefunds(curVendor?.id),
      ]);

      const activeRefundAppIds = new Set(
        (existingRefunds || [])
          .filter((r) => !r.reassigned && !r.appProjectMismatch && r.refundStatus !== "Rejected" && r.refundStatus !== "No Refund")
          .map((r) => String(r.applicationId || ""))
          .filter(Boolean)
      );

      const enrichedApps = (apps || [])
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
          const paidAmount = milestones.reduce((sum, m) => {
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
          const alreadyRequested = allIds.some((idStr) => activeRefundAppIds.has(idStr));
          return isEligibleStatus && !alreadyRequested;
        });

      setApplications(enrichedApps);
    } catch (err) {
      console.error(err);
      setError("Failed to load available candidates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(t);
  }, [loadData]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Supporting document must be under 5MB.");
      return;
    }
    setError("");
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

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.candidateName?.toLowerCase().includes(q) ||
      String(app.candidateId || "").toLowerCase().includes(q) ||
      app.projectName?.toLowerCase().includes(q) ||
      app.position?.toLowerCase().includes(q) ||
      app.clientName?.toLowerCase().includes(q) ||
      app.status?.toLowerCase().includes(q)
    );
  });

  const selectedApp = applications.find((a) => a.resolvedId === selectedAppId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) {
      setError("Please select an available candidate first.");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason for the refund request.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await refundService.requestRefund({
        applicationId: selectedApp.resolvedId,
        candidateId: selectedApp.candidateId,
        candidateName: selectedApp.candidateName,
        vendorId: selectedApp.vendorId || vendor?.id,
        vendorName: selectedApp.vendorName || vendor?.companyName || vendor?.name || "Vendor Partner",
        projectId: selectedApp.projectId || "",
        projectName: selectedApp.projectName,
        clientName: selectedApp.clientName || "",
        position: selectedApp.position || "",
        totalPaid: selectedApp.paidAmount || 0,
        reason: reason.trim(),
        documentPath: documentName,
        documentData,
      });

      navigate("/vendor/refunds");
    } catch (err) {
      setError(err.message || "Failed to submit refund request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 font-sans">
      <Link
        to="/vendor/refunds"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold transition"
      >
        <ArrowLeft size={14} /> Back to Refunds
      </Link>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-8">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Request New Refund</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search and select an available candidate to submit a refund claim to the Admin team.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-2 border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                1. Search &amp; Select Available Candidate ({filteredApplications.length})
              </label>
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search available candidates by name, ID, project, position, or client..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            {loading ? (
              <div className="text-xs text-slate-500 p-4 bg-slate-50 rounded-xl border border-slate-200">
                Loading eligible candidates...
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs">
                {searchQuery.trim()
                  ? `No available candidates match "${searchQuery}".`
                  : "No eligible candidates available for a new refund request."}
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
                {filteredApplications.map((app) => (
                  <label
                    key={app.resolvedId}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAppId === app.resolvedId
                        ? "bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400"
                        : "bg-white border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="radio"
                        name="candidate"
                        value={app.resolvedId}
                        checked={selectedAppId === app.resolvedId}
                        onChange={() => setSelectedAppId(app.resolvedId)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-sm block truncate">
                          {app.candidateName}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {app.position || "Trade"} • {app.projectName}
                          {app.clientName ? ` • ${app.clientName}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 pl-7 sm:pl-0">
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
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. Reason for Refund
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the refund is requested (e.g., candidate declined offer, medically unfit post-selection, did not mobilize)"
              rows={4}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              3. Supporting Document / Image (Optional)
            </label>
            {documentName ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs">
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
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col items-center justify-center py-4">
                    <Upload className="w-5 h-5 mb-1.5 text-slate-400" />
                    <p className="mb-0.5 text-xs text-slate-500">
                      <span className="font-semibold text-indigo-600">Click to upload</span> supporting proof
                    </p>
                    <p className="text-[10px] text-slate-400">PNG, JPG, or PDF (MAX. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-end gap-3">
            <Link
              to="/vendor/refunds"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !selectedApp}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
