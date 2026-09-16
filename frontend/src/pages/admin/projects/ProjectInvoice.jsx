import React from "react";
import { FileText, ArrowLeft, Plus, CheckCircle, AlertCircle } from "lucide-react";
import { useInvoiceLogic } from "../../../hooks/useInvoiceLogic";
import ProjectInvoiceList from "../../../components/admin/invoices/ProjectInvoiceList";
import ProjectInvoiceForm from "../../../components/admin/invoices/ProjectInvoiceForm";
import ProfessionalInvoiceModal from "../../../components/admin/ProfessionalInvoiceModal.jsx";

export default function ProjectInvoice({ project, onBack }) {
  const logic = useInvoiceLogic(project);

  const {
    activeTab, setActiveTab,
    errorMsg, successMsg,
    selectedInvoice, setSelectedInvoice,
    resetForm, setEditingInvoiceId, setEditingInvoiceNo
  } = logic;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Back to Project Overview"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <FileText className="text-green-600" size={22} />
              Invoices & Billing — {project?.projectName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              VESTA Solutions Official Tax Invoices • Includes default Noida HQ address & corporate branding
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "list"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Invoice List ({logic.invoices.length})
          </button>
          <button
            onClick={() => {
              setEditingInvoiceId(null);
              setEditingInvoiceNo("");
              resetForm();
              setActiveTab("create");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "create"
                ? "bg-green-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Plus size={14} /> {logic.editingInvoiceId ? `Edit (${logic.editingInvoiceNo})` : "Create New Invoice"}
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium flex items-center gap-2.5">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-medium flex items-center gap-2.5">
          <CheckCircle size={18} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      {activeTab === "list" && (
        <ProjectInvoiceList
          searchQuery={logic.searchQuery}
          setSearchQuery={logic.setSearchQuery}
          setActiveTab={setActiveTab}
          filteredInvoices={logic.filteredInvoices}
          project={project}
          clientNameVal={logic.clientNameVal}
          companyNameVal={logic.companyNameVal}
          setSelectedInvoice={setSelectedInvoice}
          handleEditInvoice={logic.handleEditInvoice}
          handleDeleteInvoice={logic.handleDeleteInvoice}
        />
      )}

      {activeTab === "create" && (
        <ProjectInvoiceForm logic={logic} project={project} />
      )}

      {/* PROFESSIONAL INVOICE MODAL */}
      {selectedInvoice && (
        <ProfessionalInvoiceModal
          invoice={selectedInvoice}
          project={project}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
