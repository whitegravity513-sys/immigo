import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Send,
  FileText,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Download,
  Trash2,
  Tag,
  RotateCcw,
  Clock,
  UserCheck,
  CheckCircle2,
  Video,
  UploadCloud,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";
import * as XLSX from "xlsx";

export function Candidates() {
  const navigate = useNavigate();
  const vendor = crmVendorService.getCurrentVendor();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [countryFilter, setCountryFilter] = useState("All");
  const [selectedTag, setSelectedTag] = useState("All");
  const [statusTab, setStatusTab] = useState("Available"); 

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const [candData, appData] = await Promise.all([
        crmVendorService.getCandidates(vendor?.id, {
          search,
          position: positionFilter,
          country: countryFilter,
        }),
        crmVendorService.getApplications(vendor?.id),
      ]);

      
      let enriched = candData.map((c) => {
        const cApps = (appData || []).filter((a) => a.candidateId === c.id);
        const selectedApp = cApps.find((a) => ["Selected", "Shortlisted", "Completed"].includes(a.status));
        const interviewApp = cApps.find((a) => a.status === "Interview" || a.status === "Interview Scheduled");
        const holdApp = cApps.find((a) => a.status === "On Hold");
        const rejectedApp = cApps.find((a) => a.status === "Rejected");

        let poolStatus = "Available";
        let lastProjectInfo = null;
        let interviewInfo = null;

        if (selectedApp) {
          poolStatus = selectedApp.status; 
          lastProjectInfo = selectedApp.projectName || selectedApp.clientName;
        } else if (interviewApp) {
          poolStatus = "Interview";
          lastProjectInfo = interviewApp.projectName || interviewApp.clientName;
          interviewInfo = interviewApp.interviewDetails;
        } else if (holdApp) {
          poolStatus = "On Hold";
          lastProjectInfo = holdApp.projectName || holdApp.clientName;
        } else if (rejectedApp) {
          poolStatus = "Rejected";
          lastProjectInfo = rejectedApp.projectName || rejectedApp.clientName;
        }

        return {
          ...c,
          poolStatus,
          lastProjectInfo,
          interviewInfo,
        };
      });

      
      if (selectedTag !== "All") {
        enriched = enriched.filter(
          (c) =>
            (c.tags || []).some((t) => t.toLowerCase() === selectedTag.toLowerCase()) ||
            c.currentPosition?.toLowerCase().includes(selectedTag.toLowerCase()) ||
            c.preferredCountry?.toLowerCase() === selectedTag.toLowerCase()
        );
      }

      
      if (statusTab === "Available") {
        
        enriched = enriched.filter((c) => ["Available", "Rejected", "On Hold"].includes(c.poolStatus));
      } else if (statusTab === "Selected") {
        
        enriched = enriched.filter((c) => ["Selected", "Shortlisted", "Completed", "Interview"].includes(c.poolStatus));
      }

      setCandidates(enriched);
    } catch (err) {
      console.error("Failed to load candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [search, positionFilter, countryFilter, selectedTag, statusTab, vendor?.id]);

  const handleDelete = async (candidateId, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from your pool?`)) {
      await crmVendorService.deleteCandidate(candidateId);
      fetchCandidates();
    }
  };

  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const totalPages = Math.ceil(candidates.length / ITEMS_PER_PAGE) || 1;
  const paginatedCandidates = candidates.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleExportExcel = () => {
    const excelRows = candidates.map((c) => ({
      "Name": c.fullName || "—",
      "Passport No.": c.passportNumber || "—",
      "Date of issue": c.passportIssueDate || c.dateOfIssue || "—",
      "Date of Expiry": c.passportExpiryDate || c.passportExpiry || "—",
      "DOB": c.dob || c.birthDate || "—",
      "Gender": c.gender || "Male",
      "Trade": c.trade || c.currentPosition || "—",
      "Project": c.projectName || c.lastProjectInfo || c.project || "Not Assigned",
      "Qualification": c.qualification || "—",
      "Experience": c.experienceYears != null ? (typeof c.experienceYears === "number" ? `${c.experienceYears} Years` : c.experienceYears) : "—",
      "Vendor": vendor?.companyName || c.vendorName || "—",
      "Skill": Array.isArray(c.skills) ? c.skills.join(", ") : (c.skills || "—"),
      "State": c.state || "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    worksheet["!cols"] = [
      { wch: 22 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 10 },
      { wch: 18 },
      { wch: 28 },
      { wch: 20 },
      { wch: 14 },
      { wch: 25 },
      { wch: 35 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates Roster");
    const filename = `Candidates_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const handleExcelImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: "binary", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!rows.length) {
          alert("The uploaded spreadsheet is empty.");
          return;
        }

        let importedCount = 0;
        for (const row of rows) {
          const name = row["Name"] || row["Candidate Name"] || row["Full Name"];
          if (!name) continue;

          const passportNo = row["Passport No."] || row["Passport Number"] || row["Passport"] || "";
          const dateOfIssue = row["Date of issue"] || row["Issue Date"] || "";
          const dateOfExpiry = row["Date of Expiry"] || row["Expiry Date"] || "";
          const dob = row["DOB"] || row["Date of Birth"] || "";
          const gender = row["Gender"] || "Male";
          const trade = row["Trade"] || row["Position"] || "";
          const project = row["Project"] || "Not Assigned";
          const qualification = row["Qualification"] || "";
          const experience = row["Experience"] || 0;
          const skill = row["Skill"] || row["Skills"] || "";
          const state = row["State"] || "";

          const candidateData = {
            fullName: String(name).trim(),
            passportNumber: String(passportNo).trim().toUpperCase(),
            passportIssueDate: String(dateOfIssue).trim(),
            dateOfIssue: String(dateOfIssue).trim(),
            passportExpiryDate: String(dateOfExpiry).trim(),
            passportExpiry: String(dateOfExpiry).trim(),
            dob: String(dob).trim(),
            gender: String(gender).trim() || "Male",
            currentPosition: String(trade).trim(),
            trade: String(trade).trim(),
            project: String(project).trim(),
            projectName: String(project).trim(),
            qualification: String(qualification).trim(),
            experienceYears: experience ? Number(experience) : 0,
            skills: skill ? String(skill).split(",").map((s) => s.trim()).filter(Boolean) : [],
            state: String(state).trim(),
            vendorId: vendor?.id || "VND-1001",
            vendorName: vendor?.companyName || "Vendor Partner",
            status: "Available",
          };

          await crmVendorService.createCandidate(vendor?.id, candidateData);
          importedCount++;
        }

        alert(`Successfully imported ${importedCount} candidates from Excel!`);
        fetchCandidates();
      } catch (err) {
        alert(`Failed to import Excel: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-5 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Candidate Pool & Reusability Roster
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage candidate database. Rejected or On Hold candidates remain available & reusable for new project applications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors shadow-2xs cursor-pointer"
            title="Download candidates in Excel format"
          >
            <Download size={14} />
            <span>Export Excel</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors shadow-2xs cursor-pointer">
            <UploadCloud size={14} />
            <span>Import Excel</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleExcelImport}
              className="hidden"
            />
          </label>

          <Link
            to="/vendor/submit-candidate"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Send size={14} className="text-indigo-600" />
            <span>Submit to Project</span>
          </Link>

          <Link
            to="/vendor/candidates/add"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Add Candidate</span>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit text-xs font-bold">
        <button
          type="button"
          onClick={() => { setStatusTab("Available"); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            statusTab === "Available"
              ? "bg-white text-blue-700 shadow-2xs font-extrabold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Available & Reusable Candidates (Fresh / Rejected / Hold)
        </button>
        <button
          type="button"
          onClick={() => { setStatusTab("Selected"); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            statusTab === "Selected"
              ? "bg-white text-emerald-700 shadow-2xs font-extrabold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Active Shortlisted / Selected Candidates
        </button>
        <button
          type="button"
          onClick={() => { setStatusTab("All"); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            statusTab === "All"
              ? "bg-white text-slate-900 shadow-2xs font-extrabold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          All Candidates
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search candidate by name, ID, skill, trade, experience, tags..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 bg-white text-xs"
            />
          </div>

          <div>
            <select
              value={positionFilter}
              onChange={(e) => { setPositionFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 bg-white cursor-pointer font-medium text-xs"
            >
              <option value="All">All Trade Positions</option>
              <option value="Electrician">Electrician</option>
              <option value="Welder 6G / TIG">Welder 6G / TIG</option>
              <option value="Mason / Tile Layer">Mason / Tile Layer</option>
              <option value="Civil Site Supervisor">Civil Site Supervisor</option>
              <option value="Plumber & Pipe Fitter">Plumber & Pipe Fitter</option>
              <option value="Heavy Equipment Operator">Heavy Equipment Operator</option>
            </select>
          </div>

          <div>
            <select
              value={countryFilter}
              onChange={(e) => { setCountryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 bg-white cursor-pointer font-medium text-xs"
            >
              <option value="All">All Preferred Countries</option>
              <option value="UAE">UAE</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
              <option value="Qatar">Qatar</option>
              <option value="Oman">Oman</option>
              <option value="Kuwait">Kuwait</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-xs font-semibold">Loading candidates...</div>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Users size={22} />
            </div>
            <h4 className="text-sm font-bold text-slate-900">No Candidates Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || positionFilter !== "All"
                ? "No candidates matched your search criteria. Try resetting filters."
                : "Add your first candidate to start submitting profiles to client projects."}
            </p>
            <Link
              to="/vendor/candidates/add"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>+ Add Candidate</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-2 px-3">Candidate</th>
                    <th className="py-2 px-3">Trade / Position</th>
                    <th className="py-2 px-3">Availability & Reusability</th>
                    <th className="py-2 px-3">Experience & Qual.</th>
                    <th className="py-2 px-3">Skills & Tags</th>
                    <th className="py-2 px-3">Pref. Country</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCandidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-3">
                          {c.photo ? (
                            <img
                              src={c.photo}
                              alt={c.fullName}
                              className="w-6 h-6 rounded-md object-cover border border-slate-200 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                              {c.fullName ? c.fullName.slice(0, 2).toUpperCase() : "CD"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              to={`/vendor/candidates/${c.id}`}
                              className="font-bold text-slate-900 hover:text-blue-600 block truncate"
                            >
                              {c.fullName}
                            </Link>
                            <span className="text-[10px] font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                              {c.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-1.5 px-3">
                        <span className="font-semibold text-slate-800 block">
                          {c.currentPosition}
                        </span>
                      </td>

                      <td className="py-1.5 px-3">
                        {c.poolStatus === "Rejected" ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <RotateCcw size={11} className="text-rose-600 shrink-0" />
                              <span>Rejected (Reusable)</span>
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[140px]">
                              Prev: {c.lastProjectInfo || "Other project"}
                            </span>
                          </div>
                        ) : c.poolStatus === "On Hold" ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock size={11} className="text-amber-600 shrink-0" />
                              <span>On Hold (Reusable)</span>
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[140px]">
                              Prev: {c.lastProjectInfo || "Other project"}
                            </span>
                          </div>
                        ) : c.poolStatus === "Interview" ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Video size={11} className="text-purple-600 shrink-0" />
                              <span>Interview Scheduled</span>
                            </span>
                            <span className="text-[10px] text-purple-600 block mt-0.5 truncate max-w-[140px]">
                              {c.lastProjectInfo} {c.interviewInfo?.dateTime ? `• ${c.interviewInfo.dateTime}` : ""}
                            </span>
                          </div>
                        ) : ["Selected", "Shortlisted", "Completed"].includes(c.poolStatus) ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <UserCheck size={11} className="text-indigo-600 shrink-0" />
                              <span>{c.poolStatus}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block mt-0.5 truncate max-w-[140px]">
                              {c.lastProjectInfo}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                              <span>Available (Ready)</span>
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-1.5 px-3 text-slate-600">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <Briefcase size={12} className="text-slate-400" />
                          <span>{c.experienceYears} Years Exp</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px] mt-0.5">
                          {c.qualification || "Trade Certified"}
                        </div>
                      </td>

                      <td className="py-1.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {(c.tags || c.skills || []).slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-1 font-medium text-slate-700">
                          <MapPin size={12} className="text-blue-500" />
                          <span>{c.preferredCountry || "Gulf"}</span>
                        </div>
                      </td>

                      <td className="py-1.5 px-3 text-right space-x-1 whitespace-nowrap">
                        <Link
                          to={`/vendor/candidates/${c.id}`}
                          className="inline-flex items-center px-2 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                          title="View Profile"
                        >
                          <Eye size={13} className="mr-1" />
                          <span>View</span>
                        </Link>

                        <Link
                          to={`/vendor/submit-candidate?candidateId=${c.id}`}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                          title={c.poolStatus === "Rejected" || c.poolStatus === "On Hold" ? "Reuse in New Project" : "Submit to Project"}
                        >
                          {c.poolStatus === "Rejected" || c.poolStatus === "On Hold" ? (
                            <>
                              <RotateCcw size={12} className="mr-1" />
                              <span>Reuse</span>
                            </>
                          ) : (
                            <>
                              <Send size={12} className="mr-1" />
                              <span>Submit</span>
                            </>
                          )}
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.fullName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete candidate"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-semibold">
                Showing <strong className="text-slate-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to{" "}
                <strong className="text-slate-800">{Math.min(currentPage * ITEMS_PER_PAGE, candidates.length)}</strong> of{" "}
                <strong className="text-slate-800">{candidates.length}</strong> candidates
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  ← Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => handlePageChange(pg)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                      currentPage === pg
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Candidates;
