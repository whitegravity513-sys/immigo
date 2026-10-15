import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CreditCard,
  Receipt,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Clock,
  Search,
  Download,
  Plus,
  RefreshCw,
  Building2,
  Calendar,
  Eye,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  X,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import crmClientService from "../../services/crmClientService.js";
import LoadingSkeleton from "../../components/crm/ui/LoadingSkeleton.jsx";
import TransactionDetailModal from "../../components/crm/payments/TransactionDetailModal.jsx";
import { useCrmToast } from "../../components/crm/layout/CrmLayout.jsx";

const TABS = [
  { id: "all", label: "All Transactions" },
  { id: "received", label: "Payment Received" },
  { id: "expenses", label: "Expenses Paid" },
  { id: "pending_verification", label: "Pending Verification" },
  { id: "pending_expenses", label: "Pending Expenses" },
];

const PAYMENT_METHODS = [
  "All",
  "Cash",
  "Bank Transfer",
  "UPI",
  "Cheque",
  "Other",
];

export default function PaymentsExpensesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialClientId = searchParams.get("clientId") || "";
  const initialTab = searchParams.get("tab") || "all";
  const { showToast } = useCrmToast() || { showToast: (msg) => console.log(msg) };

  // Data states
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState(initialTab);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(initialClientId);
  const [selectedMethod, setSelectedMethod] = useState("All");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) setActiveTab(tabParam);
    const clientParam = searchParams.get("clientId");
    if (clientParam) setSelectedClient(clientParam);
  }, [searchParams]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = newest first

  // Voucher Detail Modal
  const [viewingTx, setViewingTx] = useState(null);
  const [viewingType, setViewingType] = useState("payment");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadClients();
    loadAllData();
  }, []);

  const loadClients = async () => {
    try {
      const res = await crmClientService.getClients({ limit: 200 });
      const list = Array.isArray(res?.clients) ? res.clients : Array.isArray(res) ? res : [];
      setClients(list);
    } catch (err) {
      console.error("Failed to load clients:", err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, expensesRes] = await Promise.all([
        crmClientService.getClientPayments({ limit: 500 }),
        crmClientService.getAllExpenses(),
      ]);

      setPayments(paymentsRes?.payments || []);
      setExpenses(Array.isArray(expensesRes) ? expensesRes : []);
    } catch (err) {
      console.error("Failed to load transaction data:", err);
      showToast("Failed to load transactions", "error");
    } finally {
      setLoading(false);
    }
  };

  // Harmonized Transactions List
  const unifiedTransactions = useMemo(() => {
    const pList = payments.map((p) => ({
      id: p.id || p._id || p.paymentId,
      rawId: p._id || p.id,
      type: "payment", // Incoming
      date: p.paymentDate || p.createdAt,
      clientId: p.clientId,
      clientName: p.clientName || "Client",
      projectId: p.projectId || "",
      projectName: p.projectName || "General Project",
      title: p.milestoneName || "Milestone Payment",
      categoryOrMilestone: p.milestoneName || "Milestone Payment",
      amount: Number(p.amountPaid) || 0,
      paymentMethod: p.paymentMethod || "Bank Transfer",
      transactionReference: p.transactionReference || "—",
      status: p.status || p.paymentStatus || "Verified",
      receivedBy: p.receivedBy || p.recordedBy || "Admin",
      paidTo: "ImmiGo (Company)",
      remarks: p.remarks || "",
      raw: p,
    }));

    const eList = expenses.map((e) => ({
      id: e.id || e._id,
      rawId: e._id || e.id,
      type: "expense", // Outgoing
      date: e.date || e.createdAt,
      clientId: e.clientId,
      clientName: e.clientName || e.client?.name || e.client?.company || "Overhead / Internal",
      projectId: e.projectId || "",
      projectName: e.projectName || "General Operations",
      title: e.title || e.description || "Expense",
      categoryOrMilestone: e.categoryName || e.category?.name || "General",
      amount: Number(e.amount) || 0,
      paymentMethod: e.paymentMethod || e.paymentMode || "Bank Transfer",
      transactionReference: e.transactionReference || e.transactionRef || "—",
      status: e.status || "Paid",
      receivedBy: e.recordedBy || "Admin",
      paidTo: e.paidTo || "Vendor / Employee",
      remarks: e.description || e.remarks || e.notes || "",
      raw: e,
    }));

    return [...pList, ...eList];
  }, [payments, expenses]);

  // Calculations for Summary Cards
  const stats = useMemo(() => {
    const verifiedPayments = payments.filter(
      (p) =>
        !p.isReversed &&
        (p.status === "Verified" ||
          p.status === "Completed" ||
          p.paymentStatus === "Verified" ||
          p.paymentStatus === "Completed")
    );
    const totalReceived = verifiedPayments.reduce((s, p) => s + (Number(p.amountPaid) || 0), 0);

    const paidExpenses = expenses.filter((e) => e.status === "Paid");
    const totalExpensesPaid = paidExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const pendingExpenses = expenses.filter((e) => e.status === "Pending" || e.status === "Approved");
    const totalPendingExpenses = pendingExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const pendingVerification = payments.filter(
      (p) => p.status === "Pending Verification" || p.paymentStatus === "Pending Verification"
    );
    const totalPendingVerification = pendingVerification.reduce(
      (s, p) => s + (Number(p.amountPaid) || 0),
      0
    );

    const netCashFlow = totalReceived - totalExpensesPaid;

    return {
      totalReceived,
      totalExpensesPaid,
      totalPendingExpenses,
      totalPendingVerification,
      netCashFlow,
      totalTransactions: payments.length + expenses.length,
    };
  }, [payments, expenses]);

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return unifiedTransactions
      .filter((tx) => {
        // Tab filtering
        if (activeTab === "received" && tx.type !== "payment") return false;
        if (activeTab === "expenses" && tx.type !== "expense") return false;
        if (activeTab === "pending_verification") {
          if (tx.type !== "payment" || tx.status !== "Pending Verification") return false;
        }
        if (activeTab === "pending_expenses") {
          if (tx.type !== "expense" || tx.status === "Paid") return false;
        }

        // Client filter
        if (selectedClient && selectedClient !== "All" && selectedClient !== "") {
          if (String(tx.clientId) !== String(selectedClient)) return false;
        }

        // Method filter
        if (selectedMethod !== "All") {
          if (tx.paymentMethod?.toLowerCase() !== selectedMethod.toLowerCase()) return false;
        }

        // Date range
        if (startDate) {
          const txDate = new Date(tx.date).getTime();
          const start = new Date(startDate).getTime();
          if (txDate < start) return false;
        }
        if (endDate) {
          const txDate = new Date(tx.date).getTime();
          const end = new Date(endDate).setHours(23, 59, 59, 999);
          if (txDate > end) return false;
        }

        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const matches =
            tx.id?.toLowerCase().includes(q) ||
            tx.clientName?.toLowerCase().includes(q) ||
            tx.projectName?.toLowerCase().includes(q) ||
            tx.title?.toLowerCase().includes(q) ||
            tx.categoryOrMilestone?.toLowerCase().includes(q) ||
            tx.transactionReference?.toLowerCase().includes(q) ||
            tx.paidTo?.toLowerCase().includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      });
  }, [unifiedTransactions, activeTab, selectedClient, selectedMethod, startDate, endDate, search, sortOrder]);

  // Export to Excel / CSV
  const handleExport = () => {
    if (filteredTransactions.length === 0) {
      showToast("No records to export", "info");
      return;
    }

    const exportData = filteredTransactions.map((tx) => ({
      "Transaction ID": tx.id,
      Type: tx.type === "payment" ? "Payment Received" : "Expense Paid",
      Date: tx.date ? new Date(tx.date).toLocaleDateString("en-GB") : "—",
      Client: tx.clientName,
      Project: tx.projectName,
      "Category / Milestone": tx.categoryOrMilestone,
      Amount: tx.amount,
      Method: tx.paymentMethod,
      "UTR / Reference": tx.transactionReference,
      Status: tx.status,
      "Received By / Recorded By": tx.receivedBy,
      "Paid To": tx.paidTo,
      Remarks: tx.remarks,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments_Expenses");
    XLSX.writeFile(
      workbook,
      `Payments_Expenses_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    showToast("Export downloaded successfully!", "success");
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Verified":
      case "Completed":
      case "Paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Pending Verification":
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Approved":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Received":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Reversed":
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
              <Link to="/client/dashboard" className="hover:text-blue-600 transition-colors">
                Client Management
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-bold">Payments & Expenses</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2.5">
              <Receipt size={24} className="text-blue-600" />
              <span>Payments & Expense Management</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Centralized financial ledger tracking verified client receipts, outgoing project expenses, and net cash flow.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={loadAllData}
              className="p-2.5 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>

            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" />
              <span>Export CSV/Excel</span>
            </button>

            {/* Record Payment */}
            <Link
              to="/client/payments/record"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Record Payment</span>
            </Link>

            {/* Add Expense */}
            <Link
              to="/client/expenses/add"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm shadow-rose-600/25 transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Expense</span>
            </Link>
          </div>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-gray-100">
          {/* Verified Received */}
          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <Receipt size={12} />
              Total Received (Verified)
            </p>
            <p className="text-xl font-black text-emerald-800 mt-1">
              ₹{stats.totalReceived.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-emerald-700/70 mt-0.5 font-medium">
              Confirmed client receipts
            </p>
          </div>

          {/* Expenses Paid */}
          <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-4">
            <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
              <TrendingDown size={12} />
              Total Expenses Paid
            </p>
            <p className="text-xl font-black text-rose-800 mt-1">
              ₹{stats.totalExpensesPaid.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-rose-700/70 mt-0.5 font-medium">
              Disbursed to vendors/ops
            </p>
          </div>

          {/* Net Cash Flow */}
          <div
            className={`border rounded-xl p-4 ${
              stats.netCashFlow >= 0
                ? "bg-blue-50/50 border-blue-200/80 text-blue-900"
                : "bg-amber-50/50 border-amber-200/80 text-amber-900"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              {stats.netCashFlow >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              Net Cash Flow
            </p>
            <p className="text-xl font-black mt-1">
              {stats.netCashFlow < 0 ? "-" : "+"}₹{Math.abs(stats.netCashFlow).toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] opacity-75 mt-0.5 font-medium">
              Verified Inflow - Outflow
            </p>
          </div>

          {/* Pending Verification */}
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
              <Clock size={12} />
              Pending Verification
            </p>
            <p className="text-xl font-black text-amber-800 mt-1">
              ₹{stats.totalPendingVerification.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-amber-700/70 mt-0.5 font-medium">
              Requires finance audit
            </p>
          </div>

          {/* Pending Expenses */}
          <div className="bg-purple-50/50 border border-purple-200/80 rounded-xl p-4">
            <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle size={12} />
              Pending Expenses
            </p>
            <p className="text-xl font-black text-purple-800 mt-1">
              ₹{stats.totalPendingExpenses.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-purple-700/70 mt-0.5 font-medium">
              Approved claims awaiting payment
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 px-6 pt-3 flex items-center gap-2 overflow-x-auto bg-gray-50/50">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-3 text-xs font-bold transition-all relative border-b-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-gray-100 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, client, ref, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Client Filter */}
          <div>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:outline-hidden"
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.companyName || c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:outline-hidden"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m === "All" ? "All Methods" : m}
                </option>
              ))}
            </select>
          </div>

          {/* Date Start */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden"
              placeholder="Start Date"
            />
          </div>

          {/* Date End */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden"
              placeholder="End Date"
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton type="card" count={3} />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Receipt size={36} className="mx-auto text-gray-300 mb-2" />
            <h3 className="text-sm font-bold text-gray-800">No transactions found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No payment or expense records match your selected filter criteria. Try resetting filters or adding new transactions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Client Organization</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Milestone / Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method & Ref</th>
                  <th className="py-3 px-4">Paid To / By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map((tx) => {
                  const isPayment = tx.type === "payment";
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Type Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPayment
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {isPayment ? <Receipt size={11} /> : <TrendingDown size={11} />}
                          <span>{isPayment ? "Received" : "Expense"}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4">
                        <Link
                          to={`/client/clients/${tx.clientId}?tab=milestones`}
                          className="font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
                        >
                          {tx.clientName}
                        </Link>
                      </td>

                      {/* Project */}
                      <td className="py-3 px-4 text-gray-700 max-w-xs truncate">
                        {tx.projectName}
                      </td>

                      {/* Milestone / Category */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isPayment
                              ? "bg-gray-100 text-gray-800 border-gray-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {tx.categoryOrMilestone}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-black text-sm ${
                            isPayment ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {isPayment ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Method & Ref */}
                      <td className="py-3 px-4">
                        <div className="text-gray-900 font-semibold">{tx.paymentMethod}</div>
                        <div className="font-mono text-[10px] text-gray-500 truncate max-w-[120px]">
                          {tx.transactionReference}
                        </div>
                      </td>

                      {/* Payee / Receiver */}
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {isPayment ? `Rec: ${tx.receivedBy}` : `To: ${tx.paidTo}`}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            tx.status
                          )}`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            setViewingTx(tx.raw);
                            setViewingType(tx.type);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {filteredTransactions.length} of {unifiedTransactions.length} total entries</span>
          <span>Net Filtered Cash Flow: ₹{filteredTransactions.reduce((acc, t) => acc + (t.type === "payment" ? t.amount : -t.amount), 0).toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Transaction Detail Slide-over / Modal */}
      <TransactionDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setViewingTx(null);
        }}
        transaction={viewingTx}
        type={viewingType}
      />
    </div>
  );
}
