import { Globe, Users, ShieldCheck } from "lucide-react";
import { ImmiGoLogo } from "../common/ImmiGoLogo.jsx";

export default function AuthHeader() {
  return (
    <header className="relative z-20 w-full px-6 sm:px-10 lg:px-14 py-3.5 flex items-center justify-between border-b border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white shadow-md">
      <div className="flex items-center gap-3">
        <ImmiGoLogo size="sm" theme="light" />
        <span className="hidden sm:inline-block text-[11px] font-semibold text-indigo-200/80 pl-3 border-l border-indigo-800/60">
          Global Talent. Global Opportunities.
        </span>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 text-xs font-semibold text-slate-200">
        <div className="hidden md:flex items-center gap-5">
          <span className="flex items-center gap-1.5 hover:text-blue-400 transition cursor-pointer">
            <Globe size={14} className="text-blue-400" /> Work Abroad
          </span>
          <span className="text-slate-700 font-light">|</span>
          <span className="flex items-center gap-1.5 hover:text-blue-400 transition cursor-pointer">
            <Users size={14} className="text-blue-400" /> Recruit Talent
          </span>
          <span className="text-slate-700 font-light">|</span>
          <span className="flex items-center gap-1.5 hover:text-blue-400 transition cursor-pointer">
            <ShieldCheck size={14} className="text-blue-400" /> Build the Future
          </span>
        </div>
      </div>
    </header>
  );
}
