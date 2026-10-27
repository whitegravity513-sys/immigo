import React, { useState, useEffect } from "react";
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
  ExternalLink,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService.js";

export default function AdminCandidateMilestones() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appId = searchParams.get("appId");

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [totalAmount, setTotalAmount] = useState(40000);
  const [milestonesList, setMilestonesList] = useState([]);
  const [activeMilestoneIdx, setActiveMilestoneIdx] = useState(0);

  useEffect(() => {
    loadData();
  }, [appId]);

  const loadData = async () => {
    if (!appId) return;
    try {
      setLoading(true);
      const apps = await crmVendorService.getApplications();
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
          app.processMilestones?.length > 0
            ? app.processMilestones
            : projectMs.length > 0
            ? projectMs
            : app.paymentPlan?.milestones?.length > 0
            ? app.paymentPlan.milestones
            : [];

        const totalAmt =
          app.paymentPlan?.totalAmount ||
          rawMilestones.reduce(
            (sum, m) => sum + (Number(m.amount || m.paymentAmount) || 0),
            0
          ) ||
          40000;
        setTotalAmount(totalAmt);

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

            return {
              id: m.id || `m${mIdx}`,
              name: m.name || `Milestone ${mIdx + 1}`,
              amount: Number(m.amount || m.paymentAmount || 10000),
              status: isPaid ? "Paid" : m.status || (mIdx === 0 ? "Paid" : "Due"),
              paymentStatus: isPaid ? "Approved" : m.paymentStatus || (mIdx === 0 ? "Approved" : "Payment Required"),
              stages: rawStages.map((s, sIdx) => ({
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

          const firstIncompleteIdx = formatted.findIndex((m) => {
            const allStagesDone =
              (m.stages || []).length > 0 && m.stages.every((s) => s.status === "Completed");
            return !allStagesDone;
          });
          setActiveMilestoneIdx(firstIncompleteIdx !== -1 ? firstIncompleteIdx : 0);
        } else {
          const defaults = [
            {
              id: "m0",
              name: "Candidate Selection & Documentation",
              amount: 20000,
              status: "Paid",
              paymentStatus: "Approved",
              stages: [
                { id: "s0_1", name: "Candidate Selection", status: "In Progress", completedAt: null },
                { id: "s0_2", name: "Document Verification", status: "Pending", completedAt: null },
                { id: "s0_3", name: "Medical Check", status: "Pending", completedAt: null },
              ],
            },
          ];
          setMilestonesList(defaults);
          setActiveMilestoneIdx(0);
        }
      }
    } catch (err) {
      console.error("Failed to load candidate milestones:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageStatusChange = (mIdx, sIdx, newStatus) => {
    const updated = [...milestonesList];
    updated[mIdx].stages[sIdx].status = newStatus;
    if (newStatus === "Completed") {
      updated[mIdx].stages[sIdx].completedAt = new Date().toISOString().split("T")[0];
      updated[mIdx].stages[sIdx].completedBy = "Admin";

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
      status: "In Progress",
      remark: "",
      completedAt: null,
      completedBy: null,
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
    const updated = [...milestonesList];
    updated[mIdx].stages[sIdx].document = null;
    setMilestonesList(updated);
  };

  const handleUnlockMilestone = (mIdx) => {
    const updated = [...milestonesList];
    updated[mIdx].status = "Paid";
    updated[mIdx].paymentStatus = "Approved";
    if (updated[mIdx].stages?.length > 0) {
      updated[mIdx].stages = updated[mIdx].stages.map((stg, sIndex) => {
        if (stg.status === "Completed") return stg;
        return {
          ...stg,
          status: sIndex === 0 ? "In Progress" : "Pending",
        };
      });
    }
    setMilestonesList(updated);
    setActiveMilestoneIdx(mIdx);
  };

  const handleSave = async () => {
    if (!application) return;
    setSaveLoading(true);
    try {
      const targetAppId = application.id || application.applicationId || application._id || appId;
      await crmVendorService.overrideMilestones(targetAppId, totalAmount, milestonesList);
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
    currentMilestone?.status === "Paid" || currentMilestone?.paymentStatus === "Approved";
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
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5 pl-0.5">
          Project Milestone Sequence
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {milestonesList.map((m, mIdx) => {
            const isPaid = m.status === "Paid" || m.paymentStatus === "Approved";
            const stages = m.stages || [];
            const allDone = stages.length > 0 && stages.every((s) => s.status === "Completed");
            const isSelectedTab = mIdx === activeMilestoneIdx;
            const doneCount = stages.filter((s) => s.status === "Completed").length;

            return (
              <button
                key={m.id || mIdx}
                type="button"
                onClick={() => setActiveMilestoneIdx(mIdx)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative shadow-2xs ${
                  isSelectedTab
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
                    className={`uppercase tracking-wider ${
                      isSelectedTab ? "text-blue-300" : "text-blue-900 font-extrabold"
                    }`}
                  >
                    Milestone {mIdx + 1}
                  </span>
                  {allDone ? (
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isSelectedTab ? "bg-blue-900/90 text-cyan-300 border border-blue-700" : "bg-blue-100 text-blue-950 border border-blue-200"
                    }`}>
                      <CheckCircle2 size={11} className={isSelectedTab ? "text-cyan-400" : "text-blue-700"} /> Done
                    </span>
                  ) : isPaid ? (
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      isSelectedTab ? "bg-blue-900/90 text-cyan-300 border border-blue-700" : "bg-blue-100/70 text-blue-900 border border-blue-200/80"
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
                  className={`font-bold text-xs truncate ${
                    isSelectedTab ? "text-white" : "text-slate-900"
                  }`}
                  title={m.name}
                >
                  {m.name}
                </h4>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/40 text-[10px]">
                  <span
                    className={`font-semibold ${
                      isSelectedTab ? "text-slate-200" : "text-blue-950 font-bold"
                    }`}
                  >
                    ₹{Number(m.amount).toLocaleString()}
                  </span>
                  <span
                    className={`font-semibold ${
                      isSelectedTab ? "text-blue-300" : "text-blue-700"
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
                <span className="text-[11px] font-bold text-slate-200">
                  ₹{Number(currentMilestone.amount).toLocaleString()}
                </span>
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
                    <span>Awaiting Payment</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUnlockMilestone(activeMilestoneIdx)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition cursor-pointer shadow-2xs flex items-center gap-1"
                    title="Unlock milestone stages immediately for vendor"
                  >
                    <Unlock size={11} />
                    <span>Unlock & Mark Paid</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Processing Steps List */}
          <div className="p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers size={14} className="text-slate-700" />
                <span>Processing Steps ({currentStagesDoneCount}/{currentStages.length} Done)</span>
              </span>
              <button
                type="button"
                onClick={() => handleAddStage(activeMilestoneIdx)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-300 transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Plus size={12} />
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-2">
              {currentStages.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-500 font-medium">
                  No steps defined for this milestone. Click "+ Add Step" above.
                </div>
              ) : (
                currentStages.map((stage, sIdx) => {
                  const isDone = stage.status === "Completed";
                  const isInProgress = stage.status === "In Progress";
                  const isPending = stage.status === "Pending" || !stage.status;

                  return (
                    <div
                      key={stage.id || sIdx}
                      className={`p-2.5 sm:p-3 rounded-lg border transition-all ${
                        isDone
                          ? "bg-emerald-50/30 border-emerald-200"
                          : isInProgress
                          ? "bg-blue-50/30 border-blue-300 shadow-2xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        {/* Step Number & Name Input */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {sIdx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={stage.name}
                              onChange={(e) =>
                                handleStageNameChange(activeMilestoneIdx, sIdx, e.target.value)
                              }
                              className="w-full text-xs font-semibold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 rounded px-1.5 py-0.5 border border-transparent hover:border-slate-200 transition"
                              placeholder="Step title..."
                            />
                            {stage.completedAt && isDone && (
                              <span className="text-[10px] text-emerald-700 font-medium block pl-1.5 mt-0.5">
                                ✓ Completed on {stage.completedAt} by {stage.completedBy || "Admin"}
                              </span>
                            )}
                            {stage.document && (
                              <div className="flex items-center gap-1 text-[10px] text-blue-700 font-semibold pl-1.5 mt-0.5">
                                <FileText size={11} />
                                <span className="truncate">{stage.document.fileName || stage.document.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStageDocument(activeMilestoneIdx, sIdx)}
                                  className="text-rose-500 hover:text-rose-700 ml-1 cursor-pointer font-bold"
                                  title="Remove attached document"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Pills & Document Actions */}
                        <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
                          {/* 3-State Pill Selector */}
                          <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
                            <button
                              type="button"
                              onClick={() => handleStageStatusChange(activeMilestoneIdx, sIdx, "Pending")}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                                isPending
                                  ? "bg-white text-slate-800 shadow-2xs border border-slate-200/80"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Pending
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStageStatusChange(activeMilestoneIdx, sIdx, "In Progress")}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-0.5 ${
                                isInProgress
                                  ? "bg-slate-900 text-white shadow-2xs"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              <Clock size={10} />
                              <span>In Progress</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStageStatusChange(activeMilestoneIdx, sIdx, "Completed")}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer flex items-center gap-0.5 ${
                                isDone
                                  ? "bg-emerald-600 text-white shadow-2xs"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              <Check size={11} />
                              <span>Done</span>
                            </button>
                          </div>

                          {/* Upload Document Button */}
                          <label
                            className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 cursor-pointer transition shadow-2xs"
                            title="Attach proof or documentation"
                          >
                            <Upload size={12} />
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => handleFileUploadForStage(activeMilestoneIdx, sIdx, e)}
                            />
                          </label>

                          {/* Delete Step */}
                          <button
                            type="button"
                            onClick={() => handleRemoveStage(activeMilestoneIdx, sIdx)}
                            className="p-1 rounded-md border border-transparent hover:border-rose-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
              disabled={saveLoading}
              onClick={handleSave}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none ${
                saveSuccess
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
      </div>
    </div>
  );
}
