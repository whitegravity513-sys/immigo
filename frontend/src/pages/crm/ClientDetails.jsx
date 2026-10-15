import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Building2,
  FolderKanban,
  Users,
  User,
  CreditCard,
  FileText,
} from "lucide-react";
import LoadingSkeleton from "../../components/crm/ui/LoadingSkeleton.jsx";
import AddProjectModal from "../../components/crm/projects/AddProjectModal.jsx";
import DocumentsList from "../../components/crm/documents/DocumentsList.jsx";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal.jsx";
import { RecordClientPaymentModal } from "../../components/crm/payments/RecordClientPaymentModal.jsx";
import { useCrmToast } from "../../components/crm/layout/CrmLayout.jsx";
import crmClientService from "../../services/crmClientService.js";
import {
  ClientDetailHeader,
  ClientOverviewTab,
  ClientProjectsTab,
  ClientMilestonesTab,
  ClientManpowerTab,
  ClientContactsTab,
} from "../../components/crm/clients/detail/index.js";

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      <ClientDetailHeader
        client={client}
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setDeleteModalOpen={setDeleteModalOpen}
      />

      {activeTab === "overview" && (
        <ClientOverviewTab client={client} formatDate={formatDate} />
      )}

      {activeTab === "projects" && (
        <ClientProjectsTab
          client={client}
          handleToggleProjectStatus={handleToggleProjectStatus}
        />
      )}

      {activeTab === "milestones" && (
        <ClientMilestonesTab
          client={client}
          clientPayments={clientPayments}
          loadingPayments={loadingPayments}
          formatDate={formatDate}
          setSelectedMilestone={setSelectedMilestone}
          setIsRecordPaymentOpen={setIsRecordPaymentOpen}
        />
      )}

      {activeTab === "manpower" && <ClientManpowerTab client={client} />}

      {activeTab === "contacts" && <ClientContactsTab client={client} />}

      {activeTab === "documents" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Compliance & Client Documents
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Verified legal trade licenses, demand letters, quota approvals, and embassy powers of attorney.
            </p>
          </div>

          <DocumentsList
            documents={client.documents || []}
            onChange={handleDocumentsChange}
            onDownload={handleDownloadDoc}
          />
        </div>
      )}

      <AddProjectModal
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        onSave={handleAddProject}
        client={client}
        clientCountry={client.country}
      />

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
