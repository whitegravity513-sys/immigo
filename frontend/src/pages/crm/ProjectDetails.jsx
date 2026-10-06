import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FolderKanban,
  Building2,
  MapPin,
  Calendar,
  Clock,
  Users,
  Plus,
  ArrowLeft,
  Gift,
  FileText,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import StatusBadge from "../../components/crm/ui/StatusBadge.jsx";
import LoadingSkeleton from "../../components/crm/ui/LoadingSkeleton.jsx";
import ManpowerTable from "../../components/crm/manpower/ManpowerTable.jsx";
import { useCrmToast } from "../../components/crm/layout/CrmLayout.jsx";
import crmClientService, {
  calculateProjectManpower,
} from "../../services/crmClientService.js";

export function ProjectDetails() {
  const { clientId, projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useCrmToast();

  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

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
      const updated = {
        ...project,
        manpowerRequirements: updatedPositions,
      };
      await crmClientService.updateProject(
        client?.id || clientId || project.clientId,
        project.id,
        updated
      );
      setProject(updated);
      showToast("Manpower requirements updated.", "success");
    } catch (err) {
      showToast("Failed to update manpower positions", "error");
    }
  };

  const handleToggleStatus = async () => {
    try {
      const updated = await crmClientService.toggleProjectStatus(
        client?.id || clientId || project.clientId,
        project.id
      );
      setProject((prev) => ({ ...prev, status: updated.status }));
      showToast(`Project status changed to ${updated.status}.`, "success");
    } catch (err) {
      showToast("Failed to change project status", "error");
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
      {/* Back button */}
      <div>
        <Link
          to="/client/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to All Projects</span>
        </Link>
      </div>

      {/* Project Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <FolderKanban size={24} />
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                  {project.projectName}
                </h1>
                <StatusBadge status={project.status} />
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
                  title={`Switch status to ${project.status === "Active" ? "Inactive" : "Active"}`}
                >
                  Mark as {project.status === "Active" ? "Inactive" : "Active"}
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium text-gray-700 bg-gray-100/80 px-2.5 py-1 rounded-md">
                  <Building2 size={13} className="text-blue-600" />
                  <span>Company:</span>
                  <strong className="text-gray-900 font-bold">
                    {client?.companyName || project.clientName || "Authorized Client"}
                  </strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-gray-700">
                  <MapPin size={13} className="text-blue-500" />
                  {project.location || project.country}, {project.country}
                </span>
                <span>•</span>
                <span>Type: <strong className="text-gray-700">{project.projectType || "General"}</strong></span>
              </div>
            </div>
          </div>

          {/* Total Manpower Pill */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex items-center gap-3.5 self-start md:self-auto">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Users size={18} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                Total Required Headcount
              </span>
              <span className="text-xl font-extrabold text-blue-700 leading-tight">
                {totalRequired.toLocaleString()} Persons
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Overview Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
          Project Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-400 block text-[11px]">Client Company</span>
            <span className="font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
              <Building2 size={13} className="text-blue-600 shrink-0" />
              <span>{client?.companyName || project.clientName || "—"}</span>
            </span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">Project Name</span>
            <span className="font-semibold text-gray-900">{project.projectName}</span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">Project Type</span>
            <span className="font-semibold text-gray-900">{project.projectType || "—"}</span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">Country</span>
            <span className="font-semibold text-gray-900">{project.country}</span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">Location / Site</span>
            <span className="font-semibold text-gray-900">{project.location || "—"}</span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">Start Date</span>
            <span className="font-semibold text-gray-900">{project.startDate || "—"}</span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">Expected Duration</span>
            <span className="font-semibold text-gray-900">{project.duration || "—"}</span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px]">Required Headcount</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mt-0.5">
              {totalRequired} Persons
            </span>
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <span className="text-gray-400 block text-[11px]">Description</span>
            <span className="text-gray-700 leading-relaxed">
              {project.description || "No description provided."}
            </span>
          </div>
        </div>
      </div>

      {/* CORE FEATURE: MANPOWER REQUIREMENT */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              <span>Manpower Requirement & Headcount</span>
            </h2>
            <p className="text-xs text-gray-500">
              Total workforce requirement and allocation details for this project.
            </p>
          </div>
          <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
            {totalRequired} Total Headcount
          </span>
        </div>

        {/* Headcount Summary Box */}
        <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/40 rounded-xl border border-blue-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              <Users size={22} />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
                Required Workforce Size
              </span>
              <span className="text-2xl font-black text-blue-800 leading-none">
                {totalRequired} Persons
              </span>
              {project.workforceNotes && (
                <p className="text-xs text-blue-950 font-medium mt-1">
                  Category: {project.workforceNotes}
                </p>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right sm:border-l sm:border-blue-200 sm:pl-6 text-xs text-gray-600 space-y-1">
            <div>
              <span className="text-gray-400">Project Duration: </span>
              <strong className="text-gray-900">{project.duration || "24 Months"}</strong>
            </div>
            <div>
              <span className="text-gray-400">Deployment Country: </span>
              <strong className="text-gray-900">{project.country}</strong>
            </div>
          </div>
        </div>

        {/* If multiple detailed trades exist, render ManpowerTable */}
        {Array.isArray(project.manpowerRequirements) &&
          project.manpowerRequirements.length > 1 && (
            <ManpowerTable
              positions={project.manpowerRequirements}
              onChange={handleManpowerChange}
              currencyDefault={
                project.country === "Saudi Arabia"
                  ? "SAR"
                  : project.country === "Qatar"
                  ? "QAR"
                  : project.country === "Oman"
                  ? "OMR"
                  : project.country === "Kuwait"
                  ? "KWD"
                  : project.country === "Bahrain"
                  ? "BHD"
                  : project.country === "Germany"
                  ? "EUR"
                  : project.country === "United Kingdom"
                  ? "GBP"
                  : "AED"
              }
            />
          )}
      </div>

      {/* Facilities & Additional Requirements Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Benefits & Facilities */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Gift size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">
              Employee Benefits & Facilities
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {(project.benefits || []).map((benefit) => (
              <span
                key={benefit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
              >
                <CheckCircle size={13} className="text-emerald-600" />
                <span>{benefit}</span>
              </span>
            ))}
          </div>

          {project.otherBenefits && (
            <div className="pt-3 border-t border-gray-100 text-xs">
              <span className="text-gray-400 block text-[11px] font-semibold uppercase tracking-wider">
                Other Benefits / Allowances:
              </span>
              <p className="text-gray-700 mt-1">{project.otherBenefits}</p>
            </div>
          )}
        </div>

        {/* Additional Requirements */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <FileText size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">
              Additional Requirements & Guidelines
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {project.additionalRequirements?.requiredDocuments && (
              <div>
                <span className="text-gray-400 block text-[11px]">Required Documents:</span>
                <p className="text-gray-800 font-medium mt-0.5">
                  {project.additionalRequirements.requiredDocuments}
                </p>
              </div>
            )}

            {project.additionalRequirements?.specialSkills && (
              <div>
                <span className="text-gray-400 block text-[11px]">Special Skills:</span>
                <p className="text-gray-800 font-medium mt-0.5">
                  {project.additionalRequirements.specialSkills}
                </p>
              </div>
            )}

            {project.additionalRequirements?.languageRequirements && (
              <div>
                <span className="text-gray-400 block text-[11px]">Language Requirements:</span>
                <p className="text-gray-800 font-medium mt-0.5">
                  {project.additionalRequirements.languageRequirements}
                </p>
              </div>
            )}

            {project.additionalRequirements?.medicalRequirements && (
              <div>
                <span className="text-gray-400 block text-[11px]">Medical Requirements:</span>
                <p className="text-gray-800 font-medium mt-0.5">
                  {project.additionalRequirements.medicalRequirements}
                </p>
              </div>
            )}

            {project.additionalRequirements?.otherInstructions && (
              <div>
                <span className="text-gray-400 block text-[11px]">Other Instructions:</span>
                <p className="text-gray-800 font-medium mt-0.5">
                  {project.additionalRequirements.otherInstructions}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetails;
