import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import vendorHRService from "../../services/vendorHRService.js";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";
import ActiveMeetingAlertBanner from "../../components/common/meeting/ActiveMeetingAlertBanner.jsx";

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

  // Modals state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleInterviewTarget, setScheduleInterviewTarget] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackInterviewTarget, setFeedbackInterviewTarget] = useState(null);
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
    round: "L1 Interview",
    scheduledDate: "Today",
    startTime: "11:00 AM",
    interviewerName: "Er. Rajesh K (Technical Lead)",
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
      }
    } catch (err) {
      console.error("Failed to load Vendor HR dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, selectedProject]);

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

  // Sidebar navigation configuration
  const navMenuItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "projects", label: "My Projects", icon: FolderKanban, badge: projectsList.length },
    { id: "jobs", label: "Jobs", icon: Briefcase, badge: jobs.length },
    { id: "candidates", label: "Candidates", icon: Users, badge: applications.length },
    { id: "pipeline", label: "Recruitment Pipeline", icon: Layers },
    { id: "interviews", label: "Interviews", icon: Calendar, badge: interviews.length },
    { id: "offers", label: "Visa Issued & Granted", icon: Plane },
    { id: "activity", label: "Activity History", icon: History },
    { id: "profile", label: "Profile", icon: User },
  ];

  const vendorName =
    dashboardData?.vendor?.companyName ||
    user?.vendors?.[0]?.companyName ||
    user?.vendorName ||
    "Global Staffing Solutions Pvt Ltd";

  const hrUserName = user?.name || "Priya Sharma";

  // Filtered Candidates list for Candidates tab
  const filteredCandidates = useMemo(() => {
    return applications.filter((cand) => {
      const matchSearch =
        !candidateSearch ||
        cand.candidateName?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        cand.candidateEmail?.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        cand.candidatePhone?.includes(candidateSearch) ||
        cand.applicationId?.toLowerCase().includes(candidateSearch.toLowerCase());

      const matchStage =
        candidateStageFilter === "ALL" ||
        cand.recruitmentStage === candidateStageFilter ||
        cand.status === candidateStageFilter;

      return matchSearch && matchStage;
    });
  }, [applications, candidateSearch, candidateStageFilter]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex font-sans antialiased">
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

      {/* 1. LEFT SIDEBAR (Dark Navy #0B0F19 matching image 1) */}
      <aside className="w-64 bg-[#0B0F19] text-white flex flex-col justify-between shrink-0 min-h-screen p-4 border-r border-slate-900 select-none">
        <div className="space-y-6">
          {/* Logo & Portal Label */}
          <div className="px-2 pt-2">
            <ImmiGoLogo size="sm" theme="light" subtitle="Vendor HR Portal" />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navMenuItems.map((item) => {
              const Icon = item.icon;
              const active = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    active
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {Boolean(item.badge) && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Help card & Profile pill */}
        <div className="space-y-3 pt-4 border-t border-slate-800/80">
          {/* Need Help Card */}
          <div
            onClick={() => alert("Vendor HR Support Desk: support@immigo.com | Toll Free: 1800-244-836")}
            className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition"
          >
            <div className="flex items-center space-x-2.5">
              <Headphones className="w-4 h-4 text-indigo-400" />
              <div>
                <div className="text-xs font-semibold text-white">Need Help?</div>
                <div className="text-[10px] text-slate-400">Contact Support</div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </div>

          {/* User Profile Pill */}
          <div
            onClick={() => setActiveMenu("profile")}
            className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 cursor-pointer hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <img
                  src={AVATARS[0]}
                  alt={hrUserName}
                  className="w-8 h-8 rounded-full object-cover border border-indigo-400/40"
                />
                <div>
                  <div className="text-xs font-bold text-white leading-tight">{hrUserName}</div>
                  <div className="text-[10px] text-slate-400">Vendor HR</div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-[10px] text-slate-400 font-medium pl-10 truncate">
              Vendor: {vendorName}
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/80 px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Good morning, {hrUserName.split(" ")[0]}</span>
              <span className="text-2xl">👋</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeMenu === "overview" && "Here's your recruitment overview for today"}
              {activeMenu === "projects" && "Assigned overseas projects and trade allocations"}
              {activeMenu === "jobs" && "Open job positions and manpower requirements"}
              {activeMenu === "candidates" && "Complete candidate directory and status management"}
              {activeMenu === "pipeline" && "Interactive recruitment Kanban board"}
              {activeMenu === "interviews" && "Scheduled technical rounds and evaluations"}
              {activeMenu === "offers" && "Offer letters released and salary packages"}
              {activeMenu === "joined" && "Visa processing, flight booking and deployed personnel"}
              {activeMenu === "activity" && "Real-time recruitment activity audit trail"}
              {activeMenu === "profile" && "Account settings and vendor agency details"}
            </p>
          </div>

          {/* Top Right Controls matching Image 1 */}
          <div className="flex items-center space-x-3">
            {/* Dynamic Project Selector Dropdown */}
            <div className="relative flex items-center">
              <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="pl-8 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs appearance-none hover:bg-slate-50 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Projects ({projectsList.length})</option>
                {projectsList.map((p) => (
                  <option key={p.projectId || p.id} value={p.projectId || p.id}>
                    {p.projectName} ({p.projectId})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
            </div>

            {/* Date Range Dropdown */}
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="pl-8 pr-7 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs appearance-none hover:bg-slate-50 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Today">Today</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="All Time">All Time</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
            </div>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu("activity")}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {interviews.length || 3}
                </span>
              </button>
            </div>

            {/* Logout icon */}
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 shadow-xs transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-8 space-y-6 max-w-[1600px] w-full">
          {/* Active Meeting Banner (visible until completed) */}
          <ActiveMeetingAlertBanner />
          {/* Quick Action Strip */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Workspace / {activeMenu.toUpperCase()}
              </span>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                {vendorName}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={loadData}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 flex items-center space-x-1.5 transition cursor-pointer"
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
                        onClick={() => setActiveMenu("projects")}
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
                            className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 truncate">
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
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setActiveMenu("jobs")}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Briefcase size={12} />
                                <span>Jobs</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveMenu("candidates")}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
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
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Assigned Overseas Projects</h2>
                  <p className="text-xs text-slate-500">
                    Your agency is authorized to supply manpower and recruit candidates for these projects.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                  {projectsList.length} Active Assignments
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectsList.map((prj) => {
                  const projectCands = applications.filter((a) => a.projectId === prj.projectId);
                  const selectedCount = projectCands.filter((a) => ["Selected", "Joined"].includes(a.recruitmentStage)).length;
                  return (
                    <div
                      key={prj.projectId}
                      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 transition space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-[11px] border border-indigo-100">
                            {prj.projectId}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {prj.status}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">{prj.projectName}</h3>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>Client: {prj.clientName}</span>
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-slate-400" />
                            <span>Destination: {prj.destinationCountry}</span>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">Hiring Target:</span>
                          <span className="text-slate-900 font-bold">{prj.targetHiring} Specialists</span>
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
                            style={{ width: `${Math.min(100, (projectCands.length / (prj.targetHiring || 50)) * 100)}%` }}
                          />
                        </div>

                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedProject(prj.projectId);
                              setActiveMenu("candidates");
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer text-center"
                          >
                            View Roster
                          </button>
                          <button
                            onClick={() => {
                              setSubmitForm((prev) => ({ ...prev, projectId: prj.projectId }));
                              setShowSubmitModal(true);
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer text-center"
                          >
                            + Submit Candidate
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: JOBS DIRECTORY */}
          {activeMenu === "jobs" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Open Job Requirements</h2>
                  <p className="text-xs text-slate-500">
                    Active manpower positions authorized for your vendor recruitment team.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                  {jobs.length} Active Trades
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.jobId}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between hover:border-indigo-300 transition"
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
                          <span className="font-bold text-indigo-600">{formatSalary(job.salaryRange)}</span>
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
                      className="w-full mt-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer text-center flex items-center justify-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Submit Candidate for this Trade</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 4: CANDIDATES MANAGEMENT (Search, Filters, Full Table, Stage/Offer/Visa Tracker) */}
          {activeMenu === "candidates" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    placeholder="Search candidate by name, email, phone or ID..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                {/* Stage Filter */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-500">Stage:</span>
                  <select
                    value={candidateStageFilter}
                    onChange={(e) => setCandidateStageFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                  >
                    <option value="ALL">All Stages ({applications.length})</option>
                    <option value="Applied">Applied</option>
                    <option value="Screening">Screening</option>
                    <option value="L1 Interview">L1 Interview</option>
                    <option value="L2 Interview">L2 Interview</option>
                    <option value="Selected">Selected</option>
                    <option value="Offer Released">Offer Released</option>
                    <option value="Visa Processing">Visa Processing</option>
                    <option value="Visa Issued">Visa Issued</option>
                    <option value="Joined">Joined</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Candidate Profile</th>
                        <th className="py-3 px-4">Job & Project</th>
                        <th className="py-3 px-4">Current Stage</th>
                        <th className="py-3 px-4">Offer Letter Status</th>
                        <th className="py-3 px-4">Visa & Flight Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredCandidates.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-400">
                            No candidates found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredCandidates.map((cand, idx) => (
                          <tr key={cand.applicationId || idx} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4 flex items-center space-x-2.5">
                              <img
                                src={AVATARS[idx % AVATARS.length]}
                                alt={cand.candidateName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <div className="font-bold text-slate-900">{cand.candidateName}</div>
                                <div className="text-[10px] text-slate-400">{cand.candidateEmail}</div>
                                <div className="text-[10px] text-slate-400">{cand.candidatePhone}</div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800">{cand.jobTitle}</div>
                              <div className="text-[10px] text-slate-500">{cand.projectName}</div>
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                  cand.recruitmentStage === "Joined"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : cand.recruitmentStage === "Selected"
                                    ? "bg-teal-50 text-teal-800 border-teal-200"
                                    : cand.recruitmentStage?.includes("Offer")
                                    ? "bg-purple-50 text-purple-800 border-purple-200"
                                    : cand.recruitmentStage?.includes("Visa")
                                    ? "bg-blue-50 text-blue-800 border-blue-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {cand.recruitmentStage || cand.status || "Applied"}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              {cand.offerDetails?.offerStatus && cand.offerDetails.offerStatus !== "Pending" ? (
                                <div className="space-y-0.5">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    {cand.offerDetails.offerStatus}
                                  </span>
                                  <div className="text-[10px] font-bold text-slate-700">
                                    {formatSalary(cand.offerDetails.salary || "Standard CTC")}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">—</span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {cand.visaDetails?.visaStatus && cand.visaDetails.visaStatus !== "Not Started" ? (
                                <div className="space-y-0.5">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    {cand.visaDetails.visaStatus}
                                  </span>
                                  {cand.visaDetails.visaNumber && (
                                    <div className="text-[10px] text-slate-500">
                                      #{cand.visaDetails.visaNumber}
                                    </div>
                                  )}
                                  {cand.visaDetails.flightDetails && (
                                    <div className="text-[9.5px] text-emerald-700 font-semibold">
                                      ✈️ {cand.visaDetails.flightDetails}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">—</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => openCandidateModal(cand)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                              >
                                Manage Candidate
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: RECRUITMENT PIPELINE (Full Kanban with Offer & Visa columns) */}
          {activeMenu === "pipeline" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">End-to-End Recruitment Pipeline</h2>
                  <p className="text-xs text-slate-500">
                    Track candidate progression across all stages from application to overseas deployment.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
                  <span>{applications.length} Active Candidates</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-3 overflow-x-auto pb-4">
                {pipelineColumns.map((col) => (
                  <div key={col.id} className="min-w-[170px] space-y-2.5 flex flex-col">
                    <div className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-between ${col.headerBg}`}>
                      <span className="truncate">{col.title}</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-white/80">
                        {col.items.length}
                      </span>
                    </div>

                    <div className="space-y-2 flex-1">
                      {col.items.map((cand, idx) => (
                        <div
                          key={cand.applicationId || idx}
                          onClick={() => openCandidateModal(cand)}
                          className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition cursor-pointer space-y-1.5"
                        >
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {cand.candidateName}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {cand.jobTitle || "Technician"}
                          </div>
                          {cand.offerDetails?.salary && (
                            <div className="text-[9.5px] font-bold text-purple-700">
                              💰 {formatSalary(cand.offerDetails.salary)}
                            </div>
                          )}
                          {cand.visaDetails?.visaStatus && cand.visaDetails.visaStatus !== "Not Started" && (
                            <div className="text-[9.5px] font-bold text-blue-700 truncate">
                              🛂 {cand.visaDetails.visaStatus}
                            </div>
                          )}
                          <div className="pt-1 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100">
                            <span>Update</span>
                            <span className="text-indigo-600 font-bold">Details →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 6: INTERVIEWS WORKSPACE */}
          {activeMenu === "interviews" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Technical Interviews & Assessments</h2>
                  <p className="text-xs text-slate-500">
                    Coordinate interview rounds with clients and record trade evaluation feedback.
                  </p>
                </div>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule Interview</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {interviews.map((item, idx) => (
                  <div
                    key={item.interviewId || idx}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3.5 flex flex-col justify-between hover:border-indigo-300 transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.round}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.status || "Scheduled"}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <img
                          src={AVATARS[idx % AVATARS.length]}
                          alt={item.candidateName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">{item.candidateName}</h3>
                          <p className="text-xs text-slate-500">{item.jobTitle}</p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Scheduled Date:</span>
                          <span className="font-bold text-slate-900">{item.scheduledDate}, {item.startTime}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Interviewer:</span>
                          <span className="font-medium text-slate-800">{item.interviewerName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      {item.interviewLink && (
                        <a
                          href={item.interviewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center transition flex items-center justify-center space-x-1"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Meet</span>
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setFeedbackInterviewTarget(item);
                          setShowFeedbackModal(true);
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold text-center transition cursor-pointer"
                      >
                        Record Feedback
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 7: OFFERS WORKSPACE */}
          {activeMenu === "offers" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Offer Letters & Packages</h2>
                  <p className="text-xs text-slate-500">
                    Candidates who have cleared interviews and received formal employment offers.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
                  {applications.filter((a) => a.offerDetails?.offerStatus && a.offerDetails.offerStatus !== "Pending").length} Offers Issued
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Candidate</th>
                        <th className="py-3 px-4">Designation & Project</th>
                        <th className="py-3 px-4">Offered Package</th>
                        <th className="py-3 px-4">Offer Status</th>
                        <th className="py-3 px-4">Joining Timeline</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {applications
                        .filter((a) => ["Offer Released", "Offer Accepted", "Visa Processing", "Visa Issued", "Joined"].includes(a.recruitmentStage) || a.offerDetails?.offerStatus !== "Pending")
                        .map((cand, idx) => (
                          <tr key={cand.applicationId || idx} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4 flex items-center space-x-2.5">
                              <img
                                src={AVATARS[idx % AVATARS.length]}
                                alt={cand.candidateName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <div className="font-bold text-slate-900">{cand.candidateName}</div>
                                <div className="text-[10px] text-slate-400">{cand.candidateEmail}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800">{cand.jobTitle}</div>
                              <div className="text-[10px] text-slate-500">{cand.projectName}</div>
                            </td>
                            <td className="py-3 px-4 font-bold text-indigo-700">
                              {formatSalary(cand.offerDetails?.salary || "6,200 AED/Month")}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                {cand.offerDetails?.offerStatus || "Released"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {cand.offerDetails?.joiningDate ? new Date(cand.offerDetails.joiningDate).toLocaleDateString() : "Within 30 Days"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => openCandidateModal(cand)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer"
                              >
                                View / Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
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

          {/* VIEW 9: ACTIVITY HISTORY */}
          {activeMenu === "activity" && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recruitment Activity History</h2>
                  <p className="text-xs text-slate-500">Live operational audit log of candidate submissions and stage updates.</p>
                </div>
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Refresh Feed
                </button>
              </div>

              <div className="space-y-3">
                {activities.map((act, idx) => (
                  <div key={act._id || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">{act.title || act.action}</h4>
                        <span className="text-[10px] text-slate-400">
                          {new Date(act.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{act.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                        <span>Actor: {act.userName}</span>
                        {act.candidateName && <span>Candidate: {act.candidateName}</span>}
                        <span>{new Date(act.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
        </div>
      </main>

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

            <form onSubmit={handleCandidateUpdate} className="space-y-4 text-xs font-medium">
              {/* Stage Transition Select */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <label className="block text-slate-900 font-bold">Update Recruitment Stage *</label>
                <select
                  value={candidateUpdateForm.stage}
                  onChange={(e) => setCandidateUpdateForm({ ...candidateUpdateForm, stage: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                >
                  <option value="Applied">1. Applied</option>
                  <option value="Screening">2. Screening</option>
                  <option value="L1 Interview">3. L1 Interview</option>
                  <option value="L2 Interview">4. L2 Interview</option>
                  <option value="Selected">5. Selected</option>
                  <option value="Offer Released">6. Offer Released</option>
                  <option value="Visa Processing">7. Visa Processing</option>
                  <option value="Visa Issued">8. Visa Issued</option>
                  <option value="Joined">9. Joined / Deployed</option>
                  <option value="Rejected">Rejected</option>
                  <option value="On Hold">On Hold</option>
                </select>
                <input
                  type="text"
                  value={candidateUpdateForm.remarks}
                  onChange={(e) => setCandidateUpdateForm({ ...candidateUpdateForm, remarks: e.target.value })}
                  placeholder="Add evaluation remarks or milestone notes..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                />
              </div>

              {/* Offer Letter Details Section */}
              <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 space-y-2.5">
                <div className="flex items-center space-x-1.5 text-purple-900 font-bold text-xs">
                  <FileCheck className="w-4 h-4 text-purple-600" />
                  <span>Offer Letter & Salary Details</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Offered Monthly Salary</label>
                    <input
                      type="text"
                      value={candidateUpdateForm.salary}
                      onChange={(e) => setCandidateUpdateForm({ ...candidateUpdateForm, salary: e.target.value })}
                      placeholder="e.g. 6,500 AED / Month"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Offer Acceptance Status</label>
                    <select
                      value={candidateUpdateForm.offerStatus}
                      onChange={(e) => setCandidateUpdateForm({ ...candidateUpdateForm, offerStatus: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Released">Released</option>
                      <option value="Accepted">Accepted by Candidate</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>
                </div>
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
                  <option value="">Choose a candidate</option>
                  {applications.map((a) => (
                    <option key={a.applicationId} value={a.applicationId}>
                      {a.candidateName} — {a.jobTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Interview Round</label>
                <select
                  value={scheduleForm.round}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, round: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs cursor-pointer"
                >
                  <option value="L1 Interview">L1 Technical Interview</option>
                  <option value="L2 Interview">L2 Project Lead Interview</option>
                  <option value="HR Interview">Client HR Interview</option>
                  <option value="Trade Test">Practical Trade Test (On-Site)</option>
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
                <label className="block text-slate-700 font-bold mb-1">Interviewer Name</label>
                <input
                  type="text"
                  value={scheduleForm.interviewerName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, interviewerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                />
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
    </div>
  );
}
