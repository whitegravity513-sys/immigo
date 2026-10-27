import { Users, ShieldCheck, Zap, Headphones, Globe, Building, Smile, Star } from "lucide-react";

export function AuthHeroHeadline({ isMobile = false }) {
  return (
    <div className={`space-y-3 text-left ${isMobile ? "w-full max-w-[430px] sm:max-w-xl mx-auto" : "w-full"}`}>
      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md border border-blue-200/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-900 shadow-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-[#1877f2] animate-pulse" />
        <span>International Hiring &amp; Workforce Solutions</span>
      </div>

      {/* Main Title with natural full-width flow */}
      <h1 className="text-2xl sm:text-3xl lg:text-[34px] xl:text-[40px] font-bold text-slate-900 leading-[1.18] tracking-tight drop-shadow-xs">
        Supplying Skilled Talent <span className="text-[#1877f2]">Across Foreign Borders</span>
      </h1>

      {/* Subtitle with generous readable width */}
      <p className="text-xs sm:text-sm lg:text-[14px] text-slate-700 font-semibold max-w-2xl leading-relaxed drop-shadow-xs">
        Connecting global businesses with verified talent for a stronger, more skilled tomorrow. Fast. Secure. Borderless.
      </p>
    </div>
  );
}

export function AuthHeroFeatures({ isMobile = false }) {
  const featureCards = [
    {
      icon: <Users size={17} />,
      bg: "bg-[#1877f2]",
      title: "Global Talent",
      desc: "Worldwide access",
    },
    {
      icon: <ShieldCheck size={17} />,
      bg: "bg-[#0284c7]",
      title: "100% Compliant",
      desc: "Fully verified",
    },
    {
      icon: <Zap size={17} />,
      bg: "bg-[#2563eb]",
      title: "Fast-Track Visa",
      desc: "Quick processing",
    },
    {
      icon: <Headphones size={17} />,
      bg: "bg-[#1d4ed8]",
      title: "24/7 Support",
      desc: "End-to-end help",
    },
  ];

  const stats = [
    { icon: <Globe size={18} className="text-[#1877f2]" />, value: "15,000+", label: "Workforce" },
    { icon: <Building size={18} className="text-[#1877f2]" />, value: "50+", label: "Countries" },
    { icon: <Smile size={18} className="text-[#1877f2]" />, value: "98.8%", label: "Satisfaction" },
    { icon: <Star size={18} className="text-[#1877f2]" />, value: "10+ Years", label: "Excellence" },
  ];

  return (
    <div className={`space-y-4 text-left ${isMobile ? "w-full max-w-[430px] sm:max-w-xl mx-auto" : "w-full"}`}>
      {/* 4 Feature cards in 1 row with full comfortable width */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 w-full pt-1">
        {featureCards.map((card, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center text-center bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-white/90 shadow-xs hover:shadow-md transition-all group"
          >
            <div
              className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center text-white shrink-0 shadow-xs mb-1.5 transition-transform group-hover:scale-105`}
            >
              {card.icon}
            </div>
            <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight whitespace-nowrap">
              {card.title}
            </h4>
            <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium leading-tight mt-1 whitespace-nowrap">
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* 4 Stat badges in 1 row with full width */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xs p-3 sm:p-3.5 grid grid-cols-4 gap-2 sm:gap-3.5 w-full">
        {stats.map((s, idx) => (
          <div key={idx} className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="shrink-0">{s.icon}</span>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm lg:text-[15px] font-bold text-slate-900 leading-none whitespace-nowrap">
                {s.value}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-600 font-medium mt-1 whitespace-nowrap">
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tagline footer */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-800 pt-1 drop-shadow-2xs">
        <ShieldCheck size={16} className="text-[#1877f2]" />
        <span>Your Global Recruitment Partner</span>
        <span className="text-slate-400">&bull;</span>
        <span>Skilled People</span>
        <span className="text-slate-400">&bull;</span>
        <span>Stronger Businesses</span>
      </div>
    </div>
  );
}

export default function AuthHeroSection() {
  return (
    <div className="w-full flex flex-col justify-between text-left space-y-6">
      <div className="space-y-4">
        <AuthHeroHeadline />
        <AuthHeroFeatures />
      </div>
    </div>
  );
}
