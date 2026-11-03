import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Sliders,
  Award,
  XCircle,
  FileText,
  UserCheck,
  ChevronRight,
  X,
  Edit2,
  ShieldAlert,
} from "lucide-react";
import AdminMasterLayout from "../../components/admin/layout/AdminMasterLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import crmVendorService from "../../services/crmVendorService.js";
import DashboardMeetingWidget from "../../components/common/meeting/DashboardMeetingWidget.jsx";
import CandidateActivityTimeline from "../../components/common/candidate/CandidateActivityTimeline.jsx";
import HRPerformanceReportSection from "../../components/common/reports/HRPerformanceReportSection.jsx";

export function VendorHRDashboard() {
  const { user, logout, assignedVendors = [] } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [applications, setApplications] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedVendorFilter, setSelectedVendorFilter] = useState("ALL");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Candidate status/stage modal
  const [candidateToUpdate, setCandidateToUpdate] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: "",
    stage: "",
    remark: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [toastNotice, setToastNotice] = useState(null);

  useEffect(() => {
    loadVendorHRData();
  }, [user]);

  const showToast = (msg, type = "success") => {
    setToastNotice({ msg, type });
    setTimeout(() => setToastNotice(null), 3500);
  };

  const loadVendorHRData = async () => {
    try {
      setLoading(true);
      const userAssigned = Array.isArray(user?.assignedVendors)
        ? user.assignedVendors
        : [];

      const [allVendors, allApps, allCands] = await Promise.all([
        crmVendorService.getVendors().catch(() => []),
        crmVendorService.getApplications().catch(() => []),
        crmVendorService.getCandidates().catch(() => []),
      ]);

      // FILTER TO ASSIGNED VENDORS ONLY (Strict Section 5 Requirement)
      const accessibleVendors = allVendors.filter((v) => {
        if (userAssigned.length === 0) return true; // If none assigned yet, shows all or empty
        return (
          userAssigned.includes(v.vendorId) ||
          userAssigned.includes(v.id) ||
          userAssigned.includes(v.companyName)
        );
      });

      const accessibleVendorIds = new Set(
        accessibleVendors.map((v) => v.vendorId || v.id)
      );

      const accessibleApps = allApps.filter((a) => {
        if (userAssigned.length === 0) return true;
        return (
          accessibleVendorIds.has(a.vendorId) ||
          userAssigned.includes(a.vendorId)
        );
      });

      const accessibleCands = allCands.filter((c) => {
        if (userAssigned.length === 0) return true;
        return (
          accessibleVendorIds.has(c.vendorId) ||
          userAssigned.includes(c.vendorId)
        );
      });

      setVendors(accessibleVendors);
      setApplications(accessibleApps);
      setCandidates(accessibleCands);
    } catch (err) {
      console.error("Failed to load Vendor HR data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Applications/Candidates
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (
        selectedVendorFilter !== "ALL" &&
        app.vendorId !== selectedVendorFilter
      ) {
        return false;
      }
      if (statusFilter !== "ALL" && app.status !== statusFilter) {
        return false;
      }
      if (candidateSearch.trim()) {
        const q = candidateSearch.toLowerCase();
        return (
          app.candidateName?.toLowerCase().includes(q) ||
          app.projectName?.toLowerCase().includes(q) ||
          app.position?.toLowerCase().includes(q) ||
          app.vendorName?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [applications, selectedVendorFilter, statusFilter, candidateSearch]);

  // Key KPI Metrics
  const stats = useMemo(() => {
    const totalAssignedVendors = vendors.length;
    const totalCandidatesCount = applications.length;
    const shortlistedCount = applications.filter((a) => a.status === "Shortlisted").length;
    const selectedCount = applications.filter((a) => a.status === "Selected").length;
    const inProcessingCount = applications.filter((a) =>
      ["Interview Scheduled", "Interview Completed", "Selected", "Processing"].includes(a.status)
    ).length;
    const rejectedCount = applications.filter((a) => a.status === "Rejected").length;

    return {
      totalAssignedVendors,
      totalCandidatesCount,
      shortlistedCount,
      selectedCount,
      inProcessingCount,
      rejectedCount,
    };
  }, [vendors, applications]);

  const handleStatusUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!candidateToUpdate) return;
    try {
      setSubmitting(true);
      await crmVendorService.updateApplicationStatus(
        candidateToUpdate.id || candidateToUpdate.applicationId,
        statusForm.status || candidateToUpdate.status,
        {
          remark: statusForm.remark,
          stage: statusForm.stage,
        }
      );
      showToast("Candidate status and stage updated with audit log.");
      setCandidateToUpdate(null);
      await loadVendorHRData();
    } catch (err) {
      showToast(err?.message || "Failed to update status", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminMasterLayout
      title="Vendor Management HR Portal"
      subtitle="Exclusively manage your assigned vendor partners, candidates, recruitment milestones and calendar."
      breadcrumbs={[
        { label: "Vendor HR Portal", path: "/hr/vendor-dashboard" },
        { label: "Assigned Vendors & Candidates" },
      ]}
    >
      <div className="space-y-4 max-w-7xl mx-auto pb-10">
        {toastNotice && (
          <div
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-center border ${
              toastNotice.type === "error"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {toastNotice.msg}
          </div>
        )}

        {/* Assigned Vendors Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-cyan-300">
              <Briefcase size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Welcome, {user?.name || "Vendor HR Manager"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Vendor Management HR
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Assigned Vendors:{" "}
                <strong className="text-white">
                  {vendors.length > 0
                    ? vendors.map((v) => v.companyName).join(", ")
                    : "All Active Vendors"}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 font-semibold text-blue-100">
              {vendors.length} Assigned Agencies
            </span>
          </div>
        </div>

        {/* 6 Key Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Vendors</div>
            <div className="text-xl font-bold text-blue-600 mt-0.5">{stats.totalAssignedVendors}</div>
            <div className="text-[10px] text-slate-500">Agencies assigned</div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Candidates</div>
            <div className="text-xl font-bold text-indigo-600 mt-0.5">{stats.totalCandidatesCount}</div>
            <div className="text-[10px] text-slate-500">In assigned pool</div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shortlisted</div>
            <div className="text-xl font-bold text-purple-600 mt-0.5">{stats.shortlistedCount}</div>
            <div className="text-[10px] text-slate-500">Under review</div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Processing</div>
            <div className="text-xl font-bold text-cyan-600 mt-0.5">{stats.inProcessingCount}</div>
            <div className="text-[10px] text-slate-500">Interviews & Visa</div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">{stats.selectedCount}</div>
            <div className="text-[10px] text-slate-500">Offer cleared</div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rejected / Hold</div>
            <div className="text-xl font-bold text-rose-500 mt-0.5">{stats.rejectedCount}</div>
            <div className="text-[10px] text-slate-500">Criteria not met</div>
          </div>
        </div>

        {/* Today's Meetings & Daily Schedule Compact Widget */}
        <DashboardMeetingWidget
          role="VENDOR_HR"
          assignedVendors={vendors.map((v) => v.vendorId || v.id).filter(Boolean)}
        />

        {/* SECTION: CANDIDATE DIRECTORY & PIPELINE */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3.5 mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                <span>Assigned Vendor Candidates</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update candidate status, stages, milestones, add remarks, and inspect audit logs.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 sm:w-56">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search candidate..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {vendors.length > 1 && (
                <select
                  value={selectedVendorFilter}
                  onChange={(e) => setSelectedVendorFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                >
                  <option value="ALL">All Assigned Vendors</option>
                  {vendors.map((v) => (
                    <option key={v.vendorId || v.id} value={v.vendorId || v.id}>
                      {v.companyName}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="Applied">Applied</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Selected">Selected</option>
                <option value="On Hold">On Hold</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Candidates Table */}
          {filteredApplications.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-xs">
              No candidates found matching current filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase bg-slate-50/60">
                    <th className="py-2.5 px-3">Candidate</th>
                    <th className="py-2.5 px-3">Agency (Vendor)</th>
                    <th className="py-2.5 px-3">Project / Role</th>
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.map((app) => (
                    <tr key={app.id || app._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{app.candidateName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {app.candidateId || app.applicationId}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-cyan-600" />
                          <span>{app.vendorName || app.vendorId}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{app.projectName}</div>
                        <div className="text-[10px] text-slate-500">{app.position || "General Role"}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {app.candidateData?.stage || app.stage || "Screening"}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            app.status === "Selected"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : app.status === "Rejected"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : app.status === "Interview Scheduled"
                              ? "bg-purple-50 text-purple-800 border-purple-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCandidate(app)}
                            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>Audit & Profile</span>
                          </button>

                          <button
                            onClick={() => {
                              setCandidateToUpdate(app);
                              setStatusForm({
                                status: app.status || "Shortlisted",
                                stage: app.candidateData?.stage || app.stage || "Screening",
                                remark: "",
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                          >
                            <Edit2 size={11} />
                            <span>Update</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION: HR PERFORMANCE & OPERATIONAL REPORTS (Section 16) */}
        <HRPerformanceReportSection hrId={user?._id || user?.id} />

        {/* MODAL: UPDATE CANDIDATE STATUS & STAGE */}
        {candidateToUpdate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-sm w-full shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Edit2 size={15} className="text-blue-600" />
                  <span>Update Candidate Status</span>
                </h3>
                <button
                  onClick={() => setCandidateToUpdate(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleStatusUpdateSubmit} className="space-y-3 text-xs">
                <div>
                  <div className="font-bold text-slate-800 text-sm">{candidateToUpdate.candidateName}</div>
                  <div className="text-slate-500 font-medium">{candidateToUpdate.projectName} &bull; {candidateToUpdate.vendorName}</div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Status</label>
                  <select
                    value={statusForm.status}
                    onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interview Scheduled">Interview Scheduled</option>
                    <option value="Interview Completed">Interview Completed</option>
                    <option value="Selected">Selected</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Stage</label>
                  <select
                    value={statusForm.stage}
                    onChange={(e) => setStatusForm({ ...statusForm, stage: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                  >
                    <option value="Screening">Screening</option>
                    <option value="Technical Interview">Technical Interview</option>
                    <option value="Client Interview">Client Interview</option>
                    <option value="Document Verification">Document Verification</option>
                    <option value="Medical & Biometrics">Medical & Biometrics</option>
                    <option value="Visa Processing">Visa Processing</option>
                    <option value="Deployment">Deployment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Process Remarks *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter reason or remark for permanent activity history..."
                    value={statusForm.remark}
                    onChange={(e) => setStatusForm({ ...statusForm, remark: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setCandidateToUpdate(null)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                  >
                    {submitting ? "Saving..." : "Save & Record Log"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CANDIDATE AUDIT TIMELINE & FULL PROFILE */}
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {selectedCandidate.candidateName} &bull; Activity History
                  </h3>
                  <div className="text-xs text-slate-500">
                    Vendor: {selectedCandidate.vendorName} &bull; Project: {selectedCandidate.projectName}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                <CandidateActivityTimeline
                  candidateId={selectedCandidate.candidateId || selectedCandidate.applicationId}
                  candidateName={selectedCandidate.candidateName}
                  vendorId={selectedCandidate.vendorId}
                  vendorName={selectedCandidate.vendorName}
                  onActivityAdded={loadVendorHRData}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminMasterLayout>
  );
}

export default VendorHRDashboard;
