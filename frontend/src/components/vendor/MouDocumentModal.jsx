import React, { useRef } from "react";
import { X, Printer, Download, CheckCircle2, ShieldCheck, FileText } from "lucide-react";

export default function MouDocumentModal({ isOpen, onClose, vendor, signedData, onSignClick }) {
  const printRef = useRef(null);

  if (!isOpen) return null;

  const effectiveDate = vendor?.mouDocument?.sentAt
    ? new Date(vendor.mouDocument.sentAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  const mouRefNumber = `MOU-VND-${vendor?.id || vendor?.vendorId || "001"}-2026`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 rounded-lg border border-blue-400/30">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Official Memorandum of Understanding (MOU)
              </h2>
              <p className="text-xs text-blue-200/80 font-mono">
                Ref No: {mouRefNumber} &bull; Standard Partner Agreement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition cursor-pointer"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Printable Content Area */}
        <div
          ref={printRef}
          className="flex-1 overflow-y-auto p-6 sm:p-10 font-serif text-slate-800 text-sm leading-relaxed space-y-6 select-text bg-white"
        >
          {/* Document Header */}
          <div className="text-center border-b-2 border-slate-900 pb-6 space-y-2">
            <div className="inline-block px-3 py-1 rounded bg-blue-50 border border-blue-200 text-blue-900 font-sans text-[11px] font-black uppercase tracking-wider mb-1">
              ImmiGo Global &bull; Vista Overseas Workforce
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-wide font-sans uppercase">
              MEMORANDUM OF UNDERSTANDING (MOU)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-sans font-medium">
              FOR OVERSEAS MANPOWER SOURCING & RECRUITMENT PARTNERSHIP
            </p>
            <div className="text-xs font-mono text-slate-500 pt-1">
              Reference Document ID: <span className="font-bold text-slate-900">{mouRefNumber}</span> | Date: {effectiveDate}
            </div>
          </div>

          {/* Parties Introduction */}
          <div className="space-y-3 font-sans text-xs sm:text-sm bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700">
            <p className="leading-relaxed">
              This Memorandum of Understanding (hereinafter referred to as the <b>"MOU"</b>) is entered into on this{" "}
              <b>{effectiveDate}</b>, by and between:
            </p>
            <div className="pl-4 border-l-2 border-blue-600 space-y-2">
              <p>
                <b>FIRST PARTY (The Company):</b> <span className="font-bold text-slate-900">Vista Overseas Solutions / ImmiGo Global Overseas</span>, having its principal corporate operations in India, engaged in overseas recruitment, talent sourcing, and human capital deployment.
              </p>
              <p className="text-center font-bold text-slate-400 font-sans text-xs uppercase tracking-widest my-1">- AND -</p>
              <p>
                <b>SECOND PARTY (The Recruitment Partner / Vendor):</b>{" "}
                <span className="font-bold text-slate-900">{vendor?.companyName || "Vendor Agency"}</span>, having registered business registration number{" "}
                <b>{vendor?.registrationNumber || "Applied/Verified"}</b>, with primary office address located at{" "}
                <b>{vendor?.address || `${vendor?.city || "Mumbai"}, ${vendor?.state || "Maharashtra"}, ${vendor?.country || "India"}`}</b>, represented by its authorized representative{" "}
                <b>{vendor?.contactPersonName || "Authorized Signatory"}</b>.
              </p>
            </div>
          </div>

          {/* Recitals & Clauses */}
          <div className="space-y-4 font-sans text-xs sm:text-sm text-slate-700">
            <div>
              <h3 className="font-bold text-slate-900 font-sans text-sm uppercase tracking-wide border-b border-slate-200 pb-1 mb-2">
                1. Purpose & Scope of Partnership
              </h3>
              <p className="text-xs sm:text-sm text-justify leading-relaxed">
                The First Party regularly receives demands for skilled, semi-skilled, and professional manpower from verified international employers. The Second Party represents and warrants that it possesses the requisite infrastructure, technical capability, and statutory eligibility to mobilize, screen, and submit qualified candidates for such requirements.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 font-sans text-sm uppercase tracking-wide border-b border-slate-200 pb-1 mb-2">
                2. Statutory & Ethical Compliance
              </h3>
              <p className="text-xs sm:text-sm text-justify leading-relaxed">
                The Second Party strictly covenants that it adheres to all applicable emigration laws, Ministry of External Affairs regulations, and international fair recruitment conventions. The Second Party shall <b>NOT</b> charge unauthorized illegal visa fees, engage in candidate extortion, or misrepresent job descriptions to candidates. Any violation shall lead to immediate termination and blacklisting.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 font-sans text-sm uppercase tracking-wide border-b border-slate-200 pb-1 mb-2">
                3. Candidate Verification & Dossiers
              </h3>
              <p className="text-xs sm:text-sm text-justify leading-relaxed">
                The Second Party guarantees that all candidate credentials submitted through the portal—including educational diplomas, trade test certifications, passport details, and medical fitness (GAMCA/approved clinic reports)—are authentic and thoroughly pre-screened prior to presentation.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 font-sans text-sm uppercase tracking-wide border-b border-slate-200 pb-1 mb-2">
                4. Commercial Terms & Settlement
              </h3>
              <p className="text-xs sm:text-sm text-justify leading-relaxed">
                Commission rates, agency margins, or placement incentives shall be defined separately per demand order or milestone pipeline. All disbursements shall be processed via bank transfer upon successful visa issuance and candidate onboarding as specified in the milestone schedule.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 font-sans text-sm uppercase tracking-wide border-b border-slate-200 pb-1 mb-2">
                5. Confidentiality & Non-Circumvention
              </h3>
              <p className="text-xs sm:text-sm text-justify leading-relaxed">
                The Second Party agrees not to circumvent, contact, or solicit direct business from international employer clients introduced by the First Party for a period of twenty-four (24) months following the termination of this agreement.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 font-sans text-sm uppercase tracking-wide border-b border-slate-200 pb-1 mb-2">
                6. Term, Modification & Jurisdiction
              </h3>
              <p className="text-xs sm:text-sm text-justify leading-relaxed">
                This MOU is valid for an initial period of twelve (12) months from the date of execution and shall automatically renew. This agreement is governed by the laws of India, and disputes shall be subject to arbitration under the Arbitration and Conciliation Act.
              </p>
            </div>
          </div>

          {/* Signatures Block */}
          <div className="pt-6 border-t-2 border-slate-300 font-sans">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 text-center">
              EXECUTED BY DULY AUTHORIZED REPRESENTATIVES
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* First Party Sign */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-blue-900">FIRST PARTY (Licensor)</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={12} /> Digitally Sealed
                  </span>
                </div>
                <div className="font-serif italic text-lg text-blue-900 font-bold border-b border-blue-200 pb-2">
                  Vista Enterprise Authority
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p><b>Authority:</b> Director of Global Operations</p>
                  <p><b>Company:</b> Vista Overseas / ImmiGo Global</p>
                  <p className="font-mono text-[10px] text-slate-400">Timestamp: {effectiveDate}</p>
                </div>
              </div>

              {/* Second Party Sign */}
              <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-slate-900">SECOND PARTY (Vendor Partner)</span>
                  {vendor?.mouSigned || signedData?.signedAt ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={12} /> Digitally Executed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Pending Signature
                    </span>
                  )}
                </div>

                {vendor?.mouSigned || signedData?.signedAt ? (
                  <div className="font-serif italic text-lg text-indigo-900 font-bold border-b border-slate-300 pb-2">
                    {signedData?.signatureData || vendor?.signedMou?.signatureData || vendor?.contactPersonName || "Signed Electronically"}
                  </div>
                ) : (
                  <div className="py-2 border-b border-dashed border-slate-300 text-slate-400 text-xs italic">
                    [Awaiting Digital Signature]
                  </div>
                )}

                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>
                    <b>Signatory:</b>{" "}
                    {signedData?.signatoryName || vendor?.signedMou?.signatoryName || vendor?.contactPersonName || "Managing Director"}
                  </p>
                  <p>
                    <b>Designation:</b>{" "}
                    {signedData?.designation || vendor?.signedMou?.designation || "Authorized Representative"}
                  </p>
                  <p>
                    <b>Agency:</b> {vendor?.companyName}
                  </p>
                  {(signedData?.signedAt || vendor?.signedMou?.signedAt) && (
                    <p className="font-mono text-[10px] text-emerald-600">
                      Executed: {new Date(signedData?.signedAt || vendor?.signedMou?.signedAt).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500">
            {vendor?.mouSigned
              ? "✅ This MOU agreement has been executed and is legally binding."
              : "⚠️ This agreement requires your digital signature before your vendor dashboard is activated."}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
            {!vendor?.mouSigned && onSignClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignClick();
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Proceed to Sign MOU</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
