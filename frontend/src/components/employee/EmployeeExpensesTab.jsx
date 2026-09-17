import React, { useState, useEffect } from "react";
import { apiClient } from "../../services/apiClient.js";
import {
  IndianRupee,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Calendar,
  Building2,
  Tag,
  UploadCloud,
  FileUp,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

export default function EmployeeExpensesTab({ user, token }) {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL | Pending | Approved | Rejected

  // Submit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
    clientId: "",
    receipt: "",
    remarks: "",
  });
  const [receiptLabel, setReceiptLabel] = useState("");

  // Preview Receipt Modal
  const [previewReceipt, setPreviewReceipt] = useState(null);

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 5000);
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expRes, catRes, clientRes] = await Promise.all([
        apiClient.get("/employee/expenses"),
        apiClient.get("/employee/expense-categories").catch(() => ({ data: [] })),
        apiClient.get("/employee/clients").catch(() => ({ data: [] })),
      ]);

      setExpenses(Array.isArray(expRes.data) ? expRes.data : []);
      const cats = Array.isArray(catRes.data) ? catRes.data : [];
      setCategories(cats);
      if (cats.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: cats[0]._id || cats[0].id }));
      }
      setClients(Array.isArray(clientRes.data) ? clientRes.data : []);
    } catch (err) {
      showError(err.response?.data?.message || "Failed to load expense history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showError("Receipt file must be under 10 MB.");
      return;
    }
    setReceiptLabel(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, receipt: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount || !formData.categoryId) {
      showError("Title, Amount, and Category are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post("/employee/expenses", formData);
      showSuccess("Expense submitted successfully! Awaiting Admin review.");
      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        categoryId: categories.length > 0 ? (categories[0]._id || categories[0].id) : "",
        clientId: "",
        receipt: "",
        remarks: "",
      });
      setReceiptLabel("");
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to submit expense claim.");
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalSubmitted = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalApproved = expenses
    .filter((e) => e.status === "Approved")
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalPending = expenses
    .filter((e) => e.status === "Pending")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const filteredExpenses = expenses.filter((e) => {
    if (activeFilter === "ALL") return true;
    return e.status === activeFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-left">
      {/* Notifications */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm font-medium">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-medium">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header with Apply Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <IndianRupee size={22} className="text-blue-600" /> Expense Claims & Reimbursements
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Submit business expenses, upload receipts, and track claim approval status
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20 transition-all"
        >
          <Plus size={15} /> Submit New Expense
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Claimed</span>
            <div className="text-xl font-black text-slate-800 mt-0.5">₹{totalSubmitted.toLocaleString("en-IN")}</div>
            <span className="text-[11px] text-slate-500 font-semibold">{expenses.length} claims filed</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <IndianRupee size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Approved & Settled</span>
            <div className="text-xl font-black text-emerald-600 mt-0.5">₹{totalApproved.toLocaleString("en-IN")}</div>
            <span className="text-[11px] text-emerald-700 font-semibold">
              {expenses.filter((e) => e.status === "Approved").length} approved
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Under Review</span>
            <div className="text-xl font-black text-amber-600 mt-0.5">₹{totalPending.toLocaleString("en-IN")}</div>
            <span className="text-[11px] text-amber-700 font-semibold">
              {expenses.filter((e) => e.status === "Pending").length} pending
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Main Table / History Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
            {["ALL", "Pending", "Approved", "Rejected"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === f ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {f === "ALL" ? "All Claims" : f}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-medium">Showing {filteredExpenses.length} records</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Date</th>
                <th className="px-6 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Expense Item</th>
                <th className="px-6 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Category</th>
                <th className="px-6 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Client</th>
                <th className="px-6 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Amount</th>
                <th className="px-6 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-right">Receipt / Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((item) => (
                <tr key={item._id || item.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-slate-700 whitespace-nowrap">
                    {item.date ? new Date(item.date).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 text-sm">{item.title}</div>
                    {item.description && item.description !== item.title && (
                      <div className="text-xs text-slate-500 truncate max-w-xs">{item.description}</div>
                    )}
                    {item.adminRemark && (
                      <div className="mt-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <MessageSquare size={11} /> Admin Remark: {item.adminRemark}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                      {item.category?.name || "General"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                    {item.client?.name ? (
                      <span className="flex items-center gap-1">
                        <Building2 size={13} className="text-slate-400" />
                        {item.client.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Internal</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-800 whitespace-nowrap">
                    ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase border ${
                        item.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : item.status === "Rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {item.receipt ? (
                      <button
                        type="button"
                        onClick={() => setPreviewReceipt(item)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Eye size={13} /> View Bill
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No receipt</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-semibold text-sm">
                    No expense claims found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUBMIT EXPENSE MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <IndianRupee size={18} className="text-blue-600" /> Submit Business Expense
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar text-left">
              {/* Category & Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Expense Category *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="" disabled>
                      Select Category
                    </option>
                    {categories.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Related Client (Optional)</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">None / Company Internal</option>
                    {clients.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name} ({c.company || "Client"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Expense Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Client Dinner / Flight Ticket"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Date of Expense *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description & Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Provide business justification or detailed breakdown…"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Receipt Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Bill Receipt Document <span className="font-normal normal-case text-slate-400">(Image or PDF)</span>
                </label>
                <div className="border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 rounded-2xl p-4 transition-all text-center">
                  <label className="flex flex-col items-center gap-1.5 cursor-pointer text-slate-600">
                    <UploadCloud size={24} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-700">
                      {receiptLabel ? "Selected: " + receiptLabel : "Click to select Receipt / Tax Invoice"}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Additional Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Paid via corporate credit card / Personal UPI"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Submitting Claim…" : "Submit Claim for Approval"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW RECEIPT MODAL */}
      {previewReceipt && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewReceipt(null)}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h3 className="text-base font-black text-slate-800 truncate">{previewReceipt.title} — Bill Receipt</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewReceipt(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="flex-1 p-4 bg-slate-100 overflow-y-auto flex items-center justify-center min-h-[350px]">
              {previewReceipt.receipt?.startsWith("data:application/pdf") || previewReceipt.receipt?.endsWith(".pdf") ? (
                <iframe src={previewReceipt.receipt} title="Receipt" className="w-full h-[500px] rounded-xl border" />
              ) : (
                <img
                  src={previewReceipt.receipt}
                  alt="Receipt"
                  className="max-h-[500px] max-w-full rounded-xl object-contain shadow-sm"
                />
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between">
              <span className="text-xs text-slate-600 font-bold">
                Amount: ₹{Number(previewReceipt.amount || 0).toLocaleString("en-IN")}
              </span>
              <a
                href={previewReceipt.receipt}
                download={`Receipt-${previewReceipt.title}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ExternalLink size={13} /> Open / Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
