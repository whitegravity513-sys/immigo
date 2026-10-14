import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sliders,
  Send,
  UserCheck,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";

export default function AdminVendorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await crmVendorService.getAdminVendorOverviewStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load vendor management dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-slate-500">Loading vendor management overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vendor Management</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Overview of vendors, candidates, submissions and payments
        </p>
      </div>

      {/* Summary Cards - Compact */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Vendors */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Vendors</span>
          <div className="text-xl font-black text-slate-900 mt-0.5">{stats.totalVendors}</div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
            <span className="text-amber-600 font-semibold">{stats.pendingVendors} Pending</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">{stats.approvedVendors} Approved</span>
          </div>
        </div>

        {/* Candidates */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Candidates</span>
          <div className="text-xl font-black text-indigo-600 mt-0.5">{stats.totalCandidates}</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">In candidate pool</span>
        </div>

        {/* Pending Review */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Review</span>
          <div className="text-xl font-black text-amber-600 mt-0.5">{stats.pendingCandidates}</div>
          <span className="text-[10px] text-amber-700 block">Submissions awaiting review</span>
        </div>

        {/* Selected & In Processing */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selected / Processing</span>
          <div className="text-xl font-black text-emerald-600 mt-0.5">{stats.selectedCandidates}</div>
          <span className="text-[10px] text-slate-500 block truncate">{stats.inProcessing} in 8-stage pipeline</span>
        </div>

        {/* Pending & Overdue Payments */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Payments</span>
          <div className="text-xl font-black text-slate-900 mt-0.5">₹{(stats.pendingPayments || 0).toLocaleString()}</div>
          <span className="text-[10px] text-rose-600 font-semibold block truncate">Overdue: ₹{(stats.overduePayments || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Widgets Grid - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Recent Vendor Activity */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Recent Vendor Activity</span>
              <span className="text-[10px] font-semibold text-slate-400">(Latest 5)</span>
            </h3>
            <Link to="/admin/vendor/vendors" className="text-[11px] text-indigo-600 font-bold hover:underline">
              See All Vendors ↗
            </Link>
          </div>

          <div className="space-y-2.5">
            {(stats.recentActivity || []).slice(0, 5).map((act) => (
              <div key={act.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <ActivityIcon type={act.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{act.title}</h4>
                    <span className="text-[9px] text-slate-400 font-medium">{act.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{act.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 bg-slate-50/80 border border-slate-100 rounded-lg flex items-center justify-between text-xs mt-3">
            <span className="text-slate-500 text-[11px] font-medium">Showing 5 recent vendor events</span>
            <Link to="/admin/vendor/vendors" className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 text-[11px]">
              <span>See All Vendors</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="lg:col-span-6 space-y-3">
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
                Vendor Operations
              </span>
              <h3 className="text-lg font-bold mt-0.5">Submissions & Candidate Review</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm">
                Review candidate applications across client projects, shortlist candidates, or advance deployment stages.
              </p>
            </div>
            <Link
              to="/admin/vendor/submissions"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shrink-0 flex items-center gap-1.5"
            >
              <span>Submissions</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/admin/vendor/milestones"
              className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition block"
            >
              <Sliders className="w-5 h-5 text-indigo-600 mb-2" />
              <h4 className="text-xs font-bold text-slate-900">Milestone Templates</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Apply bulk recruitment fee templates</p>
            </Link>

            <Link
              to="/admin/vendor/candidates?tab=Selected"
              className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition block"
            >
              <Clock className="w-5 h-5 text-emerald-600 mb-2" />
              <h4 className="text-xs font-bold text-slate-900">8-Stage Processing</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Track medical, visa & site travel</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ type }) {
  switch (type) {
    case "vendor":
      return <Building2 className="w-4 h-4" />;
    case "submission":
      return <Send className="w-4 h-4 text-blue-600" />;
    case "selected":
      return <UserCheck className="w-4 h-4 text-emerald-600" />;
    case "payment":
      return <CreditCard className="w-4 h-4 text-amber-600" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}
