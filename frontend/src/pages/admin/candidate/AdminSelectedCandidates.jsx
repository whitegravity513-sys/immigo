import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  UserCheck,
  Search,
  ArrowRight,
  Clock,
  CheckCircle2,
  Building2,
  ExternalLink,
  Sliders,
  DollarSign,
  CreditCard,
  X,
  FileText,
  AlertCircle,
  Globe,
  Award,
  RefreshCw,
  Plus,
} from "lucide-react";
import apiClient from "../../../services/apiClient.js";

export default function AdminSelectedCandidates() {
  const [selectedApps, setSelectedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentModalApp, setPaymentModalApp] = useState(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(15000);
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadSelected();
  }, []);

  const loadSelected = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/candidates/applications/list?status=Selected&limit=100");
      if (res.data?.applications) {
        setSelectedApps(res.data.applications);
      }
    } catch (err) {
      console.error("Failed to load selected candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = (app) => {
    setPaymentModalApp(app);
    const milestones = app.processMilestones || app.paymentPlan?.milestones || [];
    const firstUnpaid = milestones.find((m) => m.status !== "Paid" && m.paymentStatus !== "Approved") || milestones[0];
    if (firstUnpaid) {
      setSelectedMilestoneId(firstUnpaid.id);
      setPaymentAmount(firstUnpaid.amount || firstUnpaid.paymentAmount || 15000);
    }
    setReferenceNumber(`TXN-${Date.now().toString().slice(-6)}`);
    setPaymentRemarks("Milestone payment confirmed by Admin");
  };

  const handleSavePayment = async () => {
    if (!paymentModalApp || !selectedMilestoneId) return;
    setPaymentLoading(true);
    try {
      const res = await apiClient.post(
        `/admin/candidates/applications/${paymentModalApp.applicationId || paymentModalApp.id}/milestones/${selectedMilestoneId}/record-payment`,
        {
          amount: Number(paymentAmount),
          paymentMode,
          referenceNumber,
          remarks: paymentRemarks,
        }
      );
      if (res.data?.success) {
        setNotification({
          type: "success",
          message: `Payment of ₹${Number(paymentAmount).toLocaleString()} recorded! Receipt ${res.data.receiptNumber || ""} generated.`,
        });
        setPaymentModalApp(null);
        loadSelected();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to record payment.",
      });
    } finally {
      setPaymentLoading(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const filtered = selectedApps.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.candidateName?.toLowerCase().includes(q) ||
      app.projectName?.toLowerCase().includes(q) ||
      app.clientName?.toLowerCase().includes(q) ||
      app.destinationCountry?.toLowerCase().includes(q) ||
      app.position?.toLowerCase().includes(q) ||
      app.candidateId?.toLowerCase().includes(q)
    );
  });

  const totalCollected = selectedApps.reduce((acc, app) => {
    const paidList = (app.payments || []).filter((p) => p.status === "Verified");
    const appPaid = paidList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return acc + appPaid;
  }, 0);

  return (
    <div className="space-y-4 max-w-full w-full mx-auto font-sans antialiased text-slate-800">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Selected Candidates & Milestone Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Manage student & candidate processing milestones, track deployment stages, verify documents, and record milestone payments.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>Selected: {selectedApps.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <CreditCard size={13} className="text-blue-600" />
            <span>Collected: ₹{totalCollected.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by candidate, project, role, country..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
          />
        </div>

        <button
          onClick={loadSelected}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 self-start cursor-pointer transition"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Candidates List / Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-semibold text-slate-500">Loading selected candidates & milestones...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No Selected Candidates Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Candidates marked as "Selected" from Job Applications or Interviews will appear here with automated milestone plans.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 text-[10px]">Candidate Profile</th>
                  <th className="py-2.5 px-3 text-[10px]">Project & Country</th>
                  <th className="py-2.5 px-3 text-[10px]">Position</th>
                  <th className="py-2.5 px-3 text-[10px]">Processing Stage</th>
                  <th className="py-2.5 px-3 text-[10px]">Milestones & Payments</th>
                  <th className="py-2.5 px-4 text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((app) => {
                  const milestones = app.processMilestones?.length > 0
                    ? app.processMilestones
                    : app.paymentPlan?.milestones?.length > 0
                    ? app.paymentPlan.milestones
                    : [
                        { id: "m0", name: "Milestone 1: Selection & Document Clearance", status: "Active", paymentStatus: "Payment Required", amount: 15000, stages: [{ id: "s1", name: "Trade Skill & Screening", status: "Completed" }, { id: "s2", name: "Client Offer Letter Signed", status: "In Progress" }] },
                        { id: "m1", name: "Milestone 2: Medical & Visa Processing", status: "Locked", paymentStatus: "Locked", amount: 15000, stages: [{ id: "s3", name: "GAMCA Medical Fitness Clearance", status: "Pending" }] },
                        { id: "m2", name: "Milestone 3: Flight Deployment", status: "Locked", paymentStatus: "Locked", amount: 10000, stages: [{ id: "s4", name: "Air Ticket Booking", status: "Pending" }] },
                      ];

                  let activeMilestone = null;
                  let activeStage = null;
                  let totalStagesCount = 0;
                  let completedStagesCount = 0;

                  milestones.forEach((m) => {
                    if (!Array.isArray(m.stages)) return;
                    m.stages.forEach((s) => {
                      totalStagesCount++;
                      if (s.status === "Completed") completedStagesCount++;
                      else if (!activeStage) {
                        activeStage = s;
                        activeMilestone = m;
                      }
                    });
                  });

                  const stageName = activeStage ? activeStage.name : "All Stages Completed";
                  const displayIndex = activeStage ? completedStagesCount + 1 : totalStagesCount;
                  const paidMilestonesCount = milestones.filter(
                    (m) => m.status === "Paid" || m.paymentStatus === "Approved"
                  ).length;
                  const totalMilestonesCount = milestones.length || 3;
                  const totalPlanAmount = app.paymentPlan?.totalAmount || milestones.reduce((sum, m) => sum + (Number(m.amount || m.paymentAmount) || 0), 0) || 40000;
                  const totalPaidAmount = milestones.reduce((sum, m) => {
                    if (m.status === "Paid" || m.paymentStatus === "Approved") {
                      return sum + (Number(m.amount || m.paymentAmount) || 0);
                    }
                    return sum;
                  }, 0);

                  const percentComplete = totalStagesCount > 0 ? Math.round((completedStagesCount / totalStagesCount) * 100) : 0;

                  return (
                    <tr key={app.id || app.applicationId} className="hover:bg-slate-50/70 transition">
                      {/* Candidate Column */}
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-900 text-cyan-300 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {(app.candidateName || "C").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{app.candidateName}</span>
                              <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-mono">
                                {app.candidateId}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {app.candidateEmail} {app.candidatePhone ? `• ${app.candidatePhone}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Project Column */}
                      <td className="py-2 px-3">
                        <div className="text-xs font-bold text-slate-800 leading-tight">
                          {app.projectName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <Globe size={11} className="text-sky-600" />
                          <span>{app.destinationCountry || "Overseas"}</span>
                          {app.clientName && <span>• {app.clientName}</span>}
                        </div>
                      </td>

                      {/* Position Column */}
                      <td className="py-2 px-3">
                        <div className="text-xs font-semibold text-slate-700">{app.position || "Specialist"}</div>
                        {app.salary && (
                          <div className="text-[11px] font-medium text-emerald-700 mt-0.5">
                            {app.salary}
                          </div>
                        )}
                      </td>

                      {/* Processing Stage Column */}
                      <td className="py-2 px-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span className="truncate max-w-[170px]" title={stageName}>{stageName}</span>
                          <span className="text-slate-500 font-mono text-[10px]">
                            ({displayIndex}/{totalStagesCount || 8})
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full max-w-[190px] bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${percentComplete}%` }}
                          />
                        </div>
                        {activeMilestone && (
                          <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase truncate max-w-[190px]">
                            in {activeMilestone.name}
                          </div>
                        )}
                      </td>

                      {/* Milestones & Payment Column */}
                      <td className="py-2 px-3">
                        <div className="text-xs font-medium text-slate-700">
                          <span className="font-bold text-slate-900">
                            {paidMilestonesCount}/{totalMilestonesCount} Paid
                          </span>
                          <span className="text-slate-500 ml-1.5">
                            (₹{totalPaidAmount.toLocaleString()} / ₹{Number(totalPlanAmount).toLocaleString()})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {paidMilestonesCount > 0 ? (
                            <Link
                              to={`/invoice/${app.applicationId || app.id}/${milestones[0]?.id || "m0"}`}
                              target="_blank"
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                            >
                              <FileText size={11} />
                              <span>View Receipt</span>
                            </Link>
                          ) : (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold">
                              Payment Due
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="py-2 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenPaymentModal(app)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                            title="Quickly record milestone payment"
                          >
                            <DollarSign size={13} />
                            <span>Record Pay</span>
                          </button>

                          <Link
                            to={`/admin/candidates/milestones-manage?appId=${app.applicationId || app.id}`}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                            title="Manage candidate processing stages & upload documents"
                          >
                            <Sliders size={13} />
                            <span>Manage Stages</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs sm:text-sm font-bold">Record Milestone Payment</h3>
              </div>
              <button
                onClick={() => setPaymentModalApp(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-800">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{paymentModalApp.candidateName}</div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {paymentModalApp.projectName} • {paymentModalApp.position}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Milestone
                </label>
                <select
                  value={selectedMilestoneId}
                  onChange={(e) => {
                    const mId = e.target.value;
                    setSelectedMilestoneId(mId);
                    const milestones = paymentModalApp.processMilestones || paymentModalApp.paymentPlan?.milestones || [];
                    const found = milestones.find((m) => m.id === mId);
                    if (found) {
                      setPaymentAmount(found.amount || found.paymentAmount || 15000);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-blue-600"
                >
                  {(paymentModalApp.processMilestones || paymentModalApp.paymentPlan?.milestones || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (₹{Number(m.amount || m.paymentAmount || 15000).toLocaleString()}) - {m.status || "Due"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-blue-600"
                  >
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Online UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Cash">Cash in Hand</option>
                    <option value="Cheque">Bank Cheque / DD</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Transaction / Reference ID
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UTR129381923"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Admin Remarks
                </label>
                <input
                  type="text"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  placeholder="e.g. Advance selection fee verified"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalApp(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePayment}
                  disabled={paymentLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {paymentLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>Approve & Record Payment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
