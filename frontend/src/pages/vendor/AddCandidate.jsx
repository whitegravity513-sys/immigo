import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  FileText,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Download,
  Camera,
  User,
  Check,
} from "lucide-react";
import * as XLSX from "xlsx";
import crmVendorService from "../../services/crmVendorService.js";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
];

export function AddCandidate() {
  const navigate = useNavigate();
  const vendor = crmVendorService.getCurrentVendor();

  const [availableProjects, setAvailableProjects] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "",
    passportNumber: "",
    passportIssueDate: "",
    passportExpiryDate: "",
    dob: "",
    gender: "Male",
    currentPosition: "",
    project: "",
    qualification: "",
    experienceYears: "",
    skills: "",
    state: "",
  });

  const [candidatePhoto, setCandidatePhoto] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [excelImportSuccess, setExcelImportSuccess] = useState("");

  const resumeRef = useRef(null);
  const excelInputRef = useRef(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const prjs = await crmVendorService.getAvailableProjects(vendor?.id);
        setAvailableProjects(Array.isArray(prjs) ? prjs : []);
      } catch {
        setAvailableProjects([]);
      }
    };
    loadProjects();
  }, [vendor?.id]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (error) setError("");
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Photo must be 2 MB or less.");
      return;
    }
    setPhotoError("");
    const reader = new FileReader();
    reader.onloadend = () => {
      setCandidatePhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleMandatoryFileChange = (setter, fieldKey, file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setFieldErrors((prev) => ({ ...prev, [fieldKey]: "Only PDF files are allowed." }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, [fieldKey]: "File must be under 2 MB." }));
      return;
    }
    setter(file);
    setFieldErrors((prev) => ({ ...prev, [fieldKey]: "" }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = "Candidate Name is required.";
    if (!formData.currentPosition.trim()) errors.currentPosition = "Trade is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");

    if (!validate()) {
      setError("Please fill all required candidate fields.");
      return;
    }

    setLoading(true);
    try {
      const documents = [];
      if (resumeFile) {
        documents.push({
          name: "Resume / CV",
          fileName: resumeFile.name,
          size: `${(resumeFile.size / (1024 * 1024)).toFixed(2)} MB`,
          type: "Resume",
        });
      }

      const candidateData = {
        fullName: formData.fullName.trim(),
        passportNumber: formData.passportNumber.trim().toUpperCase(),
        passportIssueDate: formData.passportIssueDate || "",
        dateOfIssue: formData.passportIssueDate || "",
        passportExpiryDate: formData.passportExpiryDate || "",
        passportExpiry: formData.passportExpiryDate || "",
        dob: formData.dob || "",
        gender: formData.gender || "Male",
        currentPosition: formData.currentPosition.trim(),
        trade: formData.currentPosition.trim(),
        project: formData.project || "Not Assigned",
        projectName: formData.project || "Not Assigned",
        qualification: formData.qualification.trim(),
        experienceYears: formData.experienceYears ? Number(formData.experienceYears) : 0,
        skills: formData.skills ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        state: formData.state.trim(),
        photo: candidatePhoto || "",
        documents,
        vendorId: vendor?.id || "VND-1001",
        vendorName: vendor?.companyName || "Vendor Partner",
        status: "Available",
      };

      const created = await crmVendorService.createCandidate(vendor?.id, candidateData);
      navigate(`/vendor/candidates/${created.id}`);
    } catch (err) {
      setError(err.message || "Failed to save candidate details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSampleExcel = () => {
    const sampleRows = [
      {
        "Name": "Rahul Sharma",
        "Passport No.": "Z1234567",
        "Date of issue": "2021-04-10",
        "Date of Expiry": "2031-04-09",
        "DOB": "1994-08-15",
        "Gender": "Male",
        "Trade": "Electrician",
        "Project": "Dubai International Airport Terminal Expansion",
        "Qualification": "ITI Electrical",
        "Experience": "5",
        "Skill": "Industrial Wiring, Panel Board Installation, Conduit Bending",
        "State": "Uttar Pradesh",
      },
      {
        "Name": "Suresh Kumar",
        "Passport No.": "A9876543",
        "Date of issue": "2022-01-20",
        "Date of Expiry": "2032-01-19",
        "DOB": "1996-03-22",
        "Gender": "Male",
        "Trade": "6G Welder",
        "Project": "Riyadh Metro Infrastructure",
        "Qualification": "10th + Welder Certificate",
        "Experience": "6",
        "Skill": "TIG Welding, MIG Welding, Pipeline Jointing",
        "State": "Bihar",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
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
      { wch: 35 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates Template");
    XLSX.writeFile(workbook, "Candidate_Entry_Template.xlsx");
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
          setError("The uploaded spreadsheet is empty.");
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

        setExcelImportSuccess(`Successfully imported ${importedCount} candidates from Excel!`);
        setTimeout(() => {
          navigate("/vendor/candidates");
        }, 1500);
      } catch (err) {
        setError(`Failed to parse Excel file: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Candidates</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Add Candidate Entry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter candidate details for placement. Fields with <span className="text-red-500">*</span> are mandatory.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleDownloadSampleExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Download Excel Format</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer">
            <UploadCloud size={14} />
            <span>Bulk Upload (Excel)</span>
            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleExcelImport}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <Save size={15} />
            <span>{loading ? "Saving..." : "Save Candidate"}</span>
          </button>
        </div>
      </div>

      {excelImportSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{excelImportSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="relative w-20 h-20 rounded-xl bg-white border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              {candidatePhoto ? (
                <img
                  src={candidatePhoto}
                  alt="Candidate Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 text-center p-2">
                  <User size={24} className="text-slate-400" />
                  <span className="text-[9px] mt-1 font-semibold">No Photo</span>
                </div>
              )}
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs transition">
                  <Camera size={14} className="text-blue-600" />
                  <span>{candidatePhoto ? "Change Photo" : "Upload Candidate Photo"}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                {candidatePhoto && (
                  <button
                    type="button"
                    onClick={() => setCandidatePhoto("")}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Optional. Formats: JPG, PNG, WEBP (Max 2 MB).
              </p>
              {photoError && (
                <p className="text-rose-600 text-[10px] flex items-center gap-1 font-semibold">
                  <AlertCircle size={10} />
                  {photoError}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleFieldChange}
                placeholder="Candidate Full Name"
                className={`w-full px-3 py-2 border rounded-xl focus:border-blue-600 focus:outline-none bg-white ${
                  fieldErrors.fullName ? "border-red-400 bg-red-50" : "border-slate-300"
                }`}
              />
              {fieldErrors.fullName && (
                <p className="text-red-600 text-[10px] mt-0.5">{fieldErrors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Passport No. <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleFieldChange}
                placeholder="e.g. A1234567 (Optional)"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl uppercase focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of issue</label>
              <input
                type="date"
                name="passportIssueDate"
                value={formData.passportIssueDate}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Expiry</label>
              <input
                type="date"
                name="passportExpiryDate"
                value={formData.passportExpiryDate}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">DOB</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Trade <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="currentPosition"
                required
                value={formData.currentPosition}
                onChange={handleFieldChange}
                placeholder="e.g. Electrician, Welder, Mason, Plumber"
                className={`w-full px-3 py-2 border rounded-xl focus:border-blue-600 focus:outline-none bg-white ${
                  fieldErrors.currentPosition ? "border-red-400 bg-red-50" : "border-slate-300"
                }`}
              />
              {fieldErrors.currentPosition && (
                <p className="text-red-600 text-[10px] mt-0.5">{fieldErrors.currentPosition}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project</label>
              <select
                name="project"
                value={formData.project}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              >
                <option value="">Not Assigned / General Pool</option>
                {availableProjects.map((p) => {
                  const pTitle = p.title || p.projectName || p.name;
                  return (
                    <option key={p.id || p._id} value={pTitle}>
                      {pTitle}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Qualification</label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleFieldChange}
                placeholder="e.g. 10th, 12th, ITI, Diploma, Degree"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Experience (Years)</label>
              <input
                type="number"
                min={0}
                max={50}
                name="experienceYears"
                value={formData.experienceYears}
                onChange={handleFieldChange}
                placeholder="e.g. 4"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">
                Skill (Comma separated technical skills)
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleFieldChange}
                placeholder="e.g. Industrial Wiring, Conduit Bending, Panel Assembly, TIG/MIG"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Resume / CV Document</h3>
              <p className="text-xs text-slate-500">Optional PDF document (Max 2 MB)</p>
            </div>
            {resumeFile && (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check size={10} /> Attached
              </span>
            )}
          </div>

          {resumeFile ? (
            <div className="flex items-center justify-between bg-slate-50 p-2.5 border border-slate-200 rounded-xl text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={14} className="text-blue-600 shrink-0" />
                <span className="truncate text-xs font-mono font-medium text-slate-800">{resumeFile.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResumeFile(null);
                  if (resumeRef.current) resumeRef.current.value = "";
                }}
                className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="block w-full py-3.5 text-center bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-xs font-bold text-blue-600 cursor-pointer transition">
              <div className="flex items-center justify-center gap-2">
                <UploadCloud size={16} className="text-blue-600" />
                <span>Upload Candidate Resume (PDF)</span>
              </div>
              <input
                ref={resumeRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => handleMandatoryFileChange(setResumeFile, "resume", e.target.files?.[0])}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Candidate will be saved under your active vendor account and available for project allocations.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <Save size={15} />
            <span>{loading ? "Saving Candidate..." : "Save Candidate"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddCandidate;
