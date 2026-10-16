import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Receipt,
  Building2,
  Calendar,
  CreditCard,
  Upload,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  User,
  Tag,
  Info,
} from "lucide-react";
import crmClientService from "../../services/crmClientService.js";
import { useCrmToast } from "../../components/crm/layout/CrmLayout.jsx";

const EXPENSE_CATEGORIES = [
  "Vendor Payment",
  "Candidate Processing",
  "Travel",
  "Documentation",
  "Accommodation",
  "Other",
];

const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "UPI",
  "Cheque",
  "Other",
];

const EXPENSE_STATUSES = [
  "Pending",
  "Approved",
  "Paid",
];

export default function RecordClientExpensePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { expenseId } = useParams();
  const initialClientId = searchParams.get("clientId") || "";
  const { showToast } = useCrmToast() || { showToast: (msg) => console.log(msg) };

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingExpense, setLoadingExpense] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const [formData, setFormData] = useState({
    clientId: initialClientId,
    clientName: "",
    projectId: "",
    projectName: "",
    categoryName: "Vendor Payment",
    title: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer",
    paidTo: "",
    transactionReference: "",
    recordedBy: "Admin",
    status: "Paid",
    remarks: "",
    proofUrl: "",
    proofName: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  
  useEffect(() => {
    const fetchClients = async () => {
      setLoadingClients(true);
      try {
        const res = await crmClientService.getClients({ limit: 200 });
        const list = Array.isArray(res?.clients) ? res.clients : Array.isArray(res) ? res : [];
        setClients(list);

        if (initialClientId && !expenseId) {
          const found = list.find((c) => String(c.id || c._id) === String(initialClientId));
          if (found) {
            setSelectedClient(found);
            setFormData((prev) => ({
              ...prev,
              clientId: found.id || found._id,
              clientName: found.companyName || found.name || "",
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch clients:", err);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, [initialClientId, expenseId]);

  
  useEffect(() => {
    if (expenseId) {
      const loadExpenseData = async () => {
        setLoadingExpense(true);
        try {
          const allExp = await crmClientService.getAllExpenses();
          const target = allExp.find((e) => String(e.id || e._id) === String(expenseId));
          if (target) {
            setFormData({
              clientId: target.clientId || "",
              clientName: target.clientName || target.client?.name || "",
              projectId: target.projectId || "",
              projectName: target.projectName || "",
              categoryName: target.categoryName || target.category?.name || "Vendor Payment",
              title: target.title || "",
              description: target.description || target.title || "",
              amount: String(target.amount || ""),
              date: target.date ? new Date(target.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
              paymentMethod: target.paymentMethod || target.paymentMode || "Bank Transfer",
              paidTo: target.paidTo || "",
              transactionReference: target.transactionReference || target.transactionRef || "",
              recordedBy: target.recordedBy || "Admin",
              status: target.status || "Paid",
              remarks: target.remarks || target.notes || "",
              proofUrl: target.proofUrl || target.receipt || "",
              proofName: "",
            });
          }
        } catch (err) {
          console.error("Failed to load expense for edit:", err);
          showToast("Failed to load expense details", "error");
        } finally {
          setLoadingExpense(false);
        }
      };
      loadExpenseData();
    }
  }, [expenseId]);

  const handleClientChange = (e) => {
    const cId = e.target.value;
    const found = clients.find((c) => String(c.id || c._id) === String(cId));
    setSelectedClient(found || null);
    setFormData((prev) => ({
      ...prev,
      clientId: cId,
      clientName: found?.companyName || found?.name || "",
      projectId: "",
      projectName: "",
    }));
    if (errors.clientId) setErrors((prev) => ({ ...prev, clientId: "" }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        proofUrl: reader.result,
        proofName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs = {};
    if (!formData.clientId) errs.clientId = "Please select a client";
    if (!formData.amount || Number(formData.amount) <= 0) {
      errs.amount = "Expense amount must be greater than zero";
    }
    if (!formData.description.trim()) {
      errs.description = "Expense description / purpose is required";
    }
    if (!formData.date) errs.date = "Payment date is required";
    if (formData.status === "Paid" && !formData.transactionReference.trim()) {
      errs.transactionReference = "Transaction reference / UTR is required when status is Paid";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        title: formData.description.slice(0, 60),
        amount: parseFloat(formData.amount),
        date: new Date(formData.date),
      };

      if (expenseId) {
        await crmClientService.updateClientExpense(expenseId, payload);
        showToast("Expense record updated successfully!", "success");
      } else {
        await crmClientService.recordClientExpense(payload);
        showToast("Expense recorded successfully!", "success");
      }

      
      if (formData.clientId) {
        navigate(`/client/clients/${formData.clientId}?tab=milestones`);
      } else {
        navigate("/client/payments-expenses");
      }
    } catch (err) {
      console.error("Failed to save expense:", err);
      showToast(err.message || "Failed to record expense", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (formData.clientId) {
                navigate(`/client/clients/${formData.clientId}?tab=milestones`);
              } else {
                navigate(-1);
              }
            }}
            className="p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <TrendingDown size={22} className="text-rose-600" />
              <span>{expenseId ? "Edit Client Project Expense" : "Record Expense Paid"}</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Record project-related expenses paid to vendors, employees, or processing agents.
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider">
            Client Expense Ledger
          </span>
          <span className="text-xs font-mono font-bold text-gray-700">
            {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>
      </div>

      {}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-sm font-bold text-gray-900">1. Client & Project Details</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Specify the client organization and linked project for this expenditure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Client Organization <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.clientId}
                onChange={handleClientChange}
                disabled={Boolean(expenseId)}
                className={`w-full px-3.5 py-2.5 bg-gray-50/50 border rounded-xl text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.clientId ? "border-rose-400 bg-rose-50/20" : "border-gray-200"
                }`}
              >
                <option value="">-- Select Client --</option>
                {clients.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.companyName || c.name} {c.id ? `(${c.id})` : ""}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.clientId}</p>
              )}
            </div>

            {}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Project Name (Optional)
              </label>
              {selectedClient?.projects && selectedClient.projects.length > 0 ? (
                <select
                  value={formData.projectId}
                  onChange={(e) => {
                    const pId = e.target.value;
                    const p = selectedClient.projects.find((proj) => String(proj.id) === String(pId));
                    setFormData((prev) => ({
                      ...prev,
                      projectId: pId,
                      projectName: p?.projectName || p?.name || "",
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- General Client Project / Overhead --</option>
                  {selectedClient.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName || p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. Dubai Hospital Staffing Project"
                  value={formData.projectName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, projectName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-sm font-bold text-gray-900">2. Expense Classification & Amount</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter expense category, amount paid, and destination payee details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Expense Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.categoryName}
                onChange={(e) => setFormData((prev) => ({ ...prev, categoryName: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Expense Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, amount: e.target.value }));
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
                  }}
                  className={`w-full pl-8 pr-3.5 py-2.5 bg-gray-50/50 border rounded-xl text-sm font-black text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? "border-rose-400 bg-rose-50/20" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.amount}</p>
              )}
            </div>

            {}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Paid To (Vendor / Employee / Person)
              </label>
              <input
                type="text"
                placeholder="e.g. Al-Mansoor Travel Agency"
                value={formData.paidTo}
                onChange={(e) => setFormData((prev) => ({ ...prev, paidTo: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Expense Description / Purpose <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Flight tickets booking and medical documentation attestations for batch 12 candidates..."
              value={formData.description}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, description: e.target.value }));
                if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
              }}
              className={`w-full px-3.5 py-2.5 bg-gray-50/50 border rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                errors.description ? "border-rose-400 bg-rose-50/20" : "border-gray-200"
              }`}
            />
            {errors.description && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.description}</p>
            )}
          </div>
        </div>

        {}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-sm font-bold text-gray-900">3. Payment Method & Status</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Track actual payment status. Only Paid expenses are deducted in Net Cash Flow calculations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Expense Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {EXPENSE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            {}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Transaction Ref / UTR {formData.status === "Paid" && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="text"
                placeholder="e.g. UTR-98234190"
                value={formData.transactionReference}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, transactionReference: e.target.value }));
                  if (errors.transactionReference) setErrors((prev) => ({ ...prev, transactionReference: "" }));
                }}
                className={`w-full px-3.5 py-2.5 bg-gray-50/50 border rounded-xl text-xs font-mono font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                  errors.transactionReference ? "border-rose-400 bg-rose-50/20" : "border-gray-200"
                }`}
              />
              {errors.transactionReference && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.transactionReference}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Recorded By
              </label>
              <input
                type="text"
                value={formData.recordedBy}
                onChange={(e) => setFormData((prev) => ({ ...prev, recordedBy: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Remarks / Audit Note (Optional)
              </label>
              <input
                type="text"
                placeholder="Additional audit remarks..."
                value={formData.remarks}
                onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {}
          <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/50">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Bill / Invoice / Payment Proof Attachment (Optional)
            </label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-2xs">
                <Upload size={14} className="text-gray-500" />
                <span>Choose File (Image / PDF)</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {formData.proofName && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  {formData.proofName}
                </span>
              )}
            </div>
          </div>
        </div>

        {}
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900">
          <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <p>
            <strong>Note on Cash Flow:</strong> Client milestone amounts will <strong>not</strong> be reduced by recording project expenses. Revenue milestones and expenses are tracked independently to calculate the exact Net Cash Flow (Total Received minus Total Paid Expenses).
          </p>
        </div>

        {}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              if (formData.clientId) {
                navigate(`/client/clients/${formData.clientId}?tab=milestones`);
              } else {
                navigate(-1);
              }
            }}
            className="px-5 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span>Saving Expense...</span>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>{expenseId ? "Update Expense Record" : "Save Expense Record"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
