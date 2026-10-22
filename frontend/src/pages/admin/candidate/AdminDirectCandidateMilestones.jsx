import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Layers,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  AlertCircle,
  Plus,
  Trash2,
  Building2,
  User,
  IndianRupee,
  ShieldCheck,
  ChevronRight,
  Save,
  Upload,
  FileText,
  Eye,
  X,
  CreditCard,
  DollarSign,
  Globe,
  Award,
} from "lucide-react";
import apiClient from "../../../services/apiClient.js";

export default function AdminDirectCandidateMilestones() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appId = searchParams.get("appId");

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notification, setNotification] = useState(null);

  const [totalAmount, setTotalAmount] = useState(40000);
  const [milestonesList, setMilestonesList] = useState([]);
  const [activeMilestoneIdx, setActiveMilestoneIdx] = useState(0);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(15000);
  const [payMode, setPayMode] = useState("Bank Transfer");
  const [payRef, setPayRef] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);

  useEffect(() => {
    loadData();
  }, [appId]);

  const loadData = async () => {
    if (!appId) return;
    try {
      setLoading(true);
      const res = await apiClient.get(`/admin/candidates/applications/${appId}/milestones`);
      if (res.data?.application) {
        const app = res.data.application;
        setApplication(app);

        const rawMilestones =
          app.processMilestones?.length > 0
            ? app.processMilestones
            : app.paymentPlan?.milestones?.length > 0
            ? app.paymentPlan.milestones
            : [];

        const totalAmt =
          app.paymentPlan?.totalAmount ||
          rawMilestones.reduce((sum, m) => sum + (Number(m.amount || m.paymentAmount) || 0), 0) ||
          40000;
        setTotalAmount(totalAmt);

        if (rawMilestones.length > 0) {
          const formatted = rawMilestones.map((m, mIdx) => {
            const isPaid = m.status === "Paid" || m.paymentStatus === "Approved";
            const amt = Number(m.amount || m.paymentAmount || 15000);
            return {
              id: m.id || `m${mIdx}`,
              name: m.name || `Milestone ${mIdx + 1}`,
              amount: amt,
              paymentAmount: amt,
              status: isPaid ? "Paid" : m.status || (mIdx === 0 ? "Active" : "Locked"),
              paymentStatus: isPaid ? "Approved" : m.paymentStatus || (mIdx === 0 ? "Payment Required" : "Locked"),
              paymentDate: m.paymentDate || null,
              paymentRef: m.paymentRef || null,
              approvedBy: m.approvedBy || null,
              stages: (m.stages || []).map((s, sIdx) => ({
                id: s.id || `s${mIdx}_${sIdx}`,
                name: s.name || `Process Step ${sIdx + 1}`,
                status: s.status || "Pending",
                remark: s.remark || "",
                completedAt: s.completedAt || null,
                document: s.document || null,
              })),
            };
          });

          setMilestonesList(formatted);
          const firstIncomplete = formatted.findIndex((m) => {
            const allDone = (m.stages || []).length > 0 && m.stages.every((s) => s.status === "Completed");
            return !allDone;
          });
          setActiveMilestoneIdx(firstIncomplete !== -1 ? firstIncomplete : 0);
        } else {
          const defaults = [
            {
              id: "m0",
              name: "Milestone 1: Selection & Document Clearance",
              amount: 15000,
              paymentAmount: 15000,
              status: "Active",
              paymentStatus: "Payment Required",
              stages: [
                { id: "s0_1", name: "Trade Skill & Technical Screening", status: "Completed", completedAt: new Date().toISOString(), remark: "Assessed & verified", document: null },
                { id: "s0_2", name: "Client Selection & Offer Letter Signed", status: "In Progress", completedAt: null, remark: "", document: null },
                { id: "s0_3", name: "Document Attestation & Verification", status: "Pending", completedAt: null, remark: "", document: null },
              ],
            },
            {
              id: "m1",
              name: "Milestone 2: Medical & Visa Processing",
              amount: 15000,
              paymentAmount: 15000,
              status: "Locked",
              paymentStatus: "Locked",
              stages: [
                { id: "s1_1", name: "GAMCA Medical Fitness Clearance", status: "Locked", completedAt: null, remark: "", document: null },
                { id: "s1_2", name: "Visa Application & Work Permit Stamping", status: "Locked", completedAt: null, remark: "", document: null },
              ],
            },
            {
              id: "m2",
              name: "Milestone 3: Emigration Clearance & Flight Deployment",
              amount: 10000,
              paymentAmount: 10000,
              status: "Locked",
              paymentStatus: "Locked",
              stages: [
                { id: "s2_1", name: "Emigration Clearance (Poe/Protector)", status: "Locked", completedAt: null, remark: "", document: null },
                { id: "s2_2", name: "Air Ticket Booking & Travel Insurance", status: "Locked", completedAt: null, remark: "", document: null },
                { id: "s2_3", name: "Airport Mobilization & Deployment", status: "Locked", completedAt: null, remark: "", document: null },
              ],
            },
          ];
          setMilestonesList(defaults);
          setActiveMilestoneIdx(0);
        }
      }
    } catch (err) {
      console.error("Failed to load candidate milestones:", err);
      setNotification({ type: "error", message: "Failed to load candidate milestone details." });
    } finally {
      setLoading(false);
    }
  };

  const handleStageStatusChange = (mIdx, sIdx, newStatus) => {
    const updated = [...milestonesList];
    updated[mIdx].stages[sIdx].status = newStatus;
    if (newStatus === "Completed") {
      updated[mIdx].stages[sIdx].completedAt = new Date().toISOString();
    } else {
      updated[mIdx].stages[sIdx].completedAt = null;
    }

    const allCurrentStagesDone = updated[mIdx].stages.every((s) => s.status === "Completed");
    if (allCurrentStagesDone && mIdx < updated.length - 1) {
      if (updated[mIdx + 1].status === "Locked") {
        updated[mIdx + 1].status = (updated[mIdx + 1].amount || 0) > 0 ? "Payment Required" : "Active";
        if (updated[mIdx + 1].paymentStatus === "Locked") {
          updated[mIdx + 1].paymentStatus = (updated[mIdx + 1].amount || 0) > 0 ? "Payment Required" : "Not Required";
        }
      }
    }

    setMilestonesList(updated);
  };

  const handleStageNameChange = (mIdx, sIdx, newName) => {
    const updated = [...milestonesList];
    updated[mIdx].stages[sIdx].name = newName;
    setMilestonesList(updated);
  };

  const handleStageRemarkChange = (mIdx, sIdx, newRemark) => {
    const updated = [...milestonesList];
    updated[mIdx].stages[sIdx].remark = newRemark;
    setMilestonesList(updated);
  };

  const handleAddStage = (mIdx) => {
    const updated = [...milestonesList];
    if (!Array.isArray(updated[mIdx].stages)) {
      updated[mIdx].stages = [];
    }
    const nextIdx = updated[mIdx].stages.length + 1;
    updated[mIdx].stages.push({
      id: `s${mIdx}_${Date.now()}`,
      name: `Step ${nextIdx}: Processing Task`,
      status: "Pending",
      remark: "",
      completedAt: null,
      document: null,
    });
    setMilestonesList(updated);
  };

  const handleRemoveStage = (mIdx, sIdx) => {
    const updated = [...milestonesList];
    updated[mIdx].stages = updated[mIdx].stages.filter((_, i) => i !== sIdx);
    setMilestonesList(updated);
  };

  const handleFileUploadForStage = (mIdx, sIdx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const fileUrl = uploadEvent.target.result;
      const stageName = milestonesList[mIdx].stages[sIdx].name || `Stage ${sIdx + 1}`;
      const docName = `${stageName} Proof`;
      const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;

      const updated = [...milestonesList];
      const docObj = {
        name: docName,
        fileName: file.name,
        fileUrl: fileUrl,
        size: sizeStr,
        uploadedAt: new Date().toISOString(),
      };
      updated[mIdx].stages[sIdx].document = docObj;
      setMilestonesList(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveStageDocument = (mIdx, sIdx) => {
    const updated = [...milestonesList];
    updated[mIdx].stages[sIdx].document = null;
    setMilestonesList(updated);
  };

  const handleUnlockMilestone = (mIdx) => {
    const updated = [...milestonesList];
    updated[mIdx].status = "Active";
    updated[mIdx].paymentStatus = "Approved";
    if (updated[mIdx].stages?.length > 0) {
      if (updated[mIdx].stages[0].status === "Locked" || updated[mIdx].stages[0].status === "Pending") {
        updated[mIdx].stages[0].status = "In Progress";
      }
    }
    setMilestonesList(updated);
    setActiveMilestoneIdx(mIdx);
  };

  const handleOpenRecordPayment = (mIdx) => {
    setActiveMilestoneIdx(mIdx);
    const m = milestonesList[mIdx];
    setPayAmount(m.amount || m.paymentAmount || 15000);
    setPayRef(`TXN-${Date.now().toString().slice(-6)}`);
    setPayRemarks(`Payment verified for ${m.name}`);
    setPaymentModalOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!application) return;
    const currentM = milestonesList[activeMilestoneIdx];
    if (!currentM) return;

    setRecordingPayment(true);
    try {
      const res = await apiClient.post(
        `/admin/candidates/applications/${application.applicationId || application.id}/milestones/${currentM.id}/record-payment`,
        {
          amount: Number(payAmount),
          paymentMode: payMode,
          referenceNumber: payRef,
          remarks: payRemarks,
        }
      );

      if (res.data?.success) {
        setNotification({
          type: "success",
          message: `Payment of ₹${Number(payAmount).toLocaleString()} approved! Receipt #${res.data.receiptNumber || ""} generated.`,
        });
        setPaymentModalOpen(false);
        loadData();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to record payment.",
      });
    } finally {
      setRecordingPayment(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleSave = async () => {
    if (!application) return;
    setSaveLoading(true);
    try {
      await apiClient.put(`/admin/candidates/applications/${application.applicationId || application.id}/milestones`, {
        totalAmount,
        milestones: milestonesList,
      });
      setSaveSuccess(true);
      setNotification({
        type: "success",
        message: "Candidate milestones and process timeline saved successfully! Notifications dispatched.",
      });
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to save milestones:", err);
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to save candidate milestones.",
      });
    } finally {
      setSaveLoading(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto my-8">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-700">Loading candidate processing milestones...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 max-w-xl mx-auto my-8">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-900">Application Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">Unable to locate the candidate application details.</p>
        <button
          onClick={() => navigate("/admin/candidates/selected")}
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
        >
          Return to Selected Candidates
        </button>
      </div>
    );
  }

  const currentM = milestonesList[activeMilestoneIdx] || milestonesList[0];
  const totalPaid = milestonesList.reduce((sum, m) => {
    if (m.status === "Paid" || m.paymentStatus === "Approved") {
      return sum + (Number(m.amount || m.paymentAmount) || 0);
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-4 max-w-6xl w-full mx-auto font-sans antialiased text-slate-800 pb-12">
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

      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/candidates/selected")}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Candidate Milestone & Process Workflow</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Configure deployment stages, upload proof certificates, track clearances, and verify milestone fees.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saveLoading}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer ${
              saveSuccess ? "bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"
            } disabled:opacity-50`}
          >
            {saveLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 size={14} />
            ) : (
              <Save size={14} />
            )}
            <span>{saveSuccess ? "Saved Successfully!" : "Save Milestone Plan"}</span>
          </button>
        </div>
      </div>

      {/* Candidate Profile & Project Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-4 sm:p-5 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-cyan-300 font-bold text-base flex items-center justify-center shrink-0 shadow-inner">
              {(application.candidateName || "C").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold tracking-tight text-white">{application.candidateName}</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  {application.status || "Selected"}
                </span>
                <span className="text-[11px] font-mono text-cyan-300 bg-white/10 px-2 py-0.5 rounded">
                  ID: {application.candidateId}
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1 flex items-center gap-3 flex-wrap">
                <span>{application.candidateEmail}</span>
                {application.candidatePhone && <span>• {application.candidatePhone}</span>}
                <span>• Role: <strong className="text-white">{application.position || "Specialist"}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Project & Client</span>
              <span className="font-bold text-white block">{application.projectName}</span>
              <span className="text-[11px] text-cyan-300">{application.destinationCountry || "Overseas"}</span>
            </div>
            <div className="border-l border-white/20 pl-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Fees Collected</span>
              <span className="font-bold text-emerald-400 text-sm">
                ₹{totalPaid.toLocaleString()} / ₹{Number(totalAmount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Amount & Milestone Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">Total Placement Fee Configuration</h3>
            <p className="text-[11px] text-slate-500 font-medium">Set overall candidate package and split into milestone payments.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Total Amount:</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="w-32 pl-7 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Milestone Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {milestonesList.map((m, idx) => {
            const isSelected = activeMilestoneIdx === idx;
            const isPaid = m.status === "Paid" || m.paymentStatus === "Approved";
            const isLocked = m.status === "Locked";
            const amt = Number(m.amount || m.paymentAmount || 15000);

            return (
              <button
                key={m.id || idx}
                onClick={() => setActiveMilestoneIdx(idx)}
                className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Phase {idx + 1}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isPaid
                        ? "bg-emerald-100 text-emerald-800"
                        : isLocked
                        ? "bg-slate-100 text-slate-600"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isPaid ? "Paid & Cleared" : isLocked ? "Locked" : "Active / Due"}
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900 truncate">{m.name}</div>
                <div className="text-[11px] font-bold text-slate-600 mt-1">₹{amt.toLocaleString()}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Milestone Detail Card */}
      {currentM && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Milestone Sub-Header */}
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-lg">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Milestone Name
              </label>
              <input
                type="text"
                value={currentM.name}
                onChange={(e) => {
                  const updated = [...milestonesList];
                  updated[activeMilestoneIdx].name = e.target.value;
                  setMilestonesList(updated);
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Milestone Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={currentM.amount || currentM.paymentAmount || 15000}
                    onChange={(e) => {
                      const updated = [...milestonesList];
                      const val = Number(e.target.value);
                      updated[activeMilestoneIdx].amount = val;
                      updated[activeMilestoneIdx].paymentAmount = val;
                      setMilestonesList(updated);
                    }}
                    className="w-32 pl-7 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {currentM.status !== "Paid" && currentM.paymentStatus !== "Approved" ? (
                <div className="flex items-center gap-2 pt-4">
                  <button
                    onClick={() => handleOpenRecordPayment(activeMilestoneIdx)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <DollarSign size={13} />
                    <span>Record Payment</span>
                  </button>
                  <button
                    onClick={() => handleUnlockMilestone(activeMilestoneIdx)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                    title="Unlock milestone directly without recording external transaction"
                  >
                    <Unlock size={13} />
                    <span>Direct Unlock</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Paid & Verified</span>
                  </span>
                  <Link
                    to={`/invoice/${application.applicationId || application.id}/${currentM.id}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <FileText size={13} />
                    <span>View Receipt</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Milestone Payment Audit Info */}
          {(currentM.paymentRef || currentM.paymentDate) && (
            <div className="px-5 py-2.5 bg-emerald-50/50 border-b border-emerald-100 text-xs flex items-center justify-between text-slate-700 flex-wrap gap-2">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  Ref ID: <strong className="font-mono">{currentM.paymentRef || "N/A"}</strong>
                </span>
                {currentM.paymentDate && <span>• Date: {currentM.paymentDate}</span>}
                {currentM.approvedBy && <span>• Verified By: {currentM.approvedBy}</span>}
              </div>
              {currentM.paymentRemark && (
                <span className="text-[11px] text-slate-500 italic">"{currentM.paymentRemark}"</span>
              )}
            </div>
          )}

          {/* Stages Checklist */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Processing Steps & Clearances Checklist
                </h4>
                <p className="text-[11px] text-slate-500">
                  Update step statuses, add officer remarks, and upload verification proof files (medical, visa, tickets).
                </p>
              </div>

              <button
                onClick={() => handleAddStage(activeMilestoneIdx)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 flex items-center gap-1 cursor-pointer transition"
              >
                <Plus size={13} />
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {(currentM.stages || []).map((stage, sIdx) => {
                const isDone = stage.status === "Completed";
                const inProgress = stage.status === "In Progress";

                return (
                  <div
                    key={stage.id || sIdx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isDone
                        ? "bg-emerald-50/40 border-emerald-200"
                        : inProgress
                        ? "bg-blue-50/30 border-blue-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {sIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={stage.name}
                          onChange={(e) => handleStageNameChange(activeMilestoneIdx, sIdx, e.target.value)}
                          className="flex-1 px-3 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-600 bg-transparent font-bold text-xs text-slate-900 focus:bg-white transition"
                        />
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Status Select */}
                        <select
                          value={stage.status}
                          onChange={(e) => handleStageStatusChange(activeMilestoneIdx, sIdx, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer ${
                            isDone
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : inProgress
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          }`}
                        >
                          <option value="Completed">✓ Completed</option>
                          <option value="In Progress">⏳ In Progress</option>
                          <option value="Pending">🔒 Pending</option>
                        </select>

                        {/* Document Upload Button */}
                        <label className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1 cursor-pointer transition">
                          <Upload size={12} />
                          <span>Proof</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUploadForStage(activeMilestoneIdx, sIdx, e)}
                            className="hidden"
                          />
                        </label>

                        {/* Remove Step */}
                        <button
                          onClick={() => handleRemoveStage(activeMilestoneIdx, sIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          title="Remove stage"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Remarks Input */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={stage.remark || ""}
                          onChange={(e) => handleStageRemarkChange(activeMilestoneIdx, sIdx, e.target.value)}
                          placeholder="Add internal remarks / verification notes..."
                          className="w-full px-2.5 py-1 text-xs text-slate-600 placeholder-slate-400 border border-transparent hover:border-slate-200 focus:border-slate-300 rounded-lg focus:outline-none bg-slate-50/50 focus:bg-white"
                        />
                      </div>

                      {/* Uploaded Document Badge */}
                      {stage.document && (
                        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg text-xs font-semibold border border-blue-200 shrink-0">
                          <FileText size={12} className="text-blue-600" />
                          <span className="truncate max-w-[140px] font-mono text-[11px]">
                            {stage.document.fileName || stage.document.name}
                          </span>
                          <a
                            href={stage.document.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 hover:text-blue-900"
                            title="Preview file"
                          >
                            <Eye size={12} />
                          </a>
                          <button
                            onClick={() => handleRemoveStageDocument(activeMilestoneIdx, sIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Remove file"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalOpen && currentM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs sm:text-sm font-bold">Record Milestone Payment</h3>
              </div>
              <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-800">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{application.candidateName}</div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {currentM.name} • {application.projectName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
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
                  Transaction / UTR Reference ID
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UTR847291039"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Admin Verification Notes
                </label>
                <input
                  type="text"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  placeholder="e.g. Payment verified in ICICI Corporate Account"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitPayment}
                  disabled={recordingPayment}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {recordingPayment ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  <span>Approve & Issue Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
