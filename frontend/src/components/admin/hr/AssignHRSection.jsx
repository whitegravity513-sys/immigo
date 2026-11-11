import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  UserCheck,
  Search,
  FolderKanban,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Send,
  Globe,
  Building2,
} from "lucide-react";
import apiClient from "../../../services/apiClient.js";
import permissionService from "../../../services/permissionService.js";
import adminVendorV1Service from "../../../services/adminVendorV1Service.js";
import crmVendorService from "../../../services/crmVendorService.js";

export default function AssignHRSection() {
  const [hrList, setHrList] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const [feedback, setFeedback] = useState(null);

  const [hrRoleFilter, setHrRoleFilter] = useState("VENDOR_HR");
  const [hrSearch, setHrSearch] = useState("");
  const [selectedHRId, setSelectedHRId] = useState("");

  const [projectSearch, setProjectSearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
  const [notes, setNotes] = useState("");

  const showToast = (message, type = "success") => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback((curr) => (curr?.message === message ? null : curr));
    }, 5000);
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [adminsRes, projectsRes, v1VendorsRes, legacyVendorsRes, assignmentsRes] =
        await Promise.allSettled([
          permissionService.getAdmins(),
          apiClient.get("/crm-sync/projects"),
          adminVendorV1Service.getVendors({ limit: 500 }),
          crmVendorService.getVendors(),
          adminVendorV1Service.getAssignments({ status: "Active" }),
        ]);

      let staffList = [];
      if (adminsRes.status === "fulfilled") {
        staffList = adminsRes.value?.admins || adminsRes.value?.data || [];
      }
      const hrOnly = staffList.filter(
        (u) =>
          u.role === "HR" ||
          u.hrType === "VENDOR_HR" ||
          u.hrType === "EMPLOYEE_HR" ||
          u.role === "VENDOR_HR"
      );
      setHrList(hrOnly);

      if (projectsRes.status === "fulfilled") {
        const pList = projectsRes.value?.data?.projects || projectsRes.value?.data?.data || [];
        setProjects(Array.isArray(pList) ? pList : []);
      }

      const v1List =
        v1VendorsRes.status === "fulfilled"
          ? Array.isArray(v1VendorsRes.value?.vendors)
            ? v1VendorsRes.value.vendors
            : Array.isArray(v1VendorsRes.value)
            ? v1VendorsRes.value
            : []
          : [];
      const legacyList =
        legacyVendorsRes.status === "fulfilled" && Array.isArray(legacyVendorsRes.value)
          ? legacyVendorsRes.value
          : [];

      const vendorMap = new Map();
      [...v1List, ...legacyList].forEach((v) => {
        const key = String(v?.vendorId || v?.id || v?._id || "").trim();
        if (!key) return;
        const existing = vendorMap.get(key) || {};
        vendorMap.set(key, {
          ...existing,
          ...v,
          vendorId: v.vendorId || existing.vendorId || key,
          id: key,
          companyName: v.companyName || v.name || existing.companyName || `Agency ${key}`,
        });
      });
      setVendors(Array.from(vendorMap.values()));

      if (assignmentsRes.status === "fulfilled") {
        const aList = Array.isArray(assignmentsRes.value)
          ? assignmentsRes.value
          : assignmentsRes.value?.assignments || [];
        setAssignments(aList);
      }

      setSelectedHRId((prevId) => {
        if (prevId && hrOnly.some((h) => String(h.id || h._id) === prevId)) {
          return prevId;
        }
        const firstVendorHR = hrOnly.find(
          (h) => h.hrType === "VENDOR_HR" || h.role === "VENDOR_HR"
        );
        const firstTarget = firstVendorHR || hrOnly[0];
        return firstTarget ? String(firstTarget.id || firstTarget._id) : "";
      });
    } catch (err) {
      showToast(err?.message || "Failed to load HR assignment workspace", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadAllData();
    }, 0);
    return () => clearTimeout(t);
  }, [loadAllData]);

  const filteredHRs = useMemo(() => {
    const q = hrSearch.trim().toLowerCase();
    return hrList.filter((hr) => {
      const isVendorHR = hr.hrType === "VENDOR_HR" || hr.role === "VENDOR_HR";
      if (hrRoleFilter === "VENDOR_HR" && !isVendorHR) return false;
      if (!q) return true;
      return (
        String(hr.name || "").toLowerCase().includes(q) ||
        String(hr.email || "").toLowerCase().includes(q)
      );
    });
  }, [hrList, hrRoleFilter, hrSearch]);

  const selectedHR = useMemo(() => {
    return hrList.find((h) => String(h.id || h._id) === selectedHRId) || null;
  }, [hrList, selectedHRId]);

  const selectedHRVendorsKey = Array.isArray(selectedHR?.assignedVendors)
    ? selectedHR.assignedVendors.map(String).join(",")
    : "";

  useEffect(() => {
    const existingVendors = selectedHRVendorsKey ? selectedHRVendorsKey.split(",") : [];
    const t = setTimeout(() => {
      setSelectedVendorIds(selectedHR ? existingVendors : []);
      setSelectedProjectIds([]);
    }, 0);
    return () => clearTimeout(t);
  }, [selectedHRId, selectedHR, selectedHRVendorsKey]);

  const activeHRAllocations = useMemo(() => {
    if (!selectedHRId) return [];
    return assignments.filter(
      (a) =>
        a.status === "Active" &&
        a.assignmentType === "VENDOR_HR_PROJECT" &&
        String(a.userId || "") === selectedHRId
    );
  }, [assignments, selectedHRId]);

  const assignedProjectIdSetForHR = useMemo(() => {
    return new Set(activeHRAllocations.map((a) => String(a.projectId)));
  }, [activeHRAllocations]);

  const getHRStats = useCallback(
    (hr) => {
      const idStr = String(hr.id || hr._id || "");
      const hrRows = assignments.filter(
        (a) =>
          a.status === "Active" &&
          a.assignmentType === "VENDOR_HR_PROJECT" &&
          String(a.userId || "") === idStr
      );
      const uniqueProjects = new Set(hrRows.map((a) => String(a.projectId)));
      const uniqueVendors = new Set([
        ...(Array.isArray(hr.assignedVendors) ? hr.assignedVendors.map(String) : []),
        ...hrRows.map((a) => String(a.vendorId || "")).filter(Boolean),
      ]);
      return {
        projectCount: uniqueProjects.size,
        vendorCount: uniqueVendors.size,
      };
    },
    [assignments]
  );

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        String(p.projectName || p.title || "").toLowerCase().includes(q) ||
        String(p.clientName || "").toLowerCase().includes(q) ||
        String(p.country || p.destinationCountry || "").toLowerCase().includes(q) ||
        String(p.projectId || p.id || "").toLowerCase().includes(q)
    );
  }, [projects, projectSearch]);

  const filteredVendors = useMemo(() => {
    const q = vendorSearch.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) =>
        String(v.companyName || "").toLowerCase().includes(q) ||
        String(v.vendorId || v.id || "").toLowerCase().includes(q) ||
        String(v.contactPersonName || "").toLowerCase().includes(q) ||
        String(v.email || "").toLowerCase().includes(q)
    );
  }, [vendors, vendorSearch]);

  const toggleProject = (projId) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projId) ? prev.filter((id) => id !== projId) : [...prev, projId]
    );
  };

  const toggleVendor = (vId) => {
    setSelectedVendorIds((prev) =>
      prev.includes(vId) ? prev.filter((id) => id !== vId) : [...prev, vId]
    );
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHRId) {
      showToast("Please select a Vendor HR account first.", "error");
      return;
    }
    if (selectedProjectIds.length === 0) {
      showToast("Please select at least one project to assign.", "error");
      return;
    }
    if (selectedVendorIds.length === 0) {
      showToast("Please select at least one recruitment agency / vendor.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await adminVendorV1Service.batchAssignHRToProjectsAndVendors({
        hrUserId: selectedHRId,
        projectIds: selectedProjectIds,
        vendorIds: selectedVendorIds,
        notes: notes.trim(),
      });
      showToast(
        `Assigned ${selectedProjectIds.length} project(s) and ${selectedVendorIds.length} agency(ies) to ${selectedHR?.name || "HR"} and dispatched notification.`
      );
      setNotes("");
      setSelectedProjectIds([]);
      window.dispatchEvent(new CustomEvent("immigo:admin-notification"));
      window.dispatchEvent(new CustomEvent("immigo:vendor-hr-refresh"));
      await loadAllData();
    } catch (err) {
      showToast(
        err?.response?.data?.message || err?.message || "Failed to save HR assignments",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAllocation = async (allocation) => {
    const allocId = allocation?._id || allocation?.id;
    if (!allocId) return;
    setRemovingId(allocId);
    try {
      await adminVendorV1Service.removeAssignment({
        assignmentId: allocId,
        reason: "Unassigned from Assign to HR panel",
      });
      showToast(
        `Unassigned ${allocation.projectName || allocation.projectId} from ${allocation.userName || selectedHR?.name || "HR"}.`
      );
      window.dispatchEvent(new CustomEvent("immigo:vendor-hr-refresh"));
      await loadAllData();
    } catch (err) {
      showToast(
        err?.response?.data?.message || err?.message || "Failed to unassign allocation",
        "error"
      );
    } finally {
      setRemovingId("");
    }
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold shadow-2xs ${
            feedback.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {feedback.type === "error" ? (
            <AlertCircle size={15} className="shrink-0" />
          ) : (
            <CheckCircle2 size={15} className="shrink-0" />
          )}
          <span className="flex-1">{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-3.5 border-b border-slate-200/80 space-y-2.5 bg-slate-50/70">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-100 text-cyan-800">
                  <UserCheck size={15} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">
                    HR Directory ({filteredHRs.length})
                  </h2>
                  <p className="text-[10.5px] text-slate-500">
                    Click Vendor HR to view & assign projects
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadAllData}
                disabled={loading}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 bg-white cursor-pointer"
                title="Refresh"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setHrRoleFilter("VENDOR_HR")}
                className={`flex-1 py-1.5 px-2 rounded-md cursor-pointer transition-all ${
                  hrRoleFilter === "VENDOR_HR"
                    ? "bg-white text-cyan-800 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Vendor HR
              </button>
              <button
                type="button"
                onClick={() => setHrRoleFilter("ALL")}
                className={`flex-1 py-1.5 px-2 rounded-md cursor-pointer transition-all ${
                  hrRoleFilter === "ALL"
                    ? "bg-white text-blue-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All HR
              </button>
            </div>

            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={hrSearch}
                onChange={(e) => setHrSearch(e.target.value)}
                placeholder="Search HR by name or email..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {loading && hrList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading HR accounts...</div>
            ) : filteredHRs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No matching Vendor HR accounts found.
              </div>
            ) : (
              filteredHRs.map((hr) => {
                const hrId = String(hr.id || hr._id);
                const isSelected = hrId === selectedHRId;
                const isVHR = hr.hrType === "VENDOR_HR" || hr.role === "VENDOR_HR";
                const stats = getHRStats(hr);
                return (
                  <button
                    key={hrId}
                    type="button"
                    onClick={() => setSelectedHRId(hrId)}
                    className={`w-full text-left px-3.5 py-3 flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-cyan-50/90 border-l-4 border-l-cyan-600"
                        : "hover:bg-slate-50 border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {hr.name}
                        </span>
                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isVHR
                              ? "bg-cyan-100 text-cyan-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {isVHR ? "Vendor HR" : "Employee HR"}
                        </span>
                        {hr.isActive === false && (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{hr.email}</p>
                      <div className="flex items-center gap-3 pt-1 text-[10.5px] font-semibold text-slate-600">
                        <span className="flex items-center gap-1">
                          <FolderKanban size={11} className="text-blue-600" />
                          {stats.projectCount} Projects
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase size={11} className="text-cyan-700" />
                          {stats.vendorCount} Agencies
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {!selectedHR ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center text-xs text-slate-500">
              Select a Vendor HR from the left directory to view all projects and assign recruitment agencies.
            </div>
          ) : (
            <>
              <form
                onSubmit={handleAssignSubmit}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-bold text-slate-900">{selectedHR.name}</h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 uppercase">
                        {selectedHR.hrType === "VENDOR_HR" ? "Vendor HR" : selectedHR.hrType || selectedHR.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {selectedHR.email} &bull; Select one or more projects along with recruitment agency access below
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800">
                      {activeHRAllocations.length} Active Allocations
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <FolderKanban size={14} className="text-blue-600" />
                        <span>All Projects ({projects.length})</span>
                      </label>
                      <div className="flex items-center gap-2 text-[10.5px] font-bold">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProjectIds(
                              filteredProjects.map((p) => String(p.projectId || p.id || p._id))
                            )
                          }
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedProjectIds([])}
                          className="text-slate-500 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <Search
                        size={13}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        placeholder="Search project, client or country..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white custom-scrollbar">
                      {filteredProjects.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No projects found.
                        </div>
                      ) : (
                        filteredProjects.map((proj) => {
                          const pId = String(proj.projectId || proj.id || proj._id || "");
                          const isChecked = selectedProjectIds.includes(pId);
                          const alreadyAssigned = assignedProjectIdSetForHR.has(pId);
                          const pName = proj.projectName || proj.title || "Overseas Project";
                          const country = proj.country || proj.destinationCountry || "";
                          return (
                            <label
                              key={pId}
                              className={`flex items-start gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                                isChecked ? "bg-blue-50/70" : "hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleProject(pId)}
                                className="mt-0.5 rounded text-blue-600 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-xs text-slate-900 truncate">
                                    {pName}
                                  </span>
                                  {alreadyAssigned && (
                                    <span className="shrink-0 text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                      Assigned
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10.5px] text-slate-500 mt-0.5">
                                  {proj.clientName && (
                                    <span className="flex items-center gap-1 truncate">
                                      <Building2 size={10} />
                                      {proj.clientName}
                                    </span>
                                  )}
                                  {country && (
                                    <span className="flex items-center gap-1">
                                      <Globe size={10} />
                                      {country}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Briefcase size={14} className="text-cyan-700" />
                        <span>Recruitment Agencies ({vendors.length})</span>
                      </label>
                      <div className="flex items-center gap-2 text-[10.5px] font-bold">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedVendorIds(
                              filteredVendors.map((v) =>
                                String(v.vendorId || v.id || v._id || "")
                              )
                            )
                          }
                          className="text-cyan-700 hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedVendorIds([])}
                          className="text-slate-500 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <Search
                        size={13}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={vendorSearch}
                        onChange={(e) => setVendorSearch(e.target.value)}
                        placeholder="Search agency name or code..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white custom-scrollbar">
                      {filteredVendors.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No recruitment agencies found.
                        </div>
                      ) : (
                        filteredVendors.map((vnd) => {
                          const vId = String(vnd.vendorId || vnd.id || vnd._id || "");
                          const isChecked = selectedVendorIds.includes(vId);
                          const isLinked = (selectedHR.assignedVendors || []).includes(vId);
                          return (
                            <label
                              key={vId}
                              className={`flex items-center justify-between gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                                isChecked ? "bg-cyan-50/70" : "hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleVendor(vId)}
                                  className="rounded text-cyan-600 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-900 truncate">
                                      {vnd.companyName}
                                    </span>
                                    {isLinked && (
                                      <span className="shrink-0 text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-800">
                                        Linked
                                      </span>
                                    )}
                                  </div>
                                  {(vnd.contactPersonName || vnd.email) && (
                                    <p className="text-[10.5px] text-slate-500 truncate">
                                      {[vnd.contactPersonName, vnd.email].filter(Boolean).join(" • ")}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                {vId}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional instruction / allocation note..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                  />
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      selectedProjectIds.length === 0 ||
                      selectedVendorIds.length === 0
                    }
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send size={13} />
                    <span>
                      {submitting
                        ? "Assigning..."
                        : `Assign Projects & Vendors (${selectedProjectIds.length} × ${selectedVendorIds.length})`}
                    </span>
                  </button>
                </div>
              </form>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Current Allocations for {selectedHR.name} ({activeHRAllocations.length})
                    </h3>
                    <p className="text-[10.5px] text-slate-500">
                      Active project + agency pairs visible immediately in Vendor HR&apos;s My Projects tab
                    </p>
                  </div>
                </div>

                {activeHRAllocations.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active project allocations for {selectedHR.name} yet. Select projects and agencies above to assign.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10.5px] font-bold uppercase text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Project Name</th>
                          <th className="py-2.5 px-4">Recruitment Agency</th>
                          <th className="py-2.5 px-4">Assigned By</th>
                          <th className="py-2.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeHRAllocations.map((alloc) => {
                          const allocId = alloc._id || alloc.id;
                          return (
                            <tr key={allocId} className="hover:bg-slate-50/70">
                              <td className="py-2.5 px-4 font-bold text-slate-900">
                                {alloc.projectName || alloc.projectId}
                              </td>
                              <td className="py-2.5 px-4 text-slate-700">
                                <span className="font-semibold">
                                  {alloc.vendorName || alloc.vendorId}
                                </span>
                                {alloc.vendorId && (
                                  <span className="ml-1.5 text-[10px] font-mono text-slate-400">
                                    ({alloc.vendorId})
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-slate-500">
                                {alloc.assignedByName || "Administrator"}
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <button
                                  type="button"
                                  disabled={removingId === allocId}
                                  onClick={() => handleRemoveAllocation(alloc)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-bold cursor-pointer disabled:opacity-50"
                                >
                                  <Trash2 size={11} />
                                  <span>{removingId === allocId ? "Removing..." : "Unassign"}</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

