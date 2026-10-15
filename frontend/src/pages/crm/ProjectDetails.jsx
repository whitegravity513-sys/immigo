import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LoadingSkeleton from "../../components/crm/ui/LoadingSkeleton.jsx";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal.jsx";
import { useCrmToast } from "../../components/crm/layout/CrmLayout.jsx";
import crmClientService, {
  calculateProjectManpower,
} from "../../services/crmClientService.js";
import {
  ProjectDetailHeader,
  ProjectInfoCard,
  ProjectManpowerSection,
  ProjectFacilitiesSection,
} from "../../components/crm/projects/detail/index.js";

export function ProjectDetails() {
  const { clientId, projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useCrmToast();

  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadProject();
  }, [clientId, projectId]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const data = await crmClientService.getProjectById(clientId, projectId);
      if (!data) {
        showToast("Project not found", "error");
        navigate("/client/projects");
        return;
      }
      setProject(data);
      setClient(data.client);
    } catch (err) {
      console.error("Error loading project:", err);
      showToast("Failed to load project details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleManpowerChange = async (updatedPositions) => {
    try {
      const updated = await crmClientService.updateProjectManpower(
        clientId,
        projectId,
        updatedPositions
      );
      setProject(updated);
      showToast("Workforce requirements saved successfully.", "success");
    } catch (err) {
      showToast("Failed to update manpower requirements", "error");
    }
  };

  const handleToggleStatus = async () => {
    try {
      const updated = await crmClientService.toggleProjectStatus(clientId, projectId);
      setProject(updated);
      showToast(`Project marked as ${updated.status}.`, "success");
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      await crmClientService.deleteProject(clientId, projectId);
      showToast("Project deleted successfully.", "success");
      setDeleteModalOpen(false);
      navigate(`/client/clients/${clientId}`);
    } catch (err) {
      showToast(err.message || "Failed to delete project", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  if (!project) return null;

  const totalRequired = calculateProjectManpower(project);

  return (
    <div className="space-y-6">
      <ProjectDetailHeader
        project={project}
        client={client}
        clientId={clientId}
        totalRequired={totalRequired}
        handleToggleStatus={handleToggleStatus}
        setDeleteModalOpen={setDeleteModalOpen}
      />

      <ProjectInfoCard
        project={project}
        client={client}
        totalRequired={totalRequired}
      />

      <ProjectManpowerSection
        project={project}
        totalRequired={totalRequired}
        handleManpowerChange={handleManpowerChange}
      />

      <ProjectFacilitiesSection project={project} />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project & Allocations"
        message="Are you sure you want to permanently delete this overseas project? All associated manpower trade requirements will be erased."
        itemName={project ? `${project.projectName} (${project.id})` : ""}
        loading={isDeleting}
        confirmText="Delete Project"
      />
    </div>
  );
}

export default ProjectDetails;
