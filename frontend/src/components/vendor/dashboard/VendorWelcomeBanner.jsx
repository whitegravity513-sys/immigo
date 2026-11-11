import { Link } from "react-router-dom";
import { Clock, CheckCircle2, FileText, Plus, Send, XCircle, AlertCircle } from "lucide-react";

export default function VendorWelcomeBanner({ vendor, onOpenMou }) {
  const isRejected = Boolean(
    ["Rejected", "Registration Rejected", "MOU Rejected"].includes(vendor?.status) ||
      vendor?.mouStatus === "Rejected"
  );
  const isCorrectionRequired = Boolean(
    vendor?.mouStatus === "Correction Required" ||
      vendor?.status === "MOU Correction Required"
  );
  const isMouApproved = Boolean(
    !isRejected &&
      (vendor?.status === "Approved" ||
        vendor?.status === "Active" ||
        vendor?.mouStatus === "Approved" ||
        vendor?.onboardingStage === "COMPLETED" ||
        vendor?.onboardingStage === "ACTIVE")
  );
  const isMouUnderReview = Boolean(
    !isRejected &&
      !isMouApproved &&
      !isCorrectionRequired &&
      (vendor?.mouSigned ||
        vendor?.mouStatus === "Signed" ||
        vendor?.mouStatus === "Under Review" ||
        vendor?.status === "Pending MOU Approval" ||
        vendor?.status === "MOU Under Review" ||
        vendor?.onboardingStage === "MOU_UNDER_REVIEW" ||
        vendor?.onboardingStage === "MOU_SIGNED" ||
        Boolean(vendor?.signedMou?.signedAt))
  );
  const isMouSent = Boolean(
    !isRejected &&
      !isMouApproved &&
      !isMouUnderReview &&
      (vendor?.mouStatus === "Sent" ||
        isCorrectionRequired ||
        vendor?.status === "MOU Pending" ||
        vendor?.onboardingStage === "MOU_SENT")
  );
  const isMouAssigned =
    isMouSent ||
    isMouUnderReview ||
    isMouApproved ||
    Boolean(isRejected && (vendor?.mouStatus === "Rejected" || vendor?.signedMou?.signedAt || vendor?.mouDocument?.sentAt));

  return (
    <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 rounded-lg p-2.5 sm:p-3 text-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2 border border-blue-800/60">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          {isRejected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/25 text-rose-200 text-[10px] font-bold border border-rose-400/40">
              <XCircle size={12} className="text-rose-300" />
              {vendor?.mouStatus === "Rejected" ? "MOU Rejected" : vendor?.status || "Rejected"}
            </span>
          ) : isMouApproved ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-bold border border-emerald-400/30">
              <CheckCircle2 size={12} className="text-emerald-400" />
              Verified &amp; Approved &bull; MOU Active
            </span>
          ) : isCorrectionRequired ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/25 text-orange-200 text-[10px] font-bold border border-orange-400/40">
              <AlertCircle size={12} className="text-orange-300" />
              MOU Re-upload Requested
            </span>
          ) : isMouUnderReview ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 text-[10px] font-bold border border-amber-400/30">
              <Clock size={12} className="text-amber-300" />
              MOU Submitted &bull; Pending Admin Approval
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-400/20">
              <Clock size={12} className="text-amber-400" />
              {vendor?.status || "Documents Under Review"}
            </span>
          )}
          <span className="text-[10px] font-mono text-slate-300">
            ID: {vendor?.id || vendor?.vendorId || "VND"}
          </span>
        </div>
        <h2 className="text-base sm:text-lg font-bold tracking-tight mt-1">
          Welcome, {vendor?.companyName || vendor?.contactPersonName || "Vendor Partner"}
        </h2>
        <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 max-w-xl leading-snug">
          Manage your candidates, submit profiles to verified overseas employer projects, and track deployment milestones &amp; payments.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap shrink-0 self-start md:self-auto">
        {isMouAssigned && (
          <button
            type="button"
            onClick={onOpenMou}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              isRejected
                ? "text-rose-100 bg-rose-600/80 hover:bg-rose-600"
                : isCorrectionRequired
                ? "text-white bg-orange-600 hover:bg-orange-500 shadow-2xs"
                : isMouSent
                ? "text-white bg-emerald-600 hover:bg-emerald-500 shadow-2xs"
                : "text-blue-200 bg-white/10 hover:bg-white/20"
            }`}
          >
            <FileText size={13} />
            <span>
              {isRejected
                ? "View MOU Record"
                : isCorrectionRequired
                ? "Re-upload Signed MOU"
                : isMouSent
                ? "Review & Sign / Upload MOU"
                : isMouApproved
                ? "View Approved MOU"
                : "View Pending MOU"}
            </span>
          </button>
        )}
        <Link
          to="/vendor/candidates/add"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <Plus size={14} className="text-blue-600" />
          <span>+ Add Candidate</span>
        </Link>
        <Link
          to="/vendor/submit-candidate"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <Send size={13} />
          <span>Submit to Project</span>
        </Link>
      </div>
    </div>
  );
}
