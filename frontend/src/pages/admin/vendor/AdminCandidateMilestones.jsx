import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Layers,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Save,
  Upload,
  FileText,
  ShieldCheck,
  Check,
  Receipt,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService.js";
import refundService, { isAppRefundLocked, getAppRefundStatus } from "../../../services/refundService.js";
import CandidateActivityTimeline from "../../../components/common/candidate/CandidateActivityTimeline.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function AdminCandidateMilestones() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appId = searchParams.get("appId");
  const { user, isSuperAdmin: authIsSuperAdmin, isVendorHR } = useAuth();
  const actorLabel = isVendorHR ? "Vendor HR" : authIsSuperAdmin ? "Super Admin" : (user?.name || "Admin");

  const [application, setApplication] = useState(null);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [milestonesList, setMilestonesList] = useState([]);
  const [activeMilestoneIdx, setActiveMilestoneIdx] = useState(0);
  const [milestonesCustomized, setMilestonesCustomized] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [rejectInputIdx, setRejectInputIdx] = useState(null);
  const [rejectPaymentNote, setRejectPaymentNote] = useState("");

  const loadData = useCallback(async () => {
    if (!appId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      await crmVendorService.getAvailableProjects().catch(() => []);
      const [apps, rData] = await Promise.all([
        crmVendorService.getApplications(),
        refundService.getAllRefunds().catch(() => []),
      ]);
      setRefunds(rData || []);
      const app = apps.find(
        (a) =>
          String(a.id) === String(appId) ||
          String(a.applicationId) === String(appId) ||
          String(a._id) === String(appId)
      );
      if (app) {
        setApplication(app);

        const projectMs = crmVendorService.syncAppMilestonesWithProject
          ? crmVendorService.syncAppMilestonesWithProject(app)
          : [];

        const rawMilestones =
          !app.milestonesOverridden && projectMs.length > 0
            ? projectMs
            : app.processMilestones?.length > 0
              ? app.processMilestones
              : projectMs.length > 0
                ? projectMs
                : app.paymentPlan?.milestones?.length > 0
                  ? app.paymentPlan.milestones
                  : [];

        if (rawMilestones.length > 0) {
          const formatted = rawMilestones.map((m, mIdx) => {
            const isPaid = m.status === "Paid" || m.paymentStatus === "Approved";
            const rawStages =
              m.stages?.length > 0
                ? m.stages
                : [
                  { id: `s${mIdx}_1`, name: "Skill & Credentials Clearance", status: "Pending" },
                  { id: `s${mIdx}_2`, name: "Processing Step", status: "Pending" },
                ];
            const mAmt = Number(m.paymentAmount ?? m.amount ?? 0);

            return {
              ...m,
              id: m.id || `m${mIdx}`,
              name: m.name || `Milestone ${mIdx + 1}`,
              amount: mAmt,
              paymentAmount: mAmt,
              status: isPaid ? "Paid" : m.status || "Due",
              paymentStatus: isPaid ? "Approved" : m.paymentStatus || "Payment Required",
              paymentRef: m.paymentRef || "",
              paymentDate: m.paymentDate || m.paidDate || null,
              paymentRemark: m.paymentRemark || "",
              approvedBy: m.approvedBy || null,
              paymentMode: m.paymentMode || m.paymentMethod || "",
              receiptNumber: m.receiptNumber || null,
              clearanceDocuments: Array.isArray(m.clearanceDocuments) ? m.clearanceDocuments : [],
              stages: rawStages.map((s, sIdx) => ({
                ...s,
                id: s.id || `s${mIdx}_${sIdx}`,
                name: s.name || `Step ${sIdx + 1}`,
                status: s.status || "Pending",
                remark: s.remark || "",
                completedAt: s.completedAt || null,
                completedBy: s.completedBy || null,
                document: s.document || null,
              })),
            };
          });

          setMilestonesList(formatted);
          setMilestonesCustomized(Boolean(app.milestonesOverridden));

          const firstIncompleteIdx = formatted.findIndex((m) => {
            const allStagesDone =
              (m.stages || []).length > 0 && m.stages.every((s) => s.status === "Completed");
            return !allStagesDone;
          });
          setActiveMilestoneIdx(firstIncompleteIdx !== -1 ? firstIncompleteIdx : 0);
        } else {
          setMilestonesList([]);
          setActiveMilestoneIdx(0);
        }
      }
    } catch (err) {
      console.error("Failed to load candidate milestones:", err);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    const handleRefresh = () => loadData();
    window.addEventListener("immigo:application-update", handleRefresh);
    window.addEventListener("immigo:refund-update", handleRefresh);
    window.addEventListener("immigo:vendor-hr-refresh", handleRefresh);
    window.addEventListener("immigo:dashboard-update", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("immigo:application-update", handleRefresh);
      window.removeEventListener("immigo:refund-update", handleRefresh);
      window.removeEventListener("immigo:vendor-hr-refresh", handleRefresh);
      window.removeEventListener("immigo:dashboard-update", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
  }, [loadData]);

  const handleStageStatusChange = (mIdx, sIdx, newStatus) => {
    if (isAppRefundLocked(application, refunds)) {
      alert(`Processing is frozen due to an active refund claim (${getAppRefundStatus(application, refunds) || "Pending Admin Approval"}).`);
      return;
    }
    const updated = [...milestonesList];
    updated[mIdx].stages[sIdx].status = newStatus;
    if (newStatus === "Completed") {
      updated[mIdx].stages[sIdx].completedAt = new Date().toISOString().split("T")[0];
      updated[mIdx].stages[sIdx].completedBy = actorLabel;

      if (sIdx < updated[mIdx].stages.length - 1) {
        const nextStage = updated[mIdx].stages[sIdx + 1];
        if (nextStage.status === "Locked" || nextStage.status === "Pending") {
          nextStage.status = "In Progress";
        }
      }
    } else {
      updated[mIdx].stages[sIdx].completedAt = null;
      updated[mIdx].stages[sIdx].completedBy = null;
    }

    const allCurrentStagesDone = updated[mIdx].stages.every((s) => s.status === "Completed");
    if (allCurrentStagesDone) {
      updated[mIdx].status = "Paid";
      updated[mIdx].paymentStatus = "Approved";
      if (mIdx < updated.length - 1) {
        if (updated[mIdx + 1].status !== "Paid") {
          updated[mIdx + 1].status = "Active";
          if (updated[mIdx + 1].stages?.length > 0) {
            updated[mIdx + 1].stages = updated[mIdx + 1].stages.map((stg, sIndex) => ({
              ...stg,
              status: sIndex === 0 ? "In Progress" : (stg.status === "Completed" ? "Completed" : "Pending"),
            }));
          }
        }
      }
    }

    setMilestonesList(updated);
  };

  const handleStageNameChange = (mIdx, sIdx, newName) => {
    if (isAppRefundLocked(application, refunds)) return;
    const updated = [...milestonesList];
    updated[mIdx].stages[sIdx].name = newName;
    setMilestonesList(updated);
    setMilestonesCustomized(true);
  };

  const handleAddStage = (mIdx) => {
    if (isAppRefundLocked(application, refunds)) return;
    const updated = [...milestonesList];
    if (!Array.isArray(updated[mIdx].stages)) {
      updated[mIdx].stages = [];
    }
    const nextIdx = updated[mIdx].stages.length + 1;
    updated[mIdx].stages.push({
      id: `s${mIdx}_${Date.now()}`,
      name: `Step ${nextIdx}: Processing Task`,
      status: "In Progress",
      remark: "",
      completedAt: null,
      completedBy: null,
      document: null,
    });
    setMilestonesList(updated);
    setMilestonesCustomized(true);
  };

  const handleRemoveStage = (mIdx, sIdx) => {
    if (isAppRefundLocked(application, refunds)) return;
    const updated = [...milestonesList];
    updated[mIdx].stages = updated[mIdx].stages.filter((_, i) => i !== sIdx);
    setMilestonesList(updated);
    setMilestonesCustomized(true);
  };

  const handleMilestoneAmountChange = (mIdx, val) => {
    if (isAppRefundLocked(application, refunds)) return;
    const numVal = Math.max(0, Number(val) || 0);
    const updated = [...milestonesList];
    updated[mIdx] = {
      ...updated[mIdx],
      amount: numVal,
      paymentAmount: numVal,
    };
    setMilestonesList(updated);
    setMilestonesCustomized(true);
  };

  const handleFileUploadForStage = (mIdx, sIdx, e) => {
    if (isAppRefundLocked(application, refunds)) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
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

      if (application?.candidateId) {
        try {
          await crmVendorService.addCandidateDocument(application.candidateId, {
            name: docName,
            fileName: file.name,
            fileUrl: fileUrl,
            size: sizeStr,
            stageId: updated[mIdx].stages[sIdx].id,
            milestoneName: updated[mIdx].name,
          });
        } catch (err) {
          console.error("Failed to add document to candidate profile:", err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveStageDocument = (mIdx, sIdx) => {
    if (isAppRefundLocked(application, refunds)) return;
    const updated = [...milestonesList];
    updated[mIdx].stages[sIdx].document = null;
    setMilestonesList(updated);
  };

  const handleApproveCurrentPayment = async (mIdx) => {
    if (isAppRefundLocked(application, refunds)) {
      alert(`Payment processing is frozen due to an active refund claim (${getAppRefundStatus(application, refunds) || "Pending Admin Approval"}).`);
      return;
    }
    const targetM = milestonesList[mIdx];
    if (!application || !targetM) return;
    setPaymentBusy(true);
    try {
      const targetAppId = application.id || application.applicationId || application._id || appId;
      await crmVendorService.approveMilestonePayment(
        targetAppId,
        targetM.id,
        actorLabel,
        "Payment verified and approved",
        { ...application, processMilestones: milestonesList }
      );
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to approve payment");
    } finally {
      setPaymentBusy(false);
    }
  };

  const handleRejectCurrentPayment = async (mIdx) => {
    if (isAppRefundLocked(application, refunds)) {
      alert(`Payment processing is frozen due to an active refund claim (${getAppRefundStatus(application, refunds) || "Pending Admin Approval"}).`);
      return;
    }
    const targetM = milestonesList[mIdx];
    if (!application || !targetM) return;
    setPaymentBusy(true);
    try {
      const targetAppId = application.id || application.applicationId || application._id || appId;
      await crmVendorService.rejectMilestonePayment(
        targetAppId,
        targetM.id,
        rejectPaymentNote.trim() || "Payment receipt rejected by reviewer"
      );
      setRejectInputIdx(null);
      setRejectPaymentNote("");
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to reject payment receipt");
    } finally {
      setPaymentBusy(false);
    }
  };

  const handleUnlockMilestone = (mIdx) => {
    handleApproveCurrentPayment(mIdx);
  };

  const handleSave = async () => {
    if (!application) return;
    if (isAppRefundLocked(application, refunds)) {
      alert(`Processing is frozen due to an active refund claim (${getAppRefundStatus(application, refunds) || "Pending Admin Approval"}).`);
      return;
    }
    setSaveLoading(true);
    try {
      const targetAppId = application.id || application.applicationId || application._id || appId;
      const computedTotal = milestonesList.reduce(
        (sum, m) => sum + Number(m.amount ?? m.paymentAmount ?? 0),
        0
      );
      const formattedMilestones = milestonesList.map((m) => {
        const amt = Number(m.amount ?? m.paymentAmount ?? 0);
        return {
          ...m,
          amount: amt,
          paymentAmount: amt,
        };
      });
      await crmVendorService.overrideMilestones(
        targetAppId,
        computedTotal,
        formattedMilestones,
        application,
        { preserveProjectSync: !milestonesCustomized && !application.milestonesOverridden }
      );
      setSaveSuccess(true);
      setTimeout(() => {
        navigate(-1);
      }, 600);
    } catch (err) {
      alert(err.message || "Failed to update stages");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center max-w-4xl mx-auto font-sans">
        <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2.5"></div>
        <p className="text-xs font-semibold text-slate-600">Loading candidate milestones...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-10 text-center max-w-4xl mx-auto font-sans">
        <p className="text-xs font-bold text-slate-800">Application record not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-3 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-800 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentMilestone = milestonesList[activeMilestoneIdx] || milestonesList[0];
  const isCurrentPaid =
    currentMilestone?.status === "Paid" ||
    currentMilestone?.status === "Completed" ||
    currentMilestone?.paymentStatus === "Approved";
  const currentAmt = Number(currentMilestone?.amount ?? currentMilestone?.paymentAmount ?? 0);
  const isCurrentSubmitted =
    currentMilestone?.paymentStatus === "Submitted" ||
    currentMilestone?.paymentStatus === "Pending Verification" ||
    currentMilestone?.status === "Submitted";
  const isCurrentRejected = currentMilestone?.paymentStatus === "Rejected";
  const refundLocked = isAppRefundLocked(application, refunds);
  const refundStatus = getAppRefundStatus(application, refunds);
  const canUpdateCurrentStages = !refundLocked && (isCurrentPaid || currentAmt === 0);
  const currentStages = currentMilestone?.stages || [];
  const currentStagesDoneCount = currentStages.filter((s) => s.status === "Completed").length;

  const totalAllStages = milestonesList.reduce((acc, m) => acc + (m.stages?.length || 0), 0);
  const totalAllDoneStages = milestonesList.reduce(
    (acc, m) => acc + (m.stages || []).filter((s) => s.status === "Completed").length,
    0
  );
  const overallPercentage =
    totalAllStages > 0 ? Math.round((totalAllDoneStages / totalAllStages) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-4 font-sans antialiased text-slate-800 pb-20 px-2 sm:px-4">
      {/* Top Header: Back Button & Candidate Title */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft size={13} className="text-slate-800" />
          <span>Back</span>
        </button>
        <div className="text-[11px] font-mono text-slate-500 font-medium">
          App ID: <span className="font-bold text-slate-800">{application.id || appId}</span>
        </div>
      </div>

      {/* Candidate Dossier Banner (Simple, Compact Navy Blue) */}
      <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-950 border border-blue-800 text-blue-200 font-bold text-sm flex items-center justify-center shrink-0">
              {application.candidateName?.slice(0, 2).toUpperCase() || "CN"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {application.candidateName}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {application.status || "Selected"}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                Project: <strong className="text-white">{application.projectName || "Standard Project"}</strong>
                {application.clientName && <> • Client: {application.clientName}</>}
                {" • "}Role: <span className="text-blue-200 font-semibold">{application.position || "Staff"}</span>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Partner Agency
            </span>
            <span className="text-xs font-bold text-slate-200 block truncate">
              {application.vendorName || application.vendorId || "Direct Agency"}
            </span>
          </div>
        </div>

        {/* Compact Progress Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-300 mb-1">
            <span>Overall Mobilization Progress</span>
            <span className="font-bold text-white">
              {totalAllDoneStages} of {totalAllStages} Steps ({overallPercentage}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${overallPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Project Milestones Stepper / Sequence (Clean, Simple, Compact) */}
      {refundLocked && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={17} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-rose-950">
                Payment &amp; Processing Frozen — Refund Claim ({refundStatus || "Pending Admin Approval"})
              </div>
              <p className="text-[11px] text-rose-800">
                {refundStatus === "Pending Admin Approval"
                  ? "All milestone fee edits, payment approvals, and stage progression are paused until Admin reviews and responds to this refund claim."
                  : "Admin has processed this refund claim. Processing on this project remains closed; proceed with candidate reassignment from the Refund Claims page."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/vendor/refunds")}
            className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 font-bold text-[11px] shrink-0 cursor-pointer transition"
          >
            Open Refund Claims →
          </button>
        </div>
      )}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5 pl-0.5">
          Project Milestone Sequence
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {milestonesList.map((m, mIdx) => {
            const isPaid =
              m.status === "Paid" ||
              m.status === "Completed" ||
              m.paymentStatus === "Approved";
            const stages = m.stages || [];
            const allDone = stages.length > 0 && stages.every((s) => s.status === "Completed");
            const isSelectedTab = mIdx === activeMilestoneIdx;
            const doneCount = stages.filter((s) => s.status === "Completed").length;

            return (
              <button
                key={m.id || mIdx}
                type="button"
                onClick={() => setActiveMilestoneIdx(mIdx)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative shadow-2xs ${isSelectedTab
                  ? "bg-slate-900 border-blue-600 text-white shadow-xs ring-1 ring-blue-500"
                  : allDone
                    ? "bg-gradient-to-br from-blue-50/90 via-slate-50/80 to-blue-50/70 border-blue-300 text-slate-900 hover:bg-blue-100/60 hover:border-blue-400 shadow-2xs"
                    : isPaid
                      ? "bg-blue-50/60 border-blue-200 text-slate-900 hover:bg-blue-100/40"
                      : "bg-slate-50/90 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold mb-0.5">
                  <span
                    className={`uppercase tracking-wider ${isSelectedTab ? "text-blue-300" : "text-blue-900 font-extrabold"
                      }`}
                  >
                    Milestone {mIdx + 1}
                  </span>
                  {allDone ? (
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${isSelectedTab ? "bg-blue-900/90 text-cyan-300 border border-blue-700" : "bg-blue-100 text-blue-950 border border-blue-200"
                      }`}>
                      <CheckCircle2 size={11} className={isSelectedTab ? "text-cyan-400" : "text-blue-700"} /> Done
                    </span>
                  ) : isPaid ? (
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${isSelectedTab ? "bg-blue-900/90 text-cyan-300 border border-blue-700" : "bg-blue-100/70 text-blue-900 border border-blue-200/80"
                      }`}>
                      <CheckCircle2 size={11} className={isSelectedTab ? "text-cyan-400" : "text-blue-600"} /> Paid
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-0.5 font-normal">
                      <Lock size={10} /> Locked
                    </span>
                  )}
                </div>
                <h4
                  className={`font-bold text-xs truncate ${isSelectedTab ? "text-white" : "text-slate-900"
                    }`}
                  title={m.name}
                >
                  {m.name}
                </h4>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/40 text-[10px]">
                  <span
                    className={`font-semibold ${isSelectedTab ? "text-slate-200" : "text-blue-950 font-bold"
                      }`}
                  >
                    ₹{Number(m.amount).toLocaleString()}
                  </span>
                  <span
                    className={`font-semibold ${isSelectedTab ? "text-blue-300" : "text-blue-700"
                      }`}
                  >
                    {doneCount}/{stages.length} Steps
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Milestone Step Editor (Simple, Crisp Box) */}
      {currentMilestone && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header Bar of Active Milestone */}
          <div className="p-3 sm:p-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                  Step {activeMilestoneIdx + 1} of {milestonesList.length}
                </span>
                <span className="text-[10px] text-slate-400">•</span>
                <label className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-200">
                  <span>Fee: ₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    disabled={refundLocked}
                    value={currentMilestone.amount ?? currentMilestone.paymentAmount ?? 0}
                    onChange={(e) => handleMilestoneAmountChange(activeMilestoneIdx, e.target.value)}
                    className="w-24 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white text-[11px] font-bold focus:outline-none focus:border-blue-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </label>
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-white mt-0.5">
                {currentMilestone.name}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isCurrentPaid ? (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-950 text-cyan-300 border border-blue-800/80 flex items-center gap-1 shadow-2xs">
                  <CheckCircle2 size={12} className="text-cyan-400" />
                  <span>Paid & Unlocked</span>
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                    <Lock size={11} className="text-slate-400" />
                    <span>{refundLocked ? "Frozen (Refund Claim)" : "Awaiting Payment"}</span>
                  </span>
                  {!refundLocked && (
                    <button
                      type="button"
                      onClick={() => handleUnlockMilestone(activeMilestoneIdx)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition cursor-pointer shadow-2xs flex items-center gap-1"
                      title="Unlock milestone stages immediately for vendor"
                    >
                      <Unlock size={11} />
                      <span>Unlock & Mark Paid</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-slate-50/80 border-b border-slate-200 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <ShieldCheck size={14} className={isCurrentPaid ? "text-emerald-600" : isCurrentRejected ? "text-rose-600" : "text-amber-600"} />
                  <span className="text-xs font-bold text-slate-900">
                    1. Milestone Payment &amp; Receipt Verification
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isCurrentPaid
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : isCurrentSubmitted
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : isCurrentRejected
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                  >
                    {isCurrentPaid
                      ? "Paid & Approved"
                      : isCurrentSubmitted
                        ? "Vendor Paid — Pending Approval"
                        : isCurrentRejected
                          ? "Receipt Rejected"
                          : "Payment Required"}
                  </span>
                </div>
                {currentMilestone.paymentRef && (
                  <p className="text-[11px] font-mono text-slate-600">
                    Ref: {currentMilestone.paymentRef}
                  </p>
                )}
                {(currentMilestone.paymentDate || currentMilestone.approvedBy) && (
                  <p className="text-[10px] text-slate-500">
                    {currentMilestone.paymentDate ? `Date: ${currentMilestone.paymentDate}` : ""}
                    {currentMilestone.approvedBy ? ` • Verified by ${currentMilestone.approvedBy}` : ""}
                  </p>
                )}
                {currentMilestone.paymentRemark && (
                  <p className="text-[10px] text-slate-600 italic">
                    Note: {currentMilestone.paymentRemark}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {isCurrentPaid ? (
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        `/invoice/${application.id || application.applicationId || appId}/${currentMilestone.id}`,
                        "_blank"
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                  >
                    <Receipt size={13} />
                    <span>View Invoice / Receipt</span>
                  </button>
                ) : !refundLocked && isCurrentSubmitted ? (
                  <>
                    <button
                      type="button"
                      disabled={paymentBusy}
                      onClick={() => {
                        setRejectInputIdx(activeMilestoneIdx);
                        setRejectPaymentNote("");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                    >
                      <XCircle size={13} />
                      <span>Reject Receipt</span>
                    </button>
                    <button
                      type="button"
                      disabled={paymentBusy}
                      onClick={() => handleApproveCurrentPayment(activeMilestoneIdx)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} />
                      <span>{paymentBusy ? "Approving..." : "Approve Received Payment"}</span>
                    </button>
                  </>
                ) : !refundLocked ? (
                  <button
                    type="button"
                    disabled={paymentBusy}
                    onClick={() => handleApproveCurrentPayment(activeMilestoneIdx)}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs disabled:opacity-50"
                  >
                    <Unlock size={13} />
                    <span>{paymentBusy ? "Approving..." : "Approve / Mark Paid"}</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold">
                    Frozen (Refund Claim Active)
                  </span>
                )}
              </div>
            </div>

            {rejectInputIdx === activeMilestoneIdx && (
              <div className="p-2.5 rounded-lg bg-white border border-rose-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={rejectPaymentNote}
                  onChange={(e) => setRejectPaymentNote(e.target.value)}
                  placeholder="Reason for rejecting payment receipt..."
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-rose-500"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRejectInputIdx(null)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={paymentBusy}
                    onClick={() => handleRejectCurrentPayment(activeMilestoneIdx)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    Confirm Reject
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers size={14} className="text-slate-700" />
                <span>2. Processing Steps ({currentStagesDoneCount}/{currentStages.length} Done)</span>
              </span>
              <button
                type="button"
                disabled={!canUpdateCurrentStages}
                onClick={() => handleAddStage(activeMilestoneIdx)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-300 transition cursor-pointer flex items-center gap-1 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={12} />
                <span>Add Step</span>
              </button>
            </div>

            {!canUpdateCurrentStages && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <Lock size={14} className="text-amber-600 shrink-0" />
                <span>
                  Processing steps are locked until payment for this milestone is approved above.
                </span>
              </div>
            )}

            <div className="space-y-2">
              {currentStages.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-500 font-medium">
                  No steps defined for this milestone. Click &quot;+ Add Step&quot; above.
                </div>
              ) : (
                currentStages.map((stage, sIdx) => {
                  const isDone = stage.status === "Completed";
                  const isInProgress = stage.status === "In Progress";
                  const isPending = stage.status === "Pending" || !stage.status;

                  return (
                    <div
                      key={stage.id || sIdx}
                      className={`p-2.5 sm:p-3 rounded-lg border transition-all ${!canUpdateCurrentStages
                        ? "bg-slate-50/70 border-slate-200 opacity-75"
                        : isDone
                          ? "bg-emerald-50/30 border-emerald-200"
                          : isInProgress
                            ? "bg-blue-50/30 border-blue-300 shadow-2xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {sIdx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              disabled={refundLocked}
                              value={stage.name}
                              onChange={(e) =>
                                handleStageNameChange(activeMilestoneIdx, sIdx, e.target.value)
                              }
                              className="w-full text-xs font-semibold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 rounded px-1.5 py-0.5 border border-transparent hover:border-slate-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
                              placeholder="Step title..."
                            />
                            {stage.completedAt && isDone && (
                              <span className="text-[10px] text-emerald-700 font-medium block pl-1.5 mt-0.5">
                                ✓ Completed on {stage.completedAt} by {stage.completedBy || actorLabel}
                              </span>
                            )}
                            {stage.document && (
                              <div className="flex items-center gap-1 text-[10px] text-blue-700 font-semibold pl-1.5 mt-0.5">
                                <FileText size={11} />
                                <span className="truncate">{stage.document.fileName || stage.document.name}</span>
                                {!refundLocked && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStageDocument(activeMilestoneIdx, sIdx)}
                                    className="text-rose-500 hover:text-rose-700 ml-1 cursor-pointer font-bold"
                                    title="Remove attached document"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
                          <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
                            <button
                              type="button"
                              disabled={!canUpdateCurrentStages}
                              onClick={() => handleStageStatusChange(activeMilestoneIdx, sIdx, "Pending")}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isPending
                                ? "bg-white text-slate-800 shadow-2xs border border-slate-200/80"
                                : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                              Pending
                            </button>
                            <button
                              type="button"
                              disabled={!canUpdateCurrentStages}
                              onClick={() => handleStageStatusChange(activeMilestoneIdx, sIdx, "In Progress")}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${isInProgress
                                ? "bg-slate-900 text-white shadow-2xs"
                                : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                              <Clock size={10} />
                              <span>In Progress</span>
                            </button>
                            <button
                              type="button"
                              disabled={!canUpdateCurrentStages}
                              onClick={() => handleStageStatusChange(activeMilestoneIdx, sIdx, "Completed")}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${isDone
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                              <Check size={11} />
                              <span>Done</span>
                            </button>
                          </div>

                          <label
                            className={`p-1 rounded-md border border-slate-200 bg-white text-slate-600 transition shadow-2xs ${canUpdateCurrentStages ? "hover:bg-slate-50 hover:text-slate-900 cursor-pointer" : "opacity-50 cursor-not-allowed"
                              }`}
                            title="Attach proof or documentation"
                          >
                            <Upload size={12} />
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              disabled={!canUpdateCurrentStages}
                              className="hidden"
                              onChange={(e) => handleFileUploadForStage(activeMilestoneIdx, sIdx, e)}
                            />
                          </label>

                          <button
                            type="button"
                            disabled={refundLocked}
                            onClick={() => handleRemoveStage(activeMilestoneIdx, sIdx)}
                            className="p-1 rounded-md border border-transparent hover:border-rose-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Delete step"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Save Action Bar */}
      <div className="sticky bottom-0 -mx-2 sm:-mx-4 -mb-20 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 sm:px-6 py-2.5 sm:py-3 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
              Active Step:
            </span>
            <span className="text-xs font-bold text-slate-900 truncate">
              {currentMilestone?.name}
            </span>
            <span className="text-[10px] font-bold text-blue-900 bg-blue-100/90 border border-blue-200/80 px-2 py-0.5 rounded-full shrink-0">
              {currentStagesDoneCount}/{currentStages.length} Done
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs select-none"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saveLoading || refundLocked}
              onClick={handleSave}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${saveSuccess
                ? "bg-blue-600 text-white"
                : "bg-slate-900 hover:bg-blue-950 text-white"
                }`}
            >
              {saveLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={13} />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>Save Stage Updates</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 12 & 13: Permanent Candidate Activity History */}
        {application && (
          <div className="mt-4">
            <CandidateActivityTimeline
              candidateId={application.candidateId || application.id}
              candidateName={application.candidateName}
              vendorId={application.vendorId}
              vendorName={application.vendorName}
              onActivityAdded={loadData}
            />
          </div>
        )}
      </div>
    </div>
  );
}
