import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CreditCard,
  Receipt,
  TrendingDown,
  Clock,
  Search,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import crmClientService from "../../services/crmClientService.js";
import LoadingSkeleton from "../../components/crm/ui/LoadingSkeleton.jsx";
import TransactionDetailModal from "../../components/crm/payments/TransactionDetailModal.jsx";
import { useCrmToast } from "../../components/crm/layout/crmToastContext.js";
import DateInput from "../../components/common/DateInput.jsx";

const PAYMENT_TABS = [
  { id: "received", label: "All Payment Records" },
  { id: "milestones", label: "Payable Milestones" },
  { id: "paid_payments", label: "Paid Entries" },
];

const EXPENSE_TABS = [
  { id: "expenses", label: "All Expenses" },
  { id: "paid_expenses", label: "Paid Expenses" },
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
  const [searchParams] = useSearchParams();
  const initialClientId = searchParams.get("clientId") || "";
  const initialView = searchParams.get("view") || "";
  const initialTab =
    searchParams.get("tab") ||
    (initialView === "expenses" ? "expenses" : "received");
  const crmToast = useCrmToast();
  const showToast = useCallback(
    (msg, type) => {
      if (crmToast?.showToast) crmToast.showToast(msg, type);
      else console.log(msg);
    },
    [crmToast]
  );

  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState(initialTab);

  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(initialClientId);
  const [selectedMethod, setSelectedMethod] = useState("All");

  const viewParam = searchParams.get("view");
  const tabParam = searchParams.get("tab");
  const clientParam = searchParams.get("clientId");
  const urlSyncKey = `${viewParam || ""}|${tabParam || ""}|${clientParam ?? ""}`;
  const [prevUrlSyncKey, setPrevUrlSyncKey] = useState(urlSyncKey);
  if (urlSyncKey !== prevUrlSyncKey) {
    setPrevUrlSyncKey(urlSyncKey);
    if (clientParam !== null) setSelectedClient(clientParam);
    if (tabParam) {
      setActiveTab(tabParam);
    } else if (viewParam === "expenses") {
      setActiveTab("expenses");
    } else if (viewParam === "payments") {
      setActiveTab("received");
    }
  }

  const isExpenseView =
    activeTab === "expenses" ||
    activeTab === "paid_expenses" ||
    activeTab === "pending_expenses";
  const visibleTabs = isExpenseView ? EXPENSE_TABS : PAYMENT_TABS;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder] = useState("desc");

  const [viewingTx, setViewingTx] = useState(null);
  const [viewingType, setViewingType] = useState("payment");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const refreshRef = useRef(null);

  const loadClients = useCallback(async () => {
    try {
      const res = await crmClientService.getClients({ limit: 200 });
      const list = Array.isArray(res?.clients) ? res.clients : Array.isArray(res) ? res : [];
      setClients(list);
    } catch (err) {
      console.error("Failed to load clients:", err);
    }
  }, []);

  const loadAllData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [paymentsRes, expensesRes] = await Promise.all([
        crmClientService.getClientPayments({ limit: 500 }),
        crmClientService.getAllExpenses(),
      ]);

      setPayments(paymentsRes?.payments || []);
      setExpenses(Array.isArray(expensesRes) ? expensesRes : []);
    } catch (err) {
      console.error("Failed to load transaction data:", err);
      if (!silent) showToast("Failed to load transactions", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshRef.current = () => {
      loadClients();
      loadAllData({ silent: true });
    };
  });

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        loadClients();
        loadAllData();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loadClients, loadAllData]);

  useEffect(() => {
    let timer = null;
    const handleLiveUpdate = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        refreshRef.current?.();
      }, 200);
    };
    const events = [
      "immigo:dashboard-update",
      "immigo:project-update",
      "immigo:refund-update",
      "immigo:application-update",
    ];
    events.forEach((evt) => window.addEventListener(evt, handleLiveUpdate));
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((evt) => window.removeEventListener(evt, handleLiveUpdate));
    };
  }, []);

  const unifiedTransactions = useMemo(() => {
    const pList = payments.map((p) => {
      const agreed = Number(p.agreedMilestoneAmount) || 0;
      const paid = Number(p.amountPaid) || 0;
      const remaining = p.remainingMilestoneBalance !== undefined ? Number(p.remainingMilestoneBalance) : Math.max(0, agreed - paid);
      const rawStatus = p.status || p.paymentStatus || "Pending";
      const isScheduledPayable = Boolean(
        p.isMilestoneSchedule ||
        rawStatus === "Pending" ||
        rawStatus === "Partially Paid" ||
        rawStatus === "Due"
      );
      const displayAmount = paid > 0 ? paid : agreed;
      return {
        id: p.id || p._id || p.paymentId,
        rawId: p._id || p.id,
        type: "payment",
        isScheduledPayable,
        milestoneId: p.milestoneId || "",
        agreedAmount: agreed,
        paidAmount: paid,
        remainingAmount: remaining,
        date: p.paymentDate || p.createdAt,
        clientId: p.clientId,
        clientName: p.clientName || "Client",
        projectId: p.projectId || "",
        projectName: p.projectName || "General Project",
        title: p.milestoneName || "Milestone Payment",
        categoryOrMilestone: p.milestoneName || "Milestone Payment",
        amount: displayAmount,
        paymentMethod: isScheduledPayable && paid === 0 ? "Scheduled" : (p.paymentMethod || "Bank Transfer"),
        transactionReference: p.transactionReference || "—",
        status: rawStatus,
        receivedBy: p.receivedBy || p.recordedBy || "Admin",
        paidTo: p.clientName || "Client",
        remarks: p.remarks || "",
        raw: p,
      };
    });

    const eList = expenses.map((e) => ({
      id: e.id || e._id,
      rawId: e._id || e.id,
      type: "expense",
      isScheduledPayable: false,
      milestoneId: "",
      agreedAmount: 0,
      paidAmount: Number(e.amount) || 0,
      remainingAmount: 0,
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
      paidTo: e.paidTo || "Vendor / Operations",
      remarks: e.description || e.remarks || e.notes || "",
      raw: e,
    }));

    return [...pList, ...eList];
  }, [payments, expenses]);

  const stats = useMemo(() => {
    const activePayments = payments.filter((p) => !p.isReversed);
    const settledPayments = activePayments.filter(
      (p) =>
        !p.isMilestoneSchedule &&
        (p.status === "Verified" ||
          p.status === "Completed" ||
          p.status === "Paid" ||
          p.status === "Received" ||
          p.paymentStatus === "Verified" ||
          p.paymentStatus === "Completed" ||
          p.paymentStatus === "Paid" ||
          p.paymentStatus === "Received")
    );
    const totalPaidOut = settledPayments.reduce((s, p) => s + (Number(p.amountPaid) || 0), 0);

    const scheduleRows = activePayments.filter(
      (p) =>
        p.isMilestoneSchedule ||
        p.status === "Pending" ||
        p.status === "Partially Paid" ||
        p.status === "Due"
    );
    const totalPendingPayable = scheduleRows.reduce((s, p) => {
      const agreed = Number(p.agreedMilestoneAmount) || 0;
      const paid = Number(p.amountPaid) || 0;
      const rem = p.remainingMilestoneBalance !== undefined ? Number(p.remainingMilestoneBalance) : Math.max(0, agreed - paid);
      return s + rem;
    }, 0);

    const totalAgreedPayable = totalPaidOut + totalPendingPayable;

    const totalExpensesRecorded = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const paidExpenses = expenses.filter((e) => e.status === "Paid");
    const totalExpensesPaid = paidExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const pendingExpenses = expenses.filter((e) => e.status === "Pending" || e.status === "Approved");
    const totalPendingExpenses = pendingExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    return {
      totalAgreedPayable,
      totalPaidOut,
      totalPendingPayable,
      totalExpensesRecorded,
      totalExpensesPaid,
      totalPendingExpenses,
      totalTransactions: payments.length + expenses.length,
    };
  }, [payments, expenses]);

  const filteredTransactions = useMemo(() => {
    const matchedClientIds = new Set();
    if (selectedClient && selectedClient !== "All" && selectedClient !== "") {
      matchedClientIds.add(String(selectedClient));
      const matchedObj = clients.find(
        (c) =>
          String(c.id) === String(selectedClient) ||
          String(c._id) === String(selectedClient) ||
          String(c.clientId) === String(selectedClient)
      );
      if (matchedObj) {
        if (matchedObj.id) matchedClientIds.add(String(matchedObj.id));
        if (matchedObj._id) matchedClientIds.add(String(matchedObj._id));
        if (matchedObj.clientId) matchedClientIds.add(String(matchedObj.clientId));
      }
    }

    return unifiedTransactions
      .filter((tx) => {
        if (activeTab === "milestones" && (tx.type !== "payment" || !tx.isScheduledPayable)) return false;
        if (activeTab === "paid_payments" && (tx.type !== "payment" || tx.isScheduledPayable)) return false;
        if (activeTab === "received" && tx.type !== "payment") return false;
        if (activeTab === "expenses" && tx.type !== "expense") return false;
        if (activeTab === "paid_expenses") {
          if (tx.type !== "expense" || tx.status !== "Paid") return false;
        }
        if (activeTab === "pending_expenses") {
          if (tx.type !== "expense" || tx.status === "Paid") return false;
        }

        if (matchedClientIds.size > 0) {
          if (!matchedClientIds.has(String(tx.clientId))) return false;
        }

        if (selectedMethod !== "All") {
          if (tx.paymentMethod?.toLowerCase() !== selectedMethod.toLowerCase()) return false;
        }

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
  }, [unifiedTransactions, activeTab, selectedClient, clients, selectedMethod, startDate, endDate, search, sortOrder]);

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
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
              <Link to="/client/dashboard" className="hover:text-blue-600 transition-colors">
                Client Management
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-bold">
                {isExpenseView ? "Expense" : "Record Payment"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              {isExpenseView ? (
                <Receipt size={24} className="text-rose-600" />
              ) : (
                <CreditCard size={24} className="text-blue-600" />
              )}
              <span>{isExpenseView ? "Client Expense Records" : "Client Payment Records"}</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {isExpenseView
                ? "Expenses incurred for client work, operations, and vendor disbursements."
                : "Agreed payable milestones for clients and recorded payment entries."}
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

            {isExpenseView ? (
              <Link
                to="/client/expenses/add"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm shadow-rose-600/25 transition-all cursor-pointer"
              >
                <Plus size={15} />
                <span>Add Expense</span>
              </Link>
            ) : (
              <Link
                to="/client/payments/record"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <Plus size={15} />
                <span>Record Payment</span>
              </Link>
            )}
          </div>
        </div>

        {isExpenseView ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100">
            <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-4">
              <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                <TrendingDown size={12} />
                Total Client Expenses
              </p>
              <p className="text-xl font-bold text-rose-800 mt-1">
                ₹{stats.totalExpensesRecorded.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-rose-700/70 mt-0.5 font-medium">
                Work & operational expenses
              </p>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={12} />
                Expenses Paid
              </p>
              <p className="text-xl font-bold text-emerald-800 mt-1">
                ₹{stats.totalExpensesPaid.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-emerald-700/70 mt-0.5 font-medium">
                Paid for client work
              </p>
            </div>

            <div className="bg-purple-50/50 border border-purple-200/80 rounded-xl p-4">
              <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle size={12} />
                Pending Expenses
              </p>
              <p className="text-xl font-bold text-purple-800 mt-1">
                ₹{stats.totalPendingExpenses.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-purple-700/70 mt-0.5 font-medium">
                Unpaid / pending claims
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100">
            <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-4">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                <CreditCard size={12} />
                Total Client Payable
              </p>
              <p className="text-xl font-bold text-blue-900 mt-1">
                ₹{stats.totalAgreedPayable.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-blue-700/70 mt-0.5 font-medium">
                Configured client milestones
              </p>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={12} />
                Payment Paid (Milestones)
              </p>
              <p className="text-xl font-bold text-emerald-800 mt-1">
                ₹{stats.totalPaidOut.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-emerald-700/70 mt-0.5 font-medium">
                Settled milestone entries
              </p>
            </div>

            <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} />
                Pending Milestone Payable
              </p>
              <p className="text-xl font-bold text-amber-800 mt-1">
                ₹{stats.totalPendingPayable.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-amber-700/70 mt-0.5 font-medium">
                Remaining balance to pay
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="border-b border-gray-200 px-4 sm:px-6 pt-3 flex items-center gap-2 overflow-x-auto bg-gray-50/50">
          {visibleTabs.map((tab) => {
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

        <div className="p-4 border-b border-gray-100 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
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

          <div>
            <DateInput
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              isClearable
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden"
              placeholder="Start Date"
            />
          </div>

          <div>
            <DateInput
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              isClearable
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden"
              placeholder="End Date"
            />
          </div>
        </div>

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
            <table className="w-full min-w-[960px] text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2 px-3 text-[10px]">Type</th>
                  <th className="py-2 px-3 text-[10px]">Date</th>
                  <th className="py-2 px-3 text-[10px]">Client Organization</th>
                  <th className="py-2 px-3 text-[10px]">Project</th>
                  <th className="py-2 px-3 text-[10px]">Milestone / Category</th>
                  <th className="py-2 px-3 text-[10px]">Amount</th>
                  <th className="py-2 px-3 text-[10px]">Method & Ref</th>
                  <th className="py-2 px-3 text-[10px]">Paid To / By</th>
                  <th className="py-2 px-3 text-[10px]">Status</th>
                  <th className="py-2 px-3 text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map((tx) => {
                  const isPayment = tx.type === "payment";
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-1.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPayment
                              ? tx.isScheduledPayable
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {isPayment ? (tx.isScheduledPayable ? <Clock size={11} /> : <Receipt size={11} />) : <TrendingDown size={11} />}
                          <span>{isPayment ? (tx.isScheduledPayable ? "Payable Milestone" : "Payment Paid") : "Expense"}</span>
                        </span>
                      </td>

                      <td className="py-1.5 px-3 text-gray-700 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>

                      <td className="py-1.5 px-3">
                        <Link
                          to={`/client/clients/${tx.clientId}?tab=milestones`}
                          className="font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
                        >
                          {tx.clientName}
                        </Link>
                      </td>

                      <td className="py-1.5 px-3 text-gray-700 max-w-xs truncate">
                        {tx.projectName}
                      </td>

                      <td className="py-1.5 px-3">
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

                      <td className="py-1.5 px-3 whitespace-nowrap">
                        <div
                          className={`font-semibold text-sm ${
                            isPayment
                              ? tx.isScheduledPayable
                                ? "text-amber-700"
                                : "text-emerald-700"
                              : "text-rose-700"
                          }`}
                        >
                          ₹{tx.amount.toLocaleString("en-IN")}
                        </div>
                        {isPayment && tx.agreedAmount > 0 && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Agreed: ₹{tx.agreedAmount.toLocaleString("en-IN")}
                            {tx.remainingAmount > 0 ? ` · Due: ₹${tx.remainingAmount.toLocaleString("en-IN")}` : ""}
                          </div>
                        )}
                      </td>

                      <td className="py-1.5 px-3">
                        <div className="text-gray-900 font-semibold">{tx.paymentMethod}</div>
                        <div className="font-mono text-[10px] text-gray-500 truncate max-w-[120px]">
                          {tx.transactionReference}
                        </div>
                      </td>

                      <td className="py-1.5 px-3 text-gray-600 max-w-xs truncate">
                        {isPayment ? `By: ${tx.receivedBy}` : `To: ${tx.paidTo}`}
                      </td>

                      <td className="py-1.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            tx.status
                          )}`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      <td className="py-1.5 px-3 text-right whitespace-nowrap space-x-1">
                        {isPayment && tx.isScheduledPayable && (
                          <Link
                            to={`/client/payments/record?clientId=${encodeURIComponent(tx.clientId || "")}${tx.milestoneId ? `&milestoneId=${encodeURIComponent(tx.milestoneId)}` : ""}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                          >
                            <Plus size={12} />
                            <span>Record Pay</span>
                          </Link>
                        )}
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

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing {filteredTransactions.length} of {isExpenseView ? expenses.length : payments.length} {isExpenseView ? "expense entries" : "payment records"}
          </span>
        </div>
      </div>

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
