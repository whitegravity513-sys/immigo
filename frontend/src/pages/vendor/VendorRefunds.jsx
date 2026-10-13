import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRightLeft, User, Building2, Clock, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
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
      setRefunds(allRefunds || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
              Settlements & Claims
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Candidate Refund Requests
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Track status of all candidates for whom a refund has been applied. To submit a refund for any eligible candidate, open their respective <strong>Candidate Profile</strong>.
          </p>
        </div>

        <Link
          to="/vendor/candidates"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <User size={13} />
          <span>View Candidates Pool</span>
        </Link>
      </div>

      {/* Info Tip Note */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 sm:p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
        <Clock size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Refund Policy & Application Process:</span>{" "}
          <span>
            Refund requests are submitted directly from the specific candidate's profile page. Once submitted, requests are verified by the admin team and processed as per agreement terms.
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading refund records...</p>
        </div>
      ) : refunds.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ArrowRightLeft size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Refund Requests Applied</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You haven't requested any refunds yet. To request a refund for an eligible candidate who did not join or dropped out, navigate to their candidate profile.
          </p>
          <div className="pt-2">
            <Link
              to="/vendor/candidates"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-2xs"
            >
              <span>Go to Candidate Profiles</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Applied Refund Claims List ({refunds.length})
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">All recorded claims</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Candidate & Ref ID</th>
                  <th className="py-3 px-4">Project & Employer</th>
                  <th className="py-3 px-4">Reason for Refund</th>
                  <th className="py-3 px-4 text-center">Amount</th>
                  <th className="py-3 px-4 text-center">Refund Status</th>
                  <th className="py-3 px-4 text-right">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refunds.map((r) => {
                  const status = r.refundStatus || "Refund Pending";
                  const isPending = status.toLowerCase().includes("pending");
                  const isSuccess = status.toLowerCase().includes("refunded") || status.toLowerCase().includes("approved");
                  const amount = Number(r.refundAmount || r.amount || 0);

                  return (
                    <tr key={r.id || Math.random()} className="hover:bg-slate-50/60 transition-colors">
                      {/* Candidate */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-extrabold text-slate-900 flex items-center gap-1">
                            <span>{r.candidateName || "Candidate"}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            Claim ID: {r.id || "RFD"}
                          </span>
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {r.projectName || "General Project"}
                        </div>
                        {r.clientName && (
                          <span className="text-[10px] text-slate-500 block">
                            Client: {r.clientName}
                          </span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                        <span className="line-clamp-2" title={r.refundReason}>
                          {r.refundReason || "No reason specified"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">
                        {amount > 0 ? `₹${amount.toLocaleString()}` : "As per policy"}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isPending
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : isSuccess
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}
                          >
                            {status}
                          </span>
                          {r.paymentRef && (
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              Ref: {r.paymentRef}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px]">
                        {r.refundDate || new Date().toISOString().split("T")[0]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
