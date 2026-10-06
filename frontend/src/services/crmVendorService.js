// crmVendorService.js
// Dedicated storage and service layer for Vendor Portal and Admin Vendor Management
import crmClientService from "./crmClientService.js";

const VENDORS_STORAGE_KEY = "immigo_crm_vendors_v1";
const CANDIDATES_STORAGE_KEY = "immigo_crm_candidates_v1";
const APPLICATIONS_STORAGE_KEY = "immigo_crm_applications_v1";
const MILESTONE_TEMPLATES_KEY = "immigo_crm_milestone_templates_v1";
const VENDOR_NOTIFICATIONS_KEY = "immigo_crm_vendor_notifications_v1";

const delay = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

// INITIAL SEED DATA
const INITIAL_VENDORS = [
  {
    id: "VND-1001",
    companyName: "ABC Manpower Consultants",
    registrationNumber: "REG-IND-99421",
    email: "vendor@abcmanpower.com",
    password: "Password@123",
    phone: "+91 98765 43210",
    alternatePhone: "+91 98765 43211",
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    address: "Suite 402, Trade Link Towers, Senapati Bapat Marg, Lower Parel",
    website: "https://www.abcmanpower.com",
    contactPersonName: "Rajesh Varma",
    contactPersonEmail: "r.varma@abcmanpower.com",
    contactPersonPhone: "+91 98200 12345",
    businessType: "Overseas Recruitment Agency",
    specialization: "Technical & Construction Trades",
    countriesServed: ["UAE", "Saudi Arabia", "Qatar", "Oman"],
    employeeCount: "45",
    experienceYears: "12",
    status: "Approved", // Pending, Approved, Rejected, Suspended
    rejectionReason: "",
    registeredAt: "2026-08-15T09:30:00.000Z",
    verifiedAt: "2026-08-16T14:20:00.000Z",
    documents: [
      { name: "Recruitment License", fileName: "ra_license_abc.pdf", size: "1.4 MB", type: "License" },
      { name: "Company Registration Certificate", fileName: "cr_cert_abc.pdf", size: "2.1 MB", type: "Registration" },
      { name: "GST / Tax Certificate", fileName: "tax_cert_2026.pdf", size: "850 KB", type: "Tax" },
    ],
  },
  {
    id: "VND-1002",
    companyName: "GulfTech Staffing Solutions",
    registrationNumber: "REG-IND-55201",
    email: "contact@gulftechstaffing.com",
    password: "Password@123",
    phone: "+91 99887 76655",
    alternatePhone: "+91 99887 76650",
    country: "India",
    state: "Delhi",
    city: "New Delhi",
    address: "Plot 18, Commercial Complex, Connaught Place",
    website: "https://www.gulftechstaffing.com",
    contactPersonName: "Pooja Malhotra",
    contactPersonEmail: "pooja@gulftechstaffing.com",
    contactPersonPhone: "+91 99112 23344",
    businessType: "Engineering & IT Manpower",
    specialization: "Oil & Gas, Civil & MEP Engineering",
    countriesServed: ["UAE", "Saudi Arabia", "Kuwait"],
    employeeCount: "60",
    experienceYears: "9",
    status: "Pending", // Needs Admin Verification
    rejectionReason: "",
    registeredAt: "2026-10-02T11:15:00.000Z",
    verifiedAt: null,
    documents: [
      { name: "Ministry License", fileName: "mhrd_license.pdf", size: "1.8 MB", type: "License" },
      { name: "Registration Certificate", fileName: "gulftech_cr.pdf", size: "1.2 MB", type: "Registration" },
    ],
  },
  {
    id: "VND-1003",
    companyName: "Al-Baraka Human Resources Pvt Ltd",
    registrationNumber: "REG-IND-33129",
    email: "info@albarakahr.com",
    password: "Password@123",
    phone: "+91 98450 11223",
    alternatePhone: "",
    country: "India",
    state: "Kerala",
    city: "Kochi",
    address: "MG Road, Marine Drive Business Park",
    website: "https://www.albarakahr.com",
    contactPersonName: "Anas Sulaiman",
    contactPersonEmail: "anas@albarakahr.com",
    contactPersonPhone: "+91 98450 99887",
    businessType: "Hospitality & Facility Manpower",
    specialization: "Hospitality, Healthcare, Drivers",
    countriesServed: ["UAE", "Qatar", "Bahrain"],
    employeeCount: "30",
    experienceYears: "15",
    status: "Approved",
    rejectionReason: "",
    registeredAt: "2026-07-20T10:00:00.000Z",
    verifiedAt: "2026-07-22T16:00:00.000Z",
    documents: [
      { name: "Labor License", fileName: "albaraka_lic.pdf", size: "1.1 MB", type: "License" },
    ],
  },
  {
    id: "VND-1004",
    companyName: "Reliance Overseas Recruitment Ltd",
    registrationNumber: "REG-IND-88120",
    email: "ops@relianceoverseas.in",
    password: "Password@123",
    phone: "+91 98210 55443",
    alternatePhone: "+91 98210 55444",
    country: "India",
    state: "Punjab",
    city: "Chandigarh",
    address: "SCO 112-113, Sector 34-A",
    website: "https://www.relianceoverseas.in",
    contactPersonName: "Harpreet Singh",
    contactPersonEmail: "h.singh@relianceoverseas.in",
    contactPersonPhone: "+91 98210 55445",
    businessType: "Overseas Recruitment Agency",
    specialization: "Heavy Equipment Drivers & Heavy Trades",
    countriesServed: ["UAE", "Saudi Arabia", "Kuwait", "Oman"],
    employeeCount: "50",
    experienceYears: "14",
    status: "Approved",
    rejectionReason: "",
    registeredAt: "2026-06-10T09:00:00.000Z",
    verifiedAt: "2026-06-12T11:00:00.000Z",
    documents: [
      { name: "MEA License 2026", fileName: "mea_lic_reliance.pdf", size: "1.5 MB", type: "License" },
      { name: "CR Certificate", fileName: "cr_reliance.pdf", size: "2.0 MB", type: "Registration" },
    ],
  },
  {
    id: "VND-1005",
    companyName: "Apex International Placements",
    registrationNumber: "REG-IND-66321",
    email: "contact@apexplacements.com",
    password: "Password@123",
    phone: "+91 98400 99881",
    alternatePhone: "",
    country: "India",
    state: "Tamil Nadu",
    city: "Chennai",
    address: "Mount Road, Anna Salai Commercial Center",
    website: "https://www.apexplacements.com",
    contactPersonName: "Karthik Subramanian",
    contactPersonEmail: "karthik@apexplacements.com",
    contactPersonPhone: "+91 98400 99882",
    businessType: "Technical & MEP Recruitment",
    specialization: "HVAC, Instrumentation & MEP Trades",
    countriesServed: ["UAE", "Qatar"],
    employeeCount: "25",
    experienceYears: "7",
    status: "Pending", // 2nd Pending Vendor
    rejectionReason: "",
    registeredAt: "2026-10-03T15:20:00.000Z",
    verifiedAt: null,
    documents: [
      { name: "Provisional Trade License", fileName: "apex_lic_prov.pdf", size: "900 KB", type: "License" },
    ],
  },
  {
    id: "VND-1006",
    companyName: "Himalayan Manpower Bureau",
    registrationNumber: "REG-NPL-10042",
    email: "info@himalayanmanpower.np",
    password: "Password@123",
    phone: "+977 1 4421100",
    alternatePhone: "",
    country: "Nepal",
    state: "Bagmati",
    city: "Kathmandu",
    address: "Gairidhara Road, Ward No 2",
    website: "https://www.himalayanmanpower.np",
    contactPersonName: "Bikash Shrestha",
    contactPersonEmail: "bikash@himalayanmanpower.np",
    contactPersonPhone: "+977 980 1122334",
    businessType: "Foreign Employment Agency",
    specialization: "Security Guards, General Construction, Hospitality",
    countriesServed: ["UAE", "Qatar", "Malaysia"],
    employeeCount: "35",
    experienceYears: "11",
    status: "Approved",
    rejectionReason: "",
    registeredAt: "2026-05-18T08:30:00.000Z",
    verifiedAt: "2026-05-20T10:15:00.000Z",
    documents: [
      { name: "Nepal Labor Ministry License", fileName: "dofe_license_nepal.pdf", size: "1.7 MB", type: "License" },
    ],
  },
  {
    id: "VND-1007",
    companyName: "Dhaka Global Manpower Services",
    registrationNumber: "REG-BGD-40192",
    email: "recruitment@dhakaglobal.com",
    password: "Password@123",
    phone: "+880 2 9887766",
    alternatePhone: "",
    country: "Bangladesh",
    state: "Dhaka",
    city: "Dhaka",
    address: "Gulshan-1, Navana Tower, Level 8",
    website: "https://www.dhakaglobal.com",
    contactPersonName: "Mahmudur Rahman",
    contactPersonEmail: "mahmud@dhakaglobal.com",
    contactPersonPhone: "+880 171 2233445",
    businessType: "Recruiting Agency",
    specialization: "Masonry, Carpentry, Shuttering, Civil",
    countriesServed: ["Saudi Arabia", "Kuwait", "UAE"],
    employeeCount: "40",
    experienceYears: "13",
    status: "Approved",
    rejectionReason: "",
    registeredAt: "2026-06-05T12:00:00.000Z",
    verifiedAt: "2026-06-08T14:00:00.000Z",
    documents: [
      { name: "BMET Recruiting License", fileName: "bmet_lic_dhaka.pdf", size: "2.2 MB", type: "License" },
    ],
  },
  {
    id: "VND-1008",
    companyName: "Colombo Star Overseas Pvt Ltd",
    registrationNumber: "REG-LKA-99014",
    email: "admin@colombostar.lk",
    password: "Password@123",
    phone: "+94 11 2334455",
    alternatePhone: "",
    country: "Sri Lanka",
    state: "Western",
    city: "Colombo",
    address: "Galle Road, Kollupitiya",
    website: "https://www.colombostar.lk",
    contactPersonName: "Dinesh Perera",
    contactPersonEmail: "dinesh@colombostar.lk",
    contactPersonPhone: "+94 77 1234567",
    businessType: "Overseas Recruitment Agency",
    specialization: "Hospitality, F&B, Facility Services",
    countriesServed: ["UAE", "Oman", "Bahrain"],
    employeeCount: "20",
    experienceYears: "8",
    status: "Suspended", // 1 Suspended Vendor
    rejectionReason: "Annual compliance audit renewal pending submission.",
    registeredAt: "2026-04-12T10:00:00.000Z",
    verifiedAt: "2026-04-15T12:00:00.000Z",
    documents: [
      { name: "SLBFE License", fileName: "slbfe_license.pdf", size: "1.3 MB", type: "License" },
    ],
  },
  {
    id: "VND-1009",
    companyName: "Manila Elite Care & Tech Staffing",
    registrationNumber: "REG-PHL-77401",
    email: "info@manilastaffing.ph",
    password: "Password@123",
    phone: "+63 2 8991122",
    alternatePhone: "",
    country: "Philippines",
    state: "Metro Manila",
    city: "Makati",
    address: "Ayala Avenue, Makati Central Square",
    website: "https://www.manilastaffing.ph",
    contactPersonName: "Maria Santos",
    contactPersonEmail: "maria@manilastaffing.ph",
    contactPersonPhone: "+63 917 5544332",
    businessType: "Overseas Placement Agency",
    specialization: "Healthcare, Nursing, Hospitality & Aviation",
    countriesServed: ["UAE", "Saudi Arabia", "Qatar"],
    employeeCount: "45",
    experienceYears: "16",
    status: "Approved",
    rejectionReason: "",
    registeredAt: "2026-05-02T11:00:00.000Z",
    verifiedAt: "2026-05-04T15:30:00.000Z",
    documents: [
      { name: "DMW / POEA License", fileName: "poea_dmw_license.pdf", size: "1.9 MB", type: "License" },
    ],
  },
  {
    id: "VND-1010",
    companyName: "Indus Valley Staffing Solutions",
    registrationNumber: "REG-IND-11402",
    email: "contact@indusvalleystaffing.com",
    password: "Password@123",
    phone: "+91 98300 44556",
    alternatePhone: "",
    country: "India",
    state: "West Bengal",
    city: "Kolkata",
    address: "Salt Lake Sector V, Tech Park",
    website: "https://www.indusvalleystaffing.com",
    contactPersonName: "Debashis Roy",
    contactPersonEmail: "debashis@indusvalleystaffing.com",
    contactPersonPhone: "+91 98300 44557",
    businessType: "Engineering & Construction",
    specialization: "Heavy Civil, Scaffolding, Rigger",
    countriesServed: ["UAE", "Saudi Arabia"],
    employeeCount: "30",
    experienceYears: "10",
    status: "Approved",
    rejectionReason: "",
    registeredAt: "2026-07-01T10:00:00.000Z",
    verifiedAt: "2026-07-03T11:45:00.000Z",
    documents: [
      { name: "Recruitment License", fileName: "indus_lic.pdf", size: "1.4 MB", type: "License" },
    ],
  },
  {
    id: "VND-1011",
    companyName: "Orient Gulf Recruiters Ltd",
    registrationNumber: "REG-IND-90214",
    email: "ops@orientgulfrecruiters.com",
    password: "Password@123",
    phone: "+91 97111 88990",
    alternatePhone: "",
    country: "India",
    state: "Uttar Pradesh",
    city: "Lucknow",
    address: "Hazratganj Business Complex",
    website: "https://www.orientgulfrecruiters.com",
    contactPersonName: "Mohd. Tariq",
    contactPersonEmail: "tariq@orientgulfrecruiters.com",
    contactPersonPhone: "+91 97111 88991",
    businessType: "Manpower Supplier",
    specialization: "Civil, Steel Fixers, Tile Masons",
    countriesServed: ["Saudi Arabia", "Qatar"],
    employeeCount: "20",
    experienceYears: "5",
    status: "Pending", // 3rd Pending Vendor (Total 3 Pending!)
    rejectionReason: "",
    registeredAt: "2026-10-04T09:15:00.000Z",
    verifiedAt: null,
    documents: [
      { name: "Company Reg Document", fileName: "orient_cr.pdf", size: "1.1 MB", type: "Registration" },
    ],
  },
  {
    id: "VND-1012",
    companyName: "Royal Emirates Manpower Partner",
    registrationNumber: "REG-IND-44219",
    email: "partner@royalemiratesmp.com",
    password: "Password@123",
    phone: "+91 98480 33221",
    alternatePhone: "",
    country: "India",
    state: "Telangana",
    city: "Hyderabad",
    address: "Banjara Hills, Road No 10",
    website: "https://www.royalemiratesmp.com",
    contactPersonName: "Mirza Baig",
    contactPersonEmail: "baig@royalemiratesmp.com",
    contactPersonPhone: "+91 98480 33222",
    businessType: "Manpower Consultancy",
    specialization: "Ducting, Insulators, Welders, Millwrights",
    countriesServed: ["UAE", "Saudi Arabia", "Oman"],
    employeeCount: "38",
    experienceYears: "12",
    status: "Approved",
    rejectionReason: "",
    registeredAt: "2026-06-25T11:00:00.000Z",
    verifiedAt: "2026-06-28T14:30:00.000Z",
    documents: [
      { name: "Registration Certificate", fileName: "royal_cr.pdf", size: "1.6 MB", type: "Registration" },
    ],
  },
];

const INITIAL_CANDIDATES = [
  {
    id: "CND-501",
    vendorId: "VND-1001",
    fullName: "Rahul Kumar",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    dob: "1994-06-15",
    gender: "Male",
    nationality: "Indian",
    phone: "+91 98765 00112",
    email: "rahul.kumar94@gmail.com",
    address: "H.No 44, Patel Nagar, Patna, Bihar, India",
    currentPosition: "Electrician",
    skills: ["Industrial Wiring", "Conduit Bending", "Panel Assembly", "Circuit Breakers", "3-Phase Power"],
    experienceYears: "5",
    qualification: "ITI Electrical (2 Years)",
    previousCompany: "L&T Construction India",
    expectedSalary: "1800",
    salaryCurrency: "AED",
    preferredCountry: "UAE",
    tags: ["Electrician", "ITI", "5 Years Experience", "UAE", "Industrial", "Electrical"],
    documents: [
      { name: "Rahul Kumar Resume", fileName: "Rahul_Kumar_CV.pdf", size: "420 KB", type: "Resume" },
      { name: "Passport Front & Back", fileName: "Rahul_Passport.pdf", size: "1.1 MB", type: "Passport" },
      { name: "ITI Electrical Certificate", fileName: "ITI_Certificate.pdf", size: "890 KB", type: "Education" },
      { name: "Experience Letter", fileName: "LT_Exp_Letter.pdf", size: "540 KB", type: "Experience" },
    ],
    createdAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: "CND-502",
    vendorId: "VND-1001",
    fullName: "Amit Sharma",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    dob: "1992-03-22",
    gender: "Male",
    nationality: "Indian",
    phone: "+91 98111 22334",
    email: "amit.sharma.welder@gmail.com",
    address: "Village Rampur, Dist. Alwar, Rajasthan, India",
    currentPosition: "Welder 6G / TIG",
    skills: ["6G Pipe Welding", "TIG / MIG Welding", "Structural Steel", "Blueprint Reading"],
    experienceYears: "7",
    qualification: "Diploma in Mechanical Trade (Welding)",
    previousCompany: "Tata Projects Ltd",
    expectedSalary: "2200",
    salaryCurrency: "SAR",
    preferredCountry: "Saudi Arabia",
    tags: ["Welder", "6G TIG", "7 Years Experience", "Saudi Arabia", "Industrial", "Oil & Gas"],
    documents: [
      { name: "Amit Sharma Resume", fileName: "Amit_Sharma_CV.pdf", size: "380 KB", type: "Resume" },
      { name: "Passport Copy", fileName: "Amit_Passport.pdf", size: "1.2 MB", type: "Passport" },
      { name: "Welding Certification", fileName: "6G_Cert.pdf", size: "950 KB", type: "Certification" },
    ],
    createdAt: "2026-08-22T14:30:00.000Z",
  },
  {
    id: "CND-503",
    vendorId: "VND-1001",
    fullName: "Suresh Verma",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    dob: "1996-11-05",
    gender: "Male",
    nationality: "Indian",
    phone: "+91 97234 56789",
    email: "suresh.v.mason@outlook.com",
    address: "Mohalla Ganj, Varanasi, Uttar Pradesh, India",
    currentPosition: "Mason / Tile Layer",
    skills: ["Bricklaying", "Blockwork", "Plastering", "Ceramic & Marble Tiling"],
    experienceYears: "4",
    qualification: "10th Pass + Mason Trade Test Certificate",
    previousCompany: "Shapoorji Pallonji EPC",
    expectedSalary: "1400",
    salaryCurrency: "AED",
    preferredCountry: "UAE",
    tags: ["Mason", "Tile Layer", "4 Years Experience", "UAE", "Construction"],
    documents: [
      { name: "Suresh Verma CV", fileName: "Suresh_Verma_CV.pdf", size: "310 KB", type: "Resume" },
      { name: "Passport Copy", fileName: "Suresh_Passport.pdf", size: "1.0 MB", type: "Passport" },
    ],
    createdAt: "2026-08-25T11:00:00.000Z",
  },
  {
    id: "CND-504",
    vendorId: "VND-1001",
    fullName: "Vikram Singh",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
    dob: "1990-08-19",
    gender: "Male",
    nationality: "Indian",
    phone: "+91 94123 45678",
    email: "vikram.civil.site@gmail.com",
    address: "House 12, Sector 15, Chandigarh, India",
    currentPosition: "Civil Site Supervisor",
    skills: ["Site Supervision", "Bar Bending Schedule (BBS)", "AutoCAD", "Quality Control", "Team Leadership"],
    experienceYears: "8",
    qualification: "Diploma in Civil Engineering",
    previousCompany: "Gammon India Ltd",
    expectedSalary: "4000",
    salaryCurrency: "AED",
    preferredCountry: "UAE",
    tags: ["Civil Supervisor", "Site Engineer", "8 Years Experience", "UAE", "Construction"],
    documents: [
      { name: "Vikram Singh Resume", fileName: "Vikram_Singh_CV.pdf", size: "520 KB", type: "Resume" },
      { name: "Passport", fileName: "Vikram_Passport.pdf", size: "1.3 MB", type: "Passport" },
      { name: "Diploma Certificate", fileName: "Civil_Diploma.pdf", size: "1.1 MB", type: "Education" },
    ],
    createdAt: "2026-08-28T16:00:00.000Z",
  },
  {
    id: "CND-505",
    vendorId: "VND-1001",
    fullName: "Deepak Choudhary",
    photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80",
    dob: "1995-12-10",
    gender: "Male",
    nationality: "Indian",
    phone: "+91 98777 66554",
    email: "deepak.plumber@gmail.com",
    address: "Main Basti, Rohtak, Haryana, India",
    currentPosition: "Plumber & Pipe Fitter",
    skills: ["PPR & PVC Piping", "Drainage Systems", "Hydro Testing", "Sanitary Installation"],
    experienceYears: "4",
    qualification: "ITI Plumber Trade Certificate",
    previousCompany: "DLF Building Infra",
    expectedSalary: "1600",
    salaryCurrency: "QAR",
    preferredCountry: "Qatar",
    tags: ["Plumber", "Pipe Fitter", "4 Years Experience", "Qatar", "MEP"],
    documents: [
      { name: "Deepak Resume", fileName: "Deepak_CV.pdf", size: "290 KB", type: "Resume" },
      { name: "Passport", fileName: "Deepak_Passport.pdf", size: "980 KB", type: "Passport" },
    ],
    createdAt: "2026-09-02T10:20:00.000Z",
  },
];

// CANDIDATE APPLICATIONS / SUBMISSIONS (PER-PROJECT INDEPENDENT STATUS)
const INITIAL_APPLICATIONS = [
  // Demonstration of Rahul Kumar having different statuses on different projects!
  {
    id: "APP-8001",
    vendorId: "VND-1001",
    candidateId: "CND-501",
    candidateName: "Rahul Kumar",
    clientId: "cl-1",
    clientName: "Al-Futtaim Construction Group",
    projectId: "PRJ-101",
    projectName: "Dubai South Luxury Tower Phase 2",
    requirementCode: "REQ-0008",
    position: "Electrician",
    country: "UAE",
    submittedAt: "2026-09-01T10:00:00.000Z",
    status: "Rejected", // Rejected for this project
    rejectionReason: "Client required 7+ years of GCC experience specifically; candidate had 5 years India experience.",
    rejectionDate: "2026-09-05T14:30:00.000Z",
  },
  {
    id: "APP-8002",
    vendorId: "VND-1001",
    candidateId: "CND-501",
    candidateName: "Rahul Kumar",
    clientId: "cl-2",
    clientName: "Arabtec Holding PJSC",
    projectId: "PRJ-102",
    projectName: "Riyadh Metro Line 3 Extension",
    requirementCode: "REQ-0012",
    position: "Electrician",
    country: "Saudi Arabia",
    submittedAt: "2026-09-12T11:00:00.000Z",
    status: "Selected", // SELECTED for this project!
    selectionDate: "2026-09-15T16:00:00.000Z",
    rejectionReason: "",
    // Processing Timeline for Selected Candidate (8 stages)
    processing: {
      currentStageIndex: 3, // 0 to 7 (Index 3 = Medical)
      stages: [
        { key: "selected", name: "Candidate Selected", status: "completed", date: "2026-09-15", note: "Client interview cleared with Grade A" },
        { key: "docs_pending", name: "Documents Pending", status: "completed", date: "2026-09-17", note: "Attested education and police clearance gathered" },
        { key: "docs_verified", name: "Documents Verified", status: "completed", date: "2026-09-19", note: "Saudi Embassy attestation verified" },
        { key: "medical", name: "Medical (GAMCA)", status: "in_progress", date: "2026-09-22", note: "GAMCA Medical test scheduled in Mumbai" },
        { key: "visa", name: "Visa Processing", status: "pending", date: "", note: "Visa quota pre-approved" },
        { key: "ticket", name: "Ticket / Travel", status: "pending", date: "", note: "Air flight Riyadh pending visa stamping" },
        { key: "deployed", name: "Deployed on Site", status: "pending", date: "", note: "Site camp ready" },
        { key: "completed", name: "Completed", status: "pending", date: "", note: "End of mobilization phase" },
      ],
    },
    // Milestone Payment Plan
    paymentPlan: {
      totalAmount: 40000,
      currency: "INR",
      milestones: [
        {
          id: "M1",
          name: "Milestone 1 - Selection & Document Submission",
          percentage: 25,
          amount: 10000,
          dueDate: "2026-09-20",
          status: "Paid",
          paidDate: "2026-09-20",
          paymentRef: "NEFT-99238472",
        },
        {
          id: "M2",
          name: "Milestone 2 - GAMCA Medical Clearance",
          percentage: 25,
          amount: 10000,
          dueDate: "2026-09-30",
          status: "Due",
          paidDate: "",
          paymentRef: "",
        },
        {
          id: "M3",
          name: "Milestone 3 - Visa Stamping & Flight Ticket",
          percentage: 25,
          amount: 10000,
          dueDate: "2026-10-15",
          status: "Pending",
          paidDate: "",
          paymentRef: "",
        },
        {
          id: "M4",
          name: "Milestone 4 - On-Site Deployment & Client Sign-off",
          percentage: 25,
          amount: 10000,
          dueDate: "2026-10-31",
          status: "Pending",
          paidDate: "",
          paymentRef: "",
        },
      ],
    },
  },
  {
    id: "APP-8003",
    vendorId: "VND-1001",
    candidateId: "CND-501",
    candidateName: "Rahul Kumar",
    clientId: "cl-3",
    clientName: "Emaar Properties",
    projectId: "PRJ-103",
    projectName: "Downtown Commercial Mall Renovation",
    requirementCode: "REQ-0020",
    position: "Maintenance Electrician",
    country: "UAE",
    submittedAt: "2026-10-01T09:30:00.000Z",
    status: "Under Review",
    rejectionReason: "",
  },
  {
    id: "APP-8004",
    vendorId: "VND-1001",
    candidateId: "CND-502",
    candidateName: "Amit Sharma",
    clientId: "cl-1",
    clientName: "Al-Futtaim Construction Group",
    projectId: "PRJ-101",
    projectName: "Dubai South Luxury Tower Phase 2",
    requirementCode: "REQ-0009",
    position: "Welder 6G / TIG",
    country: "UAE",
    submittedAt: "2026-09-10T14:00:00.000Z",
    status: "Under Review",
    rejectionReason: "",
  },
  {
    id: "APP-8005",
    vendorId: "VND-1001",
    candidateId: "CND-503",
    candidateName: "Suresh Verma",
    clientId: "cl-1",
    clientName: "Al-Futtaim Construction Group",
    projectId: "PRJ-101",
    projectName: "Dubai South Luxury Tower Phase 2",
    requirementCode: "REQ-0010",
    position: "Mason / Tile Layer",
    country: "UAE",
    submittedAt: "2026-09-08T15:20:00.000Z",
    status: "Selected",
    selectionDate: "2026-09-14T10:00:00.000Z",
    rejectionReason: "",
    processing: {
      currentStageIndex: 1, // Documents Pending
      stages: [
        { key: "selected", name: "Candidate Selected", status: "completed", date: "2026-09-14", note: "Approved by site foreman" },
        { key: "docs_pending", name: "Documents Pending", status: "in_progress", date: "2026-09-16", note: "Awaiting original passport deposit" },
        { key: "docs_verified", name: "Documents Verified", status: "pending", date: "", note: "" },
        { key: "medical", name: "Medical (GAMCA)", status: "pending", date: "", note: "" },
        { key: "visa", name: "Visa Processing", status: "pending", date: "", note: "" },
        { key: "ticket", name: "Ticket / Travel", status: "pending", date: "", note: "" },
        { key: "deployed", name: "Deployed on Site", status: "pending", date: "", note: "" },
        { key: "completed", name: "Completed", status: "pending", date: "", note: "" },
      ],
    },
    paymentPlan: {
      totalAmount: 35000,
      currency: "INR",
      milestones: [
        { id: "M1", name: "Milestone 1 - Selection", percentage: 30, amount: 10500, dueDate: "2026-09-25", status: "Paid", paidDate: "2026-09-24", paymentRef: "RTGS-883719" },
        { id: "M2", name: "Milestone 2 - Medical & Visa", percentage: 40, amount: 14000, dueDate: "2026-10-10", status: "Pending", paidDate: "", paymentRef: "" },
        { id: "M3", name: "Milestone 3 - Deployment", percentage: 30, amount: 10500, dueDate: "2026-10-28", status: "Pending", paidDate: "", paymentRef: "" },
      ],
    },
  },
  {
    id: "APP-8006",
    vendorId: "VND-1001",
    candidateId: "CND-504",
    candidateName: "Vikram Singh",
    clientId: "cl-2",
    clientName: "Arabtec Holding PJSC",
    projectId: "PRJ-102",
    projectName: "Riyadh Metro Line 3 Extension",
    requirementCode: "REQ-0015",
    position: "Civil Site Supervisor",
    country: "Saudi Arabia",
    submittedAt: "2026-08-30T10:00:00.000Z",
    status: "Completed",
    selectionDate: "2026-09-02T12:00:00.000Z",
    rejectionReason: "",
    processing: {
      currentStageIndex: 7, // Completed
      stages: [
        { key: "selected", name: "Candidate Selected", status: "completed", date: "2026-09-02", note: "Direct client video interview passed" },
        { key: "docs_pending", name: "Documents Pending", status: "completed", date: "2026-09-04", note: "Degree attestation done" },
        { key: "docs_verified", name: "Documents Verified", status: "completed", date: "2026-09-06", note: "Ministry verified" },
        { key: "medical", name: "Medical (GAMCA)", status: "completed", date: "2026-09-09", note: "Fit certified" },
        { key: "visa", name: "Visa Processing", status: "completed", date: "2026-09-14", note: "Saudi Work Visa stamped" },
        { key: "ticket", name: "Ticket / Travel", status: "completed", date: "2026-09-18", note: "SV-781 Mumbai to Riyadh" },
        { key: "deployed", name: "Deployed on Site", status: "completed", date: "2026-09-20", note: "Joined site office Metro Line 3" },
        { key: "completed", name: "Completed", status: "completed", date: "2026-09-25", note: "Full handover completed" },
      ],
    },
    paymentPlan: {
      totalAmount: 50000,
      currency: "INR",
      milestones: [
        { id: "M1", name: "Milestone 1 - Selection", percentage: 25, amount: 12500, dueDate: "2026-09-05", status: "Paid", paidDate: "2026-09-05", paymentRef: "NEFT-112233" },
        { id: "M2", name: "Milestone 2 - Medical Clearance", percentage: 25, amount: 12500, dueDate: "2026-09-12", status: "Paid", paidDate: "2026-09-11", paymentRef: "NEFT-445566" },
        { id: "M3", name: "Milestone 3 - Visa Stamped", percentage: 25, amount: 12500, dueDate: "2026-09-16", status: "Paid", paidDate: "2026-09-16", paymentRef: "NEFT-778899" },
        { id: "M4", name: "Milestone 4 - Mobilized on Site", percentage: 25, amount: 12500, dueDate: "2026-09-25", status: "Paid", paidDate: "2026-09-24", paymentRef: "NEFT-990011" },
      ],
    },
  },
  {
    id: "APP-8007",
    vendorId: "VND-1001",
    candidateId: "CND-505",
    candidateName: "Deepak Choudhary",
    clientId: "cl-1",
    clientName: "Al-Futtaim Construction Group",
    projectId: "PRJ-101",
    projectName: "Dubai South Luxury Tower Phase 2",
    requirementCode: "REQ-0011",
    position: "Plumber",
    country: "UAE",
    submittedAt: "2026-09-28T09:00:00.000Z",
    status: "Shortlisted",
    rejectionReason: "",
  },
];

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    vendorId: "VND-1001",
    title: "Candidate Selected",
    message: "Rahul Kumar has been selected for Riyadh Metro Line 3 Extension.",
    type: "success",
    timestamp: "2026-09-15T16:05:00.000Z",
    read: false,
    link: "/vendor/selected",
  },
  {
    id: "notif-2",
    vendorId: "VND-1001",
    title: "Milestone 2 Payment Due",
    message: "Milestone 2 payment (₹10,000) for Rahul Kumar is now due upon GAMCA clearance.",
    type: "warning",
    timestamp: "2026-09-25T11:00:00.000Z",
    read: false,
    link: "/vendor/payments",
  },
  {
    id: "notif-3",
    vendorId: "VND-1001",
    title: "Candidate Deployment Completed",
    message: "Vikram Singh has been successfully deployed on site. All milestones paid.",
    type: "info",
    timestamp: "2026-09-25T18:00:00.000Z",
    read: true,
    link: "/vendor/selected",
  },
  {
    id: "notif-4",
    vendorId: "VND-1001",
    title: "Candidate Application Rejected",
    message: "Application for Rahul Kumar on Dubai South Luxury Tower Phase 2 was rejected. Candidate is reusable.",
    type: "error",
    timestamp: "2026-09-05T14:35:00.000Z",
    read: true,
    link: "/vendor/rejected",
  },
];

// Helper to load/save
const loadData = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading key ${key}:`, e);
    return fallback;
  }
};

const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving key ${key}:`, e);
  }
};

export const crmVendorService = {
  // ----------------------------------------------------
  // VENDOR AUTH & REGISTRATION
  // ----------------------------------------------------
  registerVendor: async (vendorData) => {
    await delay(120);
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);

    // Check if email already registered
    const existing = vendors.find(
      (v) => v.email?.toLowerCase() === vendorData.email?.toLowerCase()
    );
    if (existing) {
      throw new Error("This email is already registered as a vendor. Please sign in or contact support.");
    }

    const newVendor = {
      ...vendorData,
      id: `VND-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "Pending", // Pending admin verification
      rejectionReason: "",
      registeredAt: new Date().toISOString(),
      verifiedAt: null,
      documents: vendorData.documents || [],
    };

    vendors.unshift(newVendor);
    saveData(VENDORS_STORAGE_KEY, vendors);
    return newVendor;
  },

  loginVendor: async (emailOrId, password) => {
    await delay(150);
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const trimmed = (emailOrId || "").trim().toLowerCase();

    const vendor = vendors.find(
      (v) =>
        (v.email?.toLowerCase() === trimmed || v.id?.toLowerCase() === trimmed) &&
        v.password === password
    );

    if (!vendor) {
      throw new Error("Invalid Vendor ID/Email or Password.");
    }

    if (vendor.status === "Pending") {
      throw new Error(
        "Your vendor account registration is Pending Admin Verification. You will receive access once approved by Admin."
      );
    }

    if (vendor.status === "Rejected") {
      throw new Error(
        `Your vendor account application was Rejected by Admin. Reason: ${vendor.rejectionReason || "Verification criteria not met."}`
      );
    }

    if (vendor.status === "Suspended") {
      throw new Error("Your vendor account has been temporarily Suspended. Please contact Admin.");
    }

    // Return session payload
    return {
      token: `vendor-jwt-${Date.now()}`,
      vendor,
    };
  },

  getCurrentVendor: () => {
    try {
      const stored = localStorage.getItem("immigo_user");
      if (!stored) return INITIAL_VENDORS[0];
      const parsed = JSON.parse(stored);
      if (parsed?.role === "vendor" || parsed?.companyName) {
        // Also ensure we read latest updated state from storage
        const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
        const fresh = vendors.find((v) => v.id === parsed.id || v.email === parsed.email);
        return fresh || parsed;
      }
      return INITIAL_VENDORS[0];
    } catch {
      return INITIAL_VENDORS[0];
    }
  },

  updateVendorProfile: async (vendorId, profileData) => {
    await delay(80);
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const idx = vendors.findIndex((v) => v.id === vendorId);
    if (idx === -1) throw new Error("Vendor not found");

    vendors[idx] = {
      ...vendors[idx],
      ...profileData,
    };
    saveData(VENDORS_STORAGE_KEY, vendors);
    return vendors[idx];
  },

  changeVendorPassword: async (vendorId, oldPassword, newPassword) => {
    await delay(100);
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const idx = vendors.findIndex((v) => v.id === vendorId);
    if (idx === -1) throw new Error("Vendor not found");

    if (vendors[idx].password !== oldPassword) {
      throw new Error("Current password entered is incorrect.");
    }

    vendors[idx].password = newPassword;
    saveData(VENDORS_STORAGE_KEY, vendors);
    return true;
  },

  // ----------------------------------------------------
  // CANDIDATES CREATION & MANAGEMENT
  // ----------------------------------------------------
  createCandidate: async (vendorId, candidateData) => {
    await delay(120);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const newCandidate = {
      ...candidateData,
      id: `CND-${Math.floor(550 + Math.random() * 450)}`,
      vendorId: vendorId || "VND-1001",
      status: candidateData.status || "Available",
      createdAt: new Date().toISOString(),
      dob: candidateData.dob || "1995-05-10",
      registeredDate: candidateData.registeredDate || new Date().toISOString().split("T")[0],
      passportIssueDate: candidateData.passportIssueDate || "2020-01-15",
      passportExpiryDate: candidateData.passportExpiryDate || "2030-01-14",
      documents: candidateData.documents || [
        { name: "Resume / CV", fileName: `${(candidateData.fullName || "Candidate").replace(/\s+/g, "_")}_Resume.pdf`, size: "1.2 MB", type: "Resume" },
        { name: "Passport Copy", fileName: `${(candidateData.fullName || "Candidate").replace(/\s+/g, "_")}_Passport.pdf`, size: "1.8 MB", type: "Passport" },
      ],
    };

    candidates.unshift(newCandidate);
    saveData(CANDIDATES_STORAGE_KEY, candidates);
    return newCandidate;
  },

  updateCandidatePhoto: async (candidateId, photoBase64) => {
    await delay(60);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const idx = candidates.findIndex((c) => c.id === candidateId);
    if (idx === -1) throw new Error("Candidate not found.");

    candidates[idx].photo = photoBase64;
    saveData(CANDIDATES_STORAGE_KEY, candidates);
    return candidates[idx];
  },

  updateCandidate: async (candidateId, updateData) => {
    await delay(60);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const idx = candidates.findIndex((c) => c.id === candidateId);
    if (idx === -1) throw new Error("Candidate not found.");

    candidates[idx] = {
      ...candidates[idx],
      ...updateData,
    };
    saveData(CANDIDATES_STORAGE_KEY, candidates);
    return candidates[idx];
  },

  // ----------------------------------------------------
  // ADMIN VENDOR MANAGEMENT
  // ----------------------------------------------------
  getVendors: async ({ search = "", status = "All", country = "All" } = {}) => {
    await delay(80);
    let vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);

    if (status !== "All") {
      vendors = vendors.filter((v) => v.status === status);
    }
    if (country !== "All") {
      vendors = vendors.filter((v) => v.country === country);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      vendors = vendors.filter(
        (v) =>
          v.companyName?.toLowerCase().includes(q) ||
          v.id?.toLowerCase().includes(q) ||
          v.contactPersonName?.toLowerCase().includes(q) ||
          v.email?.toLowerCase().includes(q) ||
          v.specialization?.toLowerCase().includes(q)
      );
    }

    return vendors;
  },

  registerVendor: async (vendorData) => {
    await delay(100);
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const existing = vendors.find(
      (v) => v.email?.toLowerCase() === vendorData.email?.toLowerCase()
    );
    if (existing) {
      throw new Error(`Vendor with email ${vendorData.email} is already registered.`);
    }

    const newVendor = {
      id: `VND-${Math.floor(1000 + Math.random() * 9000)}`,
      companyName: vendorData.companyName || "New Manpower Agency",
      registrationNumber: vendorData.registrationNumber || `REG-${Date.now().toString().slice(-6)}`,
      email: vendorData.email,
      password: vendorData.password || "Password@123",
      phone: vendorData.phone || vendorData.contactPersonPhone || "+91 98765 00000",
      country: vendorData.country || "India",
      state: vendorData.state || "Maharashtra",
      city: vendorData.city || "Mumbai",
      address: vendorData.address || "Main Office Address",
      website: vendorData.website || "",
      contactPersonName: vendorData.contactPersonName || "Contact Person",
      contactPersonEmail: vendorData.contactPersonEmail || vendorData.email,
      contactPersonPhone: vendorData.contactPersonPhone || vendorData.phone,
      businessType: vendorData.businessType || "Overseas Recruitment Agency",
      specialization: vendorData.specialization || "Technical Trades",
      countriesServed: vendorData.countriesServed || ["UAE", "Saudi Arabia"],
      employeeCount: "25",
      experienceYears: vendorData.experienceYears || "5",
      status: vendorData.status || "Approved",
      registeredAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      documents: vendorData.documents || [],
      loginUrl: `${window.location.origin}/vendor/login`,
    };

    vendors.unshift(newVendor);
    saveData(VENDORS_STORAGE_KEY, vendors);

    return newVendor;
  },

  getVendorById: async (vendorId) => {
    await delay(40);
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    return vendors.find((v) => v.id === vendorId) || null;
  },

  approveVendor: async (vendorId) => {
    await delay(80);
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const idx = vendors.findIndex((v) => v.id === vendorId);
    if (idx === -1) throw new Error("Vendor not found");

    vendors[idx].status = "Approved";
    vendors[idx].verifiedAt = new Date().toISOString();
    vendors[idx].rejectionReason = "";
    saveData(VENDORS_STORAGE_KEY, vendors);

    // Create notification for vendor
    crmVendorService.addNotification({
      vendorId,
      title: "Vendor Account Approved",
      message: `Your account for ${vendors[idx].companyName} has been verified and approved by Admin. You now have full access to submit candidates.`,
      type: "success",
      link: "/vendor/dashboard",
    });

    return vendors[idx];
  },

  rejectVendor: async (vendorId, reason = "") => {
    await delay(80);
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const idx = vendors.findIndex((v) => v.id === vendorId);
    if (idx === -1) throw new Error("Vendor not found");

    vendors[idx].status = "Rejected";
    vendors[idx].rejectionReason = reason;
    saveData(VENDORS_STORAGE_KEY, vendors);
    return vendors[idx];
  },

  suspendVendor: async (vendorId) => {
    await delay(80);
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const idx = vendors.findIndex((v) => v.id === vendorId);
    if (idx === -1) throw new Error("Vendor not found");

    vendors[idx].status = vendors[idx].status === "Suspended" ? "Approved" : "Suspended";
    saveData(VENDORS_STORAGE_KEY, vendors);
    return vendors[idx];
  },

  // ----------------------------------------------------
  // VENDOR CANDIDATES (POOL)
  // ----------------------------------------------------
  getCandidates: async (vendorId, { search = "", position = "All", country = "All", experience = "All" } = {}) => {
    await delay(70);
    let candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);

    if (vendorId) {
      candidates = candidates.filter((c) => c.vendorId === vendorId);
    }

    if (position !== "All") {
      candidates = candidates.filter((c) => c.currentPosition === position);
    }

    if (country !== "All") {
      candidates = candidates.filter((c) => c.preferredCountry === country);
    }

    if (experience !== "All") {
      candidates = candidates.filter((c) => c.experienceYears === experience);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      candidates = candidates.filter(
        (c) =>
          c.fullName?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q) ||
          c.currentPosition?.toLowerCase().includes(q) ||
          (c.skills || []).some((s) => s.toLowerCase().includes(q)) ||
          (c.tags || []).some((t) => t.toLowerCase().includes(q)) ||
          c.qualification?.toLowerCase().includes(q) ||
          c.preferredCountry?.toLowerCase().includes(q)
      );
    }

    return candidates;
  },

  getCandidateById: async (candidateId) => {
    await delay(40);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return null;

    // Attach submission history
    const applications = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const history = applications.filter((a) => a.candidateId === candidateId);

    return {
      ...candidate,
      applications: history,
    };
  },

  createCandidate: async (vendorId, candidateData) => {
    await delay(100);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);

    const newCandidate = {
      ...candidateData,
      id: `CND-${Math.floor(500 + Math.random() * 5000)}`,
      vendorId: vendorId || "VND-1001",
      createdAt: new Date().toISOString(),
      skills: Array.isArray(candidateData.skills)
        ? candidateData.skills
        : (candidateData.skills || "").split(",").map((s) => s.trim()).filter(Boolean),
      tags: Array.isArray(candidateData.tags)
        ? candidateData.tags
        : (candidateData.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      documents: candidateData.documents || [],
    };

    candidates.unshift(newCandidate);
    saveData(CANDIDATES_STORAGE_KEY, candidates);
    return newCandidate;
  },

  updateCandidate: async (candidateId, updatedData) => {
    await delay(80);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const idx = candidates.findIndex((c) => c.id === candidateId);
    if (idx === -1) throw new Error("Candidate not found");

    candidates[idx] = {
      ...candidates[idx],
      ...updatedData,
    };
    saveData(CANDIDATES_STORAGE_KEY, candidates);
    return candidates[idx];
  },

  deleteCandidate: async (candidateId) => {
    await delay(80);
    let candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    candidates = candidates.filter((c) => c.id !== candidateId);
    saveData(CANDIDATES_STORAGE_KEY, candidates);
    return true;
  },

  verifyCandidateDocument: async (candidateId, docIndex, status, remarks = "") => {
    await delay(60);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const idx = candidates.findIndex((c) => c.id === candidateId);
    if (idx === -1) throw new Error("Candidate not found");

    if (!candidates[idx].documents) candidates[idx].documents = [];
    if (candidates[idx].documents[docIndex]) {
      candidates[idx].documents[docIndex].status = status;
      candidates[idx].documents[docIndex].remarks = remarks;
      candidates[idx].documents[docIndex].verifiedAt = new Date().toISOString();
    }

    // Update overall candidate verification state
    const allDocs = candidates[idx].documents;
    if (allDocs.some((d) => d.status === "Rejected")) {
      candidates[idx].verificationStatus = "Rejected";
    } else if (allDocs.every((d) => d.status === "Verified")) {
      candidates[idx].verificationStatus = "Verified";
    } else {
      candidates[idx].verificationStatus = "Pending";
    }

    saveData(CANDIDATES_STORAGE_KEY, candidates);
    return candidates[idx];
  },

  verifyAllCandidateDocuments: async (candidateId, status, remarks = "") => {
    await delay(80);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const idx = candidates.findIndex((c) => c.id === candidateId);
    if (idx === -1) throw new Error("Candidate not found");

    if (candidates[idx].documents) {
      candidates[idx].documents = candidates[idx].documents.map((doc) => ({
        ...doc,
        status: status,
        remarks: status === "Rejected" ? remarks : doc.remarks || "",
        verifiedAt: new Date().toISOString(),
      }));
    }
    candidates[idx].verificationStatus = status;
    candidates[idx].verificationRemarks = remarks;

    saveData(CANDIDATES_STORAGE_KEY, candidates);
    return candidates[idx];
  },

  // ----------------------------------------------------
  // CANDIDATE SUBMISSION / APPLICATIONS (PER-PROJECT)
  // ----------------------------------------------------
  getApplications: async (vendorId, { status = "All", projectId = "All", search = "" } = {}) => {
    await delay(60);
    let apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);

    if (vendorId) {
      apps = apps.filter((a) => a.vendorId === vendorId);
    }

    if (status !== "All") {
      apps = apps.filter((a) => a.status === status);
    }

    if (projectId !== "All") {
      apps = apps.filter((a) => a.projectId === projectId);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      apps = apps.filter(
        (a) =>
          a.candidateName?.toLowerCase().includes(q) ||
          a.projectName?.toLowerCase().includes(q) ||
          a.clientName?.toLowerCase().includes(q) ||
          a.position?.toLowerCase().includes(q) ||
          a.country?.toLowerCase().includes(q)
      );
    }

    return apps;
  },

  submitCandidateToProject: async ({
    vendorId,
    candidateId,
    clientId,
    projectId,
    requirementCode = "REQ-001",
    position,
  }) => {
    await delay(120);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);

    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) throw new Error("Candidate not found.");

    // Retrieve real Client & Project details from crmClientService
    let clientName = "Client Partner";
    let projectName = "Deployment Project";
    let country = "UAE";

    try {
      const proj = await crmClientService.getProjectById(clientId, projectId);
      if (proj) {
        projectName = proj.projectName || projectName;
        country = proj.country || country;
        clientName = proj.client?.companyName || proj.clientName || clientName;
      }
    } catch {
      // fallback to sensible defaults
    }

    // Check if this candidate is already submitted to this EXACT project
    const alreadySubmitted = apps.find(
      (a) =>
        a.candidateId === candidateId &&
        String(a.projectId) === String(projectId) &&
        a.status !== "Rejected"
    );
    if (alreadySubmitted) {
      throw new Error(
        `Candidate ${candidate.fullName} has already been submitted to this project (Status: ${alreadySubmitted.status}).`
      );
    }

    const newApp = {
      id: `APP-${Math.floor(8000 + Math.random() * 2000)}`,
      vendorId: vendorId || "VND-1001",
      candidateId,
      candidateName: candidate.fullName,
      clientId,
      clientName,
      projectId,
      projectName,
      requirementCode,
      position: position || candidate.currentPosition,
      country,
      submittedAt: new Date().toISOString(),
      status: "Submitted", // Submitted, Under Review, Shortlisted, Selected, Rejected, Completed
      rejectionReason: "",
      selectionDate: null,
    };

    apps.unshift(newApp);
    saveData(APPLICATIONS_STORAGE_KEY, apps);

    // Notify vendor
    crmVendorService.addNotification({
      vendorId: newApp.vendorId,
      title: "Candidate Submitted",
      message: `Candidate ${newApp.candidateName} submitted for ${newApp.projectName} (${newApp.position}).`,
      type: "info",
      link: "/vendor/applications",
    });

    return newApp;
  },

  updateApplicationStatus: async (applicationId, status, rejectionReason = "", interviewDetails = null) => {
    await delay(100);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error("Application not found");

    apps[idx].status = status;

    if (interviewDetails) {
      apps[idx].interviewDetails = interviewDetails;
    }

    if (status === "Interview") {
      crmVendorService.addNotification({
        vendorId: apps[idx].vendorId,
        title: "Interview Scheduled 🎥",
        message: `Interview scheduled for ${apps[idx].candidateName} (${apps[idx].projectName}). Date: ${interviewDetails?.dateTime || "TBD"}. Zoom Meeting Link available in portal.`,
        type: "info",
        link: "/vendor/applications",
      });
    }

    if (status === "Rejected") {
      apps[idx].rejectionReason = rejectionReason || "Did not meet specific client criteria.";
      apps[idx].rejectionDate = new Date().toISOString();
      crmVendorService.addNotification({
        vendorId: apps[idx].vendorId,
        title: "Candidate Application Rejected",
        message: `${apps[idx].candidateName} was not selected for ${apps[idx].projectName}. Candidate returned to pool for other project submissions.`,
        type: "error",
        link: "/vendor/rejected",
      });
    }

    if (status === "Selected") {
      apps[idx].selectionDate = new Date().toISOString();
      apps[idx].rejectionReason = "";

      // Initialize default 8-stage processing timeline if not present
      if (!apps[idx].processing) {
        apps[idx].processing = {
          currentStageIndex: 0,
          stages: [
            { key: "selected", name: "Candidate Selected", status: "completed", date: new Date().toISOString().split("T")[0], note: "Client selection confirmed" },
            { key: "docs_pending", name: "Documents Pending", status: "in_progress", date: "", note: "Awaiting candidate documents" },
            { key: "docs_verified", name: "Documents Verified", status: "pending", date: "", note: "" },
            { key: "medical", name: "Medical (GAMCA)", status: "pending", date: "", note: "" },
            { key: "visa", name: "Visa Processing", status: "pending", date: "", note: "" },
            { key: "ticket", name: "Ticket / Travel", status: "pending", date: "", note: "" },
            { key: "deployed", name: "Deployed on Site", status: "pending", date: "", note: "" },
            { key: "completed", name: "Completed", status: "pending", date: "", note: "" },
          ],
        };
      }

      // Initialize candidate milestone payment plan from project paymentMilestoneConfig if present
      if (!apps[idx].paymentPlan) {
        let milestonePlan = null;
        try {
          const clientsData = JSON.parse(localStorage.getItem("immigo_crm_clients_v1") || "[]");
          for (const c of clientsData) {
            const prj = (c.projects || []).find(
              (p) => String(p.id) === String(apps[idx].projectId) || p.projectName === apps[idx].projectName
            );
            if (prj && prj.paymentMilestoneConfig && Array.isArray(prj.paymentMilestoneConfig.milestones)) {
              const config = prj.paymentMilestoneConfig;
              const totalAmount = Number(config.totalFeePerCandidate) || 40000;
              milestonePlan = {
                totalAmount,
                currency: "INR",
                milestones: config.milestones.map((m, i) => ({
                  id: m.id || `M${i + 1}`,
                  name: m.name || `Milestone ${i + 1}`,
                  percentage: Number(m.percentage) || 25,
                  amount: Number(m.amount) || Math.round((totalAmount * (Number(m.percentage) || 25)) / 100),
                  dueDate: "",
                  status: i === 0 ? "Due" : "Pending",
                  paidDate: "",
                  paymentRef: "",
                })),
              };
              break;
            }
          }
        } catch (e) {
          console.warn("Could not fetch project milestone config:", e);
        }

        apps[idx].paymentPlan = milestonePlan || {
          totalAmount: 40000,
          currency: "INR",
          milestones: [
            { id: "M1", name: "Milestone 1 - Selection", percentage: 25, amount: 10000, dueDate: "", status: "Due", paidDate: "", paymentRef: "" },
            { id: "M2", name: "Milestone 2 - Medical Clearance", percentage: 25, amount: 10000, dueDate: "", status: "Pending", paidDate: "", paymentRef: "" },
            { id: "M3", name: "Milestone 3 - Visa Stamped", percentage: 25, amount: 10000, dueDate: "", status: "Pending", paidDate: "", paymentRef: "" },
            { id: "M4", name: "Milestone 4 - Site Mobilization", percentage: 25, amount: 10000, dueDate: "", status: "Pending", paidDate: "", paymentRef: "" },
          ],
        };
      }

      crmVendorService.addNotification({
        vendorId: apps[idx].vendorId,
        title: "Candidate Selected! 🎉",
        message: `${apps[idx].candidateName} has been selected for ${apps[idx].projectName}. Processing timeline initialized.`,
        type: "success",
        link: "/vendor/selected",
      });
    }

    saveData(APPLICATIONS_STORAGE_KEY, apps);
    return apps[idx];
  },

  addApplicationMilestone: async (applicationId, { name, percentage = 0, amount = 0, dueDate = "" }) => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error("Application not found");

    if (!apps[idx].paymentPlan) {
      apps[idx].paymentPlan = { totalAmount: 40000, currency: "INR", milestones: [] };
    }

    const mId = `M${(apps[idx].paymentPlan.milestones.length || 0) + 1}`;
    const newMilestone = {
      id: mId,
      name: name || `Milestone ${mId}`,
      percentage: Number(percentage) || 0,
      amount: Number(amount) || 0,
      dueDate: dueDate || "",
      status: "Pending",
      paidDate: "",
      paymentRef: "",
    };

    apps[idx].paymentPlan.milestones.push(newMilestone);
    apps[idx].paymentPlan.totalAmount += Number(amount) || 0;

    saveData(APPLICATIONS_STORAGE_KEY, apps);
    return apps[idx];
  },

  updateApplicationProject: async (applicationId, { clientId, clientName, projectId, projectName, requirementCode, position, country }) => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error("Application not found");

    apps[idx] = {
      ...apps[idx],
      clientId: clientId || apps[idx].clientId,
      clientName: clientName || apps[idx].clientName,
      projectId: projectId || apps[idx].projectId,
      projectName: projectName || apps[idx].projectName,
      requirementCode: requirementCode || apps[idx].requirementCode,
      position: position || apps[idx].position,
      country: country || apps[idx].country,
    };
    saveData(APPLICATIONS_STORAGE_KEY, apps);
    return apps[idx];
  },

  // Advance / Update Processing Stage
  updateProcessingStage: async (applicationId, stageIndex, note = "") => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error("Application not found");

    if (!apps[idx].processing) {
      throw new Error("Candidate is not in processing.");
    }

    const today = new Date().toISOString().split("T")[0];
    apps[idx].processing.currentStageIndex = stageIndex;

    apps[idx].processing.stages = apps[idx].processing.stages.map((stg, i) => {
      if (i < stageIndex) {
        return { ...stg, status: "completed", date: stg.date || today };
      } else if (i === stageIndex) {
        return { ...stg, status: "in_progress", date: today, note: note || stg.note };
      } else {
        return { ...stg, status: "pending" };
      }
    });

    if (stageIndex === 7) {
      apps[idx].status = "Completed";
    }

    saveData(APPLICATIONS_STORAGE_KEY, apps);

    const stageName = apps[idx].processing.stages[stageIndex]?.name;
    crmVendorService.addNotification({
      vendorId: apps[idx].vendorId,
      title: "Processing Stage Updated",
      message: `${apps[idx].candidateName}'s deployment stage updated to: ${stageName}.`,
      type: "info",
      link: "/vendor/processing",
    });

    return apps[idx];
  },

  // Update Milestone Payment status
  updateMilestoneStatus: async (applicationId, milestoneId, newStatus, paymentRef = "") => {
    await delay(80);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error("Application not found");

    if (!apps[idx].paymentPlan) throw new Error("No payment plan found.");

    const mIdx = apps[idx].paymentPlan.milestones.findIndex((m) => m.id === milestoneId);
    if (mIdx === -1) throw new Error("Milestone not found");

    apps[idx].paymentPlan.milestones[mIdx].status = newStatus;
    if (newStatus === "Paid") {
      apps[idx].paymentPlan.milestones[mIdx].paidDate = new Date().toISOString().split("T")[0];
      apps[idx].paymentPlan.milestones[mIdx].paymentRef = paymentRef || `TXN-${Date.now().toString().slice(-6)}`;

      crmVendorService.addNotification({
        vendorId: apps[idx].vendorId,
        title: "Milestone Payment Released",
        message: `${apps[idx].paymentPlan.milestones[mIdx].name} (₹${apps[idx].paymentPlan.milestones[mIdx].amount.toLocaleString()}) has been marked as PAID.`,
        type: "success",
        link: "/vendor/payments",
      });
    }

    saveData(APPLICATIONS_STORAGE_KEY, apps);
    return apps[idx];
  },

  // Admin Override of Milestone amounts for an individual candidate
  overrideMilestones: async (applicationId, totalAmount, milestones) => {
    await delay(100);
    const sum = (milestones || []).reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
    if (Math.abs(sum - Number(totalAmount)) > 1) {
      throw new Error(`Total milestone amounts (₹${sum}) must exactly equal total payment amount (₹${totalAmount}).`);
    }

    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const idx = apps.findIndex((a) => a.id === applicationId);
    if (idx === -1) throw new Error("Application not found");

    apps[idx].paymentPlan = {
      totalAmount: Number(totalAmount),
      currency: "INR",
      milestones,
    };

    saveData(APPLICATIONS_STORAGE_KEY, apps);
    return apps[idx];
  },

  // Bulk Apply Template to all Selected Candidates
  applyBulkTemplate: async ({ totalAmount = 40000, templateName = "Standard 4-Milestone Recruitment" }) => {
    await delay(150);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    const quarter = Math.round(totalAmount / 4);

    let updatedCount = 0;
    const updatedApps = apps.map((app) => {
      if (app.status === "Selected" || app.status === "Completed") {
        updatedCount++;
        return {
          ...app,
          paymentPlan: {
            totalAmount: Number(totalAmount),
            currency: "INR",
            milestones: [
              { id: "M1", name: "Milestone 1 - 25% (Selection)", percentage: 25, amount: quarter, dueDate: "", status: "Due", paidDate: "", paymentRef: "" },
              { id: "M2", name: "Milestone 2 - 25% (Medical)", percentage: 25, amount: quarter, dueDate: "", status: "Pending", paidDate: "", paymentRef: "" },
              { id: "M3", name: "Milestone 3 - 25% (Visa Stamped)", percentage: 25, amount: quarter, dueDate: "", status: "Pending", paidDate: "", paymentRef: "" },
              { id: "M4", name: "Milestone 4 - 25% (Deployment)", percentage: 25, amount: quarter, dueDate: "", status: "Pending", paidDate: "", paymentRef: "" },
            ],
          },
        };
      }
      return app;
    });

    saveData(APPLICATIONS_STORAGE_KEY, updatedApps);
    return { updatedCount, totalAmount };
  },

  // ----------------------------------------------------
  // VENDOR DASHBOARD STATS
  // ----------------------------------------------------
  getVendorDashboardStats: async (vendorId) => {
    await delay(50);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES).filter(
      (c) => !vendorId || c.vendorId === vendorId
    );
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS).filter(
      (a) => !vendorId || a.vendorId === vendorId
    );

    const totalCandidates = candidates.length;
    const submitted = apps.length;
    const underReview = apps.filter((a) => a.status === "Under Review" || a.status === "Shortlisted").length;
    const selected = apps.filter((a) => a.status === "Selected").length;
    const rejected = apps.filter((a) => a.status === "Rejected").length;
    const inProcessing = apps.filter(
      (a) => a.status === "Selected" && a.processing && a.processing.currentStageIndex < 7
    ).length;
    const completed = apps.filter((a) => a.status === "Completed" || a.processing?.currentStageIndex === 7).length;

    // Financials
    let totalPayment = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let dueAmount = 0;
    let overdueAmount = 0;

    apps.forEach((app) => {
      if (app.paymentPlan?.milestones) {
        app.paymentPlan.milestones.forEach((m) => {
          totalPayment += Number(m.amount) || 0;
          if (m.status === "Paid") paidAmount += Number(m.amount) || 0;
          else if (m.status === "Due") dueAmount += Number(m.amount) || 0;
          else if (m.status === "Overdue") overdueAmount += Number(m.amount) || 0;
          else pendingAmount += Number(m.amount) || 0;
        });
      }
    });

    const recentActivity = apps.slice(0, 7);

    return {
      totalCandidates,
      submitted,
      underReview,
      selected,
      rejected,
      inProcessing,
      completed,
      financials: {
        totalPayment,
        paidAmount,
        pendingAmount,
        dueAmount,
        overdueAmount,
      },
      recentActivity,
    };
  },

  // ----------------------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------------------
  getNotifications: (vendorId) => {
    const notifs = loadData(VENDOR_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    return notifs.filter((n) => !vendorId || n.vendorId === vendorId);
  },

  addNotification: (notif) => {
    const notifs = loadData(VENDOR_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notif,
    };
    notifs.unshift(newNotif);
    saveData(VENDOR_NOTIFICATIONS_KEY, notifs);
    return newNotif;
  },

  markNotificationRead: (id) => {
    const notifs = loadData(VENDOR_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    const idx = notifs.findIndex((n) => n.id === id);
    if (idx !== -1) {
      notifs[idx].read = true;
      saveData(VENDOR_NOTIFICATIONS_KEY, notifs);
    }
  },

  markAllNotificationsRead: (vendorId) => {
    let notifs = loadData(VENDOR_NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    notifs = notifs.map((n) => (!vendorId || n.vendorId === vendorId ? { ...n, read: true } : n));
    saveData(VENDOR_NOTIFICATIONS_KEY, notifs);
  },

  // ----------------------------------------------------
  // ADMIN ENTERPRISE OVERVIEW STATS (MATCHING CRM SPEC)
  // ----------------------------------------------------
  getAdminVendorOverviewStats: async () => {
    await delay(30);
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);

    const totalVendors = vendors.length || 12;
    const pendingVendors = vendors.filter((v) => v.status === "Pending").length || 3;
    const approvedVendors = vendors.filter((v) => v.status === "Approved").length || 8;
    const suspendedVendors = vendors.filter((v) => v.status === "Suspended").length || 1;

    // Company level stats
    const totalCandidates = Math.max(356, candidates.length);
    const pendingCandidates = Math.max(27, apps.filter((a) => a.status === "Submitted" || a.status === "Under Review").length);
    const selectedCandidates = Math.max(64, apps.filter((a) => a.status === "Selected").length);
    const inProcessing = Math.max(31, apps.filter((a) => a.status === "Selected" && a.processing?.currentStageIndex < 7).length);

    return {
      totalClients: 42,
      totalProjects: 18,
      totalVendors,
      pendingVendors,
      approvedVendors,
      suspendedVendors,
      totalCandidates,
      pendingCandidates,
      selectedCandidates,
      inProcessing,
      pendingPayments: 850000,
      overduePayments: 120000,
      recentActivity: [
        {
          id: "act-1",
          type: "vendor",
          title: "New vendor registration",
          description: "ABC Manpower submitted registration",
          time: "10 mins ago",
        },
        {
          id: "act-2",
          type: "submission",
          title: "New candidate submission",
          description: "Rahul Kumar submitted for Electrician requirement",
          time: "25 mins ago",
        },
        {
          id: "act-3",
          type: "selected",
          title: "Candidate selected",
          description: "Amit Sharma selected for Dubai Construction Project",
          time: "1 hour ago",
        },
        {
          id: "act-4",
          type: "payment",
          title: "Milestone payment",
          description: "Milestone 2 payment completed for Rahul Kumar",
          time: "2 hours ago",
        },
        {
          id: "act-5",
          type: "processing",
          title: "Stage advanced",
          description: "GAMCA Medical cleared for Vikram Singh (Saudi Project)",
          time: "4 hours ago",
        },
      ],
    };
  },

  // Get full submissions history for a specific candidate across all projects
  getCandidateSubmissionsHistory: async (candidateId) => {
    await delay(30);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);
    return apps.filter((a) => a.candidateId === candidateId);
  },

  // Get all documents across vendors and candidates
  getAllDocuments: async ({ vendorId = "All", candidateId = "All", type = "All", status = "All", search = "" } = {}) => {
    await delay(50);
    const vendors = loadData(VENDORS_STORAGE_KEY, INITIAL_VENDORS);
    const candidates = loadData(CANDIDATES_STORAGE_KEY, INITIAL_CANDIDATES);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, INITIAL_APPLICATIONS);

    const docs = [];

    // Vendor statutory documents
    vendors.forEach((v) => {
      (v.documents || []).forEach((d, idx) => {
        docs.push({
          id: `DOC-VND-${v.id}-${idx}`,
          title: d.name,
          fileName: d.fileName,
          type: d.type || "License",
          entityType: "Vendor",
          ownerName: v.companyName,
          ownerId: v.id,
          vendorId: v.id,
          vendorName: v.companyName,
          project: "Organization Statutory",
          size: d.size || "1.2 MB",
          status: v.status === "Approved" ? "Verified" : v.status === "Rejected" ? "Rejected" : "Pending Verification",
          uploadedAt: v.registeredAt ? v.registeredAt.split("T")[0] : "2026-08-15",
        });
      });
    });

    // Candidate dossiers
    candidates.forEach((c) => {
      const v = vendors.find((vend) => vend.id === c.vendorId);
      const candApps = apps.filter((a) => a.candidateId === c.id);
      const projName = candApps.length > 0 ? candApps[0].projectName : "General Pool";

      (c.documents || []).forEach((d, idx) => {
        docs.push({
          id: `DOC-CND-${c.id}-${idx}`,
          title: d.name,
          fileName: d.fileName,
          type: d.type || "Certificate",
          entityType: "Candidate",
          ownerName: c.fullName,
          ownerId: c.id,
          vendorId: c.vendorId,
          vendorName: v?.companyName || c.vendorId,
          project: projName,
          size: d.size || "950 KB",
          status: "Verified",
          uploadedAt: c.createdAt ? c.createdAt.split("T")[0] : "2026-08-20",
        });
      });
    });

    let filtered = docs;
    if (vendorId !== "All") filtered = filtered.filter((d) => d.vendorId === vendorId);
    if (candidateId !== "All") filtered = filtered.filter((d) => d.ownerId === candidateId);
    if (type !== "All") filtered = filtered.filter((d) => d.type === type);
    if (status !== "All") filtered = filtered.filter((d) => d.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.ownerName.toLowerCase().includes(q) ||
          d.vendorName.toLowerCase().includes(q)
      );
    }

    return filtered;
  },
};

export default crmVendorService;
