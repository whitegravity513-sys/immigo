import React from "react";
import { CheckCircle2, Clock, FileText, XCircle, Ban, ShieldCheck } from "lucide-react";

export default function VendorStatusBadge({ status }) {
  switch (status) {
    case "Active":
    case "Approved":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          {status}
        </span>
      );
    case "Registration Pending":
    case "Pending":
    case "Pending Verification":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Registration Pending
        </span>
      );
    case "Registration Approved":
    case "Documents Pending":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          Documents Pending
        </span>
      );
    case "Documents Under Review":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
          Docs Under Review
        </span>
      );
    case "Documents Verified":
    case "MOU Pending":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <FileText className="w-3.5 h-3.5 text-purple-600" />
          MOU Pending
        </span>
      );
    case "MOU Under Review":
    case "Pending MOU Approval":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <Clock className="w-3.5 h-3.5 text-sky-600" />
          MOU Under Review
        </span>
      );
    case "MOU Correction Required":
    case "Documents Correction Required":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">
          <Clock className="w-3.5 h-3.5 text-orange-600" />
          Correction Required
        </span>
      );
    case "Registration On Hold":
    case "Hold":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
          <Ban className="w-3.5 h-3.5 text-amber-600" />
          On Hold
        </span>
      );
    case "Suspended":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
          <Ban className="w-3.5 h-3.5 text-rose-600" />
          Suspended
        </span>
      );
    case "Rejected":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
          {status || "Registered"}
        </span>
      );
  }
}
