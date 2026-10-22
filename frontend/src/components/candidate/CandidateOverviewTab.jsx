import React from "react";
import { CheckCircle2, FileText, Lock, Unlock, ShieldCheck } from "lucide-react";

export default function CandidateOverviewTab({
  candidate,
  user,
  completionPercent = 0,
  canApply = false,
  isProfileComplete = false,
  hasUploadedDocs = false,
  applications = [],
  onNavigateTab = () => {},
}) {
  return (
    <div className="space-y-3">
      {/* Top Welcome & Eligibility Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-blue-50/70 to-indigo-50/50 border border-sky-200/80 rounded-lg px-3 py-2 text-slate-900 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
            <CheckCircle2 size={10} className="text-emerald-600" />
            <span>{candidate?.accountStatus || "Approved"}</span>
          </span>
          <span className="text-xs font-semibold text-[#0f2744] tracking-tight">
            Welcome back, {candidate?.fullName}!
          </span>
          <span className="text-[10px] text-slate-500 font-normal hidden sm:inline">
            &bull; {candidate?.email || user?.email}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white rounded border border-sky-200 text-[10px] font-semibold text-slate-700 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
            <span>
              Profile: <strong>{completionPercent}%</strong>
            </span>
            <span className="text-[9px] text-slate-400 font-normal">
              ({canApply ? "Eligible" : "Pending"})
            </span>
          </div>

          {!canApply && !isProfileComplete && (
            <button
              type="button"
              onClick={() => onNavigateTab("profile")}
              className="px-2 py-0.5 text-[10px] font-medium text-white bg-[#0f2744] hover:bg-[#163660] rounded shadow-xs cursor-pointer"
            >
              Complete Profile
            </button>
          )}
          {!canApply && !hasUploadedDocs && (
            <button
              type="button"
              onClick={() => onNavigateTab("documents")}
              className="px-2 py-0.5 text-[10px] font-medium text-[#0f2744] bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-2xs cursor-pointer"
            >
              Upload Docs
            </button>
          )}
        </div>
      </div>

      {/* Unlock Notice if incomplete */}
      {!canApply && (
        <div className="px-3 py-1.5 bg-amber-50/80 border border-amber-200/80 rounded-lg flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-amber-600 shrink-0" />
            <span className="text-[11px] text-amber-900 font-medium">
              Complete your profile (80%) and upload required documents to unlock application access.
            </span>
          </div>
          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded shrink-0">
            Locked
          </span>
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-0.5">
          <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center font-semibold">
            <CheckCircle2 size={13} />
          </div>
          <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
            Account Approval
          </div>
          <div className="text-xs font-semibold text-slate-900">Active & Approved</div>
          <p className="text-[9px] text-slate-400">
            Approved on{" "}
            {candidate?.approvalDate
              ? new Date(candidate.approvalDate).toLocaleDateString()
              : "Registration"}
          </p>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-0.5">
          <div className="w-6 h-6 rounded bg-blue-50 text-blue-700 flex items-center justify-center font-semibold">
            <FileText size={13} />
          </div>
          <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
            Document Status
          </div>
          <div className="text-xs font-semibold text-slate-900">
            {hasUploadedDocs ? `${candidate?.documents?.length} Uploaded` : "Not Submitted"}
          </div>
          <p className="text-[9px] text-slate-400">
            {hasUploadedDocs ? "Ready for verification" : "Upload Resume / Passport"}
          </p>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-0.5">
          <div className="w-6 h-6 rounded bg-purple-50 text-purple-700 flex items-center justify-center font-semibold">
            {canApply ? <Unlock size={13} /> : <Lock size={13} />}
          </div>
          <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
            Job Access
          </div>
          <div className="text-xs font-semibold text-slate-900">
            {canApply ? "Unlocked" : "Locked"}
          </div>
          <p className="text-[9px] text-slate-400">
            {canApply ? "Eligible to apply to projects" : "Complete profile & upload docs"}
          </p>
        </div>
      </div>

      {/* Applications list */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-2.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900">My Job Applications</h3>
          <button
            type="button"
            onClick={() => onNavigateTab("jobs")}
            className="text-[11px] font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            Explore More Jobs &rarr;
          </button>
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          {applications.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">
              No active job applications. Explore available projects below to apply!
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.applicationId} className="p-2 flex items-center justify-between gap-2.5">
                <div>
                  <div className="font-semibold text-slate-900 text-xs">{app.projectName}</div>
                  <div className="text-slate-500 text-[10px] mt-0.5 font-medium">
                    {app.position} &bull; {app.destinationCountry} &bull; Applied on{" "}
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-800">
                  {app.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
