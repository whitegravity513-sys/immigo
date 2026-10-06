import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientForm from "../../components/crm/clients/ClientForm.jsx";
import { useCrmToast } from "../../components/crm/layout/CrmLayout.jsx";
import crmClientService from "../../services/crmClientService.js";

export function AddClient() {
  const navigate = useNavigate();
  const { showToast } = useCrmToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (formData, asDraft) => {
    setSaving(true);
    try {
      const created = await crmClientService.createClient(formData);
      showToast("Client created successfully.", "success");
      navigate(`/client/clients/${created.id}`);
    } catch (err) {
      console.error("Error creating client:", err);
      showToast(err.message || "Failed to create client", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClientForm
      isEdit={false}
      onSubmit={handleSubmit}
      loading={saving}
    />
  );
}

export default AddClient;
