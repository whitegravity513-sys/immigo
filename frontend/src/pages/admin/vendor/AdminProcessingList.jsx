import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  FileCheck,
  Stethoscope,
  Building,
  Plane,
  Building2,
  UserCheck,
  Calendar,
  User,
  Edit3,
  ChevronRight,
  ArrowLeft,
  Plus,
  FileText,
  CreditCard,
  History,
  Eye,
  Check,
  Search,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";

export default function AdminProcessingList() {
  const [searchParams] = useSearchParams();
  const queryAppId = searchParams.get("appId");

  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Stage Update Modal inside Full Page
  const [showStageModal, setShowStageModal] = useState(false);
  const [targetStageIdx, setTargetStageIdx] = useState(0);
  const [stageRemarks, setStageRemarks] = useState("");
  const [stageDate, setStageDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await crmVendorService.getApplications();
      const selected = (data || []).filter((a) => a.status === "Selected" || a.status === "Completed");
      setApplications(selected);

      if (queryAppId) {
        const found = selected.find((a) => a.id === queryAppId);
        if (found) setSelectedApp(found);
      }
    } catch (err) {
      console.error("Failed to load processing applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const stageMeta = [
    { key: "selected", name: "1. Candidate Selected", icon: UserCheck, desc: "Client selection confirmed" },
    { key: "docs_pending", name: "2. Documents Pending", icon: Clock, desc: "Gathering attested documents & police clearance" },
    { key: "docs_verified", name: "3. Documents Verified", icon: FileCheck, desc: "Embassy attestation & MOFA validation" },
    { key: "medical", name: "4. Medical (GAMCA)", icon: Stethoscope, desc: "GAMCA Fit certificate issued" },
    { key: "visa", name: "5. Visa Processing", icon: Building, desc: "Work / Residence visa stamped" },
    { key: "ticket", name: "6. Ticket / Travel", icon: Plane, desc: "Flight ticket issued" },
    { key: "deployed", name: "7. Deployed on Site", icon: Building2, desc: "Arrived & mobilized on site camp" },
    { key: "completed", name: "8. Processing Completed", icon: CheckCircle2, desc: "Deployment phase fully completed" },
  ];

  const handleUpdateStage = async () => {
    if (!selectedApp) return;
    try {
      const updated = await crmVendorService.updateProcessingStage(
        selectedApp.id,
        Number(targetStageIdx),
        stageRemarks
      );
      setShowStageModal(false);
      setStageRemarks("");
      setSelectedApp({ ...selectedApp, ...updated });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.candidateName?.toLowerCase().includes(q) ||
      app.projectName?.toLowerCase().includes(q) ||
      app.clientName?.toLowerCase().includes(q) ||
      app.vendorId?.toLowerCase().includes(q) ||
      app.position?.toLowerCase().includes(q)
    );
  });

  // =========================================================================
  // VIEW 2: FULL PAGE CANDIDATE PROCESSING TIMELINE & STAGE UPDATER
  // =========================================================================
  if (selectedApp) {
    const currentStageIndex = selectedApp?.processing?.currentStageIndex ?? 0;
    const stages = selectedApp?.processing?.stages || [];

    return (
      <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-slate-800 pb-12">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <button
            onClick={() => setSelectedApp(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>← Back to Candidate Processing Roster</span>
          </button>

          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
            Processing ID • {selectedApp.id}
          </span>
        </div>

        {/* CANDIDATE & DEPLOYMENT HEADER CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                <UserCheck size={26} />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {selectedApp.candidateName}
                  </h1>
                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
                    {selectedApp.position}
                  </span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                    Stage {currentStageIndex + 1} of 8 Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-3 flex-wrap">
                  <span>Project: <strong className="text-blue-700">{selectedApp.projectName}</strong></span>
                  <span>•</span>
                  <span>Client: <strong className="text-slate-800">{selectedApp.clientName}</strong></span>
                  <span>•</span>
                  <span>Vendor: <strong className="text-slate-800">{selectedApp.vendorId}</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setTargetStageIdx(Math.min(7, currentStageIndex + 1));
                  setStageRemarks("");
                  setShowStageModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Edit3 size={15} />
                <span>Update Deployment Stage</span>
              </button>
            </div>
          </div>

          {/* Stepper Overview Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-center">
            {stageMeta.map((sm, idx) => {
              const isDone = idx < currentStageIndex || stages[idx]?.status === "completed";
              const isCurrent = idx === currentStageIndex && stages[idx]?.status !== "completed";

              return (
                <div
                  key={sm.key}
                  onClick={() => {
                    setTargetStageIdx(idx);
                    setShowStageModal(true);
                  }}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    isCurrent
                      ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs"
                      : isDone
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold"
                      : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}
                >
                  <span className="text-[10px] block font-mono">Stage {idx + 1}</span>
                  <span className="truncate block font-bold text-[11px] mt-0.5">{sm.name.split(". ")[1]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 8-STAGE INTERACTIVE MOBILIZATION TIMELINE */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock size={18} className="text-indigo-600" />
              <span>Full 8-Stage Deployment Mobilization Stepper</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Click any stage to update status & remarks</span>
          </div>

          <div className="space-y-3">
            {stageMeta.map((meta, idx) => {
              const isDone = idx < currentStageIndex || stages[idx]?.status === "completed";
              const isCurrent = idx === currentStageIndex && stages[idx]?.status !== "completed";
              const stgData = stages[idx] || {};

              return (
                <div
                  key={meta.key}
                  className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                    isCurrent
                      ? "bg-indigo-50/70 border-indigo-300 shadow-xs"
                      : isDone
                      ? "bg-emerald-50/30 border-emerald-200"
                      : "bg-slate-50/50 border-slate-200 opacity-70"
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isDone
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                          ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isDone ? <Check size={16} /> : idx + 1}
                    </div>

                    <div>
                      <h3 className={`text-xs font-bold ${isCurrent ? "text-indigo-950" : "text-slate-900"}`}>
                        {meta.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{meta.desc}</p>

                      {stgData.note && (
                        <div className="mt-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-semibold shadow-2xs">
                          <strong>Admin Remark:</strong> {stgData.note}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono font-semibold text-slate-500">
                      {stgData.date || "Pending"}
                    </span>

                    <button
                      onClick={() => {
                        setTargetStageIdx(idx);
                        setStageRemarks(stgData.note || "");
                        setShowStageModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 size={13} />
                      <span>Update Stage</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* STAGE UPDATE MODAL */}
        {showStageModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Update Processing Stage</h3>
              <p className="text-xs text-slate-500">
                Candidate: <strong>{selectedApp.candidateName}</strong> ({selectedApp.position})
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Stage:</label>
                  <select
                    value={targetStageIdx}
                    onChange={(e) => setTargetStageIdx(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs"
                  >
                    {stageMeta.map((m, idx) => (
                      <option key={m.key} value={idx}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operational Remarks / Note:</label>
                  <input
                    type="text"
                    value={stageRemarks}
                    onChange={(e) => setStageRemarks(e.target.value)}
                    placeholder="e.g. Medical GAMCA fit certificate verified and issued..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStageModal(false)}
                  className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateStage}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Stage Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: PROCESSING CANDIDATES ROSTER LIST VIEW
  // =========================================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Processing Timeline & Stepper</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Post-selection mobilization tracking across all 8 deployment stages. Select any candidate to view & update full processing timeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold">
            In Processing: {applications.length}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search candidate name, project, position, vendor..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs"
        />
      </div>

      {/* Candidates Roster Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-semibold text-slate-500">Loading processing timeline...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No candidates in active processing</h3>
          <p className="text-xs text-slate-500 mt-1">Candidates marked as Selected will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-5">Candidate Name</th>
                  <th className="py-3.5 px-4">Position</th>
                  <th className="py-3.5 px-4">Vendor Partner</th>
                  <th className="py-3.5 px-4">Client Company</th>
                  <th className="py-3.5 px-4">Project Name</th>
                  <th className="py-3.5 px-4">Current Processing Stage</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => {
                  const stageIdx = app.processing?.currentStageIndex ?? 0;
                  const stageName = stageMeta[stageIdx]?.name || "1. Selected";

                  return (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className="hover:bg-indigo-50/40 transition cursor-pointer group"
                    >
                      <td className="py-4 px-4 sm:px-5 font-black text-slate-900 group-hover:text-indigo-600 transition">
                        {app.candidateName}
                        <span className="block font-mono text-[10px] text-slate-400 font-normal">{app.id}</span>
                      </td>

                      <td className="py-4 px-4 font-bold text-indigo-700">{app.position}</td>
                      <td className="py-4 px-4 font-semibold text-slate-700">{app.vendorId}</td>
                      <td className="py-4 px-4 text-slate-800 font-medium">{app.clientName}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">{app.projectName}</td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          {stageName} ({stageIdx + 1}/8)
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer ml-auto"
                        >
                          <Edit3 size={14} />
                          <span>Update Status (Full Page)</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
