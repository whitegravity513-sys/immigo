import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Stethoscope,
  Plane,
  Building,
  UserCheck,
  ChevronRight,
  ExternalLink,
  CreditCard,
  Building2,
  Calendar,
  Sparkles,
  Search,
  X,
  Eye,
  Users,
  ArrowLeft,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService";

export default function ProcessingTimeline() {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      setVendor(curVendor);
      const data = await crmVendorService.getApplications(curVendor?.id);
      const selectedApps = (data || []).filter(
        (a) => a.status === "Selected" || a.status === "Completed"
      );
      setApplications(selectedApps);
    } catch (err) {
      console.error("Failed to load processing timeline:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      app.candidateName?.toLowerCase().includes(term) ||
      app.position?.toLowerCase().includes(term) ||
      app.projectName?.toLowerCase().includes(term) ||
      app.country?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-3 cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Deployment Tracker</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            8-Stage Processing Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Transparent, milestone-by-milestone deployment progress from candidate selection through overseas site mobilization.
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
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading deployment roster...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No candidates in deployment processing</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Once a candidate is marked "Selected" by the client or admin, their 8-stage processing pipeline activates here automatically.
          </p>
        </div>
      ) : (
        <div className="w-full">
          {/* Active Deployments Candidate List */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={16} className="text-indigo-600" />
                    <span>Active Deployments ({applications.length})</span>
                  </h3>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter candidate by name, position or project..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Candidate Roster Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredApps.length === 0 ? (
                  <div className="col-span-full p-6 text-center text-sm text-slate-400">
                    No active deployment matches "{searchTerm}"
                  </div>
                ) : (
                  filteredApps.map((app) => {
                    const totalM = app.processMilestones?.length || 0;
                    const compM = app.processMilestones?.filter(m=>m.status==='Completed').length || 0;
                    
                    return (
                      <Link
                        key={app.id}
                        to={`/vendor/processing/${app.id}`}
                        className="block p-4 rounded-xl border text-left cursor-pointer transition-all duration-150 bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-extrabold text-sm text-slate-900 truncate">
                            {app.candidateName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100/80 text-indigo-800 shrink-0">
                            Milestone {compM}/{totalM}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-600 gap-2 mb-3">
                          <span className="font-semibold text-slate-700 truncate">{app.position}</span>
                          <span className="font-bold text-indigo-600 shrink-0">{app.projectName}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${totalM > 0 ? (compM / totalM) * 100 : 0}%` }}
                          />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
