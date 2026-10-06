import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ClientForm from "../../components/crm/clients/ClientForm.jsx";
import LoadingSkeleton from "../../components/crm/ui/LoadingSkeleton.jsx";
import { useCrmToast } from "../../components/crm/layout/CrmLayout.jsx";
import crmClientService from "../../services/crmClientService.js";

export function EditClient() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useCrmToast();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const loadClient = async () => {
    setLoading(true);
    try {
      const data = await crmClientService.getClientById(clientId);
      if (!data) {
        showToast("Client not found.", "error");
        navigate("/clients");
        return;
      }
      setClient(data);
    } catch (err) {
      console.error("Error loading client:", err);
      showToast("Failed to load client details.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (formData, asDraft) => {
    setSaving(true);
    try {
      await crmClientService.updateClient(clientId, formData);
      showToast("Client profile updated successfully.", "success");
      navigate(`/client/clients/${clientId}`);
    } catch (err) {
      console.error("Error updating client:", err);
      showToast(err.message || "Failed to update client", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  if (!client) return null;

  return (
    <ClientForm
      initialData={client}
      isEdit={true}
      onSubmit={handleUpdate}
      loading={saving}
    />
  );
}

export default EditClient;
