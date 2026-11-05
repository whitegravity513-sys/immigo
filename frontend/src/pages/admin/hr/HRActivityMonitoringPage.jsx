import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Activity,
  FolderKanban,
  Users,
  Building2,
  Calendar,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  MoreVertical,
  Star,
  Video,
  Eye,
  Trash2,
  ShieldCheck,
  Briefcase,
  FileCheck,
  History,
  User,
  Plane,
  FileText,
  LayoutDashboard,
  Upload,
  Paperclip,
  ExternalLink,
  Download,
  Edit3,
} from "lucide-react";
import AdminMasterLayout from "../../../components/admin/layout/AdminMasterLayout.jsx";
import adminVendorV1Service from "../../../services/adminVendorV1Service.js";
import vendorHRService from "../../../services/vendorHRService.js";
import apiClient from "../../../services/apiClient.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import ActiveMeetingAlertBanner from "../../../components/common/meeting/ActiveMeetingAlertBanner.jsx";

// Salary package formatter
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

// Sparkline helper
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

const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80",
];

export default function HRActivityMonitoringPage() {
  const { user, isSuperAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlTab = searchParams.get("tab");
  const urlView = searchParams.get("view");
  const initialView =
    urlView ||
    (urlTab === "assignments"
      ? "assignments"
      : urlTab === "activities"
      ? "activity"
      : "overview");

  const [activeView, setActiveView] = useState(initialView);
  const [loading, setLoading] = useState(true);

  // Sync state with URL params
  useEffect(() => {
    const v =
      searchParams.get("view") ||
      (searchParams.get("tab") === "assignments"
        ? "assignments"
        : searchParams.get("tab") === "activities"
        ? "activity"
        : "overview");
    setActiveView(v);
  }, [searchParams]);

  const switchView = (view) => {
    setActiveView(view);
    setSearchParams({ tab: "vendorHRDashboard", view });
  };

  // Activities state (Audit Feed)
  const [activities, setActivities] = useState([]);
  const [totalActivities, setTotalActivities] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [vendorFilter, setVendorFilter] = useState("");
  const [candidateFilter, setCandidateFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Assignments & Entities state
  const [assignments, setAssignments] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);
  const [vendorHRUsersList, setVendorHRUsersList] = useState([]);

  // Live Vendor HR Dashboard state
  const [selectedDashboardVendor, setSelectedDashboardVendor] = useState("ALL");
  const [selectedDashboardProject, setSelectedDashboardProject] = useState("ALL");
  const [vendorDashboardData, setVendorDashboardData] = useState(null);
  const [loadingVendorDashboard, setLoadingVendorDashboard] = useState(false);

  // Modals state
  const [showBatchAssignModal, setShowBatchAssignModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Batch Assign Form
  const [batchAssignForm, setBatchAssignForm] = useState({
    hrUserId: "",
    selectedProjectIds: [],
    selectedVendorIds: [],
    notes: "",
  });
  const [batchProjectSearch, setBatchProjectSearch] = useState("");
  const [batchVendorSearch, setBatchVendorSearch] = useState("");

  // Candidate Process / Milestone / Document Form
  const [candidateProcessForm, setCandidateProcessForm] = useState({
    stage: "Applied",
    remarks: "",
    milestones: [
      { id: "m1", title: "Document Verification Cleared", completed: false },
      { id: "m2", title: "Trade Skills & Medical Fitness Cleared", completed: false },
      { id: "m3", title: "Ministry Work Permit & Visa Approved", completed: false },
      { id: "m4", title: "Air Ticket & Deployment Completed", completed: false },
    ],
    newDocument: {
      docType: "Passport Copy (Front & Back)",
      name: "",
      fileName: "",
      fileUrl: "",
      fileSize: 0,
    },
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load General Management Data (Activities, Assignments, Projects, Vendors, Vendor HRs)
  const loadData = async () => {
    try {
      setLoading(true);
      const [actRes, assignRes, projRes, vendRes, hrRes] = await Promise.all([
        adminVendorV1Service
          .getHRActivities({
            vendorId: vendorFilter || undefined,
            candidateId: candidateFilter || undefined,
            action: actionFilter !== "ALL" ? actionFilter : undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            page,
            limit,
          })
          .catch(() => ({ activities: [], total: 0 })),

        adminVendorV1Service.getAssignments().catch(() => []),

        apiClient.get("/admin/projects").catch(() => ({ data: { projects: [] } })),

        adminVendorV1Service.getVendors().catch(() => ({ vendors: [] })),

        apiClient.get("/admins?role=HR").catch(() => ({ data: { admins: [] } })),
      ]);

      setActivities(actRes.activities || []);
      setTotalActivities(actRes.total || 0);
      setAssignments(Array.isArray(assignRes) ? assignRes : []);

      const pList = projRes.data?.projects || projRes.data?.data || [];
      setProjectsList(Array.isArray(pList) ? pList : []);

      const vList = vendRes.vendors || vendRes.data || [];
      setVendorsList(Array.isArray(vList) ? vList : []);

      const hrList = (hrRes.data?.admins || []).filter(
        (h) => h.hrType === "VENDOR_HR" || h.role === "HR" || h.role === "VENDOR_HR"
      );
      const finalHRList = hrList.length > 0 ? hrList : (hrRes.data?.admins || []);
      setVendorHRUsersList(finalHRList);
      if (finalHRList.length > 0) {
        setBatchAssignForm((prev) => ({
          ...prev,
          hrUserId: prev.hrUserId || finalHRList[0]._id || finalHRList[0].id || "",
        }));
      }
    } catch (err) {
      console.error("Failed to load HR Activity workspace data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, actionFilter, vendorFilter]);

  // Load Vendor HR Live Dashboard
  const loadVendorHRDashboardData = async () => {
    try {
      setLoadingVendorDashboard(true);
      const params = {};
      if (selectedDashboardVendor && selectedDashboardVendor !== "ALL") {
        params.vendorId = selectedDashboardVendor;
      }
      if (selectedDashboardProject && selectedDashboardProject !== "ALL") {
        params.projectId = selectedDashboardProject;
      }
      const res = await vendorHRService.getDashboard(params).catch(() => null);
      setVendorDashboardData(res);
    } catch (err) {
      console.error("Failed to load Vendor HR live dashboard:", err);
    } finally {
      setLoadingVendorDashboard(false);
    }
  };

  useEffect(() => {
    loadVendorHRDashboardData();
  }, [selectedDashboardVendor, selectedDashboardProject]);

  // Filter vendors strictly to those assigned to the selected project if a project is picked
  const filteredVendorsByProject = useMemo(() => {
    if (selectedDashboardProject === "ALL") return vendorsList;
    const assignedVendorIds = new Set(
      assignments
        .filter(
          (a) =>
            (a.projectId === selectedDashboardProject || a.projectRef === selectedDashboardProject) &&
            a.status === "Active"
        )
        .map((a) => a.vendorId)
        .filter(Boolean)
    );
    if (assignedVendorIds.size === 0) return vendorsList;
    return vendorsList.filter(
      (v) => assignedVendorIds.has(v.vendorId) || assignedVendorIds.has(v.id)
    );
  }, [selectedDashboardProject, assignments, vendorsList]);

  // Handle Single / Multi / All Batch Assignment of Projects and Vendors to HR
  const handleBatchAssignSubmit = async (e) => {
    e.preventDefault();
    if (!batchAssignForm.hrUserId) {
      showToast("Please select an HR Personnel.", "error");
      return;
    }
    if (batchAssignForm.selectedProjectIds.length === 0) {
      showToast("Please select at least one Project.", "error");
      return;
    }
    if (batchAssignForm.selectedVendorIds.length === 0) {
      showToast("Please select at least one Vendor Partner Agency.", "error");
      return;
    }
    try {
      setActionLoading(true);
      await adminVendorV1Service.batchAssignHRToProjectsAndVendors({
        hrUserId: batchAssignForm.hrUserId,
        projectIds: batchAssignForm.selectedProjectIds,
        vendorIds: batchAssignForm.selectedVendorIds,
        notes: batchAssignForm.notes || "Assigned via Project & Vendor Allocation",
      });
      showToast(
        `Successfully allocated ${batchAssignForm.selectedProjectIds.length} project(s) & ${batchAssignForm.selectedVendorIds.length} vendor(s) to HR!`
      );
      setShowBatchAssignModal(false);
      setBatchAssignForm({
        hrUserId: vendorHRUsersList[0]?._id || vendorHRUsersList[0]?.id || "",
        selectedProjectIds: [],
        selectedVendorIds: [],
        notes: "",
      });
      await Promise.all([loadData(), loadVendorHRDashboardData()]);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to save assignment", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignment) => {
    const targetName = assignment.userName || assignment.vendorName || "this entity";
    const projName = assignment.projectName || "project";
    if (
      !window.confirm(
        `Are you sure you want to unassign ${targetName} from project "${projName}"?`
      )
    ) {
      return;
    }
    try {
      setActionLoading(true);
      await adminVendorV1Service.removeAssignment({
        assignmentId: assignment._id,
        reason: "Unassigned via Vendor HR Command Center",
      });
      showToast("Assignment removed successfully");
      await Promise.all([loadData(), loadVendorHRDashboardData()]);
    } catch (err) {
      try {
        await adminVendorV1Service.removeVendorFromProject({
          projectId: assignment.projectId,
          vendorId: assignment.vendorId,
          reason: "Unassigned via Vendor HR Command Center",
        });
        showToast("Assignment removed successfully");
        await Promise.all([loadData(), loadVendorHRDashboardData()]);
      } catch (e2) {
        showToast(err.response?.data?.message || err.message || "Failed to remove assignment", "error");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Open Candidate Process / Milestone modal
  const openProcessModal = (cand) => {
    setSelectedCandidate(cand);
    const existingMilestones =
      Array.isArray(cand.processMilestones) && cand.processMilestones.length > 0
        ? cand.processMilestones
        : [
            {
              id: "m1",
              title: "Document Verification Cleared",
              completed: [
                "Screening",
                "L1 Interview",
                "L2 Interview",
                "Selected",
                "Offer Released",
                "Offer Accepted",
                "Visa Processing",
                "Visa Issued",
                "Joined",
                "Deployed",
              ].includes(cand.recruitmentStage || cand.status),
            },
            {
              id: "m2",
              title: "Trade Skills & Medical Fitness Cleared",
              completed: [
                "Selected",
                "Offer Released",
                "Offer Accepted",
                "Visa Processing",
                "Visa Issued",
                "Joined",
                "Deployed",
              ].includes(cand.recruitmentStage || cand.status),
            },
            {
              id: "m3",
              title: "Ministry Work Permit & Visa Approved",
              completed: [
                "Visa Processing",
                "Visa Issued",
                "Joined",
                "Deployed",
              ].includes(cand.recruitmentStage || cand.status),
            },
            {
              id: "m4",
              title: "Air Ticket & Deployment Completed",
              completed: ["Joined", "Deployed"].includes(cand.recruitmentStage || cand.status),
            },
          ];

    setCandidateProcessForm({
      stage: cand.recruitmentStage || cand.status || "Applied",
      remarks: cand.adminRemarks || cand.remarks || "",
      milestones: existingMilestones,
      newDocument: {
        docType: "Passport Copy (Front & Back)",
        name: "",
        fileName: "",
        fileUrl: "",
        fileSize: 0,
      },
    });
    setShowProcessModal(true);
  };

  const handleCandidateFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast("Document file size cannot exceed 10MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCandidateProcessForm((prev) => ({
          ...prev,
          newDocument: {
            ...prev.newDocument,
            name: prev.newDocument?.name || file.name,
            fileName: file.name,
            fileUrl: reader.result,
            fileSize: file.size,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Candidate Stage & Milestone update
  const handleCandidateProcessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    try {
      setActionLoading(true);
      await vendorHRService.updateCandidateStage(
        selectedCandidate.applicationId || selectedCandidate.id,
        {
          stage: candidateProcessForm.stage,
          remarks: candidateProcessForm.remarks,
          processMilestones: candidateProcessForm.milestones,
          newDocument:
            candidateProcessForm.newDocument?.fileUrl || candidateProcessForm.newDocument?.name
              ? candidateProcessForm.newDocument
              : undefined,
        }
      );
      showToast(
        `Updated ${selectedCandidate.candidateName} progress & synced documents to Vendor Portal!`
      );
      setShowProcessModal(false);
      await Promise.all([loadData(), loadVendorHRDashboardData()]);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to update candidate progress", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Pipeline state
  const [pipelineStageFilter, setPipelineStageFilter] = useState("ALL");
  const [pipelineSearch, setPipelineSearch] = useState("");

  // All candidate applications for current project / vendor scope
  const allApplications = useMemo(() => {
    return vendorDashboardData?.applications || [];
  }, [vendorDashboardData]);

  // Stage condition counts: Pre-selection and Post-selection
  const pipelineCounts = useMemo(() => {
    const list = allApplications;
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
  }, [allApplications]);

  // Candidates matching the selected pipeline stage dropdown and search
  const filteredPipelineCandidates = useMemo(() => {
    let list = allApplications;

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
  }, [allApplications, pipelineStageFilter, pipelineSearch]);

  // Candidates who have an interview scheduled (for VIEW 7: INTERVIEWS)
  const candidatesWithInterviews = useMemo(() => {
    return allApplications.filter(
      (c) =>
        c.recruitmentStage?.includes("Interview") ||
        c.status?.includes("Interview") ||
        Boolean(c.interview?.scheduledDate)
    );
  }, [allApplications]);

  // Candidates who have received their visa (for VIEW 8: VISA ISSUED)
  const visaIssuedCandidates = useMemo(() => {
    return allApplications.filter(
      (c) =>
        ["Visa Issued", "Visa Processing", "Joined", "Deployed"].includes(c.recruitmentStage) ||
        Boolean(c.visaDetails?.visaNumber) ||
        c.visaDetails?.visaStatus === "Issued" ||
        c.visaDetails?.visaStatus === "Visa Issued" ||
        c.processMilestones?.find((m) => m.id === "m3")?.completed
    );
  }, [allApplications]);

  // Overview recruitment pipeline 5 stage preview
  const overviewPipelineStages = useMemo(() => {
    const list = allApplications;
    const shortlistItems = list.filter((c) =>
      ["Applied", "Screening", "Shortlisted"].includes(c.recruitmentStage || c.status)
    );
    const interviewItems = list.filter(
      (c) =>
        c.recruitmentStage?.includes("Interview") ||
        c.status?.includes("Interview") ||
        Boolean(c.interview?.scheduledDate)
    );
    const selectedItems = list.filter((c) =>
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
    const visaItems = list.filter(
      (c) =>
        ["Visa Processing", "Visa Issued", "Joined", "Deployed"].includes(c.recruitmentStage) ||
        Boolean(c.visaDetails?.visaNumber) ||
        c.processMilestones?.find((m) => m.id === "m3")?.completed
    );
    const deployedItems = list.filter(
      (c) =>
        ["Joined", "Deployed"].includes(c.recruitmentStage) ||
        c.processMilestones?.find((m) => m.id === "m4")?.completed
    );

    return [
      {
        id: "shortlist",
        title: "Shortlisted",
        count: shortlistItems.length,
        headerBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        items: shortlistItems.slice(0, 4),
      },
      {
        id: "interview",
        title: "In Interview",
        count: interviewItems.length,
        headerBg: "bg-sky-50 text-sky-700 border-sky-200",
        items: interviewItems.slice(0, 4),
      },
      {
        id: "selected",
        title: "Interview Cleared",
        count: selectedItems.length,
        headerBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        items: selectedItems.slice(0, 4),
      },
      {
        id: "visa",
        title: "Visa Granted",
        count: visaItems.length,
        headerBg: "bg-blue-50 text-blue-700 border-blue-200",
        items: visaItems.slice(0, 4),
      },
      {
        id: "deployed",
        title: "Deployed",
        count: deployedItems.length,
        headerBg: "bg-teal-50 text-teal-700 border-teal-200",
        items: deployedItems.slice(0, 4),
      },
    ];
  }, [allApplications]);

  return (
    <AdminMasterLayout
      title="Vendor HR Dashboard"
      subtitle="Real-time live recruitment command center, project allocations & Vendor HR oversight"
    >
      <div className="space-y-4 font-sans text-slate-800 antialiased pb-6">
        {/* Toast */}
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

        {/* Top Control Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-xl text-white shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white border border-white/20">
              <ShieldCheck className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Vendor HR Command Center</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Live recruitment oversight, project assignments, candidate pipelines and interview tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowBatchAssignModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck size={14} />
              <span>+ Assign to HR</span>
            </button>
          </div>
        </div>

        {/* Workspace Filters Strip */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3 flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-700">Filter Workspace:</span>
            <select
              value={selectedDashboardProject}
              onChange={(e) => {
                setSelectedDashboardProject(e.target.value);
                setSelectedDashboardVendor("ALL");
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="ALL">All Active Projects ({projectsList.length})</option>
              {projectsList.map((p) => (
                <option key={p.projectId || p._id} value={p.projectId || p._id}>
                  {p.title || p.projectName} ({p.projectId || p._id})
                </option>
              ))}
            </select>

            <select
              value={selectedDashboardVendor}
              onChange={(e) => setSelectedDashboardVendor(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="ALL">
                {selectedDashboardProject !== "ALL"
                  ? `All Assigned Vendors for this Project (${filteredVendorsByProject.length})`
                  : "All Vendor Partners (Consolidated)"}
              </option>
              {filteredVendorsByProject.map((v) => (
                <option key={v.vendorId || v.id} value={v.vendorId || v.id}>
                  {v.companyName} ({v.vendorId || v.id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                loadData();
                loadVendorHRDashboardData();
              }}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer flex items-center space-x-1 px-2.5 text-xs font-semibold"
              title="Refresh Live Data"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loadingVendorDashboard || loading ? "animate-spin text-indigo-600" : ""
                }`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: OVERVIEW */}
        {activeView === "overview" && (
          <div className="space-y-4">
            {/* Active Scheduled Meeting Banner (visible until completed) */}
            <ActiveMeetingAlertBanner
              contextVendorId={selectedDashboardVendor !== "ALL" ? selectedDashboardVendor : null}
            />

            {/* 4 KPI Metric Cards Row - Balanced clean overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">Total Candidates</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
                    {allApplications.length ||
                      vendorDashboardData?.kpis?.totalCandidates ||
                      0}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 flex items-center space-x-0.5">
                    <span>↑</span>
                    <span>Live Database</span>
                  </div>
                </div>
                <Sparkline color="#6366F1" id="adm-c1" />
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <FolderKanban className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">Active Projects</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
                    {vendorDashboardData?.projects?.length || projectsList.length || 0}
                  </div>
                  <div className="text-[11px] font-bold text-blue-600">
                    Allocated
                  </div>
                </div>
                <Sparkline color="#3B82F6" id="adm-c2" />
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">Required Jobs</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
                    {vendorDashboardData?.jobs?.length || 0}
                  </div>
                  <div className="text-[11px] font-bold text-violet-600">
                    Open Positions
                  </div>
                </div>
                <Sparkline color="#8B5CF6" id="adm-c3" />
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">Interviews Sched.</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
                    {candidatesWithInterviews.length ||
                      vendorDashboardData?.upcomingInterviews?.length ||
                      0}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600">
                    Rounds Active
                  </div>
                </div>
                <Sparkline color="#10B981" id="adm-c4" />
              </div>
            </div>

            {/* Balanced 2x2 Modular Grid: Projects, Jobs, Candidates & Interviews */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4.5">
              {/* Card 1: Active Overseas Projects (FolderKanban) */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">Active Overseas Projects</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Assigned manpower projects & quota</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchView("projects")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All ({vendorDashboardData?.projects?.length || projectsList.length})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 pt-1">
                    {(vendorDashboardData?.projects || []).length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
                        No active projects currently assigned.
                      </div>
                    ) : (
                      (vendorDashboardData?.projects || []).slice(0, 3).map((p) => (
                        <div
                          key={p.projectId || p.id}
                          className="p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 truncate">
                                {p.projectName}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {p.projectId}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
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
                              onClick={() => {
                                setSelectedDashboardProject(p.projectId || p.id);
                                switchView("jobs");
                              }}
                              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="View Jobs"
                            >
                              <Briefcase size={11} />
                              <span>Jobs</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDashboardProject(p.projectId || p.id);
                                switchView("candidates");
                              }}
                              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="View Candidates"
                            >
                              <Users size={11} />
                              <span>Candidates</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Overseas Client: {vendorDashboardData?.projects?.[0]?.clientName || "Emirates Engineering & Contracting LLC"}</span>
                  <button
                    type="button"
                    onClick={() => switchView("projects")}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Manage Allocations →
                  </button>
                </div>
              </div>

              {/* Card 2: Required Jobs & Trades (Briefcase) */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">Required Jobs & Trades</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Open trade positions by project</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchView("jobs")}
                      className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All ({vendorDashboardData?.jobs?.length || 0})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 pt-1">
                    {(vendorDashboardData?.jobs || []).length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
                        No trade positions open.
                      </div>
                    ) : (
                      (vendorDashboardData?.jobs || []).slice(0, 3).map((j) => (
                        <div
                          key={j.jobId || j.id}
                          className="p-2 rounded-lg border border-slate-100 hover:border-violet-200 hover:bg-violet-50/20 transition flex items-center justify-between gap-2"
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
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
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

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Total Active Vacancies: {vendorDashboardData?.kpis?.activeOpenings || 85}</span>
                  <button
                    type="button"
                    onClick={() => switchView("jobs")}
                    className="text-violet-600 hover:underline font-semibold"
                  >
                    View All Requirements →
                  </button>
                </div>
              </div>

              {/* Card 3: Candidate Roster Snapshot (Users) */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">Candidates Snapshot</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Recent candidate roster from assigned vendors</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchView("candidates")}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All ({allApplications.length})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 pt-1">
                    {allApplications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
                        No candidates submitted yet.
                      </div>
                    ) : (
                      allApplications.slice(0, 3).map((cand, idx) => (
                        <div
                          key={cand.applicationId || idx}
                          className="p-2.5 rounded-lg border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <img
                              src={AVATARS[idx % AVATARS.length]}
                              alt={cand.candidateName}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-900 truncate">
                                {cand.candidateName}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
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
                              onClick={() => openProcessModal(cand)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-[10px] font-bold text-slate-700 transition cursor-pointer"
                            >
                              Process
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Vendor Agency: {vendorDashboardData?.vendor?.companyName || "Global Staffing Solutions Pvt Ltd"}</span>
                  <button
                    type="button"
                    onClick={() => switchView("candidates")}
                    className="text-emerald-600 hover:underline font-semibold"
                  >
                    View Full Roster →
                  </button>
                </div>
              </div>

              {/* Card 4: Upcoming Interviews (Calendar) */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">Upcoming Interviews</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Scheduled candidate interviews</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchView("interviews")}
                      className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All ({vendorDashboardData?.upcomingInterviews?.length || 0})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 pt-1">
                    {(vendorDashboardData?.upcomingInterviews || []).length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
                        No upcoming interviews today.
                      </div>
                    ) : (
                      (vendorDashboardData?.upcomingInterviews || []).slice(0, 3).map((intw, iIdx) => (
                        <div
                          key={intw.interviewId || iIdx}
                          className="p-2 rounded-lg border border-slate-100 hover:border-sky-200 hover:bg-sky-50/20 transition flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-slate-900 truncate">
                              {intw.candidateName}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {intw.jobTitle} • {intw.round}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                              {intw.scheduledDate} {intw.startTime}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (intw.meetingLink) window.open(intw.meetingLink, "_blank");
                                else
                                  alert(
                                    `Interview Details:\nCandidate: ${intw.candidateName}\nRound: ${intw.round}\nTime: ${intw.scheduledDate} ${intw.startTime}`
                                  );
                              }}
                              className="px-2 py-0.5 text-[10px] font-bold rounded bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-600 shadow-2xs cursor-pointer"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Live synchronized interview evaluations</span>
                  <button
                    type="button"
                    onClick={() => switchView("interviews")}
                    className="text-sky-600 hover:underline font-semibold"
                  >
                    Go to Schedule →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: ASSIGN TO HR (PROJECT & VENDOR HR ALLOCATIONS) */}
        {activeView === "assignments" && (
          <div className="space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Assign Projects & Vendors to HR</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign existing projects and vendors to designated HR personnel. Allocate single, multiple, or all projects & vendors.
                </p>
              </div>

              <div>
                <button
                  onClick={() => setShowBatchAssignModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Assign Projects & Vendors to HR</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">HR Personnel</th>
                      <th className="py-2.5 px-4">Assigned Project</th>
                      <th className="py-2.5 px-4">Assigned Vendor Partner</th>
                      <th className="py-2.5 px-4">Assigned By</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Notes</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {assignments.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-400">
                          No active project assignments. Click "+ Assign Projects & Vendors to HR" above to allocate projects and vendors.
                        </td>
                      </tr>
                    ) : (
                      assignments.map((as) => (
                        <tr key={as._id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <UserCheck size={14} className="text-blue-600 shrink-0" />
                              <span>{as.userName || "HR Officer"}</span>
                            </div>
                            <div className="text-slate-400 text-[10px] pl-5">{as.userEmail || "—"}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{as.projectName || "All Projects"}</div>
                            <div className="font-mono text-indigo-600 text-[10px]">{as.projectId}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{as.vendorName || "All Assigned Vendors"}</div>
                            <div className="font-mono text-slate-400 text-[10px]">{as.vendorId || "—"}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-700">{as.assignedByName || "Admin"}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(as.assignedAt || as.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {as.status || "Active"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px] max-w-[180px] truncate">
                            {as.notes || "—"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleRemoveAssignment(as)}
                              className="px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                            >
                              Unassign
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

        {/* VIEW 3: MY PROJECTS */}
        {activeView === "projects" && (
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Assigned Overseas Projects</h3>
                <p className="text-xs text-slate-500">
                  Projects allocated across Admin, Super Admin and Vendor partner agencies with required positions & quotas
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                {vendorDashboardData?.projects?.length || 0} Projects Active
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Project Name & Code</th>
                    <th className="py-2.5 px-3">Client & Location</th>
                    <th className="py-2.5 px-3">Assigned Vendors</th>
                    <th className="py-2.5 px-3">Target Manpower</th>
                    <th className="py-2.5 px-3">Required Jobs</th>
                    <th className="py-2.5 px-3">Candidates</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Quick Navigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(vendorDashboardData?.projects || []).length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-400">
                        No active overseas projects allocated to this vendor yet.
                      </td>
                    </tr>
                  ) : (
                    (vendorDashboardData?.projects || []).map((p) => {
                      const vNames =
                        Array.isArray(p.assignedVendors) && p.assignedVendors.length > 0
                          ? p.assignedVendors
                          : vendorsList.length > 0
                          ? [vendorsList[0].companyName]
                          : ["Global Staffing Solutions Pvt Ltd"];
                      return (
                        <tr key={p.projectId || p.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{p.projectName}</div>
                            <div className="font-mono text-slate-400 text-[10px]">{p.projectId}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{p.clientName}</div>
                            <div className="text-[10px] text-slate-500 font-medium">📍 {p.destinationCountry}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {vNames.map((vName, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                                >
                                  🏢 {vName}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-indigo-700 font-bold">
                            {p.targetHiring} positions
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDashboardProject(p.projectId || p.id);
                                switchView("jobs");
                              }}
                              className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                              title="View Required Jobs for this project"
                            >
                              <Briefcase size={11} />
                              <span>{p.jobsCount || p.positions?.length || 1} Jobs</span>
                            </button>
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDashboardProject(p.projectId || p.id);
                                switchView("candidates");
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                              title="View Candidates submitted for this project"
                            >
                              <Users size={11} />
                              <span>{p.candidatesCount || 0} Candidates</span>
                            </button>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {p.status || "Active"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDashboardProject(p.projectId || p.id);
                                  switchView("jobs");
                                }}
                                className="px-2 py-1 rounded text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                              >
                                Jobs
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDashboardProject(p.projectId || p.id);
                                  switchView("candidates");
                                }}
                                className="px-2 py-1 rounded text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer"
                              >
                                Candidates
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
        )}

        {/* VIEW 4: JOBS */}
        {activeView === "jobs" && (
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Required Job Positions & Trade Openings</h3>
                <p className="text-xs text-slate-500">
                  Required trades and manpower positions for the selected project
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                {vendorDashboardData?.jobs?.length || 0} Positions Available
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Job Title & Code</th>
                    <th className="py-2.5 px-3">Associated Project</th>
                    <th className="py-2.5 px-3">Required Trade</th>
                    <th className="py-2.5 px-3">Openings / Filled</th>
                    <th className="py-2.5 px-3">Salary Package</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Candidates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(vendorDashboardData?.jobs || []).length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No active jobs currently required for this project.
                      </td>
                    </tr>
                  ) : (
                    (vendorDashboardData?.jobs || []).map((j) => (
                      <tr key={j.jobId || j.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{j.title}</div>
                          <div className="font-mono text-slate-400 text-[10px]">{j.jobId}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800">{j.projectName || "Project"}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{j.projectId}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">
                          {j.tradeCategory || j.department || "Skilled Trade"}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          <span className="text-emerald-700 font-bold">{j.filledPositions || 0}</span> / {j.openings || 10} filled
                        </td>
                        <td className="py-2.5 px-3 text-emerald-700 font-bold">{formatSalary(j.salaryRange)}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {j.status || "Open"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDashboardProject(j.projectId);
                              switchView("candidates");
                            }}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer inline-flex items-center gap-1"
                          >
                            <Users size={12} />
                            <span>View Candidates</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 5: CANDIDATES DIRECTORY */}
        {activeView === "candidates" && (
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Assigned Candidates Roster</h3>
                <p className="text-xs text-slate-500">
                  All candidates registered under assigned vendor partner agencies with complete stages, milestones & documents
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                {vendorDashboardData?.applications?.length || 0} Total Submissions
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Candidate & Passport</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">Target Job & Project</th>
                    <th className="py-2.5 px-3">Vendor Agency</th>
                    <th className="py-2.5 px-3">Recruitment Stage</th>
                    <th className="py-2.5 px-3">Process Milestones</th>
                    <th className="py-2.5 px-3">Documents</th>
                    <th className="py-2.5 px-3">Date Applied</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(vendorDashboardData?.applications || []).length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-400">
                        No candidate profiles registered under this vendor yet.
                      </td>
                    </tr>
                  ) : (
                    (vendorDashboardData?.applications || []).map((c, idx) => {
                      const completedMilestones = (c.processMilestones || []).filter((m) => m.completed).length;
                      const totalMilestones = c.processMilestones?.length || 4;
                      const docCount = (c.documents || []).length;
                      return (
                        <tr key={c.applicationId || idx} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center space-x-2">
                              <img src={AVATARS[idx % AVATARS.length]} className="w-7 h-7 rounded-full shrink-0" alt="" />
                              <div>
                                <span className="font-bold text-slate-900 block text-xs">{c.candidateName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {c.passportNumber ? `🛂 ${c.passportNumber}` : `ID: ${c.candidateId || c.applicationId}`}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            <div className="font-medium">{c.candidateEmail}</div>
                            <div className="text-[10px] text-slate-400">{c.candidatePhone || "—"}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{c.jobTitle}</div>
                            <div className="text-[10px] text-slate-400">{c.projectName}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              🏢 {c.vendorName || "Global Staffing Solutions"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {c.recruitmentStage || c.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                completedMilestones === totalMilestones
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              ✓ {completedMilestones}/{totalMilestones} Cleared
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                              <FileText size={10} />
                              <span>{docCount} {docCount === 1 ? "Doc" : "Docs"}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => openProcessModal(c)}
                              className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                            >
                              <Edit3 size={12} />
                              <span>Update & Upload</span>
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
        )}

        {/* VIEW 6: RECRUITMENT PIPELINE - STAGE DROPDOWN SELECTOR & CARDS */}
        {activeView === "pipeline" && (
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recruitment Pipeline & Stage Selection</h3>
                <p className="text-xs text-slate-500">
                  Select a recruitment stage or post-selection project milestone to view candidate progress
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 shrink-0 self-start sm:self-auto">
                {filteredPipelineCandidates.length} Candidates Shown
              </span>
            </div>

            {/* Stage Dropdown & Search Toolbar */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Stage Dropdown */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">
                  Select Stage / Milestone Filter:
                </label>
                <select
                  value={pipelineStageFilter}
                  onChange={(e) => setPipelineStageFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-2xs"
                >
                  <option value="ALL">All Candidates in Pipeline ({pipelineCounts.all})</option>
                  <optgroup label="Selection se Pehle (Pre-Interview Stages)">
                    <option value="SHORTLIST">1. Shortlisted / Applied ({pipelineCounts.shortlist})</option>
                    <option value="INTERVIEW_SCHEDULED">2. In Interview / Scheduled ({pipelineCounts.interviewScheduled})</option>
                    <option value="INTERVIEW_HOLD">3. On Hold ({pipelineCounts.interviewHold})</option>
                    <option value="INTERVIEW_REJECTED">4. Rejected ({pipelineCounts.interviewRejected})</option>
                    <option value="INTERVIEW_SUCCESS">5. Interview Cleared (Selected) ({pipelineCounts.interviewSuccess})</option>
                  </optgroup>
                  <optgroup label="Interview ke Baad (Project Milestones)">
                    <option value="MILESTONE_1">Milestone 1: Docs Verified ({pipelineCounts.milestone1})</option>
                    <option value="MILESTONE_2">Milestone 2: Trade/Medical Cleared ({pipelineCounts.milestone2})</option>
                    <option value="MILESTONE_3">Milestone 3: Visa Approved ({pipelineCounts.milestone3})</option>
                    <option value="MILESTONE_4">Milestone 4: Flight Deployed ({pipelineCounts.milestone4})</option>
                  </optgroup>
                </select>
              </div>

              {/* Candidate Search bar */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">
                  Search Candidate:
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, job, passport, ID or agency..."
                    value={pipelineSearch}
                    onChange={(e) => setPipelineSearch(e.target.value)}
                    className="w-full pl-9 pr-14 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {pipelineSearch && (
                    <button
                      type="button"
                      onClick={() => setPipelineSearch("")}
                      className="absolute right-2 top-1.5 px-2 py-0.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-md"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Filtered Candidates List */}
            {filteredPipelineCandidates.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Users size={18} />
                </div>
                <h4 className="text-xs font-bold text-slate-700">No candidates found in this stage</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  There are currently no candidates matching the selected stage filter. Try selecting "All Candidates" or another stage from the dropdown.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPipelineCandidates.map((cand, idx) => (
                  <div
                    key={cand.applicationId || idx}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2 min-w-0">
                          <img
                            src={AVATARS[idx % AVATARS.length]}
                            className="w-8 h-8 rounded-full shrink-0"
                            alt=""
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs truncate">{cand.candidateName}</h4>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {cand.passportNumber ? `🛂 ${cand.passportNumber}` : `ID: ${cand.candidateId || cand.applicationId}`}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                          {cand.recruitmentStage || cand.status || "Applied"}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg space-y-0.5">
                        <div className="font-semibold text-slate-800 truncate">{cand.jobTitle || "Overseas Job"}</div>
                        <div className="text-[10px] text-slate-500 truncate">Project: {cand.projectName}</div>
                        <div className="text-[10px] text-indigo-700 font-semibold truncate">
                          Agency: {cand.vendorName || "Global Staffing Solutions"}
                        </div>
                      </div>

                      {/* Milestones checkmarks */}
                      <div className="flex items-center space-x-1 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 mr-1">Milestones:</span>
                        {["m1", "m2", "m3", "m4"].map((mId, mIdx) => {
                          const isDone =
                            cand.processMilestones?.find((m) => m.id === mId)?.completed ||
                            (mIdx === 0 && ["Screening", "Selected", "Visa Processing", "Joined"].includes(cand.recruitmentStage)) ||
                            (mIdx === 1 && ["Selected", "Visa Processing", "Joined"].includes(cand.recruitmentStage)) ||
                            (mIdx === 2 && ["Visa Processing", "Visa Issued", "Joined"].includes(cand.recruitmentStage)) ||
                            (mIdx === 3 && ["Joined", "Deployed"].includes(cand.recruitmentStage));
                          return (
                            <span
                              key={mId}
                              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold ${
                                isDone ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                              }`}
                              title={`Milestone ${mIdx + 1} ${isDone ? "Cleared" : "Pending"}`}
                            >
                              {mIdx + 1}
                            </span>
                          );
                        })}
                        <span className="text-[10px] text-slate-400 ml-auto font-mono">
                          {cand.documents?.length || 0} Docs
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openProcessModal(cand)}
                      className="w-full py-1.5 px-3 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Edit3 size={12} />
                      <span>Update Stage & Milestones</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 7: INTERVIEWS - ONLY CANDIDATES WITH SCHEDULED INTERVIEWS */}
        {activeView === "interviews" && (
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Technical Interviews & Assessments</h3>
                <p className="text-xs text-slate-500">
                  Candidates with active scheduled interviews, assessment rounds and technical screenings
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                {candidatesWithInterviews.length} Scheduled
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Candidate & Passport</th>
                    <th className="py-2.5 px-3">Job & Project</th>
                    <th className="py-2.5 px-3">Vendor Agency</th>
                    <th className="py-2.5 px-3">Interview Round</th>
                    <th className="py-2.5 px-3">Scheduled Date & Time</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidatesWithInterviews.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-slate-400">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                          <Calendar size={18} />
                        </div>
                        No candidates currently have interviews scheduled.
                      </td>
                    </tr>
                  ) : (
                    candidatesWithInterviews.map((cand, idx) => (
                      <tr key={cand.applicationId || idx} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          <div className="flex items-center space-x-2">
                            <img src={AVATARS[idx % AVATARS.length]} className="w-7 h-7 rounded-full" alt="" />
                            <div>
                              <span>{cand.candidateName}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {cand.passportNumber ? `🛂 ${cand.passportNumber}` : `ID: ${cand.candidateId || cand.applicationId}`}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{cand.jobTitle || "Job Position"}</div>
                          <div className="text-[10px] text-slate-400">{cand.projectName}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          🏢 {cand.vendorName || "Global Staffing Solutions"}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-indigo-700">
                          {cand.recruitmentStage?.includes("L2")
                            ? "L2 Client Technical Round"
                            : cand.recruitmentStage?.includes("L1")
                            ? "L1 Agency Interview"
                            : "Technical Assessment"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          📅 {cand.interview?.scheduledDate ? `${cand.interview.scheduledDate} ${cand.interview?.scheduledTime || ""}` : "Schedule in progress"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {cand.recruitmentStage || "Scheduled"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => openProcessModal(cand)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 transition cursor-pointer"
                          >
                            Update Result
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 8: VISA ISSUED & GRANTED - ONLY CANDIDATES WHO GOT VISA */}
        {(activeView === "offers" || activeView === "visaIssued") && (
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Visa Issued & Granted Candidates</h3>
                <p className="text-xs text-slate-500">
                  Overseas candidates who have successfully received ministry work permits and stamped visas
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                {visaIssuedCandidates.length} Visas Granted
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Candidate & Passport</th>
                    <th className="py-2.5 px-3">Target Project & Country</th>
                    <th className="py-2.5 px-3">Assigned Vendor</th>
                    <th className="py-2.5 px-3">Visa Status & Permit No</th>
                    <th className="py-2.5 px-3">Visa Document</th>
                    <th className="py-2.5 px-3">Flight / Departure</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visaIssuedCandidates.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-slate-400">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                          <Plane size={18} />
                        </div>
                        No candidates have been granted visas yet for this project.
                      </td>
                    </tr>
                  ) : (
                    visaIssuedCandidates.map((cand, idx) => {
                      const visaDoc = cand.documents?.find(
                        (d) =>
                          (d.docType && d.docType.toLowerCase().includes("visa")) ||
                          (d.name && d.name.toLowerCase().includes("visa"))
                      );
                      return (
                        <tr key={cand.applicationId || idx} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center space-x-2">
                              <img src={AVATARS[idx % AVATARS.length]} className="w-7 h-7 rounded-full shrink-0" alt="" />
                              <div>
                                <span className="font-bold text-slate-900 block">{cand.candidateName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {cand.passportNumber ? `🛂 ${cand.passportNumber}` : `ID: ${cand.candidateId || cand.applicationId}`}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{cand.projectName}</div>
                            <div className="text-[10px] text-slate-500">📍 {cand.destinationCountry || "UAE / Gulf"}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            🏢 {cand.vendorName || "Global Staffing Solutions"}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              🛂 {cand.visaDetails?.visaStatus || "Visa Issued / Approved"}
                            </span>
                            <div className="font-mono text-[10px] text-slate-500 mt-0.5 font-bold">
                              {cand.visaDetails?.visaNumber ? `#${cand.visaDetails.visaNumber}` : `Approved Permit`}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {visaDoc?.fileUrl ? (
                              <a
                                href={visaDoc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] inline-flex items-center gap-1 border border-emerald-200"
                              >
                                <ExternalLink size={10} />
                                <span>View Visa</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400">Verified by Ministry</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {cand.visaDetails?.flightDetails || "Awaiting Departure Schedule"}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => openProcessModal(cand)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 transition cursor-pointer"
                            >
                              Update Status
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
        )}

        {/* VIEW 10: ACTIVITY HISTORY (FULL AUDIT FEED WITH FILTERS & PAGINATION) */}
        {activeView === "activity" && (
          <div className="space-y-3.5">
            {/* Filter Toolbar */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Vendor Agency / Code</label>
                <input
                  type="text"
                  placeholder="Filter by Vendor ID..."
                  value={vendorFilter}
                  onChange={(e) => {
                    setVendorFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Candidate ID / Name</label>
                <input
                  type="text"
                  placeholder="Filter by Candidate..."
                  value={candidateFilter}
                  onChange={(e) => {
                    setCandidateFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Action Type</label>
                <select
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="ALL">All Actions</option>
                  <option value="CANDIDATE_SUBMITTED">Candidate Submitted</option>
                  <option value="STAGE_UPDATED">Stage Updated</option>
                  <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                  <option value="OFFER_ACCEPTED">Offer Accepted</option>
                  <option value="CANDIDATE_JOINED">Candidate Joined</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">End Date</label>
                <div className="flex space-x-1.5">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    onClick={() => {
                      setPage(1);
                      loadData();
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition shadow-2xs cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Action</th>
                      <th className="py-2.5 px-4">Performed By</th>
                      <th className="py-2.5 px-4">Vendor Agency</th>
                      <th className="py-2.5 px-4">Candidate / Target</th>
                      <th className="py-2.5 px-4">Status & Details</th>
                      <th className="py-2.5 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {activities.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400">
                          No audit trail events found matching the specified filter criteria.
                        </td>
                      </tr>
                    ) : (
                      activities.map((act) => (
                        <tr key={act._id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {act.action?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{act.userName || "System"}</div>
                            <div className="text-[10px] text-slate-400">{act.userRole || "HR"}</div>
                          </td>
                          <td className="py-3 px-4">
                            {act.vendorId ? (
                              <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                {act.vendorId}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {act.candidateName || act.candidateId || act.entityId || "—"}
                          </td>
                          <td className="py-3 px-4">
                            {act.status && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {act.status}
                              </span>
                            )}
                            {act.remarks && (
                              <div className="text-slate-500 text-[11px] mt-0.5 italic">{act.remarks}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500 whitespace-nowrap text-[11px]">
                            {new Date(act.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
                <span>
                  Showing {activities.length} of {totalActivities} activity events
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 font-bold disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    Prev
                  </button>
                  <span className="font-bold text-slate-800 px-2">{page}</span>
                  <button
                    disabled={page * limit >= totalActivities}
                    onClick={() => setPage(page + 1)}
                    className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 font-bold disabled:opacity-40 cursor-pointer shadow-2xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 11: HR PERSONNEL PROFILE */}
        {activeView === "profile" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6 max-w-2xl">
            <div className="flex items-center space-x-4 border-b border-slate-100 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xl shadow-md border-2 border-white">
                {(user?.name || user?.fullName || "HR")
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900 truncate">
                    {user?.name || user?.fullName || "Priya Sharma"}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
                <p className="text-xs font-semibold text-indigo-600">
                  {user?.role === "VENDOR_HR" ? "Vendor HR Officer" : "HR Personnel"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || "hr.operations@immigo.com"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold mb-0.5">Full Name</span>
                <span className="font-bold text-slate-800 text-sm">
                  {user?.name || user?.fullName || "Priya Sharma"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold mb-0.5">Designation / Role</span>
                <span className="font-bold text-indigo-700 text-sm">
                  {user?.role === "VENDOR_HR" ? "Vendor HR Officer" : "HR Personnel"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold mb-0.5">Email Address</span>
                <span className="font-bold text-slate-800">
                  {user?.email || "hr.operations@immigo.com"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold mb-0.5">Contact Phone</span>
                <span className="font-bold text-slate-800">
                  {user?.phone || "+91 98765 43210"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold mb-0.5">Staff / Employee ID</span>
                <span className="font-bold text-slate-800 font-mono">
                  {user?.employeeId || user?.id?.slice(0, 8) || "HR-VND-4082"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold mb-0.5">Department</span>
                <span className="font-bold text-slate-800">
                  Human Resources & Talent Deployment
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                <span className="text-slate-400 block font-semibold mb-0.5">Assigned Agency Representation</span>
                <span className="font-bold text-slate-800">
                  {vendorDashboardData?.vendor?.companyName ||
                    vendorsList[0]?.companyName ||
                    "Global Staffing Solutions Pvt Ltd"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: BATCH ASSIGN PROJECTS & VENDORS TO HR */}
      {showBatchAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assign Projects & Vendors to HR</h3>
                <p className="text-xs text-slate-500">
                  Allocate existing projects and vendor partner agencies to designated HR personnel (single, multiple, or all).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBatchAssignSubmit} className="space-y-4 text-xs font-medium overflow-y-auto pr-1 flex-1">
              {/* Select HR */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select HR Personnel *</label>
                <select
                  required
                  value={batchAssignForm.hrUserId}
                  onChange={(e) => setBatchAssignForm({ ...batchAssignForm, hrUserId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="">-- Choose HR Staff / Vendor HR --</option>
                  {vendorHRUsersList.map((hr) => (
                    <option key={hr._id || hr.id} value={hr._id || hr.id}>
                      {hr.name} ({hr.email}) • {hr.hrType || hr.role || "HR"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Projects Checklist */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800">Select Projects *</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                      {batchAssignForm.selectedProjectIds.length} of {projectsList.length} selected
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = projectsList.map((p) => p.projectId || p._id).filter(Boolean);
                        setBatchAssignForm({ ...batchAssignForm, selectedProjectIds: allIds });
                      }}
                      className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[10px] cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchAssignForm({ ...batchAssignForm, selectedProjectIds: [] })}
                      className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-[10px] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Filter projects by title or code..."
                  value={batchProjectSearch}
                  onChange={(e) => setBatchProjectSearch(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                />

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-lg p-2 bg-white">
                  {projectsList.length === 0 ? (
                    <p className="text-slate-400 text-[11px] py-1 text-center">No projects available</p>
                  ) : (
                    projectsList
                      .filter((p) => {
                        if (!batchProjectSearch) return true;
                        const q = batchProjectSearch.toLowerCase();
                        return (
                          (p.title && p.title.toLowerCase().includes(q)) ||
                          (p.projectName && p.projectName.toLowerCase().includes(q)) ||
                          (p.projectId && p.projectId.toLowerCase().includes(q))
                        );
                      })
                      .map((p) => {
                        const pId = p.projectId || p._id;
                        const isChecked = batchAssignForm.selectedProjectIds.includes(pId);
                        return (
                          <label
                            key={pId}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                              isChecked
                                ? "bg-blue-50/70 border-blue-200 text-blue-900"
                                : "hover:bg-slate-50 border-transparent text-slate-700"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBatchAssignForm({
                                      ...batchAssignForm,
                                      selectedProjectIds: [...batchAssignForm.selectedProjectIds, pId],
                                    });
                                  } else {
                                    setBatchAssignForm({
                                      ...batchAssignForm,
                                      selectedProjectIds: batchAssignForm.selectedProjectIds.filter((id) => id !== pId),
                                    });
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                              />
                              <div>
                                <span className="font-bold text-xs">{p.title || p.projectName}</span>
                                <span className="block text-[10px] text-slate-400">
                                  Code: {p.projectId || p._id} {p.clientName ? `• ${p.clientName}` : ""}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                              {p.destinationCountry || p.country || "Active"}
                            </span>
                          </label>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Select Vendors Checklist */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800">Select Vendor Agencies *</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                      {batchAssignForm.selectedVendorIds.length} of {vendorsList.length} selected
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = vendorsList.map((v) => v.vendorId || v.id).filter(Boolean);
                        setBatchAssignForm({ ...batchAssignForm, selectedVendorIds: allIds });
                      }}
                      className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[10px] cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchAssignForm({ ...batchAssignForm, selectedVendorIds: [] })}
                      className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-[10px] cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Filter vendors by agency name or ID..."
                  value={batchVendorSearch}
                  onChange={(e) => setBatchVendorSearch(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                />

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-lg p-2 bg-white">
                  {vendorsList.length === 0 ? (
                    <p className="text-slate-400 text-[11px] py-1 text-center">No vendors available</p>
                  ) : (
                    vendorsList
                      .filter((v) => {
                        if (!batchVendorSearch) return true;
                        const q = batchVendorSearch.toLowerCase();
                        return (
                          (v.companyName && v.companyName.toLowerCase().includes(q)) ||
                          (v.vendorId && v.vendorId.toLowerCase().includes(q))
                        );
                      })
                      .map((v) => {
                        const vId = v.vendorId || v.id;
                        const isChecked = batchAssignForm.selectedVendorIds.includes(vId);
                        return (
                          <label
                            key={vId}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                              isChecked
                                ? "bg-indigo-50/70 border-indigo-200 text-indigo-900"
                                : "hover:bg-slate-50 border-transparent text-slate-700"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setBatchAssignForm({
                                      ...batchAssignForm,
                                      selectedVendorIds: [...batchAssignForm.selectedVendorIds, vId],
                                    });
                                  } else {
                                    setBatchAssignForm({
                                      ...batchAssignForm,
                                      selectedVendorIds: batchAssignForm.selectedVendorIds.filter((id) => id !== vId),
                                    });
                                  }
                                }}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                              />
                              <div>
                                <span className="font-bold text-xs">{v.companyName}</span>
                                <span className="block text-[10px] text-slate-400">
                                  ID: {v.vendorId || v.id} {v.city ? `• ${v.city}` : ""}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {v.tier || "Tier 1"}
                            </span>
                          </label>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Assignment Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Allocation Notes / Instructions</label>
                <textarea
                  rows="2"
                  value={batchAssignForm.notes}
                  onChange={(e) => setBatchAssignForm({ ...batchAssignForm, notes: e.target.value })}
                  placeholder="e.g. Allocation of selected Gulf manpower projects & vendor accounts for recruitment management..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBatchAssignModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Allocating..." : "Confirm Allocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE CANDIDATE STAGES, MILESTONES & DOCUMENT UPLOAD */}
      {showProcessModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Process Candidate Milestones, Stages & Documents</h3>
                <p className="text-xs text-slate-500">
                  Update recruitment stage, verify process milestones, and upload compliance documents synced to Vendor Portal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProcessModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Candidate summary pill */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-sm block">{selectedCandidate.candidateName}</span>
                <span className="text-xs text-slate-500">
                  Role: {selectedCandidate.jobTitle || "Candidate"} • Project: {selectedCandidate.projectName || "Overseas"}
                </span>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Assigned Vendor: <strong className="text-indigo-700">{selectedCandidate.vendorName || "Global Staffing Solutions"}</strong>
                  {selectedCandidate.passportNumber ? ` • 🛂 ${selectedCandidate.passportNumber}` : ""}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                {selectedCandidate.recruitmentStage || selectedCandidate.status || "Applied"}
              </span>
            </div>

            <form onSubmit={handleCandidateProcessSubmit} className="space-y-4 text-xs font-medium overflow-y-auto pr-1 flex-1">
              {/* Stage selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Recruitment Stage *</label>
                <select
                  required
                  value={candidateProcessForm.stage}
                  onChange={(e) => setCandidateProcessForm({ ...candidateProcessForm, stage: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <optgroup label="Selection se Pehle (Pre-Interview Stages)">
                    <option value="Applied">1. Shortlisted / Applied</option>
                    <option value="Screening">2. Document Screening</option>
                    <option value="L1 Interview">3. L1 Technical Interview (Scheduled)</option>
                    <option value="L2 Interview">4. L2 Client Technical Interview (Scheduled)</option>
                    <option value="Hold">5. Interview On Hold</option>
                    <option value="Rejected">6. Interview Rejected</option>
                    <option value="Selected">7. Interview Success / Selected</option>
                  </optgroup>
                  <optgroup label="Interview Success ke Baad (Project Milestones & Stages)">
                    <option value="Offer Released">8. Milestone: Offer Letter Released</option>
                    <option value="Offer Accepted">9. Milestone: Offer Accepted & Signed</option>
                    <option value="Visa Processing">10. Milestone: Ministry Work Permit & Visa Processing</option>
                    <option value="Visa Issued">11. Milestone: Visa Stamped & Granted</option>
                    <option value="Joined">12. Milestone: Air Ticket & Final Deployment</option>
                  </optgroup>
                </select>
              </div>

              {/* Milestones checklist */}
              <div className="space-y-2">
                <label className="block text-slate-700 font-bold">Process Milestones Verification</label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {candidateProcessForm.milestones.map((m, idx) => (
                    <label
                      key={m.id || idx}
                      className="flex items-center space-x-2.5 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={m.completed}
                        onChange={(e) => {
                          const updated = [...candidateProcessForm.milestones];
                          updated[idx] = { ...m, completed: e.target.checked };
                          setCandidateProcessForm({ ...candidateProcessForm, milestones: updated });
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className={`text-xs font-semibold ${m.completed ? "text-emerald-700 font-bold" : "text-slate-700"}`}>
                        {m.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Compliance Documents & Upload Section */}
              <div className="space-y-2 p-3 bg-blue-50/40 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText size={14} className="text-blue-600" />
                    <span>Candidate Documents (Synced to Vendor Portal)</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Visible to Vendor
                  </span>
                </div>

                <p className="text-[11px] text-slate-500">
                  Documents attached here are automatically available in the Vendor Portal under Compliance Documents.
                </p>

                {/* Existing Documents list */}
                {(selectedCandidate.documents || []).length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                      Existing Attached Documents:
                    </span>
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {selectedCandidate.documents.map((doc, idx) => (
                        <div
                          key={doc.id || idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <Paperclip size={12} className="text-blue-600 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 truncate block">{doc.name || doc.fileName}</span>
                              <span className="text-[10px] text-slate-400 block">{doc.docType || "Document"}</span>
                            </div>
                          </div>
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline px-2 py-0.5 rounded bg-blue-50 shrink-0 inline-flex items-center gap-1"
                            >
                              <ExternalLink size={10} />
                              <span>View</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Document Box */}
                <div className="space-y-2 pt-2 border-t border-blue-100">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Upload New Compliance Document:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 font-semibold mb-0.5">Document Type</label>
                      <select
                        value={candidateProcessForm.newDocument.docType}
                        onChange={(e) =>
                          setCandidateProcessForm({
                            ...candidateProcessForm,
                            newDocument: { ...candidateProcessForm.newDocument, docType: e.target.value },
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none"
                      >
                        <option value="Passport Copy (Front & Back)">Passport Copy (Front & Back)</option>
                        <option value="Medical Fitness Certificate">Medical Fitness Certificate</option>
                        <option value="Trade Skills Test Certificate">Trade Skills Test Certificate</option>
                        <option value="Police Clearance Certificate (PCC)">Police Clearance Certificate (PCC)</option>
                        <option value="Ministry Work Permit & Visa Copy">Ministry Work Permit & Visa Copy</option>
                        <option value="Air Ticket & Flight Itinerary">Air Ticket & Flight Itinerary</option>
                        <option value="Employment Offer Letter">Employment Offer Letter</option>
                        <option value="Other Supporting Document">Other Supporting Document</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-600 font-semibold mb-0.5">Document Title / Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Cleared Medical Report.pdf"
                        value={candidateProcessForm.newDocument.name}
                        onChange={(e) =>
                          setCandidateProcessForm({
                            ...candidateProcessForm,
                            newDocument: { ...candidateProcessForm.newDocument, name: e.target.value },
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* File input */}
                  <div>
                    <label className="block text-[11px] text-slate-600 font-semibold mb-0.5">Choose File (PDF, JPG, PNG up to 10MB)</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={handleCandidateFileChange}
                      className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer bg-white p-1 rounded-lg border border-slate-200"
                    />
                    {candidateProcessForm.newDocument.fileName && (
                      <span className="text-[11px] text-emerald-700 font-bold mt-1 block">
                        ✓ Selected: {candidateProcessForm.newDocument.fileName} ({(candidateProcessForm.newDocument.fileSize / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">HR Processing Remarks</label>
                <textarea
                  rows="2"
                  value={candidateProcessForm.remarks}
                  onChange={(e) => setCandidateProcessForm({ ...candidateProcessForm, remarks: e.target.value })}
                  placeholder="Notes on document readiness, trade tests, interview results or deployment schedule..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProcessModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Progress & Documents"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminMasterLayout>
  );
}
