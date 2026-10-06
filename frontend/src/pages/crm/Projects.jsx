import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Building2,
  MapPin,
  Users,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Edit3,
} from "lucide-react";
import StatCard from "../../components/crm/ui/StatCard.jsx";
import StatusBadge from "../../components/crm/ui/StatusBadge.jsx";
import LoadingSkeleton from "../../components/crm/ui/LoadingSkeleton.jsx";
import { useCrmToast } from "../../components/crm/layout/CrmLayout.jsx";
import crmClientService from "../../services/crmClientService.js";
import { AddProjectModal } from "../../components/crm/projects/AddProjectModal.jsx";

export function Projects() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useCrmToast();

  const urlStatus = searchParams.get("status") || "All";
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [countryFilter, setCountryFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");

  // Edit Project Modal State
  const [editingProject, setEditingProject] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const s = searchParams.get("status");
    if (s && s !== statusFilter) {
      setStatusFilter(s);
    }
  }, [searchParams]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await crmClientService.getAllProjects({
        search,
        status: statusFilter,
        country: countryFilter,
        clientId: clientFilter,
      });
      setProjects(res.projects || []);

      // Also get clients for filter dropdown
      const clientRes = await crmClientService.getClients({ limit: 100 });
      setClients(clientRes.clients || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      showToast("Failed to load projects", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter, countryFilter, clientFilter]);

  const handleToggleStatus = async (e, clientId, projectId, currentStatus) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const updated = await crmClientService.toggleProjectStatus(clientId, projectId);
      showToast(
        `Project status changed to "${updated.status}"`,
        "success"
      );
      fetchProjects();
    } catch (err) {
      console.error("Failed to toggle status:", err);
      showToast(err.message || "Failed to update status", "error");
    }
  };

  const handleEditProject = (proj) => {
    setEditingProject(proj);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedProject = async (updatedData) => {
    try {
      await crmClientService.updateProject(editingProject.clientId, editingProject.id, updatedData);
      showToast("Project details updated successfully!", "success");
      setIsEditModalOpen(false);
      setEditingProject(null);
      fetchProjects();
    } catch (err) {
      alert(err.message || "Failed to update project");
    }
  };

  // Metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "Active").length;
  const inactiveProjects = projects.filter((p) => p.status === "Inactive").length;
  const totalManpower = projects.reduce(
    (sum, p) => sum + (Number(p.totalManpower) || 0),
    0
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto">

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          subtitle="Registered projects"
          icon={FolderKanban}
          color="blue"
        />
        <StatCard
          title="Active Sourcing"
          value={activeProjects}
          subtitle="Currently recruiting"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Inactive Projects"
          value={inactiveProjects}
          subtitle="Paused or closed"
          icon={Layers}
          color="gray"
        />
        <StatCard
          title="Total Manpower"
          value={`${totalManpower.toLocaleString()} Persons`}
          subtitle="Across all project trades"
          icon={Users}
          color="indigo"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search by Project ID or Name */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Project ID, Name, Client..."
              className="w-full text-xs rounded-lg border border-gray-300 pl-9 pr-3.5 py-2.5 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Client Filter */}
          <div>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 py-2.5 px-3 bg-white text-gray-700 cursor-pointer focus:border-blue-600 focus:outline-none"
            >
              <option value="All">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 py-2.5 px-3 bg-white text-gray-700 cursor-pointer focus:border-blue-600 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* Country Filter */}
          <div>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 py-2.5 px-3 bg-white text-gray-700 cursor-pointer focus:border-blue-600 focus:outline-none"
            >
              <option value="All">All Countries</option>
              <option value="UAE">UAE</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
              <option value="Qatar">Qatar</option>
              <option value="Oman">Oman</option>
              <option value="Kuwait">Kuwait</option>
              <option value="Bahrain">Bahrain</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Germany">Germany</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects List Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={4} />
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-3">
              <FolderKanban size={24} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No Projects Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== "All" || clientFilter !== "All"
                ? "Try clearing your filters or search keywords."
                : "No projects have been registered under clients yet."}
            </p>
            <div className="mt-4">
              <Link
                to="/client/projects/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
              >
                <Plus size={15} />
                <span>Add First Project</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Project ID</th>
                    <th className="py-3 px-4">Project Name & Type</th>
                    <th className="py-3 px-4">Client Company</th>
                    <th className="py-3 px-4">Country & Location</th>
                    <th className="py-3 px-4 text-center">Headcount</th>
                    <th className="py-3 px-4">Status & Toggle</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projects.map((proj) => (
                    <tr
                      key={proj.id}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      {/* Project ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        <Link
                          to={`/client/projects/${proj.id}`}
                          className="hover:underline bg-blue-50 px-2 py-0.5 rounded border border-blue-100"
                        >
                          {proj.id}
                        </Link>
                      </td>

                      {/* Project Name & Type */}
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/client/projects/${proj.id}`}
                          className="font-bold text-gray-900 hover:text-blue-600 block text-xs"
                        >
                          {proj.projectName}
                        </Link>
                        <span className="text-[11px] text-gray-400">
                          {proj.projectType || "General"} • {proj.duration || "24 Months"}
                        </span>
                      </td>

                      {/* Client Company */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                          <Building2 size={13} className="text-gray-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{proj.clientName}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          ID: {proj.clientId}
                        </span>
                      </td>

                      {/* Country & Location */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <MapPin size={13} className="text-blue-500 shrink-0" />
                          <span>{proj.country}</span>
                        </div>
                        {proj.location && (
                          <span className="text-[11px] text-gray-400 block truncate max-w-[150px]">
                            {proj.location}
                          </span>
                        )}
                      </td>

                      {/* Headcount */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-bold text-xs border border-blue-200">
                          {proj.totalManpower} Persons
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {proj.manpowerRequirements?.length || 0} Trades
                        </span>
                      </td>

                      {/* Status & Quick Toggle */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={proj.status} size="sm" />
                          <button
                            type="button"
                            onClick={(e) =>
                              handleToggleStatus(e, proj.clientId, proj.id, proj.status)
                            }
                            className="px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-gray-200 rounded transition-colors cursor-pointer"
                            title={`Click to set ${proj.status === "Active" ? "Inactive" : "Active"}`}
                          >
                            {proj.status === "Active" ? "Set Inactive" : "Set Active"}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditProject(proj)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                            title="Edit Project Details"
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>

                          <Link
                            to={`/client/projects/${proj.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            <span>View</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< 768px) */}
            <div className="md:hidden divide-y divide-gray-100">
              {projects.map((proj) => (
                <div key={proj.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {proj.id}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 mt-1">
                        {proj.projectName}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {proj.projectType} • {proj.duration || "24 Months"}
                      </p>
                    </div>
                    <StatusBadge status={proj.status} size="sm" />
                  </div>

                  <div className="bg-gray-50/80 rounded-lg p-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Client:</span>
                      <span className="font-bold text-gray-800 truncate max-w-[180px]">
                        {proj.clientName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Location:</span>
                      <span className="font-semibold text-gray-800">
                        {proj.location ? `${proj.location}, ` : ""}
                        {proj.country}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Manpower:</span>
                      <span className="font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded text-[11px]">
                        {proj.totalManpower} Persons ({proj.manpowerRequirements?.length || 0} Trades)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) =>
                          handleToggleStatus(e, proj.clientId, proj.id, proj.status)
                        }
                        className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors cursor-pointer"
                      >
                        {proj.status === "Active" ? "Set Inactive" : "Set Active"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditProject(proj)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                    </div>

                    <Link
                      to={`/client/projects/${proj.id}`}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
                    >
                      <span>View</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Project Modal */}
      {isEditModalOpen && (
        <AddProjectModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProject(null);
          }}
          onSave={handleSaveEditedProject}
          projectToEdit={editingProject}
        />
      )}
    </div>
  );
}

export default Projects;
