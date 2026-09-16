import React from "react";

export default function HolidaysSection({
  handleCreateHolidaySubmit,
  holidayForm,
  setHolidayForm,
  holidayLoading,
  holidays = [],
  formatDate,
  handleDeleteHoliday
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Holiday Management</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Declare official company holidays</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 h-fit">
          <h4 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider">Declare New Holiday</h4>
          <form onSubmit={handleCreateHolidaySubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Holiday Date</label>
              <input
                type="date"
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                value={holidayForm.date}
                onChange={e => setHolidayForm({ ...holidayForm, date: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Holiday Title</label>
              <input
                type="text"
                placeholder="e.g. Republic Day"
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                value={holidayForm.title}
                onChange={e => setHolidayForm({ ...holidayForm, title: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</label>
              <textarea
                rows={3}
                placeholder="e.g. National holiday celebration"
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
                value={holidayForm.description}
                onChange={e => setHolidayForm({ ...holidayForm, description: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer"
              disabled={holidayLoading}
            >
              {holidayLoading ? "Saving..." : "Save Holiday"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden lg:col-span-2">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
            <h4 className="text-sm font-black text-slate-800">Declared Holidays ({holidays.length})</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {["Date", "Title", "Description", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holidays.map(h => (
                  <tr key={h._id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3.5 text-sm font-bold text-slate-700 whitespace-nowrap">
                      {formatDate(h.date)}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-800">
                      {h.title}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 max-w-[200px] truncate" title={h.description}>
                      {h.description || <span className="italic text-slate-300">No description</span>}
                    </td>
                    <td className="px-4 py-3.5 text-sm">
                      <button
                        onClick={() => handleDeleteHoliday(h._id)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all border border-rose-100 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {holidays.length === 0 && (
                  <tr>
                    <td colSpan="4">
                      <div className="text-center py-12 text-slate-500 font-semibold text-sm">
                        No official holidays declared yet.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
