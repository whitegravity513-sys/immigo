import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Building2,
  Briefcase,
  Users,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  ChevronRight,
  ShieldCheck,
  FileText,
  RotateCcw,
  Check,
  Plus,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService";
import { crmClientService } from "../../services/crmClientService";

export default function SubmitCandidate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedCandidateId = searchParams.get("candidateId");

  const [vendor, setVendor] = useState(null);
  const [clients, setClients] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState(preselectedCandidateId || "");
  const [vendorNotes, setVendorNotes] = useState("");

  // Search & Filter within candidate selector
  const [candidateSearch, setCandidateSearch] = useState("");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Modal view for full candidate list
  const [showFullCandidateModal, setShowFullCandidateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      setVendor(curVendor);

      const [clientRes, candRes, appRes] = await Promise.all([
        crmClientService.getClients({ limit: 100 }),
        crmVendorService.getCandidates(curVendor?.id),
        crmVendorService.getApplications(curVendor?.id),
      ]);

      const clientList = clientRes?.clients || [];
      setClients(clientList);
      setCandidates(candRes || []);
      setApplications(appRes || []);

      // If preselected candidate exists, select it
      if (preselectedCandidateId && candRes.some((c) => c.id === preselectedCandidateId)) {
        setSelectedCandidateId(preselectedCandidateId);
      }
    } catch (err) {
      console.error("Error loading submission data:", err);
      setErrorMessage("Failed to load required data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  // Aggregate all active projects across all clients for direct Project Name selection
  const allProjects = clients.flatMap((c) =>
    (c.projects || []).map((p) => ({
      ...p,
      clientId: c.id,
      clientName: c.companyName,
    }))
  );

  const selectedProject = allProjects.find((p) => String(p.id) === String(selectedProjectId));
  const selectedClient = clients.find((c) => String(c.id) === String(selectedProjectId ? selectedProject?.clientId : selectedClientId));
  const availableRequirements = selectedProject?.manpowerRequirements || [];
  const selectedRequirement = availableRequirements.find((r) => r.positionTitle === selectedPosition);

  // Direct Project Name Selection Handler
  const handleSelectProjectByName = (projId) => {
    setSelectedProjectId(projId);
    setErrorMessage("");

    const targetProj = allProjects.find((p) => String(p.id) === String(projId));
    if (targetProj) {
      setSelectedClientId(targetProj.clientId);
      if (targetProj.manpowerRequirements?.length > 0) {
        setSelectedPosition(targetProj.manpowerRequirements[0].positionTitle);
      } else {
        setSelectedPosition("");
      }
    } else {
      setSelectedClientId("");
      setSelectedPosition("");
    }
  };

  // Project Headcount & Slot Calculations
  const requiredHeadcount = selectedRequirement ? Number(selectedRequirement.quantity || 0) : 0;
  const projectSubmissions = applications.filter(
    (a) =>
      String(a.projectId) === String(selectedProjectId) &&
      (!selectedPosition || a.position === selectedPosition) &&
      a.status !== "Rejected"
  );
  const selectedOrShortlisted = projectSubmissions.filter((a) =>
    ["Selected", "Shortlisted", "Completed"].includes(a.status)
  ).length;
  const remainingSlots = Math.max(0, requiredHeadcount - selectedOrShortlisted);

  // Check if chosen candidate is already submitted to this project
  const candidateAlreadySubmitted =
    selectedCandidateId &&
    selectedProjectId &&
    applications.some(
      (a) =>
        a.candidateId === selectedCandidateId &&
        String(a.projectId) === String(selectedProjectId) &&
        a.status !== "Rejected"
    );

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  // Candidates filtered for selection box
  const filteredCandidates = candidates.filter((c) => {
    if (!candidateSearch) return true;
    const q = candidateSearch.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.currentPosition?.toLowerCase().includes(q) ||
      c.passportNumber?.toLowerCase().includes(q) ||
      c.skills?.some((s) => s.toLowerCase().includes(q))
    );
  });

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedCandidateId) {
      setErrorMessage("Please select a Candidate from the roster first.");
      return;
    }
    if (!selectedProjectId) {
      setErrorMessage("Please select an active Target Project.");
      return;
    }
    if (!selectedPosition) {
      setErrorMessage("Please enter the Target Trade / Position Role.");
      return;
    }
    if (candidateAlreadySubmitted) {
      setErrorMessage(
        `Candidate ${selectedCandidate?.fullName} is already submitted to this project. Candidates can only be submitted once per project (unless rejected).`
      );
      return;
    }

    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true);
      setErrorMessage("");

      const app = await crmVendorService.submitCandidateToProject({
        vendorId: vendor?.id || "VND-1001",
        candidateId: selectedCandidateId,
        clientId: selectedClientId,
        projectId: selectedProjectId,
        position: selectedPosition,
      });

      setShowConfirmModal(false);
      setSubmitSuccess(app);
      // Refresh apps list
      const refreshedApps = await crmVendorService.getApplications(vendor?.id);
      setApplications(refreshedApps);
    } catch (err) {
      console.error("Submission failed:", err);
      setShowConfirmModal(false);
      setErrorMessage(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetFormForNext = () => {
    setSubmitSuccess(null);
    setSelectedCandidateId("");
    setSelectedProjectId("");
    setSelectedPosition("");
    setVendorNotes("");
    setErrorMessage("");
  };

  if (loading) {
    return (
      <div className="p-4 max-w-6xl mx-auto flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading candidate roster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 max-w-6xl mx-auto space-y-4 font-sans">
      {/* Compact Page Header */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Submit Candidate to Project
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Select a candidate from your roster first, then choose the target project and trade position.
            </p>
          </div>
          <Link
            to="/vendor/candidates/add"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus size={14} />
            <span>Register New Candidate</span>
          </Link>
        </div>
      </div>

      {/* Success Notification Modal / Card */}
      {submitSuccess && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-xs">
              <CheckCircle2 size={22} />
            </div>
            <div className="flex-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 mb-1">
                Application Submitted Successfully
              </span>
              <h2 className="text-lg font-black text-slate-900">
                {submitSuccess.candidateName} submitted to {submitSuccess.projectName}
              </h2>
              <p className="text-xs text-slate-700 mt-0.5">
                Reference ID: <code className="font-mono font-bold text-slate-900">{submitSuccess.id}</code>. Status: <span className="font-bold text-amber-700">Submitted (Pending Review)</span>.
              </p>

              <div className="mt-4 flex flex-wrap gap-2.5">
                <Link
                  to="/vendor/applications"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                >
                  <FileText size={14} />
                  View Applications List
                </Link>
                <button
                  type="button"
                  onClick={resetFormForNext}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition shadow-2xs"
                >
                  <RotateCcw size={14} className="text-slate-500" />
                  Submit Another Candidate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* STEP 1: FULL-WIDTH CANDIDATE ROSTER SELECTION */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-4 sm:p-5 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2 mb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">
                1
              </span>
              <span>Select Candidate from Roster</span>
            </h2>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              Click on a candidate card below to select them for project submission ({filteredCandidates.length} Available).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setShowFullCandidateModal(true)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Users size={14} />
              <span>See All Candidates ({candidates.length})</span>
            </button>
            {selectedCandidate && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Selected: {selectedCandidate.fullName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Candidate Search Input */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate roster by name, position title, skills or ID..."
            value={candidateSearch}
            onChange={(e) => setCandidateSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium text-slate-900"
          />
        </div>

        {/* Full-width Candidate Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
          {filteredCandidates.length === 0 ? (
            <div className="col-span-full text-center py-8 text-xs text-slate-500 font-bold">
              No candidates found matching "{candidateSearch}"
            </div>
          ) : (
            filteredCandidates.map((cand) => {
              const isSelected = selectedCandidateId === cand.id;
              return (
                <div
                  key={cand.id}
                  onClick={() => {
                    setSelectedCandidateId(cand.id);
                    setErrorMessage("");
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400"
                      : "bg-white border-slate-300 hover:border-indigo-400 hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-xs font-black border ${
                      isSelected ? "bg-white/20 text-white border-white/30" : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}>
                      {cand.photo || cand.avatar ? (
                        <img src={cand.photo || cand.avatar} alt={cand.fullName} className="w-full h-full object-cover" />
                      ) : (
                        cand.fullName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-black truncate leading-tight">{cand.fullName}</h4>
                      </div>
                      <p className={`text-[11px] truncate font-semibold mt-0.5 ${isSelected ? "text-indigo-100" : "text-slate-600"}`}>
                        {cand.currentPosition || "General Trade"} &bull; {cand.experienceYears ? `${cand.experienceYears}Y Exp` : "Verified"}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <span className="w-6 h-6 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-xs">
                        <Check size={14} className="stroke-[3]" />
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-lg border border-slate-300 text-[10px] font-bold text-slate-600 hover:bg-slate-100">
                        Select
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* STEP 2: REVEAL PROJECT SELECTION & NOTES BELOW AFTER CANDIDATE SELECTION */}
      <form onSubmit={handleOpenConfirm} className="space-y-4">
        <div className={`transition-all duration-300 ${!selectedCandidateId ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Project & Trade Selection Box (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-300 shadow-xs p-4 sm:p-5 space-y-4">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">
                  2
                </span>
                <span>Select Target Project & Trade Role</span>
              </h2>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                    Select Project Name <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => handleSelectProjectByName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-bold cursor-pointer"
                    required
                    disabled={!selectedCandidateId}
                  >
                    <option value="">-- Choose Target Project Name --</option>
                    {allProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.projectName} ({p.country})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Position / Requirement Text Input */}
                {selectedProjectId && (
                  <div>
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                      Target Trade / Position Role <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      placeholder="e.g. Electrician, Mason, Welder, Plumber, Helper"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-bold"
                      required
                      disabled={!selectedCandidateId}
                    />
                  </div>
                )}
              </div>

              {/* Project Overview Card */}
              {selectedProject && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-1.5 mb-2">
                    <span>Project Headcount & Vacancy Overview</span>
                    <span className="text-indigo-600 font-extrabold">{selectedProject.country}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-600 block text-[10px] uppercase font-bold">Positions</span>
                      <span className="font-black text-slate-900">{requiredHeadcount || selectedProject.totalManpowerRequired || "Flexible"}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 block text-[10px] uppercase font-bold">Underway</span>
                      <span className="font-black text-slate-900">{selectedOrShortlisted} candidates</span>
                    </div>
                    <div>
                      <span className="text-slate-600 block text-[10px] uppercase font-bold">Slots Open</span>
                      <span className="font-black text-emerald-600">{remainingSlots > 0 ? `${remainingSlots} Slots` : "Open Pool"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Vendor Submission Notes Card (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-300 shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2.5 mb-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">
                    3
                  </span>
                  <span>Vendor Submission Notes (Optional)</span>
                </h2>
                <textarea
                  rows={4}
                  value={vendorNotes}
                  onChange={(e) => setVendorNotes(e.target.value)}
                  placeholder="Add specific highlights (e.g. immediate passport availability, GCC returnee, verified trade test certificate)..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  disabled={!selectedCandidateId}
                />
              </div>

              {/* Confirm Submission Action Button */}
              <button
                type="submit"
                disabled={!selectedCandidateId || !selectedProjectId || !selectedPosition}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <UserCheck size={16} />
                <span>Confirm & Submit Candidate to Project</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-300 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Confirm Candidate Submission</h3>
                <p className="text-xs text-slate-500">Verify details before sending to client operations.</p>
              </div>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Candidate:</span>
                <span className="font-bold text-slate-900">{selectedCandidate?.fullName} ({selectedCandidate?.id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Target Project:</span>
                <span className="font-bold text-indigo-700">{selectedProject?.projectName} ({selectedProject?.country})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Trade / Role:</span>
                <span className="font-bold text-slate-900">{selectedPosition}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Candidate</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL CANDIDATE ROSTER DEDICATED MODAL VIEW */}
      {showFullCandidateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-300 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Full Candidate Roster ({candidates.length})
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Browse and select any candidate from your roster for project allocation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFullCandidateModal(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Modal Candidate Grid */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCandidates.map((cand) => {
                  const isSelected = selectedCandidateId === cand.id;
                  return (
                    <div
                      key={cand.id}
                      onClick={() => {
                        setSelectedCandidateId(cand.id);
                        setShowFullCandidateModal(false);
                        setErrorMessage("");
                      }}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                          : "bg-white border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-xs font-black border ${
                          isSelected ? "bg-white/20 text-white border-white/30" : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {cand.photo || cand.avatar ? (
                            <img src={cand.photo || cand.avatar} alt={cand.fullName} className="w-full h-full object-cover" />
                          ) : (
                            cand.fullName.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black truncate leading-tight">{cand.fullName}</h4>
                          <span className={`text-[10px] font-mono font-bold block mt-0.5 ${isSelected ? "text-indigo-200" : "text-slate-500"}`}>
                            ID: {cand.id}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] pt-2 border-t border-slate-200/80">
                        <div className="flex justify-between">
                          <span className={isSelected ? "text-indigo-200" : "text-slate-500"}>Trade Role:</span>
                          <span className="font-bold truncate max-w-[140px]">{cand.currentPosition || "General"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isSelected ? "text-indigo-200" : "text-slate-500"}>Experience:</span>
                          <span className="font-bold">{cand.experienceYears ? `${cand.experienceYears} Yrs` : "Verified"}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 flex justify-end">
                        <button
                          type="button"
                          className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center ${
                            isSelected
                              ? "bg-white text-indigo-700 font-extrabold"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                          }`}
                        >
                          {isSelected ? "Selected Candidate" : "Select & Continue →"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
