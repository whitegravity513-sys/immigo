import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import crmVendorService from "../../services/crmVendorService";
import CandidateProcessTimeline from "../../components/crm/vendor/CandidateProcessTimeline";

export default function PaymentHistory() {
  const { appId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [appId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      setVendor(curVendor);

      const allApps = await crmVendorService.getApplications(curVendor?.id);
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

  const milestones = (app.processMilestones?.length ? app.processMilestones : app.paymentPlan?.milestones) || [];
  const paidMilestones = milestones.filter((m) => m.paymentStatus === "Approved" || m.status === "Paid");
  const paidAmount = paidMilestones.reduce((acc, m) => acc + (Number(m.paymentAmount || m.amount) || 0), 0);
  const total = Number(app.paymentPlan?.totalAmount || milestones.reduce((acc, m) => acc + (Number(m.paymentAmount || m.amount) || 0), 0) || 40000);
  const remaining = Math.max(0, total - paidAmount);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      <Link
        to="/vendor/payments"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold transition"
      >
        <ArrowLeft size={14} /> Back to Payments
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest block mb-1">
              Milestone Disbursement Breakdown
            </span>
            <h3 className="text-xl font-black text-slate-900">{app.candidateName}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {app.position} • {app.projectName} ({app.clientName})
            </p>
          </div>
        </div>

        {/* Agreed Fee Banner */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Total Agreed Fee</span>
            <span className="font-black text-slate-900 text-base">
              ₹{total.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Released / Paid</span>
            <span className="font-black text-emerald-600 text-base">
              ₹{paidAmount.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Remaining Balance</span>
            <span className="font-black text-amber-600 text-base">
              ₹{remaining.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Interactive Stages & Milestones with Payment Option */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="font-black text-slate-900 text-sm">
              Recruitment Stages & Milestone Payments
            </h4>
            <p className="text-xs text-slate-500">
              Complete stages, submit offline payment proof or pay directly online via Razorpay.
            </p>
          </div>

          <CandidateProcessTimeline
            application={app}
            isAdmin={false}
            onUpdate={loadData}
          />
        </div>
      </div>
    </div>
  );
}
