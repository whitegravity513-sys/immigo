import React, { useState, useRef } from "react";
import {
  FileText,
  Printer,
  Download,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  PenTool,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";

export default function MouFullPageView({
  vendor,
  mode = "preview", 
  onBack,
  onSuccess,
  onApprove,
}) {
  const printRef = useRef(null);

  
  const firstPartyName = "IMMIGO EDUCARE LLP";
  const firstPartyLLPIN = "ACP - 1662";
  const firstPartyAddress =
    "C-76, BASEMENT, SECTOR-88, PHASE-2, NOIDA, BISRAKH POLICE STATION, NOIDA, GAUTAM BUDDHA NAGAR - 201301, UTTAR PRADESH, INDIA";
  const firstPartyRep = "MR. HIMANSHU SINGH";
  const firstPartyDesignation = "MANAGING PARTNER";

  
  const secondPartyName = (
    vendor?.companyName ||
    vendor?.agencyName ||
    vendor?.businessName ||
    vendor?.vendorName ||
    vendor?.name ||
    "Vendor Partner"
  ).toUpperCase();

  const buildVendorAddress = () => {
    if (vendor?.address && vendor.address.trim()) {
      return vendor.address.trim().toUpperCase();
    }
    if (vendor?.registeredAddress && vendor.registeredAddress.trim()) {
      return vendor.registeredAddress.trim().toUpperCase();
    }
    if (vendor?.officeAddress && vendor.officeAddress.trim()) {
      return vendor.officeAddress.trim().toUpperCase();
    }
    const parts = [
      vendor?.street,
      vendor?.area,
      vendor?.city,
      vendor?.district,
      vendor?.state,
      vendor?.pinCode || vendor?.pincode || vendor?.postalCode ? `${vendor?.pinCode || vendor?.pincode || vendor?.postalCode}` : null,
      vendor?.country || "INDIA",
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(", ").toUpperCase();
    return "REGISTERED CORPORATE OFFICE, INDIA";
  };
  const secondPartyAddress = buildVendorAddress();

  const secondPartyRep = (
    vendor?.signedMou?.signatoryName ||
    vendor?.contactPersonName ||
    vendor?.contactPerson ||
    vendor?.ownerName ||
    vendor?.authorizedSignatory ||
    vendor?.signatoryName ||
    vendor?.directorName ||
    vendor?.partnerName ||
    vendor?.name ||
    "AUTHORIZED SIGNATORY"
  ).toUpperCase();

  const secondPartyDesignation = (
    vendor?.signedMou?.designation ||
    vendor?.designation ||
    vendor?.signatoryDesignation ||
    vendor?.title ||
    (vendor?.businessType === "Partnership" || vendor?.businessType === "LLP"
      ? "MANAGING PARTNER"
      : vendor?.businessType === "Proprietorship"
      ? "PROPRIETOR"
      : "MANAGING DIRECTOR")
  ).toUpperCase();

  
  const getFormattedDate = () => {
    if (vendor?.mouDocument?.agreementDate) {
      return vendor.mouDocument.agreementDate;
    }
    if (vendor?.signedMou?.signedAt) {
      try {
        return new Date(vendor.signedMou.signedAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      } catch {}
    }
    if (vendor?.createdAt) {
      try {
        return new Date(vendor.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      } catch {}
    }
    return new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const agreementDate = getFormattedDate();
  const executionPlace = (
    vendor?.city ||
    vendor?.district ||
    vendor?.state ||
    "NOIDA"
  ).toUpperCase();
  const validityYears = vendor?.mouDocument?.validityYears || "one (1) year";
  const processingCharge = "₹ 20,000.00 (INR TWENTY THOUSAND ONLY)";

  const mouRefNumber = `MOU-VND-${vendor?.vendorId || vendor?.id || "5456"}-${new Date().getFullYear()}`;

  
  const [signatoryName, setSignatoryName] = useState(secondPartyRep);
  const [designation, setDesignation] = useState(secondPartyDesignation);
  const [signatureText, setSignatureText] = useState(secondPartyRep);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [isDownloading, setIsDownloading] = useState(false);

  const isSigned =
    vendor?.mouSigned ||
    vendor?.mouStatus === "Signed" ||
    vendor?.mouStatus === "Approved" ||
    vendor?.signedMou?.signedAt;

  const handleDownloadMou = async () => {
    setIsDownloading(true);
    try {
      const content = printRef.current;
      if (!content) {
        handlePrint();
        return;
      }

      const cleanName = secondPartyName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `MOU_IMMIGO_EDUCARE_LLP_${cleanName}.pdf`;

      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 1.5, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      };

      await html2pdf().set(opt).from(content).save();
    } catch (err) {
      console.warn("Direct download fallback to print:", err);
      handlePrint();
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const cleanName = secondPartyName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const docTitle = `MOU_IMMIGO_EDUCARE_LLP_${cleanName}`;
    document.title = docTitle;

    try {
      const content = printRef.current;
      if (!content) {
        window.print();
        return;
      }

      
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((el) => el.outerHTML)
        .join("\n");

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow.document;

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${docTitle}</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            ${styles}
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm 15mm 10mm 15mm;
              }
              html, body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                height: auto !important;
                overflow: visible !important;
              }
              .mou-page-container {
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
                width: 100% !important;
              }
              .mou-page {
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                border: none !important;
                box-shadow: none !important;
                margin: 0 !important;
                margin-bottom: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                min-height: 0 !important;
                height: auto !important;
                background: white !important;
                box-sizing: border-box !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
              }
              .mou-page:last-child {
                page-break-after: avoid !important;
                break-after: avoid !important;
                margin-bottom: 0 !important;
              }
              .mou-print-hide {
                display: none !important;
              }
            </style>
          </head>
          <body>
            <div class="mou-page-container">
              ${content.innerHTML}
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch {
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            document.title = originalTitle;
          }, 2000);
        }
      }, 500);
    } catch {
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1200);
    }
  };

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

  return (
    <div className="w-full font-sans text-slate-900 bg-slate-100 min-h-screen">
      {}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
          }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, aside, footer, [role="navigation"], .mou-print-hide, .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
          .mou-page-container {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .mou-page {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            margin-bottom: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            background: white !important;
          }
          .mou-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
            margin-bottom: 0 !important;
          }
        }
      `}</style>

      {}
      <div className="mou-print-hide print:hidden bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs px-4 sm:px-8 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            {onBack ? (
              <button
                onClick={onBack}
                type="button"
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            ) : (
              <button
                onClick={() => window.history.back()}
                type="button"
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onApprove && (
              <button
                onClick={onApprove}
                type="button"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle2 size={14} />
                <span className="hidden sm:inline">Approve</span>
              </button>
            )}
            <button
              onClick={handleDownloadMou}
              disabled={isDownloading}
              type="button"
              className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 disabled:opacity-60 text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-95"
              title="Download MOU PDF directly to your device"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download MOU</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {}
      {errorMsg && (
        <div className="mou-print-hide print:hidden max-w-4xl mx-auto mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mou-print-hide print:hidden max-w-4xl mx-auto mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {}
      {}
      {}
      <div ref={printRef} className="mou-page-container pt-4 pb-12">
        {}
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-5">
            <div className="text-center space-y-4">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-950 uppercase">
                MEMORANDUM OF UNDERSTANDING (MOU)
              </h2>
            </div>

            <p>
              This Memorandum of Understanding (“<b>MOU</b>”) is entered on <b>{agreementDate}</b> at <b>{executionPlace}</b>, by
            </p>

            <p>
              “<b>{firstPartyName}</b>”, a Limited Liability Partnership incorporated under the LLP Act, 2008, having LLP Identification Number (LLPIN) <b>{firstPartyLLPIN}</b>, and its registered office at <b>{firstPartyAddress}</b>, acting through its authorized representative <b>{firstPartyRep}</b>, <b>{firstPartyDesignation}</b> (hereinafter referred to as the “<b>FIRST PARTY</b>”, which expression shall, unless repugnant to the context or meaning thereof, be deemed to mean and include its successors and permitted assigns);
            </p>

            <p className="text-center font-bold text-xs uppercase tracking-widest my-2">
              AND
            </p>

            <p>
              <b>{secondPartyName}</b>, Office at <b>{secondPartyAddress}</b>, represented by <b>{secondPartyRep} ({secondPartyDesignation})</b>, which is the Second Party here in after referred to as the <b>BUSINESS ASSOCIATE</b> (which expression shall unless it be repugnant to the context or meaning thereof be deemed to mean and include its/his/her successors, legal heirs, nominees and permitted assignees, as the case may be) of the <b>SECOND PARTY / BUSINESS ASSOCIATES</b>.
            </p>

            <p>
              <b>{firstPartyName}</b> and <b>{secondPartyName}</b> are individually referred to as First Party & Second Party respectively, and collectively referred to as Parties.
            </p>

            <div className="pt-2">
              <h3 className="font-bold text-sm uppercase tracking-tight mb-2">
                DEFINITIONS
              </h3>
              <ol className="list-decimal pl-5 space-y-2">
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
              </ol>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">1</div>
        </div>

        {}
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <ol start={6} className="list-decimal pl-5 space-y-2.5">
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
                “<b>Confidential Information</b>” – Any information, whether written, oral, or digital, that is proprietary to the First Party (or to ImmiGo Overseas Services LLP as per applicable clauses) and not publicly available.
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

            <p className="pt-2">
              <b>WHEREAS</b> The FIRST PARTY is engaged in India as a provider of jobs based on demands from multiple countries. These demands are subject to change from time to time and will be shared
            </p>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">2</div>
        </div>

        {}
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <p>
              with the Associates in advance. Visa processing and immigration services required according to the demand are the sole responsibility of the First Party.
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

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">1. BACKGROUND</h4>
              <p>
                Immigo Educare LLP, operating through its offices in India, is engaged in providing visa and immigration assistance services to individuals, with the objective of helping them pursue their overseas aspirations with ease. The Company’s operations are supported by a professional back-office team specializing in visa and immigration documentation processing. With the assistance of this experienced team, clients receive comprehensive support, information, and guidance on all aspects of overseas career opportunities, offered at nominal service fees. All services shall be rendered in a professional manner, governed by duly executed written contracts.
              </p>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">2. PURPOSE OF THE AGREEMENT</h4>
              <p>
                2.1. The Parties are entering into this MoU to establish a collaborative working relationship to facilitate overseas employment opportunities, immigration support, and related services.<br />
                2.2. The Second Party shall act independently to source and manage clients, while the First Party shall handle documentation and visa processing as per official requirements.
              </p>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">3. WORKING STRUCTURE</h4>
              <p>
                3.1. The Second Party shall independently collect payments from candidates at rates determined by the Second Party.<br />
                3.2. The First Party shall charge a fixed service fee from second party on case basis.<br />
                3.3. The Second Party shall retain any additional amount collected beyond the First Party's fixed service charge.
              </p>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">4. ROLES, RESPONSIBILITIES, AND DELIVERABLES</h4>
              <p className="font-bold">4.1. FIRST PARTY – IMMIGO EDUCARE LLP</p>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">3</div>
        </div>

        
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <p className="pl-4">
              4.1.1. To provide accurate and updated information to the Second Party regarding available overseas job opportunities, eligibility criteria, required documentation, and processing timelines.<br />
              4.1.2. To handle documentation verification, visa processing, coordination with overseas employers, embassy or consular procedures, and other technical aspects related to immigration and placement.<br />
              4.1.3. To offer post-selection services, including the issuance of offer letters, visa filing support, travel documentation, and employer-side correspondence, in accordance with the agreed scope of work.<br />
              4.1.4. To maintain transparency, timely communication, and professionalism in all dealings with the Second Party.<br />
              4.1.5. To collect only the agreed service charges as per the attached Annexure 1, and issue appropriate invoices accordingly.<br />
              4.1.6. To abstain from involvement in the Second Party’s independent pricing, earnings, or collection structure, provided the First Party’s brand name is not misused.
            </p>

            <h4 className="font-bold text-sm uppercase pt-2">4.2. SECOND PARTY – BUSINESS ASSOCIATE</h4>
            <p className="pl-4">
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

            <h4 className="font-bold text-sm uppercase pt-2">5. NATURE OF ASSOCIATION</h4>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">4</div>
        </div>

        {}
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <p>
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

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">6. PAYMENT STRUCTURE</h4>
              <p>
                6.1. The payment obligations under this MoU shall be governed strictly in accordance with the Payment Stage(s) and associated conditions described in Annexure-1 (or other applicable Annexures), which form an integral part of this MoU. The Second Party acknowledges and agrees that all payments due to the First Party shall be made strictly in the manner and within the timelines prescribed in Annexure-1, and that such payments are non-negotiable and non-adjustable against any internal arrangements of the Second Party.<br />
                6.2. All payments due to the First Party shall be made exclusively to its officially designated bank account via bank transfers (NEFT/RTGS/IMPS), UPI, or demand drafts drawn in favour of the First Party, as specified in a formal invoice or written communication issued by an authorized representative of the First Party.<br />
                6.3. <b>Cash payments or cash deposits into the First Party’s account are strictly prohibited and shall not be accepted under any circumstances.</b> The First Party shall bear no responsibility or liability for any payments made in cash, to unauthorized bank accounts, or to third parties or individuals not expressly authorized in writing by the First Party.<br />
                6.4. The First Party shall bear no responsibility or liability whatsoever for any financial arrangement, commission, or service fee agreed upon between the Second Party and any sub-agent, intermediary, third-party recruiter, or candidate.
              </p>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">5</div>
        </div>

        {}
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <p>
              6.5. The Second Party shall indemnify and hold harmless the First Party against any claims, disputes, chargebacks, or liabilities arising from:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;6.5.1. Payments collected by the Second Party from candidates or third parties;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;6.5.2. Any revenue sharing or compensation arrangements made by the Second Party with its internal staff, associates, or external agents;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;6.5.3. Any representations made by the Second Party regarding fee structures not explicitly authorized by the First Party in writing.<br />
              6.6. The First Party shall issue proper invoices for each due payment, and the Second Party shall retain proof of payment for all remittances made.<br />
              6.7. In case of non-payment beyond the due date, the First Party may terminate the case, and any amounts already paid shall be refunded as per refund policy (Clause 7). The First Party also reserves the right to recover any unpaid dues for work already completed.<br />
              6.8. No refund, credit, or reversal of payment shall be entertained by the First Party unless expressly authorized in writing and in accordance with the refund policy separately outlined in this MoU.<br />
              6.9. In case of any discrepancy or dispute regarding payments, the Parties shall refer to the Annexure and supporting communications, and attempt to resolve the matter amicably. Invoices issued by the First Party shall be deemed valid and binding unless disputed in writing within seven (7) business days of issuance.
            </p>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">7. REFUND POLICY</h4>
              <p>
                7.1. <b>No refund shall be applicable if the candidate voluntarily withdraws from the process at any stage after the initial payment</b>, regardless of the reason, including but not limited to: change of mind, family pressure, alternative job offers, or personal circumstances.<br />
                7.2. If a candidate withdraws from the process after the case has been activated (i.e., after the first Payment Stage, as defined in the applicable Annexure, has been realized by the First Party), <b>a non-refundable processing charge, as specified in the applicable Annexure ({processingCharge})</b>, shall be deducted from the amount received towards the first Payment Stage. The balance, if any, shall be refunded in accordance with this Refund Policy. This charge covers administrative, documentation, and coordination costs incurred by the First Party up to that stage.<br />
                7.3. If any document submitted by the candidate is found to be fake, forged, incomplete, unverifiable, or misleading at any stage of the process, the entire amount paid shall be non-refundable. Any resulting rejection by the employer, embassy, or government authority shall not be the liability of the First Party.<br />
                7.4. In case of visa rejection by the concerned embassy, a refund shall be processed only if the rejection is not due to candidate error, document discrepancies, criminal background, or misrepresentation. In such cases, the refundable amount shall be: <b>Full amount minus 18% GST and actual expenses incurred</b> (e.g., embassy fees, application processing, courier charges, etc.).
              </p>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">6</div>
        </div>

        {}
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <p>
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

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">8. COMMENCEMENT</h4>
              <p>
                8.1. This Memorandum of Understanding (MoU) shall come into effect on the date of signing by both Parties and shall remain in force for a period of {validityYears} from the date of execution.<br />
                8.2. The MoU may be extended beyond the initial term by mutual written agreement of both Parties, subject to a review of performance, targets achieved, and any revised terms and conditions as mutually agreed upon.
              </p>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">9. COORDINATION AND REVIEW</h4>
              <p>
                The Parties agree to maintain regular communication to ensure smooth execution of the responsibilities outlined in this MoU.<br />
                <b>9.1. Point of Contact:</b>
              </p>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">7</div>
        </div>

        {}
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <p>
              Each Party shall designate a representative who will serve as the primary point of contact for coordination, day-to-day communication, and issue resolution.<br />
              <b>9.2. Review Meetings:</b><br />
              Periodic review meetings (virtual or in-person) shall be conducted at mutually agreed intervals (e.g., monthly or quarterly) to:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;9.2.1. Monitor the progress of ongoing cases<br />
              &nbsp;&nbsp;&nbsp;&nbsp;9.2.2. Address operational or procedural issues<br />
              &nbsp;&nbsp;&nbsp;&nbsp;9.2.3. Evaluate performance against expectations<br />
              &nbsp;&nbsp;&nbsp;&nbsp;9.2.4. Align on updates to policies, documentation, or regulatory changes<br />
              <b>9.3. Documentation of Discussions:</b><br />
              Key discussions, updates, and agreed action items arising from such reviews may be documented through official email or meeting minutes, and such documentation shall be considered valid and binding, unless disputed in writing within 5 working days.<br />
              <b>9.4. Flexibility for Amendments:</b><br />
              If, during coordination or review, any material adjustment is required to the existing scope, processes, or communication protocol, both Parties may amend the terms by way of a written addendum or mutual email confirmation.
            </p>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">10. PROHIBITION ON FALSE PROMISES</h4>
              <p>
                10.1. The Second Party shall not make any verbal or written promises, commitments, or representations to any candidate, third party, or business associate that are not explicitly authorized or confirmed by the First Party in writing. This includes, but is not limited to:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;10.1.1. Guaranteed job placement<br />
                &nbsp;&nbsp;&nbsp;&nbsp;10.1.2. Fixed salaries or joining dates<br />
                &nbsp;&nbsp;&nbsp;&nbsp;10.1.3. Guaranteed visa approvals or success rates<br />
                &nbsp;&nbsp;&nbsp;&nbsp;10.1.4. Refund assurances or processing time guarantees<br />
                10.2. Any such promises made by the Second Party shall be considered a misrepresentation, and the First Party shall not be liable for any loss, claim, or dispute arising as a result. The Second Party shall fully indemnify and hold harmless the First Party in such cases.
              </p>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">11. NON-DISCLOSURE AND RESTRICTION ON USE OF COMPANY CREDENTIALS</h4>
              <p>
                11.1. The Second Party shall not disclose, share, circulate, reproduce, or publicly display any legal, operational, or branding-related credentials of the First Party without prior written consent. This includes, but is not limited to:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;11.1.1. Recruitment license number (RC No.) issued by the Ministry of External Affairs<br />
                &nbsp;&nbsp;&nbsp;&nbsp;11.1.2. Company registration details (LLPIN, PAN, GSTIN, etc.)<br />
                &nbsp;&nbsp;&nbsp;&nbsp;11.1.3. Office address(es) or location details<br />
                &nbsp;&nbsp;&nbsp;&nbsp;11.1.4. Email IDs, mobile numbers, or landline numbers of the First Party<br />
                &nbsp;&nbsp;&nbsp;&nbsp;11.1.5. Names and designations of the First Party’s partners or employees<br />
                &nbsp;&nbsp;&nbsp;&nbsp;11.1.6. Any certificates, approvals, MOUs, or correspondence issued by the First Party
              </p>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">8</div>
        </div>

        {}
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <p>
              11.2. The Second Party is strictly prohibited from using the following without prior written approval from the First Party:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;11.2.1. The First Party’s logo, trademark, or brand elements<br />
              &nbsp;&nbsp;&nbsp;&nbsp;11.2.2. The First Party’s company name (“Immigo Educare LLP”) in any form of advertising, social media, or marketing material.<br />
              &nbsp;&nbsp;&nbsp;&nbsp;11.2.3. The First Party’s identity or branding in WhatsApp groups, YouTube videos, Telegram, job portals, websites, blogs, flyers, presentations, email campaigns, or social media posts<br />
              11.3. <b>Applicability to ImmiGo Overseas Services LLP</b> – For the avoidance of doubt, the obligations, restrictions, and prohibitions under this clause also apply in full to ImmiGo Overseas Services LLP, its partners, employees, clients, candidates, and business associates. The Second Party shall not use, disclose, circulate, or reproduce any name, logo, brand elements, recruitment license numbers, office addresses, contact details, documentation, processes, employer contacts, or proprietary materials belonging to ImmiGo Overseas Services LLP without prior written approval from Immigo Educare LLP. Any violation shall be treated as a material breach of this MoU and subject to the same remedies, penalties, and enforcement rights as if committed directly against the First Party.<br />
              11.4. The First Party does not provide any blanket authorization or implied permission to the Second Party for any form of marketing, brand representation, or promotional usage. All such requests must be submitted in writing and are subject to review and express written approval.<br />
              11.5. Any violation of this clause shall be considered a material breach of this MoU and shall entitle the First Party to:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;11.5.1. Immediately terminate the agreement without notice<br />
              &nbsp;&nbsp;&nbsp;&nbsp;11.5.2. Pursue legal action including claims for damages, injunctive relief, and criminal liability as permitted under applicable law<br />
              &nbsp;&nbsp;&nbsp;&nbsp;11.5.3. Blacklist the Second Party from future engagements and notify relevant stakeholders or industry partners about the unauthorized representation<br />
              11.6. The Second Party shall ensure that all team members, partners, employees, and affiliates operating under its control are made aware of this restriction and adhere to the same without exception.
            </p>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">12. DIGITAL CONTENT & MARKETING USE</h4>
              <p>
                12.1. The Second Party shall not use or publish the First Party’s name, logo, brand elements, office details, legal credentials, or project information in any form of digital or offline content, including but not limited to:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;12.1.1. WhatsApp or Telegram groups<br />
                &nbsp;&nbsp;&nbsp;&nbsp;12.1.2. Social media posts, reels, or videos (e.g., Facebook, Instagram, LinkedIn, YouTube)<br />
                &nbsp;&nbsp;&nbsp;&nbsp;12.1.3. Websites, job portals, advertisements, blogs, or paid marketing campaigns<br />
                &nbsp;&nbsp;&nbsp;&nbsp;12.1.4. Flyers, posters, or business presentations
              </p>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">9</div>
        </div>

        {}
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <p>
              12.2. <b>Applicability to ImmiGo Overseas Services LLP</b> – The restrictions under this clause apply equally to ImmiGo Overseas Services LLP, its name, logo, brand elements, recruitment license numbers, office details, legal credentials, and any project or operational information belonging to ImmiGo, whether or not ImmiGo is a direct party to this MoU. Any use of ImmiGo’s identity or information in digital or offline marketing by the Second Party requires prior written approval from Immigo Educare LLP.<br />
              12.3. Any such use requires prior written approval from the First Party on a case-by-case basis. Blanket or assumed permission is not granted under this MoU. Unauthorized use shall be deemed a material breach, leading to immediate termination and potential legal action, including for brand misuse and misrepresentation.
            </p>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">13. BRAND PROTECTION AND DEFAMATION</h4>
              <p>
                13.1. The Second Party agrees not to:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;13.1.1. Make, publish, or share any defamatory, false, misleading, or disparaging statements (online or offline) against the First Party, ImmiGo Overseas Services LLP, their partners, staff, or services.<br />
                &nbsp;&nbsp;&nbsp;&nbsp;13.1.2. Participate in or encourage any activity that could damage the reputation, goodwill, or business interests of the First Party or ImmiGo Overseas Services LLP.<br />
                13.2. Any breach of this clause shall result in immediate legal action, including claims for damages and injunctive relief, and shall be considered a material breach of the MoU. This obligation shall survive the termination or expiry of the MoU.
              </p>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">14. RIGHT TO BLACKLIST OR DISSOCIATE</h4>
              <p>
                14.1. The First Party reserves the right to permanently disassociate from or blacklist the Second Party in the following circumstances:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;14.1.1. Repeated candidate complaints or disputes<br />
                &nbsp;&nbsp;&nbsp;&nbsp;14.1.2. Misuse of brand identity or false representation<br />
                &nbsp;&nbsp;&nbsp;&nbsp;14.1.3. Misconduct, unethical practices, or fraud<br />
                &nbsp;&nbsp;&nbsp;&nbsp;14.1.4. Failure to comply with the terms of this MoU<br />
                14.2. Upon blacklisting, the Second Party shall be prohibited from engaging in any future business or referrals with the First Party. Such status may also be shared with relevant stakeholders, employers, and other industry players at the First Party’s discretion. Blacklisting may be executed without notice if deemed necessary to protect the First Party’s reputation or legal standing.
              </p>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">15. COMPLIANCE WITH LAWS</h4>
              <p>
                15.1. The Second Party agrees to conduct all activities in full compliance with:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;15.1.1. Indian law, labour and recruitment regulations<br />
                &nbsp;&nbsp;&nbsp;&nbsp;15.1.2. MEA guidelines for recruitment agents<br />
                &nbsp;&nbsp;&nbsp;&nbsp;15.1.3. Visa and immigration laws of destination countries<br />
                &nbsp;&nbsp;&nbsp;&nbsp;15.1.4. Data protection, privacy, and consumer protection laws
              </p>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">10</div>
        </div>

        {}
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <p>
              15.2. The Second Party shall be solely responsible for ensuring that all information provided to candidates and third parties is accurate and lawful. Any legal violations or regulatory non-compliance by the Second Party shall not involve or implicate the First Party under any circumstances.
            </p>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">16. TERMINATION</h4>
              <p>
                <b>16.1. Termination by Either Party:</b><br />
                This MoU may be terminated by either Party by giving thirty (30) days' prior written notice to the other Party. Such termination shall not affect any obligations or liabilities that have already accrued prior to the termination date.<br />
                <b>16.2. Immediate Termination for Cause:</b><br />
                The First Party reserves the right to terminate this MoU with immediate effect, without any prior notice, in the event that<br />
                &nbsp;&nbsp;&nbsp;&nbsp;16.2.1. The Second Party is found to have engaged in any fraudulent, unethical, illegal, or misleading practices;<br />
                &nbsp;&nbsp;&nbsp;&nbsp;16.2.2. There is a material breach of the terms of this MoU which remains unrectified for more than seven (7) days from written notice;<br />
                &nbsp;&nbsp;&nbsp;&nbsp;16.2.3. The Second Party misuses the First Party’s name, documents, or credentials without written permission.<br />
                <b>16.3. Effect of Termination</b><br />
                Upon termination:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;16.3.1. All rights and obligations under this MoU shall cease, except for those that have accrued prior to the date of termination.<br />
                &nbsp;&nbsp;&nbsp;&nbsp;16.3.2. The Second Party shall immediately stop using the First Party’s name, branding, and materials in any capacity.<br />
                &nbsp;&nbsp;&nbsp;&nbsp;16.3.3. Any ongoing cases that were already in process before the termination notice was served shall continue to be governed by the terms of this MoU until completed, including any applicable service charges or obligations.<br />
                &nbsp;&nbsp;&nbsp;&nbsp;16.3.4. No new candidate cases shall be accepted from the Second Party post-termination date.<br />
                <b>16.4. Survival of Clauses</b><br />
                The clauses related to confidentiality, indemnity, refund policy, dispute resolution, and limitation of liability shall survive the termination or expiry of this MoU.
              </p>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">17. SETTLEMENT UPON TERMINATION</h4>
              <p>
                17.1. In the event of termination of this MoU by either Party, regardless of the reason, both Parties agree to initiate a structured and timely settlement process in accordance with the terms set forth below.<br />
                <b>17.2. Obligations Prior to Termination Date:</b>
              </p>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">11</div>
        </div>

        
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <p>
              All services rendered, payments due, and deliverables initiated prior to the termination date shall remain valid and enforceable. Both Parties shall honour any pending commitments, dues, or documentation requirements for such cases.<br />
              <b>17.3. Ongoing Cases:</b><br />
              Any candidate cases that were accepted and processed prior to termination shall continue to be handled as per the terms of this MoU until completed, including:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;17.3.1. Collection of outstanding dues from the Second Party<br />
              &nbsp;&nbsp;&nbsp;&nbsp;17.3.2. Completion of documentation and visa processing by the First Party<br />
              &nbsp;&nbsp;&nbsp;&nbsp;17.3.3. Disbursement of any eligible settlements as per the applicable annexures<br />
              &nbsp;&nbsp;&nbsp;&nbsp;17.3.4. No new candidate cases shall be accepted from the Second Party post-termination<br />
              <b>17.4. Final Reconciliation:</b><br />
              Within 15 business days from the termination date, both Parties shall:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;17.4.1. Reconcile all outstanding payments, invoices, and documentation<br />
              &nbsp;&nbsp;&nbsp;&nbsp;17.4.2. Share and verify all pending or partially processed case data<br />
              &nbsp;&nbsp;&nbsp;&nbsp;17.4.3. Return or destroy any proprietary documents, branding materials, or confidential information<br />
              <b>17.5. No Further Claims:</b><br />
              Upon completion of the settlement process:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;17.5.1. Neither Party shall have any further claims against the other under this MoU<br />
              &nbsp;&nbsp;&nbsp;&nbsp;17.5.2. The Second Party shall not demand any commission, refund, compensation, or legal remedy beyond what is expressly defined under this MoU and its annexures<br />
              <b>17.6. Surviving Clauses:</b><br />
              The following clauses shall survive the termination and remain enforceable: 17.6.1 Confidentiality, 17.6.2 Indemnity, 17.6.3 Refund Policy, 17.6.4 Non-Disclosure of Credentials, 17.6.5 Dispute Resolution and Legal Jurisdiction, 17.6.6 Brand Protection and Defamation.<br />
              <b>17.7. Final Settlement Record:</b><br />
              A written record or acknowledgment of final settlement shall be signed or confirmed over official email by both Parties. This document shall constitute binding proof of full and final settlement and MoU closure.
            </p>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">18. CONFIDENTIALITY</h4>
              <p>
                18.1. The Second Party agrees to maintain strict confidentiality over all non-public information shared by the First Party, including but not limited to:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;18.1.1. Internal processes, visa documentation guidelines, operational formats<br />
                &nbsp;&nbsp;&nbsp;&nbsp;18.1.2. Employer contact details, agency credentials, and proprietary service methodologies<br />
                &nbsp;&nbsp;&nbsp;&nbsp;18.1.3. Pricing models, commercial terms, candidate data, and payment structures
              </p>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">12</div>
        </div>

        
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <p>
              &nbsp;&nbsp;&nbsp;&nbsp;18.1.4. Any project-specific material marked as confidential or shared verbally/in writing as sensitive<br />
              18.2. <b>Applicability to ImmiGo Overseas Services LLP</b> – All confidentiality obligations in this clause also extend in full to ImmiGo Overseas Services LLP and its proprietary information, processes, contacts, documents, and branding, whether obtained directly or indirectly during the execution of this MoU. The Second Party shall treat ImmiGo’s confidential information with the same level of care as that of the First Party.<br />
              18.3. The Second Party is permitted to share limited and relevant information (such as job demand details, indicative fee structures, and basic process flow) solely for the purpose of pitching or onboarding candidates, provided that:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;18.3.1. No official logos, credentials, license numbers, legal documents, or employer names are shared without prior written consent<br />
              &nbsp;&nbsp;&nbsp;&nbsp;18.3.2. All communication clearly states that the Second Party is acting independently, and not as a representative or employee of the First Party<br />
              &nbsp;&nbsp;&nbsp;&nbsp;18.3.3. Any materials created for such pitching must be approved in writing by the First Party before being used publicly<br />
              18.4. The Second Party shall not:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;18.4.1. Copy, publish, forward, or disseminate complete visa processes, employer details, internal formats, or documentation kits<br />
              &nbsp;&nbsp;&nbsp;&nbsp;18.4.2. Share screenshots, emails, agreements, or confidential communication received from the First Party or from ImmiGo Overseas Services LLP<br />
              &nbsp;&nbsp;&nbsp;&nbsp;18.4.3. Use the First Party’s or ImmiGo’s branding or authority to make representations beyond the permitted scope<br />
              18.5. The Second Party shall ensure that all of its team members, associates, or sub-agents (if any) are also bound by this confidentiality obligation.<br />
              18.6. This clause shall remain in force during the validity of this MoU and for a period of two (2) years after its termination or expiration, regardless of the reason for such termination.<br />
              18.7. Any breach of this clause shall be considered a material violation, entitling the First Party to: 18.7.1. Terminate this MoU with immediate effect, 18.7.2. Initiate legal proceedings and claim damages, if necessary, 18.7.3. Blacklist the Second Party from all future engagements.
            </p>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">19. FORCE MAJEURE</h4>
              <p>
                19.1. Neither Party shall be held liable for any failure or delay in the performance of its obligations under this MoU if such failure or delay is caused by events beyond their reasonable control (“Force Majeure Events”), including but not limited to:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;19.1.1. Acts of God, natural disasters, earthquakes, floods, or storms<br />
                &nbsp;&nbsp;&nbsp;&nbsp;19.1.2. War, civil unrest, political instability, or terrorism<br />
                &nbsp;&nbsp;&nbsp;&nbsp;19.1.3. Epidemics, pandemics, or quarantine restrictions
              </p>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">13</div>
        </div>

        
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <p>
              &nbsp;&nbsp;&nbsp;&nbsp;19.1.4. Governmental actions, embassy closures, policy changes, or visa restrictions<br />
              &nbsp;&nbsp;&nbsp;&nbsp;19.1.5. Power failures, network outages, cyberattacks, or industrial disturbances<br />
              &nbsp;&nbsp;&nbsp;&nbsp;19.1.6. Delays on the part of employers or foreign authorities<br />
              19.2. The Party affected by the Force Majeure Event shall notify the other Party in writing within seven (7) calendar days of becoming aware of the event, providing reasonable evidence and details of the situation.<br />
              19.3. During the period of the Force Majeure Event:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;19.3.1. The obligations of the affected Party shall be suspended without penalty<br />
              &nbsp;&nbsp;&nbsp;&nbsp;19.3.2. The Parties shall make reasonable efforts to mitigate the delay and resume performance as soon as practicable<br />
              19.4. It is expressly clarified that:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;19.4.1. Force Majeure delays do not entitle the candidate to a refund, unless the First Party chooses to grant such refund on a case-by-case basis, in line with its written refund policy<br />
              &nbsp;&nbsp;&nbsp;&nbsp;19.4.2. The Second Party shall not make any refund commitments to candidates during such events unless explicitly authorized in writing by the First Party<br />
              19.5. If a Force Majeure Event continues for more than sixty (60) consecutive days, either Party may terminate this MoU with written notice, and any pending services or payments shall be handled in accordance with the refund and settlement clauses outlined elsewhere in this MoU and its annexures.
            </p>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">20. DISPUTE RESOLUTION AND ARBITRATION</h4>
              <p>
                <b>20.1. Amicable Resolution First</b><br />
                In the event of any dispute, difference, or disagreement arising out of or relating to this MoU — including its interpretation, performance, obligations, or termination — the Parties agree to first attempt resolution amicably and in good faith through mutual consultation and discussion.<br />
                <b>20.2. Escalation Mechanism</b><br />
                If the dispute remains unresolved within fifteen (15) business days of written notification by either Party, the matter shall be escalated to the senior-most representatives of both Parties for a final round of discussion, to be completed within a further ten (10) business days.<br />
                <b>20.3. Arbitration</b><br />
                If the dispute still remains unresolved, it shall be referred to final and binding arbitration in accordance with the provisions of the Arbitration and Conciliation Act, 1996, including any statutory modifications or re-enactments thereof.<br />
                20.3.1. The arbitration shall be conducted by a sole arbitrator, mutually appointed by the Parties. In case of failure to mutually appoint an arbitrator within 10 days, the arbitrator shall be appointed as per the procedure defined under the Arbitration and Conciliation Act.
              </p>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">14</div>
        </div>

        
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <p>
              20.3.2. <b>The seat and venue of arbitration shall be Gautam Budh Nagar, Uttar Pradesh</b>, or any other location mutually agreed by the Parties.<br />
              20.3.3. The arbitration proceedings shall be conducted in the English language.<br />
              20.3.4. The arbitrator shall issue a reasoned award, which shall be final and binding on both Parties.<br />
              20.3.5. Each Party shall bear its own legal costs; the cost of arbitration shall be shared equally, unless otherwise directed in the award.<br />
              <b>20.4. Interim Relief</b><br />
              Nothing in this clause shall prevent either Party from seeking interim or injunctive relief from a court of competent jurisdiction in order to prevent immediate and irreparable harm, preserve evidence, or enforce confidentiality or non-disclosure obligations.<br />
              <b>20.5. Jurisdiction and Governing Law</b><br />
              This MoU shall be governed by and construed in accordance with the laws of India. Subject to the arbitration clause above, <b>the courts at Gautam Budh Nagar, Uttar Pradesh shall have exclusive jurisdiction</b> over any matters arising out of or relating to this MoU.
            </p>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">21. OTHER COVENANTS</h4>
              <p>
                <b>21.1. Uncovered Subjects:</b><br />
                Any matter not expressly covered under this MoU, but deemed necessary for the smooth functioning of the association, shall be addressed through mutual consultation and documented in writing. No oral commitments or informal understandings shall be deemed binding.<br />
                <b>21.2. Amendments</b><br />
                This MoU, or any part thereof, may be amended only by a written instrument signed by authorized representatives of both Parties. No verbal agreement, email, or message shall substitute a formally signed amendment.<br />
                <b>21.3. Good Faith and Cooperation:</b><br />
                Both Parties affirm that this MoU is entered into in good faith, with mutual intention to cooperate professionally. The Parties shall make genuine efforts to resolve any misunderstandings amicably, in a timely and constructive manner.<br />
                <b>21.4. Brand Protection & Non-Defamation:</b><br />
                Both Parties agree not to undertake or support any action — directly or indirectly — that could harm the reputation, brand, or goodwill of the other Party. In particular, the Second Party shall not engage in any form of public criticism, defamatory statements, or negative social media activity that could adversely affect the image of Immigo Educare LLP.<br />
                <span className="italic text-xs text-slate-600 block my-1">
                  Note: This clause shall not restrict the Second Party from associating with other industry players, provided such associations do not misuse or misrepresent this MoU.
                </span>
                <b>21.5. Legal & Operational Liability:</b><br />
                21.5.1. Each Party shall be solely responsible for its own staff, clients, business activities, and liabilities.
              </p>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">15</div>
        </div>

        
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <p>
              21.5.2. The First Party shall not be held liable for any injury, loss, or legal action involving individuals, candidates, sub-agents, or employees managed or handled by the Second Party.<br />
              21.5.3. Similarly, the Second Party shall indemnify the First Party against any claims or proceedings arising from its independent operations, financial dealings, or candidate interactions.<br />
              <b>21.6. Non-Waiver of Rights:</b><br />
              No failure or delay by either Party in exercising any right, power, or privilege under this MoU shall operate as a waiver thereof, nor shall any single or partial exercise preclude any other or further exercise of such right.
            </p>

            <div className="pt-2">
              <h4 className="font-bold text-sm uppercase mb-1">22. ADDITIONAL PROTECTIONS</h4>
              <p>
                <b>22.1. Candidate Source Ownership</b> – Once the Second Party submits a candidate profile to the First Party for processing, that candidate shall be deemed registered with the First Party. The Second Party shall not divert, transfer, or process such candidate through any other agency, employer, or recruitment channel during the validity of this MoU and for a period of twelve (12) months thereafter.<br />
                <b>22.2. No Circumvention</b> – The Second Party shall not, directly or indirectly, approach, contact, negotiate with, or conduct business with any employer, client, or overseas partner introduced by the First Party, whether during the term of this MoU or for a period of twenty-four (24) months after its termination, without the First Party’s prior written consent.<br />
                <b>22.3. Data Protection Penalty</b> – Any unauthorized disclosure, sharing, or misuse of candidate data, employer contact details, or proprietary documents of the First Party shall attract a minimum penalty of <b>INR 5,00,000/- (Rupees Five Lakh)</b> per breach, without prejudice to the First Party’s right to claim higher damages.<br />
                <b>22.4. Misrepresentation Penalty</b> – In case of any false commitment, misrepresentation, or unauthorized assurance given by the Second Party in relation to the First Party’s services, the Second Party shall be liable to pay a minimum compensation of <b>INR 3,00,000/- (Rupees Three Lakh)</b> per incident, in addition to indemnifying the First Party for any consequential losses.<br />
                <b>22.5. Jurisdiction for Criminal Complaints</b> – In case of any act amounting to fraud, cheating, misappropriation of funds, or criminal breach of trust by the Second Party, the First Party shall have the sole right to initiate legal proceedings in the jurisdiction of Gautam Budh Nagar, Uttar Pradesh, irrespective of the Second Party’s location.<br />
                <b>22.6. Performance Targets</b> – The Second Party shall ensure a minimum of <b>10 eligible candidate profiles per month</b>. Failure to meet this target for two (2) consecutive months without valid justification shall entitle the First Party to terminate this MoU with immediate effect.<br />
                <b>22.7. Post-Termination Contact Restriction</b> – Upon termination or expiry of this MoU, the Second Party shall not contact, solicit, or engage with any candidate or employer who was
              </p>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">16</div>
        </div>

        
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-6">
            <p>
              introduced or processed through the First Party during the validity of this MoU, for a period of twelve (12) months.<br />
              <b>22.8. Annexure Update Procedure</b> – Any amendments to the number, triggers, amounts, sequence of Payment Stages, or service scope shall be valid only if recorded in a dated and mutually signed Annexure to this MoU. Such Annexure shall supersede all previous versions relating to the same subject matter.
            </p>

            <div className="pt-6 space-y-4">
              <p className="font-bold">
                IN WITNESS WHEREOF, the Parties hereto have executed this Memorandum of Understanding (MoU) on <b>{agreementDate}</b> hereinabove written.
              </p>

              <div className="border border-slate-900 rounded-none overflow-hidden font-sans">
                <div className="grid grid-cols-2 border-b border-slate-900 text-xs font-bold uppercase p-3">
                  <div>ON BEHALF OF {firstPartyName}</div>
                  <div className="border-l border-slate-900 pl-3">ON BEHALF OF {secondPartyName}</div>
                </div>
                <div className="grid grid-cols-2 p-4 min-h-[170px] items-end text-xs">
                  <div className="space-y-1">
                    <div className="font-serif italic text-lg font-bold text-slate-900 pb-1 border-b border-slate-300 w-52">
                      {firstPartyRep}
                    </div>
                    <p className="font-bold text-slate-900">{firstPartyRep}</p>
                    <p className="text-slate-600 uppercase text-[10px]">{firstPartyDesignation}</p>
                    <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Digitally Authorized & Sealed
                    </p>
                  </div>

                  <div className="border-l border-slate-900 pl-4 space-y-1">
                    {isSigned ? (
                      <>
                        <div className="font-serif italic text-lg font-bold text-slate-900 pb-1 border-b border-slate-300 w-52">
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
                        <div className="h-12 border-b border-dashed border-slate-400 w-52 flex items-end text-slate-400 italic text-[11px]">
                          [Authorized Signatory]
                        </div>
                        <p className="font-bold text-slate-900">
                          {secondPartyRep}
                        </p>
                        <p className="text-slate-600 uppercase text-[10px]">
                          {secondPartyDesignation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">17</div>
        </div>

        
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base uppercase">
                ANNEXURE 1
              </h3>
              <h4 className="font-bold text-sm uppercase text-slate-800">
                SERVICE FEE & PAYMENT TERMS
              </h4>
            </div>

            <p className="text-xs">
              This Annexure is part of and subject to the Memorandum of Understanding (MoU) entered into between <b>Immigo Educare LLP</b> (First Party) and <b>{secondPartyName}</b> (Second Party).
            </p>

            <div className="space-y-2 pt-1">
              <h5 className="font-bold text-xs uppercase">1. SERVICE FEE STRUCTURE</h5>
              <p className="text-xs">
                The total fixed Service Fee per candidate, payable by the Second Party to the First Party, shall be divided into the following Payment Stage(s):
              </p>

              <div className="border border-slate-900 font-sans text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 font-bold">
                      <th className="p-2 border-r border-slate-900 w-24">PAYMENT STAGE</th>
                      <th className="p-2 border-r border-slate-900">PAYMENT TRIGGER</th>
                      <th className="p-2 border-r border-slate-900 w-32">AMOUNT (INR)</th>
                      <th className="p-2 w-32">DUE DATE AFTER INVOICE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    <tr>
                      <td className="p-2 font-bold border-r border-slate-900">Stage 1</td>
                      <td className="p-2 border-r border-slate-900">: After resume selection and document submission</td>
                      <td className="p-2 border-r border-slate-900 font-mono">As per Demand</td>
                      <td className="p-2">Within 3 Days</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold border-r border-slate-900">Stage 2</td>
                      <td className="p-2 border-r border-slate-900">: After issuance of Employment Offer Letter</td>
                      <td className="p-2 border-r border-slate-900 font-mono">As per Demand</td>
                      <td className="p-2">Within 3 Days</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold border-r border-slate-900">Stage 3</td>
                      <td className="p-2 border-r border-slate-900">: After visa approval / stamping</td>
                      <td className="p-2 border-r border-slate-900 font-mono">As per Demand</td>
                      <td className="p-2">Before Stamping</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-slate-600 italic">
                <b>Note:</b> The number of Payment Stages, their triggers, and the amounts may vary between projects and will be agreed upon in writing before commencement. All amounts mentioned are inclusive of applicable taxes.
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <h5 className="font-bold text-xs uppercase">2. PROCESSING CHARGE</h5>
              <p className="text-xs">
                If the candidate withdraws after the case is activated (i.e., after the first Payment Stage has been realized), a non-refundable processing charge of <b>{processingCharge}</b> shall be deducted from the first Payment Stage amount received. The balance, if any, shall be refunded in accordance with the Refund Policy in the main MoU.
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <h5 className="font-bold text-xs uppercase">3. PAYMENT CONDITIONS</h5>
              <p className="text-xs">
                3.1. Each Payment Stage must be made only after the corresponding milestone is achieved and upon receipt of an invoice from the First Party.<br />
                3.2. All payments shall be made to the First Party’s official bank account, details of which will be provided on the invoice.<br />
                3.3. No cash payments or deposits will be entertained.<br />
                3.4. The Second Party shall retain proof of all payments made and share transaction references as part of the record.<br />
                3.5. The First Party shall issue a tax-compliant invoice for each Payment Stage received.
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <h5 className="font-bold text-xs uppercase">4. COMMISSIONS & SUB-AGENTS</h5>
              <p className="text-xs">
                4.1. No commission, incentive, or referral fee is payable by the First Party to the Second Party under this arrangement.
              </p>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">18</div>
        </div>

        
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-5">
            <p className="text-xs">
              4.2. The Second Party may charge candidates a service fee at its discretion but shall bear full and sole responsibility for all such collections.<br />
              4.3. The First Party shall not be liable for:<br />
              &nbsp;&nbsp;&nbsp;&nbsp;4.3.1. Any payment promises made by the Second Party to candidates or third parties.<br />
              &nbsp;&nbsp;&nbsp;&nbsp;4.3.2. Any commission or profit-sharing arrangements made by the Second Party with sub-agents or intermediaries.<br />
              &nbsp;&nbsp;&nbsp;&nbsp;4.3.3. Any claims, disputes, or refund demands arising from the Second Party’s internal pricing structure.
            </p>

            <div className="space-y-2 pt-2">
              <h5 className="font-bold text-xs uppercase">5. OFFICIAL BANK DETAILS FOR PAYMENT</h5>
              <p className="text-xs">
                All payments from the Second Party to the First Party shall be made only to the following:
              </p>

              <div className="border border-slate-900 p-4 font-mono text-xs space-y-1">
                <p className="font-bold">OFFICIAL BANK ACCOUNT OF IMMIGO EDUCARE LLP:</p>
                <p>Account Name: <b>IMMIGO EDUCARE LLP</b></p>
                <p>Account Number: <b>925020043404157</b></p>
                <p>Bank Name: <b>AXIS BANK</b></p>
                <p>Branch: <b>SECTOR – 45, NOIDA</b></p>
                <p>IFSC Code: <b>UTIB0004491</b></p>
                <p>SWIFT Code (if applicable):</p>
              </div>

              <p className="text-[11px] text-slate-600 italic">
                <b>Important Note:</b> Payments made to any other account shall not be considered valid or acknowledged. The First Party shall not be responsible for payments made to personal accounts, third-party accounts, or accounts not listed above.
              </p>
            </div>

            <div className="space-y-1 pt-2">
              <h5 className="font-bold text-xs uppercase">6. REFUNDS & CHARGEBACKS</h5>
              <p className="text-xs">
                6.1. Refunds, if any, shall be handled strictly in accordance with the Refund Policy outlined in the main MoU.<br />
                6.2. No refund requests shall be entertained based on internal disputes between the Second Party and its clients or associates.
              </p>
            </div>

            <div className="space-y-1 pt-2">
              <h5 className="font-bold text-xs uppercase">7. NON-PAYMENT CONSEQUENCES</h5>
              <p className="text-xs">
                7.1. Failure to adhere to the above payment schedule may result in:<br />
                &nbsp;&nbsp;&nbsp;&nbsp;7.1.1. Immediate suspension of processing for the concerned candidate(s).<br />
                &nbsp;&nbsp;&nbsp;&nbsp;7.1.2. Termination of the MoU by the First Party without further notice.<br />
                &nbsp;&nbsp;&nbsp;&nbsp;7.1.3. Withholding of documents, visa files, or offer letters until dues are cleared.<br />
                &nbsp;&nbsp;&nbsp;&nbsp;7.1.4. Legal recovery proceedings, if necessary.<br />
                &nbsp;&nbsp;&nbsp;&nbsp;7.1.5. Any amounts already paid shall be refunded as per Refund Policy upon termination due to non-payment, and the First Party reserves the right to recover unpaid dues for work completed prior to termination.
              </p>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">19</div>
        </div>

        
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base uppercase">
                ANNEXURE 2
              </h3>
              <h4 className="font-bold text-sm uppercase text-slate-800">
                CANDIDATE PROCESSING WORKFLOW
              </h4>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="font-bold">Step 1 – Candidate Introduction</p>
                <p>
                  1. Second Party collects and verifies candidate’s documents (as per annexure 3).<br />
                  2. Second Party submits the complete profile to the First Party via official channel (email/portal/CRM).<br />
                  3. Profile must include: personal details, qualifications, work experience, and supporting documentation.
                </p>
              </div>

              <div>
                <p className="font-bold">Step 2 – Profile Review by First Party</p>
                <p>
                  1. First Party reviews documents against current job demands and eligibility criteria.<br />
                  2. Status options: <b>Approved</b>, <b>Rejected</b>, or <b>Pending Additional Information</b>.<br />
                  3. Upon provisional approval, a unique candidate reference number is assigned.
                </p>
              </div>

              <div>
                <p className="font-bold">Step 3 – Case Activation</p>
                <p>
                  1. The first Payment Stage (as defined in Annexure 1) is invoiced to the Second Party.<br />
                  2. Case is deemed active only when the first Payment Stage is realized in the First Party’s official bank account.<br />
                  3. No services are initiated until this payment is received in full.<br />
                  4. If the candidate withdraws at any time after activation, the processing charge specified in Annexure 1 shall be deducted from the first Payment Stage amount received. The balance amount (if any) will be refunded in accordance with the Refund Policy.
                </p>
              </div>

              <div>
                <p className="font-bold">Step 4 – Service Delivery by First Party</p>
                <p>
                  1. Upon activation, the First Party begins agreed services, including:<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;1.1. Documentation verification<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;1.2. Employer-side coordination & offer letter issuance<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;1.3. Visa application filing and embassy/VFS liaison<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;1.4. Travel facilitation and employer-side onboarding instructions<br />
                  2. Regular updates are shared with the Second Party.
                </p>
              </div>

              <div>
                <p className="font-bold">Step 5 – Subsequent Payment Stages</p>
                <p>
                  1. Payments for subsequent Payment Stages are triggered only after the respective milestones are achieved, as described in Annexure 1.<br />
                  2. Each stage requires full payment within the timeline mentioned in Annexure 1 from the invoice date.
                </p>
              </div>

              <div>
                <p className="font-bold">Step 6 – Case Closure</p>
                <p>
                  1. A case is officially closed when:<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;1.1. Candidate joins the employer overseas; OR<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;1.2. Case is closed under Refund Policy; OR<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;1.3. Candidate withdraws/becomes ineligible and all financial adjustments (including deduction of the processing charge) are completed.<br />
                  2. Upon closure, First Party updates system records; no further services or obligations remain.
                </p>
              </div>

              <div>
                <p className="font-bold">Step 7 – Record Retention</p>
                <p>
                  1. Both Parties maintain case records, payment proofs, and communication for <b>24 months</b> from case closure date.
                </p>
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">20</div>
        </div>

        
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base uppercase">
                ANNEXURE 3
              </h3>
              <h4 className="font-bold text-sm uppercase text-slate-800">
                CANDIDATE DOCUMENT CHECK LIST
              </h4>
            </div>

            <p className="text-xs">
              All candidates submitted by the Second Party to the First Party must have the following documents, verified and compiled in the order below. Incomplete submissions will not be accepted or registered in the system.
            </p>

            <div className="border border-slate-900 font-sans text-[11px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 font-bold">
                    <th className="p-1.5 border-r border-slate-900 w-12 text-center">SNO</th>
                    <th className="p-1.5 border-r border-slate-900">DOCUMENT DESCRIPTION</th>
                    <th className="p-1.5 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  <tr className="bg-slate-100 font-bold">
                    <td className="p-1.5 text-center border-r border-slate-900">1.</td>
                    <td className="p-1.5" colSpan={2}>PERSONAL IDENTIFICATION</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">1.1.</td>
                    <td className="p-1.5 border-r border-slate-900">Valid Passport (Min. 1 year validity) *</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">1.2.</td>
                    <td className="p-1.5 border-r border-slate-900">National ID (Adhaar card, any other) (if applicable)</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">1.3.</td>
                    <td className="p-1.5 border-r border-slate-900">Birth Certificate (if applicable)</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr className="bg-slate-100 font-bold">
                    <td className="p-1.5 text-center border-r border-slate-900">2.</td>
                    <td className="p-1.5" colSpan={2}>EDUCATIONAL & TRAINING CREDENTIALS</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">2.1.</td>
                    <td className="p-1.5 border-r border-slate-900">High School / Secondary Education Certificates *</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">2.2.</td>
                    <td className="p-1.5 border-r border-slate-900">Higher Education Certificate / Diplomas / Degrees *</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">2.3.</td>
                    <td className="p-1.5 border-r border-slate-900">Vocational Training Certificates (if required) *</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">2.4.</td>
                    <td className="p-1.5 border-r border-slate-900">Professional Licenses / Trade Test Certificates (if required) *</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr className="bg-slate-100 font-bold">
                    <td className="p-1.5 text-center border-r border-slate-900">3.</td>
                    <td className="p-1.5" colSpan={2}>EMPLOYMENT HISTORY</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">3.1.</td>
                    <td className="p-1.5 border-r border-slate-900">Updated Resume / CV *</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">3.2.</td>
                    <td className="p-1.5 border-r border-slate-900">Salary Slips / Pay Records (last 3 months, if required)</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">3.3.</td>
                    <td className="p-1.5 border-r border-slate-900">Reference Letters (if applicable)</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr className="bg-slate-100 font-bold">
                    <td className="p-1.5 text-center border-r border-slate-900">4.</td>
                    <td className="p-1.5" colSpan={2}>LANGUAGE & SKILLS PROOF</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">4.1.</td>
                    <td className="p-1.5 border-r border-slate-900">English Language Proficiency Certificate (if required)</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">4.2.</td>
                    <td className="p-1.5 border-r border-slate-900">Other Language Proficiency Certificates (if required)</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr className="bg-slate-100 font-bold">
                    <td className="p-1.5 text-center border-r border-slate-900">5.</td>
                    <td className="p-1.5" colSpan={2}>HEALTH & FITNESS DOCUMENTS</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">5.1.</td>
                    <td className="p-1.5 border-r border-slate-900">Pre-Medical Fitness Certificate</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">5.2.</td>
                    <td className="p-1.5 border-r border-slate-900">Vaccination Records</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr className="bg-slate-100 font-bold">
                    <td className="p-1.5 text-center border-r border-slate-900">6.</td>
                    <td className="p-1.5" colSpan={2}>SUPPORTING DOCUMENTS</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">6.1.</td>
                    <td className="p-1.5 border-r border-slate-900">Passport Size Photographs (as per embassy specs) *</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">6.2.</td>
                    <td className="p-1.5 border-r border-slate-900">Police Clearance Certificate (PCC) (if required)</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">6.3.</td>
                    <td className="p-1.5 border-r border-slate-900">Poof of Address *</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr className="bg-slate-100 font-bold">
                    <td className="p-1.5 text-center border-r border-slate-900">7.</td>
                    <td className="p-1.5" colSpan={2}>ADDITIONAL DOCUMENTS (IF ROLE-SPECIFIC)</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">7.1.</td>
                    <td className="p-1.5 border-r border-slate-900">Driving License</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">7.2.</td>
                    <td className="p-1.5 border-r border-slate-900">Special Permits (aviation, maritime etc)</td>
                    <td className="p-1.5"></td>
                  </tr>
                  <tr>
                    <td className="p-1.5 text-center border-r border-slate-900">7.3.</td>
                    <td className="p-1.5 border-r border-slate-900">Portfolio / Work Samples (If required)</td>
                    <td className="p-1.5"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-2 text-xs space-y-3">
              <p>
                I hereby certify that all documents listed above have been verified and are being submitted in complete form.
              </p>
              <div>
                <p>Name & Signature of Second Party Representative: <b>{secondPartyRep}</b></p>
                <p>Date: <b>{agreementDate}</b></p>
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">21</div>
        </div>

        
        <div className="mou-page max-w-4xl mx-auto bg-white shadow-md border border-slate-200 sm:rounded-xl p-8 sm:p-14 mb-8 text-slate-900 text-sm leading-relaxed font-sans text-justify relative min-h-[1050px] flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <p className="font-bold text-xs uppercase mb-2">IMPORTANT SUBMISSION CONDITIONS:</p>
              <ol className="list-decimal pl-5 space-y-2 text-xs">
                <li>All documents must be scanned in colour, clear, and readable, in PDF format (no photographs of documents).</li>
                <li>The Second Party must verify authenticity of all documents before submission.</li>
                <li>Any falsified, altered, or incomplete documentation will result in immediate rejection of the profile and may lead to blacklisting of the Second Party.</li>
                <li>Documents should be sent in a single zipped folder named in the format: <b>[CandidateName_PassportNumber]</b>.</li>
                <li>No case will be reviewed until this checklist is fully met.</li>
              </ol>
            </div>

            <div className="pt-10 border-t border-slate-300">
              <div className="border border-slate-900 overflow-hidden font-sans">
                <div className="grid grid-cols-2 border-b border-slate-900 text-xs font-bold uppercase p-3">
                  <div>ON BEHALF OF IMMIGO EDUCARE LLP</div>
                  <div className="border-l border-slate-900 pl-3">ON BEHALF OF {secondPartyName}</div>
                </div>
                <div className="grid grid-cols-2 p-4 min-h-[170px] items-end text-xs">
                  <div className="space-y-1">
                    <div className="font-serif italic text-lg font-bold text-slate-900 pb-1 border-b border-slate-300 w-52">
                      {firstPartyRep}
                    </div>
                    <p className="font-bold text-slate-900">{firstPartyRep}</p>
                    <p className="text-slate-600 uppercase text-[10px]">{firstPartyDesignation}</p>
                    <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Digitally Authorized & Sealed
                    </p>
                  </div>

                  <div className="border-l border-slate-900 pl-4 space-y-1">
                    {isSigned ? (
                      <>
                        <div className="font-serif italic text-lg font-bold text-slate-900 pb-1 border-b border-slate-300 w-52">
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
                        <div className="h-12 border-b border-dashed border-slate-400 w-52 flex items-end text-slate-400 italic text-[11px]">
                          [Authorized Signatory]
                        </div>
                        <p className="font-bold text-slate-900">
                          {secondPartyRep}
                        </p>
                        <p className="text-slate-600 uppercase text-[10px]">
                          {secondPartyDesignation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-mono pt-8">22</div>
        </div>
      </div>

      
      {(mode === "sign" || (!isSigned && mode === "preview" && vendor?.role === "vendor")) && (
        <form
          onSubmit={handleVendorSignSubmit}
          className="mou-print-hide print:hidden max-w-4xl mx-auto bg-white rounded-xl border border-indigo-200 shadow-md p-6 sm:p-8 space-y-6 mb-12"
        >
          <div className="border-b border-indigo-100 pb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-indigo-600" />
              <span>Digital Execution & Acceptance of Partnership MOU</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Please enter your legal signatory particulars to digitally execute this Memorandum of Understanding for <b>{secondPartyName}</b>.
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
