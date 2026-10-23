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
  Globe,
  Award,
  Check,
  Send,
  Users,
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

  // Document Upload State (for Candidate & Vendor)
  const [docTitle, setDocTitle] = useState("");
  const [docAudience, setDocAudience] = useState("both"); // "both", "candidate", "vendor"
  const [docUploading, setDocUploading] = useState(false);

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
            const isCompleted = m.status === "Completed";
            const isPaid = m.status === "Paid" || m.paymentStatus === "Approved" || isCompleted;
            const amt = Number(m.amount || m.paymentAmount || 15000);
            return {
              id: m.id || `m${mIdx}`,
              name: m.name || `Milestone ${mIdx + 1}`,
              amount: amt,
              paymentAmount: amt,
              status: isCompleted ? "Completed" : isPaid ? "Paid" : m.status || (mIdx === 0 ? "Active" : "Locked"),
              paymentStatus: isPaid ? "Approved" : m.paymentStatus || (mIdx === 0 ? "Payment Required" : "Locked"),
              paymentDate: m.paymentDate || null,
              paymentRef: m.paymentRef || null,
              approvedBy: m.approvedBy || null,
              paymentRemark: m.paymentRemark || "",
              clearanceDocuments: Array.isArray(m.clearanceDocuments) ? m.clearanceDocuments : [],
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
          // Find first milestone in progress / active
          const activeIdx = formatted.findIndex((m) => m.status === "Active" || m.status === "Payment Required");
          if (activeIdx !== -1) {
            setActiveMilestoneIdx(activeIdx);
          } else {
            const firstIncomplete = formatted.findIndex((m) => {
              const allDone = (m.stages || []).length > 0 && m.stages.every((s) => s.status === "Completed");
              return !allDone;
            });
            setActiveMilestoneIdx(firstIncomplete !== -1 ? firstIncomplete : 0);
          }
        } else {
          const defaults = [
            {
              id: "m0",
              name: "Milestone 1: Selection & Document Clearance",
              amount: 15000,
              paymentAmount: 15000,
              status: "Active",
              paymentStatus: "Payment Required",
              clearanceDocuments: [],
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
              clearanceDocuments: [],
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
              clearanceDocuments: [],
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

  // Helper to persist silently without page refresh
  const autoSyncMilestones = async (newList, totalAmt = totalAmount) => {
    if (!application) return;
    try {
      await apiClient.put(`/admin/candidates/applications/${application.applicationId || application.id}/milestones`, {
        totalAmount: totalAmt,
        milestones: newList,
      });
    } catch (err) {
      console.warn("Auto-sync error:", err);
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

    // Check if all stages in this milestone are completed
    const allCurrentStagesDone = updated[mIdx].stages.every((s) => s.status === "Completed");
    if (allCurrentStagesDone) {
      updated[mIdx].status = "Completed";
      if (mIdx < updated.length - 1 && updated[mIdx + 1].status === "Locked") {
        updated[mIdx + 1].status = (updated[mIdx + 1].amount || 0) > 0 ? "Payment Required" : "Active";
        if (updated[mIdx + 1].paymentStatus === "Locked") {
          updated[mIdx + 1].paymentStatus = (updated[mIdx + 1].amount || 0) > 0 ? "Payment Required" : "Not Required";
        }
        if (updated[mIdx + 1].stages?.length > 0 && updated[mIdx + 1].stages[0].status === "Locked") {
          updated[mIdx + 1].stages[0].status = "In Progress";
        }
      }
    }

    setMilestonesList(updated);
    autoSyncMilestones(updated);
  };

  // Admin explicit "Complete Milestone & Unlock Next Process"
  const handleCompleteMilestone = (mIdx) => {
    const updated = [...milestonesList];
    // Mark current milestone and all its stages as completed
    updated[mIdx].status = "Completed";
    updated[mIdx].paymentStatus = "Approved";
    (updated[mIdx].stages || []).forEach((stg) => {
      stg.status = "Completed";
      if (!stg.completedAt) stg.completedAt = new Date().toISOString();
    });

    // Advance to next process milestone
    if (mIdx + 1 < updated.length) {
      updated[mIdx + 1].status = "Active";
      if (updated[mIdx + 1].paymentStatus === "Locked") {
        updated[mIdx + 1].paymentStatus = (updated[mIdx + 1].amount || 0) > 0 ? "Payment Required" : "Not Required";
      }
      if (updated[mIdx + 1].stages?.length > 0) {
        if (updated[mIdx + 1].stages[0].status === "Locked" || updated[mIdx + 1].stages[0].status === "Pending") {
          updated[mIdx + 1].stages[0].status = "In Progress";
        }
      }
      setActiveMilestoneIdx(mIdx + 1);
      setNotification({
        type: "success",
        message: `Milestone ${mIdx + 1} completed! Advanced to Milestone ${mIdx + 2}: ${updated[mIdx + 1].name}.`,
      });
    } else {
      setNotification({
        type: "success",
        message: `All deployment milestones completed! Candidate is ready for travel & deployment.`,
      });
    }

    setMilestonesList(updated);
    autoSyncMilestones(updated);
    setTimeout(() => setNotification(null), 4000);
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
    autoSyncMilestones(updated);
  };

  const handleRemoveStage = (mIdx, sIdx) => {
    const updated = [...milestonesList];
    updated[mIdx].stages = updated[mIdx].stages.filter((_, i) => i !== sIdx);
    setMilestonesList(updated);
    autoSyncMilestones(updated);
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
      autoSyncMilestones(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveStageDocument = (mIdx, sIdx) => {
    const updated = [...milestonesList];
    updated[mIdx].stages[sIdx].document = null;
    setMilestonesList(updated);
    autoSyncMilestones(updated);
  };

  // Upload Milestone Clearance Document (for Candidate & Vendor)
  const handleUploadClearanceDocument = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("File size exceeds 15MB limit.");
      return;
    }

    setDocUploading(true);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const fileUrl = uploadEvent.target.result;
      const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
      const title = docTitle.trim() || file.name.replace(/\.[^/.]+$/, "");

      const docItem = {
        id: `cdoc_${Date.now()}`,
        title: title,
        fileName: file.name,
        fileUrl: fileUrl,
        size: sizeStr,
        targetAudience: docAudience, // "both" | "candidate" | "vendor"
        uploadedAt: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        uploadedBy: "Admin",
      };

      const updated = [...milestonesList];
      if (!Array.isArray(updated[activeMilestoneIdx].clearanceDocuments)) {
        updated[activeMilestoneIdx].clearanceDocuments = [];
      }
      updated[activeMilestoneIdx].clearanceDocuments.push(docItem);

      setMilestonesList(updated);
      setDocTitle("");
      setDocUploading(false);
      autoSyncMilestones(updated);

      setNotification({
        type: "success",
        message: `Clearance document "${title}" uploaded for ${
          docAudience === "both"
            ? "Candidate & Vendor"
            : docAudience === "candidate"
            ? "Candidate Only"
            : "Vendor Only"
        }!`,
      });
      setTimeout(() => setNotification(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveClearanceDocument = (docId) => {
    const updated = [...milestonesList];
    const curDocs = updated[activeMilestoneIdx].clearanceDocuments || [];
    updated[activeMilestoneIdx].clearanceDocuments = curDocs.filter((d) => d.id !== docId);
    setMilestonesList(updated);
    autoSyncMilestones(updated);
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
    autoSyncMilestones(updated);
    setNotification({
      type: "success",
      message: `Milestone ${mIdx + 1} unlocked instantly!`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenRecordPayment = (mIdx) => {
    setActiveMilestoneIdx(mIdx);
    const m = milestonesList[mIdx];
    setPayAmount(m.amount || m.paymentAmount || 15000);
    setPayRef(`TXN-${Date.now().toString().slice(-6)}`);
    setPayRemarks(`Payment verified for ${m.name}`);
    setPaymentModalOpen(true);
  };

  // Instant Payment Recording without reload
  const handleSubmitPayment = async () => {
    if (!application) return;
    const currentM = milestonesList[activeMilestoneIdx];
    if (!currentM) return;

    setRecordingPayment(true);
    const amtNum = Number(payAmount);
    const refNum = payRef.trim() || `TXN-${Date.now().toString().slice(-6)}`;

    // Instant optimistic state update
    const updated = [...milestonesList];
    updated[activeMilestoneIdx].status = "Paid";
    updated[activeMilestoneIdx].paymentStatus = "Approved";
    updated[activeMilestoneIdx].paymentAmount = amtNum;
    updated[activeMilestoneIdx].paymentRef = refNum;
    updated[activeMilestoneIdx].paymentDate = new Date().toLocaleDateString("en-IN");
    updated[activeMilestoneIdx].paymentRemark = payRemarks || `Payment verified by Admin`;
    if (updated[activeMilestoneIdx].stages?.length > 0) {
      if (updated[activeMilestoneIdx].stages[0].status === "Locked" || updated[activeMilestoneIdx].stages[0].status === "Pending") {
        updated[activeMilestoneIdx].stages[0].status = "In Progress";
      }
    }

    setMilestonesList(updated);
    setPaymentModalOpen(false);

    setNotification({
      type: "success",
      message: `Payment of ₹${amtNum.toLocaleString()} recorded & verified instantly!`,
    });
    setTimeout(() => setNotification(null), 4000);

    // Background sync to server
    try {
      await apiClient.post(
        `/admin/candidates/applications/${application.applicationId || application.id}/milestones/${currentM.id}/record-payment`,
        {
          amount: amtNum,
          paymentMode: payMode,
          referenceNumber: refNum,
          remarks: payRemarks,
        }
      );
      autoSyncMilestones(updated);
    } catch (err) {
      console.warn("Background payment sync issue:", err);
    } finally {
      setRecordingPayment(false);
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
        message: "Candidate milestone workflow saved successfully!",
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
      setTimeout(() => setNotification(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-2xs max-w-4xl mx-auto my-6">
        <div className="w-7 h-7 border-2 border-[#163868] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-700">Loading candidate milestones...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-6 text-center bg-white rounded-xl border border-slate-200 max-w-lg mx-auto my-6">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-xs font-bold text-slate-900">Application Not Found</h3>
        <p className="text-[11px] text-slate-500 mt-1">Unable to locate candidate application details.</p>
        <button
          onClick={() => navigate("/admin/candidates/selected")}
          className="mt-3 px-3.5 py-1.5 bg-[#163868] text-white rounded-lg text-xs font-bold hover:bg-[#1e4a82] cursor-pointer"
        >
          Return to Selected Candidates
        </button>
      </div>
    );
  }

  const currentM = milestonesList[activeMilestoneIdx] || milestonesList[0];
  const totalPaid = milestonesList.reduce((sum, m) => {
    if (m.status === "Paid" || m.paymentStatus === "Approved" || m.status === "Completed") {
      return sum + (Number(m.amount || m.paymentAmount) || 0);
    }
    return sum;
  }, 0);

  const isCurrentCompleted =
    currentM?.status === "Completed" ||
    (Array.isArray(currentM?.stages) &&
      currentM.stages.length > 0 &&
      currentM.stages.every((s) => s.status === "Completed"));

  const isCurrentPaid = currentM?.status === "Paid" || currentM?.paymentStatus === "Approved" || isCurrentCompleted;

  return (
    <div className="space-y-3 max-w-6xl w-full mx-auto font-sans antialiased text-slate-800 pb-10 text-xs">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between shadow-xs transition-all ${
            notification.type === "success"
              ? "bg-blue-50 text-[#163868] border-blue-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? <CheckCircle2 size={15} className="text-[#163868]" /> : <AlertCircle size={15} />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-0.5 hover:opacity-75 cursor-pointer">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate("/admin/candidates/selected")}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition shrink-0"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#163868]" />
              <span>Candidate Milestone & Process Workflow</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Configure deployment stages, verify milestone fees, upload candidate & vendor clearance documents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saveLoading}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs flex items-center gap-1.5 transition cursor-pointer ${
              saveSuccess ? "bg-[#163868]" : "bg-[#163868] hover:bg-[#1e4a82]"
            } disabled:opacity-50`}
          >
            {saveLoading ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 size={13} />
            ) : (
              <Save size={13} />
            )}
            <span>{saveSuccess ? "Saved Successfully!" : "Save Plan"}</span>
          </button>
        </div>
      </div>

      {/* Candidate Profile & Project Card - Navy Blue Theme (No Green) */}
      <div className="bg-gradient-to-r from-[#0f274a] via-[#163868] to-[#1e4a82] rounded-xl p-3 sm:p-3.5 text-white shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 text-cyan-300 font-bold text-sm flex items-center justify-center shrink-0 shadow-inner">
              {(application.candidateName || "C").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold tracking-tight text-white">{application.candidateName}</h2>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-cyan-200 border border-white/20 text-[10px] font-bold">
                  {application.status || "Selected"}
                </span>
                <span className="text-[10px] font-mono text-cyan-300 bg-white/10 px-1.5 py-0.5 rounded">
                  ID: {application.candidateId}
                </span>
              </div>
              <div className="text-[11px] text-slate-200 mt-0.5 flex items-center gap-2.5 flex-wrap">
                <span>{application.candidateEmail}</span>
                {application.candidatePhone && <span>• {application.candidatePhone}</span>}
                <span>• Role: <strong className="text-white">{application.position || "Specialist"}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-lg border border-white/15 text-xs">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-300 block">Project & Client</span>
              <span className="font-bold text-white block text-xs">{application.projectName}</span>
              <span className="text-[10px] text-cyan-300">{application.destinationCountry || "Overseas"}</span>
            </div>
            <div className="border-l border-white/20 pl-3">
              <span className="text-[9px] uppercase font-bold text-slate-300 block">Fees Collected</span>
              <span className="font-bold text-cyan-300 text-xs sm:text-sm">
                ₹{totalPaid.toLocaleString()} / ₹{Number(totalAmount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Amount & Milestone Tabs - Compact Navy Palette */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3 sm:p-3.5 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Total Placement Fee Configuration</h3>
            <p className="text-[10px] text-slate-500 font-medium">Split overall candidate package into milestone payments.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Total Amount:</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTotalAmount(val);
                  autoSyncMilestones(milestonesList, val);
                }}
                className="w-28 pl-6 pr-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#163868]"
              />
            </div>
          </div>
        </div>

        {/* Milestone Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {milestonesList.map((m, idx) => {
            const isSelected = activeMilestoneIdx === idx;
            const isDone = m.status === "Completed";
            const isPaid = m.status === "Paid" || m.paymentStatus === "Approved" || isDone;
            const isLocked = m.status === "Locked";
            const amt = Number(m.amount || m.paymentAmount || 15000);

            return (
              <button
                key={m.id || idx}
                onClick={() => setActiveMilestoneIdx(idx)}
                className={`p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? "border-[#163868] bg-blue-50/60 shadow-2xs ring-1 ring-[#163868]/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Phase {idx + 1}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold ${
                      isDone
                        ? "bg-blue-100 text-[#163868] border border-blue-200"
                        : isPaid
                        ? "bg-blue-50 text-[#163868] border border-blue-200"
                        : isLocked
                        ? "bg-slate-100 text-slate-600"
                        : "bg-[#163868] text-white"
                    }`}
                  >
                    {isDone ? "✓ Completed" : isPaid ? "Paid & Verified" : isLocked ? "Locked" : "In Progress"}
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900 truncate">{m.name}</div>
                <div className="text-[11px] font-bold text-slate-600 mt-0.5">₹{amt.toLocaleString()}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Milestone Detail Card */}
      {currentM && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
          {/* Milestone Sub-Header - Compact */}
          <div className="p-3 sm:p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 max-w-sm">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Milestone Name
              </label>
              <input
                type="text"
                value={currentM.name}
                onChange={(e) => {
                  const updated = [...milestonesList];
                  updated[activeMilestoneIdx].name = e.target.value;
                  setMilestonesList(updated);
                  autoSyncMilestones(updated);
                }}
                className="w-full px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:border-[#163868]"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Milestone Fee
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={currentM.amount || currentM.paymentAmount || 15000}
                    onChange={(e) => {
                      const updated = [...milestonesList];
                      const val = Number(e.target.value);
                      updated[activeMilestoneIdx].amount = val;
                      updated[activeMilestoneIdx].paymentAmount = val;
                      setMilestonesList(updated);
                      autoSyncMilestones(updated);
                    }}
                    className="w-28 pl-6 pr-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:border-[#163868]"
                  />
                </div>
              </div>

              {/* Action Buttons: Record Payment (₹ Icon) & Unlock / Complete */}
              <div className="pt-3.5 flex items-center gap-2">
                {!isCurrentPaid ? (
                  <>
                    <button
                      onClick={() => handleOpenRecordPayment(activeMilestoneIdx)}
                      className="px-3 py-1.5 rounded-lg bg-[#163868] hover:bg-[#1e4a82] text-white font-bold text-xs shadow-2xs flex items-center gap-1 cursor-pointer transition"
                    >
                      <IndianRupee size={13} />
                      <span>Record Payment</span>
                    </button>
                    <button
                      onClick={() => handleUnlockMilestone(activeMilestoneIdx)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                      title="Direct Unlock Milestone"
                    >
                      <Unlock size={12} />
                      <span>Direct Unlock</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#163868] border border-blue-200 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-[#163868]" />
                      <span>{isCurrentCompleted ? "Milestone Completed" : "Paid & Verified"}</span>
                    </span>
                    <Link
                      to={`/invoice/${application.applicationId || application.id}/${currentM.id}`}
                      target="_blank"
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                    >
                      <FileText size={12} />
                      <span>Receipt</span>
                    </Link>
                  </>
                )}

                {/* Milestone Progression Action: Admin Completes Milestone & Advances to Next Process */}
                {!isCurrentCompleted && (
                  <button
                    onClick={() => handleCompleteMilestone(activeMilestoneIdx)}
                    className="px-3 py-1.5 rounded-lg bg-[#163868] hover:bg-[#1e4a82] text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-2xs"
                    title="Mark all stages completed and advance to the next process"
                  >
                    <Check size={13} />
                    <span>Complete & Next Phase</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Milestone Payment Audit Info - Navy/Blue */}
          {(currentM.paymentRef || currentM.paymentDate) && (
            <div className="px-3.5 py-2 bg-blue-50/50 border-b border-blue-100 text-xs flex items-center justify-between text-slate-700 flex-wrap gap-2">
              <div className="flex items-center gap-2 font-medium text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#163868]" />
                <span>
                  Ref ID: <strong className="font-mono text-slate-900">{currentM.paymentRef || "N/A"}</strong>
                </span>
                {currentM.paymentDate && <span>• Date: {currentM.paymentDate}</span>}
                {currentM.approvedBy && <span>• Verified By: {currentM.approvedBy}</span>}
              </div>
              {currentM.paymentRemark && (
                <span className="text-[10px] text-slate-500 italic">"{currentM.paymentRemark}"</span>
              )}
            </div>
          )}

          {/* SECTION: Milestone Clearance Documents for Candidate & Vendor Upload */}
          <div className="p-3 sm:p-3.5 bg-slate-50/70 border-b border-slate-200 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-[#163868] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#163868]" />
                  <span>Milestone Clearance Documents (Candidate & Vendor Access)</span>
                </h4>
                <p className="text-[10px] text-slate-500">
                  Upload signed offer letters, GAMCA medical fit reports, visa stamps, or flight tickets for Candidate and Vendor view.
                </p>
              </div>
              <div className="text-[10px] font-bold text-slate-500">
                Audience: <strong className="text-[#163868]">Candidate & Vendor</strong>
              </div>
            </div>

            {/* Document Upload Input Form */}
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Document Title (e.g. Visa Stamping Copy / Flight Ticket / Medical Fit)"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#163868]"
                />

                <select
                  value={docAudience}
                  onChange={(e) => setDocAudience(e.target.value)}
                  className="px-2 py-1 text-xs font-medium border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#163868]"
                >
                  <option value="both">👥 Both Candidate & Vendor</option>
                  <option value="candidate">👤 Candidate Only</option>
                  <option value="vendor">🏢 Vendor Only</option>
                </select>
              </div>

              <div>
                <label className="px-3 py-1 rounded-lg bg-[#163868] hover:bg-[#1e4a82] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs">
                  <Upload size={12} />
                  <span>{docUploading ? "Uploading..." : "Upload Document"}</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleUploadClearanceDocument}
                    disabled={docUploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Uploaded Documents List */}
            {Array.isArray(currentM.clearanceDocuments) && currentM.clearanceDocuments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {currentM.clearanceDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2 rounded-lg bg-white border border-blue-200 flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-6 h-6 rounded-md bg-blue-100 text-[#163868] flex items-center justify-center shrink-0">
                        <FileText size={13} />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-xs text-slate-900 truncate">{doc.title}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <span>{doc.size || "PDF"}</span>
                          <span>•</span>
                          <span className="font-semibold text-[#163868]">
                            {doc.targetAudience === "candidate"
                              ? "👤 Candidate"
                              : doc.targetAudience === "vendor"
                              ? "🏢 Vendor"
                              : "👥 Candidate & Vendor"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-[#163868] hover:text-[#1e4a82] hover:bg-blue-50 rounded"
                        title="View / Download"
                      >
                        <Eye size={13} />
                      </a>
                      <button
                        onClick={() => handleRemoveClearanceDocument(doc.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete document"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 italic py-1">
                No clearance documents uploaded for this milestone yet. Use the upload box above to release documents for Candidate and Vendor.
              </div>
            )}
          </div>

          {/* Stages Checklist - Compact */}
          <div className="p-3 sm:p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Processing Steps & Clearances Checklist
                </h4>
                <p className="text-[10px] text-slate-500">
                  Update step statuses, remarks, and upload verification files.
                </p>
              </div>

              <button
                onClick={() => handleAddStage(activeMilestoneIdx)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 flex items-center gap-1 cursor-pointer transition"
              >
                <Plus size={12} />
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {(currentM.stages || []).map((stage, sIdx) => {
                const isDone = stage.status === "Completed";
                const inProgress = stage.status === "In Progress";

                return (
                  <div
                    key={stage.id || sIdx}
                    className={`p-2 rounded-lg border transition-all ${
                      isDone
                        ? "bg-slate-50/80 border-slate-200"
                        : inProgress
                        ? "bg-blue-50/40 border-blue-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {sIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={stage.name}
                          onChange={(e) => handleStageNameChange(activeMilestoneIdx, sIdx, e.target.value)}
                          onBlur={() => autoSyncMilestones(milestonesList)}
                          className="flex-1 px-2 py-0.5 rounded border border-transparent hover:border-slate-300 focus:border-[#163868] bg-transparent font-bold text-xs text-slate-900 focus:bg-white transition"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Status Select - Navy Blue Theme (No Green) */}
                        <select
                          value={stage.status}
                          onChange={(e) => handleStageStatusChange(activeMilestoneIdx, sIdx, e.target.value)}
                          className={`px-2 py-1 rounded-md text-xs font-bold border focus:outline-none cursor-pointer ${
                            isDone
                              ? "bg-[#163868] text-white border-[#163868]"
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
                        <label className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1 cursor-pointer transition">
                          <Upload size={11} />
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
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Remove stage"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Remarks Input */}
                    <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={stage.remark || ""}
                          onChange={(e) => handleStageRemarkChange(activeMilestoneIdx, sIdx, e.target.value)}
                          onBlur={() => autoSyncMilestones(milestonesList)}
                          placeholder="Add internal remarks / verification notes..."
                          className="w-full px-2 py-0.5 text-xs text-slate-600 placeholder-slate-400 border border-transparent hover:border-slate-200 focus:border-slate-300 rounded focus:outline-none bg-slate-50/50 focus:bg-white"
                        />
                      </div>

                      {/* Uploaded Stage Proof Badge */}
                      {stage.document && (
                        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-900 px-2 py-0.5 rounded text-xs font-medium border border-blue-200 shrink-0">
                          <FileText size={11} className="text-[#163868]" />
                          <span className="truncate max-w-[130px] font-mono text-[10px]">
                            {stage.document.fileName || stage.document.name}
                          </span>
                          <a
                            href={stage.document.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-0.5 hover:text-[#163868]"
                            title="Preview file"
                          >
                            <Eye size={11} />
                          </a>
                          <button
                            onClick={() => handleRemoveStageDocument(activeMilestoneIdx, sIdx)}
                            className="p-0.5 text-slate-400 hover:text-rose-600"
                            title="Remove file"
                          >
                            <X size={11} />
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

      {/* Record Payment Modal - Navy Blue Theme with Indian Rupee Icon */}
      {paymentModalOpen && currentM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden">
            <div className="px-4 py-2.5 bg-[#163868] text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-cyan-300" />
                <h3 className="text-xs sm:text-sm font-bold">Record Milestone Payment</h3>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-300 hover:text-white p-0.5 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-3.5 space-y-2.5 text-xs text-slate-800">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900">{application.candidateName}</div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {currentM.name} • {application.projectName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold focus:outline-none focus:border-[#163868]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                    Payment Mode
                  </label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none focus:border-[#163868]"
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
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                  Transaction / UTR Reference ID
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UTR847291039"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs focus:outline-none focus:border-[#163868]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                  Admin Verification Notes
                </label>
                <input
                  type="text"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  placeholder="e.g. Payment verified in ICICI Corporate Account"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-medium text-xs focus:outline-none focus:border-[#163868]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitPayment}
                  disabled={recordingPayment}
                  className="px-4 py-1.5 rounded-lg bg-[#163868] hover:bg-[#1e4a82] text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {recordingPayment ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  <span>Approve & Verify (₹)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
