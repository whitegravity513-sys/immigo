import React, { useState, useEffect } from "react";
import apiClient from "../../../services/apiClient.js";
import * as XLSX from "xlsx";
import {
  FileText, Search, Eye, Download, Building2, User,
  Calendar, IndianRupee, Hash, RefreshCw, Folder
} from "lucide-react";
import ProfessionalInvoiceModal from "../../../components/admin/ProfessionalInvoiceModal.jsx";

export default function AllInvoicesDirectory() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchAllInvoices();
  }, []);

  const fetchAllInvoices = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await apiClient.get("/admin/invoices/all");
      setInvoices(res.data.invoices || []);
    } catch (err) {
      console.error("Failed to fetch all invoices:", err);
      setErrorMsg("Failed to load invoice directory.");
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const invNo = (inv.invoiceNo || "").toLowerCase();
    const cName = (inv.client?.name || "").toLowerCase();
    const compName = (inv.client?.company || "").toLowerCase();
    return invNo.includes(q) || cName.includes(q) || compName.includes(q);
  });

  const totalInvoicedAmount = invoices.reduce((acc, inv) => acc + (Number(inv.totalAmount) || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
            <Folder size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              All Invoices Folder & Directory
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Central repository of all generated professional invoices across all projects & clients
            </p>
          </div>
        </div>

        <button
          onClick={fetchAllInvoices}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh List
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Generated Invoices
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {invoices.length}
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <FileText size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Invoiced Billing
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              ₹{totalInvoicedAmount.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <IndianRupee size={24} />
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* Invoices Folder Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Invoice No, Project or Client..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-green-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="text-xs font-extrabold text-slate-500">
            Showing {filteredInvoices.length} of {invoices.length} Invoices
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Invoice No</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Client / Company</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">
                    Loading invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv._id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-green-700 text-xs bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                        {inv.invoiceNo}
                      </span>
                      <div className="mt-1.5">
                        {(inv.paymentStatus || inv.status) && (
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                            (inv.paymentStatus || inv.status) === "Paid"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : (inv.paymentStatus || inv.status) === "Overdue"
                              ? "bg-rose-50 text-rose-600 border-rose-200"
                              : "bg-amber-50 text-amber-600 border-amber-200"
                          }`}>
                            {inv.paymentStatus || inv.status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600 whitespace-nowrap">
                      {inv.date || (inv.issuedDate ? new Date(inv.issuedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">
                        {inv.projectName || "—"}
                      </div>
                      {inv.projectId && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">#{inv.projectId}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">
                        {inv.clientName || inv.client?.name || "—"}
                      </div>
                      {(inv.companyName || inv.client?.companyName) && (
                        <div className="text-xs font-semibold text-slate-600 mt-0.5 flex items-center gap-1">
                          <Building2 size={10} className="text-slate-400" />
                          {inv.companyName || inv.client?.companyName}
                        </div>
                      )}
                      {(inv.clientContact || inv.client?.mobile) && (
                        <div className="text-[10px] text-green-700 mt-0.5">
                          📞 {inv.clientContact || inv.client?.mobile}
                        </div>
                      )}
                      {(inv.clientEmail || inv.client?.email) && (
                        <div className="text-[10px] text-slate-500">
                          ✉️ {inv.clientEmail || inv.client?.email}
                        </div>
                      )}
                      {(inv.supplyAddress) && (
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-start gap-1">
                          <span>📍</span>
                          <span>{inv.supplyAddress}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 text-base whitespace-nowrap">
                      ₹{(Number(inv.totalAmount) || 0).toLocaleString("en-IN")}
                      {Number(inv.tax) > 0 && (
                        <div className="text-[10px] font-semibold text-slate-400">Tax: ₹{Number(inv.tax).toLocaleString("en-IN")}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-green-50 hover:text-green-700 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Eye size={14} /> View Invoice
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 text-sm">
                    No generated invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Professional Official Invoice Modal */}
      {selectedInvoice && (
        <ProfessionalInvoiceModal
          invoice={selectedInvoice}
          project={selectedInvoice.project}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
