import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Stethoscope,
  Plane,
  Building,
  UserCheck,
  ChevronRight,
  ExternalLink,
  CreditCard,
  Building2,
  Calendar,
  Sparkles,
  Search,
  X,
  Eye,
  Users,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService";

export default function ProcessingTimeline() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryAppId = searchParams.get("appId");

  const [vendor, setVendor] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(queryAppId || "");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFullRosterModal, setShowFullRosterModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      setVendor(curVendor);
      const data = await crmVendorService.getApplications(curVendor?.id);
      const selectedApps = (data || []).filter(
        (a) => a.status === "Selected" || a.status === "Completed"
      );
      setApplications(selectedApps);

      if (queryAppId && selectedApps.some((a) => a.id === queryAppId)) {
        setSelectedAppId(queryAppId);
      } else if (selectedApps.length > 0 && !selectedAppId) {
        setSelectedAppId(selectedApps[0].id);
      }
    } catch (err) {
      console.error("Failed to load processing timeline:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectApp = (id) => {
    setSelectedAppId(id);
    setSearchParams({ appId: id });
  };

  const filteredApps = applications.filter((app) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      app.candidateName?.toLowerCase().includes(term) ||
      app.position?.toLowerCase().includes(term) ||
      app.projectName?.toLowerCase().includes(term) ||
      app.country?.toLowerCase().includes(term)
    );
  });

  const currentApp = applications.find((a) => a.id === selectedAppId);

  // 8 default stage icons and descriptions
  const stageMeta = [
    {
      key: "selected",
      title: "1. Candidate Selected",
      subtitle: "Official client selection & offer issuance",
      icon: UserCheck,
    },
    {
      key: "docs_pending",
      title: "2. Documents Pending",
      subtitle: "Passport, Trade Certificates & PCC collection",
      icon: Clock,
    },
    {
      key: "docs_verified",
      title: "3. Documents Verified",
      subtitle: "Apostille & Embassy attestation completed",
      icon: FileCheck,
    },
    {
      key: "medical",
      title: "4. GAMCA Medical Clearance",
      subtitle: "Fit to work certification issued by approved center",
      icon: Stethoscope,
    },
    {
      key: "visa",
      title: "5. Visa Processing & Stamping",
      subtitle: "Ministry quota approval & residence visa stamped",
      icon: Building,
    },
    {
      key: "ticket",
      title: "6. Air Ticket & Travel Details",
      subtitle: "Flight confirmed and itinerary shared",
      icon: Plane,
    },
    {
      key: "deployed",
      title: "7. Deployed on Site",
      subtitle: "Arrival, airport pickup & accommodation onboarding",
      icon: Building2,
    },
    {
      key: "completed",
      title: "8. Mobilization Completed",
      subtitle: "Contract active, final signoff complete",
      icon: CheckCircle2,
    },
  ];

  const currentStageIndex = currentApp?.processing?.currentStageIndex ?? 0;
  const stages = currentApp?.processing?.stages || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Deployment Tracker</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            8-Stage Processing Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Transparent, milestone-by-milestone deployment progress from candidate selection through overseas site mobilization.
          </p>
        </div>

        <Link
          to="/vendor/payments"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto"
        >
          <CreditCard className="w-4 h-4 text-indigo-600" />
          <span>View Milestone Payments</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading deployment roster...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No candidates in deployment processing</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Once a candidate is marked "Selected" by the client or admin, their 8-stage processing pipeline activates here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Active Deployments Candidate List (Wider Column: 6 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-indigo-600" />
                    <span>Active Deployments ({applications.length})</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullRosterModal(true)}
                  className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Eye size={13} />
                  <span>See All Roster</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter candidate by name, position or project..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Candidate Roster Cards */}
              <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                {filteredApps.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active deployment matches "{searchTerm}"
                  </div>
                ) : (
                  filteredApps.map((app) => {
                    const isSelected = app.id === selectedAppId;
                    const idx = app.processing?.currentStageIndex ?? 0;
                    return (
                      <div
                        key={app.id}
                        onClick={() => handleSelectApp(app.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? "bg-indigo-50/90 border-indigo-500 shadow-xs ring-1 ring-indigo-400"
                            : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {app.candidateName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100/80 text-indigo-800 shrink-0">
                            Stage {idx + 1}/8
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-600 gap-2 mb-2">
                          <span className="font-semibold text-slate-700 truncate">{app.position}</span>
                          <span className="font-bold text-indigo-600 shrink-0">{app.projectName}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${((idx + 1) / 8) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Candidate Dossier */}
            {currentApp && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Candidate Dossier</span>
                  <Link
                    to={`/vendor/candidates/${currentApp.candidateId}`}
                    className="text-indigo-600 font-bold hover:underline flex items-center gap-1 text-xs"
                  >
                    <span>View Profile</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Application ID</span>
                    <span className="font-mono font-bold text-slate-800">{currentApp.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Employer / Client</span>
                    <span className="font-bold text-slate-800 truncate block">{currentApp.clientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Deployment Country</span>
                    <span className="font-bold text-indigo-600">{currentApp.country}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Selection Date</span>
                    <span className="font-bold text-slate-800">
                      {currentApp.selectionDate ? new Date(currentApp.selectionDate).toLocaleDateString("en-GB") : "Recently"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Visual 8-Stage Timeline (Narrower Column: 6 Cols) */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2 mb-5">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                    {currentApp?.candidateName}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {currentApp?.position} &bull; {currentApp?.projectName} ({currentApp?.country})
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto shrink-0">
                  <span>Current:</span>
                  <span className="font-extrabold">
                    {stages[currentStageIndex]?.name || stageMeta[currentStageIndex]?.title}
                  </span>
                </div>
              </div>

              {/* Stepper Vertical List - Compact layout */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {stageMeta.map((meta, index) => {
                  const stageData = stages[index] || {};
                  const isCompleted = index < currentStageIndex || stageData.status === "completed";
                  const isCurrent = index === currentStageIndex && stageData.status !== "completed";
                  const isPending = index > currentStageIndex;

                  const IconComp = meta.icon;

                  return (
                    <div key={meta.key} className="relative">
                      {/* Step Circle Marker */}
                      <div
                        className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shadow-2xs ${
                          isCompleted
                            ? "bg-emerald-500 text-white ring-2 ring-emerald-100"
                            : isCurrent
                            ? "bg-indigo-600 text-white ring-2 ring-indigo-200 animate-pulse"
                            : "bg-white border-2 border-slate-300 text-slate-400"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>

                      {/* Content Card */}
                      <div
                        className={`p-3 rounded-xl border transition-all duration-150 ${
                          isCurrent
                            ? "bg-indigo-50/60 border-indigo-300 shadow-2xs"
                            : isCompleted
                            ? "bg-slate-50/50 border-slate-200/80"
                            : "bg-white border-slate-200/60 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4
                            className={`text-xs font-extrabold flex items-center gap-1.5 ${
                              isCurrent
                                ? "text-indigo-950"
                                : isCompleted
                                ? "text-slate-900"
                                : "text-slate-500"
                            }`}
                          >
                            <IconComp size={14} className="text-slate-500 shrink-0" />
                            <span>{stageData.name || meta.title}</span>
                          </h4>

                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                              isCompleted
                                ? "bg-emerald-100 text-emerald-800"
                                : isCurrent
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {isCompleted ? "Done" : isCurrent ? "Active" : "Pending"}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 leading-snug">{meta.subtitle}</p>

                        {/* Operational Notes / Comments */}
                        {stageData.note && (
                          <div className="mt-2 p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700 font-medium">
                            <span className="font-bold text-slate-900 block text-[10px] uppercase">
                              Status Remark:
                            </span>
                            {stageData.note}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL ROSTER MODAL */}
      {showFullRosterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Full Active Deployment Roster ({applications.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete list of selected candidates currently undergoing the 8-stage deployment pipeline.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFullRosterModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Candidate Table / List */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {applications.map((app) => {
                  const idx = app.processing?.currentStageIndex ?? 0;
                  const currentStageName = app.processing?.stages?.[idx]?.name || stageMeta[idx]?.title;
                  return (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all duration-150 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-extrabold text-xs text-slate-900">{app.candidateName}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                            Stage {idx + 1} of 8
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700">{app.position}</p>
                        <p className="text-[11px] text-indigo-600 font-bold mt-0.5">{app.projectName} ({app.country})</p>
                        <p className="text-[10px] text-slate-500 mt-1">Current: {currentStageName}</p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">App #{app.id}</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectApp(app.id);
                            setShowFullRosterModal(false);
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          View Deployment Journey →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowFullRosterModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
