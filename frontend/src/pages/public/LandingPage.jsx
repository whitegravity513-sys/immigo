import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  CheckCircle2,
  ArrowRight,
  Plane,
  FileText,
  Briefcase,
  Users,
  Building2,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Send,
  Menu,
  X,
} from "lucide-react";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";

const heroSlides = [
  {
    id: 1,
    image: "/images/manpower-hero-1.jpg",
    tagline: "Overseas Recruitment & Manpower Supply",
    title: "Global Manpower Supply & International Careers",
    subtitle:
      "Connecting premier enterprise projects in Saudi Arabia, UAE, Qatar, Oman, and Europe with government-verified, trade-tested technicians, engineers, and workforce.",
    badge: "Gulf & Europe Deployments",
  },
  {
    id: 2,
    image: "/images/manpower-hero-2.jpg",
    tagline: "Certified Technical Specialists",
    title: "Government-Approved Trade Testing & Verification",
    subtitle:
      "Rigorous technical assessments for certified 6G welders, industrial electricians, mechanical fitters, and heavy equipment operators with zero emigration delays.",
    badge: "Verified Skill Centers",
  },
  {
    id: 3,
    image: "/images/manpower-hero-3.jpg",
    tagline: "End-to-End International Placement",
    title: "100% Legal Work Visas & Guaranteed Flights",
    subtitle:
      "Complete emigration clearance, embassy work visa stamping, pre-departure briefing, and guaranteed flight deployment with dedicated deployment desks.",
    badge: "100% Legal Work Visas",
  },
  {
    id: 4,
    image: "/images/manpower-hero-4.jpg",
    tagline: "Industrial & Energy Mega Projects",
    title: "Certified Manpower for Infrastructure & Energy Plants",
    subtitle:
      "Supplying high-demand technical workforce for petrochemical, refinery, pipeline, and mega infrastructure projects with verified safety and skill accreditations.",
    badge: "High-Volume Deployments",
  },
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [bookOpened, setBookOpened] = useState(false);
  const [curtainRemoved, setCurtainRemoved] = useState(false);

  useEffect(() => {
    const openTimer = setTimeout(() => {
      setBookOpened(true);
    }, 180);

    const removeTimer = setTimeout(() => {
      setCurtainRemoved(true);
    }, 1400);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  useEffect(() => {
    heroSlides.forEach((slide) => {
      const preloadImg = new Image();
      preloadImg.src = slide.image;
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const [inquiryForm, setInquiryForm] = useState({
    name: "",
    email: "",
    phone: "",
    roleType: "Recruitment Agency / Vendor Partnership",
    message: "",
  });
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.phone) return;

    const customMsg = inquiryForm.message?.trim();
    const senderInfo = [
      `Name: ${inquiryForm.name.trim()}`,
      `Phone: ${inquiryForm.phone.trim()}`,
      inquiryForm.email?.trim() ? `Email: ${inquiryForm.email.trim()}` : "",
      inquiryForm.roleType ? `Category: ${inquiryForm.roleType}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const messageBody = customMsg
      ? `Hello, I want to know more about your overseas recruitment services. ${customMsg} (${senderInfo})`
      : `Hello, I want to know more about your overseas recruitment and manpower services. (${senderInfo})`;

    const text = encodeURIComponent(messageBody);
    const phone = (import.meta.env.VITE_WHATSAPP_NUMBER || "919105921924").replace(/[^0-9]/g, "");
    const url = `https://wa.me/${phone}?text=${text}`;
    window.open(url, "_blank");
    setInquirySubmitted(true);
    setTimeout(() => setInquirySubmitted(false), 8000);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const navHeight = 65;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;
      window.scrollTo({
        top: id === "home" ? 0 : offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-slate-50 font-sans text-slate-900 selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white border-b border-blue-800/80 shadow-md">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 shrink-0 min-w-0">
            <ImmiGoLogo size="sm" theme="light" subtitle="Manpower Supply" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 lg:gap-12 text-xs font-semibold text-blue-100">
            <button
              type="button"
              onClick={() => scrollToSection("home")}
              className="hover:text-cyan-300 transition-colors cursor-pointer bg-transparent border-none p-0 text-xs font-semibold text-blue-100"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("about")}
              className="hover:text-cyan-300 transition-colors cursor-pointer bg-transparent border-none p-0 text-xs font-semibold text-blue-100"
            >
              About Us
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("process")}
              className="hover:text-cyan-300 transition-colors cursor-pointer bg-transparent border-none p-0 text-xs font-semibold text-blue-100"
            >
              Process
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("contact")}
              className="hover:text-cyan-300 transition-colors cursor-pointer bg-transparent border-none p-0 text-xs font-semibold text-blue-100"
            >
              Contact Us
            </button>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link
              to="/vendor/login"
              className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-bold text-blue-200 hover:text-white border border-blue-700/70 hover:bg-blue-800/70 rounded-lg transition-all cursor-pointer whitespace-nowrap"
            >
              Vendor Sign In
            </Link>
            <Link
              to="/vendor/register"
              className="px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              Vendor Register
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 cursor-pointer"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[260px] max-w-[80vw] h-[100dvh] bg-gradient-to-b from-blue-950 via-blue-900 to-indigo-950 text-white border-l border-blue-800/80 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="h-14 px-4 flex items-center justify-between border-b border-blue-800/70">
                <ImmiGoLogo size="sm" theme="light" subtitle="Manpower Supply" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-3 space-y-1">
                <span className="px-3 py-1 block text-[10px] font-bold uppercase tracking-wider text-blue-300/80">
                  Navigation
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollToSection("home");
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-semibold text-blue-100 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Home</span>
                  <ArrowRight size={13} className="text-blue-300" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollToSection("about");
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-semibold text-blue-100 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>About Us</span>
                  <ArrowRight size={13} className="text-blue-300" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollToSection("process");
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-semibold text-blue-100 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Process</span>
                  <ArrowRight size={13} className="text-blue-300" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollToSection("contact");
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-semibold text-blue-100 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Contact Us</span>
                  <ArrowRight size={13} className="text-blue-300" />
                </button>
              </div>
            </div>

            <div className="p-3 border-t border-blue-800/70 space-y-2">
              <Link
                to="/vendor/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full block text-center px-3 py-2.5 text-xs font-bold text-blue-100 border border-blue-700/80 rounded-xl bg-blue-900/50 hover:bg-blue-800/70 transition-colors"
              >
                Vendor Sign In
              </Link>
              <Link
                to="/vendor/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full block text-center px-3 py-2.5 text-xs font-bold text-white rounded-xl bg-blue-600 hover:bg-blue-500 shadow-sm transition-colors"
              >
                Vendor Register
              </Link>
            </div>
          </aside>
        </div>
      )}

      <section
        id="home"
        className="relative bg-white text-slate-900 overflow-hidden select-none"
      >
        <div className="relative min-h-[270px] sm:min-h-[350px] lg:min-h-[420px] xl:min-h-[450px] w-full overflow-hidden flex flex-col justify-between">
          {!curtainRemoved && (
            <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden flex">
              <div
                className={`w-1/2 h-full bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 border-r border-cyan-400/30 shadow-2xl transition-all duration-1000 ease-in-out ${bookOpened
                  ? "-translate-x-full opacity-0 origin-left"
                  : "translate-x-0 opacity-100"
                  }`}
              />
              <div
                className={`w-1/2 h-full bg-gradient-to-l from-blue-950 via-blue-900 to-indigo-900 border-l border-cyan-400/30 shadow-2xl transition-all duration-1000 ease-in-out ${bookOpened
                  ? "translate-x-full opacity-0 origin-right"
                  : "translate-x-0 opacity-100"
                  }`}
              />
            </div>
          )}

          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {heroSlides.map((slide, index) => {
              const isActive = index === currentSlide;
              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    loading="eager"
                    fetchPriority={index === 0 ? "high" : "auto"}
                    decoding={index === 0 ? "sync" : "async"}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              );
            })}
          </div>

          <div className="relative z-20 w-full max-w-7xl 2xl:max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col justify-between h-full min-h-[270px] sm:min-h-[350px] lg:min-h-[420px] xl:min-h-[450px] pointer-events-none">
            <div className="max-w-2xl text-left space-y-1.5 sm:space-y-3 pt-1 sm:pt-3 pointer-events-auto">
              <h1 className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white tracking-tight leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">
                {heroSlides[currentSlide].title}
              </h1>
              <p className="text-[11px] sm:text-sm md:text-base text-white/95 leading-snug sm:leading-relaxed font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] max-w-xl">
                {heroSlides[currentSlide].subtitle}
              </p>
            </div>

            <div className="pb-1 sm:pb-3 flex justify-start items-end pointer-events-auto">
              <Link
                to="/vendor/register"
                className="px-4 sm:px-7 py-2 sm:py-3 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-2xl hover:shadow-blue-600/40 transition-all cursor-pointer inline-flex items-center gap-1.5 sm:gap-2"
              >
                <Building2 size={15} className="shrink-0" />
                <span>Vendor Partner Registration</span>
                <ArrowRight size={14} className="shrink-0" />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative z-30 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 border-t border-b border-blue-700/60 shadow-lg backdrop-blur-md py-2.5 sm:py-4">
          <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8 grid grid-cols-4 gap-1 sm:gap-4 text-center divide-x divide-blue-800/50 items-start">
            <div className="min-w-0 space-y-0.5 px-1 sm:px-2">
              <span className="text-sm sm:text-2xl lg:text-3xl font-bold text-white block leading-tight">15,000+</span>
              <span className="text-[9px] sm:text-[11px] text-blue-200 block font-medium leading-tight">
                Candidates Deployed
              </span>
            </div>
            <div className="min-w-0 space-y-0.5 px-1 sm:px-2">
              <span className="text-sm sm:text-2xl lg:text-3xl font-bold text-cyan-300 block leading-tight">100%</span>
              <span className="text-[9px] sm:text-[11px] text-blue-200 block font-medium leading-tight">
                Legal Work Visas & Emigration
              </span>
            </div>
            <div className="min-w-0 space-y-0.5 px-1 sm:px-2">
              <span className="text-sm sm:text-2xl lg:text-3xl font-bold text-emerald-300 block leading-tight">50+</span>
              <span className="text-[9px] sm:text-[11px] text-blue-200 block font-medium leading-tight">
                Global Enterprise Clients
              </span>
            </div>
            <div className="min-w-0 space-y-0.5 px-1 sm:px-2">
              <span className="text-sm sm:text-2xl lg:text-3xl font-bold text-amber-300 block leading-tight">25+</span>
              <span className="text-[9px] sm:text-[11px] text-blue-200 block font-medium leading-tight">
                Authorized Trade Test Centers
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-5 sm:py-8 lg:py-9 bg-white border-b border-slate-200">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="text-center space-y-1 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              About Us
            </h2>
            <div className="w-14 h-1 bg-blue-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-center">
            <div className="lg:col-span-7 space-y-3 sm:space-y-4">
              <div className="space-y-1.5">
                <span className="text-[11px] sm:text-xs font-bold text-blue-700 uppercase tracking-wider block">
                  International Placement & Manpower Supply
                </span>
                <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">
                  Bridging Global Employers with Certified Skilled Professionals
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Immigo operates as a dedicated international recruitment bridge. We assist individual candidates in qualifying for foreign vacancies through practical trade testing, visa processing, and deployment — while partnering with recruitment agencies and manpower suppliers with high-volume overseas projects and transparent commissions.
                </p>
              </div>

              <div className="block lg:hidden w-full my-1">
                <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-16/9 max-h-[190px] sm:max-h-[260px]">
                  <img
                    src="/images/about-deployment.jpg"
                    alt="Candidate Selection and Foreign Departure"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white flex flex-col gap-0.5">
                    <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-600/95 backdrop-blur-xs w-fit">
                      Job Selection & Guaranteed Departure
                    </span>
                    <span className="text-[10.5px] sm:text-[11px] font-medium text-slate-200">
                      100% Legal Work Visas & Emigration Clearances
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                <div className="min-w-0 p-2.5 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5 sm:space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                        <Building2 size={13} className="sm:w-[15px] sm:h-[15px]" />
                      </div>
                      <h4 className="text-[11px] sm:text-sm font-bold text-slate-900 leading-tight">For Global Enterprises</h4>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-600 leading-snug sm:leading-relaxed">
                      Sourcing government-verified, trade-tested technicians, 6G welders, mechanical fitters, and certified manpower for infrastructure and energy projects.
                    </p>
                  </div>
                  <div className="pt-1 flex items-center gap-1">
                    <a
                      href="#contact"
                      className="text-[10px] sm:text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline"
                    >
                      <span>Inquire Supply</span>
                      <ArrowRight size={11} className="shrink-0" />
                    </a>
                  </div>
                </div>

                <div className="min-w-0 p-2.5 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5 sm:space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                        <Users size={13} className="sm:w-[15px] sm:h-[15px]" />
                      </div>
                      <h4 className="text-[11px] sm:text-sm font-bold text-slate-900 leading-tight">For Recruitment Vendors</h4>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-600 leading-snug sm:leading-relaxed">
                      Recruitment agencies can submit candidate batches, track interviews in real time, monitor visa stages, and receive verified milestone commission payouts.
                    </p>
                  </div>
                  <div className="pt-1 flex items-center gap-1">
                    <Link
                      to="/vendor/register"
                      className="text-[10px] sm:text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
                    >
                      <span>Partner Register</span>
                      <ArrowRight size={11} className="shrink-0" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 text-[10.5px] sm:text-xs text-slate-700 font-semibold pt-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span className="truncate">100% Legal Work Visas</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span className="truncate">Government Licensed</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span className="truncate">Verified Trade Testing</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span className="truncate">Dedicated Desk</span>
                </div>
              </div>

              <div className="pt-0.5 flex flex-wrap items-center gap-2.5">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Phone size={13} />
                  <span>Contact Deployment Desk</span>
                </a>
                <Link
                  to="/vendor/login"
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-white hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer"
                >
                  <span>Vendor Sign In</span>
                </Link>
              </div>
            </div>

            <div className="hidden lg:block lg:col-span-5 w-full">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200 aspect-4/3 max-h-[410px] group">
                <img
                  src="/images/about-deployment.jpg"
                  alt="Candidate Selection and Foreign Departure"
                  className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 text-white flex flex-col gap-1">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-600/95 backdrop-blur-xs w-fit">
                    Job Selection & Guaranteed Departure
                  </span>
                  <span className="text-[11px] sm:text-xs font-medium text-slate-200">
                    100% Legal Work Visas & Emigration Clearances
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="py-5 sm:py-8 lg:py-9 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-4 sm:mb-6 space-y-1">
            <span className="text-[11px] sm:text-xs font-bold text-blue-700 uppercase tracking-wider block">
              Transparent 4-Step Cycle
            </span>
            <h2 className="text-xl sm:text-3xl font-bold text-slate-900">
              Overseas Deployment Process
            </h2>
            <p className="text-[11px] sm:text-sm text-slate-600">
              A transparent, milestone-tracked workflow from initial registration to foreign departure.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 max-w-7xl 2xl:max-w-[1440px] mx-auto">
            {[
              {
                step: "01",
                title: "Agency Sourcing & Profiling",
                desc: "Accredited partner agencies submit candidate dossiers with verified passport, trade certificates, and experience details.",
                icon: FileText,
              },
              {
                step: "02",
                title: "Trade Test & Verification",
                desc: "Rigorous technical skill assessment at authorized testing workshops to verify candidate trade competence.",
                icon: Award,
              },
              {
                step: "03",
                title: "Client Selection & Offer",
                desc: "Overseas client interview, final candidate selection, salary confirmation, and employment contract issuance.",
                icon: Briefcase,
              },
              {
                step: "04",
                title: "Visa Stamping & Flight",
                desc: "Medical fitness certification, work visa stamping, pre-departure orientation, and international flight deployment.",
                icon: Plane,
              },
            ].map((st, i) => {
              const Icon = st.icon;
              return (
                <div
                  key={i}
                  className="min-w-0 bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                        <Icon size={15} className="sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <span className="text-base sm:text-2xl font-bold text-slate-200">
                        {st.step}
                      </span>
                    </div>

                    <h3 className="text-[11.5px] sm:text-sm font-bold text-slate-900 mb-1 leading-snug">
                      {st.title}
                    </h3>
                    <p className="text-[10.5px] sm:text-xs text-slate-600 leading-snug sm:leading-relaxed">
                      {st.desc}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 sm:mt-3.5 sm:pt-2.5 border-t border-slate-100 flex items-center gap-1 text-[9.5px] sm:text-[11px] font-bold text-blue-700">
                    <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                    <span>Verified Milestone</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="contact" className="py-5 sm:py-8 lg:py-9 bg-white border-b border-slate-200">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="text-center space-y-1 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              Contact Us
            </h2>
            <div className="w-14 h-1 bg-blue-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-stretch">
            <div className="lg:col-span-5 flex flex-col">
              <div className="h-full p-4 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between gap-4">
                <div className="space-y-3.5">
                  <div className="border-b border-slate-200 pb-2.5">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Office &amp; Direct Contact
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Reach our Noida / NCR desk directly via call, WhatsApp, or email.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3 text-xs text-slate-700">
                    <a
                      href="https://maps.google.com/?q=Ozone+Arcade+Jupiter+Enclave+Sector+104+Gautam+Budh+Nagar+Uttar+Pradesh+201302"
                      target="_blank"
                      rel="noreferrer"
                      className="col-span-2 lg:col-span-1 flex items-start gap-2.5 sm:gap-3 min-w-0 p-2 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-slate-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] sm:text-[11px] text-slate-400 block font-semibold">Head Office</span>
                        <span className="text-[11px] sm:text-xs font-medium text-slate-800 break-words leading-snug block">
                          D 1, 4th Floor, Ozone Arcade, Jupiter Enclave, Sector 104, Gautam Budh Nagar, Uttar Pradesh - 201302
                        </span>
                      </div>
                    </a>

                    <a
                      href="tel:+919105921927"
                      className="flex items-start gap-2 sm:gap-3 min-w-0 p-2 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-slate-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Phone size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] sm:text-[11px] text-slate-400 block font-semibold">Call Support</span>
                        <span className="text-[11px] sm:text-xs font-bold text-slate-900 group-hover:text-blue-700 break-words block">
                          +91 91059 21927
                        </span>
                      </div>
                    </a>

                    <a
                      href="https://wa.me/919105921924"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-2 sm:gap-3 min-w-0 p-2 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-slate-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <MessageCircle size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] sm:text-[11px] text-slate-400 block font-semibold">WhatsApp</span>
                        <span className="text-[11px] sm:text-xs font-bold text-slate-900 group-hover:text-emerald-700 break-words block">
                          +91 91059 21924
                        </span>
                      </div>
                    </a>

                    <a
                      href="mailto:immigoeducare@gmail.com"
                      className="col-span-2 lg:col-span-1 flex items-start gap-2.5 sm:gap-3 min-w-0 p-2 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-slate-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Mail size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] sm:text-[11px] text-slate-400 block font-semibold">Email Inquiry</span>
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-800 group-hover:text-blue-700 group-hover:underline break-all block">
                          immigoeducare@gmail.com
                        </span>
                      </div>
                    </a>

                    <div className="col-span-2 lg:col-span-1 flex items-start gap-2.5 sm:gap-3 min-w-0 p-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] sm:text-[11px] text-slate-400 block font-semibold">Working Hours</span>
                        <span className="text-[11px] sm:text-xs font-medium text-slate-800 leading-snug block">Mon - Sat: 9:30 AM - 6:30 PM (IST)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 grid grid-cols-3 gap-2">
                  <a
                    href="tel:+919105921927"
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 text-[11px] font-bold transition-colors"
                  >
                    <Phone size={13} className="shrink-0" />
                    <span>Call Now</span>
                  </a>
                  <a
                    href="https://wa.me/919105921924"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors shadow-2xs"
                  >
                    <MessageCircle size={13} className="shrink-0" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href="mailto:immigoeducare@gmail.com"
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-[11px] font-bold transition-colors"
                  >
                    <Mail size={13} className="shrink-0" />
                    <span>Email Us</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col">
              <div className="h-full bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
                <div className="pb-2.5 border-b border-slate-200 mb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Send an Instant Inquiry
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Our international placement team will respond within 24 hours.
                  </p>
                </div>

                {inquirySubmitted && (
                  <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Inquiry submitted successfully! Our deployment desk will contact you soon.</span>
                  </div>
                )}

                <form onSubmit={handleInquirySubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="min-w-0">
                      <label className="block text-[10.5px] sm:text-[11px] font-bold text-slate-700 mb-0.5 truncate">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Kumar"
                        value={inquiryForm.name}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="block text-[10.5px] sm:text-[11px] font-bold text-slate-700 mb-0.5 truncate">
                        Mobile Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="min-w-0">
                      <label className="block text-[10.5px] sm:text-[11px] font-bold text-slate-700 mb-0.5 truncate">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="yourname@domain.com"
                        value={inquiryForm.email}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="block text-[10.5px] sm:text-[11px] font-bold text-slate-700 mb-0.5 truncate">
                        Inquiry Category
                      </label>
                      <select
                        value={inquiryForm.roleType}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, roleType: e.target.value })}
                        className="w-full min-w-0 max-w-full truncate px-2 sm:px-3 py-1.5 sm:py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
                      >
                        <option value="Recruitment Agency / Vendor Partnership">Recruitment Agency / Vendor Partnership</option>
                        <option value="Foreign Employer Manpower Request">Foreign Employer Manpower Request</option>
                        <option value="General Question">General Question</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] sm:text-[11px] font-bold text-slate-700 mb-0.5">
                      Your Message or Trade Skills
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Specify your technical trade (e.g. 6G Welder, Electrician) or manpower requirement details..."
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                      className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>Send Inquiry to Deployment Desk</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white pt-5 pb-3.5 sm:pt-7 sm:pb-4 border-t border-blue-800 mt-auto">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-8 space-y-3.5 sm:space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 pb-3.5 sm:pb-5 border-b border-white/10 items-start">
            <div className="col-span-2 md:col-span-1 space-y-2">
              <Link to="/" className="inline-block">
                <ImmiGoLogo size="sm" theme="light" subtitle="Manpower Supply" />
              </Link>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed max-w-sm">
                Certified international recruitment and overseas manpower supply agency connecting tested skilled professionals with global employers.
              </p>
            </div>

            <div className="col-span-1 md:text-center space-y-2">
              <span className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider block">
                Quick Navigation
              </span>
              <nav className="flex flex-col md:items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-300">
                <button
                  type="button"
                  onClick={() => scrollToSection("home")}
                  className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-left md:text-center text-[11px] sm:text-xs font-semibold text-slate-300"
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("about")}
                  className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-left md:text-center text-[11px] sm:text-xs font-semibold text-slate-300"
                >
                  About Us
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("process")}
                  className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-left md:text-center text-[11px] sm:text-xs font-semibold text-slate-300"
                >
                  Process
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("contact")}
                  className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-left md:text-center text-[11px] sm:text-xs font-semibold text-slate-300"
                >
                  Contact Us
                </button>
              </nav>
            </div>

            <div className="col-span-1 space-y-2 min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider block">
                Corporate Address
              </span>
              <div className="space-y-1.5 text-[10.5px] sm:text-xs text-slate-300">
                <a
                  href="https://maps.google.com/?q=Ozone+Arcade+Jupiter+Enclave+Sector+104+Gautam+Budh+Nagar+Uttar+Pradesh+201302"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-1.5 hover:text-white transition-colors"
                >
                  <MapPin size={13} className="text-blue-400 shrink-0 mt-0.5" />
                  <span className="min-w-0 break-words leading-snug">
                    D 1, 4th Floor, Ozone Arcade, Jupiter Enclave, Sector 104, Gautam Budh Nagar, Uttar Pradesh - 201302
                  </span>
                </a>
                <a href="tel:+919105921927" className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Phone size={13} className="text-blue-400 shrink-0" />
                  <span className="min-w-0 break-words">+91 91059 21927 (Call)</span>
                </a>
                <a
                  href="https://wa.me/919105921924"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-emerald-300 transition-colors"
                >
                  <MessageCircle size={13} className="text-emerald-400 shrink-0" />
                  <span className="min-w-0 break-words">+91 91059 21924 (WhatsApp)</span>
                </a>
                <a href="mailto:immigoeducare@gmail.com" className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Mail size={13} className="text-blue-400 shrink-0" />
                  <span className="min-w-0 break-all">immigoeducare@gmail.com</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start text-center sm:text-left">
              <span>&copy; {new Date().getFullYear()} Immigo Manpower Consultants</span>
              <span className="text-blue-400">&bull;</span>
              <span className="font-semibold text-cyan-300">Designed by White Gravity Web Solutions</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <Link to="/vendor/login" className="hover:text-white">
                Vendor Portal
              </Link>
              <span>&bull;</span>
              <Link to="/vendor/register" className="hover:text-white">
                Vendor Register
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <a
        href={`https://wa.me/${(import.meta.env.VITE_WHATSAPP_NUMBER || "919105921924").replace(/[^0-9]/g, "")}?text=Hello%2C%20I%20want%20to%20know%20more%20about%20your%20services.`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-full shadow-lg shadow-emerald-950/30 flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
        aria-label="Contact on WhatsApp"
      >
        <MessageCircle size={22} />
        <span className="hidden sm:inline text-xs font-bold pr-1">WhatsApp Us</span>
      </a>
    </div>
  );
}
