import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check,
  ShieldCheck,
  Clock,
  Lock,
  UploadCloud,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";
import AuthHeader from "../../components/auth/AuthHeader.jsx";
import heroTravelerBg from "../../assets/immigo-hero-traveler-bg.jpg";
import globePinIllustration from "../../assets/immigo-globe-pin.jpg";

// Indian States and Cities Mapping
const INDIAN_STATES_AND_CITIES = {
  "Uttar Pradesh": ["Noida", "Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Prayagraj", "Meerut", "Gorakhpur"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Navi Mumbai", "Aurangabad", "Solapur"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Davangere"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Kharagpur"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani"],
};

const BUSINESS_TYPES = [
  "Proprietorship",
  "Partnership",
  "LLP",
  "Private Limited",
  "Public Limited",
  "Other",
];

const SPECIALIZATION_OPTIONS = [
  "Construction",
  "Electrical",
  "Plumbing",
  "Welding",
  "Hospitality",
  "Security",
  "Healthcare",
  "Manufacturing",
  "Drivers",
  "IT",
  "Other",
];

const COUNTRIES_SERVED_OPTIONS = [
  "UAE",
  "Saudi Arabia",
  "Qatar",
  "Oman",
  "Kuwait",
  "Bahrain",
  "Other",
];

const REQUIRED_DOCUMENTS = [
  { key: "gstCertificate", label: "GST Certificate", required: true },
  { key: "panCard", label: "PAN Card", required: true },
  { key: "registrationCertificate", label: "Registration Cert", required: true },
  { key: "recruitmentLicense", label: "Recruitment License", required: true },
  { key: "addressProof", label: "Address Proof", required: true },
  { key: "authorizedPersonId", label: "Authorized ID", required: true },
];

const FORM_STEPS = [
  { id: 1, name: "Page 1: Profile", subtitle: "Agency Details, Location & Contact Person" },
  { id: 2, name: "Page 2: Documents", subtitle: "Specializations & Statutory Uploads" },
  { id: 3, name: "Page 3: Account", subtitle: "Credentials & Verification Agreement" },
];

export function VendorRegister() {
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    companyName: "",
    businessType: "Private Limited",
    registrationNumber: "",
    establishmentYear: "",
    gstin: "",
    pan: "",
    website: "",

    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    area: "",
    pinCode: "",
    address: "",

    contactPersonName: "",
    designation: "",
    mobile: "",
    alternateMobile: "",
    email: "",
    alternateEmail: "",

    specializations: ["Construction", "Electrical"],
    countriesServed: ["UAE", "Saudi Arabia"],
    experienceYears: "5",
    availableCandidates: "",
    monthlyCapacity: "",

    loginEmail: "",
    password: "",
    confirmPassword: "",

    declarationConfirmed: false,
  });

  const [uploadedDocs, setUploadedDocs] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [successSubmitted, setSuccessSubmitted] = useState(false);
  const [submittedVendor, setSubmittedVendor] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === "checkbox" ? checked : value;

    if (name === "state") {
      const defaultCity = INDIAN_STATES_AND_CITIES[newVal]?.[0] || "";
      setFormData((prev) => ({
        ...prev,
        state: newVal,
        city: defaultCity,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: newVal,
      }));
    }

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
    if (generalError) setGeneralError("");
  };

  const toggleSpecialization = (item) => {
    setFormData((prev) => {
      const exists = prev.specializations.includes(item);
      const updated = exists
        ? prev.specializations.filter((s) => s !== item)
        : [...prev.specializations, item];
      return { ...prev, specializations: updated };
    });
  };

  const toggleCountryServed = (cntry) => {
    setFormData((prev) => {
      const exists = prev.countriesServed.includes(cntry);
      const updated = exists
        ? prev.countriesServed.filter((c) => c !== cntry)
        : [...prev.countriesServed, cntry];
      return { ...prev, countriesServed: updated };
    });
  };

  const handleFileUpload = (docKey, docLabel, file) => {
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setFieldErrors((prev) => ({
        ...prev,
        [docKey]: "PDF, JPG, JPEG, and PNG only.",
      }));
      return;
    }

    const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
    setUploadedDocs((prev) => ({
      ...prev,
      [docKey]: {
        name: docLabel,
        fileName: file.name,
        size: `${fileSizeMb} MB`,
        progress: 100,
        status: "Uploaded",
      },
    }));

    if (fieldErrors[docKey]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[docKey];
        return copy;
      });
    }
  };

  const handleRemoveDocument = (docKey) => {
    setUploadedDocs((prev) => {
      const copy = { ...prev };
      delete copy[docKey];
      return copy;
    });
  };

  // Email & Phone Validation Helpers
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
  };

  const isValidPhone = (phone) => {
    const digitsOnly = (phone || "").replace(/[\s\-\(\)\+]/g, "");
    return /^\d{10,15}$/.test(digitsOnly);
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const errors = {};
    if (!formData.companyName.trim()) errors.companyName = "Company Name required.";
    if (!formData.businessType) errors.businessType = "Business Type required.";
    if (!formData.country) errors.country = "Country required.";
    if (!formData.state) errors.state = "State required.";
    if (!formData.city) errors.city = "City required.";
    if (!formData.pinCode.trim()) {
      errors.pinCode = "PIN Code required.";
    } else if (!/^\d{6}$/.test(formData.pinCode.trim())) {
      errors.pinCode = "Must be 6 digits.";
    }
    if (!formData.address.trim()) errors.address = "Full Address required.";
    if (!formData.contactPersonName.trim()) errors.contactPersonName = "Contact Name required.";

    // Strict Mobile Number Validation
    if (!formData.mobile.trim()) {
      errors.mobile = "Mobile Number required.";
    } else if (!isValidPhone(formData.mobile)) {
      errors.mobile = "Enter a valid 10 to 15 digit mobile number.";
    }

    if (formData.alternateMobile.trim() && !isValidPhone(formData.alternateMobile)) {
      errors.alternateMobile = "Enter a valid mobile number.";
    }

    // Strict Email Address Validation
    if (!formData.email.trim()) {
      errors.email = "Email Address required.";
    } else if (!isValidEmail(formData.email)) {
      errors.email = "Enter a valid email address (e.g. agency@domain.com).";
    }

    if (formData.alternateEmail.trim() && !isValidEmail(formData.alternateEmail)) {
      errors.alternateEmail = "Enter a valid email address.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 2 Validation (Statutory Documents)
  const validateStep2 = () => {
    const errors = {};
    REQUIRED_DOCUMENTS.forEach((doc) => {
      if (!uploadedDocs[doc.key]) {
        errors[doc.key] = `Upload ${doc.label}.`;
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    const errors = {};
    if (!formData.loginEmail.trim()) {
      errors.loginEmail = "Login Email is required.";
    } else if (!isValidEmail(formData.loginEmail)) {
      errors.loginEmail = "Enter a valid login email address.";
    }

    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      errors.password = "Min 6 characters required for password.";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (!formData.declarationConfirmed) {
      errors.declarationConfirmed = "Accept declaration terms.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    setGeneralError("");
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
      else setGeneralError("Please fill all required fields in Page 1 before proceeding.");
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
      else setGeneralError("Please select specializations and upload required documents before proceeding.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateStep3()) {
      setGeneralError("Please resolve validation errors in Page 3.");
      return;
    }

    setLoading(true);
    try {
      const docList = Object.keys(uploadedDocs).map((key) => ({
        name: uploadedDocs[key].name,
        fileName: uploadedDocs[key].fileName,
        size: uploadedDocs[key].size,
        type: key.includes("License") ? "License" : "Registration",
      }));

      const payload = {
        companyName: formData.companyName.trim(),
        registrationNumber: formData.registrationNumber.trim() || `REG-${Date.now().toString().slice(-5)}`,
        email: formData.loginEmail.trim() || formData.email.trim(),
        password: formData.password,
        phone: formData.mobile.trim(),
        country: formData.country,
        state: formData.state,
        city: formData.city,
        address: `${formData.address.trim()}, ${formData.area || ""}`,
        contactPersonName: formData.contactPersonName.trim(),
        contactPersonEmail: formData.email.trim(),
        contactPersonPhone: formData.mobile.trim(),
        businessType: formData.businessType,
        specialization: formData.specializations.join(", "),
        countriesServed: formData.countriesServed,
        experienceYears: formData.experienceYears || "5",
        documents: docList,
      };

      const result = await crmVendorService.registerVendor(payload);
      setSubmittedVendor(result);
      setSuccessSubmitted(true);
    } catch (err) {
      console.error("Vendor registration error:", err);
      setGeneralError(err.message || "Failed to submit vendor registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden font-sans select-none bg-slate-50">
      <AuthHeader />

      {/* 100% FULL SCREEN WIDTH CONTAINER */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-between px-4 sm:px-10 py-3 overflow-hidden bg-slate-50/60">
        <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-slate-200/90 p-4 sm:p-6 text-left relative flex flex-col justify-between overflow-y-auto lg:overflow-visible">
          
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <ImmiGoLogo size="sm" />
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                  Vendor Portal
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Vendor Recruitment Agency Registration
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Complete the 3-step verification form below. Access is enabled upon Admin verification.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/vendor/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft size={14} />
                <span>Already Registered? Sign In</span>
              </Link>
            </div>
          </div>

          {/* 3 STEP WIZARD PROGRESS HEADER */}
          <div className="grid grid-cols-3 gap-2 mb-3 bg-[#f1f5f9] p-1 rounded-xl border border-slate-200/80">
            {FORM_STEPS.map((st) => {
              const active = currentStep === st.id;
              const completed = currentStep > st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    if (st.id < currentStep) setCurrentStep(st.id);
                  }}
                  className={`flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? "bg-[#1877f2] text-white shadow-md shadow-blue-500/25 font-black"
                      : completed
                      ? "bg-blue-100 text-blue-900 font-bold"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shrink-0 ${
                    active ? "bg-white text-[#1877f2]" : completed ? "bg-blue-600 text-white" : "bg-slate-300 text-slate-700"
                  }`}>
                    {completed ? "✓" : st.id}
                  </span>
                  <div className="text-left truncate">
                    <div className="truncate font-black text-xs">{st.name}</div>
                    <div className="text-[9px] font-medium opacity-80 truncate hidden sm:block">{st.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {generalError && (
            <div className="mb-3 p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert size={15} className="text-rose-600 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Verification Notice Banner */}
          <div className="mb-3 p-2 px-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center justify-between gap-2 text-[11px] text-amber-900">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-amber-600 shrink-0" />
              <span className="font-semibold">
                Note: Upon submitting registration, your profile will enter <span className="font-extrabold text-amber-900">Pending Admin Verification</span>. Login will be enabled once Admin verifies your statutory documents.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[9px] font-bold uppercase shrink-0">
              Admin Verification Required
            </span>
          </div>

          {/* Success State */}
          {successSubmitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Registration Submitted Successfully!</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your vendor registration application <span className="font-bold text-[#1877f2]">[{submittedVendor?.id || "VND-NEW"}]</span> is now recorded.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-left max-w-lg mx-auto space-y-1.5 font-mono text-slate-800 shadow-2xs">
                <div className="flex justify-between"><span className="text-slate-500">Company / Agency Name:</span> <span className="font-bold">{formData.companyName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Registered Username/Email:</span> <span className="font-bold text-[#1877f2]">{formData.loginEmail || formData.email}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Account Status:</span> <span className="font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">Pending Admin Verification</span></div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl max-w-lg mx-auto text-xs text-blue-900 font-medium">
                🔒 You cannot sign in immediately. Admin will inspect your uploaded statutory documents (RA License, GST, PAN). You will be able to log in once your account status is updated to <b>Approved</b>.
              </div>

              <div className="pt-1">
                <Link
                  to="/vendor/login"
                  className="px-6 py-2.5 bg-[#1877f2] hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md inline-flex items-center gap-2"
                >
                  <span>Go to Vendor Login Page</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* PAGE 1: AGENCY & CONTACT PROFILE (COMPACT GRID FIT) */}
              {currentStep === 1 && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Company / Recruitment Agency Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="e.g. ABC Manpower Consultants Pvt Ltd"
                        className={`w-full px-3 py-2 bg-white border rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#1877f2] font-medium ${
                          fieldErrors.companyName ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Business Entity Type <span className="text-rose-500">*</span></label>
                      <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1877f2] bg-white text-slate-800"
                      >
                        {BUSINESS_TYPES.map((bt) => (
                          <option key={bt} value={bt}>{bt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">RA License No</label>
                      <input
                        type="text"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        placeholder="REG-IND-99421"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1877f2] bg-white text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Country</label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1877f2] bg-white text-slate-800"
                      >
                        <option value="India">India</option>
                        <option value="Nepal">Nepal</option>
                        <option value="Bangladesh">Bangladesh</option>
                        <option value="Sri Lanka">Sri Lanka</option>
                        <option value="Philippines">Philippines</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">State</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1877f2] bg-white text-slate-800"
                      >
                        {Object.keys(INDIAN_STATES_AND_CITIES).map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">City</label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1877f2] bg-white text-slate-800"
                      >
                        {(INDIAN_STATES_AND_CITIES[formData.state] || ["Mumbai"]).map((ct) => (
                          <option key={ct} value={ct}>{ct}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Full Registered Office Address <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Suite 402, Trade Link Towers, Senapati Bapat Marg, Lower Parel"
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1877f2] ${
                          fieldErrors.address ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">PIN Code <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        name="pinCode"
                        maxLength={6}
                        value={formData.pinCode}
                        onChange={handleInputChange}
                        placeholder="400013"
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1877f2] ${
                          fieldErrors.pinCode ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">Authorized Contact Person Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Contact Name <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          name="contactPersonName"
                          value={formData.contactPersonName}
                          onChange={handleInputChange}
                          placeholder="Rajesh Varma"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1877f2]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Mobile Number <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          placeholder="+91 98200 12345"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1877f2]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Official Email <span className="text-rose-500">*</span></label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="r.varma@abcmanpower.com"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1877f2]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-5 py-2.5 bg-[#1877f2] hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md inline-flex items-center gap-2 cursor-pointer"
                    >
                      <span>Next: Specializations & Documents</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* PAGE 2: MANDATORY STATUTORY DOCUMENTS UPLOAD */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <UploadCloud className="text-[#1877f2]" size={18} />
                        <span>Mandatory Statutory Documents Upload</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Upload clean copies of your agency registration, RA recruitment license, GST & ID proofs (PDF, JPG, PNG).
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                      Step 2 of 3
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                    {REQUIRED_DOCUMENTS.map((doc) => {
                      const uploaded = uploadedDocs[doc.key];
                      return (
                        <div
                          key={doc.key}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                            uploaded
                              ? "bg-emerald-50/60 border-emerald-300 shadow-2xs"
                              : "bg-slate-50/80 border-slate-200 hover:border-blue-400 hover:bg-white shadow-2xs"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                                <span>{doc.label}</span>
                                {doc.required && <span className="text-rose-500">*</span>}
                              </h4>
                              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                Official verification document
                              </p>
                            </div>

                            {uploaded ? (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                <Check size={11} /> Uploaded
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                                Required
                              </span>
                            )}
                          </div>

                          {uploaded ? (
                            <div className="flex items-center justify-between bg-white p-2.5 border border-emerald-200 rounded-xl text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <UploadCloud size={16} className="text-emerald-600 shrink-0" />
                                <span className="font-mono text-slate-800 truncate text-[11px] font-semibold">
                                  {uploaded.fileName}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveDocument(doc.key)}
                                className="text-rose-600 hover:text-rose-800 font-bold ml-2 cursor-pointer shrink-0 text-xs px-2 py-0.5 rounded-lg hover:bg-rose-50"
                              >
                                Remove ✕
                              </button>
                            </div>
                          ) : (
                            <label className="block w-full text-center py-4 bg-white border border-dashed border-slate-300 hover:border-[#1877f2] rounded-xl text-xs font-bold text-[#1877f2] cursor-pointer transition-all hover:shadow-xs group">
                              <div className="flex flex-col items-center justify-center gap-1">
                                <UploadCloud size={20} className="text-[#1877f2] group-hover:scale-110 transition-transform" />
                                <span>Click to Upload {doc.label}</span>
                                <span className="text-[10px] font-normal text-slate-400">PDF, JPG, JPEG, PNG (Max 10MB)</span>
                              </div>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileUpload(doc.key, doc.label, e.target.files[0])}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      <span>Previous</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 py-2.5 bg-[#1877f2] hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md inline-flex items-center gap-2 cursor-pointer"
                    >
                      <span>Next: Account Credentials</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* PAGE 3: CREDENTIALS & SUBMISSION */}
              {currentStep === 3 && (
                <div className="space-y-3 max-w-xl mx-auto">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Login Email Address (Username) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="loginEmail"
                      value={formData.loginEmail || formData.email}
                      onChange={handleInputChange}
                      placeholder="vendor@abcmanpower.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1877f2]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Set Password <span className="text-rose-500">*</span></label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Min 6 chars"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1877f2]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Confirm Password <span className="text-rose-500">*</span></label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Re-enter password"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1877f2]"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 mt-1">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="declarationConfirmed"
                        checked={formData.declarationConfirmed}
                        onChange={handleInputChange}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 mt-0.5 cursor-pointer shrink-0"
                      />
                      <span className="text-[11px] font-semibold text-slate-700 leading-snug">
                        I hereby declare all provided RA licenses, GST and statutory documents are authentic. I understand my account will remain <b>Pending Verification</b> until approved by Admin.
                      </span>
                    </label>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={loading}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      <span>Previous</span>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-[#1877f2] hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-lg inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? (
                        <span>Submitting Registration...</span>
                      ) : (
                        <>
                          <span>Submit Registration for Admin Verification 🚀</span>
                          <Check size={15} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-20 w-full px-6 py-2.5 text-center border-t border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-[11px] text-blue-100 font-medium shrink-0">
        <span>&copy; {new Date().getFullYear()} immiGo</span>
        <span className="mx-2 text-indigo-400/60">&bull;</span>
        <span className="font-bold text-white">Designed by White Gravity Web Solutions</span>
      </footer>
    </div>
  );
}

export default VendorRegister;
