import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  FileText,
  Edit2,
  Plus,
  FolderKanban,
  Users,
  User,
  ExternalLink,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  FileCheck,
  Upload,
  Briefcase,
  Trash2,
  CreditCard,
  Receipt,
  IndianRupee,
  AlertCircle,
  TrendingUp,
  History,
} from "lucide-react";
import StatusBadge from "../../components/crm/ui/StatusBadge.jsx";
import LoadingSkeleton from "../../components/crm/ui/LoadingSkeleton.jsx";
import AddProjectModal from "../../components/crm/projects/AddProjectModal.jsx";
import DocumentsList from "../../components/crm/documents/DocumentsList.jsx";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal.jsx";
import { RecordClientPaymentModal } from "../../components/crm/payments/RecordClientPaymentModal.jsx";
import { useCrmToast } from "../../components/crm/layout/CrmLayout.jsx";
import crmClientService, {
  calculateClientManpower,
  calculateProjectManpower,
} from "../../services/crmClientService.js";

export function ClientDetails() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useCrmToast();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [clientPayments, setClientPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const loadClient = async () => {
    setLoading(true);
    try {
      const data = await crmClientService.getClientById(clientId);
      if (!data) {
        showToast("Client not found", "error");
        navigate("/clients");
        return;
      }
      setClient(data);
      loadClientPayments(data.id || clientId);
    } catch (err) {
      console.error("Error loading client:", err);
      showToast("Failed to load client details", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadClientPayments = async (cid) => {
    const idToFetch = cid || clientId;
    if (!idToFetch) return;
    setLoadingPayments(true);
    try {
      const res = await crmClientService.getClientPayments({ clientId: idToFetch, limit: 50 });
      setClientPayments(res.payments || []);
    } catch (err) {
      console.error("Error fetching client payments:", err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClient = async () => {
    setIsDeleting(true);
    try {
      await crmClientService.deleteClient(client.id);
      showToast("Client deleted successfully.", "success");
      setDeleteModalOpen(false);
      navigate("/client/clients");
    } catch (err) {
      showToast(err.message || "Failed to delete client", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddProject = async (projectData) => {
    try {
      await crmClientService.addProject(clientId, projectData);
      showToast("Project added successfully to client!", "success");
      loadClient();
    } catch (err) {
      showToast("Failed to add project", "error");
    }
  };

  const handleToggleProjectStatus = async (projId) => {
    try {
      const updated = await crmClientService.toggleProjectStatus(clientId, projId);
      showToast(`Project status changed to ${updated.status}.`, "success");
      loadClient();
    } catch (err) {
      showToast("Failed to update project status", "error");
    }
  };

  const handleDocumentsChange = async (updatedDocs) => {
    try {
      await crmClientService.updateClient(clientId, {
        ...client,
        documents: updatedDocs,
      });
      setClient((prev) => ({ ...prev, documents: updatedDocs }));
      showToast("Client documents updated successfully.", "success");
    } catch (err) {
      showToast("Failed to update documents", "error");
    }
  };

  const handleDownloadDoc = (doc) => {
    showToast(`Downloading "${doc.name}" (${doc.fileName})...`, "info");
  };

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={4} />
      </div>
    );
  }

  if (!client) return null;

  const totalClientManpower = calculateClientManpower(client);
  const primaryContact = client.contacts?.find((c) => c.isPrimary) || client.contacts?.[0];

  const tabs = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "projects", label: `Projects (${client.projects?.length || 0})`, icon: FolderKanban },
    { id: "milestones", label: `Payment Milestones (${client.paymentMilestones?.length || 0})`, icon: CreditCard },
    { id: "manpower", label: "Manpower Requirements", icon: Users },
    { id: "contacts", label: `Contacts (${client.contacts?.length || 1})`, icon: User },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Attractive Back Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
        <Link
          to="/client/clients"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Client Management</span>
        </Link>
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-gray-500">
          <Link to="/client/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link to="/client/clients" className="hover:text-blue-600 transition-colors">Clients</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-bold">Client Details</span>
        </div>
      </div>

      {/* Client Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-extrabold text-xl flex items-center justify-center shrink-0">
              {client.companyName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                  {client.companyName}
                </h1>
                <StatusBadge status={client.status} />
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-gray-700">
                  <MapPin size={13} className="text-blue-500" />
                  {client.country} {client.city ? `• ${client.city}` : ""}
                </span>
                <span>•</span>
                <span>Type: <strong className="text-gray-700">{client.companyType || "Enterprise"}</strong></span>
                <span>•</span>
                <span>Client ID: <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px] text-gray-700 font-mono">{client.id}</code></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <Link
              to={`/clients/${client.id}/edit`}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
            >
              <Edit2 size={14} />
              <span>Edit Client</span>
            </Link>

            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>

            <Link
              to={`/client/clients/${client.id}/projects/new`}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/25 transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Create Project / Requirement</span>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-6 border-b border-gray-200 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Projects
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {client.projects?.length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Deployment work sites</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Required Manpower
              </p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {totalClientManpower.toLocaleString()} Persons
              </p>
              <p className="text-xs text-gray-500 mt-1">Sum across all trades & projects</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Active Requirements
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {(client.projects || []).filter((p) => p.status === "Active").length} Projects
              </p>
              <p className="text-xs text-gray-500 mt-1">Under immediate sourcing</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Information Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" />
                  <span>Company Information</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">Company Name</span>
                  <span className="font-semibold text-gray-900">{client.companyName}</span>
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">Company Type</span>
                  <span className="font-semibold text-gray-900">{client.companyType || "—"}</span>
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">Country</span>
                  <span className="font-semibold text-gray-900">{client.country}</span>
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">City / State</span>
                  <span className="font-semibold text-gray-900">
                    {client.city} {client.state ? `, ${client.state}` : ""}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">Commercial Reg (CR) No</span>
                  <span className="font-mono text-gray-900">{client.registrationNumber || "—"}</span>
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">Trade License No</span>
                  <span className="font-mono text-gray-900">{client.tradeLicenseNumber || "—"}</span>
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">Tax / VAT Number</span>
                  <span className="font-mono text-gray-900">{client.taxNumber || "—"}</span>
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">Registered Address</span>
                  <span className="font-semibold text-gray-900">
                    {client.address || "—"} {client.addressLine2 ? `, ${client.addressLine2}` : ""}
                  </span>
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">Official Email</span>
                  <a
                    href={`mailto:${client.email}`}
                    className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Mail size={12} />
                    <span>{client.email || "—"}</span>
                  </a>
                </div>

                <div>
                  <span className="text-gray-400 block text-[11px]">Company Phone</span>
                  <span className="font-semibold text-gray-900 flex items-center gap-1">
                    <Phone size={12} className="text-gray-400" />
                    <span>{client.phone || "—"}</span>
                  </span>
                </div>

                {client.website && (
                  <div className="sm:col-span-2">
                    <span className="text-gray-400 block text-[11px]">Website</span>
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-blue-600 hover:underline flex items-center gap-1.5"
                    >
                      <Globe size={12} />
                      <span>{client.website}</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Primary Contact Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  <span>Primary Contact Person</span>
                </h3>
              </div>

              {primaryContact ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-100">
                      {primaryContact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{primaryContact.name}</p>
                      <p className="text-xs text-gray-500">
                        {primaryContact.designation || "HR Lead"} • {primaryContact.department || "Human Resources"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Email Address</span>
                      <a
                        href={`mailto:${primaryContact.email}`}
                        className="font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Mail size={12} />
                        <span>{primaryContact.email}</span>
                      </a>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[11px]">Phone Number</span>
                      <span className="font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
                        <Phone size={12} className="text-gray-400" />
                        <span>{primaryContact.phone}</span>
                      </span>
                    </div>

                    {primaryContact.whatsapp && (
                      <div>
                        <span className="text-gray-400 block text-[11px]">WhatsApp</span>
                        <span className="font-semibold text-emerald-700 mt-0.5 block">
                          {primaryContact.whatsapp}
                        </span>
                      </div>
                    )}

                    {primaryContact.altPhone && (
                      <div>
                        <span className="text-gray-400 block text-[11px]">Alternative Phone</span>
                        <span className="font-semibold text-gray-800 mt-0.5 block">
                          {primaryContact.altPhone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">No primary contact added.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROJECTS TAB */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Deployment Projects</h3>
              <p className="text-xs text-gray-500">
                Active foreign project sites and manpower demand agreements.
              </p>
            </div>
            <Link
              to={`/client/clients/${client.id}/projects/new`}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/25 transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Create Project / Requirement</span>
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            {(client.projects || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 space-y-3">
                <p>No projects registered for this client yet.</p>
                <Link
                  to={`/client/clients/${client.id}/projects/new`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  <span>Create First Project / Requirement</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 sm:px-6">Project Name</th>
                      <th className="py-3.5 px-4">Location / Country</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4 text-center">Required Manpower</th>
                      <th className="py-3.5 px-4">Start Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(client.projects || []).map((project) => {
                      const reqCount = calculateProjectManpower(project);
                      return (
                        <tr
                          key={project.id}
                          className="hover:bg-blue-50/30 transition-colors"
                        >
                          <td className="py-3.5 px-4 sm:px-6">
                            <Link
                              to={`/client/clients/${client.id}/projects/${project.id}`}
                              className="font-bold text-gray-900 hover:text-blue-600 text-xs block"
                            >
                              {project.projectName}
                            </Link>
                            <span className="text-[11px] text-gray-400">
                              Duration: {project.duration || "24 Months"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="flex items-center gap-1 text-gray-700 font-medium">
                              <MapPin size={12} className="text-gray-400" />
                              {project.location || project.country}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 font-medium">
                            {project.projectType || "General"}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                              {reqCount} Persons
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-600">
                            {project.startDate || "—"}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <StatusBadge status={project.status} size="sm" />
                              <button
                                type="button"
                                onClick={() => handleToggleProjectStatus(project.id)}
                                className="px-2 py-0.5 text-[10px] font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-gray-200 rounded transition-colors cursor-pointer"
                                title={`Switch status to ${project.status === "Active" ? "Inactive" : "Active"}`}
                              >
                                {project.status === "Active" ? "Set Inactive" : "Set Active"}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to={`/client/clients/${client.id}/projects/${project.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <span>View Project</span>
                              <ArrowRight size={13} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: PAYMENT MILESTONES TAB */}
      {activeTab === "milestones" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {(() => {
            const milestones = client.paymentMilestones || [];
            const totalAgreed = client.totalAgreedAmount || milestones.reduce((s, m) => s + (Number(m.paymentAmount) || 0), 0);
            const totalPaid = client.totalPaidAmount || 0;
            const remaining = client.remainingAmount !== undefined ? client.remainingAmount : (totalAgreed - totalPaid);
            const completedCount = milestones.filter((m) => m.paymentStatus === "Paid").length;
            const pendingDueCount = milestones.filter((m) => m.paymentStatus === "Pending" || m.paymentStatus === "Due" || m.paymentStatus === "Partially Paid").length;
            const overdueCount = milestones.filter((m) => m.paymentStatus === "Overdue").length;
            const paidPct = totalAgreed > 0 ? Math.min(100, Math.round((totalPaid / totalAgreed) * 100)) : 0;

            return (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <IndianRupee size={13} className="text-blue-600" />
                      Total Agreed Amount
                    </p>
                    <p className="text-2xl font-black text-gray-900 mt-1">
                      ₹{Number(totalAgreed).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Sum of {milestones.length} configured milestones</p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt size={13} className="text-emerald-600" />
                      Total Amount Paid
                    </p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">
                      ₹{Number(totalPaid).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-emerald-600/80 font-medium mt-1">{paidPct}% of agreed amount cleared</p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp size={13} className="text-amber-600" />
                      Remaining Balance
                    </p>
                    <p className="text-2xl font-black text-amber-600 mt-1">
                      ₹{Number(remaining).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Outstanding client milestone obligation</p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard size={13} className="text-indigo-600" />
                      Milestones Status
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div>
                        <span className="text-xl font-black text-emerald-600">{completedCount}</span>
                        <span className="text-[10px] block text-gray-400 uppercase font-bold">Paid</span>
                      </div>
                      <div className="h-6 w-px bg-gray-200" />
                      <div>
                        <span className="text-xl font-black text-blue-600">{pendingDueCount}</span>
                        <span className="text-[10px] block text-gray-400 uppercase font-bold">Pending/Due</span>
                      </div>
                      {overdueCount > 0 && (
                        <>
                          <div className="h-6 w-px bg-gray-200" />
                          <div>
                            <span className="text-xl font-black text-rose-600">{overdueCount}</span>
                            <span className="text-[10px] block text-rose-500 uppercase font-bold">Overdue</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Actions Header */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                        <span>Milestone Payment Progress</span>
                        <span>{paidPct}% Completed</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            paidPct === 100
                              ? "bg-emerald-500"
                              : paidPct > 50
                              ? "bg-blue-600"
                              : "bg-indigo-600"
                          }`}
                          style={{ width: `${paidPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <Link
                        to={`/client/ledger?clientId=${client.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs transition-colors"
                      >
                        <Receipt size={14} className="text-gray-500" />
                        <span>View in Payment Ledger</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMilestone(null);
                          setIsRecordPaymentOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/25 transition-colors cursor-pointer"
                      >
                        <Plus size={15} />
                        <span>Record Payment</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Milestones Detailed Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Configured Payment Milestones</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Candidate selection and recruitment milestone obligations defined for this client.
                      </p>
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      {milestones.length} Milestones Configured
                    </span>
                  </div>

                  {milestones.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <CreditCard size={36} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-semibold text-gray-700">No payment milestones configured</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Edit this client to define milestone schedules or record payments via the ledger.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="py-3 px-4">#</th>
                            <th className="py-3 px-4">Milestone Name</th>
                            <th className="py-3 px-4">Agreed Amount</th>
                            <th className="py-3 px-4">Paid / Balance</th>
                            <th className="py-3 px-4">Payment Trigger / Condition</th>
                            <th className="py-3 px-4">Timeline / Expected Date</th>
                            <th className="py-3 px-4">Actual Paid Date</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {milestones.map((m, idx) => {
                            const amount = Number(m.paymentAmount) || 0;
                            const paidAmt = Number(m.amountPaid) || 0;
                            const bal = m.remainingBalance !== undefined ? Number(m.remainingBalance) : Math.max(0, amount - paidAmt);
                            const status = m.paymentStatus || "Pending";

                            const statusColors = {
                              Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
                              "Partially Paid": "bg-blue-50 text-blue-700 border-blue-200",
                              Due: "bg-amber-50 text-amber-700 border-amber-200",
                              Overdue: "bg-rose-50 text-rose-700 border-rose-200",
                              Pending: "bg-gray-100 text-gray-700 border-gray-200",
                            };

                            return (
                              <tr key={m.id || idx} className="hover:bg-gray-50/60 transition-colors">
                                <td className="py-3 px-4 font-mono text-gray-400">{idx + 1}</td>
                                <td className="py-3 px-4">
                                  <div className="font-bold text-gray-900">{m.milestoneName}</div>
                                  {m.remarks && (
                                    <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{m.remarks}</div>
                                  )}
                                  {(m.candidateName || m.projectName) && (
                                    <div className="text-[10px] text-blue-600 mt-0.5">
                                      {m.candidateName && <span>Candidate: {m.candidateName} </span>}
                                      {m.projectName && <span>• Proj: {m.projectName}</span>}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-bold text-gray-900">
                                  ₹{amount.toLocaleString("en-IN")}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-emerald-700 font-semibold">₹{paidAmt.toLocaleString("en-IN")}</div>
                                  {bal > 0 && (
                                    <div className="text-[11px] text-amber-600 font-medium">Bal: ₹{bal.toLocaleString("en-IN")}</div>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-gray-600 max-w-xs">
                                  <span className="inline-block bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                    {m.paymentCondition || "—"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                                  {m.expectedTimeline || (m.expectedDate ? formatDate(m.expectedDate) : "—")}
                                </td>
                                <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                                  {m.actualPaymentDate ? formatDate(m.actualPaymentDate) : "—"}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusColors[status] || "bg-gray-100 text-gray-700"}`}>
                                    {status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  {status !== "Paid" ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedMilestone(m);
                                        setIsRecordPaymentOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <CreditCard size={12} />
                                      <span>Pay</span>
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center gap-1">
                                      <CheckCircle size={13} />
                                      <span>Cleared</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Client Transaction History */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <History size={16} className="text-blue-600" />
                        <span>Client Payment History</span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Immutable transaction log of payments made by the company to {client.companyName}.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">
                      {clientPayments.length} Transactions Recorded
                    </span>
                  </div>

                  {loadingPayments ? (
                    <div className="p-6">
                      <LoadingSkeleton type="card" count={2} />
                    </div>
                  ) : clientPayments.length === 0 ? (
                    <div className="text-center py-10 px-4 text-xs text-gray-500">
                      No payment transactions recorded for this client yet. Use "Record Payment" to submit payment vouchers.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="py-3 px-4">Payment ID</th>
                            <th className="py-3 px-4">Payment Date</th>
                            <th className="py-3 px-4">Milestone</th>
                            <th className="py-3 px-4">Amount Paid</th>
                            <th className="py-3 px-4">Method & Reference</th>
                            <th className="py-3 px-4">GST Treatment</th>
                            <th className="py-3 px-4">Total Transaction</th>
                            <th className="py-3 px-4">Recorded By</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {clientPayments.map((p) => (
                            <tr key={p._id || p.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-blue-700">
                                {p.paymentId || p._id?.slice(-8)}
                              </td>
                              <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                                {formatDate(p.paymentDate)}
                              </td>
                              <td className="py-3 px-4 font-medium text-gray-900">
                                {p.milestoneName || "General Milestone"}
                              </td>
                              <td className="py-3 px-4 font-bold text-gray-900">
                                ₹{Number(p.amountPaid || 0).toLocaleString("en-IN")}
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-gray-900 font-medium">{p.paymentMethod}</div>
                                {p.transactionReference && (
                                  <div className="text-[11px] font-mono text-gray-500">Ref: {p.transactionReference}</div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                <div>{p.gstTreatment || "Not Applicable"}</div>
                                {p.gstAmount > 0 && (
                                  <div className="text-[11px] text-gray-500">GST: ₹{Number(p.gstAmount).toLocaleString("en-IN")}</div>
                                )}
                              </td>
                              <td className="py-3 px-4 font-bold text-emerald-700">
                                ₹{Number(p.totalTransactionAmount || p.amountPaid || 0).toLocaleString("en-IN")}
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {p.recordedByName || "Finance Admin"}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  p.paymentStatus === "Completed"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : p.paymentStatus === "Reversed"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}>
                                  {p.paymentStatus || "Completed"}
                                </span>
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
      )}

      {/* TAB 3: MANPOWER REQUIREMENTS TAB */}
      {activeTab === "manpower" && (
        <div className="space-y-6">
          {(client.projects || []).map((proj) => {
            const positions = proj.manpowerRequirements || [];
            const projTotal = calculateProjectManpower(proj);

            return (
              <div
                key={proj.id}
                className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden"
              >
                <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/clients/${client.id}/projects/${proj.id}`}
                        className="text-sm font-bold text-gray-900 hover:text-blue-600"
                      >
                        {proj.projectName}
                      </Link>
                      <StatusBadge status={proj.status} size="sm" />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {proj.location} • {proj.country}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Project Headcount:
                    </span>
                    <span className="text-sm font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-lg">
                      {projTotal} Persons
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {positions.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">
                      No trade requirements defined under this project yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                            <th className="py-2.5 px-3">Position</th>
                            <th className="py-2.5 px-3 text-center">Quantity</th>
                            <th className="py-2.5 px-3">Experience</th>
                            <th className="py-2.5 px-3">Qualification</th>
                            <th className="py-2.5 px-3 text-center">Age Range</th>
                            <th className="py-2.5 px-3 text-right">Salary</th>
                            <th className="py-2.5 px-3">Working Hours</th>
                            <th className="py-2.5 px-3">Overtime</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {positions.map((pos) => (
                            <tr key={pos.id} className="hover:bg-blue-50/20">
                              <td className="py-2.5 px-3 font-semibold text-gray-900">
                                {pos.position}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-flex items-center justify-center min-w-6 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
                                  {pos.quantity}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-gray-600 font-medium">
                                {pos.experience || "—"}
                              </td>
                              <td className="py-2.5 px-3 text-gray-600">
                                {pos.qualification || "—"}
                              </td>
                              <td className="py-2.5 px-3 text-center text-gray-600">
                                {pos.minAge && pos.maxAge ? `${pos.minAge}-${pos.maxAge} Yrs` : "—"}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                                {pos.salary ? `${pos.currency || "AED"} ${pos.salary.toLocaleString()}` : "Negotiable"}
                              </td>
                              <td className="py-2.5 px-3 text-gray-600 text-[11px]">
                                {pos.workingHours || "8 hrs/day"}
                              </td>
                              <td className="py-2.5 px-3 text-gray-600 text-[11px]">
                                {pos.overtime || "Available"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: CONTACTS TAB */}
      {activeTab === "contacts" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(client.contacts || []).map((contact, idx) => (
            <div
              key={contact.id || idx}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center border border-blue-100">
                    {contact.name?.charAt(0).toUpperCase() || "C"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{contact.name}</h4>
                      {contact.isPrimary && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                          Primary Contact
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {contact.designation || "Representative"} • {contact.department || "Operations"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Email:</span>
                  <a
                    href={`mailto:${contact.email}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {contact.email}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Phone:</span>
                  <span className="font-semibold text-gray-800">{contact.phone}</span>
                </div>
                {contact.whatsapp && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">WhatsApp:</span>
                    <span className="font-semibold text-emerald-700">{contact.whatsapp}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: DOCUMENTS TAB */}
      {activeTab === "documents" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Compliance & Client Documents</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Verified legal trade licenses, demand letters, quota approvals, and embassy powers of attorney with specific custom names.
            </p>
          </div>

          <DocumentsList
            documents={client.documents || []}
            onChange={handleDocumentsChange}
            onDownload={handleDownloadDoc}
          />
        </div>
      )}

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        onSave={handleAddProject}
        client={client}
        clientCountry={client.country}
      />

      {/* Delete Client Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteClient}
        title="Delete Client Organization"
        message="Are you sure you want to delete this overseas client? All projects, manpower orders, and contact listings under this client will be permanently deleted."
        itemName={client ? `${client.companyName} (${client.id})` : ""}
        loading={isDeleting}
        confirmText="Delete Client"
      />

      {/* Record Client Payment Modal */}
      <RecordClientPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setSelectedMilestone(null);
        }}
        onSuccess={() => {
          showToast("Payment recorded successfully!", "success");
          loadClient();
          loadClientPayments();
        }}
        initialClientId={client.id}
        initialMilestoneId={selectedMilestone?.id || ""}
      />
    </div>
  );
}

export default ClientDetails;
