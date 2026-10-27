import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Building2,
  Lock,
} from "lucide-react";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";
import AuthLandscapeBackground from "../../components/common/AuthLandscapeBackground.jsx";
import apiClient from "../../services/apiClient.js";
import employeeVectorHd from "../../assets/employee-vector-hd.jpg";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [registeredSuccess, setRegisteredSuccess] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    trade: "",
    password: "",
    confirmPassword: "",
    termsAccepted: true,
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.fullName.trim()) {
      setErrorMsg("Please enter your full legal name.");
      return;
    }
    if (!formData.email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg("Please enter your mobile phone number.");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/candidate/register", {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        trade: formData.trade.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        termsAccepted: formData.termsAccepted,
      });

      if (res.data?.success) {
        setRegisteredSuccess({
          candidateId: res.data.candidateId,
          message: res.data.message,
        });
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          "Registration could not be completed. Please check your information or try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-full relative flex flex-col justify-between overflow-hidden font-sans select-none bg-[#daf0f9]">
      {/* Landscape SVG Background */}
      <AuthLandscapeBackground />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full px-6 sm:px-12 py-3 flex items-center justify-between border-b border-sky-200/70 bg-white/70 backdrop-blur-md shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link to="/" className="inline-block">
            <ImmiGoLogo size="sm" />
          </Link>
          <span className="text-xs font-semibold text-slate-500 pl-3 border-l border-sky-200">
            Candidate Self-Service Portal
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Job Seeker Portal</span>
          </div>
          <span className="text-slate-300">|</span>
          <Link
            to="/"
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold transition"
          >
            <ArrowLeft size={13} />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Container - Strictly No-Scroll */}
      <main className="relative z-10 w-full flex-1 flex flex-col lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-24 py-2 min-h-0 overflow-hidden">
        {/* Left: Illustration Graphic */}
        <div className="hidden lg:flex w-full lg:w-[48%] xl:w-[50%] h-full items-center justify-center lg:justify-end select-none pointer-events-none pr-0 lg:pr-8 xl:pr-12">
          <div className="relative w-full max-w-[480px] xl:max-w-[560px] flex items-center justify-center">
            <img
              src={employeeVectorHd}
              alt="Candidate Career Portal"
              className="w-full max-h-[76vh] object-contain drop-shadow-[0_20px_45px_rgba(30,70,110,0.18)]"
            />
          </div>
        </div>

        {/* Right: Modern Form Card */}
        <div className="w-full lg:w-[52%] xl:w-[50%] h-full flex items-center justify-center lg:justify-start pl-0 lg:pl-6 xl:pl-10">
          <div className="w-full max-w-[460px] sm:max-w-[480px] bg-white rounded-[32px] sm:rounded-[36px] shadow-[0_25px_60px_rgba(20,60,100,0.14)] border border-white/90 p-6 sm:p-8 text-left relative">
            {registeredSuccess ? (
              /* Registration Success State */
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={32} />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200">
                    Registration Submitted
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight pt-1">
                    Welcome to ImmiGo!
                  </h2>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                    Your candidate account has been created. Your registration details have been saved to your profile.
                  </p>
                </div>

                {registeredSuccess.candidateId && (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl max-w-sm mx-auto space-y-0.5">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Your Unique Candidate ID
                    </span>
                    <span className="text-base font-bold font-mono text-[#0f2744] tracking-wider block">
                      {registeredSuccess.candidateId}
                    </span>
                  </div>
                )}

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl max-w-sm mx-auto text-left text-xs text-amber-900">
                  <span className="font-bold block text-amber-950 mb-0.5">
                    Next Step: Admin Approval
                  </span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Our compliance desk is reviewing your profile. Once approved, you can log in directly using your email and password.
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-center gap-3">
                  <Link
                    to="/candidate/login"
                    className="px-6 py-2.5 rounded-full bg-[#3b2875] hover:bg-[#2d1e5d] text-white text-xs font-bold shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <span>Go to Candidate Login</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <>
                {/* Header */}
                <div className="mb-4 space-y-1">
                  <h1 className="text-2xl sm:text-[26px] font-bold text-[#261b4d] tracking-tight leading-tight">
                    Candidate Registration
                  </h1>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Register once. Details are saved to your profile automatically.
                  </p>
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <div className="mb-3 p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-3">
                  {/* Row 1: Legal Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Full Legal Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User
                          size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <input
                          type="text"
                          required
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({ ...formData, fullName: e.target.value })
                          }
                          placeholder="e.g. Rajesh Sharma"
                          className="w-full pl-10 pr-3 py-2.5 rounded-full border border-slate-300 focus:border-[#3b2875] focus:ring-2 focus:ring-[#3b2875]/10 bg-white text-xs text-slate-900 placeholder:text-slate-400 font-medium transition outline-none shadow-2xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail
                          size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="Enter your email address"
                          className="w-full pl-10 pr-3 py-2.5 rounded-full border border-slate-300 focus:border-[#3b2875] focus:ring-2 focus:ring-[#3b2875]/10 bg-white text-xs text-slate-900 placeholder:text-slate-400 font-medium transition outline-none shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Mobile Number & Trade / Role */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone
                          size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="e.g. +91 98765 43210"
                          className="w-full pl-10 pr-3 py-2.5 rounded-full border border-slate-300 focus:border-[#3b2875] focus:ring-2 focus:ring-[#3b2875]/10 bg-white text-xs text-slate-900 placeholder:text-slate-400 font-medium transition outline-none shadow-2xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Trade / Skill Domain
                      </label>
                      <div className="relative">
                        <Briefcase
                          size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <input
                          type="text"
                          value={formData.trade}
                          onChange={(e) =>
                            setFormData({ ...formData, trade: e.target.value })
                          }
                          placeholder="e.g. Electrician, Welder, Mason"
                          className="w-full pl-10 pr-3 py-2.5 rounded-full border border-slate-300 focus:border-[#3b2875] focus:ring-2 focus:ring-[#3b2875]/10 bg-white text-xs text-slate-900 placeholder:text-slate-400 font-medium transition outline-none shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          placeholder="At least 6 characters"
                          className="w-full pl-10 pr-3 py-2.5 rounded-full border border-slate-300 focus:border-[#3b2875] focus:ring-2 focus:ring-[#3b2875]/10 bg-white text-xs text-slate-900 placeholder:text-slate-400 font-medium transition outline-none shadow-2xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Confirm Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                        >
                          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              confirmPassword: e.target.value,
                            })
                          }
                          placeholder="Re-enter password"
                          className="w-full pl-10 pr-3 py-2.5 rounded-full border border-slate-300 focus:border-[#3b2875] focus:ring-2 focus:ring-[#3b2875]/10 bg-white text-xs text-slate-900 placeholder:text-slate-400 font-medium transition outline-none shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-center text-xs pt-0.5 px-1 text-slate-500 font-medium">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.termsAccepted}
                        onChange={(e) =>
                          setFormData({ ...formData, termsAccepted: e.target.checked })
                        }
                        className="w-3.5 h-3.5 rounded-full border-slate-300 text-[#3b2875] focus:ring-[#3b2875]"
                      />
                      <span>I agree to the Terms of Service & Privacy Policy</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-6 rounded-full bg-[#3b2875] hover:bg-[#2d1e5d] active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-indigo-950/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 mt-1"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Create Account & Save Profile</span>
                    )}
                  </button>

                  {/* Login Link */}
                  <div className="pt-1.5 text-center text-xs text-slate-500">
                    <span>Already have an account? </span>
                    <Link
                      to="/candidate/login"
                      className="font-bold text-[#3b2875] hover:underline"
                    >
                      Login here
                    </Link>
                  </div>

                  {/* Vendor Link */}
                  <div className="pt-1.5 border-t border-dashed border-slate-200 text-center">
                    <Link
                      to="/vendor/register"
                      className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      <Building2 size={12} />
                      <span>Manpower Agency / Vendor Registration</span>
                      <ArrowRight size={11} />
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Navy Blue Footer */}
      <footer className="relative z-20 w-full px-6 py-2.5 text-center border-t border-blue-900/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-blue-100 text-[11px] font-medium shadow-md shrink-0">
        <span>&copy; {new Date().getFullYear()} ImmiGo Global Enterprise</span>
        <span className="mx-2 text-cyan-400">&bull;</span>
        <span className="font-semibold text-cyan-300 tracking-wide">Designed by White Gravity Web Solutions</span>
      </footer>
    </div>
  );
}
