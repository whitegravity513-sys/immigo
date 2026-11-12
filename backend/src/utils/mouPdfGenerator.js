const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_LEFT = 46;
const MARGIN_RIGHT = 46;
const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;
const TOP_Y = PAGE_H - 58;
const BOTTOM_Y = 52;

const sanitizeAscii = (value) =>
  String(value ?? "")
    .replace(/\u20b9/g, "INR ")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2022/g, "*")
    .replace(/\u00a0/g, " ")
    .replace(/[^\x20-\x7e]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const pdfEscape = (value) =>
  sanitizeAscii(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const wrapText = (text, fontSize = 9.5, maxWidth = CONTENT_W, isBold = false) => {
  const clean = sanitizeAscii(text);
  if (!clean) return [""];
  const avgCharWidth = fontSize * (isBold ? 0.56 : 0.51);
  const maxChars = Math.max(20, Math.floor(maxWidth / avgCharWidth));
  const words = clean.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + " " + word).length <= maxChars) {
      current += " " + word;
    } else {
      lines.push(current);
      if (word.length > maxChars) {
        let rest = word;
        while (rest.length > maxChars) {
          lines.push(rest.slice(0, maxChars));
          rest = rest.slice(maxChars);
        }
        current = rest;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
};

const formatDisplayDate = (dateVal) => {
  if (!dateVal) {
    return new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (typeof dateVal === "string" && !/^\d{4}-\d{2}-\d{2}/.test(dateVal) && isNaN(Date.parse(dateVal))) {
    return sanitizeAscii(dateVal);
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return sanitizeAscii(dateVal);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const resolveVendorAddress = (vendor = {}) => {
  if (vendor.address && String(vendor.address).trim()) {
    return String(vendor.address).trim().toUpperCase();
  }
  if (vendor.registeredAddress && String(vendor.registeredAddress).trim()) {
    return String(vendor.registeredAddress).trim().toUpperCase();
  }
  const parts = [
    vendor.street,
    vendor.area,
    vendor.city,
    vendor.district,
    vendor.state,
    vendor.pinCode || vendor.pincode || vendor.postalCode,
    vendor.country || "INDIA",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ").toUpperCase() : "REGISTERED CORPORATE OFFICE, INDIA";
};

export const generateMouPdfBuffer = (vendor = {}, options = {}) => {
  const firstPartyName = "IMMIGO EDUCARE LLP";
  const firstPartyLLPIN = "ACP - 1662";
  const firstPartyAddress =
    "C-76, BASEMENT, SECTOR-88, PHASE-2, NOIDA, BISRAKH POLICE STATION, NOIDA, GAUTAM BUDDHA NAGAR - 201301, UTTAR PRADESH, INDIA";
  const firstPartyRep = String(vendor?.mouDocument?.adminSignatoryName || "MR. HIMANSHU SINGH").toUpperCase();
  const firstPartyDesignation = String(vendor?.mouDocument?.adminDesignation || "MANAGING PARTNER").toUpperCase();

  const secondPartyName = String(
    vendor?.companyName || vendor?.agencyName || vendor?.contactPersonName || "VENDOR PARTNER"
  ).toUpperCase();
  const secondPartyAddress = resolveVendorAddress(vendor);
  const secondPartyRep = String(
    vendor?.signedMou?.signatoryName || vendor?.contactPersonName || "AUTHORIZED SIGNATORY"
  ).toUpperCase();
  const secondPartyDesignation = String(
    vendor?.signedMou?.designation ||
      vendor?.designation ||
      (vendor?.businessType === "Partnership" || vendor?.businessType === "LLP"
        ? "MANAGING PARTNER"
        : vendor?.businessType === "Proprietorship"
        ? "PROPRIETOR"
        : "MANAGING DIRECTOR")
  ).toUpperCase();

  const vendorId = String(vendor?.vendorId || "").trim() || "N/A";
  const mouNumber = String(vendor?.mouDocument?.mouNumber || vendor?.mouDocument?.refNumber || "MOU-IMMIGO").trim();
  const agreementDate = formatDisplayDate(
    vendor?.mouDocument?.agreementDate || vendor?.signedMou?.signedAt || vendor?.mouDocument?.sentAt
  );
  const executionPlace = String(vendor?.city || vendor?.district || vendor?.state || "NOIDA").toUpperCase();
  const validityYears = String(vendor?.mouDocument?.validityYears || "one (1) year");
  const processingCharge = "INR 20,000.00 (INR TWENTY THOUSAND ONLY)";

  const stageLabel = String(options.stage || "").toLowerCase();
  const isApproved =
    stageLabel === "approved" ||
    vendor?.status === "Active" ||
    vendor?.mouStatus === "Approved";
  const isSigned =
    isApproved ||
    stageLabel === "signed" ||
    Boolean(vendor?.mouSigned) ||
    Boolean(vendor?.signedMou?.signedAt);

  const pages = [[]];
  let cursorY = TOP_Y;

  const newPage = () => {
    pages.push([]);
    cursorY = TOP_Y;
  };

  const ensureSpace = (needed) => {
    if (cursorY - needed < BOTTOM_Y) {
      newPage();
    }
  };

  const drawTextLine = (text, x, y, fontKey = "F1", size = 9.5, rgb = "0.08 0.11 0.16") => {
    pages[pages.length - 1].push(
      `BT /${fontKey} ${size} Tf ${rgb} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(text)}) Tj ET`
    );
  };

  const drawCentered = (text, y, fontKey = "F2", size = 12, rgb = "0.06 0.09 0.17") => {
    const clean = sanitizeAscii(text);
    const estWidth = clean.length * size * (fontKey === "F2" ? 0.55 : 0.5);
    const x = Math.max(MARGIN_LEFT, (PAGE_W - estWidth) / 2);
    drawTextLine(clean, x, y, fontKey, size, rgb);
  };

  const addHeading = (text, size = 10.5) => {
    ensureSpace(26);
    cursorY -= 6;
    const lines = wrapText(text, size, CONTENT_W, true);
    for (const line of lines) {
      ensureSpace(size + 5);
      drawTextLine(line, MARGIN_LEFT, cursorY, "F2", size, "0.06 0.15 0.35");
      cursorY -= size + 4;
    }
    cursorY -= 2;
  };

  const addParagraph = (text, optionsPara = {}) => {
    const size = optionsPara.size || 9.2;
    const lineHeight = optionsPara.lineHeight || size + 3.8;
    const indent = optionsPara.indent || 0;
    const fontKey = optionsPara.bold ? "F2" : optionsPara.italic ? "F3" : "F1";
    const rgb = optionsPara.rgb || "0.10 0.14 0.20";
    const lines = wrapText(text, size, CONTENT_W - indent, Boolean(optionsPara.bold));
    for (const line of lines) {
      ensureSpace(lineHeight + 2);
      drawTextLine(line, MARGIN_LEFT + indent, cursorY, fontKey, size, rgb);
      cursorY -= lineHeight;
    }
    cursorY -= optionsPara.gapAfter !== undefined ? optionsPara.gapAfter : 4;
  };

  const addBox = (title, rows = []) => {
    const rowLineHeight = 13;
    let totalLines = 1;
    const wrappedRows = rows.map((r) => {
      const lines = wrapText(r, 9, CONTENT_W - 20, false);
      totalLines += lines.length;
      return lines;
    });
    const boxHeight = totalLines * rowLineHeight + 18;
    ensureSpace(boxHeight + 8);
    const topBoxY = cursorY + 6;
    const bottomBoxY = topBoxY - boxHeight;
    pages[pages.length - 1].push(
      `0.95 0.97 0.99 rg 0.55 0.62 0.72 RG 0.8 w ${MARGIN_LEFT.toFixed(2)} ${bottomBoxY.toFixed(2)} ${CONTENT_W.toFixed(2)} ${boxHeight.toFixed(2)} re B`
    );
    cursorY -= 8;
    drawTextLine(title, MARGIN_LEFT + 10, cursorY, "F2", 9.5, "0.06 0.15 0.35");
    cursorY -= 14;
    for (const lines of wrappedRows) {
      for (const line of lines) {
        drawTextLine(line, MARGIN_LEFT + 10, cursorY, "F1", 8.8, "0.08 0.11 0.16");
        cursorY -= rowLineHeight;
      }
    }
    cursorY = bottomBoxY - 12;
  };

  ensureSpace(40);
  drawCentered("MEMORANDUM OF UNDERSTANDING (MOU)", cursorY, "F2", 13.5, "0.06 0.15 0.35");
  cursorY -= 16;
  drawCentered(`Ref No: ${mouNumber}   |   Vendor ID: ${vendorId}   |   Date: ${agreementDate}`, cursorY, "F1", 8.8, "0.35 0.42 0.52");
  cursorY -= 18;

  addParagraph(
    `This Memorandum of Understanding ("MOU") is entered on ${agreementDate} at ${executionPlace}, by:`
  );
  addParagraph(
    `"${firstPartyName}", a Limited Liability Partnership incorporated under the LLP Act, 2008, having LLP Identification Number (LLPIN) ${firstPartyLLPIN}, and its registered office at ${firstPartyAddress}, acting through its authorized representative ${firstPartyRep}, ${firstPartyDesignation} (hereinafter referred to as the "FIRST PARTY", which expression shall, unless repugnant to the context or meaning thereof, be deemed to mean and include its successors and permitted assigns);`
  );
  addParagraph("AND", { bold: true, indent: 215 });
  addParagraph(
    `"${secondPartyName}", having office at ${secondPartyAddress}, represented by ${secondPartyRep} (${secondPartyDesignation}) (hereinafter referred to as the "SECOND PARTY" / "BUSINESS ASSOCIATE", which expression shall unless repugnant to the context or meaning thereof be deemed to mean and include its successors, legal heirs, nominees and permitted assigns).`
  );
  addParagraph(
    `${firstPartyName} and ${secondPartyName} are individually referred to as First Party and Second Party respectively, and collectively referred to as Parties.`
  );

  addHeading("DEFINITIONS");
  const definitions = [
    '1. "First Party" - Immigo Educare LLP, the entity responsible for providing recruitment and immigration services.',
    '2. "Second Party" / "Business Associate" - The B2B partner engaging with the First Party under this MoU.',
    '3. "Candidate" - Any individual whose profile is submitted by the Second Party to the First Party for overseas employment processing.',
    '4. "Shortlisted Candidate" - A candidate who meets the initial eligibility criteria as determined by the First Party.',
    '5. "Active Case" / "Activation" - A candidate profile for which the first Payment Stage, as defined in the applicable Annexure, has been realized in the First Party\'s official bank account.',
    '6. "Withdrawn Candidate" - A candidate who voluntarily or involuntarily exits the recruitment process after the case has been activated.',
    '7. "Employer" - The overseas company, contractor, or agency offering employment to the Candidate through the First Party.',
    '8. "Job Demand" - An official manpower requirement issued by an Employer or its authorized representative to the First Party.',
    '9. "Payment Stage(s)" - The instalment(s) of the Service Fee payable by the Second Party to the First Party linked to milestones in Annexure 1.',
    `10. "Processing Charges" - The non-refundable administrative fee (${processingCharge}) deducted from the first Payment Stage if the Candidate withdraws after activation.`,
    '11. "Service Fee" - The total fixed amount payable by the Second Party to the First Party for processing each Candidate, as per Annexure 1.',
    '12. "Candidate Documentation" - All personal, professional, educational, medical, and legal documents submitted as per Annexure 3.',
    '13. "Confidential Information" - Any proprietary written, oral, or digital information of the First Party or ImmiGo Overseas Services LLP.',
    '14. "Data Protection Laws" - Applicable laws governing personal data protection in India and the destination country.',
    '15. "Services" - Recruitment, visa processing, and facilitation activities undertaken by the First Party.',
    '16. "Workflow" - The operational steps outlined in Annexure 2 forming an integral part of this MoU.',
    '17. "Annexures" - All attachments, schedules, and addendums integral to and enforceable under this MoU.',
    '18. "Breach" - Any violation of the obligations, terms, or conditions of this MoU by either Party.',
    '19. "Force Majeure Event" - Any unforeseeable circumstance beyond reasonable control preventing performance under this MoU.',
  ];
  for (const def of definitions) {
    addParagraph(def, { indent: 8, gapAfter: 2.5 });
  }

  addParagraph(
    "WHEREAS the FIRST PARTY provides overseas job opportunities based on employer demands across countries, handling visa processing and immigration services; AND WHEREAS the SECOND PARTY acts as an independent Business Associate generating candidate leads under mutually agreed commercial terms. NOW THEREFORE, the Parties agree to collaborate in strict compliance with the clauses below:"
  );

  const clauses = [
    {
      title: "1. BACKGROUND & 2. PURPOSE OF THE AGREEMENT",
      body: [
        "1.1. Immigo Educare LLP provides visa and immigration assistance services supported by a specialized documentation back-office team.",
        "2.1. The Parties enter into this MoU to collaborate on facilitating overseas employment opportunities and immigration processing.",
        "2.2. The Second Party sources and manages candidates independently while the First Party handles official documentation and visa processing.",
      ],
    },
    {
      title: "3. WORKING STRUCTURE",
      body: [
        "3.1. The Second Party shall independently collect payments from candidates at rates determined by the Second Party.",
        "3.2. The First Party shall charge a fixed Service Fee from the Second Party on a per-case basis as per Annexure 1.",
        "3.3. The Second Party shall retain any additional amount collected beyond the First Party's fixed Service Fee.",
      ],
    },
    {
      title: "4. ROLES, RESPONSIBILITIES, AND DELIVERABLES",
      body: [
        "4.1. First Party (Immigo Educare LLP): Provide accurate job demand details, handle verification, employer coordination, offer letter & visa filing support, collect agreed service charges per Annexure 1 with tax invoices, and abstain from interference in Second Party pricing unless branding is misused.",
        "4.2. Second Party (Business Associate): Independently promote demands, source eligible candidates, collect payments independently, disclose refund terms prior to submission, avoid unauthorized commitments or misuse of First Party credentials/branding, indemnify the First Party against candidate claims, and preserve confidentiality.",
      ],
    },
    {
      title: "5. NATURE OF ASSOCIATION",
      body: [
        "5.1. The Second Party acts strictly as an independent Business Associate. Nothing herein creates an employer-employee relationship, partnership, joint venture, or agency.",
        "5.2. The Second Party shall not bind the First Party legally or financially, open accounts in its name, or misrepresent authority. Breach entitles immediate termination and legal action.",
      ],
    },
    {
      title: "6. PAYMENT STRUCTURE",
      body: [
        "6.1. All payments due to the First Party follow the stages and timelines defined in Annexure 1 and are non-negotiable.",
        "6.2. Remittances must be made exclusively to the First Party's designated official bank account via NEFT/RTGS/IMPS/UPI or Demand Draft.",
        "6.3. Cash payments or cash deposits are strictly prohibited and will not be acknowledged.",
        "6.4. Invoices issued by the First Party are binding unless disputed in writing within seven (7) business days. Delays beyond due dates permit termination under Clause 7.",
      ],
    },
    {
      title: "7. REFUND POLICY",
      body: [
        "7.1. No refund is applicable if a candidate voluntarily withdraws at any stage after initial payment.",
        `7.2. If a candidate withdraws after Case Activation (realization of first Payment Stage), a non-refundable processing charge of ${processingCharge} shall be deducted, with remaining eligible balance handled per policy.`,
        "7.3. Fake, forged, incomplete, or misleading documents result in total forfeiture with zero refund and no liability on First Party.",
        "7.4. In embassy visa rejection not attributable to candidate error/documentation/background/misrepresentation, refund equals full amount received minus 18% GST and actual incurred expenses. Pre-visa medical failures are reviewed case-by-case minus actual costs and 18% GST. Post-visa/arrival medical failure carries no refund.",
        "7.5. Embassy/VFS/medical/translation/attestation/government levies are strictly non-refundable. Approved refunds are processed within 15 business days to original source/Second Party on written request only.",
      ],
    },
    {
      title: "8. COMMENCEMENT & 9. COORDINATION AND REVIEW",
      body: [
        `8.1. This MoU comes into effect on the date of execution and remains valid for ${validityYears}, extendable by mutual written agreement.`,
        "9.1. Both Parties designate primary Points of Contact, conduct periodic review meetings, and record binding minutes unless disputed within 5 working days.",
      ],
    },
    {
      title: "10. PROHIBITION ON FALSE PROMISES & 11-12. BRANDING / NDA",
      body: [
        "10.1. Second Party shall not guarantee job placement, fixed salaries, joining dates, visa approvals, or unauthorized refund assurances.",
        "11.1-12.3. Second Party is strictly prohibited from displaying or circulating MEA license numbers, LLPIN/PAN/GSTIN, addresses, logos, or branding of Immigo Educare LLP or ImmiGo Overseas Services LLP in digital/offline campaigns without prior written approval.",
      ],
    },
    {
      title: "13. BRAND PROTECTION, 14. BLACKLISTING & 15. COMPLIANCE WITH LAWS",
      body: [
        "13.1-14.2. Second Party shall refrain from defamatory activity and may be blacklisted without notice for complaints, fraud, misrepresentation, or breach.",
        "15.1-15.2. Second Party must comply with Indian labour laws, MEA recruitment guidelines, destination immigration laws, and data protection laws.",
      ],
    },
    {
      title: "16. TERMINATION & 17. SETTLEMENT UPON TERMINATION",
      body: [
        "16.1. Either Party may terminate with 30 days prior written notice. First Party may terminate immediately for fraud, unrectified breach (7 days), or credential misuse.",
        "17.1-17.7. Ongoing activated cases continue to completion/settlement; final reconciliation completes within 15 business days; confidentiality, indemnity, refund policy, dispute resolution, and non-disclosure clauses survive termination.",
      ],
    },
    {
      title: "18. CONFIDENTIALITY & 19. FORCE MAJEURE",
      body: [
        "18.1-18.7. Confidentiality over processes, employer details, pricing, and candidate data extends to ImmiGo Overseas Services LLP and survives 2 years post-termination.",
        "19.1-19.5. Force Majeure delays (natural disasters, war, pandemic, embassy closures, employer holds) suspend obligations without penalty upon 7-day notice.",
      ],
    },
    {
      title: "20. DISPUTE RESOLUTION, ARBITRATION & 21. OTHER COVENANTS",
      body: [
        "20.1-20.5. Disputes are resolved amicably first (15 + 10 business days), then binding arbitration under the Arbitration and Conciliation Act, 1996. Governed by Indian Law with exclusive jurisdiction of courts at Gautam Budh Nagar, Uttar Pradesh.",
        "21.1-21.6. Amendments require signed written instruments. Each Party bears its own staff/operations liability.",
      ],
    },
    {
      title: "22. ADDITIONAL PROTECTIONS",
      body: [
        "22.1. Candidate Source Ownership: Registered candidate profiles cannot be diverted by Second Party during validity and for 12 months thereafter.",
        "22.2. No Circumvention: Second Party shall not directly approach First Party employers/overseas partners during validity and for 24 months post-termination.",
        "22.3. Data Protection Penalty: Minimum INR 5,00,000/- (Rupees Five Lakh) per breach.",
        "22.4. Misrepresentation Penalty: Minimum INR 3,00,000/- (Rupees Three Lakh) per incident plus indemnification.",
        "22.5. Performance Target: Minimum 10 eligible candidate profiles per month.",
        "22.6. Criminal Jurisdiction: Courts at Gautam Budh Nagar, Uttar Pradesh.",
      ],
    },
  ];

  for (const c of clauses) {
    addHeading(c.title, 10);
    for (const b of c.body) {
      addParagraph(b, { indent: 6, gapAfter: 2.5 });
    }
  }

  addHeading("ANNEXURE 1 - SERVICE FEE, PAYMENT STAGES & OFFICIAL BANK DETAILS", 10);
  addParagraph(
    "Stage 1 (After resume selection & document submission): As per Demand - Due within 3 Days | Stage 2 (After Employment Offer Letter): As per Demand - Due within 3 Days | Stage 3 (After Visa Approval/Stamping): As per Demand - Due before Stamping.",
    { indent: 6 }
  );
  addParagraph(
    `Non-Refundable Processing Charge on post-activation withdrawal: ${processingCharge}. Cash deposits strictly prohibited.`,
    { indent: 6 }
  );
  addBox("OFFICIAL BANK ACCOUNT OF IMMIGO EDUCARE LLP (NEFT / RTGS / IMPS / UPI ONLY)", [
    "Account Name   : IMMIGO EDUCARE LLP",
    "Account Number : 925020043404157",
    "Bank Name      : AXIS BANK",
    "Branch         : SECTOR - 45, NOIDA",
    "IFSC Code      : UTIB0004491",
  ]);

  addHeading("ANNEXURE 2 - OPERATIONAL WORKFLOW & ANNEXURE 3 - DOCUMENT CHECKLIST", 10);
  addParagraph(
    "Workflow: Step 1 Job Demand Sharing -> Step 2 Candidate Sourcing & Provisional Approval -> Step 3 Case Activation (Stage 1 Payment Realized) -> Step 4 Service Delivery (Verification, Offer Letter, Visa Filing, Travel) -> Step 5 Subsequent Payment Stages -> Step 6 Case Closure -> Step 7 Record Retention (24 months).",
    { indent: 6 }
  );
  addParagraph(
    "Mandatory Candidate Documents: Valid Passport (min. 1 yr validity), National ID/Aadhaar, Educational/Training & Trade Certificates, Updated CV/Resume, Salary Slips/Experience Letters, Language Certificates (if required), Pre-Medical Fitness & Vaccination Records, Passport Photos, Police Clearance Certificate (PCC), Proof of Address, Role-Specific Licenses. Scans must be clear colour PDFs named [CandidateName_PassportNumber].",
    { indent: 6 }
  );

  const secondPartySigLines = isApproved
    ? [
        `Signature : ${sanitizeAscii(vendor?.signedMou?.signatureData || secondPartyRep)}`,
        `Signatory : ${sanitizeAscii(vendor?.signedMou?.signatoryName || secondPartyRep)}`,
        `Title     : ${sanitizeAscii(vendor?.signedMou?.designation || secondPartyDesignation)}`,
        `Status    : VERIFIED & EXECUTED (${formatDisplayDate(vendor?.verifiedAt || vendor?.signedMou?.signedAt || agreementDate)})`,
      ]
    : isSigned
    ? [
        `Signature : ${sanitizeAscii(vendor?.signedMou?.signatureData || secondPartyRep)}`,
        `Signatory : ${sanitizeAscii(vendor?.signedMou?.signatoryName || secondPartyRep)}`,
        `Title     : ${sanitizeAscii(vendor?.signedMou?.designation || secondPartyDesignation)}`,
        `Method    : ${vendor?.mouSignMethod === "upload" ? "Uploaded Signed Copy" : "Digital Signature"}`,
        `Status    : SIGNED ON ${formatDisplayDate(vendor?.signedMou?.signedAt)} (PENDING ADMIN APPROVAL)`,
      ]
    : [
        `Signatory : ${secondPartyRep}`,
        `Title     : ${secondPartyDesignation}`,
        "Status    : [PENDING VENDOR SIGNATURE]",
      ];

  addParagraph(
    `IN WITNESS WHEREOF, the Parties hereto have executed this Memorandum of Understanding (MoU) on ${agreementDate}.`,
    { bold: true, gapAfter: 6 }
  );

  addBox(`EXECUTION & SIGNATURES (MOU REF: ${mouNumber})`, [
    `FIRST PARTY  : ${firstPartyName}  |  Rep: ${firstPartyRep} (${firstPartyDesignation})  [Digitally Authorized & Sealed]`,
    `SECOND PARTY : ${secondPartyName}`,
    ...secondPartySigLines,
  ]);

  const totalPages = pages.length;
  for (let i = 0; i < totalPages; i++) {
    const pageIdx = i + 1;
    const cmds = pages[i];
    cmds.unshift(
      `0.22 0.30 0.45 RG 0.6 w ${MARGIN_LEFT.toFixed(2)} ${(PAGE_H - 38).toFixed(2)} ${CONTENT_W.toFixed(2)} 0 re S`,
      `BT /F2 8 Tf 0.10 0.18 0.36 rg 1 0 0 1 ${MARGIN_LEFT.toFixed(2)} ${(PAGE_H - 30).toFixed(2)} Tm (${pdfEscape(`IMMIGO EDUCARE LLP  |  OFFICIAL B2B MEMORANDUM OF UNDERSTANDING`)}) Tj ET`,
      `BT /F1 8 Tf 0.40 0.45 0.55 rg 1 0 0 1 ${(PAGE_W - MARGIN_RIGHT - 135).toFixed(2)} ${(PAGE_H - 30).toFixed(2)} Tm (${pdfEscape(`REF: ${mouNumber}`)}) Tj ET`,
      `0.82 0.85 0.90 RG 0.5 w ${MARGIN_LEFT.toFixed(2)} 38.00 ${CONTENT_W.toFixed(2)} 0 re S`,
      `BT /F1 7.8 Tf 0.42 0.47 0.55 rg 1 0 0 1 ${MARGIN_LEFT.toFixed(2)} 25.00 Tm (${pdfEscape(`ImmiGo Partner Onboarding  |  Vendor ID: ${vendorId}  |  Page ${pageIdx} of ${totalPages}`)}) Tj ET`
    );
  }

  const objects = [];
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  const pageObjectIds = [];
  const baseObjId = 6;
  for (let i = 0; i < pages.length; i++) {
    pageObjectIds.push(baseObjId + i * 2);
  }
  const kidsStr = pageObjectIds.map((id) => `${id} 0 R`).join(" ");
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${pages.length} >>\nendobj\n`);
  objects.push(`3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`);
  objects.push(`4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`);
  objects.push(`5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>\nendobj\n`);

  for (let i = 0; i < pages.length; i++) {
    const pageObjId = baseObjId + i * 2;
    const contentObjId = pageObjId + 1;
    const streamBody = pages[i].join("\n");
    const streamLen = Buffer.byteLength(streamBody, "latin1");
    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W.toFixed(2)} ${PAGE_H.toFixed(2)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
    );
    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamBody}\nendstream\nendobj\n`
    );
  }

  const chunks = [];
  const header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  chunks.push(Buffer.from(header, "latin1"));
  let offset = Buffer.byteLength(header, "latin1");
  const offsets = [0];

  for (const objStr of objects) {
    offsets.push(offset);
    const buf = Buffer.from(objStr, "latin1");
    chunks.push(buf);
    offset += buf.length;
  }

  const xrefOffset = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(Buffer.from(xref + trailer, "latin1"));

  return Buffer.concat(chunks);
};

export default {
  generateMouPdfBuffer,
};

