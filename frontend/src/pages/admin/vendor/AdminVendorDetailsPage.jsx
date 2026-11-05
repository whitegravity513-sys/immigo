import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Users,
  Briefcase,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Shield,
  FileText,
  AlertCircle,
  CreditCard,
  Send,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import adminVendorV1Service from "../../../services/adminVendorV1Service.js";
import apiClient from "../../../services/apiClient.js";
import { RECRUITMENT_STAGES } from "../../../constants/recruitmentStages.js";

export default function AdminVendorDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Auxiliary data
  const [allProjects, setAllProjects] = useState([]);

  // Modals
  const [showAssignProjectModal, setShowAssignProjectModal] = useState(false);
  const [showCreateHRModal, setShowCreateHRModal] = useState(false);
  const [showCreateMilestoneModal, setShowCreateMilestoneModal] = useState(false);
  const [showDirectPayModal, setShowDirectPayModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  // Form states
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

      // Also fetch projects list for the assignment modal
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
    if (id) loadDetails();
  }, [id]);

  const handleAssignProject = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await adminVendorV1Service.assignVendorToProject({
        vendorId: vendorData?.vendor?.vendorId || id,
        projectId: assignProjectForm.projectId,
        notes: assignProjectForm.notes,
      });
      showToast("Project assigned to vendor successfully!");
      setShowAssignProjectModal(false);
      setAssignProjectForm({ projectId: "", notes: "" });
      await loadDetails();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to assign project", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to unassign this vendor from the project?")) return;
    try {
      setActionLoading(true);
      await adminVendorV1Service.removeVendorFromProject({
        vendorId: vendorData?.vendor?.vendorId || id,
        projectId,
        reason: "Unassigned by Admin",
      });
      showToast("Vendor unassigned from project");
      await loadDetails();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to unassign", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateHR = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const vendorId = vendorData?.vendor?.vendorId || id;
      await apiClient.post("/admins", {
        name: createHRForm.name,
        email: createHRForm.email,
        password: createHRForm.password,
        phone: createHRForm.phone,
        role: "HR",
        hrType: "VENDOR_HR",
        assignedVendors: [vendorId],
      });
      showToast("Vendor HR user created successfully!");
      setShowCreateHRModal(false);
      setCreateHRForm({ name: "", email: "", password: "", phone: "" });
      await loadDetails();
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
      await adminVendorV1Service.createMilestone({
        ...milestoneForm,
        vendorId: vendorData?.vendor?.vendorId || id,
      });
      showToast("Payment milestone created successfully!");
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
      await loadDetails();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to create milestone", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectPayment = async (e) => {
    e.preventDefault();
    if (!selectedMilestone) return;
    try {
      setActionLoading(true);
      await adminVendorV1Service.markPaymentAsPaid(
        selectedMilestone.milestoneId || selectedMilestone._id,
        payForm
      );
      showToast("Vendor payment updated & recorded successfully!");
      setShowDirectPayModal(false);
      setSelectedMilestone(null);
      setPayForm({
        paidAmount: "",
        paymentReference: "",
        paymentMethod: "Bank Transfer",
        paymentProofUrl: "",
        remarks: "",
      });
      await loadDetails();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to record payment", "error");
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
      {/* Toast Notice */}
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

      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/admin/vendor/vendors")}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
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
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1.5 shadow-lg shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Project</span>
          </button>

          <button
            onClick={() => setShowCreateHRModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Vendor HR</span>
          </button>

          <button
            onClick={() => setShowCreateMilestoneModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition"
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
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: "Assigned Projects", val: stats.totalProjects || 0, color: "text-blue-400" },
              { label: "Vendor HRs", val: stats.totalHRs || 0, color: "text-indigo-400" },
              { label: "Candidates", val: stats.totalCandidates || 0, color: "text-sky-400" },
              { label: "Interviews", val: stats.totalInterviews || 0, color: "text-purple-400" },
              { label: "Selected", val: stats.selectedCandidates || 0, color: "text-pink-400" },
              { label: "Joined", val: stats.joinedCandidates || 0, color: "text-teal-400" },
              { label: "Total Value", val: `₹${(stats.totalPayment || 0).toLocaleString()}`, color: "text-amber-400" },
              { label: "Paid", val: `₹${(stats.paidPayment || 0).toLocaleString()}`, color: "text-emerald-400" },
            ].map((m, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-center">
                <div className="text-[11px] text-slate-400 font-medium">{m.label}</div>
                <div className={`text-base font-bold mt-1 ${m.color}`}>{m.val}</div>
              </div>
            ))}
          </div>

          {/* 8 Tabs Navigation */}
          <div className="border-b border-slate-800 flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: "overview", label: "1. Overview" },
              { id: "projects", label: `2. Projects (${projects.length})` },
              { id: "vendorHRs", label: `3. Vendor HRs (${vendorHRs.length})` },
              { id: "candidates", label: `4. Candidates (${candidates.length})` },
              { id: "recruitment", label: "5. Recruitment" },
              { id: "payments", label: "6. Payments & Milestones" },
              { id: "milestones", label: `7. Milestones (${milestones.length})` },
              { id: "activityLogs", label: `8. Activity Logs (${activityLogs.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Company Profile & Statutory
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Vendor Code</span>
                    <p className="font-mono font-semibold text-white mt-0.5">{vendor.vendorId}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Agency Name</span>
                    <p className="font-semibold text-white mt-0.5">{vendor.companyName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">PAN</span>
                    <p className="font-mono text-white mt-0.5">{vendor.pan || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">GSTIN</span>
                    <p className="font-mono text-white mt-0.5">{vendor.gstin || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Registered Address</span>
                    <p className="text-slate-200 mt-0.5">{vendor.address || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Payment Terms</span>
                    <p className="font-semibold text-blue-400 mt-0.5">{vendor.paymentTerms}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Onboarded At</span>
                    <p className="text-slate-200 mt-0.5">
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Bank Settlement Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Bank Name</span>
                    <p className="font-semibold text-white mt-0.5">
                      {vendor.bankDetails?.bankName || "HDFC Bank Ltd"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Account Number</span>
                    <p className="font-mono text-white mt-0.5">
                      {vendor.bankDetails?.accountNumber || "•••• •••• •••• 9281"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">IFSC Code</span>
                    <p className="font-mono text-white mt-0.5">
                      {vendor.bankDetails?.ifscCode || "HDFC0001234"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Account Holder</span>
                    <p className="text-white mt-0.5">
                      {vendor.bankDetails?.accountHolderName || vendor.companyName}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 mb-1">Administrative Notes</h4>
                  <p className="text-xs text-slate-400 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                    {vendor.vendorNotes || "No specific internal notes added for this vendor."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS */}
          {activeTab === "projects" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Assigned Projects</h3>
                  <p className="text-xs text-slate-400">Projects where this vendor is authorized to supply candidates</p>
                </div>
                <button
                  onClick={() => setShowAssignProjectModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Project</span>
                </button>
              </div>

              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Project Name</th>
                      <th className="py-3 px-4 font-semibold">Project Code</th>
                      <th className="py-3 px-4 font-semibold">Assigned Date</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Notes</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {projects.map((p) => (
                      <tr key={p.id || p.projectId} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-semibold text-white">{p.projectName}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{p.projectId}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {new Date(p.assignedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {p.status || "Active"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{p.notes || "—"}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleRemoveProject(p.projectId)}
                            className="text-xs text-red-400 hover:text-red-300 font-medium"
                          >
                            Unassign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: VENDOR HRS */}
          {activeTab === "vendorHRs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Vendor HR Personnel</h3>
                  <p className="text-xs text-slate-400">Users authorized to submit and manage candidates for this vendor</p>
                </div>
                <button
                  onClick={() => setShowCreateHRModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Vendor HR</span>
                </button>
              </div>

              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Name</th>
                      <th className="py-3 px-4 font-semibold">Email</th>
                      <th className="py-3 px-4 font-semibold">Phone</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {vendorHRs.map((hr) => (
                      <tr key={hr.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-semibold text-white">{hr.name}</td>
                        <td className="py-3 px-4 text-slate-300">{hr.email}</td>
                        <td className="py-3 px-4 text-slate-400">{hr.phone || "—"}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              hr.isActive
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                          >
                            {hr.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(hr.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CANDIDATES */}
          {activeTab === "candidates" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Candidate</th>
                      <th className="py-3 px-4 font-semibold">Position</th>
                      <th className="py-3 px-4 font-semibold">Project</th>
                      <th className="py-3 px-4 font-semibold">Recruitment Stage</th>
                      <th className="py-3 px-4 font-semibold">Overall Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Applied Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {candidates.map((cand) => (
                      <tr key={cand.id || cand.applicationId} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{cand.candidateName}</div>
                          <div className="text-slate-400 text-[11px]">{cand.candidateEmail}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-200">{cand.position || "Candidate"}</td>
                        <td className="py-3 px-4 text-slate-300">{cand.projectName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {cand.recruitmentStage || cand.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              cand.status === "Selected" || cand.status === "Joined"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : cand.status === "Rejected"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {cand.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400">
                          {new Date(cand.appliedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: RECRUITMENT */}
          {activeTab === "recruitment" && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Recruitment Pipeline Performance
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {RECRUITMENT_STAGES.slice(0, 8).map((stage) => {
                  const count = candidates.filter(
                    (c) => c.recruitmentStage === stage || c.status === stage
                  ).length;
                  return (
                    <div key={stage} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                      <div className="text-xs text-slate-400 font-medium">{stage}</div>
                      <div className="text-xl font-bold text-white mt-1">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6 & 7: PAYMENTS & MILESTONES */}
          {(activeTab === "payments" || activeTab === "milestones") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Vendor Payment Milestones</h3>
                  <p className="text-xs text-slate-400">
                    Direct milestone management and payment settlement (Super Admin / Admin only)
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateMilestoneModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Milestone</span>
                </button>
              </div>

              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Milestone Name</th>
                      <th className="py-3 px-4 font-semibold">Project</th>
                      <th className="py-3 px-4 font-semibold">Amount</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Paid Amount</th>
                      <th className="py-3 px-4 font-semibold">Ref / Due Date</th>
                      <th className="py-3 px-4 font-semibold text-right">Direct Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {milestones.map((m) => (
                      <tr key={m.milestoneId || m._id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{m.milestoneName}</div>
                          <div className="text-slate-400 text-[11px] font-mono">{m.milestoneId}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{m.projectName}</td>
                        <td className="py-3 px-4 font-bold text-white">₹{m.amount?.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              m.status === "Paid"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : m.status === "Approved"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-400">
                          ₹{(m.paidAmount || (m.status === "Paid" ? m.amount : 0)).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {m.paymentReference || (m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "—")}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {m.status !== "Paid" ? (
                            <button
                              onClick={() => {
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
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              Mark as Paid
                            </button>
                          ) : (
                            <span className="text-emerald-400 font-semibold text-xs flex items-center justify-end space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Settled</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: ACTIVITY LOGS */}
          {activeTab === "activityLogs" && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Full Vendor Audit Logs
              </h3>
              {activityLogs.map((log) => (
                <div
                  key={log._id}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-white">{log.title || log.action}</div>
                    <div className="text-xs text-slate-300">{log.description}</div>
                    {log.remarks && <div className="text-[11px] text-slate-400 italic">"{log.remarks}"</div>}
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL 1: ASSIGN PROJECT */}
      {showAssignProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Assign Project to Vendor</h3>
              <button onClick={() => setShowAssignProjectModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignProject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Project *</label>
                <select
                  required
                  value={assignProjectForm.projectId}
                  onChange={(e) => setAssignProjectForm({ ...assignProjectForm, projectId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">Select a Project</option>
                  {allProjects.map((p) => (
                    <option key={p.projectId || p._id} value={p.projectId || p._id}>
                      {p.title || p.projectName} ({p.projectId || p._id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assignment Notes / Requirements</label>
                <textarea
                  rows="3"
                  value={assignProjectForm.notes}
                  onChange={(e) => setAssignProjectForm({ ...assignProjectForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="Specific trade requirements, timeline, quota..."
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAssignProjectModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  {actionLoading ? "Assigning..." : "Assign Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE VENDOR HR */}
      {showCreateHRModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Vendor HR Account</h3>
              <button onClick={() => setShowCreateHRModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHR} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={createHRForm.name}
                  onChange={(e) => setCreateHRForm({ ...createHRForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="e.g. Vikram Patel"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  value={createHRForm.email}
                  onChange={(e) => setCreateHRForm({ ...createHRForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="hr@vendoragency.com"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={createHRForm.password}
                  onChange={(e) => setCreateHRForm({ ...createHRForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="••••••••••••"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone</label>
                <input
                  type="tel"
                  value={createHRForm.phone}
                  onChange={(e) => setCreateHRForm({ ...createHRForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateHRModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  {actionLoading ? "Creating..." : "Create Vendor HR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE MILESTONE */}
      {showCreateMilestoneModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Payment Milestone</h3>
              <button onClick={() => setShowCreateMilestoneModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Milestone Name *</label>
                <input
                  type="text"
                  required
                  value={milestoneForm.milestoneName}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, milestoneName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="e.g. 50 Candidates Shortlisted"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Project *</label>
                <select
                  required
                  value={milestoneForm.projectId}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, projectId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.projectId} value={p.projectId}>
                      {p.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={milestoneForm.amount}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={milestoneForm.dueDate}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Conditions / Milestone Trigger</label>
                <textarea
                  rows="2"
                  value={milestoneForm.conditions}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, conditions: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="e.g. Payable upon visa release of batch 1 candidates"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateMilestoneModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  {actionLoading ? "Creating..." : "Create Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DIRECT PAYMENT UPDATE / MARK AS PAID */}
      {showDirectPayModal && selectedMilestone && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Direct Payment Settlement</h3>
                <p className="text-xs text-slate-400">
                  {selectedMilestone.milestoneName} (Total: ₹{selectedMilestone.amount})
                </p>
              </div>
              <button onClick={() => setShowDirectPayModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleDirectPayment} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount to Pay (₹) *</label>
                  <input
                    type="number"
                    required
                    value={payForm.paidAmount}
                    onChange={(e) => setPayForm({ ...payForm, paidAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                  <select
                    value={payForm.paymentMethod}
                    onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash / Other">Cash / Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Transaction Ref / UTR *</label>
                <input
                  type="text"
                  required
                  value={payForm.paymentReference}
                  onChange={(e) => setPayForm({ ...payForm, paymentReference: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="e.g. UTR-9281734612"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Proof URL</label>
                <input
                  type="url"
                  value={payForm.paymentProofUrl}
                  onChange={(e) => setPayForm({ ...payForm, paymentProofUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="https://drive.google.com/receipt.pdf"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Remarks</label>
                <textarea
                  rows="2"
                  value={payForm.remarks}
                  onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="Settlement notes..."
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDirectPayModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  {actionLoading ? "Processing..." : "Confirm & Mark as Paid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
