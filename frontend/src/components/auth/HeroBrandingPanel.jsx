import React from "react";
import { Globe2 } from "lucide-react";
import heroBg from "../../assets/login-hero.jpg";

/**
 * Left-side Hero Branding Panel.
 * Communicates immiGo's Overseas Manpower & Global Recruitment capabilities.
 */
export default function HeroBrandingPanel() {
  const capabilities = [
    { icon: "✈️", title: "Overseas Placement", subtitle: "Gulf & European Corridors" },
    { icon: "👷", title: "Skilled Manpower", subtitle: "Technical & Construction" },
    { icon: "🌍", title: "Global Supply", subtitle: "Cross-Border Logistics" },
    { icon: "⚡", title: "Fast-Track Visa", subtitle: "Verified Documentation" },
  ];

  const stats = [
    { value: "15,000+", label: "Mobilized" },
    { value: "50+", label: "Countries" },
    { value: "99.8%", label: "Visa Rate" },
  ];

  return (
    <div
      className="hidden lg:block relative flex-shrink-0 h-screen max-h-screen overflow-hidden"
      style={{
        width: "44%",
        backgroundImage: `url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Light soft blue gradient overlay - hero image clearly visible */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(155deg, rgba(14,35,105,0.42) 0%, rgba(20,55,150,0.28) 55%, rgba(37,99,235,0.18) 100%)",
        }}
      />

      <div className="relative z-10 h-full flex flex-col justify-between p-6 xl:p-10 text-white drop-shadow-sm">
        {/* Brand Logo */}
        <div className="flex items-end gap-0.5 select-none drop-shadow-md">
          <span className="font-black text-2xl xl:text-3xl text-white tracking-tighter leading-none">
            immi
          </span>
          <span className="font-black text-2xl xl:text-3xl text-blue-300 tracking-tighter leading-none">
            Go
          </span>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="w-3.5 h-3.5 text-orange-400 mb-2 ml-0.5"
          >
            <path
              d="M3 10h14M10 3l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Content Showcase */}
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] xl:text-[11px] font-extrabold text-blue-200 uppercase tracking-[0.16em] mb-2.5 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
            <Globe2 size={12} className="text-orange-400" />
            <span>Overseas Manpower &bull; Foreign Recruitment &bull; Global Mobility</span>
          </div>

          <h1 className="text-2xl xl:text-4xl font-black leading-tight mb-2 drop-shadow-md">
            Supplying Skilled Talent
            <br />
            <span className="text-blue-300">Across Foreign Borders</span>
          </h1>

          <p className="text-xs xl:text-sm text-blue-50 font-medium leading-relaxed max-w-sm mb-4 drop-shadow-sm">
            International workforce mobilization, enterprise recruitment operations, and real-time
            attendance management — all united in one secure platform.
          </p>

          {/* Key Capabilities */}
          <div className="grid grid-cols-2 gap-2 mb-3.5">
            {capabilities.map(({ icon, title, subtitle }) => (
              <div
                key={title}
                className="flex items-start gap-2 px-2.5 py-2 rounded-xl text-white backdrop-blur-md transition-transform hover:-translate-y-0.5"
                style={{
                  background: "rgba(15,23,42,0.45)",
                  border: "1px solid rgba(255,255,255,0.22)",
                }}
              >
                <span className="text-sm shrink-0 mt-0.5">{icon}</span>
                <div>
                  <div className="text-[10px] xl:text-[11px] font-bold leading-tight">{title}</div>
                  <div className="text-[8px] xl:text-[9px] text-blue-200 font-medium leading-tight">{subtitle}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Live Global Placement Counters */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20">
            {stats.map(({ value, label }) => (
              <div
                key={label}
                className="text-center p-1.5 xl:p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15"
              >
                <div className="text-base xl:text-lg font-black text-white leading-none">{value}</div>
                <div className="text-[9px] xl:text-[10px] text-blue-200 font-semibold mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <p className="mt-3.5 text-[10px] xl:text-[11px] text-blue-200 font-medium italic drop-shadow-sm flex items-center gap-1.5">
            <span>&ldquo;Your story unfolds across borders&rdquo;</span>
          </p>
        </div>

        {/* Panel Footer */}
        <p className="text-[10px] text-white/70 font-semibold">
          &copy; {new Date().getFullYear()} immiGo Global Mobility. All rights reserved.
        </p>
      </div>
    </div>
  );
}
