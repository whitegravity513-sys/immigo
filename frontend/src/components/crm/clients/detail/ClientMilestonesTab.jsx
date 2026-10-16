import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IndianRupee,
  Receipt,
  TrendingUp,
  CreditCard,
  Plus,
  History,
  CheckCircle,
  TrendingDown,
  Clock,
  AlertCircle,
  Eye,
  FileCheck,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  DollarSign,
  Layers,
  Edit,
  ExternalLink,
} from "lucide-react";
import LoadingSkeleton from "../../ui/LoadingSkeleton.jsx";
import TransactionDetailModal from "../../payments/TransactionDetailModal.jsx";
import crmClientService from "../../../../services/crmClientService.js";

export function ClientMilestonesTab({
  client,
  clientPayments = [],
  loadingPayments = false,
  formatDate,
  setSelectedMilestone,
  setIsRecordPaymentOpen,
  onRefresh,
}) {
  const navigate = useNavigate();

  
  const [clientExpenses, setClientExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expenseStats, setExpenseStats] = useState({
    totalExpensesRecorded: 0,
    totalExpensesPaid: 0,
    pendingExpenses: 0,
  });

  
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseStatusFilter, setExpenseStatusFilter] = useState("All");

  
  const [activeVoucher, setActiveVoucher] = useState(null);
  const [voucherType, setVoucherType] = useState("payment");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (client?.id || client?._id) {
      loadExpenses();
    }
  }, [client]);

  const loadExpenses = async () => {
    const cid = client.id || client._id;
    if (!cid) return;
    setLoadingExpenses(true);
    try {
      const res = await crmClientService.getClientExpenses(cid);
      if (res) {
        setClientExpenses(res.expenses || []);
        setExpenseStats({
          totalExpensesRecorded: res.totalExpensesRecorded || res.totalAmount || 0,
          totalExpensesPaid: res.totalExpensesPaid || res.approvedAmount || 0,
          pendingExpenses: res.pendingExpenses || 0,
        });
      }
    } catch (err) {
      console.error("Failed to load client expenses:", err);
    } finally {
      setLoadingExpenses(false);
    }
  };

  if (!client) return null;

  const milestones = client.paymentMilestones || [];
  const totalAgreed =
    client.totalAgreedAmount ||
    milestones.reduce((s, m) => s + (Number(m.paymentAmount) || Number(m.amount) || 0), 0);

  
  const verifiedPayments = clientPayments.filter(
    (p) =>
      !p.isReversed &&
      (p.status === "Verified" ||
        p.status === "Completed" ||
        p.paymentStatus === "Verified" ||
        p.paymentStatus === "Completed")
  );

  const totalVerifiedReceived = verifiedPayments.reduce(
    (acc, p) => acc + (Number(p.amountPaid) || 0),
    0
  );

  const remainingClientPayment = Math.max(0, totalAgreed - totalVerifiedReceived);

  
  const totalExpensesRecorded =
    expenseStats.totalExpensesRecorded ||
    clientExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  const totalExpensesPaid =
    expenseStats.totalExpensesPaid ||
    clientExpenses
      .filter((e) => e.status === "Paid")
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  const pendingExpenses =
    expenseStats.pendingExpenses ||
    clientExpenses
      .filter((e) => e.status === "Pending" || e.status === "Approved")
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  
  const netCashFlow = totalVerifiedReceived - totalExpensesPaid;

  const completedCount = milestones.filter(
    (m) => m.paymentStatus === "Paid" || m.status === "Paid"
  ).length;
  const pendingDueCount = milestones.filter(
    (m) =>
      m.paymentStatus === "Pending" ||
      m.paymentStatus === "Due" ||
      m.paymentStatus === "Partially Paid" ||
      m.status === "Pending" ||
      m.status === "Due"
  ).length;

  const paidPct =
    totalAgreed > 0
      ? Math.min(100, Math.round((totalVerifiedReceived / totalAgreed) * 100))
      : 0;

  const statusColors = {
    Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Partially Paid": "bg-blue-50 text-blue-700 border-blue-200",
    Due: "bg-amber-50 text-amber-700 border-amber-200",
    "Pending Verification": "bg-amber-50 text-amber-700 border-amber-200",
    Pending: "bg-gray-100 text-gray-700 border-gray-200",
    Approved: "bg-blue-50 text-blue-700 border-blue-200",
    Received: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Reversed: "bg-rose-50 text-rose-700 border-rose-200",
    Overdue: "bg-rose-50 text-rose-700 border-rose-200",
  };

  
  const filteredPayments = clientPayments.filter((p) => {
    const matchesSearch =
      !paymentSearch.trim() ||
      p.paymentId?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.milestoneName?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.projectName?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.transactionReference?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.receivedBy?.toLowerCase().includes(paymentSearch.toLowerCase());

    const matchesStatus =
      paymentStatusFilter === "All" ||
      p.status === paymentStatusFilter ||
      p.paymentStatus === paymentStatusFilter;

    return matchesSearch && matchesStatus;
  });

  
  const filteredExpenses = clientExpenses.filter((e) => {
    const matchesSearch =
      !expenseSearch.trim() ||
      e.title?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.description?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.categoryName?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.category?.name?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.paidTo?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.transactionReference?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      e.transactionRef?.toLowerCase().includes(expenseSearch.toLowerCase());

    const matchesStatus =
      expenseStatusFilter === "All" || e.status === expenseStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenVoucher = (tx, type) => {
    setActiveVoucher(tx);
    setVoucherType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <IndianRupee size={12} className="text-blue-600" />
            Total Agreed
          </p>
          <p className="text-lg font-black text-gray-900 mt-1 truncate">
            ₹{Number(totalAgreed).toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5 truncate">
            {milestones.length} milestones
          </p>
        </div>

        {}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <Receipt size={12} className="text-emerald-600" />
            Received (Verified)
          </p>
          <p className="text-lg font-black text-emerald-600 mt-1 truncate">
            ₹{Number(totalVerifiedReceived).toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-emerald-700/80 font-semibold mt-0.5">
            {paidPct}% cleared
          </p>
        </div>

        {}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp size={12} className="text-amber-600" />
            Remaining Balance
          </p>
          <p className="text-lg font-black text-amber-600 mt-1 truncate">
            ₹{Number(remainingClientPayment).toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
            Pending milestone due
          </p>
        </div>

        {}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Layers size={12} className="text-purple-600" />
            Expenses Recorded
          </p>
          <p className="text-lg font-black text-gray-900 mt-1 truncate">
            ₹{Number(totalExpensesRecorded).toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5 truncate">
            {clientExpenses.length} entries
          </p>
        </div>

        {}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
            <TrendingDown size={12} className="text-rose-600" />
            Expenses Paid
          </p>
          <p className="text-lg font-black text-rose-600 mt-1 truncate">
            ₹{Number(totalExpensesPaid).toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
            Disbursed outward
          </p>
        </div>

        {}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
          <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
            <Clock size={12} className="text-orange-500" />
            Pending Expenses
          </p>
          <p className="text-lg font-black text-orange-600 mt-1 truncate">
            ₹{Number(pendingExpenses).toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
            Unpaid / claim
          </p>
        </div>

        {}
        <div
          className={`rounded-xl border p-4 shadow-2xs ${
            netCashFlow >= 0
              ? "bg-emerald-50/50 border-emerald-200"
              : "bg-rose-50/50 border-rose-200"
          }`}
        >
          <p
            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
              netCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {netCashFlow >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            Net Cash Flow
          </p>
          <p
            className={`text-lg font-black mt-1 truncate ${
              netCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {netCashFlow < 0 ? "-" : "+"}₹{Math.abs(Number(netCashFlow)).toLocaleString("en-IN")}
          </p>
          <p
            className={`text-[10px] font-semibold mt-0.5 truncate ${
              netCashFlow >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {netCashFlow >= 0 ? "Positive Surplus" : "Deficit Outflow"}
          </p>
        </div>
      </div>

      {}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Receipt size={14} className="text-emerald-600" />
                <span>Milestone Payment Collection Progress</span>
              </span>
              <span>{paidPct}% Completed</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  paidPct === 100
                    ? "bg-emerald-500"
                    : paidPct > 50
                    ? "bg-blue-600"
                    : "bg-indigo-600"
                }`}
                style={{ width: `${paidPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {}
            <Link
              to={`/client/payments-expenses?clientId=${client.id || client._id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs transition-colors"
            >
              <Receipt size={14} className="text-gray-500" />
              <span>Full Ledger</span>
            </Link>

            {}
            <Link
              to={`/client/payments/record?clientId=${client.id || client._id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Record Payment</span>
            </Link>

            {}
            <Link
              to={`/client/expenses/add?clientId=${client.id || client._id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-600/25 transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Expense</span>
            </Link>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CreditCard size={16} className="text-blue-600" />
              <span>Configured Payment Milestones</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Recruitment milestone obligations and candidate deployment schedule.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-500">
            {milestones.length} Milestones Configured
          </span>
        </div>

        {milestones.length === 0 ? (
          <div className="text-center py-10 px-4">
            <CreditCard size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-700">No payment milestones configured</p>
            <p className="text-xs text-gray-500 mt-1">
              Edit this client to define milestone schedules or record client receipts directly.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Milestone Name</th>
                  <th className="py-3 px-4">Agreed Amount</th>
                  <th className="py-3 px-4">Paid / Balance</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Expected Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {milestones.map((m, idx) => {
                  const amount = Number(m.paymentAmount) || Number(m.amount) || 0;
                  const paidAmt = Number(m.amountPaid) || Number(m.paidAmount) || 0;
                  const bal =
                    m.remainingBalance !== undefined
                      ? Number(m.remainingBalance)
                      : Math.max(0, amount - paidAmt);
                  const status = m.paymentStatus || m.status || "Pending";

                  return (
                    <tr key={m.id || idx} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{m.name || m.milestoneName}</div>
                        {m.remarks && (
                          <div className="text-[11px] text-gray-500 line-clamp-1">{m.remarks}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        ₹{amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-emerald-700 font-semibold">
                          ₹{paidAmt.toLocaleString("en-IN")}
                        </div>
                        {bal > 0 && (
                          <div className="text-[11px] text-amber-600 font-medium">
                            Bal: ₹{bal.toLocaleString("en-IN")}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs">
                        <span className="inline-block bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          {m.condition || m.paymentCondition || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {m.timeline || (m.expectedDate ? formatDate(m.expectedDate) : "—")}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            statusColors[status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {status !== "Paid" ? (
                          <Link
                            to={`/client/payments/record?clientId=${client.id || client._id}&milestoneId=${m.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <CreditCard size={12} />
                            <span>Pay (New Page)</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center gap-1">
                            <CheckCircle size={13} />
                            <span>Cleared</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-emerald-50/20">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Receipt size={17} className="text-emerald-600" />
              <span>Payment Received History</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                {filteredPayments.length} Entries
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Receipts received from client against milestones and project invoices.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search receipts..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {}
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Received">Received</option>
              <option value="Completed">Completed</option>
            </select>

            {}
            <Link
              to={`/client/payments-expenses?clientId=${client.id || client._id}&tab=received`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/80 border border-emerald-200 rounded-lg transition-colors"
            >
              <span>See All ({filteredPayments.length})</span>
              <ExternalLink size={12} />
            </Link>

            {}
            <Link
              to={`/client/payments/record?clientId=${client.id || client._id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus size={14} />
              <span>Record Payment</span>
            </Link>
          </div>
        </div>

        {loadingPayments ? (
          <div className="p-6">
            <LoadingSkeleton type="card" count={2} />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-10 px-4 text-xs text-gray-500">
            No received payments found. Click "Record Payment" to register a payment receipt.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Milestone</th>
                  <th className="py-3 px-4">Amount Received</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference / UTR</th>
                  <th className="py-3 px-4">Received By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.slice(0, 3).map((p) => {
                  const status = p.status || p.paymentStatus || "Verified";
                  return (
                    <tr key={p._id || p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {p.projectName || "General Project"}
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {p.milestoneName || "Milestone Payment"}
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-700 whitespace-nowrap">
                        ₹{Number(p.amountPaid || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                        {p.paymentMethod || "Bank Transfer"}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 select-all">
                        {p.transactionReference || "—"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {p.receivedBy || p.recordedBy || "Admin"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            statusColors[status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                        {p.remarks || "—"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenVoucher(p, "payment")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer mr-1"
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

            {}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Showing {Math.min(3, filteredPayments.length)} of {filteredPayments.length} payment receipts
              </span>
              <Link
                to={`/client/payments-expenses?clientId=${client.id || client._id}&tab=received`}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                <span>See All Received Payments ({filteredPayments.length})</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-rose-50/20">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <TrendingDown size={17} className="text-rose-600" />
              <span>Expense Paid History</span>
              <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                {filteredExpenses.length} Entries
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Direct expenses incurred for this client's recruitment operations, vendors, and processing.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={expenseStatusFilter}
              onChange={(e) => setExpenseStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-rose-500 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
            </select>

            {/* See All Button */}
            <Link
              to={`/client/payments-expenses?clientId=${client.id || client._id}&tab=expenses`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-100/70 hover:bg-rose-200/80 border border-rose-200 rounded-lg transition-colors"
            >
              <span>See All ({filteredExpenses.length})</span>
              <ExternalLink size={12} />
            </Link>

            {/* Add Expense Button */}
            <Link
              to={`/client/expenses/add?clientId=${client.id || client._id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus size={14} />
              <span>Add Expense</span>
            </Link>
          </div>
        </div>

        {loadingExpenses ? (
          <div className="p-6">
            <LoadingSkeleton type="card" count={2} />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-10 px-4 text-xs text-gray-500">
            No expenses recorded for this client yet. Click "Add Expense" to track candidate or vendor costs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Paid To</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference / UTR</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.slice(0, 3).map((exp) => {
                  const status = exp.status || "Pending";
                  const catName = exp.categoryName || exp.category?.name || "General";
                  return (
                    <tr key={exp._id || exp.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                        {formatDate(exp.date || exp.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {exp.projectName || "General Overhead"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px] border border-blue-200">
                          {catName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-800 max-w-xs truncate">
                        {exp.description || exp.title}
                      </td>
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                        {exp.paidTo || "—"}
                      </td>
                      <td className="py-3 px-4 font-black text-rose-700 whitespace-nowrap">
                        ₹{Number(exp.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                        {exp.paymentMethod || exp.paymentMode || "Bank Transfer"}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600 select-all">
                        {exp.transactionReference || exp.transactionRef || "—"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            statusColors[status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenVoucher(exp, "expense")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                        <Link
                          to={`/client/expenses/${exp._id || exp.id}/edit`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                        >
                          <Edit size={12} />
                          <span>Edit</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer with See All Link */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Showing {Math.min(3, filteredExpenses.length)} of {filteredExpenses.length} expenses
              </span>
              <Link
                to={`/client/payments-expenses?clientId=${client.id || client._id}&tab=expenses`}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-rose-700 hover:text-rose-800 hover:underline"
              >
                <span>See All Expenses ({filteredExpenses.length})</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveVoucher(null);
        }}
        transaction={activeVoucher}
        type={voucherType}
        onEdit={(tx) => {
          if (voucherType === "payment") {
            navigate(`/client/payments/record?clientId=${client.id || client._id}`);
          } else {
            navigate(`/client/expenses/${tx._id || tx.id}/edit`);
          }
        }}
      />
    </div>
  );
}

export default ClientMilestonesTab;
