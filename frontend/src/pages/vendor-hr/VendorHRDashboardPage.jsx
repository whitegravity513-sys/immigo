import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Award,
  Plane,
  LogOut,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  User,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import vendorHRService from "../../services/vendorHRService.js";
import crmVendorService from "../../services/crmVendorService.js";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";
import ActiveMeetingAlertBanner from "../../components/common/meeting/ActiveMeetingAlertBanner.jsx";
import { formatSalary } from "../../components/vendor-hr/shared/vendorHRUtils.jsx";
import AdminMasterLayout from "../../components/admin/layout/AdminMasterLayout.jsx";
import AssignHRSection from "../../components/admin/hr/AssignHRSection.jsx";
import NotificationBell from "../../components/admin/NotificationBell.jsx";

// Modular Section Components
import VendorHROverviewSection from "../../components/vendor-hr/sections/VendorHROverviewSection.jsx";
import VendorHRProjectsSection from "../../components/vendor-hr/sections/VendorHRProjectsSection.jsx";
import VendorHRJobsSection from "../../components/vendor-hr/sections/VendorHRJobsSection.jsx";
import VendorHRCandidatesSection from "../../components/vendor-hr/sections/VendorHRCandidatesSection.jsx";
import VendorHRShortlistedSection from "../../components/vendor-hr/sections/VendorHRShortlistedSection.jsx";
import VendorHRInterviewsSection from "../../components/vendor-hr/sections/VendorHRInterviewsSection.jsx";
import VendorHRMilestonesSection from "../../components/vendor-hr/sections/VendorHRMilestonesSection.jsx";
import VendorHRVisaAllottedSection from "../../components/vendor-hr/sections/VendorHRVisaAllottedSection.jsx";
import VendorHROnHoldSection from "../../components/vendor-hr/sections/VendorHROnHoldSection.jsx";
import VendorHRRejectedSection from "../../components/vendor-hr/sections/VendorHRRejectedSection.jsx";
import VendorHRProfileSection from "../../components/vendor-hr/sections/VendorHRProfileSection.jsx";

// Modular Modal Components
import VendorHRSubmitModal from "../../components/vendor-hr/modals/VendorHRSubmitModal.jsx";
import VendorHRCandidateModal from "../../components/vendor-hr/modals/VendorHRCandidateModal.jsx";
import VendorHRScheduleModal from "../../components/vendor-hr/modals/VendorHRScheduleModal.jsx";
import VendorHRFeedbackModal from "../../components/vendor-hr/modals/VendorHRFeedbackModal.jsx";
import VendorHRReassignModal from "../../components/vendor-hr/modals/VendorHRReassignModal.jsx";
import VendorHRMilestoneStepperModal from "../../components/vendor-hr/modals/VendorHRMilestoneStepperModal.jsx";

export default function VendorHRDashboardPage() {
  const { user, logout, updateUser, isSuperAdmin: authIsSuperAdmin, isAdmin: authIsAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isSuperAdmin = Boolean(
    authIsSuperAdmin ||
      user?.isSuperAdmin ||
      ["SUPER_ADMIN", "SUPERADMIN"].includes(String(user?.role || "").toUpperCase())
  );
  const isAdmin = Boolean(
    authIsAdmin ||
      isSuperAdmin ||
      String(user?.role || "").toUpperCase() === "ADMIN"
  );
  const hideProjectNames = !isSuperAdmin && !isAdmin;
  const userId = user?.id || user?._id || "";

  const hrUserName =
    user?.name ||
    user?.fullName ||
    (isSuperAdmin ? "Super Admin" : isAdmin ? "Admin Officer" : "Vendor HR Officer");

  const initialView = searchParams.get("view") || "overview";
  const [activeMenu, setActiveMenu] = useState(
    !isSuperAdmin && !isAdmin && initialView === "assignments" ? "overview" : initialView
  );

  const handleSelectMenu = (menuId) => {
    setActiveMenu(menuId);
    setSearchParams({ view: menuId });
  };

  useEffect(() => {
    const qView = searchParams.get("view") || "overview";
    const resolvedView =
      !isSuperAdmin && !isAdmin && qView === "assignments" ? "overview" : qView;
    const t = setTimeout(() => {
      setActiveMenu((prev) => (prev !== resolvedView ? resolvedView : prev));
    }, 0);
    if (!isSuperAdmin && !isAdmin && qView === "assignments") {
      setSearchParams({ view: "overview" }, { replace: true });
    }
    return () => clearTimeout(t);
  }, [searchParams, isSuperAdmin, isAdmin, setSearchParams]);

  // Master State Data
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [dashboardData, setDashboardData] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateStageFilter, setCandidateStageFilter] = useState("ALL");
  const [detailedProject, setDetailedProject] = useState(null);
  const [selectedMilestoneApp, setSelectedMilestoneApp] = useState(null);
  const [milestoneSearchQuery, setMilestoneSearchQuery] = useState("");
  const [milestoneStageFilter, setMilestoneStageFilter] = useState("ALL");

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleInterviewTarget, setScheduleInterviewTarget] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackInterviewTarget, setFeedbackInterviewTarget] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignTargetCandidate, setReassignTargetCandidate] = useState(null);
  const [showMilestoneStepperModal, setShowMilestoneStepperModal] = useState(false);
  const [selectedMilestoneCandidate, setSelectedMilestoneCandidate] = useState(null);
  const [completingStageId, setCompletingStageId] = useState(null);
  const [stageCompletionRemark, setStageCompletionRemark] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Form states
  const [submitForm, setSubmitForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    projectId: "",
    jobId: "",
    experience: "3-5 Years",
    skills: "",
    resumeUrl: "",
    notes: "",
  });

  const [candidateUpdateForm, setCandidateUpdateForm] = useState({
    stage: "Applied",
    remarks: "",
    salary: "",
    offerStatus: "Pending",
    joiningDate: "",
    visaStatus: "Not Started",
    visaNumber: "",
    departureDate: "",
    flightDetails: "",
  });

  const [scheduleForm, setScheduleForm] = useState({
    applicationId: "",
    round: "Technical Interview",
    scheduledDate: "",
    startTime: "10:00 AM",
    interviewerName: "Vendor HR",
    interviewLink: "https://meet.google.com/new",
    notes: "",
  });

  const [feedbackForm, setFeedbackForm] = useState({
    rating: 4,
    recommendation: "Shortlist",
    feedback: "",
  });

  const [reassignForm, setReassignForm] = useState({
    projectId: "",
    projectName: "",
    jobId: "",
    jobTitle: "",
    notes: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const defaultVendorName = useMemo(() => {
    const apiVendors = Array.isArray(dashboardData?.vendors) ? dashboardData.vendors : [];
    const apiNames = apiVendors.map((v) => v?.companyName || v?.name).filter(Boolean);
    if (apiNames.length === 1) return apiNames[0];
    if (apiNames.length > 1) return `${apiNames[0]} (+${apiNames.length - 1})`;
    if (dashboardData?.vendor?.companyName) return dashboardData.vendor.companyName;
    const userVendors = Array.isArray(user?.vendors) ? user.vendors : [];
    const userNames = userVendors.map((v) => v?.companyName || v?.name).filter(Boolean);
    if (userNames.length === 1) return userNames[0];
    if (userNames.length > 1) return `${userNames[0]} (+${userNames.length - 1})`;
    return user?.organizationName || user?.companyName || user?.agencyName || "";
  }, [dashboardData, user]);

  const userAssignedVendorsRef = useRef([]);
  const loadDataRef = useRef(null);
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    userAssignedVendorsRef.current = Array.isArray(user?.assignedVendors)
      ? user.assignedVendors.map(String)
      : [];
  }, [user?.assignedVendors]);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const params = selectedProject && selectedProject !== "ALL" ? { projectId: selectedProject } : {};
      const [res] = await Promise.all([
        vendorHRService.getDashboard(params),
        crmVendorService.getAvailableProjects?.().catch(() => []),
      ]);
      const data = res?.data || res;
      const nextApps = data?.applications || [];
      setDashboardData(data);
      setProjectsList(data?.projects || []);
      setApplications(nextApps);
      setInterviews(data?.interviews || []);
      setJobs(data?.jobs || []);
      setActivities(data?.activities || []);

      setSelectedMilestoneApp((prev) => {
        if (!prev) return null;
        const prevId = String(prev.applicationId || prev.id || prev._id || "");
        const updated = nextApps.find(
          (a) => String(a.applicationId || a.id || a._id || "") === prevId
        );
        return updated || prev;
      });
      setSelectedMilestoneCandidate((prev) => {
        if (!prev) return null;
        const prevId = String(prev.applicationId || prev.id || prev._id || "");
        const updated = nextApps.find(
          (a) => String(a.applicationId || a.id || a._id || "") === prevId
        );
        return updated || prev;
      });

      if (!isSuperAdmin && !isAdmin && Array.isArray(data?.assignedVendors)) {
        const current = userAssignedVendorsRef.current;
        const next = data.assignedVendors.map(String);
        if (JSON.stringify(current) !== JSON.stringify(next)) {
          updateUser({
            assignedVendors: next,
            ...(Array.isArray(data?.vendors) ? { vendors: data.vendors } : {}),
          });
        }
      }
      lastRefreshAtRef.current = Date.now();
      return { applications: nextApps, projects: data?.projects || [] };
    } catch (err) {
      console.warn("Using fallback vendor HR dataset:", err);
      try {
        const [crmApps, crmProjects] = await Promise.all([
          crmVendorService.getApplications(),
          crmVendorService.getAvailableProjects?.().catch(() => []),
        ]);
        setApplications(crmApps || []);
        if (Array.isArray(crmProjects) && crmProjects.length > 0) {
          setProjectsList(crmProjects);
        }
        return { applications: crmApps || [], projects: crmProjects || [] };
      } catch {
        if (!silent) showToast("Error connecting to server. Please refresh.", "error");
        return { applications: [], projects: [] };
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedProject, isSuperAdmin, isAdmin, updateUser]);

  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  useEffect(() => {
    if ((isSuperAdmin || isAdmin) && activeMenu === "assignments") return;
    loadDataRef.current?.();
  }, [userId, selectedProject, isSuperAdmin, isAdmin]);

  useEffect(() => {
    if ((isSuperAdmin || isAdmin) && activeMenu === "assignments") return;
    const handleImmediateRefresh = () => {
      loadDataRef.current?.({ silent: true });
    };
    const handleFocusOrVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      if (Date.now() - lastRefreshAtRef.current < 3000) return;
      loadDataRef.current?.({ silent: true });
    };
    window.addEventListener("immigo:vendor-hr-refresh", handleImmediateRefresh);
    window.addEventListener("immigo:application-update", handleImmediateRefresh);
    window.addEventListener("immigo:dashboard-update", handleImmediateRefresh);
    window.addEventListener("storage", handleImmediateRefresh);
    window.addEventListener("focus", handleFocusOrVisibility);
    document.addEventListener("visibilitychange", handleFocusOrVisibility);
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        loadDataRef.current?.({ silent: true });
      }
    }, 20000);
    return () => {
      window.removeEventListener("immigo:vendor-hr-refresh", handleImmediateRefresh);
      window.removeEventListener("immigo:application-update", handleImmediateRefresh);
      window.removeEventListener("immigo:dashboard-update", handleImmediateRefresh);
      window.removeEventListener("storage", handleImmediateRefresh);
      window.removeEventListener("focus", handleFocusOrVisibility);
      document.removeEventListener("visibilitychange", handleFocusOrVisibility);
      clearInterval(interval);
    };
  }, [isSuperAdmin, isAdmin, activeMenu]);

  // Immediate Tag Navigation
  const navigateByTag = (stageOrTag, cand = null) => {
    const s = (stageOrTag || "").toLowerCase();
    let target = "candidates";
    if (s.includes("shortlist")) {
      target = "shortlisted";
    } else if (s.includes("interview")) {
      target = "interviews";
    } else if (s.includes("select") || s.includes("processing") || s.includes("completed")) {
      target = "milestones";
      if (cand) setSelectedMilestoneApp(cand);
    } else if (s.includes("visa") || s.includes("joined") || s.includes("deploy")) {
      target = "visa-allotted";
    } else if (s.includes("hold")) {
      target = "on-hold";
    } else if (s.includes("reject")) {
      target = "rejected";
    }
    handleSelectMenu(target);
  };

  const handleCandidateSubmit = async (e) => {
    e.preventDefault();
    if (!submitForm.fullName || !submitForm.email || !submitForm.projectId) {
      showToast("Please fill in candidate name, email, and target selection.", "error");
      return;
    }
    try {
      setActionLoading(true);
      const vendorId =
        dashboardData?.assignedVendors?.[0] ||
        user?.assignedVendors?.[0] ||
        dashboardData?.vendor?.vendorId ||
        "";
      const prj = projectsList.find((p) => p.projectId === submitForm.projectId);
      const jb = jobs.find((j) => j.jobId === submitForm.jobId);

      await vendorHRService.submitCandidate({
        fullName: submitForm.fullName.trim(),
        email: submitForm.email.trim(),
        phone: submitForm.phone.trim(),
        projectId: submitForm.projectId,
        projectName: prj?.projectName || "Assigned Project",
        jobId: submitForm.jobId,
        jobTitle: jb?.title || "Technician",
        vendorId,
        vendorName: dashboardData?.vendor?.companyName || defaultVendorName || user?.name || "",
        skills: submitForm.skills ? submitForm.skills.split(",").map((s) => s.trim()) : [],
        notes: submitForm.notes,
      });

      showToast("Candidate submitted successfully!");
      setShowSubmitModal(false);
      setSubmitForm({
        fullName: "",
        email: "",
        phone: "",
        projectId: "",
        jobId: "",
        experience: "3-5 Years",
        skills: "",
        resumeUrl: "",
        notes: "",
      });
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to submit candidate", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openCandidateModal = (cand) => {
    setSelectedCandidate(cand);
    const rawStage = cand.recruitmentStage || cand.status || "Applied";
    const normalizedStage =
      rawStage === "Interview"
        ? "Interview Scheduled"
        : rawStage === "Visa Allotted"
        ? "Visa Issued"
        : rawStage;
    const rawSal = cand.offerDetails?.salary || cand.salary || "";
    setCandidateUpdateForm({
      stage: normalizedStage,
      remarks: "",
      salary: rawSal ? formatSalary(rawSal) : "",
      offerStatus: cand.offerDetails?.offerStatus || "Pending",
      joiningDate: cand.offerDetails?.joiningDate ? new Date(cand.offerDetails.joiningDate).toISOString().split("T")[0] : "",
      visaStatus: cand.visaDetails?.visaStatus || "Not Started",
      visaNumber: cand.visaDetails?.visaNumber || "",
      departureDate: cand.visaDetails?.departureDate ? new Date(cand.visaDetails.departureDate).toISOString().split("T")[0] : "",
      flightDetails: cand.visaDetails?.flightDetails || "",
    });
    setShowCandidateModal(true);
  };

  // Save Candidate Stage & Details Update
  const handleCandidateUpdate = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    try {
      setActionLoading(true);
      const appId = selectedCandidate.applicationId || selectedCandidate.id || selectedCandidate._id;
      await vendorHRService.updateCandidateStage(appId, {
        stage: candidateUpdateForm.stage,
        remarks: candidateUpdateForm.remarks || `Stage updated to ${candidateUpdateForm.stage}`,
        offerDetails: {
          salary: candidateUpdateForm.salary,
          offerStatus: candidateUpdateForm.offerStatus,
          joiningDate: candidateUpdateForm.joiningDate ? new Date(candidateUpdateForm.joiningDate) : null,
          offerDate: new Date(),
        },
        visaDetails: {
          visaStatus: candidateUpdateForm.visaStatus,
          visaNumber: candidateUpdateForm.visaNumber,
          flightDetails: candidateUpdateForm.flightDetails,
          departureDate: candidateUpdateForm.departureDate ? new Date(candidateUpdateForm.departureDate) : null,
        },
      });

      showToast(`Candidate stage updated to ${candidateUpdateForm.stage}!`);
      setShowCandidateModal(false);
      await loadData();
      navigateByTag(candidateUpdateForm.stage, selectedCandidate);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to update candidate", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await vendorHRService.scheduleInterview({
        applicationId:
          scheduleInterviewTarget?.applicationId ||
          scheduleInterviewTarget?.id ||
          scheduleForm.applicationId,
        round: scheduleForm.round,
        scheduledDate: scheduleForm.scheduledDate,
        startTime: scheduleForm.startTime,
        interviewerName: scheduleForm.interviewerName,
        interviewLink: scheduleForm.interviewLink,
        notes: scheduleForm.notes,
      });

      showToast("Interview round scheduled successfully!");
      setShowScheduleModal(false);
      setScheduleInterviewTarget(null);
      await loadData();
      setActiveMenu("interviews");
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to schedule interview", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Record Feedback Submit
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackInterviewTarget) return;
    try {
      setActionLoading(true);
      await vendorHRService.recordInterviewFeedback(
        feedbackInterviewTarget.interviewId || feedbackInterviewTarget._id,
        feedbackForm
      );
      showToast("Interview evaluation recorded successfully!");
      setShowFeedbackModal(false);
      setFeedbackInterviewTarget(null);
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to record feedback", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Action: Shortlist, Select, or Reject directly
  const handleQuickStage = async (cand, newStage, remarks = "") => {
    try {
      setActionLoading(true);
      const appId = cand.applicationId || cand.id || cand._id;
      await vendorHRService.updateCandidateStage(appId, {
        stage: newStage,
        remarks: remarks || `Candidate marked as ${newStage} by Vendor HR screening`,
      });
      try {
        const crmExtra =
          newStage === "Rejected"
            ? { rejectionReason: remarks || "Rejected during Vendor HR review" }
            : { remark: remarks || `Candidate marked as ${newStage} by Vendor HR` };
        await crmVendorService.updateApplicationStatus(appId, newStage, crmExtra);
      } catch (crmErr) {
        console.warn("crmVendorService status sync fallback:", crmErr?.message || crmErr);
      }
      showToast(`Candidate [${cand.candidateName}] updated to ${newStage}!`);
      const reloaded = await loadData({ silent: true });
      const freshCand =
        (reloaded?.applications || []).find(
          (a) => String(a.applicationId || a.id || a._id || "") === String(appId)
        ) || cand;
      navigateByTag(newStage, freshCand);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to update candidate stage", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openReassignModal = (cand) => {
    setReassignTargetCandidate(cand);
    const otherProj = projectsList.find((p) => p.projectId !== cand.projectId) || projectsList[0];
    const initialJob = jobs.find((j) => j.projectId === otherProj?.projectId);
    setReassignForm({
      projectId: otherProj?.projectId || "",
      projectName: otherProj?.projectName || "",
      jobId: initialJob?.jobId || "",
      jobTitle: initialJob?.title || "",
      notes: hideProjectNames
        ? "Reassigned from rejected pipeline"
        : `Reassigned from rejected project [${cand.projectName || cand.projectId}]`,
    });
    setShowReassignModal(true);
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassignTargetCandidate || !reassignForm.projectId) {
      showToast("Please select a target allocation for reassignment.", "error");
      return;
    }
    try {
      setActionLoading(true);
      const appId = reassignTargetCandidate.applicationId || reassignTargetCandidate.id || reassignTargetCandidate._id;
      const targetProj = projectsList.find((p) => p.projectId === reassignForm.projectId);
      const targetJob = jobs.find((j) => j.jobId === reassignForm.jobId);

      await vendorHRService.reassignCandidate(appId, {
        projectId: reassignForm.projectId,
        projectName: targetProj?.projectName || "Overseas Project",
        jobId: reassignForm.jobId,
        jobTitle: targetJob?.title || reassignForm.jobTitle || targetProj?.projectName,
        notes: reassignForm.notes || "Candidate re-applied to new opening",
      });

      showToast(
        hideProjectNames
          ? `Candidate [${reassignTargetCandidate.candidateName}] reassigned successfully!`
          : `Candidate [${reassignTargetCandidate.candidateName}] reassigned to ${targetProj?.projectName || "new project"}!`
      );
      setShowReassignModal(false);
      setReassignTargetCandidate(null);
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to reassign candidate", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Stepper handlers
  const handleCompleteMilestoneStage = async (milestoneId, stageId) => {
    if (!stageCompletionRemark.trim()) {
      showToast("Please enter verification remarks before completing this stage.", "error");
      return;
    }
    try {
      setActionLoading(true);
      const candAppId = selectedMilestoneCandidate.applicationId || selectedMilestoneCandidate.id;
      const updatedApp = await crmVendorService.completeStage(
        candAppId,
        milestoneId,
        stageId,
        stageCompletionRemark.trim(),
        "Vendor HR",
        selectedMilestoneCandidate
      );

      try {
        await vendorHRService.updateCandidateStage(candAppId, {
          stage: selectedMilestoneCandidate?.recruitmentStage || selectedMilestoneCandidate?.status || "Selected",
          processMilestones: updatedApp.processMilestones,
          remarks: `Stage [${stageId}] completed by Vendor HR: ${stageCompletionRemark.trim()}`,
        });
      } catch (backendErr) {
        console.warn("Backend sync notice:", backendErr?.message);
      }

      setSelectedMilestoneCandidate({ ...selectedMilestoneCandidate, ...updatedApp });
      setCompletingStageId(null);
      setStageCompletionRemark("");
      showToast("Stage marked as Completed! Real-time progress reflected.");
      await loadData({ silent: true });
    } catch (err) {
      showToast(err.message || "Failed to complete milestone stage", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveMilestonePayment = async (milestoneId) => {
    try {
      setActionLoading(true);
      const candAppId = selectedMilestoneCandidate.applicationId || selectedMilestoneCandidate.id;
      const approvedApp = await crmVendorService.approveMilestonePayment(
        candAppId,
        milestoneId,
        "Vendor HR",
        "Milestone payment verified by HR",
        selectedMilestoneCandidate
      );
      const allApps = await crmVendorService.getApplications();
      const freshApp =
        allApps.find((a) => String(a.id) === String(candAppId) || String(a.applicationId) === String(candAppId)) ||
        approvedApp ||
        selectedMilestoneCandidate;

      try {
        await vendorHRService.updateCandidateStage(candAppId, {
          stage: selectedMilestoneCandidate?.recruitmentStage || selectedMilestoneCandidate?.status || "Selected",
          processMilestones: freshApp.processMilestones,
          remarks: `Milestone [${milestoneId}] payment approved/verified by Vendor HR`,
        });
      } catch (backendErr) {
        console.warn("Backend payment approval notice:", backendErr?.message);
      }

      setSelectedMilestoneCandidate({ ...selectedMilestoneCandidate, ...freshApp });
      showToast("Vendor milestone payment verified! Stages unlocked.");
      await loadData({ silent: true });
    } catch (err) {
      showToast(err.message || "Failed to verify milestone payment", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTimelineUpdate = async () => {
    await loadData({ silent: true });
    if (selectedMilestoneApp) {
      const candId = String(selectedMilestoneApp.applicationId || selectedMilestoneApp.id || selectedMilestoneApp._id || "");
      const freshApps = await crmVendorService.getApplications();
      const fresh = freshApps.find(
        (a) => String(a.id || "") === candId || String(a.applicationId || "") === candId
      );
      if (fresh) {
        setSelectedMilestoneApp((prev) => (prev ? { ...prev, ...fresh } : fresh));
      }
    }
  };

  // Nav menu badges
  const navMenuItems = useMemo(() => {
    const shortlistedCount = applications.filter((a) => (a.recruitmentStage || a.status) === "Shortlisted").length;
    const interviewCount = interviews.length;
    const selectedCount = applications.filter((a) =>
      ["Selected", "Processing", "Offer Released", "Offer Accepted", "Visa Processing", "Visa Issued", "Visa Allotted", "Joined", "Deployed", "Completed"].includes(a.recruitmentStage || a.status)
    ).length;
    const visaCount = applications.filter((a) => {
      const st = a.recruitmentStage || a.status || "";
      const vs = a.visaDetails?.visaStatus || a.visaStatus || "";
      return st === "Visa Issued" || st === "Visa Allotted" || st === "Joined" || vs === "Visa Issued" || Boolean(a.visaDetails?.visaNumber || a.visaNumber);
    }).length;
    const holdCount = applications.filter((a) => (a.recruitmentStage || a.status) === "On Hold").length;
    const rejectCount = applications.filter((a) => (a.recruitmentStage || a.status) === "Rejected").length;

    return [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "projects", label: "My Projects", icon: FolderKanban, badge: projectsList.length },
      { id: "jobs", label: "Jobs", icon: Briefcase, badge: jobs.length },
      { id: "candidates", label: "All Candidates", icon: Users, badge: applications.length },
      { id: "shortlisted", label: "Shortlisted", icon: CheckCircle2, badge: shortlistedCount },
      { id: "interviews", label: "Interviews", icon: Calendar, badge: interviewCount },
      { id: "selected", label: "Selected Candidates", icon: Award, badge: selectedCount },
      { id: "visa-allotted", label: "Visa Allotted", icon: Plane, badge: visaCount },
      { id: "on-hold", label: "On Hold", icon: Clock, badge: holdCount },
      { id: "rejected", label: "Rejected Candidates", icon: XCircle, badge: rejectCount },
    ];
  }, [applications, projectsList, jobs, interviews]);

  if ((isSuperAdmin || isAdmin) && activeMenu === "assignments") {
    return (
      <AdminMasterLayout
        title="Assign Projects & Vendors to HR"
        subtitle="Select Vendor HR accounts to view and assign overseas projects with recruitment agencies."
        breadcrumbs={[
          {
            label: isSuperAdmin ? "Super Admin" : "Admin",
            path: isSuperAdmin ? "/super-admin/dashboard" : "/admin/dashboard",
          },
          { label: "Assign to HR" },
        ]}
      >
        <AssignHRSection />
      </AdminMasterLayout>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans antialiased overflow-hidden text-slate-800">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-bold transition-all animate-in fade-in slide-in-from-top-2 ${toast.type === "error"
            ? "bg-rose-50 border-rose-300 text-rose-800"
            : "bg-emerald-50 border-emerald-300 text-emerald-800"
            }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. LEFT SIDEBAR */}
      <aside className="w-[240px] flex flex-col shrink-0 h-screen bg-gradient-to-b from-[#eef5ff] via-[#e8f2fe] to-[#edf4fe] text-slate-800 border-r border-blue-200/80 shadow-[1px_0_6px_rgba(37,99,235,0.06)] select-none">
        {/* Top Header */}
        <div className="h-[52px] min-h-[52px] px-4 border-b border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-between shadow-xs shrink-0">
          <ImmiGoLogo
            size="sm"
            theme="light"
            subtitle={isSuperAdmin ? "Super Admin Portal" : isAdmin ? "Admin Portal" : "Vendor HR Portal"}
          />
        </div>

        {/* Back to Admin Dashboard Pill (Prominent at top of Sidebar) */}
        {(isSuperAdmin || isAdmin) && (
          <div className="p-3 pb-1.5 border-b border-blue-200/60 bg-blue-50/60">
            <button
              type="button"
              onClick={() => navigate(isSuperAdmin ? "/super-admin/dashboard" : "/admin/dashboard")}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-blue-950 bg-white hover:bg-blue-100/90 border border-blue-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
              title="Return to Main Admin Dashboard"
            >
              <ArrowLeft size={14} className="text-blue-600 transition-transform group-hover:-translate-x-0.5" />
              <span>{isSuperAdmin ? "Back to Super Admin" : "Back to Admin Dashboard"}</span>
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <p className="text-[11px] font-bold text-blue-900/60 uppercase tracking-[0.14em] px-3 mb-2 mt-1">
            {isSuperAdmin ? "Super Admin HR Console" : isAdmin ? "Admin HR Console" : "Vendor HR Workspace"}
          </p>

          <nav className="space-y-1">
            {navMenuItems.map((item) => {
              const Icon = item.icon;
              const active = activeMenu === item.id || (item.id === "selected" && activeMenu === "milestones");
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === "projects") setDetailedProject(null);
                    handleSelectMenu(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${active
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold"
                    : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-950"
                    }`}
                >
                  <Icon
                    size={16}
                    className={`shrink-0 ${active ? "text-white" : "text-slate-500"}`}
                  />
                  <div className="flex-1 flex items-center justify-between min-w-0 pr-1 text-left">
                    <span className="truncate">{item.label}</span>
                    {item.badge ? (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${active
                          ? "bg-white text-blue-700"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                      >
                        {item.badge}
                      </span>
                    ) : active ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sign Out Footer */}
        <div className="h-[48px] min-h-[48px] border-t border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 px-3 flex items-center justify-center shadow-xs shrink-0">
          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-center gap-2 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-all duration-150 cursor-pointer active:scale-95 group w-full px-3"
            title="Sign Out"
          >
            <LogOut size={13} className="shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-[52px] min-h-[52px] bg-gradient-to-r from-[#0f274a] via-[#163868] to-[#1e4a82] text-white px-4 sm:px-6 flex items-center border-b border-blue-900/60 shadow-xs shrink-0">
          <div className="w-full flex items-center justify-between gap-3 sm:gap-5">
            <div className="flex items-center gap-2.5 truncate">
              <ImmiGoLogo size="xs" theme="light" />
              <ChevronRight size={13} className="text-blue-400 shrink-0" />
              <span className="text-white font-bold text-sm sm:text-[14px] tracking-tight truncate drop-shadow-2xs">
                {isSuperAdmin ? "Super Admin Operations" : isAdmin ? "Admin Operations" : "Vendor HR Dashboard"}
              </span>
              {!hideProjectNames && (
                <>
                  <span className="text-blue-400 hidden sm:inline">•</span>
                  <span className="text-xs text-blue-200 hidden sm:inline capitalize">
                    {activeMenu === "overview" && "Executive Overview"}
                    {activeMenu === "projects" && (detailedProject ? `Projects / ${detailedProject.projectName}` : "Assigned Projects")}
                    {activeMenu === "jobs" && "Required Trade Jobs"}
                    {activeMenu === "candidates" && "All Candidates Directory & Screening"}
                    {activeMenu === "shortlisted" && "Shortlisted Candidates"}
                    {activeMenu === "interviews" && "Scheduled Interviews & Assessments"}
                    {(activeMenu === "selected" || activeMenu === "milestones") && (selectedMilestoneApp ? `Milestones / ${selectedMilestoneApp.candidateName}` : "Selected Candidates & Milestones")}
                    {activeMenu === "visa-allotted" && "Visa Allotted Candidates"}
                    {activeMenu === "on-hold" && "On Hold Candidate Roster"}
                    {activeMenu === "rejected" && "Rejected Candidates & Vendor Pool"}
                    {activeMenu === "profile" && "Agency Profile"}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {!isSuperAdmin && !isAdmin && defaultVendorName && (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-800/60 border border-blue-600/40 text-xs font-bold text-cyan-300 shadow-xs truncate max-w-[200px]">
                  <ShieldCheck size={13} className="text-cyan-400 shrink-0" />
                  <span className="truncate">{defaultVendorName}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-900/80 border border-blue-700/60 text-xs font-semibold text-blue-200">
                <User size={13} className="text-cyan-400 shrink-0" />
                <span className="hidden sm:inline font-bold">{hrUserName}</span>
                <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">
                  {isSuperAdmin ? "SUPER" : isAdmin ? "ADMIN" : "HR"}
                </span>
              </div>

              <NotificationBell className="relative p-2 rounded-xl bg-blue-900/60 hover:bg-blue-800/90 text-blue-200 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-blue-700/60 shadow-xs" />

              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Submit Candidate</span>
              </button>
            </div>
          </div>
        </header>

        <ActiveMeetingAlertBanner customRole={isSuperAdmin ? "SUPER_ADMIN" : isAdmin ? "ADMIN" : "VENDOR_HR"} />

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#f8fafc]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider">Workspace</span>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-blue-700 uppercase tracking-wider">
                {activeMenu === "projects" ? "My Projects" : activeMenu}
              </span>
              {defaultVendorName && (
                <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {defaultVendorName}
                </span>
              )}
              {selectedProject !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedProject("ALL")}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer"
                >
                  Show All Assigned
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => loadData()}
                disabled={loading}
                className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-2xs cursor-pointer flex items-center space-x-1 text-xs font-semibold"
                title="Refresh Workspace"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {activeMenu === "overview" && (
            <VendorHROverviewSection
              dashboardData={dashboardData}
              applications={applications}
              projectsList={projectsList}
              jobs={jobs}
              interviews={interviews}
              vendorName={defaultVendorName}
              hideProjectNames={hideProjectNames}
              setActiveMenu={handleSelectMenu}
              setSelectedProject={setSelectedProject}
              setDetailedProject={setDetailedProject}
              openCandidateModal={openCandidateModal}
            />
          )}

          {activeMenu === "projects" && (
            <VendorHRProjectsSection
              projectsList={projectsList}
              applications={applications}
              jobs={jobs}
              vendorName={defaultVendorName}
              detailedProject={detailedProject}
              setDetailedProject={setDetailedProject}
              setActiveMenu={handleSelectMenu}
              setSelectedProject={setSelectedProject}
              setShowSubmitModal={setShowSubmitModal}
              setSubmitForm={setSubmitForm}
              openCandidateModal={openCandidateModal}
              navigateByTag={navigateByTag}
            />
          )}

          {activeMenu === "jobs" && (
            <VendorHRJobsSection
              jobs={jobs}
              applications={applications}
              hideProjectNames={hideProjectNames}
              setShowSubmitModal={setShowSubmitModal}
              setSubmitForm={setSubmitForm}
              setCandidateSearch={setCandidateSearch}
              setActiveMenu={handleSelectMenu}
            />
          )}

          {activeMenu === "candidates" && (
            <VendorHRCandidatesSection
              applications={applications}
              vendorName={defaultVendorName}
              hideProjectNames={hideProjectNames}
              candidateSearch={candidateSearch}
              setCandidateSearch={setCandidateSearch}
              candidateStageFilter={candidateStageFilter}
              setCandidateStageFilter={setCandidateStageFilter}
              setActiveMenu={handleSelectMenu}
              setShowSubmitModal={setShowSubmitModal}
              openCandidateModal={openCandidateModal}
              handleQuickStage={handleQuickStage}
              setScheduleInterviewTarget={setScheduleInterviewTarget}
              setScheduleForm={setScheduleForm}
              setShowScheduleModal={setShowScheduleModal}
              openReassignModal={openReassignModal}
              navigateByTag={navigateByTag}
            />
          )}

          {activeMenu === "shortlisted" && (
            <VendorHRShortlistedSection
              applications={applications}
              hideProjectNames={hideProjectNames}
              setScheduleInterviewTarget={setScheduleInterviewTarget}
              setScheduleForm={setScheduleForm}
              setShowScheduleModal={setShowScheduleModal}
              handleQuickStage={handleQuickStage}
              openCandidateModal={openCandidateModal}
              navigateByTag={navigateByTag}
            />
          )}

          {activeMenu === "interviews" && (
            <VendorHRInterviewsSection
              interviews={interviews}
              hideProjectNames={hideProjectNames}
              setShowScheduleModal={setShowScheduleModal}
              handleQuickStage={handleQuickStage}
              setFeedbackInterviewTarget={setFeedbackInterviewTarget}
              setShowFeedbackModal={setShowFeedbackModal}
              navigateByTag={navigateByTag}
            />
          )}

          {(activeMenu === "selected" || activeMenu === "milestones") && (
            <VendorHRMilestonesSection
              applications={applications}
              projectsList={projectsList}
              vendorName={defaultVendorName}
              hideProjectNames={hideProjectNames}
              selectedMilestoneApp={selectedMilestoneApp}
              setSelectedMilestoneApp={setSelectedMilestoneApp}
              milestoneSearchQuery={milestoneSearchQuery}
              setMilestoneSearchQuery={setMilestoneSearchQuery}
              milestoneStageFilter={milestoneStageFilter}
              setMilestoneStageFilter={setMilestoneStageFilter}
              handleTimelineUpdate={handleTimelineUpdate}
              openCandidateModal={openCandidateModal}
              navigateByTag={navigateByTag}
            />
          )}

          {activeMenu === "visa-allotted" && (
            <VendorHRVisaAllottedSection
              applications={applications}
              hideProjectNames={hideProjectNames}
              openCandidateModal={openCandidateModal}
              navigateByTag={navigateByTag}
            />
          )}

          {activeMenu === "on-hold" && (
            <VendorHROnHoldSection
              applications={applications}
              hideProjectNames={hideProjectNames}
              handleQuickStage={handleQuickStage}
              openCandidateModal={openCandidateModal}
              navigateByTag={navigateByTag}
            />
          )}

          {activeMenu === "rejected" && (
            <VendorHRRejectedSection
              applications={applications}
              hideProjectNames={hideProjectNames}
              openReassignModal={openReassignModal}
              openCandidateModal={openCandidateModal}
              navigateByTag={navigateByTag}
            />
          )}

          {activeMenu === "profile" && (
            <VendorHRProfileSection
              user={user}
              hrUserName={hrUserName}
              vendorName={defaultVendorName}
            />
          )}
        </main>


        <footer className="select-none shrink-0 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-blue-100 border-t border-blue-800/80 shadow-md mt-auto h-[48px] min-h-[48px] px-4 sm:px-6 flex items-center">
          <div className="w-full flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <ImmiGoLogo size="xs" theme="light" />
              <span className="hidden sm:inline-block text-[11px] text-blue-300/80 pl-3 border-l border-blue-800/80">
                Vendor HR Portal • Global Manpower Supply Command Center
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] text-white font-medium">
              <span>&copy; {new Date().getFullYear()} ImmiGo Global Enterprise</span>
              <span className="text-cyan-400">&bull;</span>
              <span className="font-semibold text-cyan-300 tracking-wide">
                Designed by White Gravity Web Solutions
              </span>
            </div>
          </div>
        </footer>
      </div>


      <VendorHRSubmitModal
        show={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmit={handleCandidateSubmit}
        submitForm={submitForm}
        setSubmitForm={setSubmitForm}
        projectsList={projectsList}
        jobs={jobs}
        hideProjectNames={hideProjectNames}
        actionLoading={actionLoading}
      />

      <VendorHRCandidateModal
        show={showCandidateModal}
        candidate={selectedCandidate}
        onClose={() => setShowCandidateModal(false)}
        onSubmit={handleCandidateUpdate}
        candidateUpdateForm={candidateUpdateForm}
        setCandidateUpdateForm={setCandidateUpdateForm}
        hideProjectNames={hideProjectNames}
        actionLoading={actionLoading}
        openReassignModal={openReassignModal}
        setScheduleInterviewTarget={setScheduleInterviewTarget}
        setScheduleForm={setScheduleForm}
        setShowScheduleModal={setShowScheduleModal}
      />

      <VendorHRScheduleModal
        show={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSubmit={handleScheduleSubmit}
        scheduleForm={scheduleForm}
        setScheduleForm={setScheduleForm}
        scheduleInterviewTarget={scheduleInterviewTarget}
        setScheduleInterviewTarget={setScheduleInterviewTarget}
        applications={applications}
        hrUserName={hrUserName}
        actionLoading={actionLoading}
      />

      <VendorHRFeedbackModal
        show={showFeedbackModal}
        feedbackInterviewTarget={feedbackInterviewTarget}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        feedbackForm={feedbackForm}
        setFeedbackForm={setFeedbackForm}
        actionLoading={actionLoading}
      />

      <VendorHRReassignModal
        show={showReassignModal}
        reassignTargetCandidate={reassignTargetCandidate}
        onClose={() => setShowReassignModal(false)}
        onSubmit={handleReassignSubmit}
        reassignForm={reassignForm}
        setReassignForm={setReassignForm}
        projectsList={projectsList}
        jobs={jobs}
        hideProjectNames={hideProjectNames}
        actionLoading={actionLoading}
      />

      <VendorHRMilestoneStepperModal
        show={showMilestoneStepperModal}
        selectedMilestoneCandidate={selectedMilestoneCandidate}
        onClose={() => setShowMilestoneStepperModal(false)}
        completingStageId={completingStageId}
        setCompletingStageId={setCompletingStageId}
        stageCompletionRemark={stageCompletionRemark}
        setStageCompletionRemark={setStageCompletionRemark}
        handleCompleteMilestoneStage={handleCompleteMilestoneStage}
        handleApproveMilestonePayment={handleApproveMilestonePayment}
        hideProjectNames={hideProjectNames}
        actionLoading={actionLoading}
        hrUserName={hrUserName}
      />
    </div>
  );
}
