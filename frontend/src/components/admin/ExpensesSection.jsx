import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  DollarSign,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Building2,
  Users,
  FileText,
  UploadCloud,
  Check,
  X,
  Filter,
  Receipt,
  ExternalLink,
} from "lucide-react";
import apiClient from "../../services/apiClient.js";

const formatFileUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const apiBase = (apiClient.defaults?.baseURL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
  return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function ExpensesSection({
  expenses = [],
  expenseFilterDate,
  setExpenseFilterDate,
  toLocalDateStr = (d) => d ? new Intl.DateTimeFormat("en-CA").format(new Date(d)) : "",
  expenseForm,
  setExpenseForm,
  handleExpenseSubmit,
  handleEditExpenseClick,
  handleDeleteExpense,
  expenseLoading,
  loading,
  formatDate,
  openTextModal,
  fetchExpenses,
}) {
  const [activeTab, setActiveTab] = useState("company"); // "company" | "claims" | "clients"
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientExpenseData, setClientExpenseData] = useState(null);
  const [clientLoading, setClientLoading] = useState(false);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [reviewAction, setReviewAction] = useState("Approved"); // "Approved" | "Rejected"
  const [adminRemark, setAdminRemark] = useState("");
  const [reviewing, setReviewing] = useState(false);

  // Receipt Modal State
  const [receiptModalUrl, setReceiptModalUrl] = useState(null);

  // Local state for bill receipt when adding corporate expense
  const [corporateReceipt, setCorporateReceipt] = useState("");
  const [corporateReceiptName, setCorporateReceiptName] = useState("");

  // Segregation filter & employee list state
  const [expenseTargetFilter, setExpenseTargetFilter] = useState("all"); // "all" | "company" | "client" | "employee"
  const [expenseTargetType, setExpenseTargetType] = useState("company"); // "company" | "client" | "employee"
  const [employeeList, setEmployeeList] = useState([]);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await apiClient.get("/admin/employee/list");
        const list = res.data?.employees || res.data?.data || res.data;
        if (Array.isArray(list)) setEmployeeList(list);
      } catch (err) {
        console.error("Failed to load employees for expense selector", err);
      }
    }
    loadEmployees();
  }, []);

  // Fetch clients for dropdown selection
  useEffect(() => {
    async function loadClients() {
      try {
        const res = await apiClient.get("/admin/clients");
        const list = res.data?.clients || res.data?.data || res.data;
        setClients(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to load clients", err);
        setClients([]);
      }
    }
    loadClients();
  }, []);

  // Fetch client expense history when client selected
  useEffect(() => {
    if (!selectedClientId) {
      setClientExpenseData(null);
      return;
    }
    async function fetchClientExpenses() {
      try {
        setClientLoading(true);
        const res = await apiClient.get(`/admin/expenses/client/${selectedClientId}`);
        setClientExpenseData(res.data?.data || res.data || null);
      } catch (err) {
        console.error("Failed to load client expenses", err);
      } finally {
        setClientLoading(false);
      }
    }
    fetchClientExpenses();
  }, [selectedClientId]);

  // Handle Review Submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedClaim?._id) return;
    try {
      setReviewing(true);
      await apiClient.patch(`/admin/expenses/${selectedClaim._id}/review`, {
        status: reviewAction,
        adminRemark: adminRemark || (reviewAction === "Approved" ? "Approved by Admin" : "Rejected by Admin"),
      });
      setReviewModalOpen(false);
      setSelectedClaim(null);
      setAdminRemark("");
      if (typeof fetchExpenses === "function") {
        fetchExpenses();
      } else {
        window.location.reload();
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update claim review");
    } finally {
      setReviewing(false);
    }
  };

  // Defensive fallbacks
  const safeExpenses = Array.isArray(expenses)
    ? expenses
    : (expenses?.data && Array.isArray(expenses.data) ? expenses.data : []);
  const safeForm = expenseForm || {};
  const safeClients = Array.isArray(clients)
    ? clients
    : (Array.isArray(clients?.clients)
      ? clients.clients
      : (Array.isArray(clients?.data) ? clients.data : []));

  // Employee claims filter
  const employeeClaims = safeExpenses.filter(e => e && (e.employee || e.employeeId));
  const pendingClaims = employeeClaims.filter(e => e.status === "Pending");
  const approvedClaims = employeeClaims.filter(e => e.status === "Approved");

  // Tri-fold segregation:
  // 1. Client Expenses (Client Hospitality & Project Expenses)
  // 2. Employee Expenses (Claims & Allowances)
  // 3. Company Expenses (Overhead & Operations)
  const clientExpenses = safeExpenses.filter(e => e && (e.client || e.clientId));
  const employeeExpenses = safeExpenses.filter(e => e && (e.employee || e.employeeId));
  const companyExpenses = safeExpenses.filter(e => e && !e.client && !e.clientId && !e.employee && !e.employeeId);

  const totalExpense = safeExpenses.filter(e => e && (e.type === "Expense" || !e.type)).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalIncome = safeExpenses.filter(e => e && e.type === "Income").reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalCompanyAmount = companyExpenses.filter(e => e && (e.type === "Expense" || !e.type)).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalClientAmount = clientExpenses.filter(e => e && (e.type === "Expense" || !e.type)).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalEmployeeAmount = employeeExpenses.filter(e => e && (e.type === "Expense" || !e.type)).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalPendingAmount = pendingClaims.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const targetFilterStr = expenseFilterDate ? toLocalDateStr(expenseFilterDate) : null;
  let baseFiltered = targetFilterStr
    ? safeExpenses.filter(e => e && e.date === targetFilterStr)
    : safeExpenses;

  if (expenseTargetFilter === "company") {
    baseFiltered = baseFiltered.filter(e => !e.client && !e.clientId && !e.employee && !e.employeeId);
  } else if (expenseTargetFilter === "client") {
    baseFiltered = baseFiltered.filter(e => e.client || e.clientId);
  } else if (expenseTargetFilter === "employee") {
    baseFiltered = baseFiltered.filter(e => e.employee || e.employeeId);
  }
  const filteredExpenses = baseFiltered;

  const grouped = filteredExpenses.reduce((groups, item) => {
    if (!item) return groups;
    const date = item.date || "Unknown Date";
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => {
    const timeA = new Date(a).getTime() || 0;
    const timeB = new Date(b).getTime() || 0;
    return timeB - timeA;
  });

  const handleReceiptUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Receipt size exceeds 10MB limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCorporateReceipt(reader.result);
      setCorporateReceiptName(file.name);
      if (setExpenseForm) {
        setExpenseForm(prev => ({ ...prev, receipt: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Corporate Expense & Claims Hub</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Review employee claims, manage corporate transactions, and track client expenditures
          </p>
        </div>
      </div>

      {/* Metric Cards: Segregated into Company, Client, and Employee */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          onClick={() => setExpenseTargetFilter(expenseTargetFilter === "company" ? "all" : "company")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            expenseTargetFilter === "company" ? "ring-2 ring-blue-600 border-blue-500 bg-blue-50/20" : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="space-y-1 text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              🏢 Company Overhead
            </span>
            <div className="text-2xl font-black text-blue-700">₹{totalCompanyAmount.toLocaleString("en-IN")}</div>
            <p className="text-[11px] text-slate-500 font-medium">
              {companyExpenses.length} records &bull; Office, software & operations
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Building2 size={24} />
          </div>
        </div>

        <div
          onClick={() => setExpenseTargetFilter(expenseTargetFilter === "client" ? "all" : "client")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            expenseTargetFilter === "client" ? "ring-2 ring-indigo-600 border-indigo-500 bg-indigo-50/20" : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="space-y-1 text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              🤝 Client Hospitality & Visits
            </span>
            <div className="text-2xl font-black text-indigo-700">₹{totalClientAmount.toLocaleString("en-IN")}</div>
            <p className="text-[11px] text-slate-500 font-medium">
              {clientExpenses.length} records &bull; Meetings, hospitality & dining
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <DollarSign size={24} />
          </div>
        </div>

        <div
          onClick={() => setExpenseTargetFilter(expenseTargetFilter === "employee" ? "all" : "employee")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            expenseTargetFilter === "employee" ? "ring-2 ring-emerald-600 border-emerald-500 bg-emerald-50/20" : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="space-y-1 text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              👥 Employee Claims & Allowances
            </span>
            <div className="text-2xl font-black text-emerald-700">₹{totalEmployeeAmount.toLocaleString("en-IN")}</div>
            <p className="text-[11px] text-slate-500 font-medium">
              {employeeExpenses.length} records &bull; Travel, welfare & claims
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("company")}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "company"
              ? "border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <DollarSign size={16} /> Company Transactions
        </button>
        <button
          onClick={() => setActiveTab("claims")}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === "claims"
              ? "border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users size={16} /> Employee Claims Review
          {pendingClaims.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white">
              {pendingClaims.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: COMPANY TRANSACTIONS */}
      {activeTab === "company" && (
        <div className="space-y-6">
          {/* Categorized Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/60 shadow-xs p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Classification:</span>
              <button
                type="button"
                onClick={() => setExpenseTargetFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  expenseTargetFilter === "all" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Expenses ({safeExpenses.length})
              </button>
              <button
                type="button"
                onClick={() => setExpenseTargetFilter("company")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  expenseTargetFilter === "company" ? "bg-blue-600 text-white shadow-xs" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                🏢 Company Overhead (₹{totalCompanyAmount.toLocaleString("en-IN")})
              </button>
              <button
                type="button"
                onClick={() => setExpenseTargetFilter("client")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  expenseTargetFilter === "client" ? "bg-indigo-600 text-white shadow-xs" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                🤝 Client Visits (₹{totalClientAmount.toLocaleString("en-IN")})
              </button>
              <button
                type="button"
                onClick={() => setExpenseTargetFilter("employee")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  expenseTargetFilter === "employee" ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                👥 Employee Claims (₹{totalEmployeeAmount.toLocaleString("en-IN")})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <DatePicker
                selected={expenseFilterDate}
                onChange={d => setExpenseFilterDate(d)}
                placeholderText="Select Date"
                dateFormat="dd/MM/yyyy"
                isClearable
                className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 cursor-pointer outline-none w-32 text-center"
              />
              {expenseFilterDate && (
                <button
                  onClick={() => setExpenseFilterDate(null)}
                  className="text-xs text-rose-600 font-bold hover:underline cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-4 sm:p-5 h-fit lg:sticky lg:top-24">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  {safeForm._id ? "Edit Transaction" : "New Transaction"}
                </h4>
                {safeForm._id && (
                  <button
                    type="button"
                    onClick={() => {
                      if (setExpenseForm) {
                        setExpenseForm({
                          date: toLocalDateStr(new Date()),
                          type: "Expense",
                          amount: "",
                          name: "",
                          project: "",
                          description: "",
                          clientId: "",
                        });
                      }
                      setCorporateReceipt("");
                      setCorporateReceiptName("");
                    }}
                    className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleExpenseSubmit} className="space-y-2.5 text-left">
                {/* Row 1: Date & Type */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date *</label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                      value={safeForm.date || ""}
                      onChange={e => setExpenseForm && setExpenseForm({ ...safeForm, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type *</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                      value={safeForm.type || "Expense"}
                      onChange={e => setExpenseForm && setExpenseForm({ ...safeForm, type: e.target.value })}
                      required
                    >
                      <option value="Expense">Expense</option>
                      <option value="Income">Income</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Amount & Payee */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount (₹) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                      value={safeForm.amount ?? ""}
                      onChange={e => setExpenseForm && setExpenseForm({ ...safeForm, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payee / Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Client Lunch, AWS"
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                      value={safeForm.name || ""}
                      onChange={e => setExpenseForm && setExpenseForm({ ...safeForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Expense Classification Target Selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Classification *</label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setExpenseTargetType("company");
                        if (setExpenseForm) setExpenseForm(prev => ({ ...prev, clientId: "", employeeId: "" }));
                      }}
                      className={`py-1 text-[10px] font-bold rounded-md transition cursor-pointer text-center ${
                        expenseTargetType === "company" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      🏢 Company
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExpenseTargetType("client");
                        if (setExpenseForm) setExpenseForm(prev => ({ ...prev, employeeId: "" }));
                      }}
                      className={`py-1 text-[10px] font-bold rounded-md transition cursor-pointer text-center ${
                        expenseTargetType === "client" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      🤝 Client
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExpenseTargetType("employee");
                        if (setExpenseForm) setExpenseForm(prev => ({ ...prev, clientId: "" }));
                      }}
                      className={`py-1 text-[10px] font-bold rounded-md transition cursor-pointer text-center ${
                        expenseTargetType === "employee" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      👥 Employee
                    </button>
                  </div>
                </div>

                {/* Conditional Client Selector */}
                {expenseTargetType === "client" && (
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Client (Project / Visit) *</label>
                    <select
                      className="w-full bg-slate-50 border border-indigo-200 hover:border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                      value={safeForm.clientId || ""}
                      onChange={e => setExpenseForm && setExpenseForm({ ...safeForm, clientId: e.target.value })}
                      required={expenseTargetType === "client"}
                    >
                      <option value="">-- Choose Client --</option>
                      {safeClients.map(c => (
                        <option key={c._id} value={c._id}>{c.name || c.companyName}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Conditional Employee Selector */}
                {expenseTargetType === "employee" && (
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Employee (Benefit / Claim) *</label>
                    <select
                      className="w-full bg-slate-50 border border-emerald-200 hover:border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                      value={safeForm.employeeId || ""}
                      onChange={e => setExpenseForm && setExpenseForm({ ...safeForm, employeeId: e.target.value })}
                      required={expenseTargetType === "employee"}
                    >
                      <option value="">-- Choose Employee --</option>
                      {employeeList.map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} ({emp.employeeId || emp.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Row 3: Project Ref & Receipt */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project Ref</label>
                    <input
                      type="text"
                      placeholder="e.g. Phase 1"
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                      value={safeForm.project || ""}
                      onChange={e => setExpenseForm && setExpenseForm({ ...safeForm, project: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Receipt</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleReceiptUpload}
                      className="w-full text-[10px] text-slate-500 file:mr-1 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {corporateReceiptName && <p className="text-[10px] text-emerald-600 font-semibold truncate">{corporateReceiptName}</p>}
                  </div>
                </div>

                {/* Row 4: Notes */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notes</label>
                  <textarea
                    rows={1}
                    placeholder="Enter details or payment method..."
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                    value={safeForm.description || ""}
                    onChange={e => setExpenseForm && setExpenseForm({ ...safeForm, description: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 mt-1"
                  disabled={loading}
                >
                  {loading ? "Saving..." : safeForm._id ? "✓ Update Record" : "+ Save Transaction"}
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 space-y-4">
              {expenseLoading ? (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-12 text-center text-slate-400 font-semibold text-sm">
                  Loading transaction records...
                </div>
              ) : sortedDates.length > 0 ? (
                sortedDates.map(dateStr => (
                  <div key={dateStr} className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
                    <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                      <h4 className="text-sm font-black text-slate-800">{formatDate(dateStr)}</h4>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-200/60 px-2.5 py-0.5 rounded-md">
                        {grouped[dateStr].length} {grouped[dateStr].length === 1 ? "entry" : "entries"}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {grouped[dateStr].map(rec => {
                        const isExpense = rec.type === "Expense" || !rec.type;
                        const isIncome = rec.type === "Income";

                        return (
                          <div key={rec._id} className="p-4 sm:p-5 flex flex-wrap justify-between items-center gap-4 hover:bg-slate-50/30 transition-colors">
                            <div className="space-y-1 text-left flex-1 min-w-[200px]">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  isExpense ? "bg-rose-50 text-rose-700 border border-rose-200" :
                                  isIncome ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                  "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}>
                                  {rec.type || "Expense"}
                                </span>

                                {/* Prominent Tag: Company vs Client vs Employee */}
                                {rec.client ? (
                                  <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    🤝 Client: {rec.client.name || rec.client.companyName || "Client"}
                                  </span>
                                ) : rec.employee ? (
                                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    👥 Employee: {rec.employee.name || "Staff"}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    🏢 Company Overhead
                                  </span>
                                )}

                                <strong className="text-slate-800 font-bold text-sm">{rec.name}</strong>
                                {rec.project && (
                                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                    Proj: {rec.project}
                                  </span>
                                )}
                              </div>

                              {rec.description && (
                                <p className="text-xs text-slate-500 cursor-pointer hover:text-blue-700 transition" onClick={() => openTextModal("Transaction Details", rec.description)}>
                                  {rec.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-3 ml-auto">
                              {rec.receipt && (
                                <button
                                  onClick={() => setReceiptModalUrl(rec.receipt)}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                                  title="View Receipt"
                                >
                                  <Receipt size={14} /> Receipt
                                </button>
                              )}

                              <div className={`text-base font-black ${isExpense ? "text-rose-600" : isIncome ? "text-emerald-600" : "text-amber-600"}`}>
                                ₹{Number(rec.amount || 0).toLocaleString("en-IN")}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditExpenseClick(rec)}
                                  className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(rec._id)}
                                  className="p-1.5 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-700 transition cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-12 text-center text-slate-400 font-semibold text-sm">
                  No transactions recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMPLOYEE CLAIMS REVIEW */}
      {activeTab === "claims" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="text-base font-black text-slate-800">Employee Expense Claims</h4>
              <p className="text-xs text-slate-500">Review, verify receipts, and approve or reject reimbursement requests</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr>
                  {["Employee", "Date", "Category / Desc", "Amount", "Receipt", "Status", "Admin Action"].map(h => (
                    <th key={h} className="px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employeeClaims.length > 0 ? (
                  employeeClaims.map(claim => {
                    const empName = typeof claim.employee?.name === 'string'
                      ? claim.employee.name
                      : (claim.employee?.name?.first ? `${claim.employee.name.first} ${claim.employee.name.last}` : "Employee");

                    return (
                      <tr key={claim._id} className="hover:bg-slate-50/40 border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3.5 text-sm">
                          <span className="font-bold text-slate-800 block">{empName}</span>
                          <span className="text-[10px] text-slate-400">{claim.employee?.employeeId || "Staff"}</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                          {formatDate(claim.date)}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-700 max-w-[200px]">
                          <span className="font-bold text-blue-700 block">{claim.category?.name || "General"}</span>
                          <span className="text-slate-500 truncate block">{claim.description}</span>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-black text-slate-900">
                          ₹{Number(claim.amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3.5">
                          {claim.receipt ? (
                            <button
                              onClick={() => setReceiptModalUrl(claim.receipt)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                            >
                              <Receipt size={12} /> View Bill
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No bill</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-lg border ${
                            claim.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            claim.status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {claim.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {claim.status === "Pending" ? (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedClaim(claim);
                                    setReviewAction("Approved");
                                    setAdminRemark("Approved for payment");
                                    setReviewModalOpen(true);
                                  }}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedClaim(claim);
                                    setReviewAction("Rejected");
                                    setAdminRemark("Invalid bill receipt or reason");
                                    setReviewModalOpen(true);
                                  }}
                                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                {claim.adminRemark ? `Remark: ${claim.adminRemark}` : "Done"}
                              </span>
                            )}
                            {handleDeleteExpense && (
                              <button
                                onClick={() => handleDeleteExpense(claim._id || claim.id)}
                                title="Delete Expense Claim"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7">
                      <div className="text-center py-12 text-slate-400">
                        <Users size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-semibold text-slate-600">No employee expense claims submitted yet</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Claim Modal */}
      {reviewModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-base font-black text-slate-800">
                {reviewAction === "Approved" ? "Approve Expense Claim" : "Reject Expense Claim"}
              </h4>
              <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl text-xs text-slate-600">
              <div><strong>Employee:</strong> {typeof selectedClaim.employee?.name === 'string' ? selectedClaim.employee.name : "Employee"}</div>
              <div><strong>Amount:</strong> ₹{Number(selectedClaim.amount || 0).toLocaleString("en-IN")}</div>
              <div><strong>Category:</strong> {selectedClaim.category?.name || "General"}</div>
              <div><strong>Date:</strong> {formatDate(selectedClaim.date)}</div>
              <div><strong>Description:</strong> {selectedClaim.description}</div>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Admin Remark / Reason</label>
                <textarea
                  rows={3}
                  value={adminRemark}
                  onChange={e => setAdminRemark(e.target.value)}
                  placeholder="Enter remarks for the employee..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewing}
                  className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition ${
                    reviewAction === "Approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {reviewing ? "Processing..." : `Confirm ${reviewAction}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Receipt Preview Modal */}
      {receiptModalUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Receipt size={18} className="text-blue-600" />
                Bill Receipt Viewer
              </h4>
              <button onClick={() => setReceiptModalUrl(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-3 bg-slate-50 rounded-xl">
              {receiptModalUrl.startsWith("data:application/pdf") || receiptModalUrl.endsWith(".pdf") ? (
                <iframe
                  src={formatFileUrl(receiptModalUrl)}
                  title="Receipt"
                  className="w-full h-[60vh] rounded-lg border border-slate-200"
                />
              ) : receiptModalUrl.startsWith("data:image/") ||
                receiptModalUrl.match(/\.(jpeg|jpg|png|gif|webp|svg)($|\?)/i) ||
                receiptModalUrl.startsWith("/uploads/") ? (
                <img
                  src={formatFileUrl(receiptModalUrl)}
                  alt="Bill Receipt"
                  className="max-h-[60vh] object-contain rounded-lg shadow-xs"
                />
              ) : (
                <div className="text-center py-10 space-y-3">
                  <FileText size={48} className="mx-auto text-blue-500" />
                  <p className="text-sm font-semibold text-slate-700">Bill receipt attached as document</p>
                  <a
                    href={formatFileUrl(receiptModalUrl)}
                    target="_blank"
                    rel="noreferrer"
                    download="bill_receipt"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                  >
                    <ExternalLink size={14} /> Download / View File
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <a
                href={formatFileUrl(receiptModalUrl)}
                target="_blank"
                rel="noreferrer"
                download="bill_receipt"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition"
              >
                <ExternalLink size={13} /> Open in New Tab
              </a>
              <button
                onClick={() => setReceiptModalUrl(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
