import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Clock,
  CreditCard,
  ArrowRight,
  Send,
  UserCheck,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";
import ActiveMeetingAlertBanner from "../../../components/common/meeting/ActiveMeetingAlertBanner.jsx";

const VENDOR_DASHBOARD_STORAGE_KEYS = new Set([
  "immigo_crm_vendors_v3",
  "immigo_crm_candidates_v3",
  "immigo_crm_applications_v3",
  "immigo_crm_refunds_v3",
  "immigo_crm_admin_notifications_v3",
]);

export default function AdminVendorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async (silent = false) => {
    try {
      if (silent !== true) {
        setLoading(true);
      }
      const data = await crmVendorService.getAdminVendorOverviewStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load vendor management dashboard stats:", err);
    } finally {
      if (silent !== true) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) loadStats(false);
    });

    let debounceTimer = null;
    const handleUpdate = (e) => {
      if (e?.type === "storage" && (!e.key || !VENDOR_DASHBOARD_STORAGE_KEYS.has(e.key))) {
        return;
      }
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!cancelled) loadStats(true);
      }, 60);
    };

    window.addEventListener("immigo:application-update", handleUpdate);
    window.addEventListener("immigo:candidate-update", handleUpdate);
    window.addEventListener("immigo:refund-update", handleUpdate);
    window.addEventListener("immigo:dashboard-update", handleUpdate);
    window.addEventListener("immigo:vendor-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("immigo:application-update", handleUpdate);
      window.removeEventListener("immigo:candidate-update", handleUpdate);
      window.removeEventListener("immigo:refund-update", handleUpdate);
      window.removeEventListener("immigo:dashboard-update", handleUpdate);
      window.removeEventListener("immigo:vendor-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadStats]);

  if (loading && !stats) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-slate-500">Loading vendor management overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vendor Management</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Overview of vendors, candidates, submissions and payments
        </p>
      </div>

      <ActiveMeetingAlertBanner />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Vendors</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{stats.totalVendors}</div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
            <span className="text-amber-600 font-semibold">{stats.pendingVendors} Pending</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">{stats.approvedVendors} Approved</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Candidates</span>
          <div className="text-xl font-bold text-indigo-600 mt-0.5">{stats.totalCandidates}</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">In candidate pool</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Review</span>
          <div className="text-xl font-bold text-amber-600 mt-0.5">{stats.pendingCandidates}</div>
          <span className="text-[10px] text-amber-700 block">Submissions awaiting review</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selected / Processing</span>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">{stats.selectedCandidates}</div>
          <span className="text-[10px] text-slate-500 block truncate">{stats.inProcessing} in 8-stage pipeline</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Payments</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">₹{(stats.pendingPayments || 0).toLocaleString()}</div>
          <span className="text-[10px] text-rose-600 font-semibold block truncate">Overdue: ₹{(stats.overduePayments || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3.5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Recent Vendor Activity & Updates</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live activity stream of vendor registrations, candidate submissions, document verifications, and approvals.
            </p>
          </div>
          <Link
            to="/admin/vendor/vendors"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors shrink-0"
          >
            <span>See All Vendors</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="space-y-2.5">
          {(stats.recentActivity || []).map((act, i) => (
            <div
              key={act.id || i}
              className="p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  <ActivityIcon type={act.type} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-900">{act.title}</h4>
                    {act.type && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100/60 text-indigo-700">
                        {act.type}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 truncate">{act.description}</p>
                </div>
              </div>

              <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap shrink-0">
                {act.time}
              </span>
            </div>
          ))}

          {(!stats.recentActivity || stats.recentActivity.length === 0) && (
            <div className="p-8 text-center text-xs text-slate-400">
              No recent vendor activity recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ type }) {
  switch (type) {
    case "vendor":
      return <Building2 className="w-4 h-4" />;
    case "submission":
      return <Send className="w-4 h-4 text-blue-600" />;
    case "selected":
      return <UserCheck className="w-4 h-4 text-emerald-600" />;
    case "payment":
      return <CreditCard className="w-4 h-4 text-amber-600" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}
