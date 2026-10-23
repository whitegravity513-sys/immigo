import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  ShieldCheck,
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
} from "lucide-react";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";

export default function LandingPage() {
  const heroSlides = [
    {
      id: 1,
      image: "/manpower-hero-1.jpg",
      tagline: "Overseas Recruitment & Manpower Supply",
      title: "Global Manpower Supply & International Careers",
      subtitle:
        "Connecting premier enterprise projects in Saudi Arabia, UAE, Qatar, Oman, and Europe with government-verified, trade-tested technicians, engineers, and workforce.",
      badge: "Gulf & Europe Deployments",
    },
    {
      id: 2,
      image: "/manpower-hero-2.jpg",
      tagline: "Certified Technical Specialists",
      title: "Government-Approved Trade Testing & Verification",
      subtitle:
        "Rigorous technical assessments for certified 6G welders, industrial electricians, mechanical fitters, and heavy equipment operators with zero emigration delays.",
      badge: "Verified Skill Centers",
    },
    {
      id: 3,
      image: "/manpower-hero-3.jpg",
      tagline: "End-to-End International Placement",
      title: "100% Legal Work Visas & Guaranteed Flights",
      subtitle:
        "Complete emigration clearance, embassy work visa stamping, pre-departure briefing, and guaranteed flight deployment with dedicated deployment desks.",
      badge: "100% Legal Work Visas",
    },
    {
      id: 4,
      image: "/manpower-hero-4.jpg",
      tagline: "Industrial & Energy Mega Projects",
      title: "Certified Manpower for Infrastructure & Energy Plants",
      subtitle:
        "Supplying high-demand technical workforce for petrochemical, refinery, pipeline, and mega infrastructure projects with verified safety and skill accreditations.",
      badge: "High-Volume Deployments",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // Book Opening Reveal Animation State (Opens from the middle in royal blue upon loading)
  const [bookOpened, setBookOpened] = useState(false);
  const [curtainRemoved, setCurtainRemoved] = useState(false);

  useEffect(() => {
    // Open like a book from the center shortly after loading
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

  // Pre-load all hero images immediately into browser cache for instant display
  useEffect(() => {
    heroSlides.forEach((slide) => {
      const preloadImg = new Image();
      preloadImg.src = slide.image;
    });
  }, []);

  // Auto slide timer (cycles 4 images, 3 seconds per image, loops back to 1st after 4th)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Inquiry form state
  const [inquiryForm, setInquiryForm] = useState({
    name: "",
    email: "",
    phone: "",
    roleType: "Candidate Seeking Overseas Job",
    message: "",
  });
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.phone) return;

    const customMsg = inquiryForm.message?.trim();
    const messageBody = customMsg
      ? `Hello, I want to know more about your overseas recruitment services. ${customMsg} (From: ${inquiryForm.name})`
      : `Hello, I want to know more about your overseas recruitment and manpower services. (From: ${inquiryForm.name})`;

    const text = encodeURIComponent(messageBody);
    const phone = import.meta.env.VITE_WHATSAPP_NUMBER;
    const url = phone
      ? `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white border-b border-blue-800/80 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ImmiGoLogo size="sm" theme="light" subtitle="Manpower Supply" />
          </Link>

          <nav className="hidden md:flex items-center gap-10 sm:gap-12 text-xs font-semibold text-blue-100">
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

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/candidate/login"
              className="px-3.5 py-1.5 text-xs font-bold text-blue-200 hover:text-white border border-blue-700/70 hover:bg-blue-800/70 rounded-lg transition-all cursor-pointer"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative bg-white text-slate-900 overflow-hidden select-none"
      >
        {/* Slideshow Container: 100% Full-Width Cover with slightly increased balanced height */}
        <div className="relative min-h-[460px] sm:min-h-[500px] lg:min-h-[535px] w-full overflow-hidden flex flex-col justify-between">
          {/* Book-Style Opening Reveal from Center in Royal Blue upon Page Load */}
          {!curtainRemoved && (
            <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden flex">
              {/* Left Blue Book Page */}
              <div
                className={`w-1/2 h-full bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 border-r border-cyan-400/30 shadow-2xl transition-all duration-1000 ease-in-out ${
                  bookOpened
                    ? "-translate-x-full opacity-0 origin-left"
                    : "translate-x-0 opacity-100"
                }`}
              />
              {/* Right Blue Book Page */}
              <div
                className={`w-1/2 h-full bg-gradient-to-l from-blue-950 via-blue-900 to-indigo-900 border-l border-cyan-400/30 shadow-2xl transition-all duration-1000 ease-in-out ${
                  bookOpened
                    ? "translate-x-full opacity-0 origin-right"
                    : "translate-x-0 opacity-100"
                }`}
              />
            </div>
          )}

          {/* Smooth Crossfade Slides: Fades 1 -> 2 -> 3 -> 4 -> 1 seamlessly without any sliding motion */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {heroSlides.map((slide, index) => {
              const isActive = index === currentSlide;
              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                    isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
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

          {/* Inner Content Grid: Aligned with site max-w-7xl grid */}
          <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col justify-between h-full min-h-[460px] sm:min-h-[500px] lg:min-h-[535px] pointer-events-none">
            {/* Upper Content: On the left side in the clear sky area */}
            <div className="max-w-2xl text-left space-y-2 sm:space-y-3 pt-2 sm:pt-4 pointer-events-auto">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white tracking-tight leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">
                {heroSlides[currentSlide].title}
              </h1>
              <p className="text-xs sm:text-sm sm:text-base text-white/95 leading-relaxed font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] max-w-xl">
                {heroSlides[currentSlide].subtitle}
              </p>
            </div>

            {/* Candidate Registration Button: Positioned on the bottom-left side away from people's faces */}
            <div className="pb-2 sm:pb-4 flex justify-start items-end pointer-events-auto">
              <Link
                to="/register"
                className="px-8 py-3.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-2xl hover:shadow-blue-600/40 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Users size={16} />
                <span>Candidate Registration</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Trust Metric Bar: Strictly 1 Single Row on All Screen Sizes */}
        <div className="relative z-30 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 border-t border-b border-blue-700/60 shadow-lg backdrop-blur-md py-3 sm:py-5">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 grid grid-cols-4 gap-1 sm:gap-4 text-center divide-x divide-blue-800/50">
            <div className="space-y-0.5 px-1 sm:px-2">
              <span className="text-sm sm:text-2xl lg:text-3xl font-bold text-white block">15,000+</span>
              <span className="text-[8px] sm:text-[11px] text-blue-200 block font-medium leading-tight">
                Candidates Deployed
              </span>
            </div>
            <div className="space-y-0.5 px-1 sm:px-2">
              <span className="text-sm sm:text-2xl lg:text-3xl font-bold text-cyan-300 block">100%</span>
              <span className="text-[8px] sm:text-[11px] text-blue-200 block font-medium leading-tight">
                Legal Work Visas & Emigration
              </span>
            </div>
            <div className="space-y-0.5 px-1 sm:px-2">
              <span className="text-sm sm:text-2xl lg:text-3xl font-bold text-emerald-300 block">50+</span>
              <span className="text-[8px] sm:text-[11px] text-blue-200 block font-medium leading-tight">
                Global Enterprise Clients
              </span>
            </div>
            <div className="space-y-0.5 px-1 sm:px-2">
              <span className="text-sm sm:text-2xl lg:text-3xl font-bold text-amber-300 block">25+</span>
              <span className="text-[8px] sm:text-[11px] text-blue-200 block font-medium leading-tight">
                Authorized Trade Test Centers
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* About Section: Clean Two-Column Responsive Layout (Mobile & Laptop) */}
      <section id="about" className="py-14 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              About Us
            </h2>
            <div className="w-16 h-1.5 bg-blue-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Headline, Narrative, Service Cards, Trust & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  International Placement & Manpower Supply
                </span>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                  Bridging Global Employers with Certified Skilled Professionals
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Immigo operates as a dedicated international recruitment bridge. We assist individual candidates in qualifying for foreign vacancies through practical trade testing, visa processing, and deployment — while partnering with recruitment agencies and manpower suppliers with high-volume overseas projects and transparent commissions.
                </p>
              </div>

              {/* On Phone & Tablet: Image appears right after paragraph */}
              <div className="block lg:hidden w-full my-2">
                <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 aspect-16/9 max-h-[340px]">
                  <img
                    src="/about-deployment.jpg"
                    alt="Candidate Selection and Foreign Departure"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 right-3 text-white flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-600/95 backdrop-blur-xs w-fit">
                      Job Selection & Guaranteed Departure
                    </span>
                    <span className="text-[11px] font-medium text-slate-200">
                      100% Legal Work Visas & Emigration Clearances
                    </span>
                  </div>
                </div>
              </div>

              {/* Dual Service Cards: Candidate & Vendor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                        <Users size={15} />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">For Candidates</h4>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                      Access genuine foreign job vacancies, attend practical trade testing, interview preparation, embassy visa stamping, and international flight deployment.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    <Link
                      to="/register"
                      className="text-[11px] sm:text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline"
                    >
                      <span>Candidate Registration</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                        <Building2 size={15} />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">For Recruitment Vendors</h4>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                      Recruitment agencies can submit candidate batches, track interviews in real time, monitor visa stages, and receive verified milestone commission payouts.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    <Link
                      to="/vendor/register"
                      className="text-[11px] sm:text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
                    >
                      <span>Vendor Partner Registration</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Trust Checkmarks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-[11px] sm:text-xs text-slate-700 font-semibold pt-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>100% Legal Work Visas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Government Licensed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Verified Trade Testing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Dedicated Desk</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Phone size={14} />
                  <span>Contact Deployment Desk</span>
                </a>
                <Link
                  to="/candidate/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer"
                >
                  <span>Candidate Sign In</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Featured Image for Desktop (lg and up) */}
            <div className="hidden lg:block lg:col-span-5 w-full">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200 aspect-4/3 max-h-[440px] group">
                <img
                  src="/about-deployment.jpg"
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

      {/* Systematic Process Section */}
      <section id="process" className="py-14 sm:py-18 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Transparent 4-Step Cycle
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Overseas Deployment Process
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              A transparent, milestone-tracked workflow from initial registration to foreign departure.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-7xl mx-auto">
            {[
              {
                step: "01",
                title: "Registration & Profiling",
                desc: "Candidates or partner agencies register online with passport, trade documentation, and experience details.",
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
                  className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                        <Icon size={18} />
                      </div>
                      <span className="text-xl sm:text-2xl font-bold text-slate-200">
                        {st.step}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-1 sm:mb-1.5">
                      {st.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                      {st.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 sm:mt-4 sm:pt-3 border-t border-slate-100 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-blue-700">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>Verified Milestone</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrated Contact & Inquiry Section on Home Page */}
      <section id="contact" className="py-14 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              Contact Us
            </h2>
            <div className="w-16 h-1.5 bg-blue-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Contact Info Cards */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2.5">
                  Contact Us
                </h3>

                <div className="space-y-4 text-xs text-slate-700">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold">Head Office</span>
                      <span className="font-medium text-slate-800">
                        Immigo Overseas Tower, Commercial Plaza, New Delhi, India
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Phone size={16} />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold">Call / WhatsApp Desk</span>
                      <span className="font-bold text-slate-900">+91 98765 43210</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Mail size={16} />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold">Email Inquiry</span>
                      <span className="font-medium text-slate-800">inquiry@immigo.com</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock size={16} />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold">Working Hours</span>
                      <span className="font-medium text-slate-800">Mon - Sat: 9:30 AM to 6:30 PM (IST)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Direct Inquiry Form */}
            <div className="lg:col-span-7">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
                <div className="pb-3 border-b border-slate-200 mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Send an Instant Inquiry
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Our international placement team will respond within 24 hours.
                  </p>
                </div>

                {inquirySubmitted && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Inquiry submitted successfully! Our deployment desk will contact you soon.</span>
                  </div>
                )}

                <form onSubmit={handleInquirySubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Kumar"
                        value={inquiryForm.name}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Mobile Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="yourname@domain.com"
                        value={inquiryForm.email}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Inquiry Category
                      </label>
                      <select
                        value={inquiryForm.roleType}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, roleType: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
                      >
                        <option value="Candidate Seeking Overseas Job">Candidate Seeking Overseas Job</option>
                        <option value="Recruitment Agency / Vendor Partnership">Recruitment Agency / Vendor Partnership</option>
                        <option value="Foreign Employer Manpower Request">Foreign Employer Manpower Request</option>
                        <option value="General Question">General Question</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Your Message or Trade Skills
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Specify your technical trade (e.g. 6G Welder, Electrician) or manpower requirement details..."
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
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

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white pt-10 pb-6 border-t border-blue-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-white/10 items-start">
            <div className="space-y-3">
              <Link to="/" className="inline-block">
                <ImmiGoLogo size="sm" theme="light" subtitle="Manpower Supply" />
              </Link>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
                Certified international recruitment and overseas manpower supply agency connecting tested skilled professionals with global employers.
              </p>
            </div>

            <div className="md:text-center space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Quick Navigation
              </span>
              <nav className="flex flex-col md:items-center gap-2 text-xs font-semibold text-slate-300">
                <button
                  type="button"
                  onClick={() => scrollToSection("home")}
                  className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-xs font-semibold text-slate-300"
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("about")}
                  className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-xs font-semibold text-slate-300"
                >
                  About Us
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("process")}
                  className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-xs font-semibold text-slate-300"
                >
                  Process
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("contact")}
                  className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-xs font-semibold text-slate-300"
                >
                  Contact Us
                </button>
              </nav>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Corporate Address
              </span>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <MapPin size={15} className="text-blue-400 shrink-0 mt-0.5" />
                  <span>Immigo Overseas Tower, Commercial Plaza, New Delhi, India</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-blue-400 shrink-0" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-blue-400 shrink-0" />
                  <span>inquiry@immigo.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 flex-wrap">
              <span>&copy; {new Date().getFullYear()} Immigo Manpower Consultants</span>
              <span className="text-blue-400">&bull;</span>
              <span className="font-semibold text-cyan-300">Designed by White Gravity Web Solutions</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/candidate/login" className="hover:text-white">
                Candidate Sign In
              </Link>
              <span>&bull;</span>
              <Link to="/vendor/login" className="hover:text-white">
                Vendor Portal
              </Link>
              <span>&bull;</span>
              <Link to="/register" className="hover:text-white">
                Candidate Register
              </Link>
              <span>&bull;</span>
              <Link to="/vendor/register" className="hover:text-white">
                Vendor Register
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Quick-Contact Button */}
      <a
        href={
          import.meta.env.VITE_WHATSAPP_NUMBER
            ? `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER.replace(/[^0-9]/g, "")}?text=Hello%2C%20I%20want%20to%20know%20more%20about%20your%20services.`
            : `https://api.whatsapp.com/send?text=Hello%2C%20I%20want%20to%20know%20more%20about%20your%20services.`
        }
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-full shadow-lg shadow-emerald-950/30 flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
        aria-label="Contact on WhatsApp"
      >
        <MessageCircle size={22} />
        <span className="hidden sm:inline text-xs font-bold pr-1">WhatsApp Us</span>
      </a>
    </div>
  );
}
