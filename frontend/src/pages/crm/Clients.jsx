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

  // Direct add project modal state
  const [addProjectTargetClient, setAddProjectTargetClient] = useState(null);

  const [clients, setClients] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters state
  const searchQuery = searchParams.get("search") || "";
  const countryFilter = searchParams.get("country") || "All";
  const statusFilter = searchParams.get("status") || "All";
  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  // Active action menu client id
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
      const created = await crmClientService.addProject(
        addProjectTargetClient.id,
        projectData
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Client Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage client companies, projects, and manpower requirements.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap self-start sm:self-auto">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <FolderPlus size={15} className="text-gray-500" />
            <span>All Projects</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 min-w-0 max-w-lg">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by company, email, contact, city, phone..."
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="w-36 sm:w-44">
              <select
                value={countryFilter}
                onChange={handleCountryChange}
                className="w-full text-xs rounded-lg border border-gray-300 py-2 px-3 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 cursor-pointer"
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
                className="w-full text-xs rounded-lg border border-gray-300 py-2 px-3 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 cursor-pointer"
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
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Clients Table Card */}
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
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 sm:px-6">Company</th>
                  <th className="py-3.5 px-4">Primary Contact</th>
                  <th className="py-3.5 px-4">Country</th>
                  <th className="py-3.5 px-4 text-center">Projects</th>
                  <th className="py-3.5 px-4 text-center">Manpower</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((client, idx) => {
                  const primaryContact =
                    client.contacts?.find((c) => c.isPrimary) || client.contacts?.[0];
                  const manpowerCount = calculateClientManpower(client);
                  const isMenuOpen = openMenuId === client.id;
                  const isNearBottom = idx >= clients.length - 2;

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-blue-50/30 transition-colors duration-100"
                    >
                      {/* Company Name & Type */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 font-bold text-xs flex items-center justify-center shrink-0">
                            {client.companyName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/client/clients/${client.id}`}
                              className="font-bold text-gray-900 hover:text-blue-600 text-xs block truncate max-w-[200px]"
                              title={client.companyName}
                            >
                              {client.companyName}
                            </Link>
                            <span className="text-[11px] text-gray-400 font-normal">
                              {client.companyType || "Enterprise"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Primary Contact */}
                      <td className="py-3.5 px-4">
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

                      {/* Country */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-700 font-medium text-[11px]">
                          <MapPin size={11} className="text-blue-500" />
                          <span>{client.country}</span>
                        </span>
                      </td>

                      {/* Projects Count */}
                      <td className="py-3.5 px-4 text-center font-bold text-gray-700">
                        <span className="inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                          {client.projects?.length || 0}
                        </span>
                      </td>

                      {/* Manpower Total */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                          {manpowerCount.toLocaleString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={client.status} size="sm" />
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-gray-500 font-medium">
                        {formatDate(client.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="relative inline-flex items-center gap-1.5">
                          <Link
                            to={`/client/clients/${client.id}`}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View Client Profile"
                          >
                            <Eye size={15} />
                          </Link>

                          <Link
                            to={`/client/clients/${client.id}/edit`}
                            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Client"
                          >
                            <Edit2 size={15} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteClientTarget(client)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Client Profile"
                          >
                            <Trash2 size={15} />
                          </button>

                          {/* 3-dot Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId(isMenuOpen ? null : client.id)
                              }
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {isMenuOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div
                                  className={`absolute right-0 ${
                                    isNearBottom
                                      ? "bottom-full mb-1"
                                      : "top-full mt-1"
                                  } w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 text-xs`}
                                >
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
                                  <Link
                                    to={`/clients/${client.id}`}
                                    onClick={() => setOpenMenuId(null)}
                                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <Eye size={14} className="text-gray-400" />
                                    <span>View Overview</span>
                                  </Link>
                                  <Link
                                    to={`/clients/${client.id}/edit`}
                                    onClick={() => setOpenMenuId(null)}
                                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <Edit2 size={14} className="text-gray-400" />
                                    <span>Edit Information</span>
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setDeleteClientTarget(client);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 text-left transition-colors cursor-pointer font-medium"
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete Client</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Delete Confirmation Dialog */}
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

      {/* Direct In-Place Add Project Modal */}
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
