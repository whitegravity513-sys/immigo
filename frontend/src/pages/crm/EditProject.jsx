import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProjectForm from "../../components/crm/projects/ProjectForm.jsx";
import { useCrmToast } from "../../components/crm/layout/CrmLayout.jsx";
import crmClientService from "../../services/crmClientService.js";

export function EditProject() {
  const navigate = useNavigate();
  const { clientId, projectId } = useParams();
  const { showToast } = useCrmToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await crmClientService.getProjectById(clientId, projectId);
        if (!data) throw new Error("Project not found");
        setProject(data);
      } catch (err) {
        showToast(err.message || "Failed to load project", "error");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [clientId, projectId, navigate, showToast]);

  const handleSubmit = async (projectData, submitClientId, asDraft) => {
    setSaving(true);
    try {
      await crmClientService.updateProject(clientId, projectId, projectData);
      showToast("Project details updated successfully.", "success");
      navigate(`/client/clients/${clientId}/projects/${projectId}`);
    } catch (err) {
      console.error("Error updating project:", err);
      showToast(err.message || "Failed to update project", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading project...</div>;
  if (!project) return <div className="p-8 text-center text-red-500">Project not found</div>;

  return (
    <ProjectForm
      isEdit={true}
      initialData={project}
      onSubmit={handleSubmit}
      loading={saving}
    />
  );
}

export default EditProject;
