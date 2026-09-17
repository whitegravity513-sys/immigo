import React, { useState } from "react";
import {
  ArrowLeft, Edit, FileText, IndianRupee, CheckCircle, AlertCircle, Calendar, Check, AlertTriangle, XCircle, X
} from "lucide-react";
import ProjectInvoice from "./ProjectInvoice.jsx";
import ProjectPayments from "./ProjectPayments.jsx";
import { useProjectDetail } from "../../../hooks/useProjectDetail";
import apiClient from "../../../services/apiClient.js";

export default function ProjectDetail({ initialProject, onBack, onUpdate }) {
  const {
    project,
    paymentSummary,
    currentSubView,
    setCurrentSubView,
    isEditing,
    setIsEditing,
    loading,
    errorMsg,
    successMsg,
    showExtendModal,
    setShowExtendModal,
    extendInputAmount,
    setExtendInputAmount,
    extendRemark,
    setExtendRemark,
    editForm,
    handleEditFormChange,
    initialValue,
    extendedValue,
    totalProjectValue,
    totalPaid,
    totalTDS,
    remainingBalance,
    handleSaveExtendedBudget,
    handleEditSubmit,
    fetchProjectData
  } = useProjectDetail(initialProject, onUpdate);

  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [renewalForm, setRenewalForm] = useState({
    hostingerPurchaseDate: "",
    amcPurchaseDate: "",
    notes: "",
  });

  const handleOpenRenewalModal = (renewal = null) => {
    if (renewal) {
      setRenewalForm({
        hostingerPurchaseDate: renewal.hostingerPurchaseDate ? renewal.hostingerPurchaseDate.split("T")[0] : "",
        amcPurchaseDate: renewal.amcPurchaseDate ? renewal.amcPurchaseDate.split("T")[0] : "",
        notes: renewal.notes || "",
      });
    } else {
      setRenewalForm({
        hostingerPurchaseDate: "",
        amcPurchaseDate: "",
        notes: "",
      });
    }
    setIsRenewalModalOpen(true);
  };

  const handleSaveRenewal = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        projectId: project._id,
        hostingerPurchaseDate: renewalForm.hostingerPurchaseDate || null,
        amcPurchaseDate: renewalForm.amcPurchaseDate || null,
        notes: renewalForm.notes || "",
      };

      if (project.renewal) {
        await apiClient.put(`/admin/renewals/${project.renewal.id}`, payload);
      } else {
        await apiClient.post("/admin/renewals", payload);
      }

      setIsRenewalModalOpen(false);
      fetchProjectData(project._id);
    } catch (err) {
      console.error(err);
      alert("Failed to save renewal details.");
    }
  };

  const formatDate = (ds) => {
    if (!ds) return "-";
    return new Date(ds).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-bold">
            <Check size={14} /> {status}
          </span>
        );
      case "Expiring Soon":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-600 border border-green-200 rounded-lg text-xs font-bold">
            <AlertTriangle size={14} /> {status}
          </span>
        );
      case "Expired":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-800 border border-green-300 rounded-lg text-xs font-bold">
            <XCircle size={14} /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  if (currentSubView === "invoice") {
    return <ProjectInvoice project={project} onBack={() => { setCurrentSubView("overview"); fetchProjectData(project._id); }} />;
  }

  if (currentSubView === "payments") {
    return <ProjectPayments project={project} onBack={() => { setCurrentSubView("overview"); fetchProjectData(project._id); }} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft size={16} /> Back to Projects
          </button>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-green-100/80 text-green-800 font-mono font-bold text-[10px] rounded border border-green-200">
                #{project.projectId}
              </span>
              {project.status && (
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border tracking-wider ${
                  project.status === "Completed" || project.status === "Inactive"
                    ? "bg-slate-50 text-slate-600 border-slate-200"
                    : project.status === "Cancelled"
                    ? "bg-rose-50 text-rose-600 border-rose-200"
                    : project.status === "On Hold"
                    ? "bg-amber-50 text-amber-600 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}>
                  {project.status}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{project.projectName}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Project Type: <strong className="text-slate-700">{project.projectType || "Not Specified"}</strong></span>
              {project.industryName && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="text-slate-600 font-semibold">{project.industryName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Edit, Invoice, Part Payment */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <Edit size={14} className="text-green-600" /> Edit Details
          </button>

          <button
            onClick={() => setCurrentSubView("payments")}
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <IndianRupee size={15} /> Part Payment Account
          </button>

          <button
            onClick={() => setCurrentSubView("invoice")}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-green-600/20"
          >
            <FileText size={15} /> Generate Invoice
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm font-medium">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-medium">
          <CheckCircle size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* PROJECT DETAILS STRIP Jo Form me bhari thi ek line / grid me */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            Project Information & Specifications
          </h3>
          <span className="text-xs font-bold text-slate-500">Full Record View</span>
        </div>

        <div className="p-6">
          {/* Key values row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Project ID</span>
              <p className="text-sm font-mono font-black text-green-700 mt-1">{project.projectId}</p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Project Type & Industry</span>
              <p className="text-sm font-bold text-slate-800 mt-1">{project.projectType || "-"}</p>
              <span className="inline-block bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-[11px] font-bold mt-1">
                {project.industryName || "Web Development / IT"}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Client Name</span>
              <p className="text-sm font-bold text-slate-800 mt-1">
                {project.client?.name || project.clientName || "-"}
              </p>
              {(project.client?.companyName || project.companyName) && (
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Company: {project.client?.companyName || project.companyName}
                </p>
              )}
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Sales Person</span>
              <p className="text-sm font-bold text-slate-800 mt-1">{project.salesPerson || "-"}</p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Lead Source</span>
              <p className="text-sm font-bold text-slate-800 mt-1">{project.leadSource || "-"}</p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Project Total</span>
              <p className="text-base font-black text-slate-900 mt-1">
                ₹{(project.totalAmount || 0).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Description & Remark */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Scope & Description</span>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
                {project.description || "No description specified."}
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Remarks & Notes</span>
              <p className="text-sm text-slate-700 mt-1">
                {project.remark || "No additional remarks."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE 5-POINT FINANCIAL & SCOPE LEDGER */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 border border-emerald-400/40">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/20 pb-5">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-200">
              Project Financial Overview & Scope Status
            </span>
            <h3 className="text-2xl font-black text-white mt-1">Contract Valuation & Payments</h3>
          </div>
          <button
            onClick={() => setShowExtendModal(true)}
            className="px-5 py-3 bg-emerald-300 hover:bg-emerald-200 text-green-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg border border-emerald-200 cursor-pointer"
          >
            + Extend Project Price / Scope
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="text-[11px] text-emerald-100 font-bold uppercase">1. Initial Price (Phele)</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1.5">
              ₹{initialValue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-200/90 mt-1">Original project value</div>
          </div>

          <div className="bg-emerald-400/25 border-2 border-emerald-300/60 rounded-2xl p-4 shadow-md">
            <div className="text-[11px] text-emerald-100 font-black uppercase tracking-wide">2. Extended Amount (+)</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-100 mt-1.5">
              +₹{extendedValue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-100 font-semibold mt-1">Scope / price extended</div>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="text-[11px] text-emerald-100 font-bold uppercase">3. Total Project Value</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1.5">
              ₹{totalProjectValue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-200/90 mt-1">Initial + Extended</div>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="text-[11px] text-emerald-100 font-bold uppercase">4. Paid Amount</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1.5">
              ₹{totalPaid.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-200/90 mt-1">
              Net received in bank
              {totalTDS > 0 && (
                <span className="block text-amber-200 font-bold">+ TDS: ₹{totalTDS.toLocaleString("en-IN")}</span>
              )}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="text-[11px] text-amber-200 font-bold uppercase">5. Pending Balance</div>
            <div className="text-xl sm:text-2xl font-black text-amber-200 mt-1.5">
              ₹{remainingBalance.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-amber-200/90 mt-1">
              Total − (Paid + TDS)
            </div>
          </div>
        </div>
      </div>

      {/* PROJECT RENEWAL DETAILS CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Calendar size={16} className="text-green-600" />
            Project Renewal Details (Hosting & AMC)
          </h3>
          <span className="text-xs font-bold text-slate-500">Renewal Cycle</span>
        </div>

        <div className="p-6">
          {project.renewal ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Hostinger Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase">Hostinger Hosting</span>
                    {getStatusBadge(project.renewal.status)}
                  </div>
                  {project.renewal.hostingerPurchaseDate ? (
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-500">
                        Purchased: <strong className="text-slate-800">{formatDate(project.renewal.hostingerPurchaseDate)}</strong>
                      </div>
                      <div className="text-xs font-bold text-slate-500">
                        Expiry Date: <strong className="text-slate-800">{formatDate(project.renewal.hostingerExpiryDate)}</strong>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">Not configured</span>
                  )}
                </div>

                {/* AMC Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase">Annual Maintenance Contract (AMC)</span>
                    {getStatusBadge(project.renewal.status)}
                  </div>
                  {project.renewal.amcPurchaseDate ? (
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-500">
                        Purchased: <strong className="text-slate-800">{formatDate(project.renewal.amcPurchaseDate)}</strong>
                      </div>
                      <div className="text-xs font-bold text-slate-500">
                        Expiry Date: <strong className="text-slate-800">{formatDate(project.renewal.amcExpiryDate)}</strong>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">Not configured</span>
                  )}
                </div>

                {/* Status & Notes Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-400 uppercase block">Additional Notes</span>
                    <p className="text-xs font-semibold text-slate-700 mt-2 leading-relaxed whitespace-pre-wrap">
                      {project.renewal.notes || "No extra notes specified."}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenRenewalModal(project.renewal)}
                    className="mt-4 w-full py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
                  >
                    Edit Renewal Settings
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-6">
              <AlertCircle className="text-slate-400 mb-2" size={32} />
              <h4 className="text-sm font-black text-slate-700">No renewal cycle added for this project</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Adding renewal settings lets you track purchase and expiry dates for hosting (Hostinger) and AMC.
              </p>
              <button
                onClick={() => handleOpenRenewalModal(null)}
                className="mt-4 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
              >
                + Configure Renewal Details
              </button>
            </div>
          )}
        </div>
      </div>

      {/* EDIT PROJECT MODAL */}
      {isEditing && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsEditing(false)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-base font-black text-slate-800">
                Edit Project Details ({project.projectId})
              </h3>
              <button
                className="text-slate-500 text-xl cursor-pointer p-1"
                onClick={() => setIsEditing(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Project Name</label>
                  <input
                    type="text"
                    name="projectName"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
                    value={editForm.projectName}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Project Type</label>
                  <input
                    type="text"
                    name="projectType"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
                    value={editForm.projectType}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase">Industry Name</label>
                  <select
                    name="industryName"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500 font-semibold"
                    value={editForm.industryName || "Web Development / IT"}
                    onChange={handleEditFormChange}
                  >
                    <option value="Web Development / IT">Web Development / IT</option>
                    <option value="Healthcare & HealthTech">Healthcare & HealthTech</option>
                    <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                    <option value="Education & EdTech">Education & EdTech</option>
                    <option value="Real Estate & Construction">Real Estate & Construction</option>
                    <option value="FinTech & Banking">FinTech & Banking</option>
                    <option value="Other / Custom">Other / Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Sales Person</label>
                  <input
                    type="text"
                    name="salesPerson"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
                    value={editForm.salesPerson}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Lead Source</label>
                  <input
                    type="text"
                    name="leadSource"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
                    value={editForm.leadSource}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Client Name</label>
                  <input
                    type="text"
                    name="clientName"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
                    value={editForm.clientName}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Total Amount (₹)</label>
                  <input
                    type="number"
                    name="totalAmount"
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500 font-bold"
                    value={editForm.totalAmount}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Project Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Remark</label>
                  <input
                    type="text"
                    name="remark"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
                    value={editForm.remark}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Project Status</label>
                  <select
                    name="status"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500 font-bold"
                    value={editForm.status}
                    onChange={handleEditFormChange}
                  >
                    <option value="Ongoing">Active / Ongoing</option>
                    <option value="Completed">Completed / Inactive</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl cursor-pointer text-sm"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer text-sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTEND PROJECT BUDGET / SCOPE MODAL */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-700 text-white">
              <h3 className="text-base font-black flex items-center gap-2">
                + Extend Project Price / Scope
              </h3>
              <button
                className="text-white/80 hover:text-white text-xl font-bold cursor-pointer"
                onClick={() => setShowExtendModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveExtendedBudget} className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500">Initial Project Price:</span>
                  <span className="font-black text-slate-800">₹{initialValue.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500">Already Extended:</span>
                  <span className="font-black text-green-600">+₹{extendedValue.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Add Extended Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 25000"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-green-500"
                    value={extendInputAmount}
                    onChange={(e) => setExtendInputAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Extension Remark / Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scope increased for additional features"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-green-500"
                  value={extendRemark}
                  onChange={(e) => setExtendRemark(e.target.value)}
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 flex items-center justify-between">
                <span className="text-xs font-bold text-green-800 uppercase">New Total Amount:</span>
                <span className="text-lg font-black text-green-700">
                  ₹{(initialValue + extendedValue + (Number(extendInputAmount) || 0)).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl cursor-pointer text-sm transition-all shadow-md"
                >
                  {loading ? "Saving..." : "Save Extended Amount"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RENEWAL MODAL */}
      {isRenewalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-700 text-white">
              <h3 className="text-base font-black flex items-center gap-2">
                <Calendar size={18} /> {project.renewal ? "Edit Renewal Details" : "Configure Renewal Details"}
              </h3>
              <button
                className="text-white/80 hover:text-white text-xl font-bold cursor-pointer"
                onClick={() => setIsRenewalModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveRenewal} className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} /> Hostinger Purchase Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-green-500 font-medium"
                  value={renewalForm.hostingerPurchaseDate}
                  onChange={(e) => setRenewalForm({ ...renewalForm, hostingerPurchaseDate: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 font-medium">Expiry auto-calculates to +1 year</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} /> AMC Purchase Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-green-500 font-medium"
                  value={renewalForm.amcPurchaseDate}
                  onChange={(e) => setRenewalForm({ ...renewalForm, amcPurchaseDate: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 font-medium">Expiry auto-calculates to +1 year</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Notes (Optional)
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-green-500 font-medium resize-none"
                  rows={3}
                  placeholder="Additional renewal notes..."
                  value={renewalForm.notes}
                  onChange={(e) => setRenewalForm({ ...renewalForm, notes: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl cursor-pointer text-sm transition-all shadow-md cursor-pointer"
                >
                  Save Settings
                </button>
                <button
                  type="button"
                  onClick={() => setIsRenewalModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
