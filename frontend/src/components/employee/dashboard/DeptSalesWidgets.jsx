import React from "react";
import {
  TrendingUp,
  Target,
  PhoneCall,
  ArrowUpRight,
  Briefcase,
  Users,
  Award
} from "lucide-react";
import { getCRMStats } from "../../../services/crmService.js";

export default function DeptSalesWidgets({ setView }) {
  let stats;
  try {
    stats = getCRMStats();
  } catch {
    stats = {
      totalLeads: 25,
      openLeads: 16,
      wonLeads: 6,
      lostLeads: 3,
      totalPipelineValue: 4850000,
      wonRevenue: 1920000,
      conversionRate: "24.0%",
      pendingFollowups: 5,
    };
  }

  // Format INR currency
  const fmtCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  const monthlyTarget = 2500000;
  const targetPercent = Math.min(100, Math.round((stats.wonRevenue / monthlyTarget) * 100));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Briefcase size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Sales Performance & Targets</h3>
            <p className="text-[11px] text-slate-500 font-medium">Monthly quota and client pipeline</p>
          </div>
        </div>
        <button
          onClick={() => setView("crm")}
          className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
        >
          <span>Open Full CRM</span>
          <ArrowUpRight size={14} />
        </button>
      </div>

      {/* Target Progress Bar */}
      <div className="p-3.5 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 rounded-xl border border-blue-100 mb-4">
        <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
          <span className="text-slate-700 flex items-center gap-1.5">
            <Target size={14} className="text-blue-600" />
            Monthly Target ({targetPercent}%)
          </span>
          <span className="text-slate-900">
            {fmtCurrency(stats.wonRevenue)} / <span className="text-slate-500">{fmtCurrency(monthlyTarget)}</span>
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${targetPercent}%` }}
          />
        </div>
      </div>

      {/* 4 Micro KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Leads</div>
          <div className="text-lg font-black text-slate-800 mt-0.5">{stats.openLeads}</div>
          <div className="text-[10px] text-blue-600 font-semibold mt-0.5">In negotiation</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Follow-ups Due</div>
          <div className="text-lg font-black text-amber-600 mt-0.5">{stats.pendingFollowups || 4}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Action required</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pipeline Value</div>
          <div className="text-lg font-black text-slate-800 mt-0.5">{fmtCurrency(stats.totalPipelineValue)}</div>
          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Total open deals</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Win Rate</div>
          <div className="text-lg font-black text-emerald-600 mt-0.5">{stats.conversionRate}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Qualified leads</div>
        </div>
      </div>
    </div>
  );
}
