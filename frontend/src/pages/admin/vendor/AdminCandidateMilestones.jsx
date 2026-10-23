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
  ChevronRight,
  ShieldCheck,
  Check,
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
      const app = apps.find((a) => String(a.id) === String(appId));
      if (app) {
        setApplication(app);

        // First check if project has configured milestones or sync with project
        const projectMs = crmVendorService.syncAppMilestonesWithProject
          ? crmVendorService.syncAppMilestonesWithProject(app)
          : [];

        const rawMilestones =
          projectMs.length > 0
            ? projectMs
            : app.processMilestones?.length > 0
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
              name: "Milestone 1: Selection & Offer Acceptance",
              amount: 20000,
              status: "Paid",
              paymentStatus: "Approved",
              stages: [
                {
                  id: "s0_1",
                  name: "Trade Skill Verification & Acceptance",
                  status: "Completed",
                  completedAt: new Date().toISOString(),
                },
                { id: "s0_2", name: "Client Offer Letter Signed", status: "In Progress" },
              ],
            },
            {
              id: "m1",
              name: "Milestone 2: Visa Stamping & Flight Deployment",
              amount: 20000,
              status: "Due",
              paymentStatus: "Payment Required",
              stages: [
                { id: "s1_1", name: "GAMCA Medical Fitness Clearance", status: "Pending" },
                { id: "s1_2", name: "Visa Stamping & Official Work Permit", status: "Pending" },
                { id: "s1_3", name: "Flight Ticket Booking & On-Site Mobilization", status: "Pending" },
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
      updated[mIdx].stages[sIdx].completedAt = new Date().toISOString();
    } else {
      updated[mIdx].stages[sIdx].completedAt = null;
    }

    const allCurrentStagesDone = updated[mIdx].stages.every((s) => s.status === "Completed");
    if (allCurrentStagesDone) {
      updated[mIdx].status = "Paid";
      if (mIdx < updated.length - 1) {
        if (updated[mIdx + 1].status !== "Paid") {
          updated[mIdx + 1].status = "Due";
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
      if (updated[mIdx].stages[0].status === "Pending") {
        updated[mIdx].stages[0].status = "In Progress";
      }
    }
    setMilestonesList(updated);
    setActiveMilestoneIdx(mIdx);
  };

  const handleSave = async () => {
    if (!application) return;
    setSaveLoading(true);
    try {
      await crmVendorService.overrideMilestones(application.id, totalAmount, milestonesList);
      setSaveSuccess(true);
      setTimeout(() => {
        navigate(-1);
      }, 700);
    } catch (err) {
      alert(err.message || "Failed to update stages");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center max-w-4xl mx-auto font-sans">
        <div className="w-9 h-9 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-bold text-slate-600">Loading candidate project milestones...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-12 text-center max-w-4xl mx-auto font-sans">
        <p className="text-sm font-bold text-slate-800">Application record not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-900 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentMilestone = milestonesList[activeMilestoneIdx] || milestonesList[0];
  const isCurrentPaid = currentMilestone?.status === "Paid" || currentMilestone?.paymentStatus === "Approved";
  const currentStages = currentMilestone?.stages || [];
  const currentStagesDoneCount = currentStages.filter((s) => s.status === "Completed").length;
  const isAllCurrentStagesCompleted =
    currentStages.length > 0 && currentStagesDoneCount === currentStages.length;

  const totalAllStages = milestonesList.reduce((acc, m) => acc + (m.stages?.length || 0), 0);
  const totalAllDoneStages = milestonesList.reduce(
    (acc, m) => acc + (m.stages || []).filter((s) => s.status === "Completed").length,
    0
  );
  const overallPercentage =
    totalAllStages > 0 ? Math.round((totalAllDoneStages / totalAllStages) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-5 font-sans antialiased text-slate-800 pb-24">
      {/* Top Breadcrumb & Quick Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={14} className="text-blue-900" />
          <span>Back to Candidate List</span>
        </button>
        <span className="text-xs font-mono font-bold text-slate-400">
          Ref: {application.id} • Candidate ID: {application.candidateId || application.id}
        </span>
      </div>

      {/* Candidate Dossier & Overall Progress Bar (Navy Blue Header) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-inner">
                {application.candidateName?.slice(0, 2).toUpperCase() || "CN"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-extrabold text-white tracking-tight">
                    {application.candidateName}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/30 text-blue-100 border border-blue-400/30">
                    {application.status || "Selected"}
                  </span>
                </div>
                <p className="text-xs text-blue-100/90 font-medium mt-0.5">
                  Applied Project:{" "}
                  <strong className="text-white underline decoration-blue-400 decoration-1 underline-offset-2">
                    {application.projectName || "Standard Overseas Project"}
                  </strong>
                  {application.clientName && <> • Client: {application.clientName}</>}
                  {" • "}Trade: <span className="font-semibold">{application.position || "Staff"}</span>
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">
                Partner Agency
              </span>
              <span className="font-bold text-white text-xs block">
                {application.vendorName || application.vendorId}
              </span>
            </div>
          </div>

          {/* Overall Deployment Progress Bar */}
          <div className="mt-4 pt-3 border-t border-white/15">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-100 mb-1.5">
              <span>Overall Processing Completion</span>
              <span className="font-extrabold text-white">
                {totalAllDoneStages} of {totalAllStages} Steps Completed ({overallPercentage}%)
              </span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-blue-400 to-cyan-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Milestone Navigation Tabs (Responsive Grid) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/90">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2.5">
            Project Milestone Sequence:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
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
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative shadow-2xs ${
                    isSelectedTab
                      ? "border-blue-900 bg-blue-900 text-white shadow-sm ring-2 ring-blue-700/50"
                      : allDone
                      ? "bg-white border-blue-200 hover:border-blue-400 text-slate-800"
                      : isPaid
                      ? "bg-white border-slate-200 hover:border-blue-300 text-slate-800"
                      : "bg-slate-100/70 border-slate-200 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                    <span
                      className={`uppercase tracking-wider ${
                        isSelectedTab ? "text-blue-200" : "text-slate-400"
                      }`}
                    >
                      Milestone {mIdx + 1}
                    </span>
                    {allDone ? (
                      <span
                        className={`flex items-center gap-0.5 font-bold ${
                          isSelectedTab ? "text-cyan-200" : "text-blue-700"
                        }`}
                      >
                        <CheckCircle2 size={12} /> Done
                      </span>
                    ) : isPaid ? (
                      <span
                        className={`flex items-center gap-0.5 font-bold ${
                          isSelectedTab ? "text-blue-100" : "text-blue-800"
                        }`}
                      >
                        <Clock size={11} /> Active
                      </span>
                    ) : (
                      <span
                        className={`flex items-center gap-0.5 font-medium ${
                          isSelectedTab ? "text-blue-200" : "text-slate-400"
                        }`}
                      >
                        <Lock size={11} /> Locked
                      </span>
                    )}
                  </div>
                  <h4
                    className={`font-bold text-xs truncate ${
                      isSelectedTab ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {m.name}
                  </h4>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/50 text-[11px]">
                    <span
                      className={`font-bold ${
                        isSelectedTab ? "text-blue-100" : "text-slate-700"
                      }`}
                    >
                      ₹{Number(m.amount).toLocaleString()}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${
                        isSelectedTab ? "text-blue-200" : "text-slate-500"
                      }`}
                    >
                      {doneCount}/{stages.length} Done
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Milestone Card & Stage Editor (Clean Navy Blue UX) */}
      {currentMilestone && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header of Active Milestone */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                  isCurrentPaid
                    ? "bg-blue-800 text-white border-blue-700 shadow-xs"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                {isCurrentPaid ? <CheckCircle2 size={20} /> : <Lock size={18} />}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  Step {activeMilestoneIdx + 1} of {milestonesList.length} • Project Stage
                </span>
                <h2 className="text-base font-bold text-white">{currentMilestone.name}</h2>
                <p className="text-xs text-blue-100/80 mt-0.5">
                  Milestone Amount: <strong>₹{Number(currentMilestone.amount).toLocaleString()}</strong>
                  {" • "}Stage Progress:{" "}
                  <strong>
                    {currentStagesDoneCount} of {currentStages.length} Done
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {isCurrentPaid ? (
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-800/80 text-white border border-blue-600 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-cyan-300" />
                  <span>Paid & Unlocked</span>
                </span>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5">
                    <Lock size={12} className="text-slate-400" />
                    <span>Awaiting Payment (₹{Number(currentMilestone.amount).toLocaleString()})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUnlockMilestone(activeMilestoneIdx)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1"
                    title="Unlock milestone stages immediately"
                  >
                    <Unlock size={12} />
                    <span>Unlock Stages</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stages Content */}
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={16} className="text-blue-900" />
                  <span>Processing Steps for {currentMilestone.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update candidate completion status and upload step documentation/visas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleAddStage(activeMilestoneIdx)}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Plus size={13} />
                <span>Add Step</span>
              </button>
            </div>

            {/* Stages List */}
            <div className="space-y-3">
              {currentStages.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500 font-medium">
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
                      className={`p-4 rounded-xl border transition-all ${
                        isDone
                          ? "bg-blue-50/40 border-blue-200/90 shadow-2xs"
                          : isInProgress
                          ? "bg-white border-blue-400 shadow-xs ring-1 ring-blue-100"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Left: Step Number & Name */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-blue-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {sIdx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={stage.name}
                              onChange={(e) =>
                                handleStageNameChange(activeMilestoneIdx, sIdx, e.target.value)
                              }
                              className="w-full text-xs font-bold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 rounded px-1.5 py-0.5 border border-transparent hover:border-slate-200 transition"
                              placeholder="Stage task title..."
                            />
                            {stage.document && (
                              <div className="flex items-center gap-1.5 text-[11px] text-blue-700 font-semibold mt-1">
                                <FileText size={12} />
                                <span className="truncate">{stage.document.fileName || stage.document.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStageDocument(activeMilestoneIdx, sIdx)}
                                  className="text-rose-500 hover:text-rose-700 ml-1 cursor-pointer"
                                  title="Remove attached document"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Middle & Right: Status Pills & Action */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 3-State Simple Pill Selector */}
                          <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleStageStatusChange(activeMilestoneIdx, sIdx, "Pending")}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                isPending
                                  ? "bg-white text-slate-700 shadow-2xs"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Pending
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStageStatusChange(activeMilestoneIdx, sIdx, "In Progress")}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                                isInProgress
                                  ? "bg-blue-900 text-white shadow-2xs"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              <Clock size={11} />
                              <span>In Progress</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStageStatusChange(activeMilestoneIdx, sIdx, "Completed")}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                                isDone
                                  ? "bg-blue-700 text-white shadow-2xs"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              <Check size={12} />
                              <span>Done</span>
                            </button>
                          </div>

                          {/* Upload Proof */}
                          <label className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-900 transition cursor-pointer shadow-2xs flex items-center gap-1 text-[11px] font-semibold">
                            <Upload size={12} />
                            <span className="hidden sm:inline">Attach</span>
                            <input
                              type="file"
                              onChange={(e) => handleFileUploadForStage(activeMilestoneIdx, sIdx, e)}
                              className="hidden"
                              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                            />
                          </label>

                          {/* Delete Stage */}
                          <button
                            type="button"
                            onClick={() => handleRemoveStage(activeMilestoneIdx, sIdx)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer shadow-2xs"
                            title="Remove step"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Optional Notes Row */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={stage.remark || ""}
                          onChange={(e) => handleStageRemarkChange(activeMilestoneIdx, sIdx, e.target.value)}
                          placeholder="Optional step notes / tracking remarks..."
                          className="w-full text-xs text-slate-600 bg-transparent placeholder-slate-400 focus:outline-none focus:bg-white rounded px-1.5 py-0.5 border border-transparent focus:border-slate-200 transition font-medium"
                        />
                        {isDone && stage.completedAt && (
                          <span className="text-[10px] font-bold text-blue-800 shrink-0 whitespace-nowrap">
                            ✓ Completed on {new Date(stage.completedAt).toLocaleDateString("en-GB")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* All Stages in this Milestone Completed Notice */}
            {isAllCurrentStagesCompleted && (
              <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-blue-950 font-bold">
                  <CheckCircle2 size={18} className="text-blue-700 shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-blue-950">
                      Milestone {activeMilestoneIdx + 1} All Steps Completed!
                    </p>
                    <p className="text-[11px] text-blue-800">
                      {activeMilestoneIdx < milestonesList.length - 1
                        ? `Milestone ${activeMilestoneIdx + 2} is ready for processing.`
                        : "All candidate milestones and processing steps are 100% completed!"}
                    </p>
                  </div>
                </div>

                {activeMilestoneIdx < milestonesList.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveMilestoneIdx(activeMilestoneIdx + 1)}
                    className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <span>Proceed to Milestone {activeMilestoneIdx + 2}</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar (Navy Blue Theme, Easy UX) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-2xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-slate-500 font-medium">Active Milestone: </span>
            <strong className="text-blue-950 font-bold">
              {currentMilestone?.name} ({currentStagesDoneCount}/{currentStages.length} Done)
            </strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveLoading}
              className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 active:scale-95 disabled:bg-blue-400 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              {saveLoading ? (
                <span>Saving...</span>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 size={15} />
                  <span>Saved & Synced!</span>
                </>
              ) : (
                <>
                  <Save size={15} />
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
