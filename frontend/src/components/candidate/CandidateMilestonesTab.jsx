import React from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Briefcase,
  Globe,
  CreditCard,
  Lock,
  CheckCircle2,
  FileText,
  Clock,
  Eye,
} from "lucide-react";

export default function CandidateMilestonesTab({
  selectedApps = [],
  selectedAppForProcessing,
  setSelectedAppForProcessing,
  milestonesData,
  onOpenPayModal = () => {},
  onNavigateTab = () => {},
  onFetchAppMilestones = () => {},
}) {
  if (selectedApps.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg border border-slate-200 p-6 sm:p-8 text-center space-y-2.5">
        <Award className="w-8 h-8 text-slate-300 mx-auto" />
        <h3 className="text-xs sm:text-sm font-semibold text-slate-800">
          No Selected Projects Active Yet
        </h3>
        <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl mx-auto">
          Once our overseas client reviews your profile and marks your application as <strong>"Selected"</strong>, your step-by-step milestone timeline (Offer Acceptance, Medical Examination, Visa Stamping, and Flight Ticket Deployment) will automatically be unlocked right here.
        </p>
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onNavigateTab("jobs")}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Briefcase size={13} />
            <span>Explore Available Jobs & Apply</span>
          </button>
        </div>
      </div>
    );
  }

  const curApp = selectedAppForProcessing || selectedApps[0];
  const rawMs =
    milestonesData?.processMilestones?.length > 0
      ? milestonesData.processMilestones
      : curApp.processMilestones?.length > 0
      ? curApp.processMilestones
      : [
          {
            id: "m0",
            name: "Milestone 1: Selection & Document Clearance",
            amount: 15000,
            paymentAmount: 15000,
            status: "Active",
            paymentStatus: "Payment Required",
            stages: [
              {
                id: "s0_1",
                name: "Trade Skill & Technical Screening",
                status: "Completed",
                completedAt: new Date().toISOString(),
                remark: "Candidate verified",
              },
              {
                id: "s0_2",
                name: "Client Offer Letter Signed & Verified",
                status: "In Progress",
                remark: "",
              },
              {
                id: "s0_3",
                name: "Document Attestation & Verification",
                status: "Pending",
                remark: "",
              },
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
              {
                id: "s1_1",
                name: "GAMCA Medical Fitness Clearance",
                status: "Locked",
                remark: "",
              },
              {
                id: "s1_2",
                name: "Visa Application & Work Permit Stamping",
                status: "Locked",
                remark: "",
              },
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
              {
                id: "s2_1",
                name: "Emigration Clearance (Poe/Protector)",
                status: "Locked",
                remark: "",
              },
              {
                id: "s2_2",
                name: "Air Ticket Booking & Travel Insurance",
                status: "Locked",
                remark: "",
              },
              {
                id: "s2_3",
                name: "Airport Mobilization & Deployment",
                status: "Locked",
                remark: "",
              },
            ],
          },
        ];

  let totalStages = 0;
  let doneStages = 0;
  rawMs.forEach((m) => {
    (m.stages || []).forEach((s) => {
      totalStages++;
      if (s.status === "Completed") doneStages++;
    });
  });
  const progressPct = totalStages > 0 ? Math.round((doneStages / totalStages) * 100) : 0;

  const totalMilestonesFee =
    curApp.paymentPlan?.totalAmount ||
    rawMs.reduce((acc, m) => acc + (Number(m.amount || m.paymentAmount) || 0), 0) ||
    40000;

  const paidFee = rawMs.reduce((acc, m) => {
    if (m.status === "Paid" || m.paymentStatus === "Approved") {
      return acc + (Number(m.amount || m.paymentAmount) || 0);
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-3">
      {/* Selected Project Header Card */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-3 sm:p-3.5 rounded-lg shadow-xs space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                ✓ Officially Selected
              </span>
              <span className="text-[10px] font-mono text-cyan-300">
                App #{curApp.applicationId || curApp.id}
              </span>
            </div>
            <h2 className="text-xs sm:text-sm font-semibold text-white mt-0.5">
              {curApp.projectName}
            </h2>
            <div className="text-[10px] text-slate-300 flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Globe size={11} className="text-cyan-400" />
                <span>{curApp.destinationCountry || "Overseas"}</span>
              </span>
              <span>
                &bull; Role: <strong>{curApp.position || "Specialist"}</strong>
              </span>
              {curApp.salary && (
                <span>
                  &bull; Package: <strong className="text-emerald-400">{curApp.salary}</strong>
                </span>
              )}
            </div>
          </div>

          {selectedApps.length > 1 && (
            <div className="bg-white/10 p-1.5 rounded-lg border border-white/15">
              <label className="block text-[9px] uppercase font-semibold text-slate-400 mb-0.5">
                Switch Project
              </label>
              <select
                value={curApp.applicationId || curApp.id}
                onChange={(e) => {
                  const target = selectedApps.find(
                    (a) => (a.applicationId || a.id) === e.target.value
                  );
                  if (target) {
                    setSelectedAppForProcessing(target);
                    onFetchAppMilestones(target.applicationId || target.id);
                  }
                }}
                className="bg-slate-900 text-white text-[11px] font-medium px-2 py-1 rounded border border-white/20 focus:outline-none"
              >
                {selectedApps.map((a) => (
                  <option key={a.applicationId || a.id} value={a.applicationId || a.id}>
                    {a.projectName} ({a.position})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Progress Bar & Fee Highlights */}
        <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="sm:col-span-2 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">Deployment Pipeline</span>
              <span className="text-cyan-300 font-semibold">
                {progressPct}% ({doneStages}/{totalStages} Steps)
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-1.5 rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="bg-white/10 p-2 rounded-lg border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                Milestone Fees
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                ₹{paidFee.toLocaleString()} / ₹{Number(totalMilestonesFee).toLocaleString()}
              </span>
            </div>
            <CreditCard size={16} className="text-cyan-300" />
          </div>
        </div>
      </div>

      {/* Milestones & Processing Timeline Cards */}
      <div className="space-y-2.5">
        {rawMs.map((m, mIdx) => {
          const isPaid = m.status === "Paid" || m.paymentStatus === "Approved";
          const isPaymentRequired =
            m.status === "Payment Required" || m.paymentStatus === "Payment Required";
          const isLocked = m.status === "Locked";
          const amt = Number(m.amount || m.paymentAmount || 15000);

          return (
            <div
              key={m.id || mIdx}
              className={`bg-white rounded-lg border transition-all shadow-2xs overflow-hidden ${
                isPaid
                  ? "border-emerald-200"
                  : isPaymentRequired
                  ? "border-amber-300 ring-1 ring-amber-400/20"
                  : "border-slate-200 opacity-90"
              }`}
            >
              <div className="p-2.5 sm:p-3 bg-slate-50 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-md font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                      isPaid
                        ? "bg-emerald-600 text-white"
                        : isPaymentRequired
                        ? "bg-amber-500 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isPaid ? "✓" : isLocked ? <Lock size={12} /> : mIdx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-semibold text-slate-900">{m.name}</h3>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                          isPaid
                            ? "bg-emerald-100 text-emerald-800"
                            : isPaymentRequired
                            ? "bg-amber-100 text-amber-800 animate-pulse"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isPaid ? "Paid & Cleared" : isLocked ? "Locked" : "Payment Due"}
                      </span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                      Fee: <strong className="text-slate-900">₹{amt.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start md:self-center">
                  {isPaid ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>Verified</span>
                      </span>
                      <Link
                        to={`/invoice/${curApp.applicationId || curApp.id}/${m.id}`}
                        target="_blank"
                        className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-[10px] flex items-center gap-1 cursor-pointer transition"
                      >
                        <FileText size={11} />
                        <span>Receipt</span>
                      </Link>
                    </div>
                  ) : !isLocked ? (
                    <button
                      type="button"
                      onClick={() => onOpenPayModal(m)}
                      className="px-2.5 py-1 rounded bg-[#0f2744] hover:bg-[#163660] text-white font-semibold text-xs shadow-xs flex items-center gap-1 cursor-pointer transition"
                    >
                      <CreditCard size={12} />
                      <span>Pay Fee (₹{amt.toLocaleString()})</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Lock size={11} />
                      <span>Locked</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Stages Checklist */}
              <div className="p-2 sm:p-2.5 space-y-1.5">
                <h4 className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Clearances & Document Proofs
                </h4>

                {(m.stages || []).map((stage, sIdx) => {
                  const isDone = stage.status === "Completed";
                  const inProgress = stage.status === "In Progress";

                  return (
                    <div
                      key={stage.id || sIdx}
                      className={`p-2 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 transition-colors ${
                        isDone
                          ? "bg-emerald-50/40 border-emerald-200"
                          : inProgress
                          ? "bg-blue-50/30 border-blue-200"
                          : "bg-slate-50/50 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full font-semibold text-[9px] flex items-center justify-center shrink-0 ${
                            isDone
                              ? "bg-emerald-600 text-white"
                              : inProgress
                              ? "bg-blue-600 text-white animate-pulse"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {isDone ? "✓" : sIdx + 1}
                        </div>
                        <div>
                          <div className="font-medium text-xs text-slate-900">
                            {stage.name}
                          </div>
                          {stage.remark && (
                            <div className="text-[10px] text-slate-500 font-normal italic">
                              "{stage.remark}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-start sm:self-center">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-semibold flex items-center gap-1 ${
                            isDone
                              ? "bg-emerald-100 text-emerald-800"
                              : inProgress
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isDone && <CheckCircle2 size={10} />}
                          {inProgress && <Clock size={10} />}
                          <span>{stage.status || "Pending"}</span>
                        </span>

                        {stage.document && (
                          <a
                            href={stage.document.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-1.5 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold flex items-center gap-1 shadow-2xs transition"
                          >
                            <Eye size={10} />
                            <span>View Proof</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
