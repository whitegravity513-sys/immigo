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
  Send,
  UserX,
  Eye,
  Filter,
  CheckSquare,
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
  const [excludedBusyCount, setExcludedBusyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Tabs: 'All' | 'fresh' | 'rejected'
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Flow State
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(
    preselectedCandidateId ? [preselectedCandidateId] : []
  );
  const [vendorNotes, setVendorNotes] = useState("");

  // Search
  const [candidateSearch, setCandidateSearch] = useState("");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

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
      setApplications(appRes || []);

      // APPLICATION STATUSES THAT DISQUALIFY A CANDIDATE FROM APPEARING IN ASSIGN CANDIDATE:
      // "aagar vo selct ya shorlist ho gya hai interviw hai uska toh uss list ma vo nhi dikega"
      // Includes: Selected, Shortlisted, Interview, Under Review, Submitted, Completed
      const busyDisqualifyingStatuses = [
        "Selected",
        "Shortlisted",
        "Interview",
        "Under Review",
        "Submitted",
        "Completed",
      ];

      let busyCount = 0;
      const eligibleCandidates = [];

      (candRes || []).forEach((c) => {
        const cApps = (appRes || []).filter((a) => a.candidateId === c.id);

        // Disqualify if candidate is active in any application:
        const hasBusyApp = cApps.some((a) => busyDisqualifyingStatuses.includes(a.status));
        if (hasBusyApp) {
          busyCount++;
          return;
        }

        // Only FRESH (0 applications) or REJECTED (all applications rejected) can show:
        // "jo fress candiate or rejct hai hai vo dikega jisse vo project ka liya assign kr de usse dubar"
        const isFresh = cApps.length === 0;
        const rejectedApp = cApps.find((a) => a.status === "Rejected");
        const isRejected = !isFresh && cApps.every((a) => a.status === "Rejected");

        if (!isFresh && !isRejected) {
          // If on hold or uncertain state, also exclude
          busyCount++;
          return;
        }

        eligibleCandidates.push({
          ...c,
          category: isFresh ? "fresh" : "rejected",
          poolStatus: isFresh ? "Fresh Candidate" : "Rejected",
          lastProjectInfo: rejectedApp ? (rejectedApp.projectName || rejectedApp.clientName) : null,
          lastRejectionReason: rejectedApp?.rejectionReason || "Criteria did not match client requirement.",
          applicationsCount: cApps.length,
        });
      });

      setExcludedBusyCount(busyCount);
      setCandidates(eligibleCandidates);

      // Preselection handler
      const preselectedProjId = searchParams.get("projectId") || searchParams.get("project");
      if (preselectedProjId) {
        const matchingClient = clientList.find((c) =>
          (c.projects || []).some((p) => String(p.id) === String(preselectedProjId))
        );
        const matchingProj = matchingClient?.projects?.find(
          (p) => String(p.id) === String(preselectedProjId)
        );
        if (matchingProj) {
          setSelectedProjectId(String(matchingProj.id));
          setSelectedClientId(matchingClient.id);
          if (matchingProj.manpowerRequirements?.length > 0) {
            setSelectedPosition(
              matchingProj.manpowerRequirements[0].position ||
              matchingProj.manpowerRequirements[0].positionTitle || ""
            );
          }
        }
      }

      if (preselectedCandidateId) {
        const isEligible = eligibleCandidates.some((c) => c.id === preselectedCandidateId);
        if (isEligible) {
          setSelectedCandidateIds([preselectedCandidateId]);
        }
      }
    } catch (err) {
      console.error("Error loading assign candidate data:", err);
      setErrorMessage("Failed to load required data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const allProjects = clients.flatMap((c) =>
    (c.projects || [])
      .filter((p) => {
        const status = (p.status || "Active").toLowerCase();
        if (status !== "active") return false;
        const visibility = (p.vendorVisibility || "").toLowerCase();
        const assignmentType = (p.vendorAssignmentType || "All Vendors").toLowerCase();
        const assignedList = p.assignedVendors || p.assignedVendorIds || [];
        const isSpecific = visibility === "specific" || assignmentType.includes("specific");
        const isAssigned = vendor?.id && assignedList.map(String).includes(String(vendor?.id));
        return !isSpecific || isAssigned || assignedList.length === 0;
      })
      .map((p) => ({
        ...p,
        clientId: c.id,
        clientName: c.companyName || c.name,
      }))
  );

  const selectedProject = allProjects.find((p) => String(p.id) === String(selectedProjectId));
  const availableRequirements = selectedProject?.manpowerRequirements || [];
  const selectedRequirement = availableRequirements.find((r) => r.positionTitle === selectedPosition || r.position === selectedPosition);
  
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

  const handleSelectProjectByName = (projId) => {
    setSelectedProjectId(projId);
    setErrorMessage("");

    const targetProj = allProjects.find((p) => String(p.id) === String(projId));
    if (targetProj) {
      setSelectedClientId(targetProj.clientId);
      if (targetProj.manpowerRequirements?.length > 0) {
        setSelectedPosition(targetProj.manpowerRequirements[0].position || targetProj.manpowerRequirements[0].positionTitle);
      } else {
        setSelectedPosition("");
      }
    } else {
      setSelectedClientId("");
      setSelectedPosition("");
    }
  };

  // Filter candidates by category tab and search text
  const filteredCandidates = candidates.filter((c) => {
    if (categoryFilter !== "All" && c.category !== categoryFilter) {
      return false;
    }
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

  const toggleSelection = (id) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedCandidateIds.length === filteredCandidates.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(filteredCandidates.map((c) => c.id));
    }
  };

  // Quick single-candidate assign action
  const handleDirectAssignCandidate = (candidateId) => {
    setSelectedCandidateIds([candidateId]);
    setErrorMessage("");
    setCurrentStep(2);
  };

  const handleNextStep = () => {
    if (selectedCandidateIds.length === 0) {
      setErrorMessage("Please select at least one candidate to proceed.");
      return;
    }
    setErrorMessage("");
    setCurrentStep(2);
  };

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (selectedCandidateIds.length === 0) {
      setErrorMessage("No candidates selected.");
      return;
    }
    if (!selectedProjectId) {
      setErrorMessage("Please select an active Target Project.");
      return;
    }
    if (!selectedPosition) {
      setErrorMessage("Please select the Target Trade / Position Role.");
      return;
    }

    // Validation for already submitted to this project
    const alreadySubmitted = selectedCandidateIds.filter(cid => 
      applications.some(
        a => a.candidateId === cid && String(a.projectId) === String(selectedProjectId) && a.status !== "Rejected"
      )
    );

    if (alreadySubmitted.length > 0) {
      const names = alreadySubmitted.map(id => candidates.find(c => c.id === id)?.fullName).join(", ");
      setErrorMessage(`The following candidate(s) are already active in this project: ${names}`);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true);
      setErrorMessage("");

      const promises = selectedCandidateIds.map((cid) =>
        crmVendorService.submitCandidateToProject({
          vendorId: vendor?.id || "VND-1001",
          candidateId: cid,
          clientId: selectedClientId,
          projectId: selectedProjectId,
          position: selectedPosition,
        })
      );

      await Promise.all(promises);

      setShowConfirmModal(false);
      setSubmitSuccess({
        count: selectedCandidateIds.length,
        projectName: selectedProject?.projectName || "Project",
        position: selectedPosition
      });
      
      // Reload data - submitted candidates will now automatically be excluded!
      await loadData();
    } catch (err) {
      console.error("Assignment failed:", err);
      setShowConfirmModal(false);
      setErrorMessage(err.message || "Assignment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetFormForNext = () => {
    setSubmitSuccess(null);
    setSelectedCandidateIds([]);
    setSelectedProjectId("");
    setSelectedPosition("");
    setVendorNotes("");
    setErrorMessage("");
    setCurrentStep(1);
  };

  const freshCount = candidates.filter((c) => c.category === "fresh").length;
  const rejectedCount = candidates.filter((c) => c.category === "rejected").length;

  if (loading) {
    return (
      <div className="p-4 max-w-6xl mx-auto flex items-center justify-center min-h-[350px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading assignable candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 max-w-6xl mx-auto space-y-4 font-sans">
      {/* Top Header */}
      <div className="mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link to="/vendor/candidates" className="hover:text-blue-600 font-medium">My Candidates</Link>
              <ChevronRight size={12} />
              <span className="font-bold text-slate-800">Assign Candidate</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="text-blue-600" size={24} />
              <span>Assign Candidate to Project</span>
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Select eligible candidates to deploy. Only <strong className="text-emerald-700">Fresh Candidates</strong> and <strong className="text-rose-700">Rejected Candidates</strong> (ready for re-assignment) are displayed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/vendor/candidates/add"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus size={14} />
              <span>Register New Candidate</span>
            </Link>
          </div>
        </div>

        {/* Quick KPI Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Assignable</span>
            <span className="text-lg font-black text-slate-900">{candidates.length}</span>
            <span className="text-[10px] text-slate-400 block">In available pool</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Fresh Candidates</span>
            <span className="text-lg font-black text-emerald-800">{freshCount}</span>
            <span className="text-[10px] text-emerald-600 block">Never submitted</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 shadow-2xs">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Rejected (Reusable)</span>
            <span className="text-lg font-black text-rose-800">{rejectedCount}</span>
            <span className="text-[10px] text-rose-600 block">Ready to re-assign</span>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 shadow-2xs">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">In Progress / Active</span>
            <span className="text-lg font-black text-indigo-800">{excludedBusyCount}</span>
            <span className="text-[10px] text-indigo-600 block">Selected / Interview (Hidden)</span>
          </div>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-xs">
              <CheckCircle2 size={22} />
            </div>
            <div className="flex-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 mb-1">
                Assignment Successful
              </span>
              <h2 className="text-lg font-black text-slate-900">
                {submitSuccess.count} Candidate(s) Assigned to {submitSuccess.projectName}
              </h2>
              <p className="text-xs text-slate-700 mt-0.5">
                Role: <strong className="text-slate-900">{submitSuccess.position}</strong>. Candidates have been placed under review and excluded from the available roster.
              </p>

              <div className="mt-4 flex flex-wrap gap-2.5">
                <Link
                  to="/vendor/applications"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                >
                  <FileText size={14} />
                  <span>View in Applications</span>
                </Link>
                <button
                  type="button"
                  onClick={resetFormForNext}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  <RotateCcw size={14} className="text-slate-500" />
                  <span>Assign More Candidates</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* STEP 1: Candidate Selection Table */}
      {currentStep === 1 && !submitSuccess && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-xs w-full overflow-hidden flex flex-col">
          {/* Header & Controls */}
          <div className="p-4 sm:p-5 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">1</span>
                  <span>Select Candidate(s) to Assign</span>
                </h2>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Pick candidate(s) to assign to a client project, or click "Assign Project" directly on any row.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedCandidateIds.length > 0 && (
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-200">
                    {selectedCandidateIds.length} Selected
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={selectedCandidateIds.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Proceed to Assign ({selectedCandidateIds.length})</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("All")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    categoryFilter === "All"
                      ? "bg-white text-blue-700 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All Eligible ({candidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("fresh")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    categoryFilter === "fresh"
                      ? "bg-white text-emerald-700 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles size={12} className="text-emerald-500" />
                  <span>Fresh ({freshCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("rejected")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    categoryFilter === "rejected"
                      ? "bg-white text-rose-700 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <RotateCcw size={12} className="text-rose-500" />
                  <span>Rejected ({rejectedCount})</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, ID, trade, passport..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
                />
              </div>
            </div>
          </div>

          {/* Candidates Table */}
          <div className="overflow-x-auto bg-white max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedCandidateIds.length === filteredCandidates.length && filteredCandidates.length > 0}
                      onChange={toggleAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      title="Select all"
                    />
                  </th>
                  <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[10px]">Candidate Details</th>
                  <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[10px]">Trade / Position</th>
                  <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[10px]">Experience</th>
                  <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[10px]">Eligibility Status</th>
                  <th className="py-3 px-4 text-right font-bold text-slate-700 uppercase tracking-wider text-[10px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-500">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Users size={32} className="mx-auto text-slate-300" />
                        <p className="font-bold text-slate-700">No candidates available for assignment.</p>
                        <p className="text-[11px] text-slate-400">
                          {candidates.length === 0
                            ? "All registered candidates are currently in review, shortlisted, or selected."
                            : "No candidates match the current filter or search criteria."}
                        </p>
                        <Link
                          to="/vendor/candidates/add"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold mt-2"
                        >
                          <Plus size={13} />
                          <span>Register New Candidate</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((c) => (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        selectedCandidateIds.includes(c.id) ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCandidateIds.includes(c.id)}
                          onChange={() => toggleSelection(c.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {c.photo ? (
                            <img
                              src={c.photo}
                              alt={c.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                              {c.fullName ? c.fullName.charAt(0) : "C"}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{c.fullName}</span>
                              <span className="text-[10px] font-mono text-slate-400">({c.id})</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>Pass: {c.passportNumber || "N/A"}</span>
                              {c.phoneNumber && <span>• {c.phoneNumber}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{c.currentPosition || "General Labor"}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-700 flex items-center gap-1">
                          <Briefcase size={12} className="text-slate-400" />
                          <span>{c.experienceYears || 0} yrs</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">{c.qualification || "Trade Certified"}</span>
                      </td>
                      <td className="py-3 px-4">
                        {c.category === "fresh" ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Sparkles size={11} className="text-emerald-600 shrink-0" />
                              <span>Fresh Candidate</span>
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                              Ready for first project
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <RotateCcw size={11} className="text-rose-600 shrink-0" />
                              <span>Rejected (Reusable)</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block mt-0.5 truncate max-w-[150px]" title={c.lastRejectionReason}>
                              Prev: {c.lastProjectInfo || "Previous Project"}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDirectAssignCandidate(c.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                          title="Assign this candidate to a project"
                        >
                          <Send size={11} />
                          <span>Assign Project</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Summary */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="text-slate-500">
              Showing <strong className="text-slate-900">{filteredCandidates.length}</strong> of {candidates.length} assignable candidate(s)
            </span>
            {selectedCandidateIds.length > 0 && (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Proceed with {selectedCandidateIds.length} candidate(s)</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Project Selection Form */}
      {currentStep === 2 && !submitSuccess && (
        <form onSubmit={handleOpenConfirm} className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">2</span>
                  <span>Assign to Project Details</span>
                </h2>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  Select target project and trade role for the <strong className="text-blue-700">{selectedCandidateIds.length} selected candidate(s)</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Back to Candidates List
              </button>
            </div>

            {/* Selected Candidates Preview Strip */}
            <div className="mb-4 p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-xs">
              <span className="font-bold text-blue-900 block mb-1">
                Selected Candidate(s) for Assignment ({selectedCandidateIds.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidateIds.map((cid) => {
                  const c = candidates.find((cand) => cand.id === cid);
                  return (
                    <span
                      key={cid}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[11px] font-bold text-slate-800"
                    >
                      <span>{c?.fullName || cid}</span>
                      <span className="text-[10px] text-slate-400">({c?.currentPosition || "Trade"})</span>
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                  Select Project Name <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleSelectProjectByName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  required
                >
                  <option value="">-- Choose Target Project --</option>
                  {allProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName} ({p.country}) - {p.clientName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                  Target Trade / Position Role <span className="text-rose-500">*</span>
                </label>
                {availableRequirements.length > 0 ? (
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    required
                  >
                    <option value="">-- Select Project Position --</option>
                    {availableRequirements.map((req, idx) => (
                      <option key={req.id || idx} value={req.position || req.positionTitle}>
                        {req.position || req.positionTitle} ({req.quantity} required)
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    placeholder="Enter Trade / Position title..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    required
                  />
                )}
              </div>
            </div>

            {selectedProject && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-1.5 mb-2">
                  <span>Project Overview & Vacancy Status</span>
                  <span className="text-blue-600 font-extrabold">{selectedProject.country}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Positions Required</span>
                    <span className="font-black text-slate-900">
                      {requiredHeadcount || selectedProject.totalManpowerRequired || "Flexible"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">In Selection / Shortlist</span>
                    <span className="font-black text-slate-900">{selectedOrShortlisted} candidates</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                Vendor Submission Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={vendorNotes}
                onChange={(e) => setVendorNotes(e.target.value)}
                placeholder="Add trade qualification, GCC experience highlights or availability remarks for client review..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="py-2.5 px-4 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!selectedProjectId || !selectedPosition}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <UserCheck size={16} />
                <span>Assign {selectedCandidateIds.length} Candidate(s)</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-300 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Confirm Project Assignment</h3>
                <p className="text-xs text-slate-500">
                  Verify details before assigning {selectedCandidateIds.length} candidates.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Candidates Selected:</span>
                <span className="font-bold text-slate-900">{selectedCandidateIds.length} Candidates</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Target Project:</span>
                <span className="font-bold text-blue-700">
                  {selectedProject?.projectName} ({selectedProject?.country})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Trade / Role:</span>
                <span className="font-bold text-slate-900">{selectedPosition}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              * Note: Once assigned, candidates will be placed into the project review pipeline and removed from this list.
            </p>

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
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <span>Confirm Assignment</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
