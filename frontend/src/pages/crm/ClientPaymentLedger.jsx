import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CreditCard,
  Receipt,
  IndianRupee,
  TrendingUp,
  AlertCircle,
  Clock,
  Search,
  Download,
  Plus,
  RefreshCw,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  ExternalLink,
  X,
  FileCheck,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Percent,
} from "lucide-react";
import * as XLSX from "xlsx";
import crmClientService from "../../services/crmClientService.js";
import LoadingSkeleton from "../../components/crm/ui/LoadingSkeleton.jsx";
import { useCrmToast } from "../../components/crm/layout/CrmLayout.jsx";

const PAYMENT_STATUSES = [
  "All",
  "Completed",
  "Pending",
  "Due",
  "Reversed",
];

export function ClientPaymentLedger() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialClientId = searchParams.get("clientId") || "";
  const { showToast } = useCrmToast() || { showToast: (msg) => console.log(msg) };

  // Data states
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({
    totalAgreedPayments: 0,
    totalPaymentsMade: 0,
    totalOutstandingAmount: 0,
    paymentsDueCount: 0,
    overduePaymentsCount: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  // Simplified filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(initialClientId);
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Pagination states: default 5 items
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Details modal state (Open on row click)
  const [viewingPayment, setViewingPayment] = useState(null);

  // Reversal modal state
  const [reversalModal, setReversalModal] = useState({
    isOpen: false,
    payment: null,
    reason: "",
    submitting: false,
  });

  useEffect(() => {
    loadClientsList();
    loadLedgerStats();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [page, limit, selectedClient, selectedStatus]);

  const loadClientsList = async () => {
    try {
      const res = await crmClientService.getClients({ limit: 200 });
      const clientList = Array.isArray(res?.clients)
        ? res.clients
        : Array.isArray(res)
        ? res
        : [];
      setClients(clientList);
    } catch (err) {
      console.error("Error loading clients:", err);
      setClients([]);
    }
  };

  const loadLedgerStats = async () => {
    setLoadingStats(true);
    try {
      const data = await crmClientService.getLedgerStats({
        clientId: selectedClient || undefined,
      });
      if (data) setStats(data);
    } catch (err) {
      console.error("Error loading ledger stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: searchTerm || undefined,
        clientId: selectedClient || undefined,
        paymentStatus: selectedStatus !== "All" ? selectedStatus : undefined,
      };

      const res = await crmClientService.getClientPayments(params);
      if (res) {
        setPayments(res.payments || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalCount(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Error loading payments:", err);
      showToast("Failed to load payment ledger records", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadPayments();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedClient("");
    setSelectedStatus("All");
    setPage(1);
    setSearchParams({});
    loadLedgerStats();
  };

  // Reversal workflow
  const openReversal = (payment) => {
    setReversalModal({
      isOpen: true,
      payment,
      reason: "",
      submitting: false,
    });
  };

  const submitReversal = async (e) => {
    e.preventDefault();
    if (!reversalModal.reason.trim()) {
      showToast("Please provide an audit reason for payment reversal", "error");
      return;
    }

    setReversalModal((prev) => ({ ...prev, submitting: true }));
    try {
      await crmClientService.reverseClientPayment(
        reversalModal.payment._id || reversalModal.payment.id,
        reversalModal.reason
      );
      showToast("Payment reversed successfully with audit record", "success");
      setReversalModal({ isOpen: false, payment: null, reason: "", submitting: false });
      if (viewingPayment) setViewingPayment(null);
      loadPayments();
      loadLedgerStats();
    } catch (err) {
      console.error("Reversal error:", err);
      showToast(err.message || "Failed to reverse payment transaction", "error");
      setReversalModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Export functions
  const formatExportRows = (items) => {
    return items.map((p) => ({
      "Payment ID": p.paymentId || p._id,
      "Payment Date": p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-GB") : "—",
      "Client Name": p.clientName || "—",
      "Project Name": p.projectName || "—",
      "Candidate Name": p.candidateName || "—",
      "Milestone Name": p.milestoneName || "—",
      "Agreed Milestone Amount (INR)": p.agreedMilestoneAmount || 0,
      "Amount Paid (INR)": p.amountPaid || 0,
      "Remaining Milestone Balance (INR)": p.remainingMilestoneBalance || 0,
      "Payment Method": p.paymentMethod || "—",
      "UTR / Transaction Reference": p.transactionReference || "—",
      "GST Treatment": p.gstTreatment || "Not Applicable",
      "GST Rate (%)": p.gstRate || 0,
      "GST Amount (INR)": p.gstAmount || 0,
      "Total Transaction Amount (INR)": p.totalTransactionAmount || p.amountPaid || 0,
      "Payment Status": p.paymentStatus || "Completed",
      "Recorded By": p.recordedByName || "—",
      Remarks: p.remarks || "—",
    }));
  };

  const exportExcel = () => {
    try {
      const exportData = formatExportRows(payments);
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Client Payments Ledger");
      const filename = `Client_Payment_Ledger_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      showToast("Ledger exported to Excel successfully", "success");
    } catch (err) {
      console.error("Error exporting to Excel:", err);
      showToast("Failed to export Excel file", "error");
    }
  };

  const exportCSV = () => {
    try {
      const exportData = formatExportRows(payments);
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Client_Payment_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Ledger exported to CSV successfully", "success");
    } catch (err) {
      console.error("Error exporting to CSV:", err);
      showToast("Failed to export CSV file", "error");
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    try {
      return new Date(isoString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
              <Link to="/client/dashboard" className="hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <span className="text-gray-300">/</span>
              <Link to="/client/clients" className="hover:text-blue-600 transition-colors">
                Clients
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 font-bold">Client Payment Ledger</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
              <Receipt className="text-blue-600" size={26} />
              <span>Client Payment Ledger</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Centralized financial ledger tracking manpower recruitment, visa processing, and candidate selection milestone disbursements made to clients.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                loadPayments();
                loadLedgerStats();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-blue-600" : ""} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={exportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 shadow-2xs transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Excel (.xlsx)</span>
            </button>

            {/* Direct navigation to New Page - No Popup */}
            <Link
              to={selectedClient ? `/client/ledger/new?clientId=${selectedClient}` : "/client/ledger/new"}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/25 transition-colors"
            >
              <Plus size={16} />
              <span>Record Payment</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Agreed Payments */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <IndianRupee size={13} className="text-blue-600" />
            Total Agreed
          </p>
          <p className="text-2xl font-black text-gray-900 mt-1">
            ₹{Number(stats.totalAgreedPayments || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-gray-500 mt-1">Sum of configured milestones</p>
        </div>

        {/* Total Payments Made */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard size={13} className="text-emerald-600" />
            Total Paid
          </p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            ₹{Number(stats.totalPaymentsMade || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {stats.totalTransactions || 0} Successful Transactions
          </p>
        </div>

        {/* Total Outstanding Amount */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={13} className="text-amber-600" />
            Total Outstanding
          </p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            ₹{Number(stats.totalOutstandingAmount || 0).toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-gray-500 mt-1">Remaining company liability</p>
        </div>

        {/* Payments Due */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={13} className="text-indigo-600" />
            Payments Due
          </p>
          <p className="text-2xl font-black text-indigo-600 mt-1">
            {stats.paymentsDueCount || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Milestones awaiting payment</p>
        </div>

        {/* Overdue Payments */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle size={13} className="text-rose-600" />
            Overdue Payments
          </p>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {stats.overduePaymentsCount || 0}
          </p>
          <p className="text-xs text-rose-600 font-medium mt-1">Past expected schedule</p>
        </div>
      </div>

      {/* Simplified, Clean Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          {/* Free Text Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Client, UTR, Milestone..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Client Filter */}
          <div className="w-full sm:w-56">
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-gray-700"
            >
              <option value="">All Clients</option>
              {(Array.isArray(clients) ? clients : []).map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-40">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-gray-700"
            >
              {PAYMENT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  Status: {st}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Ledger Table - Reduced Columns with 5 default items & See All */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Payment Transactions</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Showing {payments.length} of {totalCount} payment transactions recorded.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {totalCount > 5 && (
              <button
                type="button"
                onClick={() => {
                  if (limit === 5) {
                    setLimit(50);
                    setPage(1);
                  } else {
                    setLimit(5);
                    setPage(1);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                <span>{limit === 5 ? `See All (${totalCount})` : "Show 5 per page"}</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <LoadingSkeleton type="table" rows={5} />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Receipt size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-800">No payment transactions found</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No matching records found for the selected filters. Clear filters or record a new milestone payment.
            </p>
            <Link
              to="/client/ledger/new"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus size={15} />
              <span>Record Payment</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Payment ID & Date</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Milestone</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => {
                  const statusColors = {
                    Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    Pending: "bg-amber-50 text-amber-700 border-amber-200",
                    Reversed: "bg-rose-50 text-rose-700 border-rose-200",
                  };

                  return (
                    <tr key={p._id || p.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* Payment ID & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-blue-700">
                          {p.paymentId || (p._id ? p._id.slice(-8) : "—")}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {formatDate(p.paymentDate)}
                        </div>
                      </td>

                      {/* Client Name */}
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/client/clients/${p.clientId}`}
                          className="font-bold text-gray-900 hover:text-blue-600 flex items-center gap-1"
                        >
                          <span>{p.clientName}</span>
                          <ExternalLink size={11} className="text-gray-400" />
                        </Link>
                        {p.projectName && (
                          <div className="text-[11px] text-gray-500 mt-0.5">{p.projectName}</div>
                        )}
                      </td>

                      {/* Milestone */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{p.milestoneName}</div>
                        {p.candidateName ? (
                          <div className="text-[11px] text-blue-600 font-medium mt-0.5">
                            Candidate: {p.candidateName}
                          </div>
                        ) : p.remarks ? (
                          <div className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{p.remarks}</div>
                        ) : null}
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                        <div className="font-black text-gray-950 text-sm">
                          ₹{Number(p.amountPaid || 0).toLocaleString("en-IN")}
                        </div>
                        {p.gstAmount > 0 ? (
                          <div className="text-[10px] text-indigo-600 font-semibold">
                            Incl. GST ₹{Number(p.gstAmount).toLocaleString("en-IN")}
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400 font-normal">
                            Method: {p.paymentMethod || "Bank"}
                          </div>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[p.paymentStatus] || "bg-gray-100 text-gray-700"}`}>
                          {p.paymentStatus || "Completed"}
                        </span>
                        {p.isReversed && (
                          <div className="text-[10px] text-rose-500 font-semibold mt-0.5">Reversed</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingPayment(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                            title="Open all transaction details"
                          >
                            <Eye size={13} />
                            <span>Open</span>
                          </button>

                          {p.paymentStatus === "Completed" && !p.isReversed && (
                            <button
                              type="button"
                              onClick={() => openReversal(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                              title="Reverse payment entry with audit trail"
                            >
                              <RotateCcw size={12} />
                              <span>Reverse</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-gray-50/80 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-gray-500 font-medium">
              Showing page {page} of {totalPages} ({totalCount} total entries)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <span className="px-2 font-bold text-gray-800">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FULL TRANSACTION DETAILS MODAL (OPEN ON CLICK) */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-2xl w-full overflow-hidden my-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Receipt size={20} className="text-blue-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-tight">
                      {viewingPayment.paymentId || "Transaction Details"}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                      {viewingPayment.paymentStatus || "Completed"}
                    </span>
                  </div>
                  <p className="text-xs text-blue-200">
                    Recorded on {formatDate(viewingPayment.paymentDate)} by {viewingPayment.recordedByName || "System"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingPayment(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* Organization & Project */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Client Organization
                  </span>
                  <Link
                    to={`/client/clients/${viewingPayment.clientId}`}
                    className="font-bold text-sm text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span>{viewingPayment.clientName}</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Project & Candidate
                  </span>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {viewingPayment.projectName || "General Account Disbursement"}
                  </p>
                  {viewingPayment.candidateName && (
                    <p className="text-[11px] text-blue-600 font-medium">Candidate: {viewingPayment.candidateName}</p>
                  )}
                </div>
              </div>

              {/* Milestone Financial Breakdown */}
              <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-200 space-y-2.5">
                <h4 className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                  Milestone Disbursement Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-gray-500 text-[10px] block">Milestone Name</span>
                    <span className="font-bold text-gray-900 text-xs">{viewingPayment.milestoneName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">Agreed Milestone</span>
                    <span className="font-bold text-gray-900 text-xs font-mono">
                      ₹{Number(viewingPayment.agreedMilestoneAmount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">Amount Paid</span>
                    <span className="font-black text-emerald-700 text-sm font-mono">
                      ₹{Number(viewingPayment.amountPaid || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">Milestone Balance</span>
                    <span className="font-bold text-amber-700 text-xs font-mono">
                      ₹{Number(viewingPayment.remainingMilestoneBalance || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Banking & GST Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Banking & Reference
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Method:</span>
                      <span className="font-semibold text-gray-900">{viewingPayment.paymentMethod || "Bank Transfer"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transaction / UTR:</span>
                      <span className="font-mono font-bold text-blue-700">{viewingPayment.transactionReference || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment Date:</span>
                      <span className="text-gray-900 font-medium">{formatDate(viewingPayment.paymentDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Tax & GST Handling
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">GST Treatment:</span>
                      <span className="font-semibold text-gray-900">{viewingPayment.gstTreatment || "Not Applicable"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">GST Amount:</span>
                      <span className="font-mono font-bold text-indigo-700">
                        {viewingPayment.gstAmount > 0
                          ? `₹${Number(viewingPayment.gstAmount).toLocaleString("en-IN")} (${viewingPayment.gstRate || 18}%)`
                          : "₹0"}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-1 font-bold">
                      <span className="text-gray-800">Total Transaction:</span>
                      <span className="font-mono text-emerald-700">
                        ₹{Number(viewingPayment.totalTransactionAmount || viewingPayment.amountPaid || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {viewingPayment.remarks && (
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-amber-900">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block mb-0.5">Remarks / Notes</span>
                  <p>{viewingPayment.remarks}</p>
                </div>
              )}

              {/* Proof / Voucher attachment */}
              {viewingPayment.paymentProofUrl && (
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck size={18} className="text-emerald-600" />
                    <div>
                      <p className="font-bold text-gray-800">Payment Proof Attached</p>
                      <p className="text-[10px] text-gray-500">{viewingPayment.paymentProofName || "Bank advice / voucher"}</p>
                    </div>
                  </div>
                  <a
                    href={viewingPayment.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-blue-600 font-bold hover:bg-blue-50 transition-colors"
                  >
                    View Document
                  </a>
                </div>
              )}

              {/* Reversal Status / Warning */}
              {viewingPayment.isReversed && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 space-y-1">
                  <span className="text-[10px] font-bold text-rose-700 uppercase block">Transaction Reversal Record</span>
                  <p className="font-semibold">Reason: {viewingPayment.reversalReason || "No reason specified"}</p>
                  <p className="text-[10px] text-rose-600">Reversed on: {formatDate(viewingPayment.reversedAt)}</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div>
                {!viewingPayment.isReversed && viewingPayment.paymentStatus === "Completed" && (
                  <button
                    type="button"
                    onClick={() => {
                      const p = viewingPayment;
                      setViewingPayment(null);
                      openReversal(p);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Reverse Payment</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setViewingPayment(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVERSAL CONFIRMATION MODAL */}
      {reversalModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                <RotateCcw size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Reverse Payment Entry</h3>
                <p className="text-xs text-gray-500">
                  Transaction: {reversalModal.payment?.paymentId || reversalModal.payment?._id}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Reversing this entry will subtract the paid amount of{" "}
              <strong className="text-gray-900">
                ₹{Number(reversalModal.payment?.amountPaid || 0).toLocaleString("en-IN")}
              </strong>{" "}
              from the client's balance and reinstate the milestone liability. An audit log will be permanently stored.
            </p>

            <form onSubmit={submitReversal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Reversal <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reversalModal.reason}
                  onChange={(e) => setReversalModal((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Bank transfer returned, duplicate voucher entry, incorrect account details..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={reversalModal.submitting}
                  onClick={() => setReversalModal({ isOpen: false, payment: null, reason: "", submitting: false })}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reversalModal.submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-600/25 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {reversalModal.submitting ? "Reversing..." : "Confirm Reversal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientPaymentLedger;
