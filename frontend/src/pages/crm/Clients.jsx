import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  Filter,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  FolderPlus,
  MapPin,
  Mail,
  Phone,
  RotateCcw,
  Users,
} from "lucide-react";
import StatusBadge from "../../components/crm/ui/StatusBadge.jsx";
import SearchInput from "../../components/crm/ui/SearchInput.jsx";
import SelectField from "../../components/crm/ui/SelectField.jsx";
import Pagination from "../../components/crm/ui/Pagination.jsx";
import EmptyState from "../../components/crm/ui/EmptyState.jsx";
import LoadingSkeleton from "../../components/crm/ui/LoadingSkeleton.jsx";
import ConfirmDialog from "../../components/crm/ui/ConfirmDialog.jsx";
import AddProjectModal from "../../components/crm/projects/AddProjectModal.jsx";
import { useCrmToast } from "../../components/crm/layout/CrmLayout.jsx";
import crmClientService, {
  calculateClientManpower,
} from "../../services/crmClientService.js";

import { ALL_COUNTRIES } from "../../constants/countries.js";

const COUNTRIES = ["All", ...ALL_COUNTRIES];

const STATUS_OPTIONS = [
  { value: "All", label: "All Statuses" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "On Hold", label: "On Hold" },
];

export function Clients() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useCrmToast();

  
  const [addProjectTargetClient, setAddProjectTargetClient] = useState(null);

  const [clients, setClients] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  
  const searchQuery = searchParams.get("search") || "";
  const countryFilter = searchParams.get("country") || "All";
  const statusFilter = searchParams.get("status") || "All";
  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteClientTarget, setDeleteClientTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [searchQuery, countryFilter, statusFilter, currentPage]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await crmClientService.getClients({
        search: searchQuery,
        country: countryFilter,
        status: statusFilter,
        page: currentPage,
        limit: pageSize,
      });
      setClients(res.clients);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Error fetching clients:", err);
      showToast("Failed to load clients list", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set("search", val);
    } else {
      newParams.delete("search");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleCountryChange = (e) => {
    const val = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (val && val !== "All") {
      newParams.set("country", val);
    } else {
      newParams.delete("country");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleStatusChange = (e) => {
    const val = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (val && val !== "All") {
      newParams.set("status", val);
    } else {
      newParams.delete("status");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(newPage));
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchParams({});
  };

  const handleDeleteClient = async () => {
    if (!deleteClientTarget) return;
    setDeleting(true);
    try {
      await crmClientService.deleteClient(deleteClientTarget.id);
      showToast(`Client "${deleteClientTarget.companyName}" deleted successfully.`);
      setDeleteClientTarget(null);
      fetchClients();
    } catch (err) {
      showToast("Failed to delete client.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveProjectFromModal = async (projectData) => {
    if (!addProjectTargetClient) return;
    try {
      const targetClientId =
        addProjectTargetClient.id ||
        addProjectTargetClient.clientId ||
        addProjectTargetClient._id;
      const created = await crmClientService.addProject(
        targetClientId,
        {
          ...projectData,
          clientName: addProjectTargetClient.companyName || addProjectTargetClient.name,
        }
      );
      showToast(
        `Project "${created.projectName}" added to ${addProjectTargetClient.companyName}!`,
        "success"
      );
      setAddProjectTargetClient(null);
      fetchClients();
    } catch (err) {
      console.error("Error adding project:", err);
      showToast(err.message || "Failed to add project", "error");
    }
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

  const hasActiveFilters =
    Boolean(searchQuery) || countryFilter !== "All" || statusFilter !== "All";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
            Client Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage client companies, projects, and manpower requirements.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            <FolderPlus size={14} className="text-gray-500" />
            <span>All Projects</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-2.5 shadow-2xs space-y-2.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          <div className="flex-1 min-w-0 max-w-lg">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by company, email, contact, city, phone..."
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="w-36 sm:w-40">
              <select
                value={countryFilter}
                onChange={handleCountryChange}
                className="w-full text-xs rounded-md border border-gray-300 py-1.5 px-2.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-600/20 focus:border-blue-600 cursor-pointer"
              >
                <option value="All">All Countries</option>
                {COUNTRIES.filter((c) => c !== "All").map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-32 sm:w-36">
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="w-full text-xs rounded-md border border-gray-300 py-1.5 px-2.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-600/20 focus:border-blue-600 cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw size={12} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton type="table" count={6} />
          </div>
        ) : clients.length === 0 ? (
          <EmptyState
            title="No Clients Found"
            description={
              hasActiveFilters
                ? "No clients match your filter criteria. Try adjusting your search query or filters."
                : "You haven't created any client companies yet. Start by onboarding your first foreign client."
            }
            actionText={hasActiveFilters ? "Reset Filters" : "Add New Client"}
            onAction={hasActiveFilters ? handleResetFilters : () => navigate("/clients/new")}
          />
        ) : (
          <div className="overflow-x-auto min-h-[360px] pb-16">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-3">Company</th>
                  <th className="py-2 px-3">Primary Contact</th>
                  <th className="py-2 px-3">Country</th>
                  <th className="py-2 px-3 text-center">Projects</th>
                  <th className="py-2 px-3 text-center">Manpower</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Created</th>
                  <th className="py-2 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((client, idx) => {
                  const primaryContact =
                    client.contacts?.find((c) => c.isPrimary) || client.contacts?.[0];
                  const manpowerCount = calculateClientManpower(client);
                  const isMenuOpen = openMenuId === client.id;
                  const isNearBottom = clients.length > 4 && idx >= clients.length - 2;

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-blue-50/30 transition-colors duration-100"
                    >
                      {}
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 border border-blue-100 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {client.companyName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/client/clients/${client.id}`}
                              className="font-bold text-gray-900 hover:text-blue-600 text-xs block truncate max-w-[180px] leading-tight"
                              title={client.companyName}
                            >
                              {client.companyName}
                            </Link>
                            <span className="text-[10px] text-gray-400 font-normal leading-none">
                              {client.companyType || "Enterprise"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {}
                      <td className="py-1.5 px-3">
                        {primaryContact ? (
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 text-xs truncate max-w-[160px]">
                              {primaryContact.name}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate max-w-[160px]">
                              {primaryContact.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </td>

                      {}
                      <td className="py-1.5 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-700 font-medium text-[11px]">
                          <MapPin size={11} className="text-blue-500" />
                          <span>{client.country}</span>
                        </span>
                      </td>

                      {}
                      <td className="py-1.5 px-3 text-center font-bold text-gray-700">
                        <span className="inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                          {client.projects?.length || 0}
                        </span>
                      </td>

                      {}
                      <td className="py-1.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                          {manpowerCount.toLocaleString()}
                        </span>
                      </td>

                      {}
                      <td className="py-1.5 px-3">
                        <StatusBadge status={client.status} size="sm" />
                      </td>

                      {}
                      <td className="py-1.5 px-3 text-gray-500 font-medium">
                        {formatDate(client.createdAt)}
                      </td>

                      {}
                      <td className="py-1.5 px-3 text-center">
                        <div className="relative inline-flex items-center justify-center">
                          <button type="button" onClick={() => setOpenMenuId(isMenuOpen ? null : client.id)} className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              isMenuOpen
                                ? "bg-blue-100 text-blue-700 font-bold shadow-xs"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                            title="Actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {isMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div
                                className={`absolute right-0 ${
                                  isNearBottom
                                    ? "bottom-full mb-1.5"
                                    : "top-full mt-1.5"
                                } w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 z-50 text-xs text-left divide-y divide-gray-100`}
                              >
                                <div className="py-1">
                                  <Link
                                    to={`/client/clients/${client.id}`}
                                    onClick={() => setOpenMenuId(null)}
                                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                                  >
                                    <Eye size={14} className="text-gray-400" />
                                    <span>View Overview</span>
                                  </Link>
                                  <Link
                                    to={`/client/clients/${client.id}/edit`}
                                    onClick={() => setOpenMenuId(null)}
                                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                                  >
                                    <Edit2 size={14} className="text-gray-400" />
                                    <span>Edit Information</span>
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      navigate(`/client/projects/new`, { state: { clientId: client.id } });
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-blue-700 hover:bg-blue-50 text-left transition-colors cursor-pointer font-semibold"
                                  >
                                    <FolderPlus size={14} />
                                    <span>Direct Add Project</span>
                                  </button>
                                </div>
                                <div className="py-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setDeleteClientTarget(client);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 text-left transition-colors cursor-pointer font-semibold"
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete Client</span>
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      </div>

      {}
      <ConfirmDialog
        isOpen={deleteClientTarget !== null}
        onClose={() => setDeleteClientTarget(null)}
        onConfirm={handleDeleteClient}
        title="Delete Client Profile"
        message={`Are you sure you want to delete "${deleteClientTarget?.companyName}"? This will permanently remove all associated projects and manpower requirements.`}
        confirmText="Delete Client"
        loading={deleting}
        variant="danger"
      />

      {}
      <AddProjectModal
        isOpen={Boolean(addProjectTargetClient)}
        onClose={() => setAddProjectTargetClient(null)}
        onSave={handleSaveProjectFromModal}
        client={addProjectTargetClient}
        clientCountry={addProjectTargetClient?.country}
      />
    </div>
  );
}

export default Clients;
