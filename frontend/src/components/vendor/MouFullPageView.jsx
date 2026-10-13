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
  Landmark,
  Scale,
  FileCheck,
  ListOrdered,
  Layers,
  ChevronDown,
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
  const [activeTab, setActiveTab] = useState("all"); // "all" | "clauses" | "annex1" | "annex2" | "annex3" | "signatures"

  // Dynamic Party Particulars
  const firstPartyName = "IMMIGO EDUCARE LLP";
  const firstPartyLLPIN = "ACP - 1662";
  const firstPartyAddress =
    "C-76, BASEMENT, SECTOR-88, PHASE-2, NOIDA, BISRAKH POLICE STATION, NOIDA, GAUTAM BUDDHA NAGAR - 201301, UTTAR PRADESH, INDIA";
  const firstPartyRep = "MR. HIMANSHU SINGH";
  const firstPartyDesignation = "MANAGING PARTNER";

  const secondPartyName = vendor?.companyName || "MAYURI IMMIGRATION AND PROPERTIES";
  const secondPartyAddress =
    vendor?.address ||
    (vendor?.city && vendor?.state
      ? `${vendor.address || "Main Office"}, ${vendor.city}, ${vendor.state} - ${vendor.pincode || "560049"}, ${vendor.country || "INDIA"}`
      : "SHOP NO. 34, GROUND FLOOR, BIDARAHALLI HOBLI, KADA AGRAHARA, BENGALURU, KARNATAKA – 560049, INDIA");
  const secondPartyRep =
    vendor?.contactPersonName || vendor?.ownerName || "MR. SADIQ BASHA";
  const secondPartyDesignation = vendor?.designation || "MANAGING PARTNER";
  const secondPartyCoRep =
    vendor?.coSignatory || "MRS. ANSHARA SADIQ (DESIGNATED PARTNER)";

  // Draft Form States for Admin
  const [agreementDate, setAgreementDate] = useState(
    vendor?.mouDocument?.agreementDate || "16 February, 2026"
  );
  const [executionPlace, setExecutionPlace] = useState("NOIDA");
  const [validityYears, setValidityYears] = useState(
    vendor?.mouDocument?.validityYears || "One (1) Year"
  );
  const [stage1Fee, setStage1Fee] = useState(vendor?.mouDocument?.stage1Fee || "As per project demand");
  const [stage2Fee, setStage2Fee] = useState(vendor?.mouDocument?.stage2Fee || "As per project demand");
  const [stage3Fee, setStage3Fee] = useState(vendor?.mouDocument?.stage3Fee || "As per project demand");
  const [processingCharge, setProcessingCharge] = useState(
    vendor?.mouDocument?.processingCharge || "₹ 20,000.00 (INR TWENTY THOUSAND ONLY)"
  );
  const [adminSignatoryName, setAdminSignatoryName] = useState(
    vendor?.mouDocument?.adminSignatoryName || firstPartyRep
  );
  const [adminDesignation, setAdminDesignation] = useState(
    vendor?.mouDocument?.adminDesignation || firstPartyDesignation
  );

  // Vendor Signature States (for signing mode)
  const [signatoryName, setSignatoryName] = useState(
    vendor?.contactPersonName || secondPartyRep || ""
  );
  const [designation, setDesignation] = useState(secondPartyDesignation);
  const [signatureText, setSignatureText] = useState(
    vendor?.contactPersonName || secondPartyRep || ""
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const mouRefNumber = `MOU-VND-${vendor?.vendorId || vendor?.id || "1001"}-2026`;

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
        executionPlace,
        validityYears,
        stage1Fee,
        stage2Fee,
        stage3Fee,
        processingCharge,
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
    <div className="w-full space-y-6 pb-16 animate-fadeIn font-sans text-slate-900 bg-slate-50 min-h-screen">
      <style>{`
        @media print {
          @page {
            margin: 1.2cm;
            size: A4 portrait;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .mou-print-hide, .print\\:hidden {
            display: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .mou-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }
        }
      `}</style>

      {/* Top Header / Action Bar */}
      <div className="mou-print-hide print:hidden bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 z-10 backdrop-blur-md bg-white/95">
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
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
                Official Legal Contract
              </span>
              <span className="text-xs font-mono text-slate-500 font-semibold">Ref: {mouRefNumber}</span>
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
              IMMIGO EDUCARE LLP &bull; {secondPartyName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handlePrint}
            type="button"
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Download or Save MOU as PDF"
          >
            <Download size={15} />
            <span>Download MOU</span>
          </button>
          <button
            onClick={handlePrint}
            type="button"
            className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer size={15} />
            <span>Print Official MOU</span>
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

      {/* Quick Navigation Tabs */}
      <div className="mou-print-hide print:hidden bg-white rounded-xl border border-slate-200 p-1.5 flex items-center gap-1.5 overflow-x-auto text-xs font-bold text-slate-600">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "all" ? "bg-blue-900 text-white shadow-xs" : "hover:bg-slate-100"
          }`}
        >
          Complete Document
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("clauses")}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "clauses" ? "bg-blue-900 text-white shadow-xs" : "hover:bg-slate-100"
          }`}
        >
          Main Clauses (1-22)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("annex1")}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "annex1" ? "bg-blue-900 text-white shadow-xs" : "hover:bg-slate-100"
          }`}
        >
          Annexure 1 (Fee & Bank Details)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("annex2")}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "annex2" ? "bg-blue-900 text-white shadow-xs" : "hover:bg-slate-100"
          }`}
        >
          Annexure 2 (Workflow)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("annex3")}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "annex3" ? "bg-blue-900 text-white shadow-xs" : "hover:bg-slate-100"
          }`}
        >
          Annexure 3 (Document Checklist)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("signatures")}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "signatures" ? "bg-blue-900 text-white shadow-xs" : "hover:bg-slate-100"
          }`}
        >
          Execution Signatures
        </button>
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
          className="mou-print-hide print:hidden bg-white rounded-2xl border border-indigo-200 shadow-sm p-6 space-y-6"
        >
          <div className="border-b border-indigo-100 pb-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-indigo-600" />
              <span>Configure MOU Agreement Terms for {secondPartyName}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review particulars and commercial parameters before dispatching the official legal contract.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Agreement Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={agreementDate}
                onChange={(e) => setAgreementDate(e.target.value)}
                placeholder="e.g. 16 February, 2026"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Place of Execution <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={executionPlace}
                onChange={(e) => setExecutionPlace(e.target.value)}
                placeholder="e.g. NOIDA"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Validity Duration <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={validityYears}
                onChange={(e) => setValidityYears(e.target.value)}
                placeholder="e.g. One (1) Year"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Non-Refundable Processing Charge
              </label>
              <input
                type="text"
                value={processingCharge}
                onChange={(e) => setProcessingCharge(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              Review live preview below. Upon dispatch, vendor receives instant notification & digital signing access.
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

      {/* FULL LEGAL MOU DOCUMENT PAGE (Printable & High Quality Matching Sample PDF) */}
      <div
        ref={printRef}
        className="mou-sheet max-w-4xl mx-auto bg-white rounded-2xl border border-slate-300 shadow-xl p-8 sm:p-14 font-serif text-slate-900 text-sm leading-relaxed space-y-8 select-text"
      >
        {/* ========================================================================= */}
        {/* HEADER & PARTIES RECITAL */}
        {/* ========================================================================= */}
        <div className="text-center space-y-2 border-b-2 border-slate-900 pb-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 uppercase font-sans">
            MEMORANDUM OF UNDERSTANDING (MOU)
          </h2>
          <p className="text-xs font-mono text-slate-500">
            Reference Document No: <strong className="text-slate-900">{mouRefNumber}</strong>
          </p>
        </div>

        <div className="space-y-4 text-justify leading-relaxed">
          <p>
            This Memorandum of Understanding (“<b>MOU</b>”) is entered on <b>{agreementDate}</b> at <b>{executionPlace}</b>, by
          </p>

          <p>
            “<b>{firstPartyName}</b>”, a Limited Liability Partnership incorporated under the LLP Act, 2008, having LLP Identification Number (LLPIN) <b>{firstPartyLLPIN}</b>, and its registered office at <b>{firstPartyAddress}</b>, acting through its authorized representative <b>{adminSignatoryName}</b>, <b>{adminDesignation}</b> (hereinafter referred to as the “<b>FIRST PARTY</b>”, which expression shall, unless repugnant to the context or meaning thereof, be deemed to mean and include its successors and permitted assigns);
          </p>

          <p className="text-center font-bold font-sans text-xs uppercase tracking-widest my-2">
            AND
          </p>

          <p>
            <b>{secondPartyName}</b>, Office at <b>{secondPartyAddress}</b>, represented by <b>{secondPartyRep} ({secondPartyDesignation})</b> & <b>{secondPartyCoRep}</b>, which is the Second Party here in after referred to as the <b>BUSINESS ASSOCIATE</b> (which expression shall unless it be repugnant to the context or meaning thereof be deemed to mean and include its/his/her successors, legal heirs, nominees and permitted assignees, as the case may be) of the <b>SECOND PARTY / BUSINESS ASSOCIATES</b>.
          </p>

          <p>
            <b>{firstPartyName}</b> and <b>{secondPartyName}</b> are individually referred to as First Party & Second Party respectively, and collectively referred to as Parties.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* DEFINITIONS */}
        {/* ========================================================================= */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-base uppercase font-sans tracking-tight border-b border-slate-300 pb-1">
            DEFINITIONS
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-justify">
            <li>
              “<b>First Party</b>” – Immigo Educare LLP, the entity responsible for providing recruitment and immigration services.
            </li>
            <li>
              “<b>Second Party</b>” / “<b>Business Associate</b>” – The B2B partner engaging with the First Party under this MoU.
            </li>
            <li>
              “<b>Candidate</b>” – Any individual whose profile is submitted by the Second Party to the First Party for overseas employment processing.
            </li>
            <li>
              “<b>Shortlisted Candidate</b>” – A candidate who meets the initial eligibility criteria as determined by the First Party.
            </li>
            <li>
              “<b>Active Case</b>” / “<b>Activation</b>” – A candidate profile for which the first Payment Stage, as defined in the applicable Annexure, has been realized in the First Party’s official bank account, thereby making it eligible for service delivery.
            </li>
            <li>
              “<b>Withdrawn Candidate</b>” – A candidate who voluntarily or involuntarily exits the recruitment process after the case has been activated (i.e., after the first Payment Stage, as defined in the applicable Annexure, has been realized).
            </li>
            <li>
              “<b>Employer</b>” – The overseas company, contractor, or agency offering employment to the Candidate through the First Party.
            </li>
            <li>
              “<b>Job Demand</b>” – An official manpower requirement issued by an Employer or its authorized representative to the First Party.
            </li>
            <li>
              “<b>Payment Stage(s)</b>” – The instalment(s) of the Service Fee payable by the Second Party to the First Party, each linked to a specific milestone, deliverable, or event as set forth in the applicable Annexure for a specific project. The number of Payment Stages, their triggers, and the amounts may vary from project to project and shall be mutually agreed upon in writing in the relevant Annexure.
            </li>
            <li>
              “<b>Processing Charges</b>” – The non-refundable administrative fee deducted from the first Payment Stage if the Candidate withdraws after activation, the amount of which shall be specified in the relevant Annexure.
            </li>
            <li>
              “<b>Service Fee</b>” – The total fixed amount payable by the Second Party to the First Party for processing each Candidate, as per the relevant Annexure.
            </li>
            <li>
              “<b>Candidate Documentation</b>” – All personal, professional, educational, medical, and legal documents submitted by the Candidate or Second Party as per the checklist in Annexure 3.
            </li>
            <li>
              “<b>Confidential Information</b>” – Any information, whether written, oral, or digital, that is proprietary to the First Party (or to Vesta Immigration Services LLP as per applicable clauses) and not publicly available.
            </li>
            <li>
              “<b>Data Protection Laws</b>” – Applicable laws governing the protection, processing, and storage of personal data in India and in the Candidate’s destination country.
            </li>
            <li>
              “<b>Services</b>” – The recruitment, visa processing, and related facilitation activities undertaken by the First Party for the Candidate.
            </li>
            <li>
              “<b>Workflow</b>” – The step-by-step operational process outlined in Annexure 2, forming an integral part of this MoU.
            </li>
            <li>
              “<b>Annexures</b>” – All attachments, schedules, and addendums to this MoU, which are integral to and enforceable under this MoU.
            </li>
            <li>
              “<b>Breach</b>” – Any violation of the obligations, terms, or conditions of this MoU by either Party.
            </li>
            <li>
              “<b>Force Majeure Event</b>” – Any unforeseeable circumstance beyond the reasonable control of a Party that prevents the performance of obligations under this MoU.
            </li>
          </ol>
        </div>

        {/* ========================================================================= */}
        {/* RECITALS */}
        {/* ========================================================================= */}
        <div className="space-y-3 pt-2 text-justify">
          <p>
            <b>WHEREAS</b> The FIRST PARTY is engaged in India as a provider of jobs based on demands from multiple countries. These demands are subject to change from time to time and will be shared with the Associates in advance. Visa processing and immigration services required according to the demand are the sole responsibility of the First Party.
          </p>
          <p>
            <b>AND WHEREAS</b> the SECOND PARTY is an independent consultant, engaged in conducting business in an individual capacity. The Second Party shall be responsible for independently generating business leads and shall share the same with the First Party on a profit-sharing basis, in accordance with the terms and conditions set forth in this Agreement and the mutually agreed commercial arrangements.
          </p>
          <p>
            <b>NOW THEREFORE</b>, in consideration of the above and the mutual promises and understandings set forth herein, the Parties hereby agree and enter into this Agreement as follows:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>The Parties hereby mutually agree to collaborate as Business Associates, with the objective of providing visa and immigration services to the public.</li>
            <li>The Parties shall ensure the deployment of qualified personnel who meet the minimum eligibility criteria required for the operations.</li>
          </ol>
        </div>

        {/* ========================================================================= */}
        {/* SECTIONS 1 TO 22 */}
        {/* ========================================================================= */}
        <div className="space-y-6 pt-2">
          {/* 1. BACKGROUND */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">1. BACKGROUND</h4>
            <p className="mt-1 text-justify">
              Immigo Educare LLP, operating through its offices in India, is engaged in providing visa and immigration assistance services to individuals, with the objective of helping them pursue their overseas aspirations with ease. The Company’s operations are supported by a professional back-office team specializing in visa and immigration documentation processing. With the assistance of this experienced team, clients receive comprehensive support, information, and guidance on all aspects of overseas career opportunities, offered at nominal service fees. All services shall be rendered in a professional manner, governed by duly executed written contracts.
            </p>
          </div>

          {/* 2. PURPOSE */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">2. PURPOSE OF THE AGREEMENT</h4>
            <p className="mt-1 text-justify">
              2.1. The Parties are entering into this MoU to establish a collaborative working relationship to facilitate overseas employment opportunities, immigration support, and related services.<br />
              2.2. The Second Party shall act independently to source and manage clients, while the First Party shall handle documentation and visa processing as per official requirements.
            </p>
          </div>

          {/* 3. WORKING STRUCTURE */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">3. WORKING STRUCTURE</h4>
            <p className="mt-1 text-justify">
              3.1. The Second Party shall independently collect payments from candidates at rates determined by the Second Party.<br />
              3.2. The First Party shall charge a fixed service fee from second party on case basis.<br />
              3.3. The Second Party shall retain any additional amount collected beyond the First Party's fixed service charge.
            </p>
          </div>

          {/* 4. ROLES, RESPONSIBILITIES, AND DELIVERABLES */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">4. ROLES, RESPONSIBILITIES, AND DELIVERABLES</h4>
            <div className="mt-2 space-y-2">
              <p className="font-bold">4.1. FIRST PARTY – IMMIGO EDUCARE LLP</p>
              <p className="pl-4 text-justify">
                4.1.1. To provide accurate and updated information to the Second Party regarding available overseas job opportunities, eligibility criteria, required documentation, and processing timelines.<br />
                4.1.2. To handle documentation verification, visa processing, coordination with overseas employers, embassy or consular procedures, and other technical aspects related to immigration and placement.<br />
                4.1.3. To offer post-selection services, including the issuance of offer letters, visa filing support, travel documentation, and employer-side correspondence, in accordance with the agreed scope of work.<br />
                4.1.4. To maintain transparency, timely communication, and professionalism in all dealings with the Second Party.<br />
                4.1.5. To collect only the agreed service charges as per the attached Annexure 1, and issue appropriate invoices accordingly.<br />
                4.1.6. To abstain from involvement in the Second Party’s independent pricing, earnings, or collection structure, provided the First Party’s brand name is not misused.
              </p>

              <p className="font-bold pt-2">4.2. SECOND PARTY – BUSINESS ASSOCIATE</p>
              <p className="pl-4 text-justify">
                4.2.1. To independently promote, market, and represent the opportunities provided by the First Party, and source suitable, eligible candidates for overseas placements.<br />
                4.2.2. To collect service charges directly from candidates as per the Second Party’s own pricing structure, while ensuring the First Party's share is settled in accordance with the Annexure.<br />
                4.2.3. To clearly communicate to all candidates that their financial engagement is solely with the Second Party and that the First Party shall only be involved in official visa and immigration processing.<br />
                4.2.4. To ensure that candidates understand the First Party’s terms of service and refund policy prior to their profile being forwarded for processing.<br />
                4.2.5. To offer proper assistance and documentation guidance to candidates during the pre-processing stage.<br />
                4.2.6. To not make any unauthorized commitments or assurances to candidates on behalf of the First Party.<br />
                4.2.7. To refrain from using the First Party’s name, branding, or legal credentials in a misleading or unauthorized manner.<br />
                4.2.8. To indemnify and hold harmless the First Party against any disputes, legal claims, or financial liabilities resulting from actions or representations made by the Second Party.<br />
                4.2.9. To treat all proprietary information, materials, processes, and candidate data received from the First Party as confidential and not disclose the same to any third party without prior written approval.
              </p>
            </div>
          </div>

          {/* 5. NATURE OF ASSOCIATION */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">5. NATURE OF ASSOCIATION</h4>
            <p className="mt-1 text-justify">
              5.1. The Second Party is entering into this agreement strictly as an independent Business Associate, and nothing in this MoU shall be construed as creating an employer–employee relationship, partnership, joint venture, agency, or legal representation of any kind between the Parties.<br />
              5.2. The Second Party shall not represent itself as an employee, legal agent, authorized signatory, or representative of the First Party in any capacity.<br />
              5.3. The Second Party shall not:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;5.3.1. Enter into any agreements, contracts, or financial commitments on behalf of the First Party<br />
              &nbsp;&nbsp;&nbsp;&nbsp;5.3.2. Use the First Party’s name to create bank accounts, issue documents, or sign third-party agreements<br />
              &nbsp;&nbsp;&nbsp;&nbsp;5.3.3. Present itself in public, online, or to candidates as being legally empowered to act for or bind the First Party<br />
              5.4. All actions taken by the Second Party in relation to candidate sourcing, payment collection, or service promotion are conducted in its own capacity and at its own discretion and risk, subject to the obligations defined in this MoU.<br />
              5.5. The First Party shall not be responsible for any claims, disputes, losses, or legal liabilities arising from the Second Party’s independent actions, communications, or dealings unless directly authorized in writing.<br />
              5.6. Any breach of this clause, including false or misleading representation of authority, shall be deemed a material breach of this MoU and may result in immediate termination and legal action.
            </p>
          </div>

          {/* 6. PAYMENT STRUCTURE */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">6. PAYMENT STRUCTURE</h4>
            <p className="mt-1 text-justify">
              6.1. The payment obligations under this MoU shall be governed strictly in accordance with the Payment Stage(s) and associated conditions described in Annexure-1 (or other applicable Annexures), which form an integral part of this MoU. The Second Party acknowledges and agrees that all payments due to the First Party shall be made strictly in the manner and within the timelines prescribed in Annexure-1, and that such payments are non-negotiable and non-adjustable against any internal arrangements of the Second Party.<br />
              6.2. All payments due to the First Party shall be made exclusively to its officially designated bank account via bank transfers (NEFT/RTGS/IMPS), UPI, or demand drafts drawn in favour of the First Party, as specified in a formal invoice or written communication issued by an authorized representative of the First Party.<br />
              6.3. <b>Cash payments or cash deposits into the First Party’s account are strictly prohibited and shall not be accepted under any circumstances.</b> The First Party shall bear no responsibility or liability for any payments made in cash, to unauthorized bank accounts, or to third parties or individuals not expressly authorized in writing by the First Party.<br />
              6.4. The First Party shall bear no responsibility or liability whatsoever for any financial arrangement, commission, or service fee agreed upon between the Second Party and any sub-agent, intermediary, third-party recruiter, or candidate.<br />
              6.5. The Second Party shall indemnify and hold harmless the First Party against any claims, disputes, chargebacks, or liabilities arising from:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;6.5.1. Payments collected by the Second Party from candidates or third parties;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;6.5.2. Any revenue sharing or compensation arrangements made by the Second Party with its internal staff, associates, or external agents;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;6.5.3. Any representations made by the Second Party regarding fee structures not explicitly authorized by the First Party in writing.<br />
              6.6. The First Party shall issue proper invoices for each due payment, and the Second Party shall retain proof of payment for all remittances made.<br />
              6.7. In case of non-payment beyond the due date, the First Party may terminate the case, and any amounts already paid shall be refunded as per refund policy (Clause 7). The First Party also reserves the right to recover any unpaid dues for work already completed.<br />
              6.8. No refund, credit, or reversal of payment shall be entertained by the First Party unless expressly authorized in writing and in accordance with the refund policy separately outlined in this MoU.<br />
              6.9. In case of any discrepancy or dispute regarding payments, the Parties shall refer to the Annexure and supporting communications, and attempt to resolve the matter amicably. Invoices issued by the First Party shall be deemed valid and binding unless disputed in writing within seven (7) business days of issuance.
            </p>
          </div>

          {/* 7. REFUND POLICY */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">7. REFUND POLICY</h4>
            <p className="mt-1 text-justify">
              7.1. <b>No refund shall be applicable if the candidate voluntarily withdraws from the process at any stage after the initial payment</b>, regardless of the reason, including but not limited to: change of mind, family pressure, alternative job offers, or personal circumstances.<br />
              7.2. If a candidate withdraws from the process after the case has been activated (i.e., after the first Payment Stage, as defined in the applicable Annexure, has been realized by the First Party), <b>a non-refundable processing charge of {processingCharge}</b> shall be deducted from the amount received towards the first Payment Stage. The balance, if any, shall be refunded in accordance with this Refund Policy. This charge covers administrative, documentation, and coordination costs incurred by the First Party up to that stage.<br />
              7.3. If any document submitted by the candidate is found to be fake, forged, incomplete, unverifiable, or misleading at any stage of the process, the entire amount paid shall be non-refundable. Any resulting rejection by the employer, embassy, or government authority shall not be the liability of the First Party.<br />
              7.4. In case of visa rejection by the concerned embassy, a refund shall be processed only if the rejection is not due to candidate error, document discrepancies, criminal background, or misrepresentation. In such cases, the refundable amount shall be: <b>Full amount minus 18% GST and actual expenses incurred</b> (e.g., embassy fees, application processing, courier charges, etc.).<br />
              7.5. No refund shall be provided if the candidate is found medically unfit after visa approval or upon arrival in the destination country, as these medical checks are conducted under the supervision of the employer or local health authorities, beyond the control of the First Party.<br />
              7.6. Pre-visa medical failures may be reviewed on a case-by-case basis, at the sole discretion of the First Party, subject to deductions of actual costs and 18% GST.<br />
              7.7. The First Party shall not be liable for delays caused by: Embassy backlog or administrative delays, incomplete or late submission of documents by the candidate, employer-side delays or project hold, or Force Majeure events (e.g., natural disasters, war, pandemics, etc.).<br />
              7.8. Only if the delay exceeds 60 days beyond the communicated timeline (excluding delays caused by the candidate or third-party entities) may a partial refund be considered at the sole discretion of the First Party, after deducting administrative and third-party charges.<br />
              7.9. Mode of Refund: All refunds, if applicable, shall be processed:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;7.9.1. Only to the candidate’s original bank account through which payment was made,<br />
              &nbsp;&nbsp;&nbsp;&nbsp;7.9.2. To the Second Party, if they had collected payment from the candidate, subject to proper documentation and liability acknowledgment.<br />
              7.10. Approved refunds, if any, will be processed within 15 business days from the date of written refund confirmation by the First Party.<br />
              7.11. Refund requests must be submitted in writing along with supporting documentation, including payment proofs and reason for the refund. Verbal refund requests shall not be entertained.<br />
              7.12. Fees paid toward embassy/VFS/medical/translation/attestation/government levies are non-refundable under any circumstances, even if the visa is rejected or withdrawn.<br />
              7.13. It is the sole responsibility of the Second Party to clearly explain this refund policy to candidates before collecting payments. Any deviations, false assurances, or unauthorized refund promises made by the Second Party shall be their sole liability. The Second Party shall fully indemnify the First Party against such claims.
            </p>
          </div>

          {/* 8. COMMENCEMENT */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">8. COMMENCEMENT</h4>
            <p className="mt-1 text-justify">
              8.1. This Memorandum of Understanding (MoU) shall come into effect on the date of signing by both Parties and shall remain in force for a period of {validityYears} from the date of execution.<br />
              8.2. The MoU may be extended beyond the initial term by mutual written agreement of both Parties, subject to a review of performance, targets achieved, and any revised terms and conditions as mutually agreed upon.
            </p>
          </div>

          {/* 9. COORDINATION AND REVIEW */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">9. COORDINATION AND REVIEW</h4>
            <p className="mt-1 text-justify">
              The Parties agree to maintain regular communication to ensure smooth execution of the responsibilities outlined in this MoU.<br />
              9.1. Point of Contact: Each Party shall designate a representative who will serve as the primary point of contact for coordination, day-to-day communication, and issue resolution.<br />
              9.2. Review Meetings: Periodic review meetings (virtual or in-person) shall be conducted at mutually agreed intervals (e.g., monthly or quarterly) to monitor progress, address operational issues, evaluate performance, and align on policy updates.<br />
              9.3. Documentation of Discussions: Key discussions, updates, and agreed action items arising from such reviews may be documented through official email or meeting minutes, and shall be considered binding unless disputed in writing within 5 working days.<br />
              9.4. Flexibility for Amendments: If any material adjustment is required to scope or processes, both Parties may amend terms via a written addendum or mutual email confirmation.
            </p>
          </div>

          {/* 10. PROHIBITION ON FALSE PROMISES */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">10. PROHIBITION ON FALSE PROMISES</h4>
            <p className="mt-1 text-justify">
              10.1. The Second Party shall not make any verbal or written promises, commitments, or representations to any candidate, third party, or business associate that are not explicitly authorized or confirmed by the First Party in writing. This includes: guaranteed job placement, fixed salaries or joining dates, guaranteed visa approvals, refund assurances, or processing time guarantees.<br />
              10.2. Any such promises made by the Second Party shall be considered a misrepresentation, and the First Party shall not be liable for any loss, claim, or dispute arising as a result. The Second Party shall fully indemnify and hold harmless the First Party in such cases.
            </p>
          </div>

          {/* 11. NON-DISCLOSURE AND RESTRICTION ON USE OF COMPANY CREDENTIALS */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">11. NON-DISCLOSURE AND RESTRICTION ON USE OF COMPANY CREDENTIALS</h4>
            <p className="mt-1 text-justify">
              11.1. The Second Party shall not disclose, share, circulate, reproduce, or publicly display any legal, operational, or branding-related credentials of the First Party without prior written consent (including MEA recruitment license numbers, LLPIN, PAN, GSTIN, office addresses, contact numbers, partner names, certificates, or correspondence).<br />
              11.2. The Second Party is strictly prohibited from using the First Party's logo, trademark, company name ("Immigo Educare LLP"), or identity in advertising, social media, WhatsApp groups, Telegram, YouTube videos, or marketing materials.<br />
              11.3. <b>Applicability to Vesta Immigration Services LLP</b> – For the avoidance of doubt, the obligations, restrictions, and prohibitions under this clause also apply in full to Vesta Immigration Services LLP, its partners, employees, clients, candidates, and business associates. The Second Party shall not use, disclose, circulate, or reproduce any credentials or materials belonging to Vesta Immigration Services LLP without prior written approval from Immigo Educare LLP.<br />
              11.4. The First Party does not provide blanket authorization or implied permission for marketing or brand representation.<br />
              11.5. Violation entitles the First Party to immediately terminate the agreement, pursue legal action and claims for damages, and blacklist the Second Party.
            </p>
          </div>

          {/* 12. DIGITAL CONTENT & MARKETING USE */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">12. DIGITAL CONTENT & MARKETING USE</h4>
            <p className="mt-1 text-justify">
              12.1. The Second Party shall not use or publish the First Party’s name, logo, brand elements, office details, or project information in WhatsApp groups, Telegram, social media posts, reels, YouTube, websites, job portals, or flyers without prior written approval.<br />
              12.2. Applicability to Vesta Immigration Services LLP applies equally to all digital and offline marketing.<br />
              12.3. Unauthorized use constitutes a material breach leading to immediate termination and legal action.
            </p>
          </div>

          {/* 13. BRAND PROTECTION AND DEFAMATION */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">13. BRAND PROTECTION AND DEFAMATION</h4>
            <p className="mt-1 text-justify">
              13.1. The Second Party agrees not to make, publish, or share any defamatory, false, misleading, or disparaging statements against the First Party, Vesta Immigration Services LLP, their partners, staff, or services.<br />
              13.2. Any breach shall result in immediate legal action, including claims for damages and injunctive relief, and shall survive the termination or expiry of the MoU.
            </p>
          </div>

          {/* 14. RIGHT TO BLACKLIST OR DISSOCIATE */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">14. RIGHT TO BLACKLIST OR DISSOCIATE</h4>
            <p className="mt-1 text-justify">
              14.1. The First Party reserves the right to permanently disassociate from or blacklist the Second Party in case of repeated candidate complaints, brand misuse, misconduct, fraud, or failure to comply with MoU terms.<br />
              14.2. Upon blacklisting, future business or referrals with the First Party shall be strictly prohibited.
            </p>
          </div>

          {/* 15. COMPLIANCE WITH LAWS */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">15. COMPLIANCE WITH LAWS</h4>
            <p className="mt-1 text-justify">
              15.1. The Second Party agrees to conduct all activities in full compliance with Indian law, labour and recruitment regulations, MEA guidelines, destination country immigration laws, and data protection regulations.<br />
              15.2. The Second Party shall be solely responsible for ensuring that all information provided to candidates is accurate and lawful.
            </p>
          </div>

          {/* 16. TERMINATION */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">16. TERMINATION</h4>
            <p className="mt-1 text-justify">
              16.1. Termination by Either Party: Giving thirty (30) days' prior written notice.<br />
              16.2. Immediate Termination for Cause: Fraudulent, unethical, or misleading practices, unrectified material breach after 7 days, or brand misuse.<br />
              16.3. Effect of Termination: Ongoing cases prior to termination continue under MoU terms until completed; no new candidate cases accepted post-termination.<br />
              16.4. Survival of Clauses: Confidentiality, indemnity, refund policy, dispute resolution, and limitation of liability survive termination.
            </p>
          </div>

          {/* 17. SETTLEMENT UPON TERMINATION */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">17. SETTLEMENT UPON TERMINATION</h4>
            <p className="mt-1 text-justify">
              17.1. Both Parties agree to initiate a structured settlement process.<br />
              17.2. Obligations prior to termination date remain valid and enforceable.<br />
              17.3. Ongoing candidate cases accepted prior to termination continue until completion.<br />
              17.4. Final Reconciliation: Within 15 business days from termination date, reconcile outstanding payments, invoices, return/destroy proprietary documents.<br />
              17.5. No Further Claims upon completion of settlement.<br />
              17.7. Final Settlement Record: Signed or confirmed over official email as binding proof of closure.
            </p>
          </div>

          {/* 18. CONFIDENTIALITY */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">18. CONFIDENTIALITY</h4>
            <p className="mt-1 text-justify">
              18.1. The Second Party agrees to maintain strict confidentiality over all non-public information, internal processes, documentation guidelines, pricing models, and candidate data.<br />
              18.2. Applies in full to Vesta Immigration Services LLP.<br />
              18.6. Remains in force during validity and for a period of two (2) years after termination or expiration.
            </p>
          </div>

          {/* 19. FORCE MAJEURE */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">19. FORCE MAJEURE</h4>
            <p className="mt-1 text-justify">
              19.1. Neither Party shall be held liable for failure or delay caused by Acts of God, war, epidemics, quarantine restrictions, embassy closures, or foreign authority delays.<br />
              19.4. Force Majeure delays do not entitle candidates to a refund unless granted on a case-by-case basis.<br />
              19.5. If continuing for more than sixty (60) consecutive days, either Party may terminate with written notice.
            </p>
          </div>

          {/* 20. DISPUTE RESOLUTION AND ARBITRATION */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">20. DISPUTE RESOLUTION AND ARBITRATION</h4>
            <p className="mt-1 text-justify">
              20.1. Amicable resolution through mutual consultation first.<br />
              20.2. Escalation to senior-most representatives within 15 business days.<br />
              20.3. Final and binding arbitration under the Arbitration and Conciliation Act, 1996, before a sole arbitrator mutually appointed.<br />
              20.3.2. Seat and venue of arbitration: <b>Gautam Budh Nagar, Uttar Pradesh</b>.<br />
              20.5. Jurisdiction: The courts at Gautam Budh Nagar, Uttar Pradesh shall have exclusive jurisdiction.
            </p>
          </div>

          {/* 21. OTHER COVENANTS */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">21. OTHER COVENANTS</h4>
            <p className="mt-1 text-justify">
              21.1. Uncovered subjects addressed through mutual written consultation.<br />
              21.2. Amendments only by written instrument signed by authorized representatives.<br />
              21.3. Good Faith and Cooperation.<br />
              21.4. Brand Protection & Non-Defamation.<br />
              21.5. Legal & Operational Liability: Each Party solely responsible for its own staff, clients, and operations.
            </p>
          </div>

          {/* 22. ADDITIONAL PROTECTIONS */}
          <div>
            <h4 className="font-bold text-sm uppercase font-sans tracking-wide">22. ADDITIONAL PROTECTIONS</h4>
            <div className="mt-1 space-y-2 text-justify">
              <p>
                22.1. <b>Candidate Source Ownership</b> – Once the Second Party submits a candidate profile to the First Party for processing, that candidate shall be deemed registered with the First Party. The Second Party shall not divert, transfer, or process such candidate through any other agency, employer, or recruitment channel during the validity of this MoU and for a period of twelve (12) months thereafter.
              </p>
              <p>
                22.2. <b>No Circumvention</b> – The Second Party shall not, directly or indirectly, approach, contact, negotiate with, or conduct business with any employer, client, or overseas partner introduced by the First Party, whether during the term of this MoU or for a period of twenty-four (24) months after its termination, without the First Party’s prior written consent.
              </p>
              <p>
                22.3. <b>Data Protection Penalty</b> – Any unauthorized disclosure, sharing, or misuse of candidate data, employer contact details, or proprietary documents of the First Party shall attract a minimum penalty of <b>INR 5,00,000/- (Rupees Five Lakh)</b> per breach, without prejudice to the First Party’s right to claim higher damages.
              </p>
              <p>
                22.4. <b>Misrepresentation Penalty</b> – In case of any false commitment, misrepresentation, or unauthorized assurance given by the Second Party in relation to the First Party’s services, the Second Party shall be liable to pay a minimum compensation of <b>INR 3,00,000/- (Rupees Three Lakh)</b> per incident, in addition to indemnifying the First Party for any consequential losses.
              </p>
              <p>
                22.5. <b>Jurisdiction for Criminal Complaints</b> – In case of any act amounting to fraud, cheating, misappropriation of funds, or criminal breach of trust by the Second Party, the First Party shall have the sole right to initiate legal proceedings in the jurisdiction of Gautam Budh Nagar, Uttar Pradesh, irrespective of the Second Party’s location.
              </p>
              <p>
                22.6. <b>Performance Targets</b> – The Second Party shall ensure a minimum of <b>10 eligible candidate profiles per month</b>. Failure to meet this target for two (2) consecutive months without valid justification shall entitle the First Party to terminate this MoU with immediate effect.
              </p>
              <p>
                22.7. <b>Post-Termination Contact Restriction</b> – Upon termination or expiry of this MoU, the Second Party shall not contact, solicit, or engage with any candidate or employer who was introduced or processed through the First Party during the validity of this MoU, for a period of twelve (12) months.
              </p>
              <p>
                22.8. <b>Annexure Update Procedure</b> – Any amendments to the number, triggers, amounts, sequence of Payment Stages, or service scope shall be valid only if recorded in a dated and mutually signed Annexure to this MoU. Such Annexure shall supersede all previous versions relating to the same subject matter.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EXECUTION SIGNATURES TABLE */}
        {/* ========================================================================= */}
        <div className="pt-8 space-y-4">
          <p className="text-justify font-sans text-xs">
            <b>IN WITNESS WHEREOF</b>, the Parties hereto have executed this Memorandum of Understanding (MoU) on <b>{agreementDate}</b> hereinabove written.
          </p>

          <div className="border-2 border-slate-900 rounded-lg overflow-hidden font-sans">
            <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-900 text-xs font-black uppercase tracking-wider p-3">
              <div>ON BEHALF OF {firstPartyName}</div>
              <div className="border-l border-slate-900 pl-3">ON BEHALF OF {secondPartyName}</div>
            </div>
            <div className="grid grid-cols-2 p-4 min-h-[140px] items-end text-xs">
              <div className="space-y-1">
                <div className="font-serif italic text-lg font-bold text-slate-900 pb-1 border-b border-slate-300 w-48">
                  {adminSignatoryName}
                </div>
                <p className="font-bold text-slate-900">{adminSignatoryName}</p>
                <p className="text-slate-600 uppercase text-[10px]">{adminDesignation}</p>
                <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 size={11} /> Digitally Authorized & Sealed
                </p>
              </div>

              <div className="border-l border-slate-900 pl-4 space-y-1">
                {isSigned ? (
                  <>
                    <div className="font-serif italic text-lg font-bold text-slate-900 pb-1 border-b border-slate-300 w-48">
                      {vendor?.signedMou?.signatureData || signatoryName}
                    </div>
                    <p className="font-bold text-slate-900">
                      {vendor?.signedMou?.signatoryName || signatoryName}
                    </p>
                    <p className="text-slate-600 uppercase text-[10px]">
                      {vendor?.signedMou?.designation || designation}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Digitally Executed on {agreementDate}
                    </p>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="h-10 border-b border-dashed border-slate-400 w-48 flex items-end text-slate-400 italic text-[11px]">
                      [Sign Here]
                    </div>
                    <p className="font-bold text-slate-900">
                      {signatoryName || secondPartyRep}
                    </p>
                    <p className="text-slate-600 uppercase text-[10px]">
                      {designation || secondPartyDesignation}
                    </p>
                    <p className="text-[10px] text-amber-700 font-medium">
                      Awaiting Digital Execution
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ANNEXURE 1: SERVICE FEE & PAYMENT TERMS */}
        {/* ========================================================================= */}
        <div className="page-break-before pt-8 space-y-6 border-t-2 border-slate-900">
          <div className="text-center space-y-1">
            <h3 className="font-bold text-base uppercase font-sans tracking-wide">
              ANNEXURE 1
            </h3>
            <h4 className="font-bold text-sm uppercase font-sans text-slate-700">
              SERVICE FEE & PAYMENT TERMS
            </h4>
            <p className="text-xs text-slate-500 font-sans">
              This Annexure is part of and subject to the Memorandum of Understanding (MoU) entered into between {firstPartyName} (First Party) and {secondPartyName} (Second Party).
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-xs uppercase font-sans">1. SERVICE FEE STRUCTURE</h5>
            <p className="text-xs">
              The total fixed Service Fee per candidate, payable by the Second Party to the First Party, shall be divided into the following Payment Stage(s):
            </p>

            <div className="border border-slate-900 rounded-lg overflow-hidden font-sans text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900">
                    <th className="p-2.5 font-bold border-r border-slate-900 w-28">PAYMENT STAGE</th>
                    <th className="p-2.5 font-bold border-r border-slate-900">PAYMENT TRIGGER</th>
                    <th className="p-2.5 font-bold border-r border-slate-900 w-36">AMOUNT (INR)</th>
                    <th className="p-2.5 font-bold w-36">DUE DATE AFTER INVOICE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  <tr>
                    <td className="p-2.5 font-bold border-r border-slate-900">Stage 1</td>
                    <td className="p-2.5 border-r border-slate-900">After resume selection and document submission</td>
                    <td className="p-2.5 font-mono border-r border-slate-900">{stage1Fee}</td>
                    <td className="p-2.5">Within 3 Business Days</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold border-r border-slate-900">Stage 2</td>
                    <td className="p-2.5 border-r border-slate-900">After issuance of Employment Offer Letter</td>
                    <td className="p-2.5 font-mono border-r border-slate-900">{stage2Fee}</td>
                    <td className="p-2.5">Within 3 Business Days</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold border-r border-slate-900">Stage 3</td>
                    <td className="p-2.5 border-r border-slate-900">After visa approval / stamping</td>
                    <td className="p-2.5 font-mono border-r border-slate-900">{stage3Fee}</td>
                    <td className="p-2.5">Prior to Deployment / Ticket</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              <b>Note:</b> The number of Payment Stages, their triggers, and the amounts may vary between projects and will be agreed upon in writing before commencement. All amounts mentioned are inclusive of applicable taxes.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase font-sans">2. PROCESSING CHARGE</h5>
            <p className="text-xs text-justify">
              If the candidate withdraws after the case is activated (i.e., after the first Payment Stage has been realized), <b>a non-refundable processing charge of {processingCharge}</b> shall be deducted from the first Payment Stage amount received. The balance, if any, shall be refunded in accordance with the Refund Policy in the main MoU.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase font-sans">3. PAYMENT CONDITIONS</h5>
            <p className="text-xs text-justify">
              3.1. Each Payment Stage must be made only after the corresponding milestone is achieved and upon receipt of an invoice from the First Party.<br />
              3.2. All payments shall be made to the First Party’s official bank account, details of which are stated below.<br />
              3.3. No cash payments or deposits will be entertained.<br />
              3.4. The Second Party shall retain proof of all payments made and share transaction references as part of the record.<br />
              3.5. The First Party shall issue a tax-compliant invoice for each Payment Stage received.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase font-sans">4. COMMISSIONS & SUB-AGENTS</h5>
            <p className="text-xs text-justify">
              4.1. No commission, incentive, or referral fee is payable by the First Party to the Second Party under this arrangement.<br />
              4.2. The Second Party may charge candidates a service fee at its discretion but shall bear full and sole responsibility for all such collections.<br />
              4.3. The First Party shall not be liable for any payment promises or commission arrangements made with sub-agents or intermediaries.
            </p>
          </div>

          {/* OFFICIAL BANK DETAILS BOX */}
          <div className="p-5 rounded-xl border-2 border-slate-900 bg-slate-50 font-sans space-y-3">
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Landmark size={15} className="text-blue-900" />
              <span>5. OFFICIAL BANK DETAILS FOR PAYMENT</span>
            </h5>
            <p className="text-[11px] text-slate-600">
              All payments from the Second Party to the First Party shall be made only to the following officially designated corporate bank account:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-lg border border-slate-300 font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Account Name:</span>
                <span className="font-bold text-slate-950">IMMIGO EDUCARE LLP</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Account Number:</span>
                <span className="font-bold text-slate-950 text-sm tracking-wide">925020043404157</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">Bank Name & Branch:</span>
                <span className="font-bold text-slate-950">AXIS BANK &bull; SECTOR – 45, NOIDA</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-sans font-bold">IFSC Code:</span>
                <span className="font-bold text-blue-900 text-sm">UTIB0004491</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              <b>Important Note:</b> Payments made to any other account shall not be considered valid or acknowledged. The First Party shall not be responsible for payments made to personal accounts, third-party accounts, or accounts not listed above.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase font-sans">6. REFUNDS & CHARGEBACKS</h5>
            <p className="text-xs text-justify">
              6.1. Refunds, if any, shall be handled strictly in accordance with the Refund Policy outlined in the main MoU.<br />
              6.2. No refund requests shall be entertained based on internal disputes between the Second Party and its clients or associates.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase font-sans">7. NON-PAYMENT CONSEQUENCES</h5>
            <p className="text-xs text-justify">
              7.1. Failure to adhere to the above payment schedule may result in:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;7.1.1. Immediate suspension of processing for the concerned candidate(s).<br />
              &nbsp;&nbsp;&nbsp;&nbsp;7.1.2. Termination of the MoU by the First Party without further notice.<br />
              &nbsp;&nbsp;&nbsp;&nbsp;7.1.3. Withholding of documents, visa files, or offer letters until dues are cleared.<br />
              &nbsp;&nbsp;&nbsp;&nbsp;7.1.4. Legal recovery proceedings, if necessary.<br />
              &nbsp;&nbsp;&nbsp;&nbsp;7.1.5. Any amounts already paid shall be refunded as per Refund Policy upon termination due to non-payment.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ANNEXURE 2: CANDIDATE PROCESSING WORKFLOW */}
        {/* ========================================================================= */}
        <div className="page-break-before pt-8 space-y-6 border-t-2 border-slate-900">
          <div className="text-center space-y-1">
            <h3 className="font-bold text-base uppercase font-sans tracking-wide">
              ANNEXURE 2
            </h3>
            <h4 className="font-bold text-sm uppercase font-sans text-slate-700">
              CANDIDATE PROCESSING WORKFLOW
            </h4>
          </div>

          <div className="space-y-4 text-xs font-sans text-justify">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1">Step 1 – Candidate Introduction</h5>
              <p className="text-slate-700 leading-relaxed">
                1. Second Party collects and verifies candidate’s documents (as per Annexure 3).<br />
                2. Second Party submits the complete profile to the First Party via official channel (email/portal/CRM).<br />
                3. Profile must include: personal details, qualifications, work experience, and supporting documentation.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1">Step 2 – Profile Review by First Party</h5>
              <p className="text-slate-700 leading-relaxed">
                1. First Party reviews documents against current job demands and eligibility criteria.<br />
                2. Status options: <b>Approved</b>, <b>Rejected</b>, or <b>Pending Additional Information</b>.<br />
                3. Upon provisional approval, a unique candidate reference number is assigned.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1">Step 3 – Case Activation</h5>
              <p className="text-slate-700 leading-relaxed">
                1. The first Payment Stage (as defined in Annexure 1) is invoiced to the Second Party.<br />
                2. Case is deemed active only when the first Payment Stage is realized in the First Party’s official bank account.<br />
                3. No services are initiated until this payment is received in full.<br />
                4. If candidate withdraws after activation, the processing charge specified in Annexure 1 ({processingCharge}) is deducted, and balance refunded as per policy.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1">Step 4 – Service Delivery by First Party</h5>
              <p className="text-slate-700 leading-relaxed">
                1. Upon activation, the First Party begins agreed services, including:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;1.1. Documentation verification<br />
                &nbsp;&nbsp;&nbsp;&nbsp;1.2. Employer-side coordination & offer letter issuance<br />
                &nbsp;&nbsp;&nbsp;&nbsp;1.3. Visa application filing and embassy/VFS liaison<br />
                &nbsp;&nbsp;&nbsp;&nbsp;1.4. Travel facilitation and employer-side onboarding instructions<br />
                2. Regular updates are shared with the Second Party.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1">Step 5 – Subsequent Payment Stages</h5>
              <p className="text-slate-700 leading-relaxed">
                1. Payments for subsequent Payment Stages are triggered only after respective milestones are achieved.<br />
                2. Each stage requires full payment within the timeline mentioned in Annexure 1 from the invoice date.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1">Step 6 – Case Closure</h5>
              <p className="text-slate-700 leading-relaxed">
                1. A case is officially closed when:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;1.1. Candidate joins the employer overseas; OR<br />
                &nbsp;&nbsp;&nbsp;&nbsp;1.2. Case is closed under Refund Policy; OR<br />
                &nbsp;&nbsp;&nbsp;&nbsp;1.3. Candidate withdraws/becomes ineligible and all financial adjustments are completed.<br />
                2. Upon closure, First Party updates system records; no further services or obligations remain.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1">Step 7 – Record Retention</h5>
              <p className="text-slate-700 leading-relaxed">
                Both Parties maintain case records, payment proofs, and communication for <b>24 months</b> from case closure date.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ANNEXURE 3: CANDIDATE DOCUMENT CHECK LIST */}
        {/* ========================================================================= */}
        <div className="page-break-before pt-8 space-y-6 border-t-2 border-slate-900">
          <div className="text-center space-y-1">
            <h3 className="font-bold text-base uppercase font-sans tracking-wide">
              ANNEXURE 3
            </h3>
            <h4 className="font-bold text-sm uppercase font-sans text-slate-700">
              CANDIDATE DOCUMENT CHECK LIST
            </h4>
            <p className="text-xs text-slate-500 font-sans">
              All candidates submitted by the Second Party to the First Party must have the following documents, verified and compiled in the order below. Incomplete submissions will not be accepted or registered in the system.
            </p>
          </div>

          <div className="border border-slate-900 rounded-lg overflow-hidden font-sans text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900">
                  <th className="p-2 font-bold border-r border-slate-900 w-16 text-center">S.NO</th>
                  <th className="p-2 font-bold border-r border-slate-900">DOCUMENT DESCRIPTION</th>
                  <th className="p-2 font-bold w-28 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {/* 1 */}
                <tr className="bg-slate-50/80 font-bold">
                  <td className="p-2 text-center border-r border-slate-900">1.</td>
                  <td className="p-2 border-r border-slate-900" colSpan={2}>PERSONAL IDENTIFICATION</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">1.1</td>
                  <td className="p-2 border-r border-slate-900">Valid Passport (Min. 1 year validity) *</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ Mandatory ]</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">1.2</td>
                  <td className="p-2 border-r border-slate-900">National ID (Aadhaar card, any other) (if applicable)</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ Required ]</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">1.3</td>
                  <td className="p-2 border-r border-slate-900">Birth Certificate (if applicable)</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ Optional ]</td>
                </tr>

                {/* 2 */}
                <tr className="bg-slate-50/80 font-bold">
                  <td className="p-2 text-center border-r border-slate-900">2.</td>
                  <td className="p-2 border-r border-slate-900" colSpan={2}>EDUCATIONAL & TRAINING CREDENTIALS</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">2.1</td>
                  <td className="p-2 border-r border-slate-900">High School / Secondary Education Certificates *</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ Mandatory ]</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">2.2</td>
                  <td className="p-2 border-r border-slate-900">Higher Education Certificate / Diplomas / Degrees *</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ Mandatory ]</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">2.3</td>
                  <td className="p-2 border-r border-slate-900">Vocational Training Certificates (if required) *</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ As per trade ]</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">2.4</td>
                  <td className="p-2 border-r border-slate-900">Professional Licenses / Trade Test Certificates (if required) *</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ As per trade ]</td>
                </tr>

                {/* 3 */}
                <tr className="bg-slate-50/80 font-bold">
                  <td className="p-2 text-center border-r border-slate-900">3.</td>
                  <td className="p-2 border-r border-slate-900" colSpan={2}>EMPLOYMENT HISTORY</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">3.1</td>
                  <td className="p-2 border-r border-slate-900">Updated Resume / CV *</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ Mandatory ]</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">3.2</td>
                  <td className="p-2 border-r border-slate-900">Salary Slips / Pay Records (last 3 months, if required)</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ If applicable ]</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">3.3</td>
                  <td className="p-2 border-r border-slate-900">Reference Letters (if applicable)</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ If applicable ]</td>
                </tr>

                {/* 4 */}
                <tr className="bg-slate-50/80 font-bold">
                  <td className="p-2 text-center border-r border-slate-900">4.</td>
                  <td className="p-2 border-r border-slate-900" colSpan={2}>LANGUAGE & SKILLS PROOF</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">4.1</td>
                  <td className="p-2 border-r border-slate-900">English Language Proficiency Certificate (if required)</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ As per job ]</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">4.2</td>
                  <td className="p-2 border-r border-slate-900">Other Language Proficiency Certificates (if required)</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ As per job ]</td>
                </tr>

                {/* 5 */}
                <tr className="bg-slate-50/80 font-bold">
                  <td className="p-2 text-center border-r border-slate-900">5.</td>
                  <td className="p-2 border-r border-slate-900" colSpan={2}>HEALTH & FITNESS DOCUMENTS</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">5.1</td>
                  <td className="p-2 border-r border-slate-900">Pre-Medical Fitness Certificate</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ Required ]</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">5.2</td>
                  <td className="p-2 border-r border-slate-900">Vaccination Records</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ Required ]</td>
                </tr>

                {/* 6 */}
                <tr className="bg-slate-50/80 font-bold">
                  <td className="p-2 text-center border-r border-slate-900">6.</td>
                  <td className="p-2 border-r border-slate-900" colSpan={2}>SUPPORTING DOCUMENTS</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">6.1</td>
                  <td className="p-2 border-r border-slate-900">Passport Size Photographs (as per embassy specs) *</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ Mandatory ]</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">6.2</td>
                  <td className="p-2 border-r border-slate-900">Police Clearance Certificate (PCC) (if required)</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ Required ]</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">6.3</td>
                  <td className="p-2 border-r border-slate-900">Proof of Address *</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ Mandatory ]</td>
                </tr>

                {/* 7 */}
                <tr className="bg-slate-50/80 font-bold">
                  <td className="p-2 text-center border-r border-slate-900">7.</td>
                  <td className="p-2 border-r border-slate-900" colSpan={2}>ADDITIONAL DOCUMENTS (IF ROLE-SPECIFIC)</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">7.1</td>
                  <td className="p-2 border-r border-slate-900">Driving License</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ If applicable ]</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">7.2</td>
                  <td className="p-2 border-r border-slate-900">Special Permits (aviation, maritime, etc.)</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ If applicable ]</td>
                </tr>
                <tr>
                  <td className="p-2 text-center border-r border-slate-900 text-slate-500">7.3</td>
                  <td className="p-2 border-r border-slate-900">Portfolio / Work Samples (if required)</td>
                  <td className="p-2 text-center text-slate-400 font-mono">[ If applicable ]</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-2 pt-2 text-xs font-sans">
            <p className="font-bold">IMPORTANT SUBMISSION CONDITIONS:</p>
            <ol className="list-decimal pl-5 space-y-1 text-slate-700">
              <li>All documents must be scanned in colour, clear, and readable, in PDF format (no photographs of documents).</li>
              <li>The Second Party must verify authenticity of all documents before submission.</li>
              <li>Any falsified, altered, or incomplete documentation will result in immediate rejection of the profile and may lead to blacklisting of the Second Party.</li>
              <li>Documents should be sent in a single zipped folder named in the format: <span className="font-mono font-bold">[CandidateName_PassportNumber]</span>.</li>
              <li>No case will be reviewed until this checklist is fully met.</li>
            </ol>
          </div>

          <div className="pt-4 border-t border-slate-300 font-sans text-xs space-y-2">
            <p className="italic">
              I hereby certify that all documents listed above have been verified and are being submitted in complete form.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <p className="text-slate-500 text-[10px]">Name & Signature of Second Party Representative:</p>
                <p className="font-bold text-slate-900 pt-1">{secondPartyRep}</p>
                <p className="font-mono text-[10px] text-slate-400">Date: {agreementDate}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px]">Authorized Counter-Signatory (First Party):</p>
                <p className="font-bold text-slate-900 pt-1">{adminSignatoryName}</p>
                <p className="font-mono text-[10px] text-slate-400">Date: {agreementDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VENDOR SIGNING BOX (When vendor is reviewing to execute signature) */}
      {(mode === "sign" || (!isSigned && mode === "preview" && vendor?.role === "vendor")) && (
        <form
          onSubmit={handleVendorSignSubmit}
          className="mou-print-hide print:hidden max-w-4xl mx-auto bg-white rounded-2xl border border-indigo-200 shadow-md p-6 sm:p-8 space-y-6"
        >
          <div className="border-b border-indigo-100 pb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-indigo-600" />
              <span>Digital Execution & Acceptance of Partnership MOU</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Please enter your legal signatory particulars to digitally execute this Memorandum of Understanding.
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
                placeholder="e.g. Managing Partner / Director"
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
                Cryptographically tied to {vendor?.email || secondPartyName} &bull; {agreementDate}
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
              I hereby declare that I am the legally authorized representative of <b>{secondPartyName}</b> and agree to abide by all 22 clauses, covenants, commercial payment stages, ₹20,000 non-refundable processing charge, bank payment guidelines, and Annexures 1, 2, and 3 stated in this Memorandum of Understanding (MOU).
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
