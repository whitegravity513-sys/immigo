import { Users, ShieldCheck, Zap, Headphones, Globe, Building, Smile, Star } from "lucide-react";

export default function AuthHeroSection() {
  const featureCards = [
    {
      icon: <Users size={17} />,
      bg: "bg-[#1877f2]",
      title: "Global Talent Access",
      desc: "Skilled professionals from around the world",
    },
    {
      icon: <ShieldCheck size={17} />,
      bg: "bg-[#0284c7]",
      title: "Trusted & Compliant",
      desc: "Secure, transparent and globally compliant",
    },
    {
      icon: <Zap size={17} />,
      bg: "bg-[#2563eb]",
      title: "Fast-Track Visa",
      desc: "Verified documentation for quicker processing",
    },
    {
      icon: <Headphones size={17} />,
      bg: "bg-[#1d4ed8]",
      title: "End-to-End Support",
      desc: "From hiring to onboarding & beyond",
    },
  ];

  const stats = [
    { icon: <Globe size={18} className="text-[#1877f2]" />, value: "15,000+", label: "Global Workforce" },
    { icon: <Building size={18} className="text-[#1877f2]" />, value: "50+", label: "Countries" },
    { icon: <Smile size={18} className="text-[#1877f2]" />, value: "98.8%", label: "Client Satisfaction" },
    { icon: <Star size={18} className="text-[#1877f2]" />, value: "10+", label: "Years of Excellence" },
  ];

  return (
    <div className="w-full lg:w-[55%] flex flex-col justify-between text-left space-y-6">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md border border-blue-200/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-900 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1877f2] animate-pulse" />
          <span>International Hiring &amp; Workforce Solutions</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-[50px] font-black text-slate-900 leading-[1.12] tracking-tight drop-shadow-xs">
          Supplying Skilled Talent<br />
          <span className="text-[#1877f2]">Across Foreign Borders</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-700 font-semibold max-w-xl leading-relaxed drop-shadow-xs">
          Connecting global businesses with verified talent for a stronger, more skilled tomorrow.
          Fast. Secure. Borderless.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl pt-2">
          {featureCards.map((card, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-white/90 shadow-sm"
            >
              <div
                className={`w-9 h-9 rounded-full ${card.bg} flex items-center justify-center text-white shrink-0 shadow-sm`}
              >
                {card.icon}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">{card.title}</h4>
                <p className="text-[10px] text-slate-600 font-medium leading-tight mt-0.5">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm p-3.5 flex flex-wrap items-center justify-between gap-4 max-w-xl">
          {stats.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {s.icon}
              <div>
                <div className="text-base font-black text-slate-900 leading-none">{s.value}</div>
                <div className="text-[10px] text-slate-600 font-medium mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 pt-2 drop-shadow-2xs">
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
