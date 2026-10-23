import React from "react";

export default function VendorStatsCards({ vendors = [], statusFilter, onSelectFilter }) {
  const suspendedCount = vendors.filter((v) => v.status === "Suspended").length;

  const rejectedCount = vendors.filter(
    (v) =>
      v.status === "Rejected" ||
      v.status === "Registration Rejected" ||
      v.status === "Documents Rejected" ||
      v.status === "MOU Rejected"
  ).length;

  const approvedCount = vendors.filter(
    (v) =>
      (v.status === "Approved" ||
        v.status === "Active" ||
        v.mouStatus === "Approved" ||
        v.mouSigned === true) &&
      v.status !== "Suspended" &&
      v.status !== "Rejected" &&
      !v.status?.includes("Rejected")
  ).length;

  const registeredCount = vendors.filter(
    (v) =>
      v.status !== "Suspended" &&
      v.status !== "Rejected" &&
      !v.status?.includes("Rejected") &&
      v.status !== "Approved" &&
      v.status !== "Active" &&
      v.mouStatus !== "Approved" &&
      !v.mouSigned
  ).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Newly Registered */}
      <div
        onClick={() => onSelectFilter(statusFilter === "Registered" ? "All" : "Registered")}
        className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${
          statusFilter === "Registered" || statusFilter === "Pending Verification"
            ? "bg-amber-600 text-white border-amber-700 shadow-xs"
            : "bg-white border-amber-200/90 hover:border-amber-400 hover:bg-amber-50/30"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              statusFilter === "Registered" || statusFilter === "Pending Verification"
                ? "text-amber-100"
                : "text-amber-800"
            }`}
          >
            1. NEWLY REGISTERED
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              statusFilter === "Registered" || statusFilter === "Pending Verification"
                ? "bg-white/20 text-white"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            Pending Review
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span
            className={`text-2xl font-extrabold ${
              statusFilter === "Registered" || statusFilter === "Pending Verification"
                ? "text-white"
                : "text-slate-900"
            }`}
          >
            {registeredCount}
          </span>
          <span
            className={`text-[11px] font-semibold ${
              statusFilter === "Registered" || statusFilter === "Pending Verification"
                ? "text-amber-100"
                : "text-slate-500"
            }`}
          >
            Agencies Registered
          </span>
        </div>
      </div>

      {/* 2. Verified & Approved */}
      <div
        onClick={() => onSelectFilter(statusFilter === "Approved" ? "All" : "Approved")}
        className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${
          statusFilter === "Approved"
            ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
            : "bg-white border-emerald-200/90 hover:border-emerald-400 hover:bg-emerald-50/30"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              statusFilter === "Approved" ? "text-emerald-100" : "text-emerald-800"
            }`}
          >
            2. VERIFIED & APPROVED
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              statusFilter === "Approved"
                ? "bg-white/20 text-white"
                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
            }`}
          >
            Active Partner
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span
            className={`text-2xl font-extrabold ${
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

      {/* 3. Suspended */}
      <div
        onClick={() => onSelectFilter(statusFilter === "Suspended" ? "All" : "Suspended")}
        className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${
          statusFilter === "Suspended"
            ? "bg-slate-800 text-white border-slate-900 shadow-xs"
            : "bg-white border-slate-200/90 hover:border-slate-400 hover:bg-slate-50/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              statusFilter === "Suspended" ? "text-slate-200" : "text-slate-700"
            }`}
          >
            3. SUSPENDED
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              statusFilter === "Suspended"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            On Hold
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span
            className={`text-2xl font-extrabold ${
              statusFilter === "Suspended" ? "text-white" : "text-slate-900"
            }`}
          >
            {suspendedCount}
          </span>
          <span
            className={`text-[11px] font-semibold ${
              statusFilter === "Suspended" ? "text-slate-300" : "text-slate-500"
            }`}
          >
            Suspended Agencies
          </span>
        </div>
      </div>

      {/* 4. Rejected */}
      <div
        onClick={() => onSelectFilter(statusFilter === "Rejected" ? "All" : "Rejected")}
        className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${
          statusFilter === "Rejected"
            ? "bg-rose-800 text-white border-rose-900 shadow-xs"
            : "bg-white border-rose-200/90 hover:border-rose-400 hover:bg-rose-50/30"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              statusFilter === "Rejected" ? "text-rose-200" : "text-rose-800"
            }`}
          >
            4. REJECTED
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              statusFilter === "Rejected"
                ? "bg-white/20 text-white"
                : "bg-rose-100 text-rose-800 border border-rose-200"
            }`}
          >
            Declined
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span
            className={`text-2xl font-extrabold ${
              statusFilter === "Rejected" ? "text-white" : "text-slate-900"
            }`}
          >
            {rejectedCount}
          </span>
          <span
            className={`text-[11px] font-semibold ${
              statusFilter === "Rejected" ? "text-rose-200" : "text-slate-500"
            }`}
          >
            Rejected Agencies
          </span>
        </div>
      </div>
    </div>
  );
}
