import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Download,
  Building2,
  Eye,
  FileText,
  DollarSign,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";

export default function AdminPaymentsList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTxnHistoryApp, setSelectedTxnHistoryApp] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await crmVendorService.getApplications();
      // Payments view applies to selected candidates with payment plans
      const filtered = (data || []).filter(
        (a) => (a.status === "Selected" || a.status === "Completed" || a.paymentPlan) && a.paymentPlan
      );
      setApplications(filtered);
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoading(false);
    }
  };

  // Compute overall financial totals
  let totalPaymentOverall = 0;
  let totalPaidOverall = 0;

  applications.forEach((app) => {
    const total = Number(app.paymentPlan?.totalAmount || 40000);
    totalPaymentOverall += total;
    const milestones = app.paymentPlan?.milestones || [];
    milestones.forEach((m) => {
      const amt = Number(m.amount) || 0;
      if (m.status === "Paid") totalPaidOverall += amt;
    });
  });

  const totalRemainingBalance = Math.max(0, totalPaymentOverall - totalPaidOverall);

  const filteredApps = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.candidateName?.toLowerCase().includes(q) ||
      app.projectName?.toLowerCase().includes(q) ||
      app.vendorId?.toLowerCase().includes(q) ||
      app.clientName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Selected Candidates Payment Accounts</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Candidate-grouped payment ledger. Track agreed placement fee to collect, released disbursements, and pending balance per candidate.
        </p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Payment To Collect (Agreed Fee)
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{totalPaymentOverall.toLocaleString()}</div>
          <span className="text-[11px] text-slate-400 font-medium">Agreed contract fee across selected candidates</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Total Payment Released (Paid)
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">₹{totalPaidOverall.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-700 font-medium">Disbursed to vendor accounts</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
            Remaining Balance (Pending Release)
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">₹{totalRemainingBalance.toLocaleString()}</div>
          <span className="text-[11px] text-amber-700 font-medium">Pending upcoming milestone triggers</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter payments by candidate, project, vendor..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
        />
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading payment accounts...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No payment records found</h3>
          <p className="text-xs text-slate-500 mt-1">Payment plans generate automatically when candidate applications are accepted as Selected.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Candidate</th>
                  <th className="py-3.5 px-4">Vendor</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Paid Amount</th>
                  <th className="py-3.5 px-4">Remaining</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => {
                  const total = Number(app.paymentPlan?.totalAmount || 40000);
                  const milestones = app.paymentPlan?.milestones || [];
                  const paid = milestones.filter((m) => m.status === "Paid").reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
                  const remaining = Math.max(0, total - paid);

                  let statusLabel = "Unpaid";
                  let statusBg = "bg-slate-100 text-slate-700";
                  if (paid === total) {
                    statusLabel = "Fully Paid";
                    statusBg = "bg-emerald-100 text-emerald-800";
                  } else if (paid > 0) {
                    statusLabel = "Partially Paid";
                    statusBg = "bg-blue-100 text-blue-800";
                  }

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">{app.candidateName}</td>
                      <td className="py-4 px-4 font-semibold text-slate-700">{app.vendorId}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">{app.projectName}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">₹{total.toLocaleString()}</td>
                      <td className="py-4 px-4 font-bold text-emerald-600">₹{paid.toLocaleString()}</td>
                      <td className="py-4 px-4 font-bold text-slate-500">₹{remaining.toLocaleString()}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBg}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setSelectedTxnHistoryApp(app)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>History</span>
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

      {/* Transaction History Modal */}
      {selectedTxnHistoryApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Payment Audit Trail</span>
                <h3 className="text-lg font-bold text-slate-900">{selectedTxnHistoryApp.candidateName}</h3>
                <p className="text-xs text-slate-500">Project: {selectedTxnHistoryApp.projectName} • Vendor: {selectedTxnHistoryApp.vendorId}</p>
              </div>
              <button
                onClick={() => setSelectedTxnHistoryApp(null)}
                className="px-3 py-1 rounded text-slate-400 hover:text-slate-800 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Milestone Disbursement Logs:</h4>
              <div className="space-y-2">
                {selectedTxnHistoryApp.paymentPlan?.milestones?.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{m.name}</span>
                      <span className="text-[11px] text-slate-500">
                        Amount: <strong className="text-slate-900">₹{Number(m.amount).toLocaleString()}</strong> • Status: <span className={m.status === "Paid" ? "text-emerald-600 font-bold" : "text-amber-600"}>{m.status}</span>
                      </span>
                      {m.paymentRef && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Ref: {m.paymentRef} • Paid Date: {m.paidDate || "2026-09-20"}
                        </div>
                      )}
                    </div>
                    {m.status === "Paid" ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        Paid
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Pending
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTxnHistoryApp(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
