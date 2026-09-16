import React from "react";
import { AlertCircle } from "lucide-react";

export default function EmployeeAnnouncementsTab({ announcements, fmtDate }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Company Announcements</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">View all past and present broadcasted announcements</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        <div className="p-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {["Date", "Title", "Message"].map((h) => (
                  <th key={h} className="px-5 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {announcements.map((a) => (
                <tr key={a._id} className="hover:bg-indigo-50/30 transition-colors border-b border-slate-100 last:border-0">
                  <td className="px-5 py-4 text-sm font-bold text-slate-700 whitespace-nowrap">
                    {fmtDate(a.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-indigo-900 whitespace-nowrap">
                    {a.title}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600 max-w-lg truncate" title={a.message}>
                    {a.message}
                  </td>
                </tr>
              ))}
              {announcements.length === 0 && (
                <tr>
                  <td colSpan="3">
                    <div className="text-center py-12 text-slate-500 font-semibold text-sm flex flex-col items-center justify-center">
                      <AlertCircle size={32} className="text-slate-300 mb-3" />
                      No announcements broadcasted yet.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
