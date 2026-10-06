import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Download,
  Building2,
  DollarSign,
  Eye,
  ChevronRight,
  Filter,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService";

export default function Payments() {
  const [vendor, setVendor] = useState(null);
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Selected Candidate Modal
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidateApp, setSelectedCandidateApp] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      setVendor(curVendor);

      const [vendorStats, apps] = await Promise.all([
        crmVendorService.getVendorDashboardStats(curVendor?.id),
        crmVendorService.getApplications(curVendor?.id),
      ]);

      setStats(vendorStats);
      // Filter for selected / completed applications with payment plans
      const selectedApps = (apps || []).filter(
        (a) => (a.status === "Selected" || a.status === "Completed" || a.paymentPlan) && a.paymentPlan
      );
      setApplications(selectedApps);
    } catch (err) {
      console.error("Failed to load payment data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Compute Overall Financial Summaries (Only Selected Candidates)
  let totalFeeToCollect = 0;
  let totalFeeReleased = 0;

  applications.forEach((app) => {
    const total = Number(app.paymentPlan?.totalAmount || 40000);
    totalFeeToCollect += total;
    const milestones = app.paymentPlan?.milestones || [];
    milestones.forEach((m) => {
      if (m.status === "Paid") {
        totalFeeReleased += Number(m.amount) || 0;
      }
    });
  });

  const totalRemainingBalance = Math.max(0, totalFeeToCollect - totalFeeReleased);

  // Filter Candidate Accounts
  const filteredApps = applications.filter((app) => {
    const milestones = app.paymentPlan?.milestones || [];
    const total = Number(app.paymentPlan?.totalAmount || 40000);
    const paid = milestones.filter((m) => m.status === "Paid").reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

    if (statusFilter === "Fully Paid" && paid < total) return false;
    if (statusFilter === "Partially Paid" && (paid === 0 || paid === total)) return false;
    if (statusFilter === "Unpaid" && paid > 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        app.candidateName?.toLowerCase().includes(q) ||
        app.projectName?.toLowerCase().includes(q) ||
        app.clientName?.toLowerCase().includes(q) ||
        app.position?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4" />
            <span>Selected Candidates Financials</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Recruitment Fee & Milestone Payments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Consolidated payment accounts per selected candidate. Track total agreed placement fee, amount released, and remaining balance.
          </p>
        </div>

        <button
          onClick={() => alert("Payment statement exported successfully.")}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Download Financial Statement</span>
        </button>
      </div>

      {/* Top 3 Primary Financial Cards (Total Fee to Collect, Fee Released, Remaining Balance) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Payment To Collect (Total Fee)
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            ₹{totalFeeToCollect.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block font-medium">
            Agreed contracted fee across {applications.length} selected candidates
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Total Payment Released (Disbursed)
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
            ₹{totalFeeReleased.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            Successfully paid/released by client to vendor account
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Remaining Balance (Pending Release)
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
            ₹{totalRemainingBalance.toLocaleString()}
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1 block">
            Linked to upcoming medical, visa, and site deployment stages
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["All", "Fully Paid", "Partially Paid", "Unpaid"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === status
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter candidate payments..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Candidate Payments Summary Table (One Row Per Candidate) */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-semibold text-slate-500">Loading candidate payment accounts...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No payment accounts found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Payment plans automatically generate when candidate applications are accepted and marked as Selected.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Selected Candidate</th>
                  <th className="py-3.5 px-4">Project & Client</th>
                  <th className="py-3.5 px-4">Total Fee (Agreed)</th>
                  <th className="py-3.5 px-4">Released (Paid)</th>
                  <th className="py-3.5 px-4">Remaining Balance</th>
                  <th className="py-3.5 px-4">Milestone Progress</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => {
                  const total = Number(app.paymentPlan?.totalAmount || 40000);
                  const milestones = app.paymentPlan?.milestones || [];
                  const paidMilestones = milestones.filter((m) => m.status === "Paid");
                  const paidAmount = paidMilestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
                  const remaining = Math.max(0, total - paidAmount);

                  const progressPct = total > 0 ? Math.round((paidAmount / total) * 100) : 0;

                  let statusBadge = "Unpaid";
                  let statusBg = "bg-slate-100 text-slate-700 border-slate-200";
                  if (paidAmount === total) {
                    statusBadge = "Fully Paid";
                    statusBg = "bg-emerald-100 text-emerald-800 border-emerald-200";
                  } else if (paidAmount > 0) {
                    statusBadge = "Partially Paid";
                    statusBg = "bg-blue-100 text-blue-800 border-blue-200";
                  }

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition">
                      {/* Candidate */}
                      <td className="py-4 px-4 sm:px-6">
                        <Link
                          to={`/vendor/candidates/${app.candidateId}`}
                          className="font-black text-slate-900 hover:text-indigo-600 transition block truncate max-w-[180px]"
                        >
                          {app.candidateName}
                        </Link>
                        <span className="text-[11px] text-indigo-700 font-semibold">{app.position}</span>
                      </td>

                      {/* Project & Client */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-800 truncate block max-w-[180px]">
                          {app.projectName}
                        </span>
                        <span className="text-[11px] text-slate-500 block">{app.clientName}</span>
                      </td>

                      {/* Total Fee */}
                      <td className="py-4 px-4">
                        <span className="font-black text-slate-900 text-sm">
                          ₹{total.toLocaleString()}
                        </span>
                      </td>

                      {/* Released / Paid */}
                      <td className="py-4 px-4">
                        <span className="font-black text-emerald-600 text-sm">
                          ₹{paidAmount.toLocaleString()}
                        </span>
                      </td>

                      {/* Remaining */}
                      <td className="py-4 px-4">
                        <span className="font-black text-amber-600 text-sm">
                          ₹{remaining.toLocaleString()}
                        </span>
                      </td>

                      {/* Progress Bar & Status */}
                      <td className="py-4 px-4">
                        <div className="space-y-1 w-36">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-700">
                              {paidMilestones.length}/{milestones.length || 4} Milestones
                            </span>
                            <span className="font-extrabold text-emerald-600">{progressPct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setSelectedCandidateApp(app)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Milestones ({milestones.length})</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED CANDIDATE MILESTONES MODAL */}
      {selectedCandidateApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest block">
                  Milestone Disbursement Breakdown
                </span>
                <h3 className="text-lg font-black text-slate-900">{selectedCandidateApp.candidateName}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedCandidateApp.position} • {selectedCandidateApp.projectName} ({selectedCandidateApp.clientName})
                </p>
              </div>
              <button
                onClick={() => setSelectedCandidateApp(null)}
                className="px-3 py-1 rounded text-slate-400 hover:text-slate-800 text-xs font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Agreed Fee Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Agreed Fee</span>
                <span className="font-black text-slate-900 text-sm">
                  ₹{Number(selectedCandidateApp.paymentPlan?.totalAmount || 40000).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Released / Paid</span>
                <span className="font-black text-emerald-600 text-sm">
                  ₹{selectedCandidateApp.paymentPlan?.milestones?.filter(m => m.status === "Paid").reduce((acc, m) => acc + (Number(m.amount) || 0), 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Remaining Balance</span>
                <span className="font-black text-amber-600 text-sm">
                  ₹{Math.max(0, (selectedCandidateApp.paymentPlan?.totalAmount || 40000) - selectedCandidateApp.paymentPlan?.milestones?.filter(m => m.status === "Paid").reduce((acc, m) => acc + (Number(m.amount) || 0), 0)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Individual Milestones List */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Milestones & Statuses:
              </h4>
              <div className="space-y-2.5">
                {selectedCandidateApp.paymentPlan?.milestones?.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-slate-900 block text-xs">{m.name}</span>
                      <span className="text-[11px] text-slate-500 block">
                        Amount: <strong className="text-slate-900 font-bold">₹{Number(m.amount).toLocaleString()}</strong> • Due Date: {m.dueDate || "N/A"}
                      </span>
                      {m.paymentRef && (
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Ref / Txn: {m.paymentRef} {m.paidDate ? `• Paid on ${m.paidDate}` : ""}
                        </span>
                      )}
                    </div>

                    <div className="shrink-0">
                      {m.status === "Paid" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={13} className="text-emerald-600" /> Paid / Released
                        </span>
                      ) : m.status === "Due" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <Clock size={13} className="text-amber-600" /> Due for Release
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          Upcoming Stage
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedCandidateApp(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Close Milestone Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

