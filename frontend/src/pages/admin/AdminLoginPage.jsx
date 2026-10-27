import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";
import AuthHeader from "../../components/auth/AuthHeader.jsx";
import AuthHeroSection, { AuthHeroHeadline, AuthHeroFeatures } from "../../components/auth/AuthHeroSection.jsx";
import AdminLoginForm from "../../components/auth/AdminLoginForm.jsx";
import ForgotPasswordOtpModal from "../../components/auth/ForgotPasswordOtpModal.jsx";
import heroTravelerBg from "../../assets/immigo-hero-traveler-bg.jpg";
import globePinIllustration from "../../assets/immigo-globe-pin.jpg";
import { CheckCircle2, Info } from "lucide-react";

const ADMIN_DUMMY_CREDENTIALS = [
  { role: "Super Admin", email: "admin@vista.com", password: "12345", note: "Full system access", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { role: "Admin", email: "admin@immigo.com", password: "admin123", note: "Module management", color: "bg-indigo-50 border-indigo-200 text-indigo-800" },
];

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [forgotModal, setForgotModal] = useState(false);
  const [resetSuccessNotice, setResetSuccessNotice] = useState(false);

  const handleSuccess = (token, user, userRole) => {
    const r = (userRole || user?.role || "").toUpperCase().replace(/[\s_-]/g, "");
    if (r === "SUPERADMIN") {
      navigate("/super-admin/dashboard", { replace: true });
    } else if (r === "HR") {
      navigate("/hr/dashboard", { replace: true });
    } else {
      navigate("/admin/dashboard", { replace: true });
    }
  };


  const handleResetSuccess = () => {
    setForgotModal(false);
    setResetSuccessNotice(true);
    setTimeout(() => setResetSuccessNotice(false), 8000);
  };

  
  const [showCredentials, setShowCredentials] = useState(false);
  const [prefill, setPrefill] = useState(null);

  const renderAdminLoginCard = () => (
    <div className="w-full max-w-[400px] bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-200/90 p-4 sm:p-5 text-left relative mx-auto">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div>
          <ImmiGoLogo size="sm" />
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            Access Your Global Workforce
          </p>
        </div>

        <div className="w-11 h-11 sm:w-12 sm:h-12 -mr-1 -mt-1 shrink-0 select-none pointer-events-none">
          <img
            src={globePinIllustration}
            alt="Global Workforce"
            className="w-full h-full object-contain mix-blend-multiply"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          Admin Portal
        </h2>
        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
          Super Admin & Admin
        </span>
      </div>
      <p className="text-[11px] text-slate-500 font-medium mb-3">
        Sign in to manage modules, clients, vendors and workforce.
      </p>

      {resetSuccessNotice && (
        <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <span>Password reset successfully! Please log in with your new password.</span>
        </div>
      )}

      {/* Admin Login Form */}
      <AdminLoginForm
        onLoginSuccess={handleSuccess}
        onForgotPassword={() => setForgotModal(true)}
        prefill={prefill}
      />

      {/* Collapsible Demo Credentials */}
      <div className="mt-3 border-t border-slate-100 pt-2.5">
        <button
          type="button"
          onClick={() => setShowCredentials(!showCredentials)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-50 hover:bg-blue-50 border border-dashed border-slate-200 hover:border-blue-300 rounded-lg text-[11px] font-bold text-slate-600 hover:text-blue-700 transition-all cursor-pointer"
        >
          <Info size={12} />
          <span>{showCredentials ? "Hide" : "Show"} Account Credentials</span>
        </button>

        {showCredentials && (
          <div className="mt-2 space-y-1.5">
            {ADMIN_DUMMY_CREDENTIALS.map((cred) => (
              <div
                key={cred.email}
                onClick={() => setPrefill({ email: cred.email, password: cred.password })}
                className={`p-2 rounded-lg border ${cred.color} cursor-pointer hover:shadow-xs transition-all`}
                title="Click to fill"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate">{cred.role} <span className="font-mono font-normal opacity-80 text-[10px]">({cred.email})</span></p>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-white/70 px-1.5 py-0.5 rounded shrink-0">
                    {cred.note}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden relative flex flex-col justify-between font-sans select-none bg-slate-50">
      {/* Background Graphic */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-40"
        style={{ backgroundImage: `url(${heroTravelerBg})` }}
      />

      {/* Fixed Header */}
      <div className="fixed top-0 inset-x-0 z-30">
        <AuthHeader portalBadge="Admin Portal" />
      </div>

      {/* Main Content strictly between Fixed Header & Footer */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 xl:px-12 pt-[52px] pb-[38px] max-w-[1400px] mx-auto overflow-hidden">
        <div className="w-full flex items-center justify-center lg:justify-between gap-6 lg:gap-10 xl:gap-14">
          <div className="hidden lg:block flex-1 min-w-0 max-w-2xl xl:max-w-3xl">
            <AuthHeroSection />
          </div>
          <div className="w-full lg:w-[400px] xl:w-[420px] shrink-0 flex items-center justify-center lg:justify-end">
            {renderAdminLoginCard()}
          </div>
        </div>
      </main>

      {/* Fixed Navy Blue Footer */}
      <footer className="fixed bottom-0 inset-x-0 z-30 h-[38px] px-6 text-center border-t border-blue-900/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-blue-100 text-[11px] font-medium shadow-md flex items-center justify-center">
        <span>&copy; {new Date().getFullYear()} ImmiGo Global Enterprise</span>
        <span className="mx-2 text-cyan-400">&bull;</span>
        <span className="font-semibold text-cyan-300 tracking-wide">Designed by White Gravity Web Solutions</span>
      </footer>

      <ForgotPasswordOtpModal
        isOpen={forgotModal}
        onClose={() => setForgotModal(false)}
        role="superadmin"
        initialEmail="admin@vista.com"
        onSuccess={handleResetSuccess}
      />
    </div>
  );
}
