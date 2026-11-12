import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Menu,
  X,
} from "lucide-react";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";

export default function ContactPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    inquiryType: "Overseas Manpower Supply (For Employer)",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleWhatsappSubmit = (e) => {
    e.preventDefault();
    const customMsg = form.message?.trim();
    const senderInfo = [
      form.name?.trim() ? `Name: ${form.name.trim()}` : "",
      form.phone?.trim() ? `Phone: ${form.phone.trim()}` : "",
      form.email?.trim() ? `Email: ${form.email.trim()}` : "",
      form.inquiryType ? `Category: ${form.inquiryType}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const messageBody = customMsg
      ? `Hello, I want to know more about your overseas recruitment services. ${customMsg}${senderInfo ? ` (${senderInfo})` : ""}`
      : `Hello, I want to know more about your overseas recruitment and manpower supply services.${senderInfo ? ` (${senderInfo})` : ""}`;

    const text = encodeURIComponent(messageBody);
    const phone = (import.meta.env.VITE_WHATSAPP_NUMBER || "919105921924").replace(/[^0-9]/g, "");
    const url = `https://wa.me/${phone}?text=${text}`;
    window.open(url, "_blank");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 8000);
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-slate-50 font-sans text-slate-900 selection:bg-[#0f2744] selection:text-white flex flex-col justify-between">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white border-b border-blue-800/80 shadow-md">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 shrink-0 min-w-0">
            <ImmiGoLogo size="sm" theme="light" subtitle="Manpower Supply" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 lg:gap-12 text-xs font-semibold text-blue-100">
            <Link to="/" className="hover:text-cyan-200 transition-colors">
              Home
            </Link>
            <a href="/#about" className="hover:text-cyan-200 transition-colors">
              About Us
            </a>
            <a href="/#process" className="hover:text-cyan-200 transition-colors">
              Process
            </a>
            <Link to="/contact" className="text-cyan-300 font-bold border-b-2 border-cyan-400 pb-0.5">
              Contact Us
            </Link>
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
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-semibold text-blue-100 hover:text-white flex items-center justify-between transition-colors"
                >
                  <span>Home</span>
                  <ArrowRight size={13} className="text-blue-300" />
                </Link>
                <a
                  href="/#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-semibold text-blue-100 hover:text-white flex items-center justify-between transition-colors"
                >
                  <span>About Us</span>
                  <ArrowRight size={13} className="text-blue-300" />
                </a>
                <a
                  href="/#process"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-semibold text-blue-100 hover:text-white flex items-center justify-between transition-colors"
                >
                  <span>Process</span>
                  <ArrowRight size={13} className="text-blue-300" />
                </a>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/15 text-xs font-semibold text-white flex items-center justify-between transition-colors"
                >
                  <span>Contact Us</span>
                  <ArrowRight size={13} className="text-cyan-300" />
                </Link>
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

      <main className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 w-full flex-1">
        <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-7 space-y-1.5">
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Get in Touch with Immigo
          </h1>
          <div className="w-14 h-1 bg-blue-600 mx-auto rounded-full" />
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl mx-auto">
            Send your overseas manpower requirement, vendor onboarding request, or candidate job inquiry directly to our Noida deployment desk.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-stretch">
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div className="flex-1 p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="border-b border-slate-100 pb-2.5">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Office &amp; Direct Contact
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click below to call, chat on WhatsApp, or email us directly.
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-2.5 text-xs">
                  <div className="col-span-2 lg:col-span-1 flex items-start gap-2.5 sm:gap-3 p-2 rounded-xl border border-transparent min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] text-slate-400 block font-semibold">Head Office</span>
                      <span className="text-[11px] sm:text-xs font-medium text-slate-800 leading-snug block break-words">
                        D 1, 4th Floor, Ozone Arcade, Jupiter Enclave, Sector 104, Gautam Budh Nagar, Uttar Pradesh - 201302
                      </span>
                    </div>
                  </div>

                  <a
                    href="tel:+919105921927"
                    className="flex items-start gap-2 sm:gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 min-w-0 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Phone size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] text-slate-400 block font-semibold">Call Support</span>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-900 group-hover:text-blue-700 break-words leading-snug block">
                        +91 91059 21927
                      </span>
                    </div>
                  </a>

                  <a
                    href="https://wa.me/919105921924"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-2 sm:gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 min-w-0 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageCircle size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] text-slate-400 block font-semibold">WhatsApp Desk</span>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-900 group-hover:text-emerald-700 break-words leading-snug block">
                        +91 91059 21924
                      </span>
                    </div>
                  </a>

                  <a
                    href="mailto:immigoeducare@gmail.com"
                    className="col-span-2 lg:col-span-1 flex items-start gap-2.5 sm:gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 min-w-0 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Mail size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] text-slate-400 block font-semibold">Email Desk</span>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-blue-700 group-hover:underline break-all leading-snug block">
                        immigoeducare@gmail.com
                      </span>
                    </div>
                  </a>

                  <div className="col-span-2 lg:col-span-1 flex items-start gap-2.5 sm:gap-3 p-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] text-slate-400 block font-semibold">Working Hours</span>
                      <span className="text-[11px] sm:text-xs font-medium text-slate-700 leading-snug block">
                        Mon - Sat: 9:30 AM to 6:30 PM (IST)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                <a
                  href="tel:+919105921927"
                  className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 text-[11px] font-bold transition-colors"
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
                  className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-800 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-[11px] font-bold transition-colors"
                >
                  <Mail size={13} className="shrink-0" />
                  <span>Email Us</span>
                </a>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-tr from-[#0f2744] to-[#163660] text-white rounded-2xl shadow-xs space-y-1.5 text-xs shrink-0">
              <div className="flex items-center gap-2 font-bold text-sm text-cyan-300">
                <ShieldCheck size={16} />
                <span>Government Certified</span>
              </div>
              <p className="text-slate-200 leading-relaxed text-[11.5px]">
                Immigo is a licensed overseas manpower deployment consultancy with verified trade testing centers and direct employer tie-ups across the Gulf and Europe.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <div className="h-full bg-white rounded-2xl border border-slate-200 shadow-md p-4 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-[#0f2744]">Send an Instant Inquiry</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Our international placement team will respond within 24 hours via WhatsApp.
                  </p>
                </div>

                {submitted && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Your inquiry has been opened in WhatsApp. Our deployment desk will connect shortly.</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleWhatsappSubmit} className="mt-4 space-y-3.5 flex-1 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="min-w-0">
                      <label className="block text-[10.5px] sm:text-[11px] font-bold text-slate-700 mb-0.5 truncate">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="block text-[10.5px] sm:text-[11px] font-bold text-slate-700 mb-0.5 truncate">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="yourname@domain.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Purpose of Inquiry
                    </label>
                    <select
                      value={form.inquiryType}
                      onChange={(e) => setForm({ ...form, inquiryType: e.target.value })}
                      className="w-full min-w-0 max-w-full truncate px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium cursor-pointer"
                    >
                      <option value="Overseas Manpower Supply (For Employer)">Overseas Manpower Supply (For Employer)</option>
                      <option value="Job Opportunity Inquiry (For Candidate)">Job Opportunity Inquiry (For Candidate)</option>
                      <option value="Visa & Embassy Processing">Visa &amp; Embassy Processing</option>
                      <option value="Vendor / Partner Network">Vendor / Partner Network</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Message Details
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Describe trades required (e.g. 6G Welder, Electrician), quantity of workers, destination country or question..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
                >
                  <Send size={14} />
                  <span>Send Inquiry to Deployment Desk</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

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
                Quick Links
              </span>
              <nav className="flex flex-col md:items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-300">
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
                <a href="/#about" className="hover:text-white transition-colors">About Us</a>
                <a href="/#process" className="hover:text-white transition-colors">Process</a>
                <Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link>
              </nav>
            </div>

            <div className="col-span-1 space-y-2 min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider block">
                Corporate Address
              </span>
              <div className="space-y-1.5 text-[10.5px] sm:text-xs text-slate-300">
                <div className="flex items-start gap-1.5">
                  <MapPin size={13} className="text-blue-400 shrink-0 mt-0.5" />
                  <span className="min-w-0 break-words leading-snug">
                    D 1, 4th Floor, Ozone Arcade, Jupiter Enclave, Sector 104, Gautam Budh Nagar, Uttar Pradesh - 201302
                  </span>
                </div>
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
              <Link to="/vendor/login" className="hover:text-white">Vendor Portal</Link>
              <span>&bull;</span>
              <Link to="/vendor/register" className="hover:text-white">Vendor Register</Link>
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
