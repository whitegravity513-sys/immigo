import React from "react";
import { IndianRupee, CreditCard, TrendingUp, Clock, AlertCircle } from "lucide-react";

export default function ClientPaymentStatsCards({ stats = {} }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-2xs">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <IndianRupee size={13} className="text-blue-600" />
          Total Agreed
        </p>
        <p className="text-2xl font-black text-gray-900 mt-1">
          ₹{Number(stats.totalAgreedPayments || 0).toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-gray-500 mt-1">Sum of configured milestones</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-2xs">
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

      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-2xs">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp size={13} className="text-amber-600" />
          Total Outstanding
        </p>
        <p className="text-2xl font-black text-amber-600 mt-1">
          ₹{Number(stats.totalOutstandingAmount || 0).toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-gray-500 mt-1">Remaining company liability</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-2xs">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Clock size={13} className="text-indigo-600" />
          Payments Due
        </p>
        <p className="text-2xl font-black text-indigo-600 mt-1">
          {stats.paymentsDueCount || 0}
        </p>
        <p className="text-xs text-gray-500 mt-1">Milestones awaiting payment</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-2xs col-span-2 lg:col-span-1">
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
  );
}
