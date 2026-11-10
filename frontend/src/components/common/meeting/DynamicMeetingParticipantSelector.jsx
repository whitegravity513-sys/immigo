import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  User,
  Building2,
  Briefcase,
  Search,
  X,
  Check,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import meetingService from "../../../services/meetingService.js";

/**
 * DynamicMeetingParticipantSelector
 * Clean, modern, adaptive participant selector that transforms based on meetingType.
 * Supports:
 *  - "ALL" mode (e.g. All Employees, All Vendors, All HRs)
 *  - "SPECIFIC" mode (1, 2-3, or multiple participants via multi-select tags/chips)
 *  - Real-time name search with full data preview (badges, IDs, roles, emails)
 */
export default function DynamicMeetingParticipantSelector({
  meetingType = "CANDIDATE_INTERVIEW",
  targetMode = "SPECIFIC", // 'ALL' | 'SPECIFIC'
  onTargetModeChange,
  selectedParticipants = [], // [{ id, name, email, role, code, companyName, designation }]
  onAddParticipant,
  onRemoveParticipant,
  candidateData = {
    candidateId: "",
    candidateName: "",
    candidateEmail: "",
    vendorId: "",
    vendorName: "",
    jobTitle: "",
    projectName: "",
  },
  onCandidateChange,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [optionsList, setOptionsList] = useState([]);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [manualCandidateEntry, setManualCandidateEntry] = useState(false);

  const containerRef = useRef(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch options when meetingType changes
  useEffect(() => {
    loadCategoryData();
  }, [meetingType]);

  const loadCategoryData = async () => {
    setLoading(true);
    setSearchQuery("");
    try {
      if (meetingType === "EMPLOYEE") {
        const data = await meetingService.searchEmployees();
        setOptionsList(data || []);
        setFilteredOptions(data || []);
      } else if (meetingType === "VENDOR_DISCUSSION") {
        const data = await meetingService.searchVendors();
        setOptionsList(data || []);
        setFilteredOptions(data || []);
      } else if (meetingType === "INTERNAL_HR") {
        const data = await meetingService.searchHRs();
        setOptionsList(data || []);
        setFilteredOptions(data || []);
      } else if (meetingType === "CANDIDATE_INTERVIEW") {
        const data = await meetingService.searchCandidates();
        setOptionsList(data || []);
        setFilteredOptions(data || []);
      } else {
        // GENERAL
        const [emp, ven, hrs] = await Promise.all([
          meetingService.searchEmployees().catch(() => []),
          meetingService.searchVendors().catch(() => []),
          meetingService.searchHRs().catch(() => []),
        ]);
        const combined = [
          ...(emp || []).map((e) => ({ ...e, role: "EMPLOYEE" })),
          ...(ven || []).map((v) => ({ ...v, role: "VENDOR", name: v.companyName })),
          ...(hrs || []).map((h) => ({ ...h, role: "HR" })),
        ];
        setOptionsList(combined);
        setFilteredOptions(combined);
      }
    } catch (err) {
      setOptionsList([]);
      setFilteredOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setDropdownOpen(true);
    if (!query.trim()) {
      setFilteredOptions(optionsList);
      return;
    }
    const q = query.toLowerCase();
    const filtered = optionsList.filter((item) => {
      return (
        item.name?.toLowerCase().includes(q) ||
        item.companyName?.toLowerCase().includes(q) ||
        item.candidateName?.toLowerCase().includes(q) ||
        item.employeeId?.toLowerCase().includes(q) ||
        item.vendorId?.toLowerCase().includes(q) ||
        item.candidateId?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.designation?.toLowerCase().includes(q) ||
        item.position?.toLowerCase().includes(q)
      );
    });
    setFilteredOptions(filtered);
  };

  const isSelected = (item) => {
    const id = item.id || item._id || item.vendorId || item.candidateId;
    return selectedParticipants.some(
      (p) => (p.id || p._id || p.vendorId || p.candidateId) === id
    );
  };

  const handleSelectOption = (item) => {
    if (meetingType === "CANDIDATE_INTERVIEW") {
      onCandidateChange({
        candidateId: item.candidateId || item.id || "",
        candidateName: item.name || item.candidateName || "",
        candidateEmail: item.email || item.candidateEmail || "",
        vendorId: item.vendorId || "",
        vendorName: item.vendorName || "",
        jobTitle: item.position || "",
        projectName: item.projectName || "",
      });
      setDropdownOpen(false);
      setSearchQuery("");
      return;
    }

    const id = item.id || item._id || item.vendorId || item.employeeId;
    if (isSelected(item)) {
      onRemoveParticipant(id);
    } else {
      onAddParticipant({
        id,
        _id: item._id,
        name: item.name || item.companyName,
        email: item.email || "",
        role:
          meetingType === "VENDOR_DISCUSSION"
            ? "VENDOR"
            : meetingType === "EMPLOYEE"
            ? "EMPLOYEE"
            : item.role || "ATTENDEE",
        code: item.employeeId || item.vendorId || "",
        companyName: item.companyName || "",
        designation: item.designation || item.hrType || "",
      });
    }
    setSearchQuery("");
  };

  // 1. VENDOR DISCUSSION VIEW
  if (meetingType === "VENDOR_DISCUSSION") {
    return (
      <div
        ref={containerRef}
        className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-200/90 space-y-3"
      >
        <div className="flex items-center justify-between">
          <label className="text-amber-950 font-bold text-xs flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>Vendor Agency Invitees</span>
          </label>

          {/* Toggle All vs Specific */}
          <div className="inline-flex rounded-lg bg-white/80 p-0.5 border border-amber-200 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => onTargetModeChange("ALL")}
              className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                targetMode === "ALL"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-amber-800 hover:text-amber-950"
              }`}
            >
              All Vendors
            </button>
            <button
              type="button"
              onClick={() => onTargetModeChange("SPECIFIC")}
              className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                targetMode === "SPECIFIC"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-amber-800 hover:text-amber-950"
              }`}
            >
              Select Specific ({selectedParticipants.length})
            </button>
          </div>
        </div>

        {targetMode === "ALL" ? (
          <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              All registered & active vendor agencies and their assigned Vendor HRs will receive this meeting notification and dashboard alert.
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Multi-select Tags/Chips */}
            {selectedParticipants.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-white/90 rounded-xl border border-amber-200 max-h-24 overflow-y-auto custom-scrollbar">
                {selectedParticipants.map((p) => (
                  <span
                    key={p.id || p.code}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-900 text-xs font-bold border border-amber-300/80 shadow-2xs"
                  >
                    <Building2 className="w-3 h-3 text-amber-700" />
                    <span>{p.name || p.companyName}</span>
                    {p.code && (
                      <span className="text-[10px] text-amber-700 font-mono bg-amber-200/60 px-1 py-0.2 rounded">
                        {p.code}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveParticipant(p.id || p.code)}
                      className="ml-0.5 hover:text-rose-600 text-amber-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-amber-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Type vendor agency name or code (e.g. TechSolutions, VND-1001)..."
                  value={searchQuery}
                  onFocus={() => setDropdownOpen(true)}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-amber-200 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Dropdown Options */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl z-50 divide-y divide-slate-100 custom-scrollbar">
                  {loading ? (
                    <div className="p-3 text-center text-xs text-slate-400">Loading vendors...</div>
                  ) : filteredOptions.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      {searchQuery ? `No vendor agency found matching "${searchQuery}".` : "No registered vendors."}
                    </div>
                  ) : (
                    filteredOptions.map((v) => {
                      const selected = isSelected(v);
                      return (
                        <div
                          key={v.vendorId || v.id || v._id}
                          onClick={() => handleSelectOption(v)}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                            selected ? "bg-amber-50/90 text-amber-950 font-bold" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs shrink-0">
                              <Building2 size={14} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 text-xs truncate">
                                {v.companyName || v.name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                Code: <span className="font-mono font-semibold text-amber-700">{v.vendorId}</span> • {v.contactPerson || v.email}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              selected
                                ? "bg-amber-600 text-white"
                                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            }`}
                          >
                            {selected ? "Selected" : "+ Add"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <p className="text-[10px] text-amber-700/80 font-medium">
              💡 You can select 1 particular vendor agency, 2-3 agencies, or toggle "All Vendors".
            </p>
          </div>
        )}
      </div>
    );
  }

  // 2. EMPLOYEE DISCUSSION VIEW
  if (meetingType === "EMPLOYEE") {
    return (
      <div
        ref={containerRef}
        className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-200/90 space-y-3"
      >
        <div className="flex items-center justify-between">
          <label className="text-blue-950 font-bold text-xs flex items-center gap-1.5">
            <User className="w-4 h-4 text-blue-600" />
            <span>Employee Participants</span>
          </label>

          {/* Toggle All vs Specific */}
          <div className="inline-flex rounded-lg bg-white/80 p-0.5 border border-blue-200 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => onTargetModeChange("ALL")}
              className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                targetMode === "ALL"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-blue-800 hover:text-blue-950"
              }`}
            >
              All Employees
            </button>
            <button
              type="button"
              onClick={() => onTargetModeChange("SPECIFIC")}
              className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                targetMode === "SPECIFIC"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-blue-800 hover:text-blue-950"
              }`}
            >
              Select Specific ({selectedParticipants.length})
            </button>
          </div>
        </div>

        {targetMode === "ALL" ? (
          <div className="p-3 bg-white/90 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              All workforce employees will receive this meeting notification and dashboard banner alert.
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Multi-select Tags/Chips */}
            {selectedParticipants.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-white/90 rounded-xl border border-blue-200 max-h-24 overflow-y-auto custom-scrollbar">
                {selectedParticipants.map((p) => (
                  <span
                    key={p.id || p.code}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100/80 text-blue-900 text-xs font-bold border border-blue-300/80 shadow-2xs"
                  >
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold">
                      {p.name?.slice(0, 1).toUpperCase()}
                    </div>
                    <span>{p.name}</span>
                    {p.code && (
                      <span className="text-[10px] text-blue-700 font-mono bg-blue-200/60 px-1 py-0.2 rounded">
                        {p.code}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveParticipant(p.id || p.code)}
                      className="ml-0.5 hover:text-rose-600 text-blue-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-blue-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Type employee name or ID (e.g. Abhishek, Sneha, IMMI-1002)..."
                  value={searchQuery}
                  onFocus={() => setDropdownOpen(true)}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-blue-200 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Dropdown Options */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl z-50 divide-y divide-slate-100 custom-scrollbar">
                  {loading ? (
                    <div className="p-3 text-center text-xs text-slate-400">Loading employees...</div>
                  ) : filteredOptions.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      {searchQuery ? `No employee found matching "${searchQuery}".` : "No employees registered."}
                    </div>
                  ) : (
                    filteredOptions.map((e) => {
                      const selected = isSelected(e);
                      return (
                        <div
                          key={e.employeeId || e.id || e._id}
                          onClick={() => handleSelectOption(e)}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                            selected ? "bg-blue-50/90 text-blue-950 font-bold" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {e.name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 text-xs truncate">
                                {e.name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {e.designation || "Staff"} • <span className="font-mono font-semibold text-blue-700">{e.employeeId}</span>{e.department ? ` • ${e.department}` : ""}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              selected
                                ? "bg-blue-600 text-white"
                                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                            }`}
                          >
                            {selected ? "Selected" : "+ Add"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <p className="text-[10px] text-blue-700/80 font-medium">
              💡 You can select 1 particular employee, 2-3 team members, or toggle "All Employees".
            </p>
          </div>
        )}
      </div>
    );
  }

  // 3. INTERNAL HR / VENDOR HR MEETING VIEW
  if (meetingType === "INTERNAL_HR") {
    return (
      <div
        ref={containerRef}
        className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/70 to-purple-50/40 border border-indigo-200/90 space-y-3"
      >
        <div className="flex items-center justify-between">
          <label className="text-indigo-950 font-bold text-xs flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>HR Operations Team Invitees</span>
          </label>

          {/* Toggle All vs Specific */}
          <div className="inline-flex rounded-lg bg-white/80 p-0.5 border border-indigo-200 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => onTargetModeChange("ALL")}
              className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                targetMode === "ALL"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-indigo-800 hover:text-indigo-950"
              }`}
            >
              All HRs
            </button>
            <button
              type="button"
              onClick={() => onTargetModeChange("SPECIFIC")}
              className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                targetMode === "SPECIFIC"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-indigo-800 hover:text-indigo-950"
              }`}
            >
              Select Specific ({selectedParticipants.length})
            </button>
          </div>
        </div>

        {targetMode === "ALL" ? (
          <div className="p-3 bg-white/90 rounded-xl border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              All Employee HR and Vendor HR team members will receive this meeting notification and dashboard banner.
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Multi-select Tags/Chips */}
            {selectedParticipants.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-white/90 rounded-xl border border-indigo-200 max-h-24 overflow-y-auto custom-scrollbar">
                {selectedParticipants.map((p) => (
                  <span
                    key={p.id || p.email}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-100/80 text-indigo-900 text-xs font-bold border border-indigo-300/80 shadow-2xs"
                  >
                    <div className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold">
                      {p.name?.slice(0, 1).toUpperCase()}
                    </div>
                    <span>{p.name}</span>
                    {p.designation && (
                      <span className="text-[10px] text-indigo-700 bg-indigo-200/60 px-1 py-0.2 rounded">
                        {p.designation === "VENDOR_HR" ? "Vendor HR" : "Employee HR"}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveParticipant(p.id || p.email)}
                      className="ml-0.5 hover:text-rose-600 text-indigo-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-indigo-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Type HR name or email (e.g. Priya Sharma)..."
                  value={searchQuery}
                  onFocus={() => setDropdownOpen(true)}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-indigo-200 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Dropdown Options */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl z-50 divide-y divide-slate-100 custom-scrollbar">
                  {loading ? (
                    <div className="p-3 text-center text-xs text-slate-400">Loading HR users...</div>
                  ) : filteredOptions.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      {searchQuery ? `No HR user found matching "${searchQuery}".` : "No HR members found."}
                    </div>
                  ) : (
                    filteredOptions.map((h) => {
                      const selected = isSelected(h);
                      const isVHR = h.hrType === "VENDOR_HR";
                      return (
                        <div
                          key={h.id || h._id}
                          onClick={() => handleSelectOption(h)}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                            selected ? "bg-indigo-50/90 text-indigo-950 font-bold" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs shrink-0 ${
                                isVHR ? "bg-purple-600" : "bg-indigo-600"
                              }`}
                            >
                              {h.name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 text-xs truncate">
                                {h.name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    isVHR
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-indigo-100 text-indigo-700"
                                  }`}
                                >
                                  {isVHR ? "Vendor HR" : "Employee HR"}
                                </span>
                                <span>{h.email}</span>
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              selected
                                ? "bg-indigo-600 text-white"
                                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            }`}
                          >
                            {selected ? "Selected" : "+ Add"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <p className="text-[10px] text-indigo-700/80 font-medium">
              💡 You can select 1 particular HR, 2-3 HR coordinators, or toggle "All HRs".
            </p>
          </div>
        )}
      </div>
    );
  }

  // 4. CANDIDATE INTERVIEW VIEW
  if (meetingType === "CANDIDATE_INTERVIEW") {
    return (
      <div
        ref={containerRef}
        className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-200/90 space-y-3"
      >
        <div className="flex items-center justify-between">
          <label className="text-emerald-950 font-bold text-xs flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>Interview Candidate & Partner Agency</span>
          </label>

          <button
            type="button"
            onClick={() => setManualCandidateEntry(!manualCandidateEntry)}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
          >
            {manualCandidateEntry ? "Select from Applicants" : "+ Enter Manually"}
          </button>
        </div>

        {candidateData.candidateName && !manualCandidateEntry ? (
          <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-300 rounded-xl shadow-2xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                {candidateData.candidateName?.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-slate-900 text-xs truncate">
                  {candidateData.candidateName}
                </div>
                <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-semibold text-emerald-700">
                    {candidateData.candidateId || "CAND"}
                  </span>
                  {candidateData.jobTitle && (
                    <span>• {candidateData.jobTitle}</span>
                  )}
                  {candidateData.vendorName && (
                    <span className="text-amber-800 font-semibold bg-amber-50 px-1 py-0.2 rounded border border-amber-200/60">
                      Agency: {candidateData.vendorName}
                    </span>
                  )}
                  {candidateData.candidateEmail && (
                    <span className="text-slate-400">• {candidateData.candidateEmail}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onCandidateChange({
                  candidateId: "",
                  candidateName: "",
                  candidateEmail: "",
                  vendorId: "",
                  vendorName: "",
                  jobTitle: "",
                  projectName: "",
                })
              }
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition cursor-pointer"
              title="Change candidate"
            >
              <X size={15} />
            </button>
          </div>
        ) : manualCandidateEntry ? (
          <div className="grid grid-cols-2 gap-2 bg-white/90 p-2.5 rounded-xl border border-emerald-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Candidate Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sneha Patel"
                value={candidateData.candidateName}
                onChange={(e) =>
                  onCandidateChange({
                    ...candidateData,
                    candidateName: e.target.value,
                    candidateId: candidateData.candidateId || `CAND-${Date.now().toString().slice(-4)}`,
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Candidate Email
              </label>
              <input
                type="email"
                placeholder="candidate@example.com"
                value={candidateData.candidateEmail}
                onChange={(e) =>
                  onCandidateChange({
                    ...candidateData,
                    candidateEmail: e.target.value,
                  })
                }
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search candidate by name, ID or job (e.g. Sneha Patel, CAND-1029)..."
                value={searchQuery}
                onFocus={() => setDropdownOpen(true)}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-emerald-200 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl z-50 divide-y divide-slate-100 custom-scrollbar">
                {loading ? (
                  <div className="p-3 text-center text-xs text-slate-400">Loading applicants...</div>
                ) : filteredOptions.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    {searchQuery
                      ? `No applicant found matching "${searchQuery}". Click "+ Enter Manually" to type name.`
                      : "No applicant applications currently listed."}
                  </div>
                ) : (
                  filteredOptions.map((c) => (
                    <div
                      key={c.candidateId || c.id || c._id}
                      onClick={() => handleSelectOption(c)}
                      className="p-2.5 hover:bg-emerald-50/80 cursor-pointer flex items-center justify-between transition"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                          {c.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                            <span className="font-mono text-emerald-700 font-semibold">{c.candidateId}</span>
                            <span>• {c.position || "Applicant"}</span>
                            {c.vendorName && (
                              <span className="text-amber-800 font-medium">({c.vendorName})</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold px-2 py-0.5 rounded-md bg-emerald-50 shrink-0">
                        Select
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 5. GENERAL VIEW
  return (
    <div
      ref={containerRef}
      className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/90 space-y-3"
    >
      <div className="flex items-center justify-between">
        <label className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
          <Users className="w-4 h-4 text-blue-600" />
          <span>Conference Invitees</span>
        </label>

        <div className="inline-flex rounded-lg bg-white/80 p-0.5 border border-slate-200 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => onTargetModeChange("ALL")}
            className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
              targetMode === "ALL"
                ? "bg-slate-800 text-white shadow-2xs"
                : "text-slate-700 hover:text-slate-950"
            }`}
          >
            All Members
          </button>
          <button
            type="button"
            onClick={() => onTargetModeChange("SPECIFIC")}
            className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
              targetMode === "SPECIFIC"
                ? "bg-slate-800 text-white shadow-2xs"
                : "text-slate-700 hover:text-slate-950"
            }`}
          >
            Specific ({selectedParticipants.length})
          </button>
        </div>
      </div>

      {targetMode === "ALL" ? (
        <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Broadcast conference invitation to all team members.</span>
        </div>
      ) : (
        <div className="space-y-2">
          {selectedParticipants.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-slate-200 max-h-24 overflow-y-auto custom-scrollbar">
              {selectedParticipants.map((p) => (
                <span
                  key={p.id || p.code || p.name}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300"
                >
                  <span>{p.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveParticipant(p.id || p.code || p.name)}
                    className="hover:text-rose-600 text-slate-500 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Type invitee name or company..."
              value={searchQuery}
              onFocus={() => setDropdownOpen(true)}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none"
            />

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl z-50 divide-y divide-slate-100">
                {filteredOptions.slice(0, 30).map((opt) => (
                  <div
                    key={opt.id || opt._id || opt.name}
                    onClick={() => handleSelectOption(opt)}
                    className="p-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-800">{opt.name || opt.companyName}</span>
                    <span className="text-[10px] text-blue-600 font-bold">+ Add</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

