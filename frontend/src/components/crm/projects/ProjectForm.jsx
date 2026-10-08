import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import {
  FolderKanban,
  Building2,
  MapPin,
  Users,
  Gift,
  FileText,
  FileCheck,
  Save,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Globe,
  CreditCard,
} from "lucide-react";
import FormSection from "../ui/FormSection.jsx";
import InputField from "../ui/InputField.jsx";
import SelectField from "../ui/SelectField.jsx";
import TextareaField from "../ui/TextareaField.jsx";
import CountrySelectField from "../ui/CountrySelectField.jsx";
import ManpowerTable from "../manpower/ManpowerTable.jsx";
import ProjectMilestoneBuilder from "./ProjectMilestoneBuilder.jsx";
import DocumentsList from "../documents/DocumentsList.jsx";
import { useCrmToast } from "../layout/CrmLayout.jsx";
import crmClientService from "../../../services/crmClientService.js";
import { crmVendorService } from "../../../services/crmVendorService.js";

const PROJECT_TYPES = [
  "Construction",
  "Infrastructure",
  "Hospitality",
  "Healthcare",
  "Manufacturing",
  "Oil & Gas",
  "Facility Management",
  "Logistics & Warehousing",
  "Other",
];

const STANDARD_BENEFITS = [
  "Accommodation",
  "Food",
  "Transportation",
  "Medical Insurance",
  "Air Ticket",
  "Visa",
  "Work Permit",
  "Overtime",
  "Other",
];

export function ProjectForm({
  initialData = null,
  isEdit = false,
  onSubmit,
  loading = false,
}) {
  const navigate = useNavigate();
  const { clientId: routeClientId } = useParams();
  const [searchParams] = useSearchParams();
  const preSelectedClientId = routeClientId || searchParams.get("clientId");
  const { showToast } = useCrmToast();

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);

  // Vendor assignment
  const [allVendors, setAllVendors] = useState([]);
  const [vendorSearchTerm, setVendorSearchTerm] = useState("");
  const [vendorCurrentPage, setVendorCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    clientId: preSelectedClientId || "",
    projectName: "",
    projectType: "Construction",
    country: "UAE",
    location: "",
    startDate: new Date().toISOString().split("T")[0],
    duration: "24 Months",
    status: "Active",
    description: "",
    benefits: [
      "Accommodation",
      "Transportation",
      "Medical Insurance",
      "Visa",
      "Work Permit",
      "Overtime",
    ],
    otherBenefits: "",
    additionalRequirements: {
      requiredDocuments: "Valid Passport, Trade Test Certificate, Police Clearance",
      specialSkills: "",
      languageRequirements: "English / Hindi",
      medicalRequirements: "GAMCA Medical Fit Certificate",
      otherInstructions: "",
    },
    totalHeadcount:
      initialData?.totalHeadcount ||
      (initialData?.manpowerRequirements?.reduce(
        (sum, p) => sum + (Number(p.quantity) || 0),
        0
      )) || 0,
    workforceNotes: initialData?.workforceNotes || "",
    documents: initialData?.documents || [],
    manpowerRequirements: initialData?.manpowerRequirements || [],

    // Vendor Assignment
    vendorVisibility: (initialData?.vendorAssignmentType === "Specific Vendor") ? "specific" : "all",
    assignedVendorIds: initialData?.assignedVendors || [],

    // Default Milestones / Workflow
    paymentMilestones: initialData?.paymentMilestones || [
      {
        id: `m${Date.now()}-1`,
        name: "Candidate Selection & Documentation",
        paymentAmount: "50000",
        stages: [
          { id: `s${Date.now()}-1`, name: "Candidate Selection" },
          { id: `s${Date.now()}-2`, name: "Document Verification" },
          { id: `s${Date.now()}-3`, name: "Medical Check" },
        ]
      }
    ]
  });

  const [errors, setErrors] = useState({});

  // Compute headcount automatically from positions
  useEffect(() => {
    const total = formData.manpowerRequirements.reduce(
      (sum, p) => sum + (Number(p.quantity) || 0),
      0
    );
    setFormData((prev) => ({ ...prev, totalHeadcount: total }));
  }, [formData.manpowerRequirements]);

  // Fetch vendors for assignment dropdown
  useEffect(() => {
    crmVendorService.getVendors({ status: "Approved" }).then((vendors) => {
      setAllVendors(vendors || []);
    }).catch(() => { });
  }, []);

  // Fetch all existing clients for selection
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await crmClientService.getClients({ limit: 100 });
        const list = res.clients || [];
        setClients(list);

        const targetClientId = formData.clientId || preSelectedClientId;
        if (targetClientId) {
          const found = list.find((c) => String(c.id) === String(targetClientId));
          if (found) {
            setSelectedClient(found);
            setFormData((prev) => ({
              ...prev,
              clientId: found.id,
              country: prev.country || found.country || "UAE",
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load clients:", err);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, [preSelectedClientId]);

  // Handle client selection change
  const handleClientChange = (e) => {
    const cId = e.target.value;
    const found = clients.find((c) => String(c.id) === String(cId));
    setSelectedClient(found || null);
    setFormData((prev) => ({
      ...prev,
      clientId: cId,
      country: found?.country || prev.country || "UAE",
    }));
    if (errors.clientId) setErrors((prev) => ({ ...prev, clientId: "" }));
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBenefitToggle = (benefit) => {
    setFormData((prev) => {
      const exists = prev.benefits.includes(benefit);
      const updated = exists
        ? prev.benefits.filter((b) => b !== benefit)
        : [...prev.benefits, benefit];
      return { ...prev, benefits: updated };
    });
  };

  const handleRequirementsChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      additionalRequirements: {
        ...prev.additionalRequirements,
        [name]: value,
      },
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.clientId) {
      newErrors.clientId = "Please select an existing client for this project";
    }
    if (!formData.projectName.trim()) {
      newErrors.projectName = "Project name is required";
    }
    if (!formData.country.trim()) {
      newErrors.country = "Project country is required";
    }

    if (!formData.totalHeadcount || Number(formData.totalHeadcount) <= 0) {
      newErrors.totalHeadcount = "Please enter the required number of employees (greater than 0)";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast("Please fill all required project fields.", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = (e, asDraft = false) => {
    e?.preventDefault();
    if (!asDraft && !validate()) return;

    const payload = {
      ...formData,
      totalManpower: formData.totalHeadcount,
      status: asDraft ? "Draft" : formData.status || "Active",
      vendorAssignmentType: formData.vendorVisibility === 'specific' ? "Specific Vendor" : "All Vendors",
      assignedVendors: formData.assignedVendorIds || [],
    };

    onSubmit(payload, formData.clientId, asDraft);
  };

  const totalHeadcount = Number(formData.totalHeadcount) || 0;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors mb-2 cursor-pointer font-medium"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
            {isEdit ? "Edit Project Details" : "Add Project to Client"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Select an existing registered client and configure deployment project & manpower requirements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex-1 sm:flex-initial text-center justify-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition-colors cursor-pointer flex-1 sm:flex-initial text-center justify-center"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer w-full sm:w-auto"
          >
            <Save size={15} />
            <span>{loading ? "Saving Project..." : "Create Project"}</span>
          </button>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* SECTION 1: SELECT EXISTING CLIENT */}
        <FormSection
          id="client-select"
          title="Select Existing Client"
          subtitle="Link this project directly under an authorized registered client company."
          icon={Building2}
          badge="Required"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 tracking-wide mb-1.5">
                  Choose Client Company <span className="text-red-500">*</span>
                </label>
                {loadingClients ? (
                  <div className="h-10 bg-gray-100 animate-pulse rounded-lg" />
                ) : (
                  <select
                    value={formData.clientId}
                    onChange={handleClientChange}
                    className={`w-full appearance-none text-sm rounded-lg border py-2.5 px-3.5 bg-white text-gray-900 cursor-pointer ${errors.clientId
                        ? "border-red-400 focus:border-red-500 ring-2 ring-red-500/20"
                        : "border-gray-300 hover:border-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                      }`}
                  >
                    <option value="" disabled>
                      -- Select an existing client --
                    </option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.id}] {c.companyName} ({c.country || "International"})
                      </option>
                    ))}
                  </select>
                )}
                {errors.clientId && (
                  <p className="text-xs text-red-600 font-medium mt-1">
                    {errors.clientId}
                  </p>
                )}
              </div>

              {/* Selected Client Overview Card */}
              {selectedClient ? (
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {selectedClient.companyName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold shrink-0">
                        {selectedClient.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{selectedClient.country}</span>
                      <span>•</span>
                      <span>{selectedClient.email || "No email"}</span>
                      <span>•</span>
                      <span className="font-semibold text-blue-700">
                        {selectedClient.projects?.length || 0} Projects Registered
                      </span>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                    {selectedClient.status || "Active"}
                  </span>
                </div>
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-3.5 flex items-center text-xs text-gray-500 italic">
                  Select a client from the dropdown to see company profile and link this project.
                </div>
              )}
            </div>
          </div>
        </FormSection>

        {/* SECTION 2: PROJECT DETAILS */}
        <FormSection
          id="project-info"
          title="Project Core Information"
          subtitle="Site location, project classification, timeline, and sourcing status."
          icon={FolderKanban}
          badge="Required"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            <InputField
              label="Project Name"
              name="projectName"
              value={formData.projectName}
              onChange={handleFieldChange}
              placeholder="e.g. Al Reem Luxury Residential Complex"
              required
              error={errors.projectName}
              className="sm:col-span-2"
            />

            <SelectField
              label="Project Type / Category"
              name="projectType"
              value={formData.projectType}
              onChange={handleFieldChange}
              options={PROJECT_TYPES}
            />

            <InputField
              label="Project Country"
              name="country"
              value={formData.country}
              onChange={handleFieldChange}
              placeholder="e.g. UAE"
              required
              error={errors.country}
            />

            <SelectField
              label="Project Status"
              name="status"
              value={formData.status}
              onChange={handleFieldChange}
              options={[
                { value: "Active", label: "Active (Active Sourcing)" },
                { value: "Inactive", label: "Inactive (On Hold / Suspended)" },
              ]}
              helperText="Set if this project is actively accepting candidates"
            />

            <InputField
              label="Project Location / Site Address"
              name="location"
              value={formData.location}
              onChange={handleFieldChange}
              placeholder="e.g. Sector 4, Business Bay, Dubai"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 col-span-1 sm:col-span-2 lg:col-span-1">
              <InputField
                label="Start Date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleFieldChange}
              />

              <InputField
                label="Duration"
                name="duration"
                value={formData.duration}
                onChange={handleFieldChange}
                placeholder="e.g. 24 Months"
              />
            </div>

            <TextareaField
              label="Project Scope & Work Description"
              name="description"
              value={formData.description}
              onChange={handleFieldChange}
              placeholder="Brief details regarding construction phase, site conditions, camp facility..."
              rows={2}
              className="sm:col-span-2 lg:col-span-3"
            />
          </div>
        </FormSection>

        {/* SECTION 3: MANPOWER REQUIREMENTS */}
        <FormSection
          id="manpower-requirements"
          title="Manpower Headcount & Positions"
          subtitle="Specify the positions and the number of employees required for this project."
          icon={Users}
          badge={`${formData.totalHeadcount} Total Headcount`}
        >
          <div className="space-y-4">
            <ManpowerTable
              positions={formData.manpowerRequirements}
              onChange={(updatedPositions) => {
                setFormData(prev => ({ ...prev, manpowerRequirements: updatedPositions }));
              }}
            />
            {errors.totalHeadcount && (
              <p className="text-xs text-red-600 font-medium">{errors.totalHeadcount}</p>
            )}
          </div>
        </FormSection>

        {/* SECTION 4: EMPLOYEE BENEFITS */}
        <FormSection
          id="project-benefits"
          title="Employee Benefits / Allowances"
          subtitle="Amenity allowances and benefits provided by the client for this project."
          icon={Gift}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
              {STANDARD_BENEFITS.map((benefit) => {
                const checked = formData.benefits.includes(benefit);
                return (
                  <label
                    key={benefit}
                    className={`flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border text-[11px] sm:text-xs font-semibold cursor-pointer transition-all duration-150 select-none break-words ${checked
                        ? "bg-blue-50/80 border-blue-300 text-blue-900 shadow-2xs"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleBenefitToggle(benefit)}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer shrink-0"
                    />
                    <span>{benefit}</span>
                  </label>
                );
              })}
            </div>

            {formData.benefits.includes("Other") && (
              <TextareaField
                label="Other Benefits Description"
                name="otherBenefits"
                value={formData.otherBenefits}
                onChange={handleFieldChange}
                placeholder="Specify extra allowances, incentive bonuses, food mess details..."
                rows={2}
              />
            )}
          </div>
        </FormSection>

        {/* SECTION 5: ADDITIONAL REQUIREMENTS */}
        <FormSection
          id="additional-requirements"
          title="Additional Recruitment Specifications"
          subtitle="Required candidate documentation, medical checks, certifications, and language proficiency."
          icon={FileText}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <TextareaField
              label="Required Documents Checklist"
              name="requiredDocuments"
              value={formData.additionalRequirements.requiredDocuments}
              onChange={handleRequirementsChange}
              placeholder="e.g. Valid passport (min 12 months), trade test card, PCC, white photos..."
              rows={2}
            />

            <TextareaField
              label="Special Skills / Trade Certifications"
              name="specialSkills"
              value={formData.additionalRequirements.specialSkills}
              onChange={handleRequirementsChange}
              placeholder="e.g. High-rise tower slipform, 6G TIG welding, heavy crane card..."
              rows={2}
            />

            <InputField
              label="Language Requirements"
              name="languageRequirements"
              value={formData.additionalRequirements.languageRequirements}
              onChange={handleRequirementsChange}
              placeholder="e.g. Basic English and Hindi/Urdu for site coordination"
            />

            <InputField
              label="Medical Requirements"
              name="medicalRequirements"
              value={formData.additionalRequirements.medicalRequirements}
              onChange={handleRequirementsChange}
              placeholder="e.g. GAMCA fit certificate, blood test, audiometry"
            />

            <TextareaField
              label="Description"
              name="otherInstructions"
              value={formData.additionalRequirements.otherInstructions}
              onChange={handleRequirementsChange}
              placeholder="Specific trade test venue instructions, video interview dates, visa quota notes..."
              rows={2}
              className="sm:col-span-2"
            />
          </div>
        </FormSection>

        {/* SECTION 7: PAYMENT MILESTONES */}
        <FormSection
          id="payment-milestones"
          title="Candidate Selection Payment Milestones & Stages"
          subtitle="Configure default payment milestones and their respective processing stages."
          icon={CreditCard}
        >
          <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-4">
            <ProjectMilestoneBuilder 
              milestones={formData.paymentMilestones}
              onChange={(milestones) => setFormData(prev => ({ ...prev, paymentMilestones: milestones }))}
            />
          </div>
        </FormSection>

        {/* SECTION 8: VENDOR ASSIGNMENT */}
        <FormSection
          id="vendor-assignment"
          title="Vendor / Agency Assignment"
          subtitle="Control which vendor agencies can view and submit candidates for this project."
          icon={Globe}
        >
          <div className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Project Visibility for Vendors
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-gray-50" style={{ borderColor: formData.vendorVisibility === 'all' ? '#2563eb' : '#e5e7eb', backgroundColor: formData.vendorVisibility === 'all' ? '#eff6ff' : '#ffffff' }}>
                    <input
                      type="radio"
                      name="vendorVisibility"
                      value="all"
                      checked={formData.vendorVisibility === 'all'}
                      onChange={handleFieldChange}
                      className="mt-0.5 text-blue-600 cursor-pointer shrink-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900">All Approved Vendors</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">All vendors with Approved status can view and submit candidates to this project.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-gray-50" style={{ borderColor: formData.vendorVisibility === 'specific' ? '#2563eb' : '#e5e7eb', backgroundColor: formData.vendorVisibility === 'specific' ? '#eff6ff' : '#ffffff' }}>
                    <input
                      type="radio"
                      name="vendorVisibility"
                      value="specific"
                      checked={formData.vendorVisibility === 'specific'}
                      onChange={handleFieldChange}
                      className="mt-0.5 text-blue-600 cursor-pointer shrink-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900">Specific Vendors Only</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Only the vendors you select below can see and submit candidates for this project.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Specific Vendor Multi-Select */}
              {formData.vendorVisibility === 'specific' && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <label className="block text-xs font-semibold text-gray-700">
                      Select Assigned Vendors
                      <span className="ml-1.5 text-[10px] text-gray-400 font-medium">({allVendors.length} total)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Search vendors..."
                      value={vendorSearchTerm}
                      onChange={(e) => {
                        setVendorSearchTerm(e.target.value);
                        setVendorCurrentPage(1);
                      }}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 w-full sm:w-48"
                    />
                  </div>
                  
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    {(() => {
                      const filteredVendors = allVendors.filter(v => 
                        (v.companyName || "").toLowerCase().includes((vendorSearchTerm || "").toLowerCase()) ||
                        (v.id || "").toLowerCase().includes((vendorSearchTerm || "").toLowerCase()) ||
                        (v.city || "").toLowerCase().includes((vendorSearchTerm || "").toLowerCase())
                      );
                      
                      const VENDORS_PER_PAGE = 4;
                      const totalPages = Math.max(1, Math.ceil(filteredVendors.length / VENDORS_PER_PAGE));
                      const paginatedVendors = filteredVendors.slice((vendorCurrentPage - 1) * VENDORS_PER_PAGE, vendorCurrentPage * VENDORS_PER_PAGE);

                      return (
                        <>
                          {paginatedVendors.length === 0 ? (
                            <p className="text-xs text-gray-400 italic p-3">No vendors match your search.</p>
                          ) : (
                            <div className="min-h-[160px]">
                              {paginatedVendors.map((vendor) => {
                                const selected = (formData.assignedVendorIds || []).includes(vendor.id);
                                return (
                                  <label
                                    key={vendor.id}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() => {
                                        setFormData((prev) => {
                                          const existing = prev.assignedVendorIds || [];
                                          const updated = existing.includes(vendor.id)
                                            ? existing.filter((id) => id !== vendor.id)
                                            : [...existing, vendor.id];
                                          return { ...prev, assignedVendorIds: updated };
                                        });
                                      }}
                                      className="w-3.5 h-3.5 rounded text-blue-600 cursor-pointer shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-gray-900 truncate">{vendor.companyName}</p>
                                      <p className="text-[10px] text-gray-400 truncate">{vendor.id} · {vendor.city || "N/A"}, {vendor.country || "N/A"}</p>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Pagination Controls */}
                          {filteredVendors.length > 0 && (
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
                              <span className="text-[10px] text-gray-500 font-medium">
                                Showing {(vendorCurrentPage - 1) * VENDORS_PER_PAGE + 1} to {Math.min(vendorCurrentPage * VENDORS_PER_PAGE, filteredVendors.length)} of {filteredVendors.length}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setVendorCurrentPage(p => Math.max(1, p - 1))}
                                  disabled={vendorCurrentPage === 1}
                                  className="px-2 py-1 text-[10px] font-bold text-gray-600 bg-white border border-gray-200 rounded disabled:opacity-50 hover:bg-gray-50"
                                >
                                  Prev
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVendorCurrentPage(p => Math.min(totalPages, p + 1))}
                                  disabled={vendorCurrentPage === totalPages}
                                  className="px-2 py-1 text-[10px] font-bold text-gray-600 bg-white border border-gray-200 rounded disabled:opacity-50 hover:bg-gray-50"
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  {(formData.assignedVendorIds || []).length > 0 && (
                    <p className="text-[10px] text-blue-700 mt-2 font-semibold">
                      {(formData.assignedVendorIds || []).length} vendor{(formData.assignedVendorIds || []).length > 1 ? 's' : ''} currently selected.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </FormSection>

        {/* Bottom Submission Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={loading}
            className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer w-full sm:w-auto text-center justify-center"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer flex-1 sm:flex-initial text-center justify-center"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer flex-1 sm:flex-initial"
            >
              <Save size={16} />
              <span>{loading ? "Saving..." : "Create Project"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ProjectForm;
