import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  CreditCard,
  UserPlus,
} from "lucide-react";
import adminVendorV1Service from "../../../services/adminVendorV1Service.js";
import apiClient from "../../../services/apiClient.js";

import VendorMetricsBar from "../../../components/admin/vendor/details/VendorMetricsBar.jsx";
import VendorOverviewTab from "../../../components/admin/vendor/details/VendorOverviewTab.jsx";
import VendorProjectsTab from "../../../components/admin/vendor/details/VendorProjectsTab.jsx";
import VendorHRsTab from "../../../components/admin/vendor/details/VendorHRsTab.jsx";
import VendorCandidatesTab from "../../../components/admin/vendor/details/VendorCandidatesTab.jsx";
import VendorRecruitmentTab from "../../../components/admin/vendor/details/VendorRecruitmentTab.jsx";
import VendorMilestonesTab from "../../../components/admin/vendor/details/VendorMilestonesTab.jsx";
import VendorActivityLogsTab from "../../../components/admin/vendor/details/VendorActivityLogsTab.jsx";
import {
  AssignProjectModal,
  CreateHRModal,
  CreateMilestoneModal,
  DirectPayModal,
} from "../../../components/admin/vendor/details/VendorActionModals.jsx";

export default function AdminVendorDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [allProjects, setAllProjects] = useState([]);

  const [showAssignProjectModal, setShowAssignProjectModal] = useState(false);
  const [showCreateHRModal, setShowCreateHRModal] = useState(false);
  const [showCreateMilestoneModal, setShowCreateMilestoneModal] = useState(false);
  const [showDirectPayModal, setShowDirectPayModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  const [assignProjectForm, setAssignProjectForm] = useState({
    projectId: "",
    notes: "",
  });

  const [createHRForm, setCreateHRForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [milestoneForm, setMilestoneForm] = useState({
    milestoneName: "",
    projectId: "",
    amount: "",
    percentage: 0,
    conditions: "",
    dueDate: "",
    remarks: "",
  });

  const [payForm, setPayForm] = useState({
    paidAmount: "",
    paymentReference: "",
    paymentMethod: "Bank Transfer",
    paymentProofUrl: "",
    remarks: "",
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await adminVendorV1Service.getVendorDetails(id);
      setVendorData(res);

      const projRes = await apiClient.get("/client/projects").catch(() => ({ data: [] }));
      const projects = projRes.data?.data || projRes.data?.projects || projRes.data || [];
      setAllProjects(Array.isArray(projects) ? projects : []);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to load vendor details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleAssignProject = async (e) => {
    e.preventDefault();
    if (!assignProjectForm.projectId) {
      showToast("Please select a project", "error");
      return;
    }
    try {
      setActionLoading(true);
      await adminVendorV1Service.assignProjectToVendor(id, assignProjectForm);
      showToast("Project assigned to vendor successfully");
      setShowAssignProjectModal(false);
      setAssignProjectForm({ projectId: "", notes: "" });
      loadDetails();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to assign project", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to unassign this project from this vendor?")) return;
    try {
      setActionLoading(true);
      await adminVendorV1Service.removeProjectFromVendor(id, projectId);
      showToast("Project unassigned successfully");
      loadDetails();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to remove project", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateHR = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await adminVendorV1Service.createVendorHR(id, createHRForm);
      showToast("Vendor HR created successfully");
      setShowCreateHRModal(false);
      setCreateHRForm({ name: "", email: "", password: "", phone: "" });
      loadDetails();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to create Vendor HR", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await adminVendorV1Service.createVendorMilestone(id, {
        ...milestoneForm,
        amount: Number(milestoneForm.amount),
      });
      showToast("Milestone created successfully");
      setShowCreateMilestoneModal(false);
      setMilestoneForm({
        milestoneName: "",
        projectId: "",
        amount: "",
        percentage: 0,
        conditions: "",
        dueDate: "",
        remarks: "",
      });
      loadDetails();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to create milestone", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectPayMilestone = async (e) => {
    e.preventDefault();
    if (!selectedMilestone) return;
    try {
      setActionLoading(true);
      const mId = selectedMilestone.milestoneId || selectedMilestone._id;
      await adminVendorV1Service.settleVendorMilestonePayment(id, mId, {
        ...payForm,
        paidAmount: Number(payForm.paidAmount),
      });
      showToast("Milestone marked as paid successfully");
      setShowDirectPayModal(false);
      setSelectedMilestone(null);
      loadDetails();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to settle milestone", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const vendor = vendorData?.vendor || {};
  const stats = vendorData?.stats || {};
  const projects = vendorData?.projects || [];
  const vendorHRs = vendorData?.vendorHRs || [];
  const candidates = vendorData?.candidates || [];
  const milestones = vendorData?.milestones || [];
  const activityLogs = vendorData?.activityLogs || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border transition ${
            toast.type === "error"
              ? "bg-red-950/90 border-red-500 text-red-200"
              : "bg-emerald-950/90 border-emerald-500 text-emerald-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/admin/vendor/vendors")}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {vendor.companyName || "Vendor Organization"}
              </h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                {vendor.vendorId}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                {vendor.status || "Active"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Contact: {vendor.contactPersonName} • {vendor.email} • {vendor.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAssignProjectModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1.5 shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Project</span>
          </button>

          <button
            onClick={() => setShowCreateHRModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Vendor HR</span>
          </button>

          <button
            onClick={() => setShowCreateMilestoneModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Add Milestone</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading vendor portfolio and records...</p>
        </div>
      ) : (
        <>
          <VendorMetricsBar stats={stats} />

          {/* Tab Navigation */}
          <div className="border-b border-slate-800 flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: "overview", label: "1. Overview" },
              { id: "projects", label: `2. Projects (${projects.length})` },
              { id: "vendorHRs", label: `3. Vendor HRs (${vendorHRs.length})` },
              { id: "candidates", label: `4. Candidates (${candidates.length})` },
              { id: "recruitment", label: "5. Recruitment" },
              { id: "payments", label: `6. Milestones & Payments (${milestones.length})` },
              { id: "activityLogs", label: `7. Activity Logs (${activityLogs.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && <VendorOverviewTab vendor={vendor} />}
          {activeTab === "projects" && (
            <VendorProjectsTab
              projects={projects}
              onOpenAssignModal={() => setShowAssignProjectModal(true)}
              onRemoveProject={handleRemoveProject}
            />
          )}
          {activeTab === "vendorHRs" && (
            <VendorHRsTab
              vendorHRs={vendorHRs}
              onOpenCreateHRModal={() => setShowCreateHRModal(true)}
            />
          )}
          {activeTab === "candidates" && <VendorCandidatesTab candidates={candidates} />}
          {activeTab === "recruitment" && <VendorRecruitmentTab candidates={candidates} />}
          {activeTab === "payments" && (
            <VendorMilestonesTab
              milestones={milestones}
              onOpenCreateMilestoneModal={() => setShowCreateMilestoneModal(true)}
              onOpenDirectPayModal={(m) => {
                setSelectedMilestone(m);
                setPayForm({
                  paidAmount: m.amount - (m.paidAmount || 0),
                  paymentReference: "",
                  paymentMethod: "Bank Transfer",
                  paymentProofUrl: "",
                  remarks: "Direct settlement",
                });
                setShowDirectPayModal(true);
              }}
            />
          )}
          {activeTab === "activityLogs" && <VendorActivityLogsTab activityLogs={activityLogs} />}
        </>
      )}

      <AssignProjectModal
        isOpen={showAssignProjectModal}
        onClose={() => setShowAssignProjectModal(false)}
        allProjects={allProjects}
        assignProjectForm={assignProjectForm}
        setAssignProjectForm={setAssignProjectForm}
        onSubmit={handleAssignProject}
        actionLoading={actionLoading}
      />

      <CreateHRModal
        isOpen={showCreateHRModal}
        onClose={() => setShowCreateHRModal(false)}
        createHRForm={createHRForm}
        setCreateHRForm={setCreateHRForm}
        onSubmit={handleCreateHR}
        actionLoading={actionLoading}
      />

      <CreateMilestoneModal
        isOpen={showCreateMilestoneModal}
        onClose={() => setShowCreateMilestoneModal(false)}
        projects={projects}
        milestoneForm={milestoneForm}
        setMilestoneForm={setMilestoneForm}
        onSubmit={handleCreateMilestone}
        actionLoading={actionLoading}
      />

      <DirectPayModal
        isOpen={showDirectPayModal}
        onClose={() => setShowDirectPayModal(false)}
        selectedMilestone={selectedMilestone}
        payForm={payForm}
        setPayForm={setPayForm}
        onSubmit={handleDirectPayMilestone}
        actionLoading={actionLoading}
      />
    </div>
  );
}
