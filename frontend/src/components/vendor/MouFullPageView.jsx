import React, { useState, useRef } from "react";
import {
  FileText,
  Printer,
  Download,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Send,
  Calendar,
  Percent,
  Clock,
  Briefcase,
  AlertCircle,
  PenTool,
  Check,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";

export default function MouFullPageView({
  vendor,
  mode = "preview", // "draft" | "preview" | "sign"
  onBack,
  onSuccess,
  onApprove,
}) {
  const printRef = useRef(null);

  // Draft Form States for Admin
  const [agreementDate, setAgreementDate] = useState(
    vendor?.mouDocument?.agreementDate || new Date().toISOString().split("T")[0]
  );
  const [validityYears, setValidityYears] = useState(
    vendor?.mouDocument?.validityYears || "1 Year"
  );
  const [commissionRate, setCommissionRate] = useState(
    vendor?.mouDocument?.commissionRate || "8.33% / 1 Month Gross Salary per Candidate"
  );
  const [paymentTerms, setPaymentTerms] = useState(
    vendor?.mouDocument?.paymentTerms || "30 Days from candidate successful deployment"
  );
  const [replacementPeriod, setReplacementPeriod] = useState(
    vendor?.mouDocument?.replacementPeriod || "90 Days free replacement warranty"
  );
  const [sectors, setSectors] = useState(
    vendor?.mouDocument?.sectors || "Construction, MEP, Hospitality, Logistics, Oil & Gas"
  );
  const [specialClauses, setSpecialClauses] = useState(
    vendor?.mouDocument?.specialClauses ||
      "1. Candidate passports and credentials must be authentic.\n2. No unauthorized recruitment fees shall be charged to candidate workers.\n3. Complete adherence to MEA (India) and destination country labor guidelines."
  );
  const [adminSignatoryName, setAdminSignatoryName] = useState(
    vendor?.mouDocument?.adminSignatoryName || "Director of Global Operations"
  );
  const [adminDesignation, setAdminDesignation] = useState(
    vendor?.mouDocument?.adminDesignation || "Director - Global Alliances, Vista Oversees"
  );

  // Vendor Signature States (for signing mode)
  const [signatoryName, setSignatoryName] = useState(
    vendor?.contactPersonName || vendor?.companyName || ""
  );
  const [designation, setDesignation] = useState("Managing Director");
  const [signatureText, setSignatureText] = useState(
    vendor?.contactPersonName || vendor?.companyName || ""
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const mouRefNumber = `MOU-VND-${vendor?.vendorId || vendor?.id || "001"}-2026`;

  const handlePrint = () => {
    window.print();
  };

  // Admin submits draft and sends official MOU to vendor
  const handleAdminSendMou = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const mouPayload = {
        agreementDate,
        validityYears,
        commissionRate,
        paymentTerms,
        replacementPeriod,
        sectors,
        specialClauses,
        adminSignatoryName,
        adminDesignation,
      };

      await crmVendorService.approveDocsAndSendMou(vendor.id || vendor.vendorId, mouPayload);
      setSuccessMsg("Official Memorandum of Understanding (MOU) sent to vendor successfully!");
      if (onSuccess) {
        setTimeout(() => onSuccess(mouPayload), 1000);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to send MOU to vendor.");
    } finally {
      setLoading(false);
    }
  };

  // Vendor signs and accepts MOU
  const handleVendorSignSubmit = async (e) => {
    e.preventDefault();
    if (!signatoryName.trim()) {
      setErrorMsg("Please provide your full legal name as authorized signatory.");
      return;
    }
    if (!agreedToTerms) {
      setErrorMsg("Please acknowledge and accept the agreement terms.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      await crmVendorService.signVendorMou({
        signatoryName: signatoryName.trim(),
        designation: designation.trim(),
        signatureData: signatureText.trim() || signatoryName.trim(),
      });
      setSuccessMsg("MOU signed and executed successfully! Your dashboard is now activated.");
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1200);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to sign MOU.");
    } finally {
      setLoading(false);
    }
  };

  const isSigned =
    vendor?.mouSigned ||
    vendor?.mouStatus === "Signed" ||
    vendor?.mouStatus === "Approved" ||
    vendor?.signedMou?.signedAt;

  return (
    <div className="w-full space-y-6 pb-16 animate-fadeIn font-sans text-slate-800">
      {/* Top Header / Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              type="button"
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                Official Document
              </span>
              <span className="text-xs font-mono text-slate-400">Ref: {mouRefNumber}</span>
              {isSigned ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Digitally Signed & Active
                </span>
              ) : mode === "draft" ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Drafting Terms
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Awaiting Vendor Signature
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
              Memorandum of Understanding (MOU)
            </h1>
            <p className="text-xs text-slate-500">
              Overseas Manpower Sourcing Partnership &bull; {vendor?.companyName || "Vendor Partner"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handlePrint}
            type="button"
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Download or Save MOU as PDF"
          >
            <Download size={15} />
            <span>Download MOU</span>
          </button>
          <button
            onClick={handlePrint}
            type="button"
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>
          {onApprove && (
            <button
              onClick={onApprove}
              type="button"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/30"
            >
              <CheckCircle2 size={15} />
              <span>Approve MOU & Finalize</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ADMIN DRAFTING FORM (Only shown when mode === "draft") */}
      {mode === "draft" && (
        <form
          onSubmit={handleAdminSendMou}
          className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6 space-y-6"
        >
          <div className="border-b border-indigo-100 pb-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-indigo-600" />
              <span>Configure MOU Agreement Terms for {vendor?.companyName}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize commercial commissions, deployment validity, payment terms, and warranty period before issuing the official legal agreement to this vendor.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-medium">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Agreement Effective Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={agreementDate}
                onChange={(e) => setAgreementDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-indigo-500 font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Validity Duration <span className="text-rose-500">*</span>
              </label>
              <select
                value={validityYears}
                onChange={(e) => setValidityYears(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-indigo-500 font-sans"
              >
                <option value="1 Year">1 Year (Renewable)</option>
                <option value="2 Years">2 Years (Renewable)</option>
                <option value="3 Years">3 Years (Renewable)</option>
                <option value="5 Years">5 Years</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Placement Commission / Sourcing Fee <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                placeholder="e.g. 8.33% / 1 Month Gross Salary or ₹35,000"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-indigo-500 font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Payment Settlement Terms <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. 30 Days from candidate deployment"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-indigo-500 font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Candidate Replacement Warranty <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={replacementPeriod}
                onChange={(e) => setReplacementPeriod(e.target.value)}
                placeholder="e.g. 90 Days free replacement warranty"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-indigo-500 font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Permitted Sourcing Sectors <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sectors}
                onChange={(e) => setSectors(e.target.value)}
                placeholder="e.g. Construction, MEP, Hospitality, Logistics"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-indigo-500 font-sans"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Special Clauses & Ethical Recruitment Covenants
              </label>
              <textarea
                rows={3}
                value={specialClauses}
                onChange={(e) => setSpecialClauses(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-indigo-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Admin Signatory Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={adminSignatoryName}
                onChange={(e) => setAdminSignatoryName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-indigo-500 font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Admin Designation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={adminDesignation}
                onChange={(e) => setAdminDesignation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-indigo-500 font-sans"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              Review live preview below. Upon sending, vendor receives instant notification & signing access.
            </span>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <span>Sending Official MOU...</span>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send Official MOU to Vendor</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* FULL LEGAL MOU DOCUMENT PAGE (Printable & High Quality) */}
      <div
        ref={printRef}
        className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-12 font-serif text-slate-800 text-sm leading-relaxed space-y-8 select-text"
      >
        {/* Document Header */}
        <div className="text-center border-b-2 border-slate-900 pb-8 space-y-3">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 font-sans text-xs font-black uppercase tracking-widest mb-1">
            ImmiGo Global &bull; Vista Overseas Workforce
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-sans uppercase">
            MEMORANDUM OF UNDERSTANDING (MOU)
          </h2>
          <p className="text-sm text-slate-600 font-sans font-medium uppercase tracking-wider">
            FOR OVERSEAS MANPOWER SOURCING & RECRUITMENT PARTNERSHIP
          </p>
          <div className="text-xs font-mono text-slate-500 pt-2 flex items-center justify-center gap-4 flex-wrap">
            <span>Reference ID: <strong className="text-slate-900">{mouRefNumber}</strong></span>
            <span>&bull;</span>
            <span>Effective Date: <strong className="text-slate-900">{agreementDate}</strong></span>
            <span>&bull;</span>
            <span>Validity: <strong className="text-slate-900">{validityYears}</strong></span>
          </div>
        </div>

        {/* Parties Intro */}
        <div className="space-y-4 font-sans text-xs sm:text-sm bg-slate-50/80 p-6 rounded-2xl border border-slate-200 text-slate-700">
          <p className="leading-relaxed">
            This Memorandum of Understanding (hereinafter referred to as the <b>"MOU"</b>) is entered into on this{" "}
            <b>{agreementDate}</b>, by and between:
          </p>
          <div className="pl-5 border-l-3 border-blue-600 space-y-3">
            <p>
              <b>FIRST PARTY (The Company):</b>{" "}
              <span className="font-bold text-slate-900">Vista Overseas Solutions / ImmiGo Global Overseas</span>, having its principal corporate operations in India, engaged in overseas recruitment, talent sourcing, and human capital deployment (hereinafter referred to as the <b>"First Party"</b>).
            </p>
            <p className="text-center font-bold text-slate-400 font-sans text-xs uppercase tracking-widest my-1">- AND -</p>
            <p>
              <b>SECOND PARTY (The Recruitment Partner / Vendor):</b>{" "}
              <span className="font-bold text-slate-900">{vendor?.companyName || "Vendor Agency"}</span>, having registered business registration number{" "}
              <b>{vendor?.registrationNumber || "Applied/Verified"}</b>, with primary office address located at{" "}
              <b>{vendor?.address || `${vendor?.city || "Mumbai"}, ${vendor?.state || "Maharashtra"}, ${vendor?.country || "India"}`}</b>, represented by its authorized representative{" "}
              <b>{vendor?.contactPersonName || "Authorized Signatory"}</b> (hereinafter referred to as the <b>"Second Party"</b>).
            </p>
          </div>
        </div>

        {/* Commercial Parameters Box */}
        <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-200 font-sans text-xs sm:text-sm space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-blue-950 flex items-center gap-2">
            <Briefcase size={16} className="text-blue-700" />
            <span>Key Commercial & Sourcing Covenants</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-xl border border-blue-100">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Placement Fee / Commission</span>
              <span className="font-bold text-slate-900">{commissionRate}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-blue-100">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Payment Milestone</span>
              <span className="font-bold text-slate-900">{paymentTerms}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-blue-100">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Replacement Warranty</span>
              <span className="font-bold text-slate-900">{replacementPeriod}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-blue-100">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Permitted Sectors</span>
              <span className="font-bold text-slate-900">{sectors}</span>
            </div>
          </div>
        </div>

        {/* Detailed Agreement Clauses */}
        <div className="space-y-6 font-sans text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div>
            <h3 className="font-black text-slate-900 font-sans text-sm uppercase tracking-wide border-b border-slate-200 pb-1 mb-2">
              1. Purpose & Scope of Partnership
            </h3>
            <p className="text-justify leading-relaxed">
              The First Party regularly receives demands for skilled, semi-skilled, and professional manpower from verified international employers. The Second Party represents and warrants that it possesses the requisite infrastructure, technical capability, and statutory eligibility to mobilize, screen, and submit qualified candidates for such requirements across approved jurisdictions.
            </p>
          </div>

          <div>
            <h3 className="font-black text-slate-900 font-sans text-sm uppercase tracking-wide border-b border-slate-200 pb-1 mb-2">
              2. Statutory & Ethical Recruitment Compliance
            </h3>
            <p className="text-justify leading-relaxed">
              The Second Party strictly covenants that it adheres to all applicable emigration laws, Ministry of External Affairs regulations, and international fair recruitment conventions (ILO Fair Recruitment). The Second Party shall <b>NOT</b> charge unauthorized illegal visa fees, engage in candidate extortion, or misrepresent job descriptions to candidates. Any violation shall lead to immediate termination and blacklisting.
            </p>
          </div>

          <div>
            <h3 className="font-black text-slate-900 font-sans text-sm uppercase tracking-wide border-b border-slate-200 pb-1 mb-2">
              3. Candidate Verification & Dossiers
            </h3>
            <p className="text-justify leading-relaxed">
              The Second Party guarantees that all candidate credentials submitted through the portal—including educational diplomas, trade test certifications, passport details, and medical fitness (GAMCA/approved clinic reports)—are authentic and thoroughly pre-screened prior to presentation.
            </p>
          </div>

          <div>
            <h3 className="font-black text-slate-900 font-sans text-sm uppercase tracking-wide border-b border-slate-200 pb-1 mb-2">
              4. Commercial Terms & Settlement
            </h3>
            <p className="text-justify leading-relaxed">
              Commercial commission is agreed at <b>{commissionRate}</b>. Settlement shall be processed according to <b>{paymentTerms}</b> via direct bank transfer to the verified bank account provided by the Second Party.
            </p>
          </div>

          <div>
            <h3 className="font-black text-slate-900 font-sans text-sm uppercase tracking-wide border-b border-slate-200 pb-1 mb-2">
              5. Replacement Guarantee
            </h3>
            <p className="text-justify leading-relaxed">
              The Second Party provides a warranty of <b>{replacementPeriod}</b> for any mobilized candidate. In the event a deployed candidate absconds, fails technical probation, or is deemed medically unfit during this guarantee window, the Second Party shall provide a qualified replacement candidate free of charge.
            </p>
          </div>

          <div>
            <h3 className="font-black text-slate-900 font-sans text-sm uppercase tracking-wide border-b border-slate-200 pb-1 mb-2">
              6. Confidentiality & Non-Circumvention
            </h3>
            <p className="text-justify leading-relaxed">
              The Second Party agrees not to circumvent, contact, or solicit direct business from international employer clients introduced by the First Party for a period of twenty-four (24) months following the termination of this agreement.
            </p>
          </div>

          <div>
            <h3 className="font-black text-slate-900 font-sans text-sm uppercase tracking-wide border-b border-slate-200 pb-1 mb-2">
              7. Special Covenants
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs whitespace-pre-line text-slate-800">
              {specialClauses}
            </div>
          </div>
        </div>

        {/* Execution & Signatures Block */}
        <div className="pt-8 border-t-2 border-slate-300 font-sans">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-6 text-center">
            EXECUTED BY DULY AUTHORIZED REPRESENTATIVES
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* First Party Signature */}
            <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-blue-900">FIRST PARTY (Licensor)</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={12} /> Digitally Sealed
                </span>
              </div>
              <div className="font-serif italic text-xl text-blue-950 font-black border-b border-blue-200 pb-2">
                {adminSignatoryName}
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <p><b>Authority:</b> {adminDesignation}</p>
                <p><b>Company:</b> Vista Overseas Solutions / ImmiGo Global</p>
                <p className="font-mono text-[10px] text-slate-400">Date: {agreementDate}</p>
              </div>
            </div>

            {/* Second Party Signature */}
            <div className="p-5 rounded-2xl border border-slate-300 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-slate-900">SECOND PARTY (Vendor Partner)</span>
                {isSigned ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={12} /> Digitally Executed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Pending Signature
                  </span>
                )}
              </div>

              {isSigned ? (
                <div className="font-serif italic text-xl text-indigo-900 font-black border-b border-slate-300 pb-2">
                  {vendor?.signedMou?.signatureData || vendor?.contactPersonName || "Signed Electronically"}
                </div>
              ) : (
                <div className="py-2 border-b border-dashed border-slate-300 text-slate-400 text-xs italic">
                  [Awaiting Digital Execution by {vendor?.companyName}]
                </div>
              )}

              <div className="text-xs text-slate-600 space-y-0.5">
                <p>
                  <b>Signatory:</b>{" "}
                  {vendor?.signedMou?.signatoryName || vendor?.contactPersonName || "Authorized Signatory"}
                </p>
                <p>
                  <b>Designation:</b>{" "}
                  {vendor?.signedMou?.designation || "Managing Director"}
                </p>
                <p>
                  <b>Agency:</b> {vendor?.companyName}
                </p>
                {vendor?.signedMou?.signedAt && (
                  <p className="font-mono text-[10px] text-emerald-600">
                    Executed: {new Date(vendor.signedMou.signedAt).toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VENDOR SIGNING BOX (When vendor is reviewing to execute signature) */}
      {(mode === "sign" || (!isSigned && mode === "preview" && vendor?.role === "vendor")) && (
        <form
          onSubmit={handleVendorSignSubmit}
          className="bg-white rounded-2xl border border-indigo-200 shadow-md p-6 sm:p-8 space-y-6"
        >
          <div className="border-b border-indigo-100 pb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-indigo-600" />
              <span>Digital Execution & Acceptance</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Please enter your legal signatory particulars to digitally seal and execute this Partnership MOU.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Authorized Signatory Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                placeholder="Full Legal Name"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Designation / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Managing Director / Partner"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-indigo-500"
              />
            </div>
          </div>

          {/* Signature Stamp Preview */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
            <label className="text-xs font-bold text-indigo-950 block">Digital Signature Stamp Preview</label>
            <div className="p-4 bg-white rounded-lg border border-indigo-200 text-center">
              <p className="font-serif italic text-2xl text-indigo-900 font-black tracking-wide">
                {signatureText || signatoryName || "Your Signature"}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-1">
                Cryptographically tied to {vendor?.email} &bull; {new Date().toLocaleDateString("en-IN")}
              </p>
            </div>
            <input
              type="text"
              value={signatureText}
              onChange={(e) => setSignatureText(e.target.value)}
              placeholder="Type your signature text"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
            />
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs text-slate-700 font-medium">
            <input
              type="checkbox"
              required
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>
              I hereby declare that I am the legally authorized representative of <b>{vendor?.companyName}</b> and agree to abide by all covenants, commercial commissions, and ethical recruitment guidelines stated in this Memorandum of Understanding (MOU).
            </span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <span>Executing MOU...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Digitally Sign & Activate Portal</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
