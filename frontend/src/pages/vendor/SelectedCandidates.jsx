import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  UserCheck,
  Search,
  ArrowRight,
  CreditCard,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  MapPin,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService";

export default function SelectedCandidates() {
  const [vendor, setVendor] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      setVendor(curVendor);
      const data = await crmVendorService.getApplications(curVendor?.id);
      // Filter only selected or completed
      const selectedApps = (data || []).filter(
        (a) => a.status === "Selected" || a.status === "Completed"
      );
      setApplications(selectedApps);
    } catch (err) {
      console.error("Failed to load selected candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.candidateName?.toLowerCase().includes(q) ||
      app.projectName?.toLowerCase().includes(q) ||
      app.clientName?.toLowerCase().includes(q) ||
      app.position?.toLowerCase().includes(q) ||
      app.country?.toLowerCase().includes(q)
    );
  });

  // Financial summary
  const totalSelected = applications.length;
  let totalCommittedEarnings = 0;
  let totalPaidEarnings = 0;

  applications.forEach((a) => {
    if (a.paymentPlan?.milestones) {
      a.paymentPlan.milestones.forEach((m) => {
        totalCommittedEarnings += Number(m.amount) || 0;
        if (m.status === "Paid") totalPaidEarnings += Number(m.amount) || 0;
      });
    }
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>Deployment Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Selected Candidates
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Candidates approved by the client actively advancing through document verification, medicals, visas, and site mobilization.
          </p>
        </div>

        <Link
          to="/vendor/candidates?tab=selected"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <span>View Processing Stepper</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Selected Roster
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalSelected}</div>
          <span className="text-xs text-slate-400 mt-1 block">Active selections on projects</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Committed Value
            </span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ₹{totalCommittedEarnings.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Total milestone value for selections</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Released Payouts
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CreditCard className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ₹{totalPaidEarnings.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {totalCommittedEarnings > 0
              ? `${Math.round((totalPaidEarnings / totalCommittedEarnings) * 100)}% of total released`
              : "No disbursements yet"}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter selected candidates by name, project, role, country..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading selected candidates...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No selected candidates found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Candidates will show here once client interviews and reviews are finalized as "Selected".
          </p>
          <div className="mt-4">
            <Link
              to="/vendor/applications"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
            >
              View All Applications
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Project & Client</th>
                <th className="py-3 px-4">Trade / Position</th>
                <th className="py-3 px-4">Processing Stage</th>
                <th className="py-3 px-4">Milestones</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((app) => {
                const stageIndex = app.processing?.currentStageIndex ?? 0;
                const currentStage = app.processing?.stages?.[stageIndex];
                const milestones = (app.processMilestones?.length ? app.processMilestones : app.paymentPlan?.milestones) || [];
                const paidMilestones = milestones.filter((m) => m.paymentStatus === "Approved" || m.status === "Paid").length;
                const totalMilestones = milestones.length;

                return (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-200 shrink-0">
                          {app.candidateName?.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/vendor/candidates/${app.candidateId}`}
                            className="font-bold text-slate-900 hover:text-emerald-700 block truncate"
                          >
                            {app.candidateName}
                          </Link>
                          <span className="inline-flex items-center px-1.5 py-0.5 mt-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Selected
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 truncate max-w-[150px]">
                        {app.projectName}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[120px]">{app.clientName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {app.position}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1.5 w-32">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-emerald-700 truncate">{currentStage?.name || "Selected"}</span>
                          <span className="text-slate-400">{stageIndex + 1}/8</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${((stageIndex + 1) / 8) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {totalMilestones > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50/60 border border-blue-100 text-[10px] text-blue-700 font-semibold">
                          <CreditCard className="w-3 h-3" />
                          <span>{paidMilestones}/{totalMilestones} Paid</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No Milestones</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/vendor/processing/${app.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-2xs"
                      >
                        Timeline <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
