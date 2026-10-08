import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { UserCheck, Building2, Briefcase, ArrowLeft } from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";
import { crmClientService } from "../../../services/crmClientService";

export default function AdminReassignCandidate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appId = searchParams.get("appId");

  const [application, setApplication] = useState(null);
  const [clients, setClients] = useState([]);
  const [assignForm, setAssignForm] = useState({ clientId: "", projectId: "", position: "" });
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [appId]);

  const loadData = async () => {
    if (!appId) return;
    try {
      setLoading(true);
      const apps = await crmVendorService.getApplications();
      const app = apps.find(a => String(a.id) === String(appId));
      if (app) setApplication(app);

      const clientsData = await crmClientService.getClients({ limit: 1000 });
      setClients(clientsData.clients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignProject = async () => {
    if (!assignForm.projectId || !assignForm.position) {
      alert("Please select a project and position.");
      return;
    }
    
    let projName = "";
    clients.forEach(c => {
      const p = c.projects?.find(px => px.id === assignForm.projectId);
      if (p) projName = p.projectName;
    });

    setAssignLoading(true);
    try {
      await crmVendorService.reassignApplicationToProject(
        application.id,
        assignForm.projectId,
        projName,
        assignForm.position,
        "REQ-0000"
      );
      alert(`Candidate successfully reassigned! Status is now Submitted.`);
      navigate("/admin/vendor/submissions");
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
        <button onClick={() => navigate(-1)} className="mt-4 text-emerald-600 hover:underline text-xs">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Rejected List
        </button>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-emerald-600" /> Reassign Candidate
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Assign candidate <strong>{application.candidateName}</strong> to a new project requirement.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 space-y-6">
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
                {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
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
                  {(clients.find(c => c.id === assignForm.clientId)?.projects || []).map(p => (
                    <option key={p.id} value={p.id}>{p.projectName}</option>
                  ))}
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
                  {(() => {
                    const client = clients.find(c => c.id === assignForm.clientId);
                    const project = client?.projects?.find(p => p.id === assignForm.projectId);
                    return (project?.manpowerRequirements || []).map(r => (
                      <option key={r.id} value={r.position}>{r.position}</option>
                    ));
                  })()}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleAssignProject}
            disabled={assignLoading || !assignForm.position}
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
