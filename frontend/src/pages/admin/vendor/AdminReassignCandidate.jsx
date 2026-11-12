import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { UserCheck, Building2, Briefcase, ArrowLeft, AlertTriangle, RotateCcw } from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";
import { crmClientService } from "../../../services/crmClientService";
import refundService, {
  getAppRefundStatus,
  REASSIGN_ELIGIBLE_REFUND_STATUSES,
} from "../../../services/refundService";

export default function AdminReassignCandidate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appId = searchParams.get("appId");
  const refundIdParam = searchParams.get("refundId");

  const [application, setApplication] = useState(null);
  const [refundRecord, setRefundRecord] = useState(null);
  const [clients, setClients] = useState([]);
  const [assignForm, setAssignForm] = useState({ clientId: "", projectId: "", position: "" });
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!appId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [apps, clientsData, refunds] = await Promise.all([
        crmVendorService.getApplications(),
        crmClientService.getClients({ limit: 1000 }),
        refundService.getAllRefunds().catch(() => []),
      ]);
      const app = (apps || []).find((a) =>
        [a.id, a.applicationId, a._id]
          .filter(Boolean)
          .map(String)
          .includes(String(appId))
      );
      if (app) {
        setApplication(app);
      }

      const matchedRefund = (refunds || []).find((r) => {
        if (!r || r.reassigned) return false;
        if (refundIdParam && String(r.id || r._id) === String(refundIdParam)) return true;
        return (
          r.applicationId &&
          String(r.applicationId) === String(app?.applicationId || app?.id || appId) &&
          r.refundStatus !== "Rejected"
        );
      });
      setRefundRecord(matchedRefund || null);
      setClients(clientsData?.clients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [appId, refundIdParam]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(t);
  }, [loadData]);

  const activeRefundStatus =
    refundRecord?.refundStatus || getAppRefundStatus(application, refundRecord ? [refundRecord] : []);
  const isRefundAwaitingApproval = activeRefundStatus === "Pending Admin Approval";
  const isFromApprovedRefund = Boolean(
    refundRecord || REASSIGN_ELIGIBLE_REFUND_STATUSES.has(activeRefundStatus)
  );

  const handleAssignProject = async () => {
    if (isRefundAwaitingApproval) {
      alert("Cannot reassign candidate while refund claim is pending Admin approval.");
      return;
    }
    if (!assignForm.projectId || !assignForm.position) {
      alert("Please select a project and position.");
      return;
    }

    let projName = "";
    let reqCode = "REQ-0000";
    clients.forEach((c) => {
      const p = (c.projects || []).find(
        (px) => String(px.id || px.projectId || px._id) === String(assignForm.projectId)
      );
      if (p) {
        projName = p.projectName || p.title || "";
        const req = (p.manpowerRequirements || []).find(
          (r) => String(r.position || r.positionTitle || "") === String(assignForm.position)
        );
        reqCode = req?.requirementCode || req?.id || "REQ-0000";
      }
    });

    setAssignLoading(true);
    try {
      await crmVendorService.reassignApplicationToProject(
        application.applicationId || application.id,
        assignForm.projectId,
        projName,
        assignForm.position,
        reqCode
      );
      alert("Candidate successfully reassigned! Status is now Submitted.");
      navigate(isFromApprovedRefund ? "/admin/vendor/refunds" : "/admin/vendor/submissions");
    } catch (err) {
      alert(err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center max-w-3xl mx-auto">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-slate-500">Loading candidate and client data...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-12 text-center max-w-3xl mx-auto">
        <p className="text-sm font-bold text-slate-800">Application not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-emerald-600 hover:underline text-xs cursor-pointer">
          Go Back
        </button>
      </div>
    );
  }

  const selectedClient = clients.find(
    (c) => String(c.id || c._id) === String(assignForm.clientId)
  );
  const clientProjects = selectedClient?.projects || [];
  const selectedProject = clientProjects.find(
    (p) => String(p.id || p.projectId || p._id) === String(assignForm.projectId)
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> {isFromApprovedRefund ? "Back to Refunds List" : "Back to Rejected List"}
        </button>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-emerald-600" /> Reassign Candidate
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Assign candidate <strong>{application.candidateName}</strong> to a new project requirement.
        </p>
      </div>

      {(refundRecord || activeRefundStatus) && (
        <div
          className={`rounded-xl border p-4 text-xs flex items-start gap-3 ${
            isRefundAwaitingApproval
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}
        >
          {isRefundAwaitingApproval ? (
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <RotateCcw size={18} className="text-blue-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="font-bold">
              Refund Status: {activeRefundStatus || "Resolved"}
            </div>
            {isRefundAwaitingApproval ? (
              <p>
                Reassignment is locked until an Administrator approves or rejects the active refund request.
              </p>
            ) : (
              <p>
                Previous project <strong>{refundRecord?.projectName || application.projectName}</strong>
                {refundRecord?.refundAmount !== undefined
                  ? ` • Refund Amount: ₹${Number(refundRecord.refundAmount || 0).toLocaleString()}`
                  : ""}
                {refundRecord?.paymentRef ? ` • Ref: ${refundRecord.paymentRef}` : ""}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Building2 size={14} className="text-slate-400" /> Select Client
              </label>
              <select
                value={assignForm.clientId}
                onChange={(e) => setAssignForm({ ...assignForm, clientId: e.target.value, projectId: "", position: "" })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-50 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <option value="">-- Choose Client --</option>
                {clients.map((c) => {
                  const cid = c.id || c._id;
                  return (
                    <option key={cid} value={cid}>
                      {c.companyName}
                    </option>
                  );
                })}
              </select>
            </div>

            {assignForm.clientId && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-slate-400" /> Select Project
                </label>
                <select
                  value={assignForm.projectId}
                  onChange={(e) => setAssignForm({ ...assignForm, projectId: e.target.value, position: "" })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-50 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <option value="">-- Choose Project --</option>
                  {clientProjects.map((p) => {
                    const pid = p.id || p.projectId || p._id;
                    return (
                      <option key={pid} value={pid}>
                        {p.projectName || p.title}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {assignForm.projectId && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <UserCheck size={14} className="text-slate-400" /> Select Position
                </label>
                <select
                  value={assignForm.position}
                  onChange={(e) => setAssignForm({ ...assignForm, position: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-50 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <option value="">-- Choose Position --</option>
                  {(selectedProject?.manpowerRequirements || []).map((r, rIdx) => {
                    const posLabel = r.position || r.positionTitle || `Position ${rIdx + 1}`;
                    return (
                      <option key={r.id || `${posLabel}-${rIdx}`} value={posLabel}>
                        {posLabel}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 p-4 sm:p-6 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignProject}
            disabled={assignLoading || !assignForm.position || isRefundAwaitingApproval}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {assignLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Assigning...
              </>
            ) : (
              "Confirm & Reassign"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
