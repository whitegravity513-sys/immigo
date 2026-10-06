import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ImmiGoLogo } from "../components/common/ImmiGoLogo.jsx";
import AuthHeader from "../components/auth/AuthHeader.jsx";
import AuthHeroSection from "../components/auth/AuthHeroSection.jsx";
import RoleSwitcher from "../components/auth/RoleSwitcher.jsx";
import AdminLoginForm from "../components/auth/AdminLoginForm.jsx";
import EmployeeLoginForm from "../components/auth/EmployeeLoginForm.jsx";
import ForgotPasswordModal from "../components/auth/ForgotPasswordModal.jsx";
import heroTravelerBg from "../assets/immigo-hero-traveler-bg.jpg";
import globePinIllustration from "../assets/immigo-globe-pin.jpg";

export default function UnifiedLogin({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const roleQuery = searchParams.get("role") || searchParams.get("tab");

  const validRoles = ["admin", "employee"];
  const initialRole = validRoles.includes(roleQuery) ? roleQuery : "admin";
  const [role, setRole] = useState(initialRole);
  const [forgotModal, setForgotModal] = useState(false);

  useEffect(() => {
    if (roleQuery && validRoles.includes(roleQuery) && roleQuery !== role) {
      setRole(roleQuery);
    }
  }, [roleQuery, role]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setSearchParams({ role: newRole }, { replace: true });
  };

  const handleSuccess = (token, user, userRole) => {
    if (onLoginSuccess) {
      onLoginSuccess(token, user, userRole);
    } else {
      const redirectPath = userRole === "admin" ? "/admin/dashboard" : "/employee/dashboard";
      navigate(redirectPath, { replace: true });
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden font-sans select-none bg-slate-50">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-40"
        style={{ backgroundImage: `url(${heroTravelerBg})` }}
      />

      <AuthHeader />

      <main className="relative z-10 w-full flex-1 flex flex-col lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-14 xl:px-18 py-6 sm:py-8 gap-8">
        <AuthHeroSection />

        <div className="w-full lg:w-[44%] flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-[430px] bg-white rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.12)] border border-slate-200/90 p-6 sm:p-8 text-left relative">
            <div className="flex items-center justify-between mb-5">
              <div>
                <ImmiGoLogo size="sm" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  Access Your Global Workforce
                </p>
              </div>

              <div className="w-20 h-20 sm:w-24 sm:h-24 -mr-2 -mt-2 shrink-0 select-none pointer-events-none">
                <img
                  src={globePinIllustration}
                  alt="Global Workforce"
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {role === "admin" ? "Admin Portal" : "Employee Portal"}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 mb-4">
              {role === "admin"
                ? "Sign in to manage HR, workforce, attendance, and client projects"
                : "Sign in to view attendance, apply leave, and check payslips"}
            </p>

            <RoleSwitcher role={role} onChange={handleRoleChange} />

            {role === "admin" ? (
              <AdminLoginForm
                onLoginSuccess={handleSuccess}
                onForgotPassword={() => setForgotModal(true)}
              />
            ) : (
              <EmployeeLoginForm
                onLoginSuccess={handleSuccess}
                onForgotPassword={() => setForgotModal(true)}
              />
            )}
          </div>
        </div>
      </main>

      <ForgotPasswordModal isOpen={forgotModal} onClose={() => setForgotModal(false)} />
    </div>
  );
}
