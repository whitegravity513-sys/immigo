import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ClientForm from "../../components/crm/clients/ClientForm.jsx";
import LoadingSkeleton from "../../components/crm/ui/LoadingSkeleton.jsx";
import { useCrmToast } from "../../components/crm/layout/crmToastContext.js";
import crmClientService from "../../services/crmClientService.js";

export function EditClient() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useCrmToast();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadClient = useCallback(async () => {
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
  }, [clientId, navigate, showToast]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) loadClient();
    });
    return () => {
      cancelled = true;
    };
  }, [loadClient]);

  const handleUpdate = async (formData) => {
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
