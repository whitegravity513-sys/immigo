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
  Eye,
  ChevronDown,
  ChevronUp,
  Filter,
  IndianRupee,
  Calendar,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Layers,
  Sparkles,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService";

export default function Payments() {
  const [vendor, setVendor] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'All' | 'Paid' | 'Due'
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  // Track which candidate rows are expanded to view milestone details
  const [expandedAppIds, setExpandedAppIds] = useState(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      setVendor(curVendor);

      const apps = await crmVendorService.getApplications(curVendor?.id);

      // Selected or Completed candidates with payment plans
      const selectedApps = (apps || []).filter(
        (a) => ["Selected", "Completed"].includes(a.status)
      );
      setApplications(selectedApps);
    } catch (err) {
      console.error("Failed to load payment history:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (appId) => {
    setExpandedAppIds((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  };

  // Process applications with calculated financial figures per person
  const candidateAccounts = applications.map((app) => {
    const milestones = app.processMilestones || [];
    let totalFee = 0;
    let paidAmount = 0;
    let dueAmount = 0;
    let paidCount = 0;
    let dueCount = 0;

    const parsedMilestones = milestones.map((m, idx) => {
      const amt = Number(m.paymentAmount || m.amount || 0);
      const isPaid = m.paymentStatus === "Approved";
      const isSubmitted = m.paymentStatus === "Submitted";
      const isDue = !isPaid && !isSubmitted && amt > 0 && m.paymentStatus !== "Not Required";

      totalFee += amt;
      if (isPaid) {
        paidAmount += amt;
        paidCount += 1;
      } else {
        dueAmount += amt;
        if (isDue) dueCount += 1;
      }

      let method = "Online Gateway";
      if (m.paymentRef?.includes("[Razorpay]")) method = "Razorpay";
      else if (m.paymentRef?.includes("[Bank Transfer]")) method = "Bank Transfer";
      else if (m.paymentRef?.includes("[UPI]")) method = "UPI";

      return {
        id: m.id || idx,
        index: idx + 1,
        name: m.name,
        amount: amt,
        percentage: m.percentage || 0,
        status: m.paymentStatus || "Due",
        isPaid,
        isSubmitted,
        isDue,
        paymentDate: m.paymentDate || (isPaid ? "08/10/2026" : null),
        paymentRef: m.paymentRef,
        method,
      };
    });

    const isFullyPaid = totalFee > 0 && paidAmount >= totalFee;
    const isPartiallyPaid = paidAmount > 0 && paidAmount < totalFee;
    const isPending = paidAmount === 0;

    return {
      appId: app.id,
      candidateId: app.candidateId,
      candidateName: app.candidateName || "Candidate",
      position: app.position || "Technician",
      projectName: app.projectName || "General Deployment",
      clientName: app.clientName || "Corporate Client",
      totalFee,
      paidAmount,
      dueAmount: Math.max(0, totalFee - paidAmount),
      paidCount,
      totalMilestonesCount: milestones.length,
      milestones: parsedMilestones,
      isFullyPaid,
      isPartiallyPaid,
      isPending,
      paymentStatus: isFullyPaid
        ? "Fully Paid"
        : isPartiallyPaid
        ? "Partially Paid"
        : "Payment Due",
    };
  });

  // Financial summary across all candidate accounts
  const totalContractFee = candidateAccounts.reduce((acc, c) => acc + c.totalFee, 0);
  const totalPaidOverall = candidateAccounts.reduce((acc, c) => acc + c.paidAmount, 0);
  const totalDueOverall = candidateAccounts.reduce((acc, c) => acc + c.dueAmount, 0);

  const fullyPaidCount = candidateAccounts.filter((c) => c.isFullyPaid).length;
  const dueAccountsCount = candidateAccounts.filter((c) => c.dueAmount > 0).length;

  // Filter candidate accounts
  const filteredAccounts = candidateAccounts.filter((cand) => {
    if (activeTab === "Paid" && cand.paidAmount <= 0) return false;
    if (activeTab === "Due" && cand.dueAmount <= 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        cand.candidateName.toLowerCase().includes(q) ||
        cand.candidateId.toLowerCase().includes(q) ||
        cand.position.toLowerCase().includes(q) ||
        cand.projectName.toLowerCase().includes(q) ||
        cand.clientName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4" />
            <span>Candidate Milestone Accounts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Payments Ledger by Candidate
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ek candidate ka pura process aur milestone payments ek sath yahan dekhein.
          </p>
        </div>

        <button
          onClick={() => alert("Statement export ready.")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Summary</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Agreed Fees
            </span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            ₹{totalContractFee.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block font-medium">
            Across {candidateAccounts.length} selected candidate(s)
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Total Amount Paid
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
            ₹{totalPaidOverall.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block font-medium">
            {fullyPaidCount} fully completed candidates
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Pending / Due Balance
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
            ₹{totalDueOverall.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block font-medium">
            Pending across {dueAccountsCount} active candidate(s)
          </span>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("All")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "All"
                ? "bg-white text-slate-900 shadow-2xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Candidates ({candidateAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab("Paid")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "Paid"
                ? "bg-white text-emerald-700 shadow-2xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Payments Active ({candidateAccounts.filter((c) => c.paidAmount > 0).length})
          </button>
          <button
            onClick={() => setActiveTab("Due")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "Due"
                ? "bg-white text-amber-700 shadow-2xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Due / Pending ({dueAccountsCount})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, position, project..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs font-medium"
          />
        </div>
      </div>

      {/* Candidate Accounts Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-semibold text-slate-500">Loading candidate payment accounts...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No candidates match selection</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Candidates with active processing and milestones will be listed here per person.
          </p>
          <div className="pt-2">
            <Link
              to="/vendor/selected"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 transition"
            >
              <span>View Selected Candidates</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Candidate</th>
                  <th className="py-3.5 px-4">Project & Role</th>
                  <th className="py-3.5 px-4 text-center">Total Fee</th>
                  <th className="py-3.5 px-4 text-center">Amount Paid</th>
                  <th className="py-3.5 px-4 text-center">Remaining Due</th>
                  <th className="py-3.5 px-4">Process Milestones</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((cand) => {
                  const isExpanded = expandedAppIds.has(cand.appId);
                  const percentPaid =
                    cand.totalFee > 0
                      ? Math.min(100, Math.round((cand.paidAmount / cand.totalFee) * 100))
                      : 0;

                  return (
                    <React.Fragment key={cand.appId}>
                      <tr className="hover:bg-slate-50/70 transition group">
                        {/* Candidate Name & ID */}
                        <td className="py-4 px-4">
                          <Link
                            to={`/vendor/candidates/${cand.candidateId}`}
                            className="font-extrabold text-slate-900 group-hover:text-blue-600 transition block text-sm"
                          >
                            {cand.candidateName}
                          </Link>
                          <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                            ID: {cand.candidateId}
                          </span>
                        </td>

                        {/* Project & Role */}
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-800 block truncate max-w-[170px]">
                            {cand.projectName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            {cand.position}
                          </span>
                        </td>

                        {/* Total Fee */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <span className="font-extrabold text-slate-900 text-sm">
                            ₹{cand.totalFee.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {cand.totalMilestonesCount} stage(s)
                          </span>
                        </td>

                        {/* Amount Paid */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <span className="font-extrabold text-emerald-600 text-sm">
                            ₹{cand.paidAmount.toLocaleString()}
                          </span>
                          <div className="w-20 bg-slate-100 rounded-full h-1.5 mx-auto mt-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                            {percentPaid}% Paid ({cand.paidCount}/{cand.totalMilestonesCount})
                          </span>
                        </td>

                        {/* Remaining Due */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <span
                            className={`font-extrabold text-sm ${
                              cand.dueAmount > 0 ? "text-amber-600" : "text-slate-400"
                            }`}
                          >
                            ₹{cand.dueAmount.toLocaleString()}
                          </span>
                          {cand.dueAmount > 0 ? (
                            <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                              Pending release
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                              Cleared
                            </span>
                          )}
                        </td>

                        {/* Process Milestones (ek sath summary chips) */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                            {cand.milestones.slice(0, 3).map((m) => (
                              <span
                                key={m.id}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                  m.isPaid
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : m.isSubmitted
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                                title={`${m.name}: ₹${m.amount.toLocaleString()} (${m.status})`}
                              >
                                {m.isPaid ? (
                                  <CheckCircle2 size={10} className="text-emerald-500" />
                                ) : (
                                  <Clock size={10} className="text-amber-500" />
                                )}
                                <span className="truncate max-w-[80px]">M{m.index}</span>
                                <span>₹{(m.amount / 1000).toFixed(0)}k</span>
                              </span>
                            ))}
                            {cand.milestones.length > 3 && (
                              <button
                                onClick={() => toggleExpand(cand.appId)}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded-lg cursor-pointer"
                              >
                                +{cand.milestones.length - 3} more
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Overall Status */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {cand.isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={11} className="text-emerald-600" />
                              <span>Fully Paid</span>
                            </span>
                          ) : cand.isPartiallyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock size={11} className="text-blue-600" />
                              <span>Partially Paid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={11} className="text-amber-600" />
                              <span>Payment Due</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => toggleExpand(cand.appId)}
                              className={`p-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                                isExpanded
                                  ? "bg-slate-900 text-white border-slate-900"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                              title={isExpanded ? "Hide Milestones" : "View All Milestones"}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              <span className="hidden sm:inline">
                                {isExpanded ? "Hide" : "Stages"}
                              </span>
                            </button>

                            <Link
                              to={`/vendor/processing/${cand.appId}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                            >
                              <span>Timeline & Pay</span>
                              <ChevronRight size={13} />
                            </Link>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable row: All milestones for this candidate shown together */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={8} className="p-4 sm:p-5">
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-blue-600" />
                                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                    All Process Milestones for {cand.candidateName}
                                  </h4>
                                </div>
                                <span className="text-[11px] font-bold text-slate-500">
                                  Total: ₹{cand.totalFee.toLocaleString()} • Paid: ₹{cand.paidAmount.toLocaleString()} • Balance: ₹{cand.dueAmount.toLocaleString()}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {cand.milestones.map((m) => (
                                  <div
                                    key={m.id}
                                    className={`p-3 rounded-xl border transition ${
                                      m.isPaid
                                        ? "bg-emerald-50/40 border-emerald-200"
                                        : m.isSubmitted
                                        ? "bg-amber-50/40 border-amber-200"
                                        : "bg-slate-50 border-slate-200"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[10px] font-bold text-slate-500">
                                        Stage #{m.index}
                                      </span>
                                      {m.isPaid ? (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800">
                                          Paid
                                        </span>
                                      ) : m.isSubmitted ? (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800">
                                          In Review
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-200 text-slate-700">
                                          Pending
                                        </span>
                                      )}
                                    </div>

                                    <h5 className="font-extrabold text-slate-900 text-xs mt-1 truncate" title={m.name}>
                                      {m.name}
                                    </h5>

                                    <div className="text-sm font-black text-slate-900 mt-1">
                                      ₹{m.amount.toLocaleString()}
                                    </div>

                                    <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                      <span>
                                        {m.paymentDate ? `Paid: ${m.paymentDate}` : "Not Paid"}
                                      </span>
                                      {m.isPaid ? (
                                        <span className="text-emerald-700 font-semibold">{m.method}</span>
                                      ) : (
                                        <Link
                                          to={`/vendor/processing/${cand.appId}`}
                                          className="text-blue-600 font-bold hover:underline"
                                        >
                                          Pay Now →
                                        </Link>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing <strong className="text-slate-900">{filteredAccounts.length}</strong> candidate deployment account(s)
            </span>
            <span className="font-bold text-slate-800">
              Total Contract Volume: ₹{filteredAccounts.reduce((acc, c) => acc + c.totalFee, 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
