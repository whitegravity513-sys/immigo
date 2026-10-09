import React, { useState, useRef } from "react";
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
  AlertCircle,
  X,
  FileText,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";
import AuthHeader from "../../components/auth/AuthHeader.jsx";
import heroTravelerBg from "../../assets/immigo-hero-traveler-bg.jpg";
import globePinIllustration from "../../assets/immigo-globe-pin.jpg";

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

// Registration no longer requires documents initially.

export function VendorRegister() {

  const [formData, setFormData] = useState({
    companyName: "",
    businessType: "Private Limited",
    registrationNumber: "",
    establishmentYear: "",
    gstin: "",
    pan: "",
    website: "",

    country: "India",
    state: "",
    city: "",
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
    otherSpecialization: "",
    countriesServed: ["UAE", "Saudi Arabia"],
    otherCountryServed: "",
    experienceYears: "5",
    availableCandidates: "",
    monthlyCapacity: "",

    loginEmail: "",
    password: "",
    confirmPassword: "",

    declarationConfirmed: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [successSubmitted, setSuccessSubmitted] = useState(false);
  const [submittedVendor, setSubmittedVendor] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === "checkbox" ? checked : value;

    if (name === "email") {
      setFormData((prev) => ({
        ...prev,
        email: newVal,
        loginEmail: prev.loginEmail === prev.email || !prev.loginEmail ? newVal : prev.loginEmail,
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


  // Email & Phone Validation Helpers
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email || "").trim());
  };

  const isValidPhone = (phone) => {
    const digitsOnly = (phone || "").replace(/[\s\-\(\)\+]/g, "");
    return /^\d{7,15}$/.test(digitsOnly);
  };

  const validateForm = () => {
    const errors = {};
    
    // Step 1
    if (!formData.companyName.trim()) errors.companyName = "Company Name required.";
    if (!formData.businessType) errors.businessType = "Business Type required.";
    if (!formData.country) errors.country = "Country required.";
    if (!formData.state) errors.state = "State required.";
    if (!formData.city) errors.city = "City required.";
    if (!formData.pinCode.trim()) {
      errors.pinCode = "PIN Code required.";
    } else if (!/^\d{4,10}$/.test(formData.pinCode.trim())) {
      errors.pinCode = "Enter a valid PIN / Postal Code (4–10 digits).";
    }
    if (!formData.address.trim()) errors.address = "Full Address required.";
    if (!formData.contactPersonName.trim()) errors.contactPersonName = "Contact Name required.";

    if (!formData.mobile.trim()) {
      errors.mobile = "Mobile Number required.";
    } else if (!isValidPhone(formData.mobile)) {
      errors.mobile = "Enter a valid 7 to 15 digit mobile number (digits only).";
    }

    if (formData.alternateMobile.trim() && !isValidPhone(formData.alternateMobile)) {
      errors.alternateMobile = "Enter a valid mobile number.";
    }

    if (!formData.email.trim()) {
      errors.email = "Email Address required.";
    } else if (!isValidEmail(formData.email)) {
      errors.email = "Enter a valid email address (e.g. agency@domain.com).";
    }

    if (formData.alternateEmail.trim() && !isValidEmail(formData.alternateEmail)) {
      errors.alternateEmail = "Enter a valid email address.";
    }



    // Step 3
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) {
      setGeneralError("Please resolve validation errors before submitting.");
      return;
    }

    setLoading(true);
    try {


      const payload = {
        companyName: formData.companyName.trim(),
        registrationNumber: formData.registrationNumber.trim() || `REG-${Date.now().toString().slice(-5)}`,
        email: formData.loginEmail.trim() || formData.email.trim(),
        password: formData.password,
        phone: formData.mobile.trim(),
        country: formData.country,
        state: formData.state,
        city: formData.city,
        address: `${formData.address.trim()}${formData.area ? ", " + formData.area : ""}`,
        contactPersonName: formData.contactPersonName.trim(),
        contactPersonEmail: formData.email.trim(),
        contactPersonPhone: formData.mobile.trim(),
        businessType: formData.businessType,
        specialization: formData.specializations.map(s => s === "Other" && formData.otherSpecialization.trim() ? formData.otherSpecialization.trim() : s).join(", "),
        countriesServed: formData.countriesServed.map(c => c === "Other" && formData.otherCountryServed.trim() ? formData.otherCountryServed.trim() : c),
        experienceYears: formData.experienceYears || "5",
        gstin: formData.gstin.trim(),
        pan: formData.pan.trim(),
        documents: [],
        // Registration status must be "Pending" for admin verification
        status: "Pending",
      };

      const result = await crmVendorService.registerVendor(payload);
      setSubmittedVendor(result);
      setSuccessSubmitted(true);
    } catch (err) {
      console.error("Vendor registration error:", err);
      setGeneralError(err.message || "Failed to submit vendor registration. Please try again.");
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
                Complete the 2-step verification form below. Access is enabled upon Admin verification.
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
            <div className="text-center py-8 px-4 sm:px-6 space-y-5">
              <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={36} className="stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Registration Submitted Successfully!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  Your vendor registration application{" "}
                  <span className="font-bold text-[#1877f2] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {submittedVendor?.id || "VND-NEW"}
                  </span>{" "}
                  is now under admin review.
                </p>
              </div>

              <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-left max-w-lg mx-auto space-y-2.5 font-sans text-slate-800 shadow-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Company / Agency Name:</span>
                  <span className="font-bold text-slate-900">{formData.companyName}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Registered Login Email:</span>
                  <span className="font-bold text-[#1877f2]">{formData.loginEmail || formData.email}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 font-medium">Account Status:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Pending Admin Verification
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl max-w-lg mx-auto text-xs text-blue-900 font-medium leading-relaxed">
                🔒 You cannot sign in immediately. Admin will inspect your registration and verify your details. Once approved, you will receive login confirmation via email to access your dashboard and upload required compliance documents.
              </div>

              <div className="pt-2">
                <Link
                  to="/vendor/login"
                  className="px-6 py-2.5 bg-[#1877f2] hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <span>Go to Vendor Login Page</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* PAGE 1: AGENCY & CONTACT PROFILE */}
              <div className="space-y-2.5 bg-white p-4 rounded-xl border border-slate-200">
                <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 mb-3">1. Agency Details</h3>
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
                      {fieldErrors.companyName && <p className="text-rose-600 text-[10px] mt-0.5 flex items-center gap-1"><AlertCircle size={10}/>{fieldErrors.companyName}</p>}
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
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Est. Year</label>
                      <input
                        type="text"
                        name="establishmentYear"
                        value={formData.establishmentYear}
                        onChange={handleInputChange}
                        placeholder="2010"
                        maxLength={4}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1877f2] bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">GSTIN</label>
                      <input
                        type="text"
                        name="gstin"
                        value={formData.gstin}
                        onChange={handleInputChange}
                        placeholder="27AABCA1234C1Z1"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1877f2] bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">PAN Number</label>
                      <input
                        type="text"
                        name="pan"
                        value={formData.pan}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
                          setFormData((prev) => ({ ...prev, pan: val }));
                        }}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase font-medium focus:outline-none focus:border-[#1877f2] bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Country <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="e.g. India"
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1877f2] bg-white text-slate-800 ${
                          fieldErrors.country ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                        }`}
                      />
                      {fieldErrors.country && <p className="text-rose-600 text-[10px] mt-0.5 flex items-center gap-1"><AlertCircle size={10}/>{fieldErrors.country}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">State <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="e.g. Maharashtra"
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1877f2] bg-white text-slate-800 ${
                          fieldErrors.state ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                        }`}
                      />
                      {fieldErrors.state && <p className="text-rose-600 text-[10px] mt-0.5 flex items-center gap-1"><AlertCircle size={10}/>{fieldErrors.state}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">City <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="e.g. Mumbai"
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1877f2] bg-white text-slate-800 ${
                          fieldErrors.city ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                        }`}
                      />
                      {fieldErrors.city && <p className="text-rose-600 text-[10px] mt-0.5 flex items-center gap-1"><AlertCircle size={10}/>{fieldErrors.city}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">PIN Code <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        name="pinCode"
                        maxLength={10}
                        value={formData.pinCode}
                        onChange={handleInputChange}
                        placeholder="400013"
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1877f2] ${
                          fieldErrors.pinCode ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                        }`}
                      />
                      {fieldErrors.pinCode && <p className="text-rose-600 text-[10px] mt-0.5 flex items-center gap-1"><AlertCircle size={10}/>{fieldErrors.pinCode}</p>}
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
                      {fieldErrors.address && <p className="text-rose-600 text-[10px] mt-0.5 flex items-center gap-1"><AlertCircle size={10}/>{fieldErrors.address}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Area / Locality</label>
                      <input
                        type="text"
                        name="area"
                        value={formData.area}
                        onChange={handleInputChange}
                        placeholder="Lower Parel"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1877f2]"
                      />
                    </div>
                  </div>

                  {/* Contact Person */}
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
                          className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1877f2] ${
                            fieldErrors.contactPersonName ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                          }`}
                        />
                        {fieldErrors.contactPersonName && <p className="text-rose-600 text-[10px] mt-0.5 flex items-center gap-1"><AlertCircle size={10}/>{fieldErrors.contactPersonName}</p>}
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Mobile Number <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          placeholder="+91 98200 12345"
                          className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1877f2] ${
                            fieldErrors.mobile ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                          }`}
                        />
                        {fieldErrors.mobile && <p className="text-rose-600 text-[10px] mt-0.5 flex items-center gap-1"><AlertCircle size={10}/>{fieldErrors.mobile}</p>}
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Official Email <span className="text-rose-500">*</span></label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="r.varma@abcmanpower.com"
                          className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1877f2] ${
                            fieldErrors.email ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                          }`}
                        />
                        {fieldErrors.email && <p className="text-rose-600 text-[10px] mt-0.5 flex items-center gap-1"><AlertCircle size={10}/>{fieldErrors.email}</p>}
                      </div>
                    </div>
                  </div>

                </div>

              {/* PAGE 2: SPECIALIZATIONS */}
              <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200">
                <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                  <UploadCloud className="text-[#1877f2]" size={16} />
                  2. Specializations
                </h3>

                  {/* Specializations */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Trade Specializations <span className="text-slate-400">(select all that apply)</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {SPECIALIZATION_OPTIONS.map((sp) => (
                        <button
                          key={sp}
                          type="button"
                          onClick={() => toggleSpecialization(sp)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                            formData.specializations.includes(sp)
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400"
                          }`}
                        >
                          {sp}
                        </button>
                      ))}
                    </div>
                    {formData.specializations.includes("Other") && (
                      <div className="mt-2">
                        <input
                          type="text"
                          name="otherSpecialization"
                          value={formData.otherSpecialization}
                          onChange={handleInputChange}
                          placeholder="Please specify your specialization..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-[#1877f2]"
                        />
                      </div>
                    )}
                  </div>





                </div>

              {/* PAGE 2: CREDENTIALS & SUBMISSION */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                  <Lock className="text-[#1877f2]" size={16} />
                  2. Login Credentials
                </h3>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Login Email Address (Username) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="loginEmail"
                      value={formData.loginEmail}
                      onChange={handleInputChange}
                      placeholder="vendor@abcmanpower.com"
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1877f2] ${
                        fieldErrors.loginEmail ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                      }`}
                    />
                    {fieldErrors.loginEmail && <p className="text-rose-600 text-[10px] mt-0.5 flex items-center gap-1"><AlertCircle size={10}/>{fieldErrors.loginEmail}</p>}
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
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1877f2] ${
                          fieldErrors.password ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                        }`}
                      />
                      {fieldErrors.password && <p className="text-rose-600 text-[10px] mt-0.5 flex items-center gap-1"><AlertCircle size={10}/>{fieldErrors.password}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Confirm Password <span className="text-rose-500">*</span></label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Re-enter password"
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1877f2] ${
                          fieldErrors.confirmPassword ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                        }`}
                      />
                      {fieldErrors.confirmPassword && <p className="text-rose-600 text-[10px] mt-0.5 flex items-center gap-1"><AlertCircle size={10}/>{fieldErrors.confirmPassword}</p>}
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
                        I hereby declare all provided documents (PAN Card, and optionally GST/Registration Certificate) are authentic and correct. I understand my account will remain <b>Pending Verification</b> until approved by Admin.
                      </span>
                    </label>
                    {fieldErrors.declarationConfirmed && <p className="text-rose-600 text-[10px] flex items-center gap-1"><AlertCircle size={10}/>{fieldErrors.declarationConfirmed}</p>}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-[#1877f2] hover:bg-blue-700 text-white font-black rounded-xl text-sm shadow-lg inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? (
                        <span>Submitting Registration...</span>
                      ) : (
                        <>
                          <span>Submit Registration</span>
                          <Check size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
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
