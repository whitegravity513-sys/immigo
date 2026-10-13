import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRightLeft, User, Building2, Clock, CheckCircle2, AlertCircle, ExternalLink, ArrowRight } from "lucide-react";
import refundService from "../../modules/vendor/services/refundService";

export default function VendorRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

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

  const displayedRefunds = showAll ? refunds : refunds.slice(0, 5);

  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto space-y-4 font-sans">
      {/* Page Header (Compact Height & Refined Bold) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
              Settlements & Claims
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Candidate Refund Requests
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Track status of all candidates for whom a refund has been applied.
          </p>
        </div>

        <Link
          to="/vendor/candidates"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <User size={13} />
          <span>View Candidates Pool</span>
        </Link>
      </div>

      {/* Info Tip Note */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 text-xs text-blue-900">
        <Clock size={15} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Refund Policy & Application Process:</span>{" "}
          <span>
            Refund requests are submitted directly from the specific candidate's profile page. Once submitted, requests are verified by the admin team and processed as per agreement terms.
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center bg-white rounded-xl border border-slate-200 space-y-2">
          <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading refund records...</p>
        </div>
      ) : refunds.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ArrowRightLeft size={20} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Refund Requests Applied</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You haven't requested any refunds yet. To request a refund for an eligible candidate who did not join or dropped out, navigate to their candidate profile.
          </p>
          <div className="pt-2">
            <Link
              to="/vendor/candidates"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-2xs"
            >
              <span>Go to Candidate Profiles</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Top Control Bar: Showing 5 items with See All toggle */}
          <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Applied Refund Claims List
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                ({displayedRefunds.length} of {refunds.length} shown)
              </span>
            </div>

            {refunds.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-blue-600 transition cursor-pointer shadow-2xs"
              >
                <span>{showAll ? "Show Top 5 Only" : `See All (${refunds.length})`}</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-3.5">Candidate & Ref ID</th>
                  <th className="py-2.5 px-3.5">Project & Employer</th>
                  <th className="py-2.5 px-3.5">Reason for Refund</th>
                  <th className="py-2.5 px-3.5 text-center">Amount</th>
                  <th className="py-2.5 px-3.5 text-center">Refund Status</th>
                  <th className="py-2.5 px-3.5 text-right">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRefunds.map((r) => {
                  const status = r.refundStatus || "Refund Pending";
                  const isPending = status.toLowerCase().includes("pending");
                  const isSuccess = status.toLowerCase().includes("refunded") || status.toLowerCase().includes("approved");
                  const amount = Number(r.refundAmount || r.amount || 0);

                  return (
                    <tr key={r.id || Math.random()} className="hover:bg-slate-50/60 transition-colors">
                      {/* Candidate */}
                      <td className="py-2.5 px-3.5">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            <span>{r.candidateName || "Candidate"}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            Claim ID: {r.id || "RFD"}
                          </span>
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-2.5 px-3.5">
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
                      <td className="py-2.5 px-3.5 text-slate-600 max-w-xs">
                        <span className="line-clamp-2" title={r.refundReason}>
                          {r.refundReason || "No reason specified"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-2.5 px-3.5 text-center font-bold text-slate-900 font-mono">
                        {amount > 0 ? `₹${amount.toLocaleString()}` : "As per policy"}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3.5 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
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
                            <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                              Ref: {r.paymentRef}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3.5 text-right text-slate-500 font-mono text-[10px]">
                        {r.refundDate || new Date().toISOString().split("T")[0]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Bar (When 5 are shown and more exist) */}
          {refunds.length > 5 && !showAll && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={() => setShowAll(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                <span>See All ({refunds.length}) Refund Claims on Full Page</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
