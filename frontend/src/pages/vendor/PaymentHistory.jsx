import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import crmVendorService from "../../services/crmVendorService";
import refundService from "../../services/refundService";
import CandidateProcessTimeline from "../../components/vendor/CandidateProcessTimeline.jsx";

export default function PaymentHistory() {
  const { appId } = useParams();
  const [app, setApp] = useState(null);
  const [matchedProject, setMatchedProject] = useState(null);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();

      const [projs, allApps, rData] = await Promise.all([
        crmVendorService.getAvailableProjects(curVendor?.id).catch(() => []),
        crmVendorService.getApplications(curVendor?.id),
        refundService.getAllRefunds(curVendor?.id).catch(() => []),
      ]);
      setRefunds(rData || []);
      const targetApp = allApps?.find(
        (a) =>
          String(a.id) === String(appId) ||
          String(a.applicationId) === String(appId) ||
          String(a._id) === String(appId)
      );
      const foundProj = (projs || []).find(
        (p) =>
          (targetApp?.projectId &&
            (String(p.id) === String(targetApp.projectId) ||
              String(p._id) === String(targetApp.projectId))) ||
          (targetApp?.projectName &&
            (p.name === targetApp.projectName ||
              p.title === targetApp.projectName ||
              p.projectName === targetApp.projectName))
      );
      setMatchedProject(foundProj || null);
      setApp(targetApp);
    } catch (err) {
      console.error("Failed to load payment history:", err);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    const handleRefresh = () => loadData();
    window.addEventListener("immigo:application-update", handleRefresh);
    window.addEventListener("immigo:refund-update", handleRefresh);
    window.addEventListener("immigo:vendor-hr-refresh", handleRefresh);
    window.addEventListener("immigo:dashboard-update", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("immigo:application-update", handleRefresh);
      window.removeEventListener("immigo:refund-update", handleRefresh);
      window.removeEventListener("immigo:vendor-hr-refresh", handleRefresh);
      window.removeEventListener("immigo:dashboard-update", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
  }, [loadData]);

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

  const syncedMs = !app.milestonesOverridden
    ? crmVendorService.syncAppMilestonesWithProject(app, matchedProject ? [matchedProject] : null)
    : [];
  const milestones =
    syncedMs.length > 0
      ? syncedMs
      : app.processMilestones?.length
      ? app.processMilestones
      : app.paymentPlan?.milestones || [];
  const paidMilestones = milestones.filter(
    (m) => m.paymentStatus === "Approved" || m.status === "Paid" || m.status === "Completed"
  );
  const paidAmount = paidMilestones.reduce(
    (acc, m) => acc + Number(m.paymentAmount ?? m.amount ?? 0),
    0
  );
  const msSum = milestones.reduce(
    (acc, m) => acc + Number(m.paymentAmount ?? m.amount ?? 0),
    0
  );
  const total = msSum > 0 ? msSum : Number(app.paymentPlan?.totalAmount || 0);
  const remaining = Math.max(0, total - paidAmount);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      <Link
        to="/vendor/payments"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold transition"
      >
        <ArrowLeft size={14} /> Back to Payments
      </Link>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest block mb-1">
              Milestone Disbursement Breakdown
            </span>
            <h3 className="text-xl font-bold text-slate-900">{app.candidateName}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {app.position} • {app.projectName} ({app.clientName})
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Total Agreed Fee</span>
            <span className="font-bold text-slate-900 text-base">
              ₹{total.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Released / Paid</span>
            <span className="font-bold text-emerald-600 text-base">
              ₹{paidAmount.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Remaining Balance</span>
            <span className="font-bold text-amber-600 text-base">
              ₹{remaining.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="font-semibold text-slate-900 text-sm">
              Recruitment Stages & Milestone Payments
            </h4>
            <p className="text-xs text-slate-500">
              Track processing stages, submit offline payment proof or pay directly online via Razorpay.
            </p>
          </div>

          <CandidateProcessTimeline
            application={app}
            project={matchedProject}
            refunds={refunds}
            isAdmin={false}
            onUpdate={loadData}
          />
        </div>
      </div>
    </div>
  );
}
