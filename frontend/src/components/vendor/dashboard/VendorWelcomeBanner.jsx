import React from "react";
import { Link } from "react-router-dom";
import { Clock, CheckCircle2, FileText, Plus, Send } from "lucide-react";

export default function VendorWelcomeBanner({ vendor, onOpenMou }) {
  return (
    <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 rounded-lg p-2.5 sm:p-3 text-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2 border border-blue-800/60">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          {vendor?.status === "Approved" || vendor?.mouStatus === "Approved" || vendor?.mouSigned ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/25 text-blue-200 text-[10px] font-bold border border-blue-400/30">
              <CheckCircle2 size={12} className="text-cyan-400" />
              Approved &bull; MOU Executed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-400/20">
              <Clock size={12} className="text-amber-400" />
              {vendor?.status || "Under Review"}
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
          Manage your candidates, submit profiles to verified overseas employer projects, and track deployment milestones & payments.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap shrink-0 self-start md:self-auto">
        <button
          type="button"
          onClick={onOpenMou}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-200 bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
        >
          <FileText size={13} />
          <span>View Executed MOU</span>
        </button>
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
