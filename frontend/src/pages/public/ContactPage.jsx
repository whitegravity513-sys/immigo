import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";

export default function ContactPage() {
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
    const text = `Hello Immigo Team,%0A%0A*Name:* ${encodeURIComponent(form.name || "Client/Candidate")}%0A*Phone:* ${encodeURIComponent(form.phone || "Not provided")}%0A*Email:* ${encodeURIComponent(form.email || "Not provided")}%0A*Inquiry:* ${encodeURIComponent(form.inquiryType)}%0A*Message:* ${encodeURIComponent(form.message || "I want to inquire about overseas manpower deployment.")}`;
    window.open(`https://wa.me/919876543210?text=${text}`, "_blank");
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-[#0f2744] selection:text-white flex flex-col justify-between">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white border-b border-blue-800/80 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ImmiGoLogo size="sm" theme="light" subtitle="Manpower Supply" />
          </Link>

          <nav className="hidden md:flex items-center gap-10 sm:gap-12 text-xs font-semibold text-blue-100">
            <Link to="/" className="hover:text-cyan-200 transition-colors">
              Home
            </Link>
            <a href="/#about" className="hover:text-cyan-200 transition-colors">
              About
            </a>
            <a href="/#process" className="hover:text-cyan-200 transition-colors">
              Process
            </a>
            <Link to="/contact" className="text-cyan-300 font-bold border-b-2 border-cyan-400 pb-0.5">
              Contact Us
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              to="/candidate/login"
              className="px-3 py-1.5 text-xs font-bold text-blue-200 hover:text-white border border-blue-700/60 hover:bg-blue-800/60 rounded-lg transition-all cursor-pointer"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-all cursor-pointer"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="text-center max-w-2xl mx-auto mb-7 space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Get in Touch with Immigo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl mx-auto">
            Send your overseas manpower requirement or candidate job inquiry directly to our recruitment team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Direct Contact Information
              </h2>

              <div className="space-y-3 text-xs">

                <div className="flex items-start gap-3 p-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <Phone size={15} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Phone Support</span>
                    <span className="text-xs font-bold text-slate-800">+91 9876543210 / +91 11 2345 6789</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <Mail size={15} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Email Desk</span>
                    <span className="text-xs font-bold text-slate-800">inquiry@immigo.com</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <MapPin size={15} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Corporate Head Office</span>
                    <span className="text-xs text-slate-700 leading-snug block">
                      Immigo Overseas Manpower Tower, Commercial Plaza, New Delhi, India
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <Clock size={15} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Working Hours</span>
                    <span className="text-xs text-slate-700">Mon - Sat: 9:30 AM to 6:30 PM (IST)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-tr from-[#0f2744] to-[#163660] text-white rounded-2xl shadow-xs space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-sm text-cyan-300">
                <ShieldCheck size={16} />
                <span>Government Certified</span>
              </div>
              <p className="text-slate-200 leading-relaxed text-[11.5px]">
                Immigo is a fully licensed overseas manpower deployment consultancy with verified trade testing centers and direct employer tie-ups across the Gulf and Europe.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-7 relative">
              <div className="pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-[#0f2744]">Direct Inquiry Form</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Fills your message and redirects directly to WhatsApp (+91 9876543210)
                </p>
              </div>

              {submitted && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Your message has been transferred to WhatsApp. We will connect shortly.</span>
                </div>
              )}

              <form onSubmit={handleWhatsappSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Phone Number (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="client@company.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Overseas Manpower Supply (For Employer)">Overseas Manpower Supply (For Employer)</option>
                    <option value="Job Opportunity Inquiry (For Candidate)">Job Opportunity Inquiry (For Candidate)</option>
                    <option value="Visa & Embassy Processing">Visa & Embassy Processing</option>
                    <option value="Vendor / Partner Network">Vendor / Partner Network</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Message Details
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe trades required, quantity of workers, destination country or question..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send size={14} />
                  <span>Send Enquiry</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#0f2744] text-white pt-10 pb-6 border-t border-blue-900 mt-auto">
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
                Quick Links
              </span>
              <nav className="flex flex-col md:items-center gap-2 text-xs font-semibold text-slate-300">
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
                <a href="/#about" className="hover:text-white transition-colors">About</a>
                <a href="/#process" className="hover:text-white transition-colors">Process</a>
                <Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link>
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
                  <span>+91 9876543210</span>
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
              <Link to="/candidate/login" className="hover:text-white">Candidate Sign In</Link>
              <span>&bull;</span>
              <Link to="/vendor/login" className="hover:text-white">Vendor Portal</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
