import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DollarSign, CheckCircle, AlertCircle, Edit } from "lucide-react";

export default function ExpensesSection({
  expenses = [],
  expenseFilterDate,
  setExpenseFilterDate,
  toLocalDateStr,
  expenseForm,
  setExpenseForm,
  handleExpenseSubmit,
  handleEditExpenseClick,
  handleDeleteExpense,
  expenseLoading,
  loading,
  formatDate,
  openTextModal
}) {
  const totalExpense = expenses.filter(e => e.type === "Expense").reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalIncome = expenses.filter(e => e.type === "Income").reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalPending = expenses.filter(e => e.type === "Pending").reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const targetFilterStr = expenseFilterDate ? toLocalDateStr(expenseFilterDate) : null;
  const filteredExpenses = targetFilterStr
    ? expenses.filter(e => e.date === targetFilterStr)
    : expenses;

  const grouped = filteredExpenses.reduce((groups, item) => {
    const date = item.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Expense & Payment Tracker</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Track and manage company expenditures, received payments, and pending client milestones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1 text-left">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Expenses</span>
            <div className="text-2xl font-black text-rose-600">{totalExpense.toLocaleString("en-IN")}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1 text-left">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payments Received</span>
            <div className="text-2xl font-black text-emerald-600">{totalIncome.toLocaleString("en-IN")}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between">
          <div className="space-y-1 text-left">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Payments</span>
            <div className="text-2xl font-black text-amber-600">{totalPending.toLocaleString("en-IN")}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/60 shadow-xs p-4">
        <div className="text-sm font-bold text-slate-800 text-left">Filter logs by specific date:</div>
        <div className="flex items-center gap-2">
          <DatePicker
            selected={expenseFilterDate}
            onChange={d => setExpenseFilterDate(d)}
            placeholderText="Select Date"
            dateFormat="dd/MM/yyyy"
            isClearable
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer outline-none w-36 text-center"
          />
          {expenseFilterDate && (
            <button
              onClick={() => setExpenseFilterDate(null)}
              className="text-xs text-rose-600 font-bold hover:underline cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 h-fit lg:sticky lg:top-24">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              {expenseForm._id ? "Edit Transaction" : "New Transaction"}
            </h4>
            {expenseForm._id && (
              <button
                type="button"
                onClick={() => setExpenseForm({ date: toLocalDateStr(new Date()), type: "Expense", amount: "", name: "", project: "", description: "" })}
                className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</label>
              <input
                type="date"
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                value={expenseForm.date}
                onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction Type</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                value={expenseForm.type}
                onChange={e => setExpenseForm({ ...expenseForm, type: e.target.value })}
                required
              >
                <option value="Expense">Expense Occurred (Out)</option>
                <option value="Income">Payment Received (In)</option>
                <option value="Pending">Project Pending (Pending)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                min="0"
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                value={expenseForm.amount}
                onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {expenseForm.type === "Pending" ? "Project Name" : "Person / Party Name"}
              </label>
              <input
                type="text"
                placeholder={expenseForm.type === "Pending" ? "e.g. Website Redesign" : "e.g. Rahul Kumar or Client Name"}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                value={expenseForm.name}
                onChange={e => setExpenseForm({ ...expenseForm, name: e.target.value })}
                required
              />
            </div>

            {expenseForm.type !== "Pending" && (
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. E-Commerce App"
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  value={expenseForm.project}
                  onChange={e => setExpenseForm({ ...expenseForm, project: e.target.value })}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes / Description</label>
              <textarea
                rows={3}
                placeholder="Enter details..."
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                value={expenseForm.description}
                onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              disabled={loading}
            >
              {loading ? "Saving..." : expenseForm._id ? "✓ Update Record" : "Save Record"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {expenseLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-12 text-center text-slate-400 font-semibold text-sm">
              Loading transaction records...
            </div>
          ) : sortedDates.length > 0 ? (
            sortedDates.map(dateStr => (
              <div key={dateStr} className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="text-sm font-black text-slate-800">{formatDate(dateStr)}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-200/50 px-2 py-0.5 rounded-md">
                    {grouped[dateStr].length} {grouped[dateStr].length === 1 ? "entry" : "entries"}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {grouped[dateStr].map(rec => {
                    let typePill = null;
                    let typeColor = "";

                    if (rec.type === "Expense") {
                      typePill = <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-md">Expense</span>;
                      typeColor = "text-rose-600";
                    } else if (rec.type === "Income") {
                      typePill = <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md">Received</span>;
                      typeColor = "text-emerald-600";
                    } else {
                      typePill = <span className="text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md">Pending</span>;
                      typeColor = "text-amber-600";
                    }

                    return (
                      <div key={rec._id} className="p-5 flex flex-wrap justify-between items-center gap-4 hover:bg-slate-50/20 transition-colors">
                        <div className="space-y-1.5 max-w-[70%] text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            {typePill}
                            <strong className="text-slate-800 font-bold text-sm">{rec.name}</strong>
                            {rec.project && (
                              <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md">
                                Proj: {rec.project}
                              </span>
                            )}
                          </div>

                          {rec.description && (
                            <p className="text-xs text-slate-500 cursor-pointer hover:text-green-700 transition" onClick={() => openTextModal("Transaction Details", rec.description)}>
                              {rec.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 ml-auto">
                          <div className={`text-base font-black ${typeColor}`}>
                            {rec.amount.toLocaleString("en-IN")}
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
                              ✕
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
  );
}
