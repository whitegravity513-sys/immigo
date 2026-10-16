import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";

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

        const rawMilestones =
          app.paymentPlan?.milestones?.length > 0
            ? app.paymentPlan.milestones
            : app.processMilestones?.length > 0
            ? app.processMilestones
            : [];

        const totalAmt =
          app.paymentPlan?.totalAmount ||
          rawMilestones.reduce((sum, m) => sum + (Number(m.amount || m.paymentAmount) || 0), 0) ||
          40000;
        setTotalAmount(totalAmt);

        if (rawMilestones.length > 0) {
          const formatted = rawMilestones.map((m, mIdx) => {
            const pm = (app.processMilestones || []).find((p) => p.id === m.id || p.name === m.name);
            const isPaid = m.status === "Paid" || pm?.paymentStatus === "Approved";

            const rawStages =
              m.stages?.length > 0
                ? m.stages
                : pm?.stages?.length > 0
                ? pm.stages
                : [
                    { id: `s${mIdx}_1`, name: "Document & Skill Clearance", status: "Pending" },
                    { id: `s${mIdx}_2`, name: "Processing Step", status: "Pending" },
                  ];

            return {
              id: m.id || `m${mIdx}`,
              name: m.name || `Milestone ${mIdx + 1}`,
              amount: Number(m.amount || m.paymentAmount || 10000),
              status: isPaid ? "Paid" : m.status || (mIdx === 0 ? "Paid" : "Due"),
              stages: rawStages.map((s, sIdx) => ({
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

          const firstIncompleteIdx = formatted.findIndex((m) => {
            const allStagesDone = (m.stages || []).length > 0 && m.stages.every((s) => s.status === "Completed");
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
              stages: [
                { id: "s0_1", name: "Trade Skill Verification & Acceptance", status: "Completed", completedAt: new Date().toISOString() },
                { id: "s0_2", name: "Client Offer Letter Signed", status: "In Progress" },
              ],
            },
            {
              id: "m1",
              name: "Milestone 2: Visa Stamping & Flight Deployment",
              amount: 20000,
              status: "Due",
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
    if (allCurrentStagesDone && mIdx < updated.length - 1) {
      if (updated[mIdx + 1].status !== "Paid") {
        updated[mIdx + 1].status = "Due";
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
      }, 900);
    } catch (err) {
      alert(err.message || "Failed to update stages");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center max-w-4xl mx-auto font-sans">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-bold text-slate-500">Loading candidate processing stages...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-12 text-center max-w-4xl mx-auto font-sans">
        <p className="text-sm font-bold text-slate-800">Application record not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentMilestone = milestonesList[activeMilestoneIdx] || milestonesList[0];
  const isCurrentPaid = currentMilestone?.status === "Paid";
  const currentStages = currentMilestone?.stages || [];
  const currentStagesDoneCount = currentStages.filter((s) => s.status === "Completed").length;
  const isAllCurrentStagesCompleted = currentStages.length > 0 && currentStagesDoneCount === currentStages.length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans antialiased text-slate-800 pb-20">
      {}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={14} className="text-blue-600" />
          <span>Back to Selected Candidates</span>
        </button>
        <span className="text-xs font-mono font-bold text-slate-400">
          Ref: {application.id} • Candidate: {application.candidateName}
        </span>
      </div>

      {}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
              {application.candidateName?.slice(0, 2).toUpperCase() || "CN"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  {application.candidateName}
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                  {application.status || "Selected"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Role: <span className="font-semibold text-slate-800">{application.position || "Staff"}</span>
                {" • "}Project: <span className="font-semibold text-slate-800">{application.projectName}</span>
                {application.clientName && <> ({application.clientName})</>}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Vendor Agency</span>
            <span className="font-bold text-slate-800 text-xs block">{application.vendorName || application.vendorId}</span>
          </div>
        </div>

        {}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Sequential Milestone Timeline:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {milestonesList.map((m, mIdx) => {
              const isPaid = m.status === "Paid";
              const stages = m.stages || [];
              const allDone = stages.length > 0 && stages.every((s) => s.status === "Completed");
              const isSelectedTab = mIdx === activeMilestoneIdx;

              return (
                <button
                  key={m.id || mIdx}
                  type="button"
                  onClick={() => setActiveMilestoneIdx(mIdx)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                    isSelectedTab
                      ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-2xs"
                      : allDone
                      ? "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      : isPaid
                      ? "bg-white border-slate-200 hover:bg-slate-50"
                      : "bg-slate-50/50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
                    <span className="uppercase text-slate-400">Milestone {mIdx + 1}</span>
                    {allDone ? (
                      <span className="text-emerald-700 flex items-center gap-0.5 font-bold">
                        <CheckCircle2 size={12} /> Done
                      </span>
                    ) : isPaid ? (
                      <span className="text-slate-800 flex items-center gap-0.5 font-bold">
                        <Clock size={11} /> Unlocked
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-0.5 font-medium">
                        <Lock size={11} /> Locked
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs truncate">{m.name}</h4>
                  <div className="text-xs font-semibold text-slate-600 mt-0.5">
                    ₹{Number(m.amount).toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {}
      {currentMilestone && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {}
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  isCurrentPaid ? "bg-slate-800 text-emerald-400 border border-slate-700" : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {isCurrentPaid ? <CheckCircle2 size={18} /> : <Lock size={16} />}
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Active Focus &bull; Milestone {activeMilestoneIdx + 1} of {milestonesList.length}
                </span>
                <h2 className="text-base font-bold text-white">{currentMilestone.name}</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Milestone Fee: <strong>₹{Number(currentMilestone.amount).toLocaleString()}</strong>
                  {" • "}Completed: <strong>{currentStagesDoneCount} / {currentStages.length} Stages</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {isCurrentPaid ? (
                <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-emerald-300 border border-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span>Paid & Unlocked</span>
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5">
                    <Lock size={12} className="text-slate-400" />
                    <span>Awaiting Payment (₹{Number(currentMilestone.amount).toLocaleString()})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUnlockMilestone(activeMilestoneIdx)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer shadow-2xs flex items-center gap-1"
                    title="Mark payment received from vendor and unlock stages"
                  >
                    <Unlock size={12} />
                    <span>Mark Paid & Unlock</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {}
          <div className="p-6 space-y-4">
            {isCurrentPaid ? (
              <>
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Layers size={16} className="text-slate-700" />
                      <span>Execute Stages for {currentMilestone.name}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mark stages complete and attach required certificates/visas directly to candidate's profile.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddStage(activeMilestoneIdx)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Plus size={13} />
                    <span>Add Stage</span>
                  </button>
                </div>

                {/* Stage Cards List */}
                <div className="space-y-3">
                  {currentStages.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                      No stages added for this milestone yet. Click "+ Add Stage" above.
                    </div>
                  ) : (
                    currentStages.map((stage, sIdx) => {
                      const isDone = stage.status === "Completed";
                      const isInProgress = stage.status === "In Progress";

                      return (
                        <div
                          key={stage.id || sIdx}
                          className={`p-4 rounded-xl border transition-all space-y-3 ${
                            isDone
                              ? "bg-emerald-50/30 border-emerald-200"
                              : isInProgress
                              ? "bg-slate-50 border-slate-300"
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1">
                              <span
                                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                  isDone
                                    ? "bg-emerald-600 text-white"
                                    : isInProgress
                                    ? "bg-slate-800 text-white"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {sIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={stage.name}
                                onChange={(e) => handleStageNameChange(activeMilestoneIdx, sIdx, e.target.value)}
                                placeholder="Enter processing stage name..."
                                className="flex-1 font-semibold text-xs sm:text-sm text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 focus:border-slate-400 focus:outline-none bg-white shadow-2xs"
                              />
                            </div>

                            {/* Stage Status Toggle */}
                            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStageStatusChange(activeMilestoneIdx, sIdx, "Pending")}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                                  stage.status === "Pending"
                                    ? "bg-slate-800 text-white border-slate-800"
                                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                }`}
                              >
                                Pending
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStageStatusChange(activeMilestoneIdx, sIdx, "In Progress")}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                                  stage.status === "In Progress"
                                    ? "bg-slate-800 text-white border-slate-800 shadow-2xs"
                                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                }`}
                              >
                                In Progress
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStageStatusChange(activeMilestoneIdx, sIdx, "Completed")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center gap-1 ${
                                  stage.status === "Completed"
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                }`}
                              >
                                <CheckCircle2 size={13} />
                                <span>Completed</span>
                              </button>

                              {currentStages.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStage(activeMilestoneIdx, sIdx)}
                                  className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Remove stage"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* ── ATTACH PROOF / UPLOAD TO CANDIDATE PROFILE ── */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-200/80 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Document Proof:
                              </span>

                              {stage.document ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                                  <FileText size={13} className="text-emerald-700" />
                                  <span>{stage.document.fileName}</span>
                                  <span className="text-[10px] font-mono text-emerald-600">({stage.document.size})</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStageDocument(activeMilestoneIdx, sIdx)}
                                    className="text-emerald-700 hover:text-rose-600 cursor-pointer ml-1"
                                    title="Remove document"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer transition shadow-2xs">
                                  <Upload size={13} className="text-blue-600" />
                                  <span>Upload Document to Candidate Profile</span>
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => handleFileUploadForStage(activeMilestoneIdx, sIdx, e)}
                                  />
                                </label>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={stage.remark || ""}
                                onChange={(e) => handleStageRemarkChange(activeMilestoneIdx, sIdx, e.target.value)}
                                placeholder="Stage notes / tracking remark..."
                                className="w-56 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-400 placeholder-slate-400 font-medium"
                              />
                              {isDone && stage.completedAt && (
                                <span className="text-[10px] font-bold text-emerald-700 shrink-0">
                                  ✓ Done
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* All Stages Completed Notification & Next Step Trigger */}
                {isAllCurrentStagesCompleted && (
                  <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-emerald-900 font-bold">
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-extrabold text-sm text-emerald-950">
                          Milestone {activeMilestoneIdx + 1} All Stages Completed!
                        </p>
                        <p className="text-[11px] text-emerald-800">
                          {activeMilestoneIdx < milestonesList.length - 1
                            ? `Milestone ${activeMilestoneIdx + 2} is now ready for vendor payment collection.`
                            : "All milestones and deployment stages for this candidate are 100% complete!"}
                        </p>
                      </div>
                    </div>

                    {activeMilestoneIdx < milestonesList.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setActiveMilestoneIdx(activeMilestoneIdx + 1)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                      >
                        <span>Next Milestone {activeMilestoneIdx + 2}</span>
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Milestone Locked Waiting for Vendor Payment */
              <div className="p-6 sm:p-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                  <Lock size={18} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Milestone {activeMilestoneIdx + 1} Stages Locked
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Vendor must submit payment for <strong>{currentMilestone.name}</strong> (₹{Number(currentMilestone.amount).toLocaleString()}) to unlock these processing stages.
                </p>
                <div className="pt-1 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUnlockMilestone(activeMilestoneIdx)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <Unlock size={13} />
                    <span>Record Payment & Unlock Stages</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Action Sticky Footer */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-xl flex items-center justify-between gap-3">
        <div className="text-xs">
          <span className="text-slate-500 font-medium">Active Milestone: </span>
          <strong className="text-slate-900 font-black">
            {currentMilestone?.name} ({currentStagesDoneCount}/{currentStages.length} Done)
          </strong>
        </div>

        <div className="flex items-center gap-2">
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
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-black transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {saveLoading ? (
              <span>Saving...</span>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 size={14} />
                <span>Saved & Synced!</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Stage Updates</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
