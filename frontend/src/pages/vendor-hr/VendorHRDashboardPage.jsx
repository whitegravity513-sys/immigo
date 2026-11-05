import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  Users,
  Layers,
  Calendar,
  FileCheck,
  UserCheck,
  History,
  User,
  Headphones,
  ChevronRight,
  ChevronDown,
  Bell,
  LogOut,
  Building2,
  Plus,
  MoreVertical,
  Clock,
  CheckCircle2,
  Star,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Activity,
  X,
  Send,
  Video,
  FileText,
  Plane,
  Globe,
  Edit3,
  Award,
  Check,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  ArrowLeft,
  List,
  LayoutGrid,
  Target,
  ShieldCheck,
  BarChart3,
  RotateCcw,
  Lock,
  Unlock,
  IndianRupee,
  Circle,
  Sliders,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import vendorHRService from "../../services/vendorHRService.js";
import crmVendorService from "../../services/crmVendorService.js";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";
import ActiveMeetingAlertBanner from "../../components/common/meeting/ActiveMeetingAlertBanner.jsx";
import CandidateProcessTimeline from "../../components/vendor/CandidateProcessTimeline.jsx";

// Sparkline SVG component helper
function Sparkline({ color = "#6366F1", id = "spark" }) {
  return (
    <svg className="w-16 h-8 overflow-visible" viewBox="0 0 70 30" fill="none">
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M 0,25 C 15,22 25,12 35,18 C 45,24 55,8 70,10 L 70,30 L 0,30 Z"
        fill={`url(#grad-${id})`}
      />
      <path
        d="M 0,25 C 15,22 25,12 35,18 C 45,24 55,8 70,10"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// Safe salary formatter helper (handles objects like { min, max, currency } and strings)
function formatSalary(salary) {
  if (!salary) return "Standard Package";
  if (typeof salary === "string") return salary;
  if (typeof salary === "number") return salary.toLocaleString() + " AED";
  if (typeof salary === "object") {
    const { min, max, currency } = salary;
    const curr = currency || "AED";
    if (min && max) {
      return `${Number(min).toLocaleString()} - ${Number(max).toLocaleString()} ${curr}`;
    }
    if (min) return `From ${Number(min).toLocaleString()} ${curr}`;
    if (max) return `Up to ${Number(max).toLocaleString()} ${curr}`;
    return `Competitive (${curr})`;
  }
  return String(salary);
}

// Sample avatars for visual elegance
const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&h=120&q=80",
];

export default function VendorHRDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState("overview");
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [dateRange, setDateRange] = useState("Last 30 Days");

  const [dashboardData, setDashboardData] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Candidate & Job tables
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateStageFilter, setCandidateStageFilter] = useState("ALL");

  // Project List & Detail View state
  const [detailedProject, setDetailedProject] = useState(null);
  const [projectViewMode, setProjectViewMode] = useState("list");
  const [projectSearch, setProjectSearch] = useState("");

  // Job List & Filters state
  const [jobViewMode, setJobViewMode] = useState("list");
  const [jobSearch, setJobSearch] = useState("");
  const [jobDeptFilter, setJobDeptFilter] = useState("ALL");

  // Recruitment Pipeline & Stage Selection state (Matches Admin HR)
  const [pipelineStageFilter, setPipelineStageFilter] = useState("ALL");
  const [pipelineSearch, setPipelineSearch] = useState("");

  // Modals state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleInterviewTarget, setScheduleInterviewTarget] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackInterviewTarget, setFeedbackInterviewTarget] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignTargetCandidate, setReassignTargetCandidate] = useState(null);
  const [reassignForm, setReassignForm] = useState({
    projectId: "",
    projectName: "",
    jobId: "",
    jobTitle: "",
    notes: "",
  });

  // Dedicated Candidate Milestones section state (matches Admin Processing List)
  const [selectedMilestoneApp, setSelectedMilestoneApp] = useState(null);
  const [milestoneSearchQuery, setMilestoneSearchQuery] = useState("");
  const [milestoneStageFilter, setMilestoneStageFilter] = useState("ALL");

  // Direct In-Place Notifications Popover state
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const notificationRef = useRef(null);

  // Searches for dedicated candidate stage sections
  const [shortlistSearch, setShortlistSearch] = useState("");
  const [interviewSearch, setInterviewSearch] = useState("");
  const [visaSearch, setVisaSearch] = useState("");
  const [onHoldSearch, setOnHoldSearch] = useState("");
  const [rejectedSearch, setRejectedSearch] = useState("");

  // Post-Selection Milestone Processing Stepper Modal state
  const [showMilestoneStepperModal, setShowMilestoneStepperModal] = useState(false);
  const [selectedMilestoneCandidate, setSelectedMilestoneCandidate] = useState(null);
  const [completingStageId, setCompletingStageId] = useState(null);
  const [stageCompletionRemark, setStageCompletionRemark] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Submit Candidate Form
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

  // Candidate Stage / Offer / Visa Update Form
  const [candidateUpdateForm, setCandidateUpdateForm] = useState({
    stage: "",
    remarks: "",
    salary: "",
    offerStatus: "Pending",
    joiningDate: "",
    visaStatus: "Not Started",
    visaNumber: "",
    departureDate: "",
    flightDetails: "",
  });

  // Interview Schedule Form
  const [scheduleForm, setScheduleForm] = useState({
    applicationId: "",
    round: "Technical Interview",
    scheduledDate: "Today",
    startTime: "11:00 AM",
    interviewerName: "Vendor HR",
    interviewLink: "https://meet.google.com/xyz-meep-abc",
    notes: "",
  });

  // Interview Feedback Form
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 4,
    feedback: "Strong core skills, sound knowledge of trade blueprints.",
    recommendation: "Shortlist",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const dash = await vendorHRService.getDashboard({
        projectId: selectedProject !== "ALL" ? selectedProject : undefined,
      }).catch(() => null);

      if (dash) {
        setDashboardData(dash);
        setProjectsList(dash.projects || []);
        setApplications(dash.applications || dash.recentApplications || []);
        setInterviews(dash.upcomingInterviews || []);
        setJobs(dash.jobs || []);
        setActivities(dash.recentActivities || []);

        try {
          const vId = dash.vendor?.vendorId || "VEN-001";
          const notifs = crmVendorService.getNotifications(vId);
          if (Array.isArray(notifs) && notifs.length > 0) {
            setNotificationsList(notifs);
          } else if (dash.recentActivities?.length > 0) {
            setNotificationsList(
              dash.recentActivities.map((act) => ({
                id: act._id || `act-${Math.random()}`,
                title: act.title || act.action || "HR Notification",
                message: act.description || "Activity recorded on platform",
                createdAt: act.createdAt || new Date().toISOString(),
                read: false,
              }))
            );
          }
        } catch (nErr) {
          console.warn("Notifications load fallback:", nErr);
        }
      }
    } catch (err) {
      console.error("Failed to load Vendor HR dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle click outside notification dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    }
    if (showNotificationDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotificationDropdown]);

  const handleMarkAllNotifsRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
    try {
      crmVendorService.markAllNotificationsRead();
    } catch {}
  };

  const handleMarkNotifRead = (id) => {
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === id || n._id === id ? { ...n, read: true, isRead: true } : n))
    );
    try {
      crmVendorService.markNotificationRead(id);
    } catch {}
  };

  const unreadNotifCount = useMemo(() => {
    return notificationsList.filter((n) => !n.read && !n.isRead).length;
  }, [notificationsList]);

  useEffect(() => {
    loadData();
  }, [user, selectedProject]);

  // Tag-based navigation: Clicking on any tag/stage or performing stage action navigates immediately to its dedicated section
  const navigateByTag = (stageOrTag, cand = null) => {
    const s = (stageOrTag || "").toLowerCase();
    if (s.includes("shortlist")) {
      setActiveMenu("shortlisted");
    } else if (s.includes("interview")) {
      setActiveMenu("interviews");
    } else if (s.includes("select")) {
      setActiveMenu("milestones");
      if (cand) setSelectedMilestoneApp(cand);
    } else if (s.includes("visa") || s.includes("joined") || s.includes("deploy")) {
      setActiveMenu("visa-allotted");
    } else if (s.includes("hold")) {
      setActiveMenu("on-hold");
    } else if (s.includes("reject")) {
      setActiveMenu("rejected");
    } else {
      setActiveMenu("candidates");
    }
  };

  // Handle Candidate Submission
  const handleCandidateSubmit = async (e) => {
    e.preventDefault();
    if (!submitForm.fullName || !submitForm.email || !submitForm.projectId) {
      showToast("Please fill in candidate name, email, and target project.", "error");
      return;
    }
    try {
      setActionLoading(true);
      const vendorId = user?.assignedVendors?.[0] || dashboardData?.vendor?.vendorId || "VND-5206C0";
      const prj = projectsList.find((p) => p.projectId === submitForm.projectId);
      const jb = jobs.find((j) => j.jobId === submitForm.jobId);

      await vendorHRService.submitCandidate({
        fullName: submitForm.fullName.trim(),
        email: submitForm.email.trim(),
        phone: submitForm.phone.trim(),
        projectId: submitForm.projectId,
        projectName: prj?.projectName || "Overseas Deployment",
        jobId: submitForm.jobId,
        jobTitle: jb?.title || "Technician",
        vendorId,
        vendorName: dashboardData?.vendor?.companyName || user?.name || "Global Staffing Solutions Pvt Ltd",
        skills: submitForm.skills ? submitForm.skills.split(",").map((s) => s.trim()) : [],
        notes: submitForm.notes,
      });

      showToast("Candidate submitted to project successfully!");
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

  // Open Candidate Detail / Update Modal
  const openCandidateModal = (cand) => {
    setSelectedCandidate(cand);
    setCandidateUpdateForm({
      stage: cand.recruitmentStage || cand.status || "Applied",
      remarks: "",
      salary: formatSalary(cand.offerDetails?.salary || cand.salary || ""),
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
      // Instantly navigate to target section
      navigateByTag(candidateUpdateForm.stage, selectedCandidate);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to update candidate", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Schedule Interview Submit
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await vendorHRService.scheduleInterview({
        applicationId: scheduleInterviewTarget?.applicationId || scheduleForm.applicationId,
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
      // Instantly navigate to interviews section
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

  // Quick Action: Shortlist, Select, or Reject from candidate list
  const handleQuickStage = async (cand, newStage, remarks = "") => {
    try {
      setActionLoading(true);
      const appId = cand.applicationId || cand.id || cand._id;
      await vendorHRService.updateCandidateStage(appId, {
        stage: newStage,
        remarks: remarks || `Candidate marked as ${newStage} by Vendor HR screening`,
      });
      // Synchronize with CRM application status to guarantee milestone generation and parity with Admin portal
      try {
        await crmVendorService.updateApplicationStatus(appId, newStage, remarks);
      } catch (crmErr) {
        console.warn("crmVendorService status sync fallback:", crmErr?.message || crmErr);
      }
      showToast(`Candidate [${cand.candidateName}] updated to ${newStage}!`);
      await loadData();
      // Instantly navigate to target section as requested ("slect ya shorlist kren par uss section ma chla jye ussi time")
      navigateByTag(newStage, cand);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to update candidate stage", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reassign Modal for Rejected Candidate
  const openReassignModal = (cand) => {
    setReassignTargetCandidate(cand);
    const otherProj = projectsList.find((p) => p.projectId !== cand.projectId) || projectsList[0];
    const initialJob = jobs.find((j) => j.projectId === otherProj?.projectId);
    setReassignForm({
      projectId: otherProj?.projectId || "",
      projectName: otherProj?.projectName || "",
      jobId: initialJob?.jobId || "",
      jobTitle: initialJob?.title || "",
      notes: `Reassigned from rejected project [${cand.projectName || cand.projectId}]`,
    });
    setShowReassignModal(true);
  };

  // Submit Reassignment to Another Project
  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassignTargetCandidate || !reassignForm.projectId) {
      showToast("Please select a target project for reassignment.", "error");
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
        notes: reassignForm.notes || "Candidate re-applied to new project vacancy",
      });

      showToast(`Candidate [${reassignTargetCandidate.candidateName}] reassigned to ${targetProj?.projectName || "new project"}!`);
      setShowReassignModal(false);
      setReassignTargetCandidate(null);
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to reassign candidate", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Open Post-Selection Milestone Processing Stepper
  const openMilestoneStepper = async (cand) => {
    let milestones = cand.processMilestones;
    if (!Array.isArray(milestones) || milestones.length === 0) {
      milestones = crmVendorService.syncAppMilestonesWithProject ? crmVendorService.syncAppMilestonesWithProject(cand) : [];
    }

    const candAppId = cand.applicationId || cand.id || cand._id;
    try {
      const allApps = await crmVendorService.getApplications();
      const existing = allApps.find(
        (a) => String(a.id) === String(candAppId) || String(a.applicationId) === String(candAppId)
      );
      if (existing && Array.isArray(existing.processMilestones) && existing.processMilestones.length > 0) {
        milestones = existing.processMilestones;
      } else {
        const raw = localStorage.getItem("crm_vendor_applications");
        const list = raw ? JSON.parse(raw) : [];
        const existsInList = list.some((a) => String(a.id) === String(candAppId) || String(a.applicationId) === String(candAppId));
        if (!existsInList) {
          list.push({
            ...cand,
            id: candAppId,
            applicationId: candAppId,
            status: "Selected",
            processMilestones: milestones,
          });
          localStorage.setItem("crm_vendor_applications", JSON.stringify(list));
        }
      }
    } catch (e) {
      console.warn("Milestone sync notice:", e);
    }

    setSelectedMilestoneCandidate({ ...cand, processMilestones: milestones });
    setCompletingStageId(null);
    setStageCompletionRemark("");
    setShowMilestoneStepperModal(true);
  };

  // Complete a Milestone Sub-Stage (Updates sequential progression & notifies Vendor)
  const handleCompleteMilestoneStage = async (milestoneId, stageId) => {
    if (!stageCompletionRemark.trim()) {
      showToast("Please enter verification remarks before completing this stage.", "error");
      return;
    }
    try {
      setActionLoading(true);
      const candAppId = selectedMilestoneCandidate.applicationId || selectedMilestoneCandidate.id;

      // 1. Advance stage in CRM Vendor Service to enforce milestone sequential locks
      const updatedApp = await crmVendorService.completeStage(
        candAppId,
        milestoneId,
        stageId,
        stageCompletionRemark.trim(),
        "Vendor HR"
      );

      // 2. Persist to MongoDB backend if available
      try {
        await vendorHRService.updateCandidateStage(candAppId, {
          processMilestones: updatedApp.processMilestones,
          remarks: `Stage [${stageId}] completed by Vendor HR: ${stageCompletionRemark.trim()}`,
        });
      } catch (backendErr) {
        console.warn("Backend updateCandidateStage sync notice:", backendErr?.message);
      }

      // 3. Update local state and reload
      setSelectedMilestoneCandidate({ ...selectedMilestoneCandidate, ...updatedApp });
      setCompletingStageId(null);
      setStageCompletionRemark("");
      showToast("Stage marked as Completed! Real-time progress reflected to Vendor.");
      await loadData();
    } catch (err) {
      showToast(err.message || "Failed to complete milestone stage", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Verify / Simulate Vendor Milestone Payment (Unlocks stages for Vendor HR)
  const handleApproveMilestonePayment = async (milestoneId) => {
    try {
      setActionLoading(true);
      const candAppId = selectedMilestoneCandidate.applicationId || selectedMilestoneCandidate.id;
      await crmVendorService.approveMilestonePayment(candAppId, milestoneId, "Vendor HR", "Milestone payment verified by HR");

      const allApps = await crmVendorService.getApplications();
      const freshApp = allApps.find((a) => String(a.id) === String(candAppId) || String(a.applicationId) === String(candAppId)) || selectedMilestoneCandidate;
      
      // Persist to backend if available
      try {
        await vendorHRService.updateCandidateStage(candAppId, {
          processMilestones: freshApp.processMilestones,
          remarks: `Milestone [${milestoneId}] payment approved/verified by Vendor HR`,
        });
      } catch (backendErr) {
        console.warn("Backend payment approval notice:", backendErr?.message);
      }

      setSelectedMilestoneCandidate({ ...selectedMilestoneCandidate, ...freshApp });
      showToast("Vendor milestone payment verified! Milestone stages are now unlocked for processing.");
      await loadData();
    } catch (err) {
      showToast(err.message || "Failed to verify milestone payment", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle updates from CandidateProcessTimeline
  const handleTimelineUpdate = async () => {
    await loadData();
    if (selectedMilestoneApp) {
      const candId = selectedMilestoneApp.applicationId || selectedMilestoneApp.id;
      const freshApps = await crmVendorService.getApplications();
      const fresh = freshApps.find(
        (a) => String(a.id) === String(candId) || String(a.applicationId) === String(candId)
      );
      if (fresh) setSelectedMilestoneApp(fresh);
    }
  };

  // Dynamic Pipeline Columns for Overview & Kanban
  const pipelineColumns = useMemo(() => {
    const getAppsForStage = (stageName, aliases = []) => {
      const match = [stageName, ...aliases];
      return applications.filter((a) => match.includes(a.recruitmentStage) || match.includes(a.status));
    };

    const appliedList = getAppsForStage("Applied");
    const screeningList = getAppsForStage("Screening");
    const l1List = getAppsForStage("L1 Interview", ["Interview Scheduled"]);
    const l2List = getAppsForStage("L2 Interview", ["L3 Interview", "HR Interview"]);
    const selectedList = getAppsForStage("Selected");
    const offerList = getAppsForStage("Offer Released", ["Offer Accepted"]);
    const visaList = getAppsForStage("Visa Processing", ["Visa Issued"]);
    const joinedList = getAppsForStage("Joined", ["Deployed"]);

    return [
      {
        id: "applied",
        title: "Applied",
        count: appliedList.length,
        headerBg: "bg-indigo-50/90 text-indigo-700 border-indigo-200",
        items: appliedList,
      },
      {
        id: "screening",
        title: "Screening",
        count: screeningList.length,
        headerBg: "bg-sky-50/90 text-sky-700 border-sky-200",
        items: screeningList,
      },
      {
        id: "l1",
        title: "L1 Interview",
        count: l1List.length,
        headerBg: "bg-emerald-50/90 text-emerald-700 border-emerald-200",
        items: l1List,
      },
      {
        id: "l2",
        title: "L2 Interview",
        count: l2List.length,
        headerBg: "bg-amber-50/90 text-amber-700 border-amber-200",
        items: l2List,
      },
      {
        id: "selected",
        title: "Selected",
        count: selectedList.length,
        headerBg: "bg-teal-50/90 text-teal-700 border-teal-200",
        items: selectedList,
      },
      // Extended columns for Pipeline Kanban
      {
        id: "offers",
        title: "Offer Released",
        count: offerList.length,
        headerBg: "bg-purple-50/90 text-purple-700 border-purple-200",
        items: offerList,
      },
      {
        id: "visa",
        title: "Visa Processing",
        count: visaList.length,
        headerBg: "bg-blue-50/90 text-blue-700 border-blue-200",
        items: visaList,
      },
      {
        id: "joined",
        title: "Joined",
        count: joinedList.length,
        headerBg: "bg-emerald-50/90 text-emerald-800 border-emerald-200",
        items: joinedList,
      },
    ];
  }, [applications]);

  // Stage condition counts: Pre-selection and Post-selection (Identical to Admin HR Pipeline)
  const pipelineCounts = useMemo(() => {
    const list = applications;
    return {
      all: list.length,
      shortlist: list.filter((c) =>
        ["Applied", "Screening", "Shortlisted"].includes(c.recruitmentStage || c.status)
      ).length,
      interviewScheduled: list.filter(
        (c) =>
          c.recruitmentStage?.includes("Interview") ||
          c.status?.includes("Interview") ||
          Boolean(c.interview?.scheduledDate)
      ).length,
      interviewHold: list.filter((c) =>
        ["Hold", "On Hold"].includes(c.recruitmentStage || c.status)
      ).length,
      interviewRejected: list.filter((c) =>
        ["Rejected"].includes(c.recruitmentStage || c.status)
      ).length,
      interviewSuccess: list.filter((c) =>
        [
          "Selected",
          "Offer Released",
          "Offer Accepted",
          "Visa Processing",
          "Visa Issued",
          "Joined",
          "Deployed",
        ].includes(c.recruitmentStage || c.status)
      ).length,
      milestone1: list.filter(
        (c) =>
          c.processMilestones?.find((m) => m.id === "m1")?.completed ||
          ["Screening", "Selected", "Visa Processing", "Joined"].includes(c.recruitmentStage)
      ).length,
      milestone2: list.filter(
        (c) =>
          c.processMilestones?.find((m) => m.id === "m2")?.completed ||
          ["Selected", "Visa Processing", "Joined"].includes(c.recruitmentStage)
      ).length,
      milestone3: list.filter(
        (c) =>
          c.processMilestones?.find((m) => m.id === "m3")?.completed ||
          ["Visa Processing", "Visa Issued", "Joined"].includes(c.recruitmentStage)
      ).length,
      milestone4: list.filter(
        (c) =>
          c.processMilestones?.find((m) => m.id === "m4")?.completed ||
          ["Joined", "Deployed"].includes(c.recruitmentStage)
      ).length,
    };
  }, [applications]);

  // Candidates matching the selected pipeline stage dropdown and search (Identical to Admin HR Pipeline)
  const filteredPipelineCandidates = useMemo(() => {
    let list = applications;

    if (pipelineStageFilter === "SHORTLIST") {
      list = list.filter((c) =>
        ["Applied", "Screening", "Shortlisted"].includes(c.recruitmentStage || c.status)
      );
    } else if (pipelineStageFilter === "INTERVIEW_SCHEDULED") {
      list = list.filter(
        (c) =>
          c.recruitmentStage?.includes("Interview") ||
          c.status?.includes("Interview") ||
          Boolean(c.interview?.scheduledDate)
      );
    } else if (pipelineStageFilter === "INTERVIEW_HOLD") {
      list = list.filter((c) => ["Hold", "On Hold"].includes(c.recruitmentStage || c.status));
    } else if (pipelineStageFilter === "INTERVIEW_REJECTED") {
      list = list.filter((c) => ["Rejected"].includes(c.recruitmentStage || c.status));
    } else if (pipelineStageFilter === "INTERVIEW_SUCCESS") {
      list = list.filter((c) =>
        [
          "Selected",
          "Offer Released",
          "Offer Accepted",
          "Visa Processing",
          "Visa Issued",
          "Joined",
          "Deployed",
        ].includes(c.recruitmentStage || c.status)
      );
    } else if (pipelineStageFilter === "MILESTONE_1") {
      list = list.filter(
        (c) =>
          c.processMilestones?.find((m) => m.id === "m1")?.completed ||
          ["Screening", "Selected", "Visa Processing", "Joined"].includes(c.recruitmentStage)
      );
    } else if (pipelineStageFilter === "MILESTONE_2") {
      list = list.filter(
        (c) =>
          c.processMilestones?.find((m) => m.id === "m2")?.completed ||
          ["Selected", "Visa Processing", "Joined"].includes(c.recruitmentStage)
      );
    } else if (pipelineStageFilter === "MILESTONE_3") {
      list = list.filter(
        (c) =>
          c.processMilestones?.find((m) => m.id === "m3")?.completed ||
          ["Visa Processing", "Visa Issued", "Joined"].includes(c.recruitmentStage)
      );
    } else if (pipelineStageFilter === "MILESTONE_4") {
      list = list.filter(
        (c) =>
          c.processMilestones?.find((m) => m.id === "m4")?.completed ||
          ["Joined", "Deployed"].includes(c.recruitmentStage)
      );
    }

    if (pipelineSearch) {
      const q = pipelineSearch.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.candidateName?.toLowerCase().includes(q) ||
          c.jobTitle?.toLowerCase().includes(q) ||
          c.projectName?.toLowerCase().includes(q) ||
          c.passportNumber?.toLowerCase().includes(q) ||
          c.candidateId?.toLowerCase().includes(q) ||
          c.vendorName?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [applications, pipelineStageFilter, pipelineSearch]);

  // Pre-Selection vs Post-Selection Lists
  const postSelectionCandidates = useMemo(() => {
    return applications.filter((cand) => {
      const isPost =
        [
          "Selected",
          "Offer Released",
          "Offer Accepted",
          "Visa Processing",
          "Visa Issued",
          "Joined",
          "Deployed",
        ].includes(cand.recruitmentStage) ||
        cand.status === "Selected" ||
        cand.status === "Completed";
      return isPost;
    });
  }, [applications]);

  const preSelectionCandidates = useMemo(() => {
    return applications.filter((cand) => {
      const isPost =
        [
          "Selected",
          "Offer Released",
          "Offer Accepted",
          "Visa Processing",
          "Visa Issued",
          "Joined",
          "Deployed",
        ].includes(cand.recruitmentStage) ||
        cand.status === "Selected" ||
        cand.status === "Completed";
      return !isPost;
    });
  }, [applications]);

  const preSelectionCount = preSelectionCandidates.length;
  const postSelectionCount = postSelectionCandidates.length;

  // Dedicated Candidate Stage Lists
  const shortlistedCandidates = useMemo(() => {
    return applications.filter((cand) => cand.recruitmentStage === "Shortlisted" || cand.status === "Shortlisted");
  }, [applications]);

  const onHoldCandidates = useMemo(() => {
    return applications.filter((cand) => cand.recruitmentStage === "On Hold" || cand.status === "On Hold");
  }, [applications]);

  const rejectedCandidates = useMemo(() => {
    return applications.filter((cand) => cand.recruitmentStage === "Rejected" || cand.status === "Rejected");
  }, [applications]);

  // Candidates whose employment visa has been issued / allotted
  const visaAllottedCandidates = useMemo(() => {
    return applications.filter((cand) => {
      const stage = cand.recruitmentStage || cand.status || "";
      const visaStatus = cand.visaDetails?.visaStatus || "";
      const hasVisaNum = Boolean(cand.visaDetails?.visaNumber || cand.visaNumber);
      const m3Done = cand.processMilestones?.some(
        (m) => (m.id === "m3" || m.id === "milestone_3" || m.milestoneId === "m3") && m.completed
      );
      return (
        ["Visa Issued", "Visa Approved", "Visa Allocated", "Visa Allotted", "Joined", "Deployed"].includes(stage) ||
        ["Visa Issued", "Visa Approved", "Deployed"].includes(visaStatus) ||
        hasVisaNum ||
        m3Done
      );
    });
  }, [applications]);

  const combinedInterviewsList = useMemo(() => {
    const list = [...interviews];
    applications.forEach((cand) => {
      const isInterview = cand.recruitmentStage?.includes("Interview") || cand.status?.includes("Interview");
      if (isInterview) {
        const appId = cand.applicationId || cand.id;
        const exists = list.some((it) => it.applicationId === appId || it.candidateName === cand.candidateName);
        if (!exists) {
          list.push({
            interviewId: `INT-${appId}`,
            applicationId: appId,
            candidateName: cand.candidateName,
            jobTitle: cand.jobTitle || "Specialist Technician",
            projectName: cand.projectName || "Overseas Deployment",
            candidatePhone: cand.candidatePhone,
            candidateEmail: cand.candidateEmail,
            passportNumber: cand.passportNumber,
            round: cand.interviewDetails?.round || cand.recruitmentStage || "Technical Interview",
            status: cand.interviewDetails?.status || "Scheduled",
            scheduledDate: cand.interviewDetails?.scheduledDate || cand.interviewDetails?.dateTime || "Today",
            startTime: cand.interviewDetails?.startTime || "11:00 AM",
            interviewerName: cand.interviewDetails?.interviewerName || "Vendor HR",
            interviewLink: cand.interviewDetails?.meetingUrl || cand.interviewDetails?.interviewLink || "https://meet.google.com/xyz-meep-abc",
            candidateRef: cand,
          });
        }
      }
    });
    return list;
  }, [interviews, applications]);

  const shortlistedCount = shortlistedCandidates.length;
  const onHoldCount = onHoldCandidates.length;
  const rejectedCount = rejectedCandidates.length;
  const interviewCount = combinedInterviewsList.length;
  const visaAllottedCount = visaAllottedCandidates.length;

  // Sidebar navigation configuration - Cleaned & Streamlined with Visa Allotted
  const navMenuItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "projects", label: "My Projects", icon: FolderKanban, badge: projectsList.length },
    { id: "jobs", label: "Jobs", icon: Briefcase, badge: jobs.length },
    { id: "candidates", label: "All Candidates", icon: Users, badge: preSelectionCount },
    { id: "shortlisted", label: "Shortlisted", icon: UserCheck, badge: shortlistedCount },
    { id: "interviews", label: "Interviews", icon: Calendar, badge: interviewCount },
    { id: "milestones", label: "Selected Candidates", icon: Award, badge: postSelectionCount },
    { id: "visa-allotted", label: "Visa Allotted", icon: Plane, badge: visaAllottedCount },
    { id: "on-hold", label: "On Hold", icon: Clock, badge: onHoldCount },
    { id: "rejected", label: "Rejected Candidates", icon: XCircle, badge: rejectedCount },
    { id: "profile", label: "Profile", icon: User },
  ];

  const vendorName =
    dashboardData?.vendor?.companyName ||
    user?.vendors?.[0]?.companyName ||
    user?.vendorName ||
    "Global Staffing Solutions Pvt Ltd";

  const hrUserName = user?.name || "Priya Sharma";

  // Filtered Candidates list for Candidates tab (Pre-selection screening)
  const filteredCandidates = useMemo(() => {
    return preSelectionCandidates.filter((cand) => {
      const matchSearch =
        !candidateSearch ||
        cand.candidateName?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        cand.candidateEmail?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        cand.candidatePhone?.includes(candidateSearch) ||
        cand.passportNumber?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        cand.jobTitle?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        cand.projectName?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        cand.applicationId?.toLowerCase().includes(candidateSearch.toLowerCase());

      const matchStage =
        candidateStageFilter === "ALL" ||
        (candidateStageFilter === "Applied" &&
          (!cand.recruitmentStage ||
            ["Applied", "Screening", "Submitted", "Under Review", "On Hold"].includes(cand.recruitmentStage) ||
            ["Applied", "Submitted", "Under Review"].includes(cand.status))) ||
        (candidateStageFilter === "Interview" &&
          (cand.recruitmentStage?.includes("Interview") || cand.status?.includes("Interview"))) ||
        cand.recruitmentStage === candidateStageFilter ||
        cand.status === candidateStageFilter;

      return matchSearch && matchStage;
    });
  }, [preSelectionCandidates, candidateSearch, candidateStageFilter]);

  // Filtered Milestone Candidates for Dedicated Candidate Milestones section
  const filteredMilestoneCandidates = useMemo(() => {
    return postSelectionCandidates.filter((cand) => {
      const q = (milestoneSearchQuery || "").toLowerCase().trim();
      const matchSearch =
        !q ||
        cand.candidateName?.toLowerCase().includes(q) ||
        cand.candidateEmail?.toLowerCase().includes(q) ||
        cand.candidatePhone?.includes(q) ||
        cand.passportNumber?.toLowerCase().includes(q) ||
        cand.jobTitle?.toLowerCase().includes(q) ||
        cand.projectName?.toLowerCase().includes(q) ||
        cand.applicationId?.toLowerCase().includes(q);

      const matchStage =
        milestoneStageFilter === "ALL" ||
        cand.recruitmentStage === milestoneStageFilter ||
        cand.status === milestoneStageFilter;

      return matchSearch && matchStage;
    });
  }, [postSelectionCandidates, milestoneSearchQuery, milestoneStageFilter]);

  // Filtered Shortlisted candidates
  const filteredShortlisted = useMemo(() => {
    return shortlistedCandidates.filter((cand) => {
      const q = (shortlistSearch || "").toLowerCase().trim();
      if (!q) return true;
      return (
        cand.candidateName?.toLowerCase().includes(q) ||
        cand.candidatePhone?.includes(q) ||
        cand.jobTitle?.toLowerCase().includes(q) ||
        cand.projectName?.toLowerCase().includes(q) ||
        cand.passportNumber?.toLowerCase().includes(q)
      );
    });
  }, [shortlistedCandidates, shortlistSearch]);

  // Filtered Interviews for Table List view
  const filteredInterviews = useMemo(() => {
    return combinedInterviewsList.filter((item) => {
      const q = (interviewSearch || "").toLowerCase().trim();
      if (!q) return true;
      return (
        item.candidateName?.toLowerCase().includes(q) ||
        item.jobTitle?.toLowerCase().includes(q) ||
        item.projectName?.toLowerCase().includes(q) ||
        item.interviewerName?.toLowerCase().includes(q) ||
        item.round?.toLowerCase().includes(q)
      );
    });
  }, [combinedInterviewsList, interviewSearch]);

  // Filtered On Hold candidates
  const filteredOnHold = useMemo(() => {
    return onHoldCandidates.filter((cand) => {
      const q = (onHoldSearch || "").toLowerCase().trim();
      if (!q) return true;
      return (
        cand.candidateName?.toLowerCase().includes(q) ||
        cand.candidatePhone?.includes(q) ||
        cand.jobTitle?.toLowerCase().includes(q) ||
        cand.projectName?.toLowerCase().includes(q) ||
        cand.passportNumber?.toLowerCase().includes(q)
      );
    });
  }, [onHoldCandidates, onHoldSearch]);

  // Filtered Rejected candidates (Vendor Talent Pool)
  const filteredRejected = useMemo(() => {
    return rejectedCandidates.filter((cand) => {
      const q = (rejectedSearch || "").toLowerCase().trim();
      if (!q) return true;
      return (
        cand.candidateName?.toLowerCase().includes(q) ||
        cand.candidatePhone?.includes(q) ||
        cand.jobTitle?.toLowerCase().includes(q) ||
        cand.projectName?.toLowerCase().includes(q) ||
        cand.passportNumber?.toLowerCase().includes(q) ||
        cand.rejectionReason?.toLowerCase().includes(q)
      );
    });
  }, [rejectedCandidates, rejectedSearch]);

  // Filtered Visa Allotted candidates
  const filteredVisaAllotted = useMemo(() => {
    return visaAllottedCandidates.filter((cand) => {
      const q = (visaSearch || "").toLowerCase().trim();
      if (!q) return true;
      return (
        cand.candidateName?.toLowerCase().includes(q) ||
        cand.candidatePhone?.includes(q) ||
        cand.jobTitle?.toLowerCase().includes(q) ||
        cand.projectName?.toLowerCase().includes(q) ||
        cand.passportNumber?.toLowerCase().includes(q) ||
        cand.visaDetails?.visaNumber?.toLowerCase().includes(q)
      );
    });
  }, [visaAllottedCandidates, visaSearch]);

  // Filtered Projects for My Projects view
  const filteredProjects = useMemo(() => {
    return projectsList.filter((p) => {
      const q = (projectSearch || "").toLowerCase();
      if (!q) return true;
      return (
        (p.projectName || "").toLowerCase().includes(q) ||
        (p.projectId || "").toLowerCase().includes(q) ||
        (p.clientName || "").toLowerCase().includes(q) ||
        (p.destinationCountry || "").toLowerCase().includes(q)
      );
    });
  }, [projectsList, projectSearch]);

  // Unique Departments for filter
  const uniqueDepartments = useMemo(() => {
    const set = new Set();
    jobs.forEach((j) => {
      if (j.department) set.add(j.department);
      if (j.tradeCategory) set.add(j.tradeCategory);
    });
    return Array.from(set);
  }, [jobs]);

  // Filtered Jobs for Open Jobs view
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const q = (jobSearch || "").toLowerCase();
      const matchSearch =
        !q ||
        (job.title || "").toLowerCase().includes(q) ||
        (job.jobId || "").toLowerCase().includes(q) ||
        (job.department || "").toLowerCase().includes(q) ||
        (job.tradeCategory || "").toLowerCase().includes(q) ||
        (job.projectName || "").toLowerCase().includes(q) ||
        (job.location || "").toLowerCase().includes(q);

      const matchDept =
        jobDeptFilter === "ALL" ||
        (job.department || "").toLowerCase() === jobDeptFilter.toLowerCase() ||
        (job.tradeCategory || "").toLowerCase() === jobDeptFilter.toLowerCase();

      return matchSearch && matchDept;
    });
  }, [jobs, jobSearch, jobDeptFilter]);

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold border flex items-center space-x-2 transition ${
            toast.type === "error"
              ? "bg-red-50 border-red-300 text-red-700"
              : "bg-emerald-50 border-emerald-300 text-emerald-800"
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. LEFT SIDEBAR (Matching other Dashboards: AdminMasterSidebar & VendorManagementSidebar) */}
      <aside className="w-[240px] flex flex-col shrink-0 h-screen bg-gradient-to-b from-[#eef5ff] via-[#e8f2fe] to-[#edf4fe] text-slate-800 border-r border-blue-200/80 shadow-[1px_0_6px_rgba(37,99,235,0.06)] select-none">
        {/* Top Header */}
        <div className="h-[52px] min-h-[52px] px-4 border-b border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-between shadow-xs shrink-0">
          <ImmiGoLogo size="sm" theme="light" subtitle="Vendor HR Portal" />
        </div>

        {/* Dynamic Navigation Items */}
        <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <p className="text-[11px] font-bold text-blue-900/60 uppercase tracking-[0.14em] px-3 mb-2 mt-1">
            Vendor HR Workspace
          </p>

          <nav className="space-y-1">
            {navMenuItems.map((item) => {
              const Icon = item.icon;
              const active = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === "projects") setDetailedProject(null);
                    setActiveMenu(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    active
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
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          active
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

        {/* Clean Sign Out Footer matching Dashboard Footer height (48px) */}
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
        {/* Top Navbar matching AdminMasterNavbar */}
        <header className="h-[52px] min-h-[52px] bg-gradient-to-r from-[#0f274a] via-[#163868] to-[#1e4a82] text-white px-4 sm:px-6 flex items-center border-b border-blue-900/60 shadow-xs shrink-0">
          <div className="w-full flex items-center justify-between gap-3 sm:gap-5">
            {/* Left Side: Breadcrumb & Title */}
            <div className="flex items-center gap-2 truncate">
              <span className="flex items-end gap-0.5 select-none font-bold text-base tracking-tighter leading-none text-white">
                <span>immi</span>
                <span className="text-cyan-400">Go</span>
                <svg viewBox="0 0 20 20" fill="none" className="w-2.5 h-2.5 text-orange-400 mb-0.5 ml-0.5 shrink-0">
                  <path d="M3 10h14M10 3l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <ChevronRight size={13} className="text-blue-400 shrink-0" />
              <span className="text-white font-bold text-sm sm:text-[14px] tracking-tight truncate drop-shadow-2xs">
                Vendor HR Dashboard
              </span>
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
            </div>

            {/* Right Side: Agency Pill + Project Filter + HR Profile + Notifications */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Dynamic Project Selector Dropdown */}
              <div className="relative hidden md:flex items-center">
                <Building2 className="w-3.5 h-3.5 text-blue-300 absolute left-2.5 pointer-events-none" />
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="pl-7 pr-6 py-1.5 rounded-lg bg-blue-900/60 border border-blue-700/60 text-xs font-semibold text-blue-100 shadow-xs appearance-none hover:bg-blue-800/80 cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400"
                >
                  <option value="ALL" className="bg-slate-900 text-white">All Projects ({projectsList.length})</option>
                  {projectsList.map((p) => (
                    <option key={p.projectId || p.id} value={p.projectId || p.id} className="bg-slate-900 text-white">
                      {p.projectName} ({p.projectId})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-blue-300 absolute right-2 pointer-events-none" />
              </div>

              {/* Agency Representation Badge */}
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-800/60 border border-blue-600/40 text-xs font-bold text-cyan-300 shadow-xs truncate max-w-[200px]">
                <ShieldCheck size={13} className="text-cyan-400 shrink-0" />
                <span className="truncate">{vendorName}</span>
              </div>

              {/* User Pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-900/80 border border-blue-700/60 text-xs font-semibold text-blue-200">
                <User size={13} className="text-cyan-400 shrink-0" />
                <span className="hidden sm:inline font-bold">{hrUserName}</span>
                <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold">HR</span>
              </div>

              {/* Notification Bell with Direct Flyout Popover */}
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={() => setShowNotificationDropdown((prev) => !prev)}
                  className="relative p-2 rounded-xl bg-blue-900/60 hover:bg-blue-800/90 text-blue-200 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-blue-700/60 shadow-xs"
                  title="View Notifications"
                >
                  <Bell size={15} />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-xs">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* Direct Dropdown Popover */}
                {showNotificationDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-slate-800 animate-fadeIn">
                    <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell size={15} className="text-cyan-400" />
                        <h4 className="text-xs font-bold tracking-tight">Vendor HR Notifications</h4>
                        {unreadNotifCount > 0 && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                            {unreadNotifCount} New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadNotifCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllNotifsRead}
                            className="text-[10.5px] font-bold text-cyan-300 hover:text-white transition cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowNotificationDropdown(false)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notificationsList.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">
                          <Bell size={24} className="mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold text-slate-700">No notifications yet.</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Stage updates and interview alerts will appear here.</p>
                        </div>
                      ) : (
                        notificationsList.map((notif, idx) => {
                          const isRead = notif.read || notif.isRead;
                          return (
                            <div
                              key={notif.id || idx}
                              onClick={() => handleMarkNotifRead(notif.id || notif._id)}
                              className={`p-3 transition cursor-pointer flex items-start gap-2.5 ${
                                isRead ? "bg-white hover:bg-slate-50" : "bg-blue-50/70 hover:bg-blue-50"
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isRead ? "bg-slate-300" : "bg-blue-600"}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h5 className={`text-xs font-bold truncate ${isRead ? "text-slate-700" : "text-slate-900"}`}>
                                    {notif.title || "Notification"}
                                  </h5>
                                  <span className="text-[9.5px] text-slate-400 shrink-0 font-mono">
                                    {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                                  {notif.message || notif.text}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 p-3 sm:p-5 w-full overflow-y-auto max-w-full overflow-x-hidden">
          {/* Active Meeting Alert Banner */}
          <ActiveMeetingAlertBanner />

          {/* Quick Action Strip */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Workspace / {activeMenu.toUpperCase()}
              </span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {vendorName}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={loadData}
                className="p-1.5 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1 text-xs font-semibold shadow-2xs"
                title="Refresh Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit Candidate</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: OVERVIEW DASHBOARD (Pixel-Perfect Matching Image 1) */}
          {activeMenu === "overview" && (
            <div className="space-y-6">
              {/* 4 KPI Metric Cards Row - Balanced clean overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">Total Candidates</span>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
                      {dashboardData?.kpis?.totalCandidates ?? applications.length ?? 0}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600 flex items-center space-x-0.5">
                      <span>↑</span>
                      <span>Live DB</span>
                    </div>
                  </div>
                  <Sparkline color="#6366F1" id="c1" />
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">Active Projects</span>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
                      {projectsList.length}
                    </div>
                    <div className="text-[11px] font-bold text-blue-600">
                      Allocated
                    </div>
                  </div>
                  <Sparkline color="#3B82F6" id="c2" />
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">Required Jobs</span>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
                      {jobs.length}
                    </div>
                    <div className="text-[11px] font-bold text-violet-600">
                      Open Trades
                    </div>
                  </div>
                  <Sparkline color="#8B5CF6" id="c3" />
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">Interviews Sched.</span>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
                      {dashboardData?.kpis?.interviewsScheduled ?? interviews.length ?? 0}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600">
                      Rounds Active
                    </div>
                  </div>
                  <Sparkline color="#10B981" id="c4" />
                </div>
              </div>

              {/* Balanced 2x2 Modular Grid: Projects, Jobs, Candidates & Interviews */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Card 1: Active Overseas Projects (FolderKanban) */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <FolderKanban className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-slate-900">Active Overseas Projects</h2>
                          <p className="text-[11px] text-slate-400 font-medium">Assigned manpower projects & quota</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDetailedProject(null);
                          setActiveMenu("projects");
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All ({projectsList.length})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {projectsList.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                          No active projects currently assigned.
                        </div>
                      ) : (
                        projectsList.slice(0, 3).map((p) => (
                          <div
                            key={p.projectId || p.id}
                            onClick={() => {
                              setDetailedProject(p);
                              setActiveMenu("projects");
                            }}
                            className="p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition flex items-center justify-between gap-3 cursor-pointer group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition truncate">
                                  {p.projectName || p.title}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {p.projectId || p.id}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1">
                                <span>📍 {p.destinationCountry || p.country || "Overseas"}</span>
                                <span className="truncate max-w-[150px]">🏢 {p.clientName || "Client"}</span>
                                <span className="text-blue-600 font-semibold font-mono">
                                  Target: {p.targetHiring || p.targetManpower || 50}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  setDetailedProject(p);
                                  setActiveMenu("projects");
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <span>Details</span>
                                <ArrowRight size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProject(p.projectId || p.id);
                                  setActiveMenu("jobs");
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Briefcase size={12} />
                                <span>Jobs</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProject(p.projectId || p.id);
                                  setActiveMenu("candidates");
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Users size={12} />
                                <span>Candidates</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Client: {projectsList[0]?.clientName || "Emirates Engineering & Contracting LLC"}</span>
                    <button
                      type="button"
                      onClick={() => setActiveMenu("projects")}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      View All Projects →
                    </button>
                  </div>
                </div>

                {/* Card 2: Required Jobs & Trades (Briefcase) */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-slate-900">Required Jobs & Trades</h2>
                          <p className="text-[11px] text-slate-400 font-medium">Open trade positions by project</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveMenu("jobs")}
                        className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All ({jobs.length})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {jobs.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                          No trade positions open.
                        </div>
                      ) : (
                        jobs.slice(0, 3).map((j) => (
                          <div
                            key={j.jobId || j.id}
                            className="p-2.5 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/20 transition flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {j.title}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {j.jobId}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                {j.projectName || "Project"} • {formatSalary(j.salaryRange)}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 shrink-0">
                              {j.openings || 10} Openings
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Active Requirements: {dashboardData?.kpis?.activeOpenings || 85}</span>
                    <button
                      type="button"
                      onClick={() => setActiveMenu("jobs")}
                      className="text-violet-600 hover:underline font-semibold"
                    >
                      View All Requirements →
                    </button>
                  </div>
                </div>

                {/* Card 3: Candidates Snapshot (Users) */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-slate-900">Candidates Snapshot</h2>
                          <p className="text-[11px] text-slate-400 font-medium">Recent candidate roster from assigned projects</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveMenu("candidates")}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All ({applications.length})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {applications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                          No candidates submitted yet.
                        </div>
                      ) : (
                        applications.slice(0, 3).map((cand, idx) => (
                          <div
                            key={cand.applicationId || idx}
                            className="p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <img
                                src={AVATARS[idx % AVATARS.length]}
                                alt={cand.candidateName}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-slate-900 truncate">
                                  {cand.candidateName}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {cand.jobTitle || "Technician"} • {cand.projectName || "Project"}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  cand.recruitmentStage === "Joined"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : cand.recruitmentStage?.includes("Interview")
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : cand.recruitmentStage === "Selected"
                                    ? "bg-teal-50 text-teal-700 border-teal-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {cand.recruitmentStage || cand.status || "Applied"}
                              </span>
                              <button
                                type="button"
                                onClick={() => openCandidateModal(cand)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-xs font-bold text-slate-700 transition cursor-pointer"
                              >
                                Process
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Agency: {vendorName}</span>
                    <button
                      type="button"
                      onClick={() => setActiveMenu("candidates")}
                      className="text-emerald-600 hover:underline font-semibold"
                    >
                      View All Candidates →
                    </button>
                  </div>
                </div>

                {/* Card 4: Upcoming Interviews (Calendar) */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-slate-900">Upcoming Interviews</h2>
                          <p className="text-[11px] text-slate-400 font-medium">Scheduled candidate rounds</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveMenu("interviews")}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All ({interviews.length})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {interviews.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                          No upcoming interviews today.
                        </div>
                      ) : (
                        interviews.slice(0, 3).map((item, idx) => (
                          <div
                            key={item.interviewId || idx}
                            className="p-2.5 rounded-xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50/20 transition flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs text-slate-900 truncate">
                                {item.candidateName}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {item.jobTitle} • {item.round}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                {item.scheduledDate} {item.startTime}
                              </span>
                              <button
                                onClick={() => {
                                  if (item.interviewLink) window.open(item.interviewLink, "_blank");
                                  else alert(`Candidate: ${item.candidateName}\nInterviewer: ${item.interviewerName}`);
                                }}
                                className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 shadow-2xs transition cursor-pointer"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Live interview evaluations</span>
                    <button
                      onClick={() => setActiveMenu("interviews")}
                      className="text-sky-600 hover:underline font-semibold"
                    >
                      Open Calendar →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: MY PROJECTS (Assigned Projects & Quotas) */}
          {activeMenu === "projects" && (
            <div className="space-y-4">
              {detailedProject ? (
                /* DETAILED PROJECT VIEW */
                <div className="space-y-4 animate-in fade-in">
                  {/* Top Header / Breadcrumb Card */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => setDetailedProject(null)}
                        className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                        title="Back to Projects List"
                      >
                        <ArrowLeft size={16} />
                        <span className="hidden sm:inline">Back to Projects List</span>
                      </button>
                      <div className="h-7 w-px bg-slate-200 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-mono text-xs font-extrabold border border-indigo-200">
                            {detailedProject.projectId}
                          </span>
                          <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                            {detailedProject.projectName}
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {detailedProject.status || "Active"}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Building2 size={13} className="text-slate-400" />
                            <span>Client: <strong className="text-slate-700">{detailedProject.clientName}</strong></span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe size={13} className="text-slate-400" />
                            <span>Destination: <strong className="text-slate-700">{detailedProject.destinationCountry}</strong></span>
                          </span>
                          <span className="flex items-center gap-1">
                            <ShieldCheck size={13} className="text-indigo-500" />
                            <span>Assigned Agency: <strong className="text-indigo-700">{vendorName}</strong></span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProject(detailedProject.projectId);
                          setActiveMenu("candidates");
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Users size={14} />
                        <span>Filter Roster ({applications.filter((a) => a.projectId === detailedProject.projectId).length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitForm((prev) => ({
                            ...prev,
                            projectId: detailedProject.projectId,
                            jobId: jobs.find((j) => j.projectId === detailedProject.projectId)?.jobId || "",
                          }));
                          setShowSubmitModal(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus size={14} />
                        <span>+ Submit Candidate to Project</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 KPI Metric Cards */}
                  {(() => {
                    const projectCands = applications.filter((a) => a.projectId === detailedProject.projectId);
                    const selectedCount = projectCands.filter((a) =>
                      ["Selected", "Offer Released", "Offer Accepted", "Visa Processing", "Visa Issued", "Joined", "Deployed"].includes(a.recruitmentStage)
                    ).length;
                    const target = detailedProject.targetHiring || 50;
                    const percent = Math.min(100, Math.round((projectCands.length / target) * 100));

                    return (
                      <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-slate-500">Hiring Target Quota</span>
                              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                {target} <span className="text-xs font-bold text-slate-500">Specialists</span>
                              </div>
                              <div className="text-[11px] font-bold text-indigo-600">Target Manpower</div>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                              <Target className="w-5 h-5" />
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-slate-500">Agency Submissions</span>
                              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                {projectCands.length} <span className="text-xs font-bold text-slate-500">Candidates</span>
                              </div>
                              <div className="text-[11px] font-bold text-blue-600">Sourced & Screened</div>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                              <Users className="w-5 h-5" />
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-slate-500">Selected / Deployed</span>
                              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                {selectedCount} <span className="text-xs font-bold text-slate-500">Candidates</span>
                              </div>
                              <div className="text-[11px] font-bold text-emerald-600">Cleared Rounds</div>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-slate-500">Quota Fulfillment</span>
                              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                {percent}%
                              </div>
                              <div className="text-[11px] font-bold text-purple-600">Live Progress</div>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                              <BarChart3 className="w-5 h-5" />
                            </div>
                          </div>
                        </div>

                        {/* Project Details Grid: Scope & Required Positions */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* Left Column: Project Profile & Client Specifications (1 col) */}
                          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <FolderKanban className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-900">Project Specifications</h3>
                                <p className="text-[11px] text-slate-400 font-medium">Overseas assignment scope</p>
                              </div>
                            </div>

                            <div className="space-y-3 text-xs">
                              <div>
                                <span className="text-slate-400 font-medium block">Project Title</span>
                                <span className="font-bold text-slate-900 text-sm">{detailedProject.projectName}</span>
                              </div>

                              <div>
                                <span className="text-slate-400 font-medium block">Client Organization</span>
                                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                                  <Building2 size={13} className="text-blue-600" />
                                  <span>{detailedProject.clientName}</span>
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 font-medium block">Destination Country</span>
                                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                                  <Globe size={13} className="text-indigo-600" />
                                  <span>{detailedProject.destinationCountry}</span>
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 font-medium block">Assigned Manpower Agency</span>
                                <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                                  <ShieldCheck size={13} className="text-emerald-600" />
                                  <span>{vendorName}</span>
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 font-medium block">Contract Notes & Scope</span>
                                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 mt-1 leading-relaxed text-[11px]">
                                  {detailedProject.notes ||
                                    "Overseas technical manpower deployment and candidate shortlisting mandate. Authorized for candidate submission, interview coordination, trade testing verification, and visa milestone clearance."}
                                </p>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-500 font-medium">Fulfillment Status:</span>
                                <span className="font-bold text-indigo-700">{projectCands.length} / {target}</span>
                              </div>
                              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Required Jobs & Trades (2 cols) */}
                          <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                                  <Briefcase className="w-4 h-4" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-bold text-slate-900">Required Trade Specializations & Positions</h3>
                                  <p className="text-[11px] text-slate-400 font-medium">Open trade positions linked to this project</p>
                                </div>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-lg bg-violet-50 text-violet-700 font-bold text-xs border border-violet-100">
                                {jobs.filter((j) => j.projectId === detailedProject.projectId).length || 1} Positions
                              </span>
                            </div>

                            <div className="space-y-3">
                              {jobs.filter((j) => j.projectId === detailedProject.projectId).length === 0 ? (
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                                  General specialized technicians apply to this overseas deployment project.
                                </div>
                              ) : (
                                jobs
                                  .filter((j) => j.projectId === detailedProject.projectId)
                                  .map((job) => (
                                    <div
                                      key={job.jobId}
                                      className="p-3.5 rounded-xl border border-slate-200/80 hover:border-violet-300 hover:bg-violet-50/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                      <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-sm text-slate-900 truncate">
                                            {job.title}
                                          </span>
                                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                                            {job.jobId}
                                          </span>
                                        </div>
                                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                                          <span>💰 {formatSalary(job.salaryRange)}</span>
                                          <span>👥 {job.openings || 10} Openings Required</span>
                                          <span>📍 {detailedProject.destinationCountry}</span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSubmitForm((prev) => ({
                                              ...prev,
                                              projectId: detailedProject.projectId,
                                              jobId: job.jobId,
                                            }));
                                            setShowSubmitModal(true);
                                          }}
                                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                        >
                                          <Plus size={13} />
                                          <span>Submit for this Trade</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Project Candidates Roster Table */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                <Users className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-900">Project Candidate Roster</h3>
                                <p className="text-[11px] text-slate-400 font-medium">
                                  {projectCands.length} candidates currently submitted & in processing for {detailedProject.projectName}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSubmitForm((prev) => ({ ...prev, projectId: detailedProject.projectId }));
                                setShowSubmitModal(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Plus size={13} />
                              <span>+ Add Candidate</span>
                            </button>
                          </div>

                          {projectCands.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                              No candidates submitted for this project yet. Click &quot;+ Add Candidate&quot; to begin sourcing.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10.5px]">
                                  <tr>
                                    <th className="py-2.5 px-3">Candidate</th>
                                    <th className="py-2.5 px-3">Trade / Job</th>
                                    <th className="py-2.5 px-3">Passport #</th>
                                    <th className="py-2.5 px-3">Recruitment Stage</th>
                                    <th className="py-2.5 px-3">Contact</th>
                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {projectCands.map((cand, idx) => (
                                    <tr key={cand.applicationId || idx} className="hover:bg-slate-50/60 transition">
                                      <td className="py-2.5 px-3">
                                        <div className="flex items-center space-x-2.5">
                                          <img
                                            src={AVATARS[idx % AVATARS.length]}
                                            alt={cand.candidateName}
                                            className="w-8 h-8 rounded-full object-cover shrink-0"
                                          />
                                          <div>
                                            <div className="font-bold text-slate-900">{cand.candidateName}</div>
                                            <div className="font-mono text-[10px] text-slate-400">{cand.applicationId}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                                        {cand.jobTitle || "Specialist"}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-slate-600">
                                        {cand.passportNumber || "T7819203"}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                                            cand.recruitmentStage === "Joined"
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                              : cand.recruitmentStage?.includes("Interview")
                                              ? "bg-blue-50 text-blue-700 border-blue-200"
                                              : cand.recruitmentStage === "Selected"
                                              ? "bg-teal-50 text-teal-700 border-teal-200"
                                              : "bg-slate-100 text-slate-700 border-slate-200"
                                          }`}
                                        >
                                          {cand.recruitmentStage || cand.status || "Applied"}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-500">
                                        <div>{cand.candidatePhone || "+91 98765 43210"}</div>
                                        <div className="text-[10px] text-slate-400">{cand.candidateEmail}</div>
                                      </td>
                                      <td className="py-2.5 px-3 text-right">
                                        <button
                                          type="button"
                                          onClick={() => openCandidateModal(cand)}
                                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer"
                                        >
                                          Process Stage →
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                /* ASSIGNED OVERSEAS PROJECTS LIST */
                <div className="space-y-4">
                  {/* Top Header Banner with search, count badge & View Switcher */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">Assigned Overseas Projects</h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                          {filteredProjects.length} Active Assignments
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Your agency is authorized to supply manpower and recruit candidates for these projects. Click on any project to view full requirements & candidate rosters.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Search */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                          placeholder="Search project, code, client..."
                          className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 w-44 sm:w-56"
                        />
                      </div>

                      {/* View Switcher: List vs Grid */}
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setProjectViewMode("list")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                            projectViewMode === "list"
                              ? "bg-white text-indigo-600 shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                          title="List View"
                        >
                          <List size={14} />
                          <span>List</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setProjectViewMode("grid")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                            projectViewMode === "grid"
                              ? "bg-white text-indigo-600 shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                          title="Card Grid View"
                        >
                          <LayoutGrid size={14} />
                          <span>Cards</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowSubmitModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>+ Submit Candidate</span>
                      </button>
                    </div>
                  </div>

                  {/* LIST VIEW (DEFAULT) */}
                  {projectViewMode === "list" ? (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase text-[10.5px] border-b border-slate-200/80 tracking-wider">
                            <tr>
                              <th className="py-3 px-4">Project & Code</th>
                              <th className="py-3 px-4">Client & Destination</th>
                              <th className="py-3 px-3 text-center">Hiring Target</th>
                              <th className="py-3 px-3 text-center">Submitted</th>
                              <th className="py-3 px-3 text-center">Selected / Joined</th>
                              <th className="py-3 px-4">Quota Progress</th>
                              <th className="py-3 px-3 text-center">Status</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredProjects.length === 0 ? (
                              <tr>
                                <td colSpan="8" className="py-10 text-center text-slate-400">
                                  No projects match your filter.
                                </td>
                              </tr>
                            ) : (
                              filteredProjects.map((prj) => {
                                const projectCands = applications.filter((a) => a.projectId === prj.projectId);
                                const selectedCount = projectCands.filter((a) =>
                                  ["Selected", "Offer Released", "Offer Accepted", "Visa Processing", "Visa Issued", "Joined", "Deployed"].includes(a.recruitmentStage)
                                ).length;
                                const target = prj.targetHiring || 50;
                                const percent = Math.min(100, Math.round((projectCands.length / target) * 100));

                                return (
                                  <tr
                                    key={prj.projectId}
                                    onClick={() => setDetailedProject(prj)}
                                    className="hover:bg-blue-50/30 transition cursor-pointer group"
                                  >
                                    <td className="py-3.5 px-4">
                                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                                        {prj.projectName}
                                      </div>
                                      <div className="font-mono text-slate-400 text-[10px]">
                                        {prj.projectId}
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                                        <Building2 size={12} className="text-slate-400 shrink-0" />
                                        <span className="truncate max-w-[180px]">{prj.clientName}</span>
                                      </div>
                                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                        <Globe size={11} className="text-slate-400 shrink-0" />
                                        <span>{prj.destinationCountry}</span>
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-3 text-center font-bold text-slate-900">
                                      {target} <span className="text-[10px] text-slate-400 font-normal">Quota</span>
                                    </td>
                                    <td className="py-3.5 px-3 text-center">
                                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        {projectCands.length} Candidates
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-3 text-center">
                                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                        {selectedCount} Selected
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <div className="w-32 space-y-1">
                                        <div className="flex items-center justify-between text-[10.5px]">
                                          <span className="text-slate-500 font-semibold">{percent}%</span>
                                          <span className="text-slate-400">{projectCands.length}/{target}</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                          <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                                            style={{ width: `${percent}%` }}
                                          />
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-3 text-center">
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        {prj.status || "Active"}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-right">
                                      <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={() => setDetailedProject(prj)}
                                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                        >
                                          <span>View Details</span>
                                          <ArrowRight size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSubmitForm((prev) => ({ ...prev, projectId: prj.projectId }));
                                            setShowSubmitModal(true);
                                          }}
                                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                        >
                                          <Plus size={13} />
                                          <span>Submit</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* GRID VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProjects.map((prj) => {
                        const projectCands = applications.filter((a) => a.projectId === prj.projectId);
                        const selectedCount = projectCands.filter((a) =>
                          ["Selected", "Offer Released", "Offer Accepted", "Visa Processing", "Visa Issued", "Joined", "Deployed"].includes(a.recruitmentStage)
                        ).length;
                        const target = prj.targetHiring || 50;
                        const percent = Math.min(100, Math.round((projectCands.length / target) * 100));

                        return (
                          <div
                            key={prj.projectId}
                            onClick={() => setDetailedProject(prj)}
                            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition space-y-4 flex flex-col justify-between cursor-pointer group"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-[11px] border border-indigo-100 font-mono">
                                  {prj.projectId}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {prj.status}
                                </span>
                              </div>

                              <div>
                                <h3 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition">
                                  {prj.projectName}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">Client: {prj.clientName}</span>
                                </p>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>Destination: {prj.destinationCountry}</span>
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-slate-500">Hiring Target:</span>
                                <span className="text-slate-900 font-bold">{target} Specialists</span>
                              </div>
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-slate-500">Submitted by Agency:</span>
                                <span className="text-indigo-600 font-bold">{projectCands.length} Candidates</span>
                              </div>
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-slate-500">Selected / Joined:</span>
                                <span className="text-emerald-600 font-bold">{selectedCount} Candidates</span>
                              </div>

                              {/* Progress Bar */}
                              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>

                              <div className="pt-2 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setDetailedProject(prj)}
                                  className="flex-1 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1"
                                >
                                  <span>View Details</span>
                                  <ArrowRight size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubmitForm((prev) => ({ ...prev, projectId: prj.projectId }));
                                    setShowSubmitModal(true);
                                  }}
                                  className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer text-center"
                                >
                                  + Submit
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: JOBS DIRECTORY (List Table View by default with Switcher & Quick Submission) */}
          {activeMenu === "jobs" && (
            <div className="space-y-4">
              {/* Top Banner with Search, Department Filter, View Switcher & Action */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Open Job Requirements</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                      {filteredJobs.length} Active Trades
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Active manpower positions and specialized trades authorized for your vendor recruitment team.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      placeholder="Search trade, code, location..."
                      className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 w-44 sm:w-56"
                    />
                  </div>

                  {/* Department Filter */}
                  {uniqueDepartments.length > 0 && (
                    <select
                      value={jobDeptFilter}
                      onChange={(e) => setJobDeptFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
                    >
                      <option value="ALL">All Trade Sectors</option>
                      {uniqueDepartments.map((dept, idx) => (
                        <option key={idx} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* View Mode Switcher */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setJobViewMode("list")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                        jobViewMode === "list"
                          ? "bg-white text-blue-600 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                      title="List View"
                    >
                      <List size={14} />
                      <span>List</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setJobViewMode("grid")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                        jobViewMode === "grid"
                          ? "bg-white text-blue-600 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                      title="Card Grid View"
                    >
                      <LayoutGrid size={14} />
                      <span>Cards</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Submit Candidate</span>
                  </button>
                </div>
              </div>

              {/* LIST VIEW (DEFAULT) - Compact, balanced, zero-overflow */}
              {jobViewMode === "list" ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase text-[10.5px] border-b border-slate-200/80 tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3.5">Trade & Sector</th>
                          <th className="py-2.5 px-3">Project & Location</th>
                          <th className="py-2.5 px-3">Experience</th>
                          <th className="py-2.5 px-3">Salary Package</th>
                          <th className="py-2.5 px-3 text-center">Slots / Sourced</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredJobs.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-10 text-center text-slate-400">
                              No trade requirements match your filter.
                            </td>
                          </tr>
                        ) : (
                          filteredJobs.map((job) => {
                            const jobCands = applications.filter((a) => a.jobId === job.jobId || a.jobTitle === job.title);
                            const remaining = (job.openings || 10) - (job.filledPositions || 0);

                            return (
                              <tr key={job.jobId} className="hover:bg-blue-50/30 transition group">
                                <td className="py-2.5 px-3.5">
                                  <div className="font-bold text-slate-900 group-hover:text-blue-600 transition text-xs">
                                    {job.title}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-slate-400 text-[10px]">
                                      {job.jobId}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-slate-100 text-slate-600 uppercase">
                                      {job.department || job.tradeCategory || "MEP"}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                                    <Building2 size={12} className="text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[170px]" title={job.projectName}>{job.projectName || "Overseas Deployment"}</span>
                                  </div>
                                  <div className="text-[10.5px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                    <MapPin size={10} className="text-slate-400 shrink-0" />
                                    <span>{job.location || "Dubai, UAE"}</span>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap text-xs">
                                  {job.experienceLevel || "3-5 Yrs"}
                                </td>

                                <td className="py-2.5 px-3 font-bold text-blue-700 whitespace-nowrap text-xs">
                                  {formatSalary(job.salaryRange)}
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10.5px] border border-emerald-200 whitespace-nowrap">
                                      {remaining} Slots
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCandidateSearch(job.title);
                                        setActiveMenu("candidates");
                                      }}
                                      className="font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded text-[10.5px] border border-indigo-200 transition cursor-pointer whitespace-nowrap"
                                      title="View Candidates for this Job"
                                    >
                                      {jobCands.length} Sourced
                                    </button>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                    {job.status || "Open"}
                                  </span>
                                </td>

                                <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSubmitForm((prev) => ({
                                        ...prev,
                                        jobId: job.jobId,
                                        projectId: job.projectId || prev.projectId,
                                      }));
                                      setShowSubmitModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                  >
                                    <Plus size={13} />
                                    <span>Submit</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* CARDS VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredJobs.map((job) => (
                    <div
                      key={job.jobId}
                      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between hover:border-blue-300 transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                            {job.department || "MEP"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {job.status || "Open"}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 leading-snug">{job.title}</h3>
                        <p className="text-xs text-slate-500">{job.location || "Dubai, UAE"}</p>

                        <div className="space-y-1 text-xs text-slate-600 font-medium pt-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Experience:</span>
                            <span className="font-semibold text-slate-800">{job.experienceLevel || "3-5 Yrs"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Salary Package:</span>
                            <span className="font-bold text-blue-600">{formatSalary(job.salaryRange)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Remaining Openings:</span>
                            <span className="font-bold text-emerald-700">{job.openings - (job.filledPositions || 0)} Slots</span>
                          </div>
                        </div>

                        {/* Skills Tags */}
                        {Array.isArray(job.skills) && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {job.skills.map((sk, sIdx) => (
                              <span key={sIdx} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                                {typeof sk === "object" ? (sk.name || sk.skill || JSON.stringify(sk)) : String(sk)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSubmitForm((prev) => ({
                            ...prev,
                            jobId: job.jobId,
                            projectId: job.projectId || prev.projectId,
                          }));
                          setShowSubmitModal(true);
                        }}
                        className="w-full mt-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer text-center flex items-center justify-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Submit Candidate for this Trade</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 4: CANDIDATES MANAGEMENT (Pre-Selection & Screening Funnel - Matches Admin Options) */}
          {activeMenu === "candidates" && (
            <div className="space-y-4">
              {/* Header Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Candidate Directory & Screening</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      {preSelectionCount} Candidates
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluate profiles, review CV & passport, shortlist, hold, reject, and schedule interviews. Selected candidates move to <strong>Candidate Milestones</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveMenu("milestones")}
                    className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sliders size={13} className="text-teal-700" />
                    <span>Go to Selected Milestones ({postSelectionCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Submit Candidate</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    placeholder="Search candidate by name, passport, trade, project or phone..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {/* Status Tabs Bar */}
                <div className="flex items-center space-x-1.5 flex-wrap">
                  {[
                    { id: "ALL", label: `All (${preSelectionCount})` },
                    {
                      id: "Applied",
                      label: `Applied (${
                        preSelectionCandidates.filter(
                          (c) =>
                            !c.recruitmentStage ||
                            ["Applied", "Screening", "Submitted", "Under Review", "On Hold"].includes(c.recruitmentStage) ||
                            ["Applied", "Submitted", "Under Review"].includes(c.status)
                        ).length
                      })`,
                    },
                    {
                      id: "Shortlisted",
                      label: `Shortlisted (${
                        preSelectionCandidates.filter((c) => c.recruitmentStage === "Shortlisted" || c.status === "Shortlisted").length
                      })`,
                    },
                    {
                      id: "Interview",
                      label: `Interview (${
                        preSelectionCandidates.filter(
                          (c) => c.recruitmentStage?.includes("Interview") || c.status?.includes("Interview")
                        ).length
                      })`,
                    },
                    {
                      id: "Rejected",
                      label: `Rejected (${
                        preSelectionCandidates.filter((c) => c.recruitmentStage === "Rejected" || c.status === "Rejected").length
                      })`,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCandidateStageFilter(tab.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        candidateStageFilter === tab.id
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pre-Selection Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                      <tr>
                        <th className="py-3 px-4">Candidate Profile & CV</th>
                        <th className="py-3 px-4">Job & Project</th>
                        <th className="py-3 px-3">Screening Stage</th>
                        <th className="py-3 px-4">HR Decisions (Admin Controls)</th>
                        <th className="py-3 px-4 text-right">Dossier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredCandidates.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-10 text-center text-slate-400">
                            No candidates found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredCandidates.map((cand, idx) => {
                          const resumeLink = cand.resumeUrl || (Array.isArray(cand.documents) && cand.documents[0]?.fileUrl);

                          return (
                            <tr key={cand.applicationId || cand.id || idx} className="hover:bg-blue-50/20 transition">
                              {/* Col 1: Profile + Resume */}
                              <td className="py-3 px-4">
                                <div className="flex items-start space-x-2.5">
                                  <img
                                    src={AVATARS[idx % AVATARS.length]}
                                    alt={cand.candidateName}
                                    className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
                                  />
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-900 text-xs truncate">{cand.candidateName}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      {cand.passportNumber ? `🛂 ${cand.passportNumber}` : `ID: ${cand.candidateId || cand.applicationId}`}
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                      {cand.candidatePhone || cand.candidateEmail}
                                    </div>
                                    {resumeLink ? (
                                      <a
                                        href={resumeLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[9.5px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 mt-1 cursor-pointer transition"
                                        title="Open Candidate Resume / CV in new tab"
                                      >
                                        <FileText size={10} />
                                        <span>View CV / Resume</span>
                                        <ExternalLink size={9} />
                                      </a>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1">
                                        <FileText size={10} />
                                        <span>CV Verified</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Col 2: Job & Project */}
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-800 text-xs truncate max-w-[190px]">
                                  {cand.jobTitle || "Specialist Technician"}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Building2 size={11} className="text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[180px]">{cand.projectName || "Overseas Deployment"}</span>
                                </div>
                                <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">
                                  Vendor: {cand.vendorName || vendorName}
                                </div>
                              </td>

                              {/* Col 3: Current Stage Badge (Click to open section) */}
                              <td className="py-3 px-3">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateByTag(cand.recruitmentStage || cand.status, cand);
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 whitespace-nowrap cursor-pointer hover:shadow-xs hover:scale-105 active:scale-95 transition ${
                                    cand.recruitmentStage === "Shortlisted"
                                      ? "bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100"
                                      : cand.recruitmentStage?.includes("Interview")
                                      ? "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
                                      : cand.recruitmentStage === "Rejected" || cand.status === "Rejected"
                                      ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                      : cand.recruitmentStage === "On Hold" || cand.status === "On Hold"
                                      ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                      : cand.recruitmentStage === "Selected"
                                      ? "bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100"
                                      : cand.recruitmentStage === "Visa Issued"
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                                  }`}
                                  title={`Click to open ${cand.recruitmentStage || cand.status || "Candidates"} section`}
                                >
                                  {cand.recruitmentStage === "Rejected" || cand.status === "Rejected" ? "✕ " : "● "}
                                  <span>{cand.recruitmentStage || cand.status || "Applied"}</span>
                                  <ArrowRight size={10} className="text-slate-400 shrink-0" />
                                </button>
                                {cand.rejectionReason && (
                                  <div
                                    className="text-[10px] text-rose-600 font-medium truncate max-w-[160px] mt-1"
                                    title={cand.rejectionReason}
                                  >
                                    Reason: {cand.rejectionReason}
                                  </div>
                                )}
                              </td>

                              {/* Col 4: Pre-Screening Decisions & Lifecycle Actions */}
                              <td className="py-3 px-4">
                                {/* Case A: Applied / Screening / Submitted -> Strictly Shortlist & Reject together */}
                                {(!cand.recruitmentStage ||
                                  ["Applied", "Screening", "Submitted", "Under Review", "On Hold"].includes(cand.recruitmentStage || cand.status)) &&
                                  cand.recruitmentStage !== "Shortlisted" &&
                                  !cand.recruitmentStage?.includes("Interview") &&
                                  cand.recruitmentStage !== "Rejected" &&
                                  cand.status !== "Rejected" && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                                      Screening Decision:
                                    </span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => handleQuickStage(cand, "Shortlisted")}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                        title="Shortlist for Interview"
                                      >
                                        <Check size={11} />
                                        <span>Shortlist</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleQuickStage(cand, "Rejected", "Rejected during HR screening")}
                                        className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition cursor-pointer"
                                        title="Reject Candidate"
                                      >
                                        <X size={11} />
                                        <span>Reject</span>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Case B: Shortlisted -> Schedule Interview */}
                                {cand.recruitmentStage === "Shortlisted" && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-indigo-600 block">Shortlisted Cleared:</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setScheduleInterviewTarget(cand);
                                        setScheduleForm((prev) => ({
                                          ...prev,
                                          applicationId: cand.applicationId,
                                          round: "L1 Interview",
                                        }));
                                        setShowScheduleModal(true);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                    >
                                      <Calendar size={12} />
                                      <span>Schedule Interview</span>
                                    </button>
                                  </div>
                                )}

                                {/* Case C: Interview Scheduled / L1 / L2 -> Select or Reject */}
                                {(cand.recruitmentStage?.includes("Interview") || cand.status?.includes("Interview")) && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-purple-700 block">Interview Active:</span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => handleQuickStage(cand, "Selected")}
                                        className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                        title="Select Candidate (Cleared Interview & Moves to Candidate Milestones!)"
                                      >
                                        <Award size={12} />
                                        <span>Select Candidate</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleQuickStage(cand, "Rejected", "Did not clear technical interview round")}
                                        className="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition cursor-pointer"
                                        title="Reject Candidate"
                                      >
                                        <X size={11} />
                                        <span>Reject</span>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Case D: Rejected -> Available in Vendor Pool for Reassignment */}
                                {(cand.recruitmentStage === "Rejected" || cand.status === "Rejected") && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 block">In Vendor Pool:</span>
                                    <button
                                      type="button"
                                      onClick={() => openReassignModal(cand)}
                                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                      title="Submit this candidate to a different overseas project"
                                    >
                                      <RotateCcw size={12} />
                                      <span>Apply to Another Project</span>
                                    </button>
                                  </div>
                                )}
                              </td>

                              {/* Col 5: Dossier Details */}
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => openCandidateModal(cand)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1"
                                >
                                  <span>Manage</span>
                                  <ArrowRight size={12} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: SHORTLISTED CANDIDATES */}
          {activeMenu === "shortlisted" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Shortlisted Candidates Roster</h2>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      {filteredShortlisted.length} Shortlisted
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Candidates approved by HR screening. Schedule technical rounds, hold, or reject before interview.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search shortlisted candidates..."
                      value={shortlistSearch}
                      onChange={(e) => setShortlistSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                    />
                    {shortlistSearch && (
                      <button
                        type="button"
                        onClick={() => setShortlistSearch("")}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {filteredShortlisted.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
                    <UserCheck size={18} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">No Shortlisted Candidates</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Screen candidates from the "All Candidates" directory to shortlist candidates for upcoming interviews.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">Candidate & Identity</th>
                        <th className="py-3 px-4">Applied Trade & Project</th>
                        <th className="py-3 px-3 text-center">Stage</th>
                        <th className="py-3 px-4 text-center">Next Action</th>
                        <th className="py-3 px-4 text-right">Dossier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredShortlisted.map((cand, idx) => (
                        <tr key={cand.applicationId || cand.id || idx} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={AVATARS[idx % AVATARS.length]}
                                alt=""
                                className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                              />
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 text-xs truncate">{cand.candidateName}</h4>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                                  <span>{cand.passportNumber ? `🛂 ${cand.passportNumber}` : `ID: ${cand.applicationId?.slice(0, 8)}`}</span>
                                  {cand.candidatePhone && <span>• 📞 {cand.candidatePhone}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 truncate">{cand.jobTitle || "Trade Specialist"}</div>
                            <div className="text-[11px] text-blue-700 font-medium truncate mt-0.5">{cand.projectName || "Dubai Project"}</div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => navigateByTag("Shortlisted", cand)}
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 cursor-pointer hover:scale-105 transition"
                              title="Click to view Shortlisted section"
                            >
                              Shortlisted
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setScheduleInterviewTarget(cand);
                                  setScheduleForm((prev) => ({
                                    ...prev,
                                    applicationId: cand.applicationId,
                                    round: "L1 Technical Round",
                                  }));
                                  setShowScheduleModal(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Calendar size={13} />
                                <span>Schedule Interview</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickStage(cand, "On Hold", "Placed on hold by Vendor HR")}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs border border-amber-200 transition cursor-pointer"
                                title="Put Candidate On Hold"
                              >
                                <Clock size={12} />
                                <span>Hold</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickStage(cand, "Rejected", "Rejected during shortlisting")}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition cursor-pointer"
                                title="Reject Candidate"
                              >
                                <X size={12} />
                                <span>Reject</span>
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => openCandidateModal(cand)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1"
                            >
                              <span>Details</span>
                              <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW 6: TECHNICAL INTERVIEWS & ASSESSMENTS (TABLE / LIST VIEW) */}
          {activeMenu === "interviews" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Technical Interviews & Assessments</h2>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      {filteredInterviews.length} Scheduled
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluate candidate technical capabilities, join online meetings, and finalize Selection or Rejection.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="relative w-64">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search interview or candidate..."
                      value={interviewSearch}
                      onChange={(e) => setInterviewSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                    />
                    {interviewSearch && (
                      <button
                        type="button"
                        onClick={() => setInterviewSearch("")}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer flex items-center space-x-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule Interview</span>
                  </button>
                </div>
              </div>

              {filteredInterviews.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
                    <Calendar size={18} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">No Interviews Scheduled</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Shortlisted candidates can be scheduled for technical interview rounds using the button above.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">Candidate Info</th>
                        <th className="py-3 px-4">Trade & Project</th>
                        <th className="py-3 px-3 text-center">Round / Status</th>
                        <th className="py-3 px-4">Schedule & Interviewer</th>
                        <th className="py-3 px-3 text-center">Meeting</th>
                        <th className="py-3 px-4 text-center">Decision Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInterviews.map((item, idx) => {
                        const cand = item.candidateRef || item;
                        return (
                          <tr key={item.interviewId || idx} className="hover:bg-slate-50/60 transition">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={AVATARS[idx % AVATARS.length]}
                                  alt=""
                                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                                />
                                <div className="min-w-0">
                                  <h4 className="font-bold text-slate-900 text-xs truncate">{item.candidateName}</h4>
                                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                    {item.candidatePhone ? `📞 ${item.candidatePhone}` : cand.passportNumber ? `🛂 ${cand.passportNumber}` : `ID: ${item.interviewId || "N/A"}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800 truncate">{item.jobTitle || cand.jobTitle || "Trade Specialist"}</div>
                              <div className="text-[11px] text-blue-700 font-medium truncate mt-0.5">{item.projectName || cand.projectName || "Project"}</div>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <div className="space-y-1">
                                <button
                                  type="button"
                                  onClick={() => navigateByTag("Interview", cand)}
                                  className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 cursor-pointer hover:scale-105 transition"
                                  title="Click to view Interviews section"
                                >
                                  Interview
                                </button>
                                <div>
                                  <span className="inline-block px-2 py-0.2 rounded-full text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    {item.round || "Technical"} ({item.status || "Scheduled"})
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-900 flex items-center gap-1">
                                  <Clock size={11} className="text-slate-400" />
                                  <span>{item.scheduledDate}, {item.startTime}</span>
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Interviewer: <strong className="text-slate-700">{item.interviewerName}</strong>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              {item.interviewLink ? (
                                <a
                                  href={item.interviewLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-2xs transition"
                                >
                                  <Video size={12} />
                                  <span>Join Meet</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">No link</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleQuickStage(cand, "Selected", "Candidate cleared technical interview round and is selected")}
                                  className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="Select Candidate (Moves to Selected Candidates Roster & Milestones)"
                                >
                                  <Award size={12} />
                                  <span>Select Candidate</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickStage(cand, "Rejected", "Candidate did not clear technical round")}
                                  className="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition cursor-pointer"
                                  title="Reject Candidate (Moves to Rejected Talent Pool for Reassignment)"
                                >
                                  <X size={12} />
                                  <span>Reject</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFeedbackInterviewTarget(item);
                                    setShowFeedbackModal(true);
                                  }}
                                  className="px-2 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition cursor-pointer"
                                  title="Record Interview Evaluation Notes"
                                >
                                  <span>Feedback</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW: ON-HOLD CANDIDATES */}
          {activeMenu === "on-hold" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Candidates On Hold</h2>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {filteredOnHold.length} On Hold
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Candidates pending client feedback or quota review. You can re-shortlist or reject them at any time.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search on-hold candidates..."
                      value={onHoldSearch}
                      onChange={(e) => setOnHoldSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    />
                    {onHoldSearch && (
                      <button
                        type="button"
                        onClick={() => setOnHoldSearch("")}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {filteredOnHold.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-amber-600">
                    <Clock size={18} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">No Candidates On Hold</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    No applicants are currently placed on hold.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">Candidate & Identity</th>
                        <th className="py-3 px-4">Trade & Project</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                        <th className="py-3 px-4 text-right">Dossier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOnHold.map((cand, idx) => (
                        <tr key={cand.applicationId || cand.id || idx} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={AVATARS[idx % AVATARS.length]}
                                alt=""
                                className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                              />
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 text-xs truncate">{cand.candidateName}</h4>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                                  <span>{cand.passportNumber ? `🛂 ${cand.passportNumber}` : `ID: ${cand.applicationId?.slice(0, 8)}`}</span>
                                  {cand.candidatePhone && <span>• 📞 {cand.candidatePhone}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 truncate">{cand.jobTitle || "Trade Specialist"}</div>
                            <div className="text-[11px] text-blue-700 font-medium truncate mt-0.5">{cand.projectName || "Project"}</div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => navigateByTag("On Hold", cand)}
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 cursor-pointer hover:scale-105 transition"
                              title="Click to view On Hold section"
                            >
                              On Hold
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleQuickStage(cand, "Shortlisted", "Shortlisted from on-hold review")}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <Check size={12} />
                                <span>Shortlist Candidate</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickStage(cand, "Rejected", "Rejected from on-hold")}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition cursor-pointer"
                              >
                                <X size={12} />
                                <span>Reject</span>
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => openCandidateModal(cand)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1"
                            >
                              <span>Details</span>
                              <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW: REJECTED CANDIDATES / TALENT POOL */}
          {activeMenu === "rejected" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Rejected Candidates / Talent Pool</h2>
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      {filteredRejected.length} Candidates
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Candidates rejected in prior project evaluations. They remain in your vendor talent pool and can be re-applied to other open project requirements.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search rejected candidates..."
                      value={rejectedSearch}
                      onChange={(e) => setRejectedSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                    />
                    {rejectedSearch && (
                      <button
                        type="button"
                        onClick={() => setRejectedSearch("")}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {filteredRejected.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <XCircle size={18} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">No Rejected Candidates</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    There are no rejected candidates in your current talent pool.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">Candidate & Identity</th>
                        <th className="py-3 px-4">Previous Project & Trade</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Talent Pool Action</th>
                        <th className="py-3 px-4 text-right">Dossier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRejected.map((cand, idx) => (
                        <tr key={cand.applicationId || cand.id || idx} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={AVATARS[idx % AVATARS.length]}
                                alt=""
                                className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                              />
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 text-xs truncate">{cand.candidateName}</h4>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                                  <span>{cand.passportNumber ? `🛂 ${cand.passportNumber}` : `ID: ${cand.applicationId?.slice(0, 8)}`}</span>
                                  {cand.candidatePhone && <span>• 📞 {cand.candidatePhone}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 truncate">{cand.jobTitle || "Trade Specialist"}</div>
                            <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{cand.projectName || "Previous Project"}</div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => navigateByTag("Rejected", cand)}
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer hover:scale-105 transition"
                              title="Click to view Rejected section"
                            >
                              Rejected
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => openReassignModal(cand)}
                              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Submit this candidate to another open project quota"
                            >
                              <RotateCcw size={12} />
                              <span>Apply to Another Project</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => openCandidateModal(cand)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1"
                            >
                              <span>Details</span>
                              <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW 5: DEDICATED CANDIDATE MILESTONES & PROCESSING TIMELINE (Matches Admin Processing List) */}
          {(activeMenu === "milestones" || activeMenu === "selected") && (
            <div className="space-y-4">
              {/* Case 1: When a Selected Candidate is picked, show full Processing Timeline (Compact Box without Dossier) */}
              {selectedMilestoneApp ? (
                <div className="space-y-3">
                  {/* Top Compact Bar: Back button, Candidate overview, and Processing ID */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedMilestoneApp(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
                      >
                        <ArrowLeft size={14} />
                        <span>Back</span>
                      </button>
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {selectedMilestoneApp.candidateName?.charAt(0).toUpperCase() || <UserCheck size={16} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {selectedMilestoneApp.candidateName}
                          </h3>
                          <span className="font-mono text-[11px] font-bold px-2 py-0.2 bg-teal-50 text-teal-800 border border-teal-200 rounded">
                            {selectedMilestoneApp.jobTitle || "Selected Candidate"}
                          </span>
                          <span className="px-2 py-0.2 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-200">
                            ● {selectedMilestoneApp.recruitmentStage || selectedMilestoneApp.status || "Selected"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium flex items-center gap-2 flex-wrap mt-0.5">
                          <span>Passport: <strong className="text-slate-800">{selectedMilestoneApp.passportNumber ? `🛂 ${selectedMilestoneApp.passportNumber}` : "Verified"}</strong></span>
                          <span>•</span>
                          <span>Project: <strong className="text-blue-700">{selectedMilestoneApp.projectName}</strong></span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80">
                        ID: {selectedMilestoneApp.applicationId || selectedMilestoneApp.id}
                      </span>
                    </div>
                  </div>

                  {/* Integrated Candidate Process Timeline (Milestones ke niche hi processing stages show) */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Clock size={16} className="text-indigo-600" />
                        <span>Candidate Deployment Milestones & Stage Verification</span>
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">Sequential verification & vendor payments</span>
                    </div>

                    <CandidateProcessTimeline
                      application={selectedMilestoneApp}
                      isAdmin={true}
                      onUpdate={handleTimelineUpdate}
                    />
                  </div>
                </div>
              ) : (
                /* Case 2: Selected Candidates Roster List */
                <div className="space-y-4">
                  {/* Section Title Card */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">Selected Candidate Milestones & Processing</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          {postSelectionCandidates.length} Selected Candidates
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Post-selection deployment workflow: Trade verification, medicals, visas & flight deployment. Milestones unlock strictly upon vendor payment.
                      </p>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Selected</span>
                      <div className="text-xl font-bold text-slate-900 mt-1">{postSelectionCandidates.length}</div>
                      <span className="text-[10.5px] text-teal-700 font-semibold mt-0.5 block">Cleared interview</span>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Active Processing</span>
                      <div className="text-xl font-bold text-blue-600 mt-1">
                        {postSelectionCandidates.filter((c) => c.recruitmentStage !== "Joined" && c.recruitmentStage !== "Deployed").length}
                      </div>
                      <span className="text-[10.5px] text-blue-700 font-semibold mt-0.5 block">Milestones active</span>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Awaiting Payment</span>
                      <div className="text-xl font-bold text-amber-600 mt-1">
                        {postSelectionCandidates.filter((cand) => {
                          const milestones = Array.isArray(cand.processMilestones) && cand.processMilestones.length > 0 ? cand.processMilestones : [];
                          return milestones.some((m) => Number(m.paymentAmount) > 0 && m.paymentStatus !== "Approved");
                        }).length}
                      </div>
                      <span className="text-[10.5px] text-amber-700 font-semibold mt-0.5 block">Payment gate active</span>
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mobilized / Joined</span>
                      <div className="text-xl font-bold text-emerald-600 mt-1">
                        {postSelectionCandidates.filter((c) => c.recruitmentStage === "Joined" || c.recruitmentStage === "Deployed").length}
                      </div>
                      <span className="text-[10.5px] text-emerald-700 font-semibold mt-0.5 block">Deployment completed</span>
                    </div>
                  </div>

                  {/* Search & Filter Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[240px]">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={milestoneSearchQuery}
                        onChange={(e) => setMilestoneSearchQuery(e.target.value)}
                        placeholder="Search selected candidate by name, passport, trade, project or vendor..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-500">Deployment Stage:</span>
                      <select
                        value={milestoneStageFilter}
                        onChange={(e) => setMilestoneStageFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer"
                      >
                        <option value="ALL">All Selected Candidates ({postSelectionCandidates.length})</option>
                        <option value="Selected">1. Selected</option>
                        <option value="Offer Released">2. Offer Released</option>
                        <option value="Visa Processing">3. Visa Processing</option>
                        <option value="Visa Issued">4. Visa Issued</option>
                        <option value="Joined">5. Joined / Deployed</option>
                      </select>
                    </div>
                  </div>

                  {/* Selected Candidates Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                          <tr>
                            <th className="py-3 px-4">Selected Candidate & Passport</th>
                            <th className="py-3 px-4">Trade & Project</th>
                            <th className="py-3 px-3">Stage</th>
                            <th className="py-3 px-4">Active Milestone & Progress</th>
                            <th className="py-3 px-4">Payment Gate</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {filteredMilestoneCandidates.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="py-12 text-center text-slate-400">
                                <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <div className="font-bold text-slate-700">No selected candidates found matching criteria.</div>
                                <div className="text-xs text-slate-400 mt-0.5">Select candidates from the Candidates tab to initiate deployment milestones.</div>
                              </td>
                            </tr>
                          ) : (
                            filteredMilestoneCandidates.map((cand, idx) => {
                              const milestones =
                                Array.isArray(cand.processMilestones) && cand.processMilestones.length > 0
                                  ? cand.processMilestones
                                  : crmVendorService.syncAppMilestonesWithProject
                                  ? crmVendorService.syncAppMilestonesWithProject(cand)
                                  : [];

                              // Calculate Active Milestone
                              let activeM = null;
                              let activeMIdx = 0;
                              for (let mIdx = 0; mIdx < milestones.length; mIdx++) {
                                const m = milestones[mIdx];
                                const isMComplete =
                                  m.status === "Completed" ||
                                  (Array.isArray(m.stages) && m.stages.length > 0 && m.stages.every((s) => s.status === "Completed"));
                                if (!isMComplete) {
                                  activeM = m;
                                  activeMIdx = mIdx;
                                  break;
                                }
                              }
                              if (!activeM && milestones.length > 0) {
                                activeM = milestones[milestones.length - 1];
                                activeMIdx = milestones.length - 1;
                              }

                              const totalStages = milestones.reduce((sum, m) => sum + (Array.isArray(m.stages) ? m.stages.length : 0), 0);
                              const doneStages = milestones.reduce((sum, m) => sum + (Array.isArray(m.stages) ? m.stages.filter((s) => s.status === "Completed").length : 0), 0);
                              const percentDone = totalStages > 0 ? Math.round((doneStages / totalStages) * 100) : 0;

                              const prevM = activeMIdx > 0 ? milestones[activeMIdx - 1] : null;
                              const isPrevDone =
                                activeMIdx === 0 ||
                                prevM?.status === "Completed" ||
                                (Array.isArray(prevM?.stages) && prevM.stages.length > 0 && prevM.stages.every((s) => s.status === "Completed"));
                              const isMApproved = activeM?.paymentStatus === "Approved" || activeM?.status === "Paid";
                              const mAmt = Number(activeM?.paymentAmount || activeM?.amount || 0);
                              const mRequiresPayment = isPrevDone && mAmt > 0 && !isMApproved;
                              const isMLocked = !isPrevDone;

                              const currentSubStage = activeM?.stages?.find((s) => s.status !== "Completed") || activeM?.stages?.[0];

                              return (
                                <tr key={cand.applicationId || cand.id || idx} className="hover:bg-teal-50/20 transition">
                                  {/* Col 1: Profile + Passport */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-start space-x-2.5">
                                      <img
                                        src={AVATARS[idx % AVATARS.length]}
                                        alt={cand.candidateName}
                                        className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
                                      />
                                      <div className="min-w-0">
                                        <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                                          <span>{cand.candidateName}</span>
                                          <span className="text-[9.5px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded font-mono font-bold">
                                            Selected
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                          {cand.passportNumber ? `🛂 ${cand.passportNumber}` : `ID: ${cand.candidateId || cand.applicationId}`}
                                        </div>
                                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                          {cand.candidatePhone || cand.candidateEmail}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Col 2: Job & Project */}
                                  <td className="py-3 px-4">
                                    <div className="font-bold text-slate-800 text-xs truncate max-w-[190px]">
                                      {cand.jobTitle || "Specialist Technician"}
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                      <Building2 size={11} className="text-slate-400 shrink-0" />
                                      <span className="truncate max-w-[180px]">{cand.projectName}</span>
                                    </div>
                                    <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">
                                      Vendor: {cand.vendorName || vendorName}
                                    </div>
                                  </td>

                                  {/* Col 3: Stage Badge */}
                                  <td className="py-3 px-3">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigateByTag(cand.recruitmentStage || "Selected", cand);
                                      }}
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 whitespace-nowrap cursor-pointer hover:scale-105 transition ${
                                        cand.recruitmentStage === "Joined" || cand.recruitmentStage === "Deployed"
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                          : cand.recruitmentStage === "Visa Issued"
                                          ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                          : cand.recruitmentStage === "Visa Processing"
                                          ? "bg-purple-50 text-purple-800 border-purple-200"
                                          : "bg-teal-50 text-teal-800 border-teal-200"
                                      }`}
                                      title={`Click to view ${cand.recruitmentStage || "Selected"} section`}
                                    >
                                      ● {cand.recruitmentStage || "Selected"}
                                    </button>
                                    <div className="text-[10px] text-slate-400 mt-1 font-semibold">
                                      Overall: {percentDone}% Done
                                    </div>
                                  </td>

                                  {/* Col 4: Active Milestone & Progress */}
                                  <td className="py-3 px-4">
                                    <div className="space-y-1.5 max-w-[210px]">
                                      <div className="text-[11px] font-bold text-slate-900 truncate">
                                        {activeM?.name || `Milestone ${activeMIdx + 1}`}
                                      </div>
                                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
                                          style={{ width: `${percentDone}%` }}
                                        />
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                        <Clock size={10} className="text-slate-400 shrink-0" />
                                        <span className="truncate">Stage: {currentSubStage?.name || "Processing"}</span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Col 5: Payment Gate Status */}
                                  <td className="py-3 px-4">
                                    {isMLocked ? (
                                      <div className="space-y-0.5">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1">
                                          <Lock size={10} />
                                          <span>Milestone Locked</span>
                                        </span>
                                        <div className="text-[9.5px] text-slate-400">Complete preceding milestone first</div>
                                      </div>
                                    ) : mRequiresPayment ? (
                                      <div className="space-y-0.5">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                          <Lock size={10} className="text-amber-600" />
                                          <span>Payment Required: ₹{mAmt.toLocaleString()}</span>
                                        </span>
                                        <div className="text-[9.5px] text-amber-700 font-semibold">
                                          Stages locked awaiting vendor payment
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-0.5">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                          <Unlock size={10} className="text-emerald-600" />
                                          <span>Payment Approved</span>
                                        </span>
                                        <div className="text-[9.5px] text-emerald-700 font-semibold">
                                          Stages unlocked for HR processing
                                        </div>
                                      </div>
                                    )}
                                  </td>

                                  {/* Col 6: Actions */}
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end space-x-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedMilestoneApp(cand)}
                                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer inline-flex items-center gap-1.5"
                                        title="Open Full Processing Timeline & Stepper"
                                      >
                                        <Clock size={12} />
                                        <span>View Timeline</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openCandidateModal(cand)}
                                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
                                        title="Open Full Candidate Dossier"
                                      >
                                        Dossier
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 8: JOINED CANDIDATES & VISA WORKSPACE */}
          {activeMenu === "joined" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Visa Processing & Site Deployment</h2>
                  <p className="text-xs text-slate-500">
                    Overseas employment visa clearance, medicals, tickets, and site reporting status.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                  {applications.filter((a) => a.visaDetails?.visaStatus && a.visaDetails.visaStatus !== "Not Started").length} Visas Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {applications
                  .filter((a) => ["Visa Processing", "Visa Issued", "Joined"].includes(a.recruitmentStage) || (a.visaDetails && a.visaDetails.visaStatus && a.visaDetails.visaStatus !== "Not Started"))
                  .map((cand, idx) => (
                    <div
                      key={cand.applicationId || idx}
                      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between hover:border-indigo-300 transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {cand.visaDetails?.visaStatus || "Visa Issued"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {cand.projectName?.split(" ")[0]}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2.5">
                          <img
                            src={AVATARS[idx % AVATARS.length]}
                            alt={cand.candidateName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 leading-tight">{cand.candidateName}</h3>
                            <p className="text-xs text-slate-500">{cand.jobTitle}</p>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Visa Type:</span>
                            <span className="font-semibold text-slate-800">{cand.visaDetails?.visaType || "Employment Visa"}</span>
                          </div>
                          {cand.visaDetails?.visaNumber && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Visa Ref #:</span>
                              <span className="font-bold text-slate-900">{cand.visaDetails.visaNumber}</span>
                            </div>
                          )}
                          {cand.visaDetails?.flightDetails && (
                            <div className="flex justify-between text-emerald-700">
                              <span>Flight Ticket:</span>
                              <span className="font-bold">{cand.visaDetails.flightDetails}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => openCandidateModal(cand)}
                        className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer text-center"
                      >
                        Update Visa / Departure Status
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* VIEW: VISA ALLOTTED CANDIDATES */}
          {activeMenu === "visa-allotted" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Visa Allotted Candidates</h2>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {filteredVisaAllotted.length} Visa Allotted
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Candidates whose employment visa has been approved & issued. Track visa numbers, departure dates, and deployment.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-64">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search visa allotted candidates..."
                      value={visaSearch}
                      onChange={(e) => setVisaSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    />
                    {visaSearch && (
                      <button
                        type="button"
                        onClick={() => setVisaSearch("")}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {filteredVisaAllotted.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600">
                    <Plane size={18} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">No Visa Allotted Candidates Yet</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Candidates who complete Milestone 3 (Visa Approved) or have visa reference issued will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">Candidate & Identity</th>
                        <th className="py-3 px-4">Trade & Project</th>
                        <th className="py-3 px-3 text-center">Stage Tag</th>
                        <th className="py-3 px-4">Visa Reference #</th>
                        <th className="py-3 px-4">Flight / Deployment</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredVisaAllotted.map((cand, idx) => (
                        <tr key={cand.applicationId || cand.id || idx} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={AVATARS[idx % AVATARS.length]}
                                alt=""
                                className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                              />
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 text-xs truncate">{cand.candidateName}</h4>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                                  <span>{cand.passportNumber ? `🛂 ${cand.passportNumber}` : `ID: ${cand.applicationId?.slice(0, 8)}`}</span>
                                  {cand.candidatePhone && <span>• 📞 {cand.candidatePhone}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 truncate">{cand.jobTitle || "Specialist"}</div>
                            <div className="text-[11px] text-blue-700 font-medium truncate mt-0.5">{cand.projectName || "Project"}</div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => navigateByTag("Visa Allotted", cand)}
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1 cursor-pointer hover:scale-105 transition"
                              title="Click to view Visa Allotted section"
                            >
                              <CheckCircle2 size={11} className="text-emerald-600" />
                              <span>Visa Allotted</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-slate-900 text-xs">
                              {cand.visaDetails?.visaNumber || cand.visaNumber || "DXB-2026-98124"}
                            </div>
                            <div className="text-[10.5px] text-slate-400 mt-0.5">
                              Status: {cand.visaDetails?.visaStatus || "Visa Issued"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {cand.visaDetails?.flightDetails ? (
                              <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                                <Plane size={12} className="text-indigo-600 shrink-0" />
                                <span className="truncate max-w-[200px]">{cand.visaDetails.flightDetails}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                                Flight Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => openCandidateModal(cand)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1 border border-emerald-200"
                            >
                              <span>Update Visa</span>
                              <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}


          {/* VIEW 10: HR PERSONNEL PROFILE ONLY */}
          {activeMenu === "profile" && (
            <div className="max-w-2xl space-y-6">
              {/* HR Account Details Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center space-x-4 border-b border-slate-100 pb-4">
                  <img
                    src={AVATARS[0]}
                    alt={hrUserName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-slate-900 truncate">{hrUserName}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-indigo-600 font-bold">Authorized Vendor HR Officer</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email || "priya.sharma@vendorhr.com"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-semibold mb-0.5">Full Name</span>
                    <span className="font-bold text-slate-800 text-sm">{hrUserName}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-semibold mb-0.5">Designation / Role</span>
                    <span className="font-bold text-indigo-700 text-sm">Vendor HR Officer</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-semibold mb-0.5">Email Address</span>
                    <span className="font-bold text-slate-800">{user?.email || "priya.sharma@vendorhr.com"}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-semibold mb-0.5">Contact Phone</span>
                    <span className="font-bold text-slate-800">{user?.phone || "+91 98765 43210"}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-semibold mb-0.5">Staff / Employee ID</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {user?.employeeId || user?.id?.slice(0, 8) || "HR-VND-4082"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-semibold mb-0.5">Department</span>
                    <span className="font-bold text-slate-800">Human Resources & Recruitment</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                    <span className="text-slate-400 block font-semibold mb-0.5">Assigned Agency Representation</span>
                    <span className="font-bold text-slate-800">{vendorName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Dashboard Footer matching other dashboards (AppFooter style) */}
        <footer className="select-none shrink-0 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-blue-100 border-t border-blue-800/80 shadow-md mt-auto h-[48px] min-h-[48px] px-4 sm:px-6 flex items-center">
          <div className="w-full flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-end gap-0.5 select-none font-bold text-sm tracking-tight leading-none text-white">
                <span>immi</span>
                <span className="text-cyan-400">Go</span>
              </div>
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

      {/* MODAL 1: SUBMIT NEW CANDIDATE */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Submit New Candidate</h3>
                <p className="text-xs text-slate-500">Add candidate to assigned project pipeline</p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCandidateSubmit} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={submitForm.fullName}
                  onChange={(e) => setSubmitForm({ ...submitForm, fullName: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={submitForm.email}
                    onChange={(e) => setSubmitForm({ ...submitForm, email: e.target.value })}
                    placeholder="ramesh@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={submitForm.phone}
                    onChange={(e) => setSubmitForm({ ...submitForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Project *</label>
                <select
                  required
                  value={submitForm.projectId}
                  onChange={(e) => setSubmitForm({ ...submitForm, projectId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                >
                  <option value="">Select an assigned project</option>
                  {projectsList.map((p) => (
                    <option key={p.projectId} value={p.projectId}>
                      {p.projectName} ({p.projectId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Trade / Job Designation</label>
                <select
                  value={submitForm.jobId}
                  onChange={(e) => setSubmitForm({ ...submitForm, jobId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                >
                  <option value="">Select Trade</option>
                  {jobs.map((j) => (
                    <option key={j.jobId} value={j.jobId}>
                      {j.title} ({j.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Trade Skills (comma separated)</label>
                <input
                  type="text"
                  value={submitForm.skills}
                  onChange={(e) => setSubmitForm({ ...submitForm, skills: e.target.value })}
                  placeholder="Wiring, Switchgear, Blueprint reading..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Submit Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CANDIDATE DETAIL & STAGE / OFFER / VISA UPDATE */}
      {showCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedCandidate.candidateName}</h3>
                <p className="text-xs text-slate-500">
                  {selectedCandidate.jobTitle} • {selectedCandidate.projectName}
                </p>
              </div>
              <button
                onClick={() => setShowCandidateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Candidate Master CV / Resume Dossier Link */}
            {selectedCandidate.resumeUrl || (Array.isArray(selectedCandidate.documents) && selectedCandidate.documents[0]?.fileUrl) ? (
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs">
                <span className="text-blue-900 font-semibold flex items-center gap-1.5">
                  <FileText size={13} className="text-blue-600" />
                  <span>Candidate CV / Resume Dossier:</span>
                </span>
                <a
                  href={selectedCandidate.resumeUrl || selectedCandidate.documents[0].fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:text-blue-900 font-bold inline-flex items-center gap-1 underline cursor-pointer"
                >
                  <span>Open Full CV / Resume PDF</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            ) : null}

            {/* Alert Banner if Candidate is Rejected -> Quick Reassign Access */}
            {(selectedCandidate.recruitmentStage === "Rejected" || selectedCandidate.status === "Rejected") && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-rose-900 text-xs">Candidate Rejected for this Project</h4>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    This candidate profile remains active in your vendor talent pool. You can re-allocate them to another overseas client project right away.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCandidateModal(false);
                    openReassignModal(selectedCandidate);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reassign to Other Project</span>
                </button>
              </div>
            )}

            {/* Post-Selection Milestone Tracker & Payment Status */}
            {["Selected", "Offer Released", "Visa Processing", "Visa Issued", "Joined"].includes(selectedCandidate.recruitmentStage) && (
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-teal-900 text-xs flex items-center gap-1.5">
                    <Award size={14} className="text-teal-700" />
                    <span>Selected Candidate • Deployment Milestones</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-emerald-700 border border-emerald-300">
                    Vendor Milestone Payment: Verified / Active
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10.5px]">
                  <div className="p-2 rounded bg-white border border-teal-100 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">1</span>
                    <span className="font-semibold text-slate-700 truncate">Docs Verified</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-teal-100 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">2</span>
                    <span className="font-semibold text-slate-700 truncate">Trade & Medical</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-teal-100 flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      ["Visa Processing", "Visa Issued", "Joined"].includes(candidateUpdateForm.stage) ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
                    }`}>3</span>
                    <span className="font-semibold text-slate-700 truncate">Visa Approved</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-teal-100 flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      ["Joined", "Deployed"].includes(candidateUpdateForm.stage) ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
                    }`}>4</span>
                    <span className="font-semibold text-slate-700 truncate">Flight Mobilized</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleCandidateUpdate} className="space-y-4 text-xs font-medium">
              {/* Stage Transition Select */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <label className="block text-slate-900 font-bold">Update Recruitment Stage *</label>
                <select
                  value={candidateUpdateForm.stage}
                  onChange={(e) => setCandidateUpdateForm({ ...candidateUpdateForm, stage: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                >
                  <option value="Applied">Applied</option>
                  <option value="Shortlisted">Shortlist</option>
                  <option value="Interview">Interview</option>
                  <option value="Selected">Selected</option>
                  <option value="Visa Issued">Visa Allotted</option>
                  <option value="On Hold">Hold</option>
                  <option value="Rejected">Reject</option>
                </select>
                <input
                  type="text"
                  value={candidateUpdateForm.remarks}
                  onChange={(e) => setCandidateUpdateForm({ ...candidateUpdateForm, remarks: e.target.value })}
                  placeholder="Add evaluation remarks or milestone notes..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                />
              </div>

              {/* Visa & Flight Deployment Section */}
              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2.5">
                <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                  <Plane className="w-4 h-4 text-blue-600" />
                  <span>Visa & Flight Deployment Details</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Visa Status</label>
                    <select
                      value={candidateUpdateForm.visaStatus}
                      onChange={(e) => setCandidateUpdateForm({ ...candidateUpdateForm, visaStatus: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs cursor-pointer"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Documents Submitted">Documents Submitted</option>
                      <option value="In Process">In Process</option>
                      <option value="Medical Passed">Medical Passed</option>
                      <option value="Visa Issued">Visa Issued</option>
                      <option value="Flight Booked">Flight Booked</option>
                      <option value="Deployed">Deployed at Site</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Visa Reference #</label>
                    <input
                      type="text"
                      value={candidateUpdateForm.visaNumber}
                      onChange={(e) => setCandidateUpdateForm({ ...candidateUpdateForm, visaNumber: e.target.value })}
                      placeholder="e.g. DXB-2026-98124"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Flight Booking & Departure Details</label>
                  <input
                    type="text"
                    value={candidateUpdateForm.flightDetails}
                    onChange={(e) => setCandidateUpdateForm({ ...candidateUpdateForm, flightDetails: e.target.value })}
                    placeholder="e.g. Emirates EK-513 (DEL -> DXB) on 12-Nov-2026"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setScheduleInterviewTarget(selectedCandidate);
                    setScheduleForm((prev) => ({
                      ...prev,
                      applicationId: selectedCandidate.applicationId,
                    }));
                    setShowCandidateModal(false);
                    setShowScheduleModal(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center space-x-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule Interview</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCandidateModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? "Saving..." : "Save Progress"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SCHEDULE INTERVIEW */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Schedule Interview Round</h3>
                <p className="text-xs text-slate-500">Coordinate technical or HR evaluation session</p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Candidate *</label>
                <select
                  required
                  value={scheduleInterviewTarget?.applicationId || scheduleForm.applicationId}
                  onChange={(e) => {
                    const match = applications.find((a) => a.applicationId === e.target.value);
                    setScheduleInterviewTarget(match);
                    setScheduleForm({ ...scheduleForm, applicationId: e.target.value });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs cursor-pointer"
                >
                  <option value="">Choose a candidate for interview</option>
                  {applications
                    .filter((a) => !["Selected", "Rejected", "Joined", "Deployed"].includes(a.recruitmentStage))
                    .map((a) => (
                      <option key={a.applicationId} value={a.applicationId}>
                        {a.candidateName} — {a.jobTitle} [{a.recruitmentStage || "Shortlisted"}]
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Interview Round</label>
                <select
                  value={scheduleForm.round}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, round: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs cursor-pointer font-bold"
                >
                  <option value="Technical Interview">Technical Interview</option>
                  <option value="Client Evaluation">Client Evaluation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Scheduled Date</label>
                  <input
                    type="text"
                    value={scheduleForm.scheduledDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                    placeholder="e.g. Today or 15-Nov"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Time</label>
                  <input
                    type="text"
                    value={scheduleForm.startTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                    placeholder="e.g. 11:00 AM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Interviewer (Vendor HR ya Admin / Super Admin)</label>
                <select
                  value={scheduleForm.interviewerName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, interviewerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs cursor-pointer font-bold"
                >
                  <option value="Vendor HR">Vendor HR ({hrUserName})</option>
                  <option value="Admin / Super Admin">Admin / Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Google Meet / Video Link</label>
                <input
                  type="url"
                  value={scheduleForm.interviewLink}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, interviewLink: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Scheduling..." : "Schedule Round"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RECORD FEEDBACK */}
      {showFeedbackModal && feedbackInterviewTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Interview Evaluation</h3>
                <p className="text-xs text-slate-500">
                  {feedbackInterviewTarget.candidateName} • {feedbackInterviewTarget.round}
                </p>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Technical Score (1-5 Stars)</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= feedbackForm.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-extrabold text-slate-800 text-sm ml-2">
                    {feedbackForm.rating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Recommendation</label>
                <select
                  value={feedbackForm.recommendation}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, recommendation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs cursor-pointer font-bold"
                >
                  <option value="Shortlist">Shortlist for Next Round / Selection</option>
                  <option value="Select Directly">Direct Selection Approved</option>
                  <option value="Hold">Put on Hold</option>
                  <option value="Reject">Reject Candidate</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Evaluation Comments</label>
                <textarea
                  rows="3"
                  value={feedbackForm.feedback}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Save Evaluation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 5: REASSIGN REJECTED CANDIDATE TO ANOTHER PROJECT */}
      {showReassignModal && reassignTargetCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Reassign Candidate to Another Project</h3>
                <p className="text-xs text-slate-500">
                  Re-allocate {reassignTargetCandidate.candidateName} from vendor candidate pool
                </p>
              </div>
              <button
                onClick={() => setShowReassignModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Candidate Summary Box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Candidate Name:</span>
                <span className="font-bold text-slate-900">{reassignTargetCandidate.candidateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Passport / ID:</span>
                <span className="font-mono text-slate-700">
                  {reassignTargetCandidate.passportNumber || reassignTargetCandidate.candidateId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Previous / Rejected Project:</span>
                <span className="text-rose-700 font-semibold truncate max-w-[220px]">
                  {reassignTargetCandidate.projectName}
                </span>
              </div>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select New Target Project *</label>
                <select
                  required
                  value={reassignForm.projectId}
                  onChange={(e) => {
                    const selectedProjId = e.target.value;
                    const matchedProj = projectsList.find((p) => p.projectId === selectedProjId);
                    const defaultJob = jobs.find((j) => j.projectId === selectedProjId);
                    setReassignForm({
                      ...reassignForm,
                      projectId: selectedProjId,
                      projectName: matchedProj?.projectName || "",
                      jobId: defaultJob?.jobId || "",
                      jobTitle: defaultJob?.title || "",
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer font-bold"
                >
                  <option value="">Select an available active project</option>
                  {projectsList.map((p) => (
                    <option key={p.projectId} value={p.projectId}>
                      {p.projectName} ({p.destinationCountry || "Overseas"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Trade Job / Designation</label>
                <select
                  value={reassignForm.jobId}
                  onChange={(e) => {
                    const jbId = e.target.value;
                    const jb = jobs.find((j) => j.jobId === jbId);
                    setReassignForm({
                      ...reassignForm,
                      jobId: jbId,
                      jobTitle: jb?.title || "",
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="">Select Trade Job</option>
                  {jobs
                    .filter((j) => !reassignForm.projectId || j.projectId === reassignForm.projectId)
                    .map((j) => (
                      <option key={j.jobId} value={j.jobId}>
                        {j.title} ({j.department || "Technical"})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reassignment Notes & Justification</label>
                <textarea
                  rows="2"
                  value={reassignForm.notes}
                  onChange={(e) => setReassignForm({ ...reassignForm, notes: e.target.value })}
                  placeholder="e.g. Candidate trade skill verified; re-allocated to Dubai Metro project requirement"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>{actionLoading ? "Reassigning..." : "Confirm Reassignment"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: POST-SELECTION MILESTONE STEPPER & STAGE VERIFICATION */}
      {showMilestoneStepperModal && selectedMilestoneCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                    <span>Candidate Deployment Milestones</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      Sequential Paid Stages
                    </span>
                  </h3>
                  <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="font-semibold text-white">{selectedMilestoneCandidate.candidateName}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-300">
                      {selectedMilestoneCandidate.passportNumber
                        ? `🛂 ${selectedMilestoneCandidate.passportNumber}`
                        : `ID: ${selectedMilestoneCandidate.applicationId || selectedMilestoneCandidate.id}`}
                    </span>
                    <span>•</span>
                    <span className="text-teal-300">{selectedMilestoneCandidate.projectName}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMilestoneStepperModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Sequential Rule Banner */}
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start space-x-3 text-xs">
                <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-slate-700 space-y-1">
                  <span className="font-bold text-blue-900 block">
                    Strict Sequential Progression & Payment Gate Rules:
                  </span>
                  <p className="text-[11.5px] leading-relaxed text-slate-600">
                    1. <strong>Payment Gate:</strong> Stages for a milestone unlock <em>only after</em> the Vendor pays for that milestone (Approved).
                    <br />
                    2. <strong>Sequential Lock:</strong> Milestone 2 & subsequent milestones remain <strong>LOCKED</strong> until all stages of the previous milestone are 100% completed by Vendor HR.
                    <br />
                    3. <strong>Live Sync:</strong> Stages completed here immediately update the Vendor Portal in real-time.
                  </p>
                </div>
              </div>

              {/* Milestones Container */}
              <div className="space-y-4">
                {(selectedMilestoneCandidate.processMilestones || []).map((milestone, mIdx) => {
                  const milestones = selectedMilestoneCandidate.processMilestones || [];
                  const prevMilestone = mIdx > 0 ? milestones[mIdx - 1] : null;
                  const isPrevCompleted =
                    mIdx === 0 ||
                    prevMilestone?.status === "Completed" ||
                    (Array.isArray(prevMilestone?.stages) &&
                      prevMilestone.stages.length > 0 &&
                      prevMilestone.stages.every((s) => s.status === "Completed"));

                  const isMilestoneStagesCompleted =
                    Array.isArray(milestone.stages) &&
                    milestone.stages.length > 0 &&
                    milestone.stages.every((s) => s.status === "Completed");

                  const isCompleted = milestone.status === "Completed" || isMilestoneStagesCompleted;
                  const isLocked = !isPrevCompleted;
                  const isApproved = milestone.paymentStatus === "Approved" || milestone.status === "Paid";
                  const amt = Number(milestone.paymentAmount || milestone.amount || 0);
                  const requiresPayment = !isLocked && amt > 0 && !isApproved;
                  const isUnlockedAndActive = !isLocked && !requiresPayment && !isCompleted;

                  return (
                    <div
                      key={milestone.id || mIdx}
                      className={`rounded-2xl border transition overflow-hidden ${
                        isCompleted
                          ? "border-emerald-200 bg-emerald-50/20"
                          : isUnlockedAndActive
                          ? "border-blue-300 bg-white shadow-xs ring-2 ring-blue-50"
                          : requiresPayment
                          ? "border-amber-300 bg-amber-50/20"
                          : "border-slate-200 bg-slate-50/60 opacity-85"
                      }`}
                    >
                      {/* Milestone Header */}
                      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isCompleted
                                ? "bg-emerald-600 text-white"
                                : isUnlockedAndActive
                                ? "bg-blue-600 text-white"
                                : requiresPayment
                                ? "bg-amber-600 text-white"
                                : "bg-slate-300 text-slate-600"
                            }`}
                          >
                            {isCompleted ? <Check size={14} /> : isLocked ? <Lock size={12} /> : `M${mIdx + 1}`}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                              {milestone.name || `Milestone ${mIdx + 1}`}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {milestone.stages?.length || 0} Sub-stages in this deployment phase
                            </div>
                          </div>
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center space-x-2">
                          {/* Payment Amount / Approval Badge */}
                          {amt > 0 ? (
                            isApproved ? (
                              <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <Unlock size={11} className="text-emerald-700" />
                                <span>Paid: ₹{amt.toLocaleString()}</span>
                              </span>
                            ) : isLocked ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 flex items-center gap-1">
                                <Lock size={10} />
                                <span>Fee: ₹{amt.toLocaleString()}</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
                                <IndianRupee size={11} className="text-amber-800" />
                                <span>Awaiting Payment: ₹{amt.toLocaleString()}</span>
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              No Fee
                            </span>
                          )}

                          {/* Milestone Progress Status */}
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                              isCompleted
                                ? "bg-emerald-100 text-emerald-800"
                                : isUnlockedAndActive
                                ? "bg-blue-100 text-blue-800"
                                : requiresPayment
                                ? "bg-amber-100 text-amber-900"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {isCompleted
                              ? "✓ Completed"
                              : isUnlockedAndActive
                              ? "● In Progress"
                              : requiresPayment
                              ? "🔒 Payment Gate Active"
                              : "🔒 Locked"}
                          </span>
                        </div>
                      </div>

                      {/* Milestone Body */}
                      <div className="p-3.5 sm:p-4">
                        {/* CASE 1: Previous milestone incomplete -> Strictly Locked */}
                        {isLocked && (
                          <div className="p-3 rounded-xl bg-slate-100/90 border border-slate-200 flex items-center space-x-2.5 text-xs text-slate-600">
                            <Lock size={15} className="text-slate-400 shrink-0" />
                            <div>
                              <span className="font-bold text-slate-700">Milestone Locked: </span>
                              <span>All stages of {prevMilestone?.name || `Milestone ${mIdx}`} must be 100% completed before this milestone can begin.</span>
                            </div>
                          </div>
                        )}

                        {/* CASE 2: Previous milestone done, but Payment is required from Vendor */}
                        {requiresPayment && (
                          <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 space-y-2.5 text-xs">
                            <div className="flex items-start space-x-2.5">
                              <Lock size={16} className="text-amber-700 shrink-0 mt-0.5" />
                              <div className="text-amber-900">
                                <span className="font-bold">Sub-stages Gated by Payment: </span>
                                <span>
                                  Vendor has not yet completed payment for this milestone (<strong>₹{amt.toLocaleString()}</strong>). Sub-stages cannot be updated by HR until payment is verified.
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-amber-200/80">
                              <span className="text-[11px] text-amber-800 font-medium">
                                Received payment offline / bank transfer?
                              </span>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleApproveMilestonePayment(milestone.id)}
                                className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                              >
                                <Check size={12} />
                                <span>Verify & Approve Payment (₹{amt.toLocaleString()})</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* CASE 3: Milestone is unlocked and active OR completed -> Show Stages */}
                        {!isLocked && !requiresPayment && (
                          <div className="space-y-3">
                            {(milestone.stages || []).map((stage, sIdx) => {
                              const isStageDone = stage.status === "Completed";
                              const isPrevStageDone =
                                sIdx === 0 || milestone.stages[sIdx - 1]?.status === "Completed";
                              const isStageActive = !isStageDone && isPrevStageDone;
                              const isStageLocked = !isPrevStageDone;

                              return (
                                <div
                                  key={stage.id || sIdx}
                                  className={`p-3 rounded-xl border transition ${
                                    isStageDone
                                      ? "bg-emerald-50/60 border-emerald-200"
                                      : isStageActive
                                      ? "bg-blue-50/40 border-blue-300 ring-1 ring-blue-100"
                                      : "bg-slate-50 border-slate-200 opacity-60"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start space-x-2.5 min-w-0">
                                      <div className="mt-0.5 shrink-0">
                                        {isStageDone ? (
                                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                            <Check size={11} />
                                          </div>
                                        ) : isStageActive ? (
                                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center animate-pulse">
                                            <Circle size={8} fill="currentColor" />
                                          </div>
                                        ) : (
                                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                                            <Lock size={10} />
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-bold text-xs text-slate-900 truncate">
                                          {sIdx + 1}. {stage.name}
                                        </div>
                                        {isStageDone && (
                                          <div className="text-[10.5px] text-emerald-800 mt-0.5 space-y-0.5">
                                            <div>
                                              ✓ Completed on {stage.completedAt || "Recent"} by {stage.completedBy || "Vendor HR"}
                                            </div>
                                            {stage.remark && (
                                              <div className="text-[10px] text-slate-600 italic">
                                                Remark: "{stage.remark}"
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        {isStageLocked && (
                                          <div className="text-[10px] text-slate-400 mt-0.5">
                                            Locked: Complete Stage {sIdx} first
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action Box for Active Stage */}
                                    {isStageActive && (
                                      <div className="shrink-0 flex items-center space-x-2">
                                        {completingStageId === stage.id ? (
                                          <div className="flex items-center space-x-1.5 animate-in fade-in">
                                            <input
                                              type="text"
                                              value={stageCompletionRemark}
                                              onChange={(e) => setStageCompletionRemark(e.target.value)}
                                              placeholder="Enter verification remark..."
                                              className="px-2.5 py-1 bg-white border border-blue-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 w-44 sm:w-56"
                                            />
                                            <button
                                              type="button"
                                              disabled={actionLoading}
                                              onClick={() => handleCompleteMilestoneStage(milestone.id, stage.id)}
                                              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer disabled:opacity-50"
                                            >
                                              {actionLoading ? "Saving..." : "Confirm"}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setCompletingStageId(null);
                                                setStageCompletionRemark("");
                                              }}
                                              className="px-2 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setCompletingStageId(stage.id);
                                              setStageCompletionRemark(`Verified by Vendor HR (${hrUserName})`);
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                                          >
                                            <Check size={12} />
                                            <span>Mark Stage Done</span>
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-teal-600" />
                <span>All updates reflect immediately in the Vendor's Candidate Tracking portal.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMilestoneStepperModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Close Stepper
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
