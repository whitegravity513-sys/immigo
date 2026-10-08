import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FolderKanban,
  Building2,
  MapPin,
  Clock,
  Users,
  Briefcase,
  Globe,
  Calendar,
  FileText,
  ShieldCheck,
  Award,
  Check,
  Send,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import { crmClientService } from "../../services/crmClientService.js";

export default function VendorProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProjectDetails();
  }, [id]);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await crmClientService.getProjectById(null, id);
      if (!data) {
        setError("Project not found or no longer available.");
      } else {
        setProject(data);
      }
    } catch (err) {
      console.error("Failed to load project details:", err);
      setError("Failed to load project details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900">Project Not Found</h2>
        <p className="text-xs text-slate-500">{error || "The project you are looking for does not exist."}</p>
        <div>
          <Link
            to="/vendor/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const trades = project.manpowerRequirements || [];
  const totalCount =
    project.totalHeadcount ||
    trades.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0) ||
    "N/A";

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/vendor/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <span className="text-xs text-slate-400 font-mono">
          Project ID: <span className="font-bold text-slate-700">{project.id}</span>
        </span>
      </div>

      {/* Main Project Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-5 sm:p-7 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shrink-0 text-blue-400 shadow-inner">
              <FolderKanban size={26} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {project.projectName}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {project.status || "Active"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 size={13} className="text-blue-400" />
                  {project.clientName}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-emerald-400" />
                  {project.location ? `${project.location}, ` : ""}
                  {project.country}
                </span>
                {project.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-amber-400" />
                    {project.duration}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <Link
              to={`/vendor/submit-candidate?project=${project.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
            >
              <Send size={14} />
              <span>Submit Candidate to this Project</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-1.5 text-blue-700 font-bold text-[11px] uppercase tracking-wider mb-1">
            <Users size={14} /> Total Headcount
          </div>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Approved Manpower Target</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-[11px] uppercase tracking-wider mb-1">
            <Briefcase size={14} /> Trades Defined
          </div>
          <div className="text-2xl font-black text-slate-900">{trades.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Job Positions & Roles</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px] uppercase tracking-wider mb-1">
            <Globe size={14} /> Work Location
          </div>
          <div className="text-2xl font-black text-slate-900 truncate">
            {project.country || "Overseas"}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            {project.location || "On-site Deployment"}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-1.5 text-purple-700 font-bold text-[11px] uppercase tracking-wider mb-1">
            <Calendar size={14} /> Duration / Timeline
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 truncate">
            {project.duration || "24 Months"}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            {project.startDate ? `Starts: ${project.startDate}` : "Immediate Deployment"}
          </div>
        </div>
      </div>

      {/* Trades & Manpower Requirements Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase size={16} className="text-blue-600" />
              Trades & Manpower Requirements
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Positions open for candidate submissions under this project.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-bold">
            {trades.length} Active Trades
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Trade / Position Role</th>
                <th className="py-3 px-4">Quantity Req.</th>
                <th className="py-3 px-4">Age Criteria</th>
                <th className="py-3 px-4">Min Qualification</th>
                <th className="py-3 px-4">Experience</th>
                <th className="py-3 px-4">Last / Preferred Company</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trades.length > 0 ? (
                trades.map((pos, idx) => (
                  <tr key={pos.id || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                        <span className="text-sm">{pos.position || pos.positionTitle || "General Role"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-700">
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200/70">
                        {pos.quantity} Pax
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {pos.minAge || pos.maxAge
                        ? `${pos.minAge || "Any"} - ${pos.maxAge || "Any"} Yrs`
                        : "No restriction"}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <GraduationCap size={12} className="text-slate-400" />
                        {pos.qualification || "Any"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {pos.experienceYears ? `${pos.experienceYears} Years` : "Any"}
                    </td>
                    <td className="py-3 px-4 text-slate-600 italic">
                      {pos.lastCompany || "-"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/vendor/submit-candidate?project=${project.id}&position=${encodeURIComponent(
                          pos.position || pos.positionTitle || ""
                        )}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-[11px] transition-colors"
                      >
                        <Send size={11} /> Submit Trade
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500 italic text-xs">
                    No individual trade positions recorded. General manpower accepted.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Scope & Description */}
      {project.description && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-2">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText size={16} className="text-blue-600" />
            Project Scope & Job Description
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {project.description}
          </p>
        </div>
      )}

      {/* Additional Requirements & Compliance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            Required Documents & Verification
          </h3>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="font-bold text-slate-700 block mb-0.5">Mandatory Documents:</span>
              <span>
                {project.additionalRequirements?.requiredDocuments ||
                  "Valid Passport (min 18m validity), Trade Test Certificate, Police Clearance"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="font-bold text-slate-700 block mb-0.5">Medical Fitness:</span>
              <span>
                {project.additionalRequirements?.medicalRequirements ||
                  "GAMCA / GCC Approved Fit Medical Report"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="font-bold text-slate-700 block mb-0.5">Language Proficiency:</span>
              <span>
                {project.additionalRequirements?.languageRequirements ||
                  "Basic English / Hindi Communication"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award size={16} className="text-indigo-600" />
            Benefits & Working Facilities
          </h3>
          <p className="text-xs text-slate-500">
            Employer-provided benefits for selected candidates deployed to this site:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {(project.benefits && project.benefits.length > 0
              ? project.benefits
              : ["Accommodation", "Transportation", "Medical Insurance", "Visa", "Overtime"]
            ).map((b, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
              >
                <Check size={12} className="text-emerald-600" />
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Navigation Bar */}
      <div className="pt-4 flex items-center justify-between border-t border-slate-200 flex-wrap gap-3">
        <Link
          to="/vendor/dashboard"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
        >
          ← Back to Dashboard
        </Link>
        <Link
          to={`/vendor/submit-candidate?project=${project.id}`}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition inline-flex items-center gap-2"
        >
          <Send size={14} />
          <span>Submit Candidates for this Project</span>
        </Link>
      </div>
    </div>
  );
}
