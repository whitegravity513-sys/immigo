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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-xl border border-gray-100 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 mb-2">
              Status: Registration Pending
            </span>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Registration Submitted!
            </h2>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Thank you, <strong className="text-gray-900">{submittedVendor?.companyName || formData.companyName}</strong>. Your recruiting agency application has been successfully submitted and is currently pending review by our administrative team.
            </p>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-left space-y-2 text-xs">
            <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-blue-600" />
              <span>What happens next?</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 leading-normal">
              <li>Our administration reviews agency details and credentials.</li>
              <li>Upon approval, an email with login instructions will be sent to <span className="font-semibold text-gray-900">{formData.email}</span>.</li>
              <li>You will log in to upload required compliance documents and complete MOU signing.</li>
              <li>Operational candidate sourcing will unlock after final verification.</li>
            </ol>
          </div>

          <div className="pt-2">
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/25 transition-all cursor-pointer"
            >
              <span>Go to Login Page</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <ImmiGoLogo size="md" subtitle="Partner Network" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Agency / Vendor Registration
          </h1>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Join our authorized overseas recruitment network. Complete this simple initial registration to initiate vendor verification.
          </p>
        </div>

        {/* General Error Alert */}
        {generalError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{generalError}</div>
          </div>
        )}

        {/* Registration Card */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 px-6 py-4 text-white">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Building2 size={16} className="text-blue-400" />
              <span>Recruiting Agent (RA) Initial Application</span>
            </h2>
            <p className="text-[11px] text-blue-200 mt-0.5">
              Only primary corporate credentials required. Documents & MOU will be collected post-approval.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Section 1: Agency & Contact Person */}
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <Building2 size={14} className="text-blue-600" />
                <span>Agency & Contact Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Agency Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Agency / Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="e.g. Apex Global Overseas Manpower Pvt Ltd"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border ${
                      fieldErrors.companyName ? "border-rose-400 bg-rose-50/30" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  />
                  {fieldErrors.companyName && (
                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.companyName}</p>
                  )}
                </div>

                {/* Contact Person Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Contact Person Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactPersonName"
                    value={formData.contactPersonName}
                    onChange={handleInputChange}
                    placeholder="e.g. Rajesh Sharma"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border ${
                      fieldErrors.contactPersonName ? "border-rose-400 bg-rose-50/30" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  />
                  {fieldErrors.contactPersonName && (
                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.contactPersonName}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-gray-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      name="mobile"
                      maxLength={10}
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      className={`w-full pl-12 pr-3.5 py-2.5 text-xs rounded-xl border ${
                        fieldErrors.mobile ? "border-rose-400 bg-rose-50/30" : "border-gray-300"
                      } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                    />
                  </div>
                  {fieldErrors.mobile && (
                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.mobile}</p>
                  )}
                </div>

                {/* Official Email Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Official Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contact@agencydomain.com"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border ${
                      fieldErrors.email ? "border-rose-400 bg-rose-50/30" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  />
                  {fieldErrors.email && (
                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.email}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    This email will serve as your primary communication and portal login ID.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Location & Address */}
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <MapPin size={14} className="text-blue-600" />
                <span>Office Location</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* State */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border ${
                      fieldErrors.state ? "border-rose-400 bg-rose-50/30" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
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
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Mumbai"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border ${
                      fieldErrors.city ? "border-rose-400 bg-rose-50/30" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  />
                  {fieldErrors.city && (
                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.city}</p>
                  )}
                </div>

                {/* Office Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Office Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Office/Building No, Street, Commercial Area..."
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border ${
                      fieldErrors.address ? "border-rose-400 bg-rose-50/30" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  />
                  {fieldErrors.address && (
                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.address}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Tax Identification */}
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <CreditCard size={14} className="text-blue-600" />
                <span>Statutory Credentials</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PAN Number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                    className={`w-full px-3.5 py-2.5 text-xs font-mono uppercase rounded-xl border ${
                      fieldErrors.pan ? "border-rose-400 bg-rose-50/30" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  />
                  {fieldErrors.pan && (
                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.pan}</p>
                  )}
                </div>

                {/* GSTIN (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    GSTIN <span className="text-gray-400 text-[11px] font-normal">(Optional)</span>
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
                    className={`w-full px-3.5 py-2.5 text-xs font-mono uppercase rounded-xl border ${
                      fieldErrors.gstin ? "border-rose-400 bg-rose-50/30" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  />
                  {fieldErrors.gstin && (
                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.gstin}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Portal Security */}
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-gray-100">
                <Lock size={14} className="text-blue-600" />
                <span>Account Credentials</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Create Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Minimum 6 characters"
                      className={`w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border ${
                        fieldErrors.password ? "border-rose-400 bg-rose-50/30" : "border-gray-300"
                      } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter password"
                      className={`w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border ${
                        fieldErrors.confirmPassword ? "border-rose-400 bg-rose-50/30" : "border-gray-300"
                      } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button & Switch Link */}
            <div className="pt-2 space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/25 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
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

              <div className="text-center text-xs text-gray-500">
                Already registered or approved?{" "}
                <Link to="/login" className="text-blue-600 hover:underline font-bold">
                  Log in here
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VendorRegister;
