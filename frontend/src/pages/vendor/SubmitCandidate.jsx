import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Users,
  AlertCircle,
  Plus,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";
import { crmClientService } from "../../services/crmClientService.js";
import { initialClients } from "../../data/mockClients.js";

import SubmissionStepsNav from "../../components/vendor/candidate-submission/SubmissionStepsNav.jsx";
import CandidatePoolFilterCards from "../../components/vendor/candidate-submission/CandidatePoolFilterCards.jsx";
import CandidateSelectionTable from "../../components/vendor/candidate-submission/CandidateSelectionTable.jsx";
import {
  ProjectAssignmentForm,
  ConfirmSubmissionModal,
  SubmissionSuccessBanner,
} from "../../components/vendor/candidate-submission/ProjectAssignmentForm.jsx";

export default function SubmitCandidate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedCandidateId = searchParams.get("candidateId");

  const [vendor, setVendor] = useState(null);
  const [clients, setClients] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [busyCandidates, setBusyCandidates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [availableProjectsList, setAvailableProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentStep, setCurrentStep] = useState(1);

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(
    preselectedCandidateId ? [preselectedCandidateId] : []
  );
  const [vendorNotes, setVendorNotes] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");

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

      const [clientRes, candRes, appRes, availProjects] = await Promise.all([
        crmClientService.getClients({ limit: 100 }),
        crmVendorService.getCandidates(curVendor?.id),
        crmVendorService.getApplications(curVendor?.id),
        crmVendorService.getAvailableProjects(curVendor?.id),
      ]);

      let clientList = clientRes?.clients || [];
      if (!clientList.length) {
        try {
          const raw =
            localStorage.getItem("crm_clients_data_v3") ||
            localStorage.getItem("crm_clients_data_v2") ||
            "[]";
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) clientList = parsed;
        } catch {}
      }
      if (!clientList.length && Array.isArray(initialClients) && initialClients.length > 0) {
        clientList = initialClients;
      }
      setClients(clientList);
      setApplications(appRes || []);

      const allFound = [];
      const seenProjIds = new Set();
      const addProj = (p, c) => {
        if (!p) return;
        const key = String(p.id || p.projectId || p._id || "");
        if (!key) return;
        if (!seenProjIds.has(key)) {
          seenProjIds.add(key);
          allFound.push({
            ...p,
            id: key,
            clientId: p.clientId || c?.id || c?._id,
            clientName: p.clientName || c?.companyName || c?.name || "Direct Client",
          });
        }
      };

      if (Array.isArray(availProjects)) {
        availProjects.forEach((p) => addProj(p, null));
      }
      clientList.forEach((c) => {
        if (Array.isArray(c.projects)) {
          c.projects.forEach((p) => addProj(p, c));
        }
      });
      setAvailableProjectsList(allFound);

      const allCands = candRes || [];
      const rawApps = appRes || [];
      const activeStages = [
        "Applied",
        "Screening",
        "Shortlisted",
        "Interview Scheduled",
        "Interview",
        "Selected",
        "Offer Released",
        "Visa Processing",
        "Under Review",
      ];

      const busyMap = new Map();
      rawApps.forEach((app) => {
        const cId = String(app.candidateId || app.candidate?.id || "");
        const stage = app.recruitmentStage || app.status || "";
        if (cId && activeStages.includes(stage)) {
          busyMap.set(cId, app);
        }
      });

      const assignableList = [];
      const inProgressList = [];

      allCands.forEach((cand) => {
        const cid = String(cand.id);
        const activeApp = busyMap.get(cid);

        if (activeApp) {
          inProgressList.push({
            ...cand,
            category: "in_progress",
            activeApp,
            activeStatus: activeApp.recruitmentStage || activeApp.status,
            activeProjectName: activeApp.projectName || "Assigned Project",
            activeProjectId: activeApp.projectId,
            interviewDetails: activeApp.interviewDetails || null,
          });
        } else {
          const candApps = rawApps.filter((a) => String(a.candidateId || a.candidate?.id) === cid);
          const wasRejected = candApps.some((a) => a.recruitmentStage === "Rejected" || a.status === "Rejected");
          const lastRejectedApp = candApps.find((a) => a.recruitmentStage === "Rejected" || a.status === "Rejected");

          assignableList.push({
            ...cand,
            category: wasRejected ? "rejected" : "fresh",
            lastRejectionReason: lastRejectedApp?.rejectionReason || "Position closed / Not selected",
            lastProjectInfo: lastRejectedApp ? `${lastRejectedApp.projectName} (${lastRejectedApp.position || "Role"})` : null,
          });
        }
      });

      setCandidates(assignableList);
      setBusyCandidates(inProgressList);

      if (preselectedCandidateId) {
        setSelectedCandidateIds([preselectedCandidateId]);
        setCurrentStep(2);
      }
    } catch (err) {
      setErrorMessage("Failed to load candidate roster: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const allProjects = useMemo(() => availableProjectsList, [availableProjectsList]);

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return allProjects.find((p) => String(p.id) === String(selectedProjectId)) || null;
  }, [allProjects, selectedProjectId]);

  const availableRequirements = useMemo(() => {
    if (!selectedProject) return [];
    return selectedProject.requirements || selectedProject.jobRequirements || [];
  }, [selectedProject]);

  const requiredHeadcount = useMemo(() => {
    if (!selectedPosition) return null;
    const req = availableRequirements.find(
      (r) => (r.position || r.positionTitle)?.toLowerCase() === selectedPosition.toLowerCase()
    );
    return req ? Number(req.quantity) || 0 : null;
  }, [availableRequirements, selectedPosition]);

  const selectedOrShortlisted = useMemo(() => {
    if (!selectedProjectId) return 0;
    return applications.filter(
      (a) =>
        String(a.projectId) === String(selectedProjectId) &&
        ["Selected", "Shortlisted", "Visa Processing"].includes(a.recruitmentStage || a.status)
    ).length;
  }, [applications, selectedProjectId]);

  const filteredCandidates = useMemo(() => {
    let list = [];
    if (categoryFilter === "in_progress") {
      list = [...busyCandidates];
    } else {
      list = [...candidates];
      if (categoryFilter === "fresh") list = list.filter((c) => c.category === "fresh");
      else if (categoryFilter === "rejected") list = list.filter((c) => c.category === "rejected");
    }

    if (candidateSearch.trim()) {
      const q = candidateSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.fullName?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q) ||
          c.currentPosition?.toLowerCase().includes(q) ||
          c.passportNumber?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [candidates, busyCandidates, categoryFilter, candidateSearch]);

  const freshCount = useMemo(() => candidates.filter((c) => c.category === "fresh").length, [candidates]);
  const rejectedCount = useMemo(() => candidates.filter((c) => c.category === "rejected").length, [candidates]);

  const toggleSelection = (candidateId) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candidateId) ? prev.filter((id) => id !== candidateId) : [...prev, candidateId]
    );
  };

  const toggleAll = () => {
    if (selectedCandidateIds.length === filteredCandidates.length && filteredCandidates.length > 0) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(filteredCandidates.map((c) => c.id));
    }
  };

  const handleNextStep = () => {
    if (selectedCandidateIds.length === 0) {
      setErrorMessage("Please select at least 1 candidate to proceed.");
      return;
    }
    setErrorMessage("");
    setCurrentStep(2);
  };

  const handleDirectAssignCandidate = (candidateId) => {
    setSelectedCandidateIds([candidateId]);
    setErrorMessage("");
    setCurrentStep(2);
  };

  const handleSelectProjectByName = (projId) => {
    setSelectedProjectId(projId);
    const proj = allProjects.find((p) => String(p.id) === String(projId));
    if (proj) {
      const reqs = proj.requirements || proj.jobRequirements || [];
      if (reqs.length > 0) {
        setSelectedPosition(reqs[0].position || reqs[0].positionTitle || "");
      } else {
        setSelectedPosition("");
      }
    }
  };

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setErrorMessage("Please select a target Project.");
      return;
    }
    if (!selectedPosition) {
      setErrorMessage("Please select or enter the Trade/Position.");
      return;
    }
    setErrorMessage("");
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setErrorMessage("");

    try {
      const projectObj = selectedProject;
      const clientObj = clients.find((c) => String(c.id) === String(projectObj?.clientId)) || null;

      const submissions = selectedCandidateIds.map((cId) => {
        const cand = candidates.find((c) => c.id === cId) || {};
        return {
          candidateId: cId,
          candidateName: cand.fullName,
          candidatePhone: cand.phoneNumber,
          candidateEmail: cand.email,
          passportNumber: cand.passportNumber,
          clientId: projectObj?.clientId || clientObj?.id,
          clientName: projectObj?.clientName || clientObj?.companyName || "Direct Client",
          projectId: selectedProjectId,
          projectName: projectObj?.projectName || projectObj?.name || "Overseas Project",
          position: selectedPosition,
          destinationCountry: projectObj?.country || "Overseas",
          vendorId: vendor?.id || "VND-1001",
          vendorName: vendor?.companyName || "Partner Agency",
          notes: vendorNotes,
          submittedAt: new Date().toISOString(),
          status: "Under Review",
          recruitmentStage: "Screening",
        };
      });

      await crmVendorService.submitBatchCandidates(submissions);

      setSubmitSuccess({
        count: submissions.length,
        projectName: projectObj?.projectName || "Overseas Project",
        position: selectedPosition,
      });

      setSelectedCandidateIds([]);
      setVendorNotes("");
      setSelectedProjectId("");
      setSelectedPosition("");
      setCurrentStep(1);

      await loadData();
    } catch (err) {
      setErrorMessage(err.message || "Failed to submit candidates.");
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
    setCurrentStep(1);
    loadData();
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 max-w-4xl mx-auto my-6">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-700">Loading candidate assignment workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl w-full mx-auto font-sans antialiased text-slate-800 pb-10 text-xs">
      {/* Step Indicator */}
      <SubmissionStepsNav currentStep={currentStep} setCurrentStep={setCurrentStep} />

      {/* Header Banner */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              <span>Assign Candidates to Client Projects</span>
            </h1>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              Allocate verified candidates from your agency roster to active client projects.
            </p>
          </div>
          <Link
            to="/vendor/candidates/add"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            <Plus size={13} />
            <span>Register New Candidate</span>
          </Link>
        </div>

        <CandidatePoolFilterCards
          totalCandidates={candidates.length}
          freshCount={freshCount}
          rejectedCount={rejectedCount}
          busyCandidatesCount={busyCandidates.length}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
        />
      </div>

      <SubmissionSuccessBanner submitSuccess={submitSuccess} onReset={resetFormForNext} />

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <p>{errorMessage}</p>
        </div>
      )}

      {currentStep === 1 && !submitSuccess && (
        <CandidateSelectionTable
          candidates={candidates}
          filteredCandidates={filteredCandidates}
          selectedCandidateIds={selectedCandidateIds}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          candidateSearch={candidateSearch}
          setCandidateSearch={setCandidateSearch}
          freshCount={freshCount}
          rejectedCount={rejectedCount}
          busyCandidates={busyCandidates}
          toggleSelection={toggleSelection}
          toggleAll={toggleAll}
          onDirectAssign={handleDirectAssignCandidate}
        />
      )}

      {currentStep === 2 && !submitSuccess && (
        <ProjectAssignmentForm
          selectedCandidateIds={selectedCandidateIds}
          candidates={candidates}
          allProjects={allProjects}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProjectByName}
          selectedPosition={selectedPosition}
          setSelectedPosition={setSelectedPosition}
          availableRequirements={availableRequirements}
          selectedProject={selectedProject}
          requiredHeadcount={requiredHeadcount}
          selectedOrShortlisted={selectedOrShortlisted}
          vendorNotes={vendorNotes}
          setVendorNotes={setVendorNotes}
          onBack={() => setCurrentStep(1)}
          onSubmit={handleOpenConfirm}
          onRefreshProjects={async () => {
            try {
              const projs = await crmVendorService.getAvailableProjects(vendor?.id);
              setAvailableProjectsList(projs || []);
            } catch {}
          }}
        />
      )}

      <ConfirmSubmissionModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        selectedCandidateIds={selectedCandidateIds}
        selectedProject={selectedProject}
        selectedPosition={selectedPosition}
        candidates={candidates}
        onConfirm={handleConfirmSubmit}
        submitting={submitting}
      />
    </div>
  );
}
