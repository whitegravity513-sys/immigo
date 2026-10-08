import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRightLeft, Plus } from "lucide-react";
import refundService from "../../modules/vendor/services/refundService";

export default function VendorRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const allRefunds = await refundService.getAllRefunds();
      setRefunds(allRefunds);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Refund Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your refund requests for selected candidates who did not join.
          </p>
        </div>
        <Link
          to="/vendor/refunds/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Refund Request</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Loading refunds...</div>
      ) : refunds.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <ArrowRightLeft className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No refund requests</h3>
          <p className="text-xs text-slate-500 mt-1">You haven't requested any refunds yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Project</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Status & Details</th>
                <th className="py-3.5 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {refunds.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-4 px-4 font-bold text-slate-900">{r.candidateName}</td>
                  <td className="py-4 px-4 font-semibold text-slate-700">{r.projectName}</td>
                  <td className="py-4 px-4 text-slate-600 max-w-xs truncate">{r.refundReason}</td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        r.refundStatus.includes("Pending") ? "bg-amber-100 text-amber-800" :
                        r.refundStatus.includes("Refunded") ? "bg-emerald-100 text-emerald-800" :
                        "bg-rose-100 text-rose-800"
                      }`}>
                        {r.refundStatus}
                      </span>
                      {r.refundStatus === "Fully Refunded" && r.paymentRef && (
                        <span className="text-[10px] font-mono text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          Ref: {r.paymentRef}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-500">{r.refundDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
