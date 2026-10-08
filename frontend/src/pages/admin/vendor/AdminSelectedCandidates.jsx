import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  UserCheck,
  Search,
  ArrowRight,
  Clock,
  CheckCircle2,
  Building2,
  ExternalLink,
  Sliders,
  Plus,
  Trash2,
  DollarSign,
  Edit,
  ChevronRight,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";

export default function AdminSelectedCandidates() {
  const [selectedApps, setSelectedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Milestone Edit Modal State
  const [milestoneModalApp, setMilestoneModalApp] = useState(null);
  const [totalAmount, setTotalAmount] = useState(40000);
  const [milestonesList, setMilestonesList] = useState([]);

  useEffect(() => {
    loadSelected();
  }, []);

  const loadSelected = async () => {
    try {
      setLoading(true);
      const data = await crmVendorService.getApplications();
      const filtered = (data || []).filter((a) => a.status === "Selected" || a.status === "Completed");
      setSelectedApps(filtered);
    } catch (err) {
      console.error("Failed to load selected candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = selectedApps.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.candidateName?.toLowerCase().includes(q) ||
      app.projectName?.toLowerCase().includes(q) ||
      app.clientName?.toLowerCase().includes(q) ||
      app.vendorId?.toLowerCase().includes(q) ||
      app.position?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Selected Candidates & Milestone Management</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Manage client-selected candidates, customize default project milestone payments, and track deployment progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
            Total Selected: {selectedApps.length}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter selected candidates by candidate, project, role..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
        />
      </div>

      {/* Selected Candidates Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-semibold text-slate-500">Loading selected candidates...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No selected candidates</h3>
          <p className="text-xs text-slate-500 mt-1">Candidates marked as Selected will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-5">Candidate Name</th>
                  <th className="py-3.5 px-4">Vendor Partner</th>
                  <th className="py-3.5 px-4">Client Company</th>
                  <th className="py-3.5 px-4">Project Name</th>
                  <th className="py-3.5 px-4">Position</th>
                  <th className="py-3.5 px-4">Processing Stage</th>
                  <th className="py-3.5 px-4">Milestones & Payments</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((app) => {
                  const milestones = app.paymentPlan?.milestones || [
                    { id: "M1", name: "Milestone 1 - Selection", status: "Paid", stages: [{ id: "s1", name: "Document Verification", status: "Completed" }, { id: "s2", name: "Client Selection", status: "Completed" }] },
                    { id: "M2", name: "Milestone 2 - GAMCA Medical", status: "Due", stages: [{ id: "s3", name: "Medical Check", status: "Pending" }, { id: "s4", name: "GAMCA Clearance", status: "Pending" }] }
                  ];

                  let activeMilestone = null;
                  let activeStage = null;
                  let totalStagesCount = 0;
                  let completedStagesCount = 0;

                  milestones.forEach(m => {
                    if (!m.stages) return;
                    m.stages.forEach(s => {
                      totalStagesCount++;
                      if (s.status === "Completed") completedStagesCount++;
                      else if (!activeStage) {
                        activeStage = s;
                        activeMilestone = m;
                      }
                    });
                  });

                  const stageName = activeStage ? activeStage.name : "All Completed";
                  const displayIndex = activeStage ? completedStagesCount + 1 : totalStagesCount;

                  const paidCount = milestones.filter((m) => m.status === "Paid").length;
                  const totalCount = milestones.length || 4;
                  const planTotal = app.paymentPlan?.totalAmount || 40000;

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-4 sm:px-5 font-black text-slate-900">
                        {app.candidateName}
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-700">{app.vendorId}</td>
                      <td className="py-4 px-4 text-slate-800 font-medium">{app.clientName}</td>
                      <td className="py-4 px-4 font-bold text-blue-700">{app.projectName}</td>
                      <td className="py-4 px-4 font-semibold text-indigo-700">{app.position}</td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          {stageName} ({displayIndex}/{totalStagesCount || 8})
                        </span>
                        {activeMilestone && (
                          <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                            in {activeMilestone.name}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {paidCount}/{totalCount} Paid (₹{planTotal.toLocaleString()})
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/vendor/milestones-manage?appId=${app.id}`}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                            title="Manage Milestones & Processes"
                          >
                            <Sliders size={13} />
                            <span>Milestones & Processing</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
