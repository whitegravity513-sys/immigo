import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  HardHat,
  Sparkles,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";
import vendorConstructionManpower from "../../assets/vendor-construction-manpower.jpg";

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

  // 3D Flip entrance animation state for the side card
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDone(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

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
      errors.pan = "Invalid PAN (e.g. ABCDE1234F)";
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
    <div className="h-screen max-h-screen w-full relative flex flex-col justify-between overflow-hidden font-sans select-none">
      <style>{`
        @keyframes vendorSideFlipEntrance {
          0% {
            opacity: 0;
            transform: perspective(1400px) rotateY(-85deg) scale(0.88) translateX(60px);
          }
          50% {
            opacity: 0.85;
            transform: perspective(1400px) rotateY(-25deg) scale(0.96) translateX(15px);
          }
          75% {
            opacity: 1;
            transform: perspective(1400px) rotateY(8deg) scale(1.01) translateX(0);
          }
          90% {
            transform: perspective(1400px) rotateY(-3deg) scale(0.997);
          }
          100% {
            opacity: 1;
            transform: perspective(1400px) rotateY(0deg) scale(1) translateX(0);
          }
        }
        .animate-vendor-side-flip {
          animation: vendorSideFlipEntrance 1.4s cubic-bezier(0.2, 0.85, 0.35, 1) forwards;
          transform-style: preserve-3d;
          backface-visibility: hidden;
          transform-origin: right center;
        }
      `}</style>

      {/* 100% Crystal-Clear Background Photo with Zero Color Tint Overlays */}
      <div className="fixed inset-0 z-0 overflow-hidden select-none pointer-events-none">
        <img
          src={vendorConstructionManpower}
          alt="Vendor Construction Manpower Recruitment"
          className="w-full h-full object-cover object-center scale-100"
        />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-20 w-full px-5 sm:px-10 py-2.5 flex items-center justify-between border-b border-white/20 bg-slate-900/75 backdrop-blur-md shrink-0 text-white shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/" className="inline-block">
            <ImmiGoLogo size="sm" theme="light" subtitle="Partner Network" />
          </Link>
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/25 border border-blue-400/40 text-blue-200 text-[11px] font-semibold">
            <HardHat size={12} className="text-amber-400" />
            <span>Manpower Supply & Construction Partner Portal</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/vendor/login"
            className="text-xs text-blue-300 hover:text-white font-semibold hidden sm:inline transition-colors"
          >
            Sign In Instead
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 shadow-2xs transition-all cursor-pointer"
            title="Return to Main Website"
          >
            <ArrowLeft size={13} className="text-blue-300" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Container - Card positioned on the SIDE with 3D Flip entrance */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-end px-4 sm:px-8 lg:px-12 xl:px-16 py-2 min-h-0 overflow-hidden">
        <div
          className={`w-full max-w-lg lg:max-w-xl bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/90 p-4 sm:p-5 max-h-[calc(100vh-75px)] overflow-y-auto ${
            !animationDone ? "animate-vendor-side-flip" : ""
          }`}
          style={animationDone ? { transform: "none" } : undefined}
        >
          {successSubmitted ? (
            <div className="text-center py-5 space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                <CheckCircle2 size={26} />
              </div>

              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Registration Submitted
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  Application Received
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Thank you, <strong className="text-slate-900">{submittedVendor?.companyName || formData.companyName}</strong>. Your agency profile has been submitted for review. Upon verification, your portal access link will be sent to <strong className="text-slate-900">{formData.email}</strong>.
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-700 max-w-md mx-auto space-y-1">
                <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-[11px]">
                  <ShieldCheck size={13} className="text-blue-600" />
                  <span>Next Steps</span>
                </div>
                <p className="text-[10px] text-slate-600">
                  Our administrative team will review your agency credentials. Passwords are never sent via email for security. You will use your portal link to log in and upload compliance documents.
                </p>
              </div>

              <div className="pt-1">
                <Link
                  to="/vendor/login"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
                >
                  <span>Go to Login</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Building2 size={16} />
                    </div>
                    <span>Vendor / Agency Registration</span>
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Register your agency to supply certified manpower across foreign borders.
                  </p>
                </div>
                <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                  <Sparkles size={11} className="text-blue-600" />
                  <span>Verified Network</span>
                </div>
              </div>

              {generalError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Agency / Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="e.g. Apex Global Overseas Pvt Ltd"
                      className={`w-full px-2.5 py-1 text-xs rounded-lg border transition-all ${
                        fieldErrors.companyName ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                      } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white`}
                    />
                    {fieldErrors.companyName && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.companyName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Contact Person Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactPersonName"
                      value={formData.contactPersonName}
                      onChange={handleInputChange}
                      placeholder="e.g. Rajesh Sharma"
                      className={`w-full px-2.5 py-1 text-xs rounded-lg border transition-all ${
                        fieldErrors.contactPersonName ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                      } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white`}
                    />
                    {fieldErrors.contactPersonName && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.contactPersonName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1 text-xs text-slate-400 font-medium">
                        +91
                      </span>
                      <input
                        type="tel"
                        name="mobile"
                        maxLength={10}
                        value={formData.mobile}
                        onChange={handleInputChange}
                        placeholder="9876543210"
                        className={`w-full pl-9 pr-2.5 py-1 text-xs rounded-lg border transition-all ${
                          fieldErrors.mobile ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                        } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white`}
                      />
                    </div>
                    {fieldErrors.mobile && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.mobile}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Official Email (Login ID) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="contact@agency.com"
                      className={`w-full px-2.5 py-1 text-xs rounded-lg border transition-all ${
                        fieldErrors.email ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                      } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white`}
                    />
                    {fieldErrors.email && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-2 py-1 text-xs rounded-lg border transition-all bg-white cursor-pointer ${
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

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Mumbai"
                      className={`w-full px-2.5 py-1 text-xs rounded-lg border transition-all ${
                        fieldErrors.city ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                      } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white`}
                    />
                    {fieldErrors.city && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
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
                      className={`w-full px-2.5 py-1 text-xs font-mono uppercase rounded-lg border transition-all ${
                        fieldErrors.pan ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                      } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white`}
                    />
                    {fieldErrors.pan && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.pan}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
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
                      className={`w-full px-2.5 py-1 text-xs font-mono uppercase rounded-lg border transition-all ${
                        fieldErrors.gstin ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                      } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white`}
                    />
                    {fieldErrors.gstin && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.gstin}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Office Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Office No, Street, Commercial Area"
                      className={`w-full px-2.5 py-1 text-xs rounded-lg border transition-all ${
                        fieldErrors.address ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                      } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white`}
                    />
                    {fieldErrors.address && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.address}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Min 6 characters"
                        className={`w-full px-2.5 py-1 pr-7 text-xs rounded-lg border transition-all ${
                          fieldErrors.password ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                        } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Re-enter password"
                        className={`w-full px-2.5 py-1 pr-7 text-xs rounded-lg border transition-all ${
                          fieldErrors.confirmPassword ? "border-rose-400 bg-rose-50/20" : "border-slate-300 hover:border-slate-400"
                        } focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((p) => !p)}
                        className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-[10px] text-rose-500 mt-0.5">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div className="pt-1.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
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

                <div className="pt-2 border-t border-dashed border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block">
                    Looking for overseas employment as an individual candidate?
                  </span>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <span>Register as Candidate</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 px-5 sm:px-10 py-1 border-t border-white/15 bg-slate-900/75 backdrop-blur-md flex items-center justify-between text-[11px] text-slate-300 shrink-0">
        <span>&copy; {new Date().getFullYear()} ImmiGo CRM &bull; Designed by White Gravity Web Solutions</span>
        <span className="flex items-center gap-1 text-slate-300">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span>SSL 256-Bit Encrypted</span>
        </span>
      </footer>
    </div>
  );
}

export default VendorRegister;
