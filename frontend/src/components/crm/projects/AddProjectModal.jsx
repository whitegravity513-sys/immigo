import React, { useState, useEffect } from "react";
import {
  X,
  FolderPlus,
  Check,
  Building2,
  Users,
  Gift,
  FileCheck,
  Calendar,
  CreditCard,
  Plus,
  Trash2,
  Sliders,
  Globe,
} from "lucide-react";
import InputField from "../ui/InputField.jsx";
import SelectField from "../ui/SelectField.jsx";
import TextareaField from "../ui/TextareaField.jsx";
import CountrySelectField from "../ui/CountrySelectField.jsx";
import ManpowerTable from "../manpower/ManpowerTable.jsx";
import DocumentsList from "../documents/DocumentsList.jsx";
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

const generatePresetMilestones = (parts, totalFee) => {
  const partsNum = Number(parts) || 4;
  const fee = Number(totalFee) || 40000;

  if (partsNum === 1) {
    return [
      { id: "M1", name: "Milestone 1 - Single Full Payment on Selection", percentage: 100, amount: fee },
    ];
  } else if (partsNum === 2) {
    const half = Math.round(fee / 2);
    return [
      { id: "M1", name: "Milestone 1 - Selection / Offer Letter", percentage: 50, amount: half },
      { id: "M2", name: "Milestone 2 - On-Site Deployment", percentage: 50, amount: fee - half },
    ];
  } else if (partsNum === 3) {
    const p1 = Math.round(fee * 0.4);
    const p2 = Math.round(fee * 0.3);
    const p3 = fee - (p1 + p2);
    return [
      { id: "M1", name: "Milestone 1 - Selection / Offer Letter", percentage: 40, amount: p1 },
      { id: "M2", name: "Milestone 2 - Visa Stamping & Permit", percentage: 30, amount: p2 },
      { id: "M3", name: "Milestone 3 - On-Site Deployment", percentage: 30, amount: p3 },
    ];
  } else if (partsNum === 5) {
    const portion = Math.round(fee / 5);
    return [
      { id: "M1", name: "Milestone 1 - Selection / Offer Letter", percentage: 20, amount: portion },
      { id: "M2", name: "Milestone 2 - GAMCA Medical Clearance", percentage: 20, amount: portion },
      { id: "M3", name: "Milestone 3 - Trade Test Validation", percentage: 20, amount: portion },
      { id: "M4", name: "Milestone 4 - Visa Stamping & Permit", percentage: 20, amount: portion },
      { id: "M5", name: "Milestone 5 - On-Site Deployment", percentage: 20, amount: fee - portion * 4 },
    ];
  } else {
    // Default 4 parts
    const q = Math.round(fee / 4);
    return [
      { id: "M1", name: "Milestone 1 - Selection / Offer Letter", percentage: 25, amount: q },
      { id: "M2", name: "Milestone 2 - GAMCA Medical Clearance", percentage: 25, amount: q },
      { id: "M3", name: "Milestone 3 - Visa Stamping & Permit", percentage: 25, amount: q },
      { id: "M4", name: "Milestone 4 - On-Site Deployment", percentage: 25, amount: fee - q * 3 },
    ];
  }
};

export function AddProjectModal({
  isOpen,
  onClose,
  onSave,
  client = null,
  clientCountry = "UAE",
  projectToEdit = null,
}) {
  const [formData, setFormData] = useState({
    projectName: "",
    positionTitle: "",
    projectType: "Construction",
    country: client?.country || clientCountry || "UAE",
    location: "",
    startDate: new Date().toISOString().split("T")[0],
    duration: "24 Months",
    description: "",
    status: "Active",
    benefits: [
      "Accommodation",
      "Transportation",
      "Medical Insurance",
      "Visa",
      "Work Permit",
    ],
    otherBenefits: "",
    additionalRequirements: {
      requiredDocuments: "",
      specialSkills: "",
      languageRequirements: "English / Hindi",
      medicalRequirements: "GAMCA Fit certificate",
      otherInstructions: "",
    },
    totalHeadcount: 25,
    workforceNotes: "",
    documents: [],
    paymentMilestoneConfig: {
      partsCount: 4,
      totalFeePerCandidate: 40000,
      milestones: generatePresetMilestones(4, 40000),
    },
    vendorVisibility: "all",
    assignedVendorIds: [],
  });

  const [errors, setErrors] = useState({});

  // Vendor Assignment State
  const [allVendors, setAllVendors] = useState([]);
  const [vendorSearchTerm, setVendorSearchTerm] = useState("");
  const [vendorCurrentPage, setVendorCurrentPage] = useState(1);

  // Fetch vendors
  useEffect(() => {
    crmVendorService.getVendors({ status: "Approved" }).then((vendors) => {
      setAllVendors(vendors || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (projectToEdit) {
        setFormData({
          ...projectToEdit,
          positionTitle:
            projectToEdit.positionTitle ||
            projectToEdit.primaryPosition ||
            projectToEdit.manpowerRequirements?.[0]?.position ||
            "Electrician",
          country: projectToEdit.country || client?.country || clientCountry || "UAE",
          paymentMilestoneConfig: projectToEdit.paymentMilestoneConfig || {
            partsCount: 4,
            totalFeePerCandidate: 40000,
            milestones: generatePresetMilestones(4, 40000),
          },
        });
      } else {
        setFormData({
          projectName: "",
          positionTitle: "",
          projectType: "Construction",
          country: client?.country || clientCountry || "UAE",
          location: "",
          startDate: new Date().toISOString().split("T")[0],
          duration: "24 Months",
          description: "",
          status: "Active",
          benefits: [
            "Accommodation",
            "Transportation",
            "Medical Insurance",
            "Visa",
            "Work Permit",
          ],
          otherBenefits: "",
          additionalRequirements: {
            requiredDocuments: "",
            specialSkills: "",
            languageRequirements: "English / Hindi",
            medicalRequirements: "GAMCA Fit certificate",
            otherInstructions: "",
          },
          totalHeadcount: 25,
          workforceNotes: "",
          documents: [],
          paymentMilestoneConfig: {
            partsCount: 4,
            totalFeePerCandidate: 40000,
            milestones: generatePresetMilestones(4, 40000),
          },
          vendorVisibility: "all",
          assignedVendorIds: [],
        });
      }
      setErrors({});
      setVendorSearchTerm("");
      setVendorCurrentPage(1);
    }
  }, [isOpen, client, clientCountry, projectToEdit]);

  if (!isOpen) return null;

  const handleChange = (e) => {
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

  const validate = () => {
    const newErrors = {};
    if (!formData.projectName.trim()) newErrors.projectName = "Project name is required";
    if (!formData.country.trim()) newErrors.country = "Country is required";
    if (!formData.totalHeadcount || Number(formData.totalHeadcount) <= 0) {
      newErrors.totalHeadcount = "Please enter the required number of employees (greater than 0)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const headcountNum = Number(formData.totalHeadcount) || 1;
    const pos = formData.positionTitle?.trim() || formData.workforceNotes?.trim() || "Required Trade Position";
    onSave({
      ...formData,
      primaryPosition: pos,
      positionTitle: pos,
      totalHeadcount: headcountNum,
      totalManpower: headcountNum,
      vendorAssignmentType: formData.vendorVisibility === "specific" ? "Specific Vendor" : "All Vendors",
      vendorVisibility: formData.vendorVisibility || "all",
      assignedVendors: formData.assignedVendorIds || [],
      assignedVendorIds: formData.assignedVendorIds || [],
      manpowerRequirements: [
        {
          id: formData.manpowerRequirements?.[0]?.id || `mpr-${Date.now()}`,
          position: pos,
          quantity: headcountNum,
        },
      ],
    });
    onClose();
  };

  const defaultCurrency =
    formData.country === "Saudi Arabia"
      ? "SAR"
      : formData.country === "Qatar"
      ? "QAR"
      : formData.country === "Oman"
      ? "OMR"
      : formData.country === "Kuwait"
      ? "KWD"
      : formData.country === "Bahrain"
      ? "BHD"
      : formData.country === "Germany"
      ? "EUR"
      : formData.country === "United Kingdom"
      ? "GBP"
      : "AED";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-3xl border border-gray-200">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-gray-50/80 px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                  <FolderPlus size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">
                    Add Project {client ? `for ${client.companyName}` : ""}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-gray-500">
                    Quickly configure deployment project & manpower requirements in-place.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Client Banner */}
            {client && (
              <div className="bg-blue-50/70 border-b border-blue-100 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-gray-500 font-medium">Adding to Client:</span>
                  <span className="font-bold text-blue-900 truncate">
                    {client.companyName}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                    {client.id}
                  </span>
                </div>
                <span className="text-[11px] text-gray-600 shrink-0">
                  {client.country}
                </span>
              </div>
            )}

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Basic Project Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Building2 size={15} className="text-blue-600" />
                  <span>Project Overview</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <InputField
                    label="Project Name"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    placeholder="e.g. Dubai Residential Tower"
                    required
                    error={errors.projectName}
                  />

                  <InputField
                    label="Job Requirement / Trade Position"
                    name="positionTitle"
                    value={formData.positionTitle || ""}
                    onChange={handleChange}
                    placeholder="e.g. Electrician / Structural Welder 6G / Mason"
                    required
                    helperText="Single trade requirement for this project"
                  />

                  <SelectField
                    label="Project Type"
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleChange}
                    options={PROJECT_TYPES}
                  />

                  <CountrySelectField
                    label="Project Country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    error={errors.country}
                  />

                  <SelectField
                    label="Project Status"
                    name="status"
                    value={formData.status || "Active"}
                    onChange={handleChange}
                    options={[
                      { value: "Active", label: "Active (Active Sourcing)" },
                      { value: "Inactive", label: "Inactive (On Hold / Suspended)" },
                    ]}
                    helperText="Control if project is active or inactive"
                  />

                  <InputField
                    label="Project Location / Site"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Downtown Dubai / Industrial Area"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 col-span-1 sm:col-span-2">
                    <InputField
                      label="Start Date"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                    />

                    <InputField
                      label="Duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="e.g. 24 Months"
                    />
                  </div>

                  <TextareaField
                    label="Project Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Detailed scope of project, site conditions, client background..."
                    rows={2}
                    className="sm:col-span-2"
                  />
                </div>
              </div>

              {/* Manpower Requirement Section */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Users size={15} className="text-blue-600" />
                    <span>Manpower Headcount</span>
                  </h4>
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                    {formData.totalHeadcount || 0} Total Headcount
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Required Number of Employees / Headcount"
                    name="totalHeadcount"
                    type="number"
                    min="1"
                    value={formData.totalHeadcount}
                    onChange={handleChange}
                    placeholder="e.g. 25"
                    required
                    error={errors.totalHeadcount}
                    helperText="Enter the total number of employees needed"
                  />
                </div>
              </div>

              {/* Benefits Section */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Gift size={15} className="text-blue-600" />
                  <span>Employee Benefits & Facilities</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
                  {STANDARD_BENEFITS.map((benefit) => {
                    const checked = formData.benefits.includes(benefit);
                    return (
                      <label
                        key={benefit}
                        className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all duration-150 select-none break-words ${
                          checked
                            ? "bg-blue-50/80 border-blue-300 text-blue-900"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleBenefitToggle(benefit)}
                          className="w-3.5 h-3.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer shrink-0"
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
                    onChange={handleChange}
                    placeholder="Specify other allowances, bonuses, overtime arrangements..."
                    rows={2}
                  />
                )}
              </div>

              {/* Vendor Assignment Section */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Globe size={15} className="text-blue-600" />
                  <span>Vendor / Agency Assignment</span>
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
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
                        onChange={(e) => setFormData(prev => ({ ...prev, vendorVisibility: 'all' }))}
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
                        onChange={(e) => setFormData(prev => ({ ...prev, vendorVisibility: 'specific' }))}
                        className="mt-0.5 text-blue-600 cursor-pointer shrink-0"
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-900">Specific Vendors Only</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Only the vendors you select below can see and submit candidates for this project.</p>
                      </div>
                    </label>
                  </div>

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

              {/* Selection Milestone Payment Plan Section */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard size={15} className="text-blue-600" />
                    <span>Candidate Selection Payment Milestone Parts</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    Auto-Applied when Candidate Selected
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Number of Payment Installments / Parts
                      </label>
                      <select
                        value={formData.paymentMilestoneConfig?.partsCount || 4}
                        onChange={(e) => {
                          const count = Number(e.target.value) || 4;
                          const fee = formData.paymentMilestoneConfig?.totalFeePerCandidate || 40000;
                          setFormData((prev) => ({
                            ...prev,
                            paymentMilestoneConfig: {
                              partsCount: count,
                              totalFeePerCandidate: fee,
                              milestones: generatePresetMilestones(count, fee),
                            },
                          }));
                        }}
                        className="w-full text-xs font-semibold rounded-lg border border-slate-300 py-2 px-3 bg-white text-slate-800 focus:border-blue-600 focus:outline-none"
                      >
                        <option value={1}>1 Part (100% Single Payment on Selection)</option>
                        <option value={2}>2 Parts (50% Selection, 50% Deployment)</option>
                        <option value={3}>3 Parts (40% Selection, 30% Visa, 30% Deployment)</option>
                        <option value={4}>4 Parts (25% Selection, Medical, Visa, Deployment) - Standard</option>
                        <option value={5}>5 Parts (20% Each - 5 Recruitment Milestones)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Placement Fee Amount per Candidate (₹ / Currency)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.paymentMilestoneConfig?.totalFeePerCandidate || 40000}
                        onChange={(e) => {
                          const fee = Number(e.target.value) || 0;
                          const parts = formData.paymentMilestoneConfig?.partsCount || 4;
                          setFormData((prev) => ({
                            ...prev,
                            paymentMilestoneConfig: {
                              ...prev.paymentMilestoneConfig,
                              totalFeePerCandidate: fee,
                              milestones: generatePresetMilestones(parts, fee),
                            },
                          }));
                        }}
                        placeholder="e.g. 40000"
                        className="w-full text-xs font-bold rounded-lg border border-slate-300 py-2 px-3 bg-white text-slate-800 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Milestones Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                          <th className="py-2 px-3"># Milestone Stage</th>
                          <th className="py-2 px-3 w-24">Share %</th>
                          <th className="py-2 px-3 w-32 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {(formData.paymentMilestoneConfig?.milestones || []).map((m, idx) => (
                          <tr key={m.id || idx} className="hover:bg-slate-50/80">
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={m.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData((prev) => {
                                    const copy = [...(prev.paymentMilestoneConfig?.milestones || [])];
                                    copy[idx] = { ...copy[idx], name: val };
                                    return {
                                      ...prev,
                                      paymentMilestoneConfig: {
                                        ...prev.paymentMilestoneConfig,
                                        milestones: copy,
                                      },
                                    };
                                  });
                                }}
                                className="w-full text-xs font-medium border-0 focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-1 bg-transparent hover:bg-white"
                              />
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-700">
                              {m.percentage}%
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-blue-900">
                              ₹{(m.amount || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 sm:px-6 py-3.5 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Check size={15} />
                <span>Save Project</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddProjectModal;
