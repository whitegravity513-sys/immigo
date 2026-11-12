import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import crmVendorService from "../../services/crmVendorService";
import refundService from "../../services/refundService";
import CandidateProcessTimeline from "../../components/vendor/CandidateProcessTimeline.jsx";

const APPLICATION_STORAGE_KEYS = new Set([
  "immigo_crm_applications_v3",
  "immigo_crm_refunds_v3",
]);

export default function VendorProcessingDetails() {
  const { appId } = useParams();
  const location = useLocation();
  const initialAppState = location.state?.application || null;

  const [currentApp, setCurrentApp] = useState(initialAppState);
  const [matchedProject, setMatchedProject] = useState(null);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(!initialAppState);

  const loadData = useCallback(
    async (silent = false) => {
      try {
        if (silent !== true && !initialAppState) {
          setLoading(true);
        }
        const curVendor = crmVendorService.getCurrentVendor();
        const [projs, data, rData] = await Promise.all([
          crmVendorService.getAvailableProjects(curVendor?.id).catch(() => []),
          crmVendorService.getApplications(curVendor?.id),
          refundService.getAllRefunds(curVendor?.id).catch(() => []),
        ]);
        setRefunds(rData || []);
        const matchAppFn = (a) =>
          [a?.id, a?.applicationId, a?._id].some(
            (k) => k && String(k) === String(appId)
          );
        let app = data?.find(matchAppFn);
        if (!app) {
          const allApps = await crmVendorService.getApplications();
          app = allApps?.find(matchAppFn);
        }
        const resolvedApp = app || (initialAppState && matchAppFn(initialAppState) ? initialAppState : initialAppState);
        const foundProject = (projs || []).find(
          (p) =>
            (resolvedApp?.projectId &&
              (String(p.id) === String(resolvedApp.projectId) ||
                String(p._id) === String(resolvedApp.projectId) ||
                String(p.projectId) === String(resolvedApp.projectId))) ||
            (resolvedApp?.projectName &&
              (p.name === resolvedApp.projectName ||
                p.title === resolvedApp.projectName ||
                p.projectName === resolvedApp.projectName))
        );
        setMatchedProject(foundProject || null);
        setCurrentApp(resolvedApp || null);
      } catch (err) {
        console.error(err);
      } finally {
        if (silent !== true) {
          setLoading(false);
        }
      }
    },
    [appId, initialAppState]
  );

  useEffect(() => {
    const initTimer = setTimeout(() => {
      loadData(false);
    }, 0);
    let debounceTimer = null;
    const handleUpdate = (e) => {
      if (e?.type === "storage" && (!e.key || !APPLICATION_STORAGE_KEYS.has(e.key))) {
        return;
      }
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadData(true);
      }, 60);
    };
    window.addEventListener("immigo:application-update", handleUpdate);
    window.addEventListener("immigo:refund-update", handleUpdate);
    window.addEventListener("immigo:vendor-hr-refresh", handleUpdate);
    window.addEventListener("immigo:dashboard-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      clearTimeout(initTimer);
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("immigo:application-update", handleUpdate);
      window.removeEventListener("immigo:refund-update", handleUpdate);
      window.removeEventListener("immigo:vendor-hr-refresh", handleUpdate);
      window.removeEventListener("immigo:dashboard-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadData]);

  if (loading && !currentApp) {
    return (
      <div className="p-12 text-center text-slate-500">
        Loading deployment timeline...
      </div>
    );
  }

  if (!currentApp) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="text-slate-600 font-medium">Deployment record not found.</p>
        <Link
          to="/vendor/processing"
          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-xs font-bold"
        >
          <ArrowLeft size={14} /> Back to Deployment Timeline
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/vendor/processing"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold transition"
        >
          <ArrowLeft size={14} /> Back to Deployment Timeline
        </Link>
        <Link
          to="/vendor/selected"
          className="text-xs font-semibold text-indigo-600 hover:underline"
        >
          Selected Candidates
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-5 text-xs space-y-2.5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">Candidate Dossier</span>
          <Link
            to={`/vendor/candidates/${currentApp.candidateId}`}
            className="text-indigo-600 font-bold hover:underline flex items-center gap-1 text-xs"
          >
            <span>View Profile</span>
            <ExternalLink size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-slate-600 pt-1">
          <div>
            <span className="text-slate-400 block text-[10px]">Candidate</span>
            <span className="font-bold text-slate-900 truncate block text-sm">{currentApp.candidateName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Employer / Client</span>
            <span className="font-bold text-slate-800 truncate block">{currentApp.clientName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Deployment Country</span>
            <span className="font-bold text-indigo-600">{currentApp.country}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Selection Date</span>
            <span className="font-bold text-slate-800">
              {currentApp.selectionDate ? new Date(currentApp.selectionDate).toLocaleDateString("en-GB") : "Recently"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Payment Milestones &amp; Processing Stages</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Complete milestone payment first. Once Admin verifies receipt, processing stages update below.
            </p>
          </div>
        </div>

        <CandidateProcessTimeline
          application={currentApp}
          project={matchedProject}
          refunds={refunds}
          onUpdate={() => loadData(true)}
        />
      </div>
    </div>
  );
}
