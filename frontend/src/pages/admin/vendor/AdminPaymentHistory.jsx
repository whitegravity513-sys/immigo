import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";

export default function AdminPaymentHistory() {
  const { appId } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [appId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const allApps = await crmVendorService.getApplications();
      const targetApp = allApps?.find((a) => String(a.id) === String(appId));
      setApp(targetApp);
    } catch (err) {
      console.error("Failed to load payment history:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        Loading payment history...
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-12 text-center text-slate-500">
        Payment history not found.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 font-sans">
      <Link
        to="/admin/vendor/payments"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold transition"
      >
        <ArrowLeft size={14} /> Back to Payments
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
              Payment Audit Trail
            </span>
            <h3 className="text-xl font-black text-slate-900">{app.candidateName}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Project: {app.projectName} • Vendor: {app.vendorId}
            </p>
          </div>
        </div>

        {/* Individual Milestones List */}
        <div className="space-y-4 text-xs">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
            Milestone Disbursement Logs
          </h4>
          <div className="space-y-3">
            {!app.paymentPlan?.milestones || app.paymentPlan.milestones.length === 0 ? (
              <p className="text-slate-500">No milestones generated yet.</p>
            ) : (
              app.paymentPlan.milestones.map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between shadow-sm hover:border-indigo-300 transition-colors"
                >
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-900 block text-sm">{m.name}</span>
                    <span className="text-[11px] text-slate-500 block">
                      Amount: <strong className="text-slate-900 font-bold">₹{Number(m.amount).toLocaleString()}</strong> • Status: <span className={m.status === "Paid" ? "text-emerald-600 font-bold" : "text-amber-600"}>{m.status}</span>
                    </span>
                    {m.paymentRef && (
                      <span className="text-[10px] text-slate-500 font-mono block bg-white p-1.5 rounded border border-slate-100 mt-1">
                        Ref: {m.paymentRef} • Paid Date: {m.paidDate || "N/A"}
                      </span>
                    )}
                  </div>

                  <div className="shrink-0">
                    {m.status === "Paid" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={14} className="text-emerald-600" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
