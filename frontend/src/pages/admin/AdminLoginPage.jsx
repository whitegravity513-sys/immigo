import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";
import AuthHeader from "../../components/auth/AuthHeader.jsx";
import AuthHeroSection, { AuthHeroHeadline, AuthHeroFeatures } from "../../components/auth/AuthHeroSection.jsx";
import AdminLoginForm from "../../components/auth/AdminLoginForm.jsx";
import ForgotPasswordOtpModal from "../../components/auth/ForgotPasswordOtpModal.jsx";
import heroTravelerBg from "../../assets/immigo-hero-traveler-bg.jpg";
import globePinIllustration from "../../assets/immigo-globe-pin.jpg";
import { CheckCircle2 } from "lucide-react";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [forgotModal, setForgotModal] = useState(false);
  const [resetSuccessNotice, setResetSuccessNotice] = useState(false);

  const handleSuccess = (token, user, userRole) => {
    navigate("/admin/dashboard", { replace: true });
  };

  const handleResetSuccess = () => {
    setForgotModal(false);
    setResetSuccessNotice(true);
    setTimeout(() => setResetSuccessNotice(false), 8000);
  };

  
  const renderAdminLoginCard = () => (
    <div className="w-full max-w-[430px] bg-white rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.12)] border border-slate-200/90 p-5 sm:p-7 md:p-8 text-left relative mx-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <ImmiGoLogo size="sm" />
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            Access Your Global Workforce
          </p>
        </div>

        <div className="w-16 h-16 sm:w-20 sm:h-20 -mr-2 -mt-2 shrink-0 select-none pointer-events-none">
          <img
            src={globePinIllustration}
            alt="Global Workforce"
            className="w-full h-full object-contain mix-blend-multiply"
          />
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
        Admin Portal
      </h2>
      <p className="text-xs text-slate-500 font-medium mt-0.5 mb-5">
        Sign in to manage HR, workforce, attendance, and client projects.
      </p>

      {resetSuccessNotice && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Password reset successfully! Please log in with your new password.</span>
        </div>
      )}

      {}
      <AdminLoginForm
        onLoginSuccess={handleSuccess}
        onForgotPassword={() => setForgotModal(true)}
      />
    </div>
  );

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden font-sans select-none bg-slate-50">
      {}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-40"
        style={{ backgroundImage: `url(${heroTravelerBg})` }}
      />

      <AuthHeader />

      <main className="relative z-10 w-full flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 max-w-7xl mx-auto">
        {}
        <div className="hidden lg:flex w-full items-center justify-between gap-10 xl:gap-14">
          <AuthHeroSection />
          <div className="w-[45%] flex items-center justify-end">
            {renderAdminLoginCard()}
          </div>
        </div>

        {}
        <div className="flex lg:hidden flex-col w-full items-center gap-6">
          <AuthHeroHeadline isMobile />
          <div className="w-full flex justify-center">
            {renderAdminLoginCard()}
          </div>
          <AuthHeroFeatures isMobile />
        </div>
      </main>

      {}
      <footer className="relative z-20 w-full px-6 py-3 text-center border-t border-slate-200 bg-white/70 backdrop-blur-md text-[11px] text-slate-600 font-medium">
        <span>&copy; {new Date().getFullYear()} ImmiGo Global Enterprise</span>
        <span className="mx-2 text-slate-400">&bull;</span>
        <span className="font-semibold text-slate-700">Designed by White Gravity Web Solutions</span>
      </footer>

      {}
      <ForgotPasswordOtpModal
        isOpen={forgotModal}
        onClose={() => setForgotModal(false)}
        role="admin"
        initialEmail="admin@immigo.com"
        onSuccess={handleResetSuccess}
      />
    </div>
  );
}
