import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";
import vendorManpowerBanner from "../../assets/vendor-manpower-banner.jpg";

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

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (generalError) setGeneralError("");
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.companyName.trim()) {
      errors.companyName = "Company Name is required";
    }

    if (!formData.contactPersonName.trim()) {
      errors.contactPersonName = "Contact Person is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Invalid email address";
    }

    if (!formData.mobile.trim()) {
      errors.mobile = "Mobile Number is required";
    } else if (!/^[0-9]{10}$/.test(formData.mobile.trim().replace(/\D/g, ""))) {
      errors.mobile = "Enter 10-digit mobile";
    }

    if (!formData.state) {
      errors.state = "Select state";
    }

    if (!formData.city.trim()) {
      errors.city = "City is required";
    }

    if (!formData.address.trim()) {
      errors.address = "Address is required";
    }

    const panClean = formData.pan.trim().toUpperCase();
    if (!panClean) {
      errors.pan = "PAN is required";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panClean)) {
      errors.pan = "Invalid PAN format";
    }

    if (formData.gstin.trim()) {
      const gstClean = formData.gstin.trim().toUpperCase();
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstClean)) {
        errors.gstin = "Invalid GSTIN format";
      }
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Min 6 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Confirm password";
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
        setFieldErrors((prev) => ({ ...prev, email: "An agency with this email already exists." }));
      } else if (msg.toLowerCase().includes("mobile") || msg.toLowerCase().includes("phone")) {
        setFieldErrors((prev) => ({ ...prev, mobile: "This mobile number is already registered." }));
      } else {
        setGeneralError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white">
      {/* LEFT HALF: Full-Screen Fit Vendor Registration Showcase */}
      <div className="hidden lg:block lg:w-1/2 h-screen relative overflow-hidden bg-white border-r border-slate-200 select-none">
        <img
          src={vendorManpowerBanner}
          alt="Partner With Us - Build Global Opportunities"
          className="w-full h-full object-fill block"
        />
      </div>

      {/* RIGHT HALF: Compact form fitting entire screen without scrolling */}
      <div className="w-full lg:w-1/2 h-screen flex flex-col justify-between px-6 sm:px-10 py-5 overflow-hidden bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
          <ImmiGoLogo size="sm" subtitle="Partner Network" />
          <Link
            to="/login"
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Already registered? Log In</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Content Container */}
        <div className="my-auto w-full max-w-xl mx-auto">
          {successSubmitted ? (
            /* Success Card */
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                <CheckCircle2 size={30} />
              </div>

              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Registration Submitted
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  Application Received
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Thank you, <strong className="text-slate-900">{submittedVendor?.companyName || formData.companyName}</strong>. Your agency profile has been submitted for review. Upon verification, your portal access link will be sent to <strong className="text-slate-900">{formData.email}</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-700 max-w-md mx-auto space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                  <ShieldCheck size={14} className="text-blue-600" />
                  <span>Next Steps</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Our administrative team will review your agency credentials. Passwords are never sent via email for security. You will use your portal link to log in and upload compliance documents.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  <span>Go to Login</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ) : (
            /* Form Area */
            <div className="space-y-3.5">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Building2 size={18} className="text-blue-600" />
                  <span>Vendor / Agency Registration</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your agency details. Compliance documents will be submitted after admin verification.
                </p>
              </div>

              {generalError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
                  {/* Agency Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Agency / Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="e.g. Apex Global Overseas Pvt Ltd"
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        fieldErrors.companyName ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                      } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
                    />
                    {fieldErrors.companyName && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.companyName}</p>
                    )}
                  </div>

                  {/* Contact Person Name */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Contact Person Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactPersonName"
                      value={formData.contactPersonName}
                      onChange={handleInputChange}
                      placeholder="e.g. Rajesh Sharma"
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        fieldErrors.contactPersonName ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                      } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
                    />
                    {fieldErrors.contactPersonName && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.contactPersonName}</p>
                    )}
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-medium">
                        +91
                      </span>
                      <input
                        type="tel"
                        name="mobile"
                        maxLength={10}
                        value={formData.mobile}
                        onChange={handleInputChange}
                        placeholder="9876543210"
                        className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border transition-all ${
                          fieldErrors.mobile ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                        } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
                      />
                    </div>
                    {fieldErrors.mobile && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.mobile}</p>
                    )}
                  </div>

                  {/* Official Email */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Official Email (Login ID) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="contact@agency.com"
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        fieldErrors.email ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                      } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
                    />
                    {fieldErrors.email && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.email}</p>
                    )}
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-2.5 py-1.5 text-xs rounded-lg border transition-all bg-white cursor-pointer ${
                        fieldErrors.state ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                      } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.state && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.state}</p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Mumbai"
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        fieldErrors.city ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                      } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
                    />
                    {fieldErrors.city && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.city}</p>
                    )}
                  </div>

                  {/* PAN */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
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
                      className={`w-full px-3 py-1.5 text-xs font-mono uppercase rounded-lg border transition-all ${
                        fieldErrors.pan ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                      } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
                    />
                    {fieldErrors.pan && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.pan}</p>
                    )}
                  </div>

                  {/* GSTIN */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      GSTIN <span className="text-slate-400 font-normal">(Optional)</span>
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
                      className={`w-full px-3 py-1.5 text-xs font-mono uppercase rounded-lg border transition-all ${
                        fieldErrors.gstin ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                      } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
                    />
                    {fieldErrors.gstin && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.gstin}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Office Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Office No, Street, Commercial Area"
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        fieldErrors.address ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                      } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
                    />
                    {fieldErrors.address && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.address}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Min 6 characters"
                        className={`w-full px-3 py-1.5 pr-8 text-xs rounded-lg border transition-all ${
                          fieldErrors.password ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                        } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Re-enter password"
                        className={`w-full px-3 py-1.5 pr-8 text-xs rounded-lg border transition-all ${
                          fieldErrors.confirmPassword ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                        } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((p) => !p)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Submitting Registration...</span>
                    ) : (
                      <>
                        <span>Submit Agency Registration</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>&copy; {new Date().getFullYear()} ImmiGo CRM &bull; Designed by White Gravity Web Solutions</span>
          <span className="flex items-center gap-1 text-slate-500">
            <ShieldCheck size={12} className="text-emerald-600" />
            <span>SSL Secured</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default VendorRegister;
