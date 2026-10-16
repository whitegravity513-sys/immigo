import React from "react";

export default function VendorStatsCards({ vendors = [], statusFilter, onSelectFilter }) {
  const pendingCount = vendors.filter((v) =>
    ["Pending", "Under Review", "Pending Verification", "MOU Pending", "Pending MOU Approval"].includes(v.status)
  ).length;

  const approvedCount = vendors.filter(
    (v) => v.status === "Approved" && (v.mouSigned === true || v.mouStatus === "Approved")
  ).length;

  const inactiveCount = vendors.filter(
    (v) => v.status === "Suspended" || v.status === "Rejected"
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      <div
        onClick={() => onSelectFilter("Registered")}
        className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
          statusFilter === "Registered" || statusFilter === "Pending Verification"
            ? "bg-amber-500 text-white border-amber-600 shadow-xs"
            : "bg-white border-amber-200/90 hover:bg-amber-50/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              statusFilter === "Registered" || statusFilter === "Pending Verification"
                ? "text-amber-100"
                : "text-amber-700"
            }`}
          >
            1. Newly Registered
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              statusFilter === "Registered" || statusFilter === "Pending Verification"
                ? "bg-white/20 text-white"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            Pending Review
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span
            className={`text-xl font-bold ${
              statusFilter === "Registered" || statusFilter === "Pending Verification" ? "text-white" : "text-slate-900"
            }`}
          >
            {pendingCount}
          </span>
          <span
            className={`text-[11px] font-semibold ${
              statusFilter === "Registered" || statusFilter === "Pending Verification" ? "text-amber-100" : "text-slate-500"
            }`}
          >
            Agencies Registered
          </span>
        </div>
      </div>

      <div
        onClick={() => onSelectFilter("Approved")}
        className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
          statusFilter === "Approved"
            ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
            : "bg-white border-emerald-200/90 hover:bg-emerald-50/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              statusFilter === "Approved" ? "text-emerald-100" : "text-emerald-700"
            }`}
          >
            2. Verified & Approved
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              statusFilter === "Approved" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
            }`}
          >
            Active Partner
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span
            className={`text-xl font-bold ${
              statusFilter === "Approved" ? "text-white" : "text-slate-900"
            }`}
          >
            {approvedCount}
          </span>
          <span
            className={`text-[11px] font-semibold ${
              statusFilter === "Approved" ? "text-emerald-100" : "text-slate-500"
            }`}
          >
            Verified Vendors
          </span>
        </div>
      </div>

      <div
        onClick={() => onSelectFilter("Suspended & Rejected")}
        className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
          statusFilter === "Suspended & Rejected" || statusFilter === "Suspended" || statusFilter === "Rejected"
            ? "bg-slate-900 text-white border-slate-950 shadow-xs"
            : "bg-white border-slate-300 hover:bg-slate-50/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              statusFilter === "Suspended & Rejected" || statusFilter === "Suspended" || statusFilter === "Rejected"
                ? "text-slate-200"
                : "text-slate-700"
            }`}
          >
            3. Suspended & Rejected
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              statusFilter === "Suspended & Rejected" || statusFilter === "Suspended" || statusFilter === "Rejected"
                ? "bg-white/20 text-white"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            Declined
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span
            className={`text-xl font-bold ${
              statusFilter === "Suspended & Rejected" || statusFilter === "Suspended" || statusFilter === "Rejected"
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            {inactiveCount}
          </span>
          <span
            className={`text-[11px] font-semibold ${
              statusFilter === "Suspended & Rejected" || statusFilter === "Suspended" || statusFilter === "Rejected"
                ? "text-slate-300"
                : "text-slate-500"
            }`}
          >
            Inactive Agencies
          </span>
        </div>
      </div>
    </div>
  );
}
