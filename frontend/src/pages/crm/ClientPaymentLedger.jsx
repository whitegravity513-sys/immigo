import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Receipt, RefreshCw, Download, Plus } from "lucide-react";
import * as XLSX from "xlsx";
import crmClientService from "../../services/crmClientService.js";
import { useCrmToast } from "../../components/crm/layout/CrmLayout.jsx";
import ClientPaymentStatsCards from "../../components/crm/payments/ClientPaymentStatsCards.jsx";
import ClientPaymentFilterBar from "../../components/crm/payments/ClientPaymentFilterBar.jsx";
import ClientPaymentTable from "../../components/crm/payments/ClientPaymentTable.jsx";
import ClientPaymentDetailModal from "../../components/crm/payments/ClientPaymentDetailModal.jsx";
import ClientPaymentReversalModal from "../../components/crm/payments/ClientPaymentReversalModal.jsx";

const PAYMENT_STATUSES = ["All", "Completed", "Pending", "Due", "Reversed"];

export function ClientPaymentLedger() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialClientId = searchParams.get("clientId") || "";
  const { showToast } = useCrmToast() || { showToast: (msg) => console.log(msg) };

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

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(initialClientId);
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [viewingPayment, setViewingPayment] = useState(null);

  const [reversalModal, setReversalModal] = useState({
    isOpen: false,
    payment: null,
    reason: "",
    submitting: false,
  });

  const loadClientsList = useCallback(async () => {
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
    }
  }, []);

  const loadLedgerStats = useCallback(async () => {
    try {
      const data = await crmClientService.getPaymentLedgerStats({
        clientId: selectedClient || undefined,
      });
      if (data) setStats(data);
    } catch (err) {
      console.error("Error loading ledger stats:", err);
    }
  }, [selectedClient]);

  const loadPayments = useCallback(async () => {
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
  }, [page, limit, searchTerm, selectedClient, selectedStatus, showToast]);

  useEffect(() => {
    loadClientsList();
    loadLedgerStats();
  }, [loadClientsList, loadLedgerStats]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

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
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
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
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={exportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Excel (.xlsx)</span>
            </button>

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

      <ClientPaymentStatsCards stats={stats} />

      <ClientPaymentFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearchSubmit={handleSearchSubmit}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        clients={clients}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        statusList={PAYMENT_STATUSES}
        onResetFilters={handleResetFilters}
        setPage={setPage}
      />

      <ClientPaymentTable
        loading={loading}
        payments={payments}
        totalCount={totalCount}
        limit={limit}
        setLimit={setLimit}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        formatDate={formatDate}
        onViewPayment={(p) => setViewingPayment(p)}
        onOpenReversal={(p) => openReversal(p)}
      />

      <ClientPaymentDetailModal
        viewingPayment={viewingPayment}
        onClose={() => setViewingPayment(null)}
        formatDate={formatDate}
        onOpenReversal={(p) => {
          setViewingPayment(null);
          openReversal(p);
        }}
      />

      <ClientPaymentReversalModal
        isOpen={reversalModal.isOpen}
        payment={reversalModal.payment}
        reason={reversalModal.reason}
        setReason={(val) => setReversalModal((prev) => ({ ...prev, reason: val }))}
        onClose={() => setReversalModal({ isOpen: false, payment: null, reason: "", submitting: false })}
        onSubmit={submitReversal}
        submitting={reversalModal.submitting}
      />
    </div>
  );
}

export default ClientPaymentLedger;
