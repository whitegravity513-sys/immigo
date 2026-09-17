import React from "react";
import { Receipt, IndianRupee, FileCheck, AlertCircle } from "lucide-react";

export default function DeptAccountsWidgets() {
  const accountsStats = [
    { label: "Pending Invoices", value: "12", sub: "Worth ₹8.4L", color: "text-amber-600" },
    { label: "Cleared This Week", value: "28", sub: "Worth ₹24.2L", color: "text-emerald-600" },
    { label: "Claims Processing", value: "6", sub: "Staff travel/meals", color: "text-blue-600" },
    { label: "Vendor Dispatches", value: "3", sub: "Payment scheduled", color: "text-indigo-600" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <IndianRupee size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Finance & Invoicing Snapshot</h3>
            <p className="text-[11px] text-slate-500 font-medium">Billing cycles and expense reimbursements</p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
          FY 2026-27
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {accountsStats.map((item, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</div>
            <div className={`text-xl font-black ${item.color} mt-1`}>{item.value}</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
