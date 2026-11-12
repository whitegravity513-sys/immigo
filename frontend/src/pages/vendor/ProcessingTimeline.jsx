import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  UserCheck,
  ChevronRight,
  CreditCard,
  Search,
  Users,
  ArrowLeft,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService";
import refundService, { isAppRefundLocked } from "../../services/refundService";

const POST_SELECTION_STATUSES = new Set([
  "Selected",
  "Completed",
  "Processing",
  "Offer Released",
  "Offer Accepted",
  "Visa Processing",
  "Visa Issued",
  "Visa Allotted",
  "Joined",
  "Deployed",
]);

export default function ProcessingTimeline() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      await crmVendorService.getAvailableProjects(curVendor?.id).catch(() => []);
      const [data, allRefunds] = await Promise.all([
        crmVendorService.getApplications(curVendor?.id),
        refundService.getAllRefunds(curVendor?.id).catch(() => []),
      ]);
      const selectedApps = (data || []).filter(
        (a) =>
          (POST_SELECTION_STATUSES.has(a.status) ||
            POST_SELECTION_STATUSES.has(a.recruitmentStage)) &&
          !isAppRefundLocked(a, allRefunds)
      );
      setApplications(selectedApps);
    } catch (err) {
      console.error("Failed to load processing timeline:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    const handleRefresh = () => loadData();
    window.addEventListener("immigo:application-update", handleRefresh);
    window.addEventListener("immigo:vendor-hr-refresh", handleRefresh);
    window.addEventListener("immigo:refund-update", handleRefresh);
    window.addEventListener("immigo:dashboard-update", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("immigo:application-update", handleRefresh);
      window.removeEventListener("immigo:vendor-hr-refresh", handleRefresh);
      window.removeEventListener("immigo:refund-update", handleRefresh);
      window.removeEventListener("immigo:dashboard-update", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
  }, [loadData]);

  const filteredApps = applications.filter((app) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      app.candidateName?.toLowerCase().includes(term) ||
      app.position?.toLowerCase().includes(term) ||
      app.projectName?.toLowerCase().includes(term) ||
      app.clientName?.toLowerCase().includes(term) ||
      app.country?.toLowerCase().includes(term)
    );
  });

  const getMilestonesForApp = (app) => {
    const syncedMs = !app.milestonesOverridden
      ? crmVendorService.syncAppMilestonesWithProject(app)
      : [];
    if (syncedMs.length > 0) return syncedMs;
    if (app.processMilestones?.length) return app.processMilestones;
    return app.paymentPlan?.milestones || [];
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Deployment Tracker</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Deployment &amp; Processing Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select any selected candidate below to complete milestone payments and track admin-verified processing stages.
          </p>
        </div>

        <Link
          to="/vendor/payments"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto"
        >
          <CreditCard className="w-4 h-4 text-indigo-600" />
          <span>View Milestone Payments</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading deployment roster...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No selected candidates in deployment</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Once a candidate is marked Selected, their payment milestones and deployment stages appear here automatically.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={16} className="text-indigo-600" />
              <span>Selected Candidates ({applications.length})</span>
            </h3>

            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by name, role, project..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Candidate</th>
                  <th className="py-2.5 px-4">Project &amp; Role</th>
                  <th className="py-2.5 px-4">Payment Status</th>
                  <th className="py-2.5 px-4">Stages Progress</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-slate-400">
                      No selected deployment candidate matches &quot;{searchTerm}&quot;
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => {
                    const resolvedAppId = app.id || app.applicationId || app._id;
                    const milestones = getMilestonesForApp(app);
                    const totalM = milestones.length;
                    const paidM = milestones.filter(
                      (m) =>
                        m.paymentStatus === "Approved" ||
                        m.status === "Paid" ||
                        m.status === "Completed"
                    ).length;
                    const submittedM = milestones.filter(
                      (m) =>
                        m.paymentStatus === "Submitted" ||
                        m.paymentStatus === "Pending Verification" ||
                        m.status === "Submitted"
                    ).length;
                    const allStages = milestones.flatMap((m) =>
                      Array.isArray(m.stages) ? m.stages : []
                    );
                    const doneStages = allStages.filter(
                      (s) => s.status === "Completed"
                    ).length;
                    const stagePct =
                      allStages.length > 0
                        ? Math.round((doneStages / allStages.length) * 100)
                        : totalM > 0
                        ? Math.round((paidM / totalM) * 100)
                        : 0;

                    return (
                      <tr
                        key={resolvedAppId}
                        onClick={() =>
                          navigate(`/vendor/processing/${resolvedAppId}`, {
                            state: { application: app },
                          })
                        }
                        className="hover:bg-indigo-50/40 cursor-pointer transition group"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200 shrink-0">
                              {app.candidateName?.slice(0, 2).toUpperCase() || "CN"}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 group-hover:text-indigo-700 transition block truncate">
                                {app.candidateName}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {app.candidateId || resolvedAppId}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                            {app.projectName || "Assigned Project"}
                          </span>
                          <span className="text-xs text-slate-500 font-medium block truncate max-w-[200px]">
                            {app.position || "Trade"}
                            {app.country ? ` • ${app.country}` : ""}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {totalM === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                              No Milestones
                            </span>
                          ) : paidM === totalM ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} />
                              <span>All Paid ({paidM}/{totalM})</span>
                            </span>
                          ) : submittedM > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock size={12} />
                              <span>Pending Admin Verification</span>
                            </span>
                          ) : paidM > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock size={12} />
                              <span>Partial Paid ({paidM}/{totalM})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <CreditCard size={12} />
                              <span>Payment Due (0/{totalM})</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-1.5">
                            <div className="w-40 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                                <span>
                                  {allStages.length > 0
                                    ? `${doneStages}/${allStages.length} Stages`
                                    : `Milestone ${paidM}/${totalM}`}
                                </span>
                                <span className="text-indigo-700">{stagePct}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${stagePct}%` }}
                                />
                              </div>
                            </div>
                            {milestones.length > 0 && (
                              <div className="flex items-center gap-1 flex-nowrap whitespace-nowrap">
                                {milestones.slice(0, 3).map((m, mIdx) => {
                                  const isMPaid =
                                    m.paymentStatus === "Approved" ||
                                    m.status === "Paid" ||
                                    m.status === "Completed";
                                  const isMSub =
                                    m.paymentStatus === "Submitted" ||
                                    m.paymentStatus === "Pending Verification" ||
                                    m.status === "Submitted";
                                  const mAmt = Number(m.paymentAmount ?? m.amount ?? 0);
                                  return (
                                    <span
                                      key={m.id || mIdx}
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap ${
                                        isMPaid
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : isMSub
                                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                                          : "bg-slate-100 text-slate-600 border border-slate-200"
                                      }`}
                                      title={`${m.name}: ₹${mAmt.toLocaleString()}`}
                                    >
                                      {isMPaid ? (
                                        <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                                      ) : (
                                        <Clock size={10} className="text-amber-500 shrink-0" />
                                      )}
                                      <span>M{mIdx + 1}</span>
                                      <span>₹{mAmt.toLocaleString()}</span>
                                    </span>
                                  );
                                })}
                                {milestones.length > 3 && (
                                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-200">
                                    +{milestones.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Link
                            to={`/vendor/processing/${resolvedAppId}`}
                            state={{ application: app }}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition"
                          >
                            <span>Open &amp; Pay</span>
                            <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
