import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectForm from "../../components/crm/projects/ProjectForm.jsx";
import { useCrmToast } from "../../components/crm/layout/CrmLayout.jsx";
import crmClientService from "../../services/crmClientService.js";

export function AddProject() {
  const navigate = useNavigate();
  const { showToast } = useCrmToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (projectData, clientId, asDraft) => {
    setSaving(true);
    try {
      const created = await crmClientService.addProject(clientId, projectData);
      showToast("Project requirement created successfully.", "success");
      navigate("/client/projects");
    } catch (err) {
      console.error("Error creating project:", err);
      showToast(err.message || "Failed to create project", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProjectForm
      isEdit={false}
      onSubmit={handleSubmit}
      loading={saving}
    />
  );
}

export default AddProject;
