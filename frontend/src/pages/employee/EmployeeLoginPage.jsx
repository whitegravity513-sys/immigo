import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";
import { employeeLogin } from "../../services/authService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import employeeVectorHd from "../../assets/employee-vector-hd.jpg";
import {
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Zap,
} from "lucide-react";


function FullWidthLandscapeBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {}
      <div className="absolute inset-0 bg-gradient-to-b from-[#eaf6fc] via-[#daf0f9] to-[#cbeaf6]" />

      {}
      <svg className="absolute top-0 left-0 w-full h-44 opacity-80" viewBox="0 0 1440 180" preserveAspectRatio="none" fill="none">
        <path d="M80 60 C100 35, 150 35, 170 60 C190 45, 230 50, 240 70 C250 90, 240 100, 220 100 L90 100 C65 100, 60 80, 80 60 Z" fill="white" opacity="0.65" />
        <path d="M420 35 C440 15, 485 15, 505 35 C525 22, 555 28, 565 45 C575 60, 565 70, 545 70 L430 70 C410 70, 405 52, 420 35 Z" fill="white" opacity="0.5" />
        <path d="M780 50 C805 25, 855 25, 880 50 C900 35, 940 40, 950 60 C960 80, 950 90, 930 90 L790 90 C765 90, 760 70, 780 50 Z" fill="white" opacity="0.6" />
        <path d="M1160 40 C1180 20, 1220 20, 1240 40 C1255 30, 1285 35, 1295 50 C1305 65, 1295 75, 1275 75 L1170 75 C1150 75, 1145 58, 1160 40 Z" fill="white" opacity="0.45" />
      </svg>

      {}
      <svg
        className="absolute bottom-0 left-0 w-full h-[54vh] min-h-[350px]"
        viewBox="0 0 1440 440"
        preserveAspectRatio="none"
        fill="none"
      >
        {}
        <path
          d="M0 220 Q320 140 640 200 T1440 170 L1440 440 L0 440 Z"
          fill="#c4e8f3"
        />

        {}
        <g transform="translate(100, 130)">
          <path d="M18 0 C30 35, 36 75, 28 110 C24 125, 12 125, 8 110 C0 75, 6 35, 18 0 Z" fill="#3eb9ce" />
          <path d="M18 10 C24 40, 24 85, 18 120" stroke="#259ab0" strokeWidth="2" strokeLinecap="round" />
        </g>

        <g transform="translate(480, 120)">
          <path d="M16 0 C28 30, 32 65, 25 95 C21 110, 11 110, 7 95 C0 65, 4 30, 16 0 Z" fill="#44c0d4" />
          <path d="M16 10 C21 35, 21 75, 16 105" stroke="#279bb1" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        <g transform="translate(860, 100)">
          <path d="M22 0 C38 45, 42 95, 34 140 C28 158, 16 158, 10 140 C0 95, 6 45, 22 0 Z" fill="#36b3c8" />
          <path d="M22 15 C30 50, 30 110, 22 150" stroke="#218c9f" strokeWidth="2.2" strokeLinecap="round" />
        </g>

        <g transform="translate(1140, 115)">
          <path d="M18 0 C32 40, 36 85, 28 120 C24 135, 12 135, 8 120 C0 85, 4 40, 18 0 Z" fill="#42bfd3" />
          <path d="M18 12 C24 45, 24 95, 18 130" stroke="#279bb1" strokeWidth="2" strokeLinecap="round" />
        </g>

        <g transform="translate(1360, 95)">
          <path d="M24 0 C42 50, 46 105, 36 155 C30 175, 18 175, 12 155 C0 105, 6 50, 24 0 Z" fill="#34b1c6" />
          <path d="M24 15 C32 55, 32 120, 24 165" stroke="#1f899c" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {}
        <path
          d="M0 270 Q400 200 800 250 T1440 220 L1440 440 L0 440 Z"
          fill="#a4dde9"
        />

        {}
        <g transform="translate(640, 175)">
          <path d="M20 0 C35 40, 38 85, 30 125 C25 140, 15 140, 10 125 C0 85, 5 40, 20 0 Z" fill="#30abc0" />
          <path d="M20 12 C28 45, 28 95, 20 135" stroke="#1c8497" strokeWidth="2" strokeLinecap="round" />
        </g>

        <g transform="translate(1000, 160)">
          <path d="M22 0 C38 45, 42 95, 34 135 C28 150, 16 150, 10 135 C0 95, 6 45, 22 0 Z" fill="#34b1c6" />
          <path d="M22 15 C30 50, 30 105, 22 145" stroke="#1f899c" strokeWidth="2.2" strokeLinecap="round" />
        </g>

        {}
        <path
          d="M0 325 Q450 290 900 315 T1440 295 L1440 440 L0 440 Z"
          fill="#78c7d6"
        />

        {}
        <path
          d="M0 365 Q480 348 960 358 T1440 345 L1440 440 L0 440 Z"
          fill="#ffffff"
        />

        {}
        <path
          d="M0 380 Q480 366 960 374 T1440 362 L1440 402 Q960 412 480 402 T0 412 Z"
          fill="#bce4f2"
        />

        {}
        <path
          d="M0 402 Q480 392 960 398 T1440 388 L1440 440 L0 440 Z"
          fill="#ffffff"
        />

        {}
        <g transform="translate(1260, 260) scale(1.2)">
          <path d="M60 140 C50 90, 20 60, 0 50 C-10 65, 0 95, 10 120 C20 140, 50 145, 60 140 Z" fill="#249fb3" />
          <path d="M60 140 C35 105, 15 80, 0 50" stroke="#157787" strokeWidth="2.5" />
          <path d="M70 140 C85 85, 115 50, 140 35 C150 50, 140 85, 125 110 C110 135, 80 145, 70 140 Z" fill="#38bed3" />
          <path d="M70 140 C100 100, 120 70, 140 35" stroke="#2194a6" strokeWidth="2.5" />
        </g>

        {}
        <g transform="translate(50, 280) scale(1)">
          <path d="M50 130 C30 80, 5 50, -10 40 C-15 55, -5 85, 5 110 C15 130, 40 135, 50 130 Z" fill="#28a2b6" />
          <path d="M50 130 C25 95, 10 70, -10 40" stroke="#187b8b" strokeWidth="2.2" />
        </g>
      </svg>
    </div>
  );
}

export default function EmployeeLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    const empInputRef = useRef(null);
  const empPassRef = useRef(null);

  useEffect(() => {
    setEmployeeId("");
    setPassword("");
    const clearBrowserAutofill = () => {
      if (empInputRef.current) {
        const v = String(empInputRef.current.value || "").trim();
        if (v.toUpperCase().includes("VESTA") || v.toUpperCase().includes("VISTA")) {
          empInputRef.current.value = "";
          setEmployeeId("");
        }
      }
      if (empPassRef.current) {
        const p = String(empPassRef.current.value || "").trim();
        if (p.toLowerCase().includes("vesta") || p.toLowerCase().includes("vista") || (empInputRef.current && !empInputRef.current.value && p === "12345")) {
          empPassRef.current.value = "";
          setPassword("");
        }
      }
    };
    clearBrowserAutofill();
    const interval = setInterval(clearBrowserAutofill, 50);
    const stopTimer = setTimeout(() => clearInterval(interval), 2500);
    return () => {
      clearInterval(interval);
      clearTimeout(stopTimer);
    };
  }, []);


  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 6000);
    return () => clearTimeout(timer);
  }, [error]);

    const handleDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await employeeLogin("IMMI-0124-1598", "12345");
      const token = data?.token || data?.accessToken;
      if (token) {
        const empData = { ...(data.employee || {}), role: "employee" };
        login(token, empData, "employee");
        navigate("/employee/dashboard", { replace: true });
      } else {
        setError("Employee demo login failed.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleIdChange = (e) => {
    const val = e.target.value;
    setEmployeeId(val);
    if (val.includes("@")) {
      setError("Please enter your Employee ID only (e.g. IMMI-001). Email login is disabled for employees.");
    } else if (error && error.includes("Employee ID")) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanId = String(employeeId || "").trim();
    if (!cleanId) {
      setError("Please enter your Employee ID (e.g. IMMI-001).");
      return;
    }

    if (cleanId.includes("@")) {
      setError("Please login using your Employee ID only (e.g. IMMI-001). Email login is disabled for employees.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const data = await employeeLogin(cleanId, password);
      const token = data?.token || data?.accessToken;

      if (token) {
        const empData = { ...(data.employee || {}), role: "employee" };
        login(token, empData, "employee");
        navigate("/employee/dashboard", { replace: true });
      } else {
        setError("Employee authentication failed. Please verify your credentials.");
      }
    } catch (err) {
      console.error("Employee login error:", err);
      if (err?.code === "ERR_NETWORK" || !err?.response) {
        setError("Connecting to server. Please verify backend is running on http://localhost:5000");
      } else {
        setError(err.response?.data?.message || "Invalid Employee ID or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-full relative flex flex-col justify-between overflow-hidden font-sans select-none bg-[#daf0f9]">
      {}
      <FullWidthLandscapeBackground />

      {}
      <header className="relative z-20 w-full px-6 sm:px-12 py-3 flex items-center justify-between border-b border-sky-200/70 bg-white/70 backdrop-blur-md shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link to="/" className="inline-block">
            <ImmiGoLogo size="sm" />
          </Link>
          <span className="text-xs font-semibold text-slate-500 pl-3 border-l border-sky-200">
            Employee Self-Service Portal
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Workforce Portal</span>
        </div>
      </header>

      {}
      <main className="relative z-10 w-full flex-1 flex flex-col lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-24 py-2 min-h-0 overflow-hidden">
        {}
        <div className="hidden lg:flex w-full lg:w-[50%] xl:w-[52%] h-full items-center justify-center lg:justify-end select-none pointer-events-none pr-0 lg:pr-8 xl:pr-12">
          <div className="relative w-full max-w-[480px] xl:max-w-[560px] flex items-center justify-center">
            <img
              src={employeeVectorHd}
              alt="Employee Workplace Family"
              className="w-full max-h-[78vh] object-contain drop-shadow-[0_20px_45px_rgba(30,70,110,0.18)]"
            />
          </div>
        </div>

        {}
        <div className="w-full lg:w-[50%] xl:w-[48%] h-full flex items-center justify-center lg:justify-start pl-0 lg:pl-8 xl:pl-12">
          <div className="w-full max-w-[430px] sm:max-w-[450px] bg-white rounded-[32px] sm:rounded-[36px] shadow-[0_25px_60px_rgba(20,60,100,0.14)] border border-white/90 p-7 sm:p-9 text-left relative">
            {}
            <div className="mb-5 space-y-1">
              <h1 className="text-2xl sm:text-[28px] font-black text-[#261b4d] tracking-tight leading-tight">
                Welcome To Family
              </h1>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                A community of over hundreds of members.<br className="hidden sm:inline" />
                To share arts and ideas.
              </p>
            </div>

            {}
            {error && (
              <div className="mb-4 p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {}
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <input type="text" style={{ position: "absolute", opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex="-1" autoComplete="off" />
              <input type="password" style={{ position: "absolute", opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex="-1" autoComplete="off" />



              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Employee ID
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    ref={empInputRef}
                    type="text"
                    required
                    autoFocus
                    value={employeeId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.toUpperCase().includes("VESTA")) {
                        setEmployeeId("");
                        if (empInputRef.current) empInputRef.current.value = "";
                        return;
                      }
                      handleIdChange(e);
                    }}
                    name="emp_staff_id_code"
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    placeholder="e.g. IMMI-0124-1598 (IMMI-DOJ-DOB)"
                    className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-300 focus:border-[#3b2875] focus:ring-2 focus:ring-[#3b2875]/10 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium transition outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 cursor-pointer p-0.5"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <input
                    ref={empPassRef}
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    name="emp_staff_secret_pass"
                    autoComplete="new-password"
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-300 focus:border-[#3b2875] focus:ring-2 focus:ring-[#3b2875]/10 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium transition outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex items-center text-xs pt-0.5 px-1 text-slate-400 font-medium">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded-full border-slate-300 text-[#3b2875] focus:ring-[#3b2875]"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-full bg-[#3b2875] hover:bg-[#2d1e5d] active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-md shadow-indigo-950/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Login</span>
                )}
              </button>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-full border border-dashed border-[#3b2875]/40 hover:border-[#3b2875] bg-purple-50/70 hover:bg-purple-100/70 text-[#3b2875] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-60"
                >
                  <Zap size={14} className="text-amber-500 fill-amber-500" />
                  <span>1-Click Demo Login (Employee)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {}
      <footer className="relative z-20 w-full px-6 py-2.5 text-center border-t border-sky-200/60 bg-white/60 backdrop-blur-md text-[11px] text-slate-600 font-medium shrink-0">
        <span>&copy; {new Date().getFullYear()} ImmiGo Global Enterprise</span>
        <span className="mx-2 text-slate-400">&bull;</span>
        <span className="font-semibold text-slate-700">Designed by White Gravity Web Solutions</span>
      </footer>
    </div>
  );
}
