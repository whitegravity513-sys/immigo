import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Upload, AlertCircle } from "lucide-react";
import crmVendorService from "../../services/crmVendorService";
import refundService from "../../modules/vendor/services/refundService";

export default function VendorNewRefund() {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedAppId, setSelectedAppId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      setVendor(curVendor);

      // Get all apps for vendor
      const apps = await crmVendorService.getApplications(curVendor?.id);
      
      // Get all existing refunds to filter out ones that already have a request
      const existingRefunds = await refundService.getAllRefunds();
      const existingAppIds = existingRefunds.map(r => r.applicationId);

      // Eligible apps: Selected or Completed, and not already requested
      const eligible = (apps || []).filter(
        (a) => (a.status === "Selected" || a.status === "Completed") && !existingAppIds.includes(a.id)
      );

      setApplications(eligible);
    } catch (err) {
      console.error(err);
      setError("Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppId) {
      setError("Please select a candidate first.");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason for the refund request.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      
      const app = applications.find(a => a.id === selectedAppId);
      
      await refundService.requestRefund({
        applicationId: app.id,
        candidateId: app.candidateId,
        candidateName: app.candidateName,
        vendorId: app.vendorId || vendor?.id,
        vendorName: vendor?.companyName || "Vendor",
        projectName: app.projectName,
        reason: reason,
        documentPath: "", // Mocking optional image upload for now
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

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Request New Refund</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Submit a refund request for a selected candidate who did not join or dropped out.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-2 border border-rose-200">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Candidate */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Select Candidate
            </label>
            {loading ? (
              <div className="text-xs text-slate-500">Loading eligible candidates...</div>
            ) : applications.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs">
                No eligible candidates available for refund.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
                {applications.map((app) => (
                  <label
                    key={app.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAppId === app.id
                        ? "bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400"
                        : "bg-white border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="candidate"
                        value={app.id}
                        checked={selectedAppId === app.id}
                        onChange={() => setSelectedAppId(app.id)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{app.candidateName}</span>
                        <span className="text-[11px] text-slate-500">
                          {app.position} • {app.projectName}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Reason */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. Reason for Refund
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is a refund being requested? (e.g., Candidate declined offer, medically unfit post-selection)"
              rows={4}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              required
            />
          </div>

          {/* Step 3: Optional Image/Proof */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              3. Supporting Document / Image (Optional)
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-6 h-6 mb-2 text-slate-400" />
                  <p className="mb-1 text-xs text-slate-500">
                    <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-[10px] text-slate-400">PNG, JPG, or PDF (MAX. 5MB)</p>
                </div>
                <input type="file" className="hidden" />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              to="/vendor/refunds"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || applications.length === 0}
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
