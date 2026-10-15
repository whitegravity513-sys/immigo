import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Other",
];

export function VendorRegister() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactPersonName: "",
    email: "",
    mobile: "",
    state: "",
    city: "",
    address: "",
    pan: "",
    gstin: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [successSubmitted, setSuccessSubmitted] = useState(false);
  const [submittedVendor, setSubmittedVendor] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (generalError) setGeneralError("");
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.companyName.trim()) {
      errors.companyName = "Agency / Company Name is required";
    }

    if (!formData.contactPersonName.trim()) {
      errors.contactPersonName = "Contact Person Name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Official Email Address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.mobile.trim()) {
      errors.mobile = "Mobile Number is required";
    } else if (!/^[0-9]{10}$/.test(formData.mobile.trim().replace(/\D/g, ""))) {
      errors.mobile = "Please enter a valid 10-digit mobile number";
    }

    if (!formData.state) {
      errors.state = "State is required";
    }

    if (!formData.city.trim()) {
      errors.city = "City is required";
    }

    if (!formData.address.trim()) {
      errors.address = "Office Address is required";
    }

    const panClean = formData.pan.trim().toUpperCase();
    if (!panClean) {
      errors.pan = "PAN Number is required";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panClean)) {
      errors.pan = "Invalid PAN format (e.g. ABCDE1234F)";
    }

    if (formData.gstin.trim()) {
      const gstClean = formData.gstin.trim().toUpperCase();
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstClean)) {
        errors.gstin = "Invalid GSTIN format (15 characters)";
      }
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        companyName: formData.companyName.trim(),
        contactPersonName: formData.contactPersonName.trim(),
        email: formData.email.trim().toLowerCase(),
        loginEmail: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        state: formData.state,
        city: formData.city.trim(),
        address: formData.address.trim(),
        pan: formData.pan.trim().toUpperCase(),
        gstin: formData.gstin.trim().toUpperCase() || undefined,
        password: formData.password,
        status: "Registration Pending",
      };

      const res = await crmVendorService.register(payload);
      setSubmittedVendor(res.vendor || payload);
      setSuccessSubmitted(true);
    } catch (err) {
      console.error("Vendor registration failed:", err);
      const msg = err.response?.data?.message || err.message || "Registration failed. Please check inputs.";
      if (msg.toLowerCase().includes("email")) {
        setFieldErrors((prev) => ({ ...prev, email: "An agency with this email is already registered." }));
      } else if (msg.toLowerCase().includes("mobile") || msg.toLowerCase().includes("phone")) {
        setFieldErrors((prev) => ({ ...prev, mobile: "This mobile number is already registered." }));
      } else {
        setGeneralError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (successSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-lg border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 size={28} />
          </div>

          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 mb-1.5">
              Registration Pending Review
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Application Submitted!
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Thank you, <strong className="text-slate-900">{submittedVendor?.companyName || formData.companyName}</strong>. Your agency application has been submitted to our administrative team.
            </p>
          </div>

          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 text-left space-y-1 text-xs text-slate-600">
            <p className="font-bold text-blue-900 flex items-center gap-1 text-[11px]">
              <ShieldCheck size={13} className="text-blue-600" />
              <span>Next Steps</span>
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>Admin reviews agency details and approves account.</li>
              <li>Login email will be dispatched to <span className="font-semibold text-slate-900">{formData.email}</span>.</li>
              <li>Post-login: Upload compliance documents and sign MOU.</li>
            </ul>
          </div>

          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <span>Go to Login</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen max-w-full bg-white flex flex-col overflow-hidden">
      {generalError && (
        <div className="p-3 mx-6 mt-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs shrink-0">
          <AlertCircle size={16} className="shrink-0" />
          <div className="flex-1 font-medium">{generalError}</div>
        </div>
      )}

      {/* Top Header Banner - Full Width Edge to Edge */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 px-6 sm:px-10 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-sm border-b border-blue-950/40">
        <div className="flex items-center gap-4">
          <ImmiGoLogo size="sm" subtitle="Partner Network" />
          <div className="h-7 w-px bg-white/20 hidden sm:block" />
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 leading-tight">
              <Building2 size={18} className="text-blue-400" />
              <span>Agency / Vendor Registration</span>
            </h2>
            <p className="text-xs text-blue-200/90 mt-0.5">
              Initial application. Compliance documents & MOU collected post-approval.
            </p>
          </div>
        </div>

        <Link
          to="/login"
          className="text-xs text-blue-100 hover:text-white font-medium flex items-center gap-1.5 self-start sm:self-auto bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition-colors border border-white/10"
        >
          <span>Already registered? Log In</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Form Area - Full Height Screen Utilization */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between px-6 sm:px-10 py-6 sm:py-8 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 my-auto w-full">
            {/* Agency Name */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Agency / Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="e.g. Apex Global Overseas Manpower Pvt Ltd"
                className={`w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border transition-all ${
                  fieldErrors.companyName ? "border-rose-400 bg-rose-50/30" : "border-slate-300 hover:border-slate-400"
                } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none`}
              />
              {fieldErrors.companyName && (
                <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.companyName}</p>
              )}
            </div>

            {/* Contact Person Name */}
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Contact Person <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="contactPersonName"
                value={formData.contactPersonName}
                onChange={handleInputChange}
                placeholder="e.g. Rajesh Sharma"
                className={`w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border transition-all ${
                  fieldErrors.contactPersonName ? "border-rose-400 bg-rose-50/30" : "border-slate-300 hover:border-slate-400"
                } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none`}
              />
              {fieldErrors.contactPersonName && (
                <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.contactPersonName}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 sm:top-3 text-sm font-semibold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  name="mobile"
                  maxLength={10}
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="9876543210"
                  className={`w-full pl-12 pr-4 py-2.5 sm:py-3 text-sm rounded-xl border transition-all ${
                    fieldErrors.mobile ? "border-rose-400 bg-rose-50/30" : "border-slate-300 hover:border-slate-400"
                  } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none`}
                />
              </div>
              {fieldErrors.mobile && (
                <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.mobile}</p>
              )}
            </div>

            {/* Official Email */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Official Email (Portal Login ID) <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contact@agencydomain.com"
                className={`w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border transition-all ${
                  fieldErrors.email ? "border-rose-400 bg-rose-50/30" : "border-slate-300 hover:border-slate-400"
                } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none`}
              />
              {fieldErrors.email && (
                <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* State */}
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                State <span className="text-rose-500">*</span>
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className={`w-full px-3.5 py-2.5 sm:py-3 text-sm rounded-xl border transition-all bg-white ${
                  fieldErrors.state ? "border-rose-400 bg-rose-50/30" : "border-slate-300 hover:border-slate-400"
                } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none`}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {fieldErrors.state && (
                <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.state}</p>
              )}
            </div>

            {/* City */}
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="e.g. Mumbai"
                className={`w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border transition-all ${
                  fieldErrors.city ? "border-rose-400 bg-rose-50/30" : "border-slate-300 hover:border-slate-400"
                } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none`}
              />
              {fieldErrors.city && (
                <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.city}</p>
              )}
            </div>

            {/* PAN */}
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                PAN Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="pan"
                maxLength={10}
                value={formData.pan}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  handleInputChange(e);
                }}
                placeholder="ABCDE1234F"
                className={`w-full px-4 py-2.5 sm:py-3 text-sm font-mono uppercase rounded-xl border transition-all ${
                  fieldErrors.pan ? "border-rose-400 bg-rose-50/30" : "border-slate-300 hover:border-slate-400"
                } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none`}
              />
              {fieldErrors.pan && (
                <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.pan}</p>
              )}
            </div>

            {/* GSTIN */}
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                GSTIN <span className="text-slate-400 font-normal text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                name="gstin"
                maxLength={15}
                value={formData.gstin}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  handleInputChange(e);
                }}
                placeholder="27ABCDE1234F1Z5"
                className={`w-full px-4 py-2.5 sm:py-3 text-sm font-mono uppercase rounded-xl border transition-all ${
                  fieldErrors.gstin ? "border-rose-400 bg-rose-50/30" : "border-slate-300 hover:border-slate-400"
                } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none`}
              />
              {fieldErrors.gstin && (
                <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.gstin}</p>
              )}
            </div>

            {/* Office Address */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Office Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Office/Building No, Street, Commercial Area"
                className={`w-full px-4 py-2.5 sm:py-3 text-sm rounded-xl border transition-all ${
                  fieldErrors.address ? "border-rose-400 bg-rose-50/30" : "border-slate-300 hover:border-slate-400"
                } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none`}
              />
              {fieldErrors.address && (
                <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.address}</p>
              )}
            </div>

            {/* Password */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Create Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Minimum 6 characters"
                  className={`w-full px-4 py-2.5 sm:py-3 pr-10 text-sm rounded-xl border transition-all ${
                    fieldErrors.password ? "border-rose-400 bg-rose-50/30" : "border-slate-300 hover:border-slate-400"
                  } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter password"
                  className={`w-full px-4 py-2.5 sm:py-3 pr-10 text-sm rounded-xl border transition-all ${
                    fieldErrors.confirmPassword ? "border-rose-400 bg-rose-50/30" : "border-slate-300 hover:border-slate-400"
                  } focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>Full compliance & credentials check will be completed within 24-48 hours.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              {loading ? (
                <span>Submitting Application...</span>
              ) : (
                <>
                  <span>Submit Agency Registration</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
  );
}

export default VendorRegister;
