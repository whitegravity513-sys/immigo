import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Clock, CreditCard } from "lucide-react";
import crmVendorService from "../../services/crmVendorService";
import CandidateProcessTimeline from "../../components/crm/vendor/CandidateProcessTimeline";

export default function VendorProcessingDetails() {
  const { appId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [currentApp, setCurrentApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [appId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      setVendor(curVendor);
      const data = await crmVendorService.getApplications(curVendor?.id);
      const app = data?.find((a) => String(a.id) === String(appId));
      setCurrentApp(app);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        Loading deployment timeline...
      </div>
    );
  }

  if (!currentApp) {
    return (
      <div className="p-12 text-center text-slate-500">
        Deployment record not found.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <Link
        to="/vendor/selected"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold transition"
      >
        <ArrowLeft size={14} /> Back to Selected Candidates
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 text-xs space-y-2.5 mb-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Candidate Dossier</span>
          <Link
            to={`/vendor/candidates/${currentApp.candidateId}`}
            className="text-indigo-600 font-bold hover:underline flex items-center gap-1 text-xs"
          >
            <span>View Profile</span>
            <ExternalLink size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-600 pt-1">
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

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2 mb-5">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Timeline & Milestones</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Step-by-step mobilization process.</p>
          </div>
        </div>

        <CandidateProcessTimeline 
          application={currentApp} 
          onUpdate={loadData} 
        />
      </div>
    </div>
  );
}
