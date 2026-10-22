import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FolderKanban,
  CheckCircle2,
  Layers,
  Users,
} from "lucide-react";
import StatCard from "../../components/crm/ui/StatCard.jsx";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal.jsx";
import { useCrmToast } from "../../components/crm/layout/CrmLayout.jsx";
import crmClientService from "../../services/crmClientService.js";
import ProjectsFilterBar from "../../components/crm/projects/ProjectsFilterBar.jsx";
import ProjectsTableView from "../../components/crm/projects/ProjectsTableView.jsx";

export function Projects() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useCrmToast();

  const urlStatus = searchParams.get("status") || "All";
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [countryFilter, setCountryFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");

  const [deleteTargetProject, setDeleteTargetProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(false);

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

  const handleToggleStatus = async (e, clientId, projectId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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
    navigate(`/client/clients/${proj.clientId}/projects/${proj.id}/edit`);
  };

  const handleDeleteProject = async () => {
    if (!deleteTargetProject) return;
    setDeletingProject(true);
    try {
      await crmClientService.deleteProject(
        deleteTargetProject.clientId,
        deleteTargetProject.id
      );
      showToast("Project deleted successfully.", "success");
      setDeleteTargetProject(null);
      fetchProjects();
    } catch (err) {
      console.error("Failed to delete project:", err);
      showToast(err.message || "Failed to delete project.", "error");
    } finally {
      setDeletingProject(false);
    }
  };

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "Active").length;
  const inactiveProjects = projects.filter((p) => p.status === "Inactive").length;
  const totalManpower = projects.reduce(
    (sum, p) => sum + (Number(p.totalManpower) || 0),
    0
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
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

      <ProjectsFilterBar
        search={search}
        setSearch={setSearch}
        clientFilter={clientFilter}
        setClientFilter={setClientFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        countryFilter={countryFilter}
        setCountryFilter={setCountryFilter}
        clients={clients}
      />

      <ProjectsTableView
        projects={projects}
        loading={loading}
        search={search}
        statusFilter={statusFilter}
        clientFilter={clientFilter}
        onToggleStatus={handleToggleStatus}
        onEditProject={handleEditProject}
        onDeleteProject={(proj) => setDeleteTargetProject(proj)}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTargetProject)}
        onClose={() => setDeleteTargetProject(null)}
        onConfirm={handleDeleteProject}
        title="Delete Project & Allocation"
        message="Are you sure you want to delete this overseas project? This will permanently remove the trade requirements and allocations from the client directory."
        itemName={deleteTargetProject ? `${deleteTargetProject.projectName} (${deleteTargetProject.id})` : ""}
        loading={deletingProject}
        confirmText="Delete Project"
      />
    </div>
  );
}

export default Projects;
