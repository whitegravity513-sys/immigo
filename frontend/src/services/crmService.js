// crmService.js — localStorage-backed CRM for immiGo Sales Module
const CRM_KEY = "immigo_crm_leads";
const ACT_KEY = "immigo_crm_activities";

/* ─────────────── SEED DATA ─────────────── */
const SEED_LEADS = [
  { id: "L001", company: "Al Futtaim Group", industry: "Retail & FMCG", country: "UAE", city: "Dubai", contactName: "Ahmed Al Rashid", contactDesignation: "HR Director", email: "ahmed@alfuttaim.ae", phone: "+971-50-234-5678", whatsapp: "+971-50-234-5678", requirement: "Bulk Hiring", description: "Need 150 workers for new retail expansion in Abu Dhabi", requiredCount: 150, salaryRange: "AED 1,800–2,500", source: "LinkedIn", owner: "Rahul Sharma", priority: "High", stage: "Qualified", dealValue: 1200000, followUpDate: "2026-09-20", createdAt: "2026-09-01T08:00:00Z", linkedIn: "linkedin.com/in/ahmedal" },
  { id: "L002", company: "Saudi Aramco Contractors", industry: "Oil & Gas", country: "Saudi Arabia", city: "Riyadh", contactName: "Khalid Al Zahrani", contactDesignation: "Recruitment Manager", email: "khalid@aramco-cont.sa", phone: "+966-55-123-4567", whatsapp: "+966-55-123-4567", requirement: "Technical Recruitment", description: "Requirement for 80 skilled technicians and engineers", requiredCount: 80, salaryRange: "SAR 4,500–8,000", source: "Referral", owner: "Priya Menon", priority: "High", stage: "Proposal Sent", dealValue: 2400000, followUpDate: "2026-09-19", createdAt: "2026-09-02T10:00:00Z", linkedIn: "" },
  { id: "L003", company: "Qatar Steel Industries", industry: "Manufacturing", country: "Qatar", city: "Doha", contactName: "Mohammed Al Qassim", contactDesignation: "Operations Manager", email: "mqassim@qatarsteel.qa", phone: "+974-33-456-7890", whatsapp: "+974-33-456-7890", requirement: "Manpower Supply", description: "200 semi-skilled factory workers for steel plant", requiredCount: 200, salaryRange: "QAR 1,200–1,800", source: "Cold Call", owner: "Rahul Sharma", priority: "High", stage: "Negotiation", dealValue: 3600000, followUpDate: "2026-09-18", createdAt: "2026-09-03T09:00:00Z", linkedIn: "" },
  { id: "L004", company: "Oman Air", industry: "Aviation", country: "Oman", city: "Muscat", contactName: "Said Al Balushi", contactDesignation: "Chief HR Officer", email: "s.balushi@omanair.om", phone: "+968-92-345-6789", whatsapp: "+968-92-345-6789", requirement: "Overseas Recruitment", description: "Cabin crew and ground staff from South Asia", requiredCount: 50, salaryRange: "OMR 450–700", source: "Website", owner: "Anita Desai", priority: "Medium", stage: "Contacted", dealValue: 850000, followUpDate: "2026-09-22", createdAt: "2026-09-04T11:00:00Z", linkedIn: "" },
  { id: "L005", company: "Deutsche Bahn Engineering", industry: "Infrastructure", country: "Germany", city: "Berlin", contactName: "Klaus Weber", contactDesignation: "Staffing Director", email: "k.weber@db-engineering.de", phone: "+49-30-1234-5678", whatsapp: "+49-151-1234-5678", requirement: "Technical Recruitment", description: "Civil & railway engineers, minimum 5 years experience", requiredCount: 30, salaryRange: "EUR 3,500–5,500", source: "LinkedIn", owner: "Rahul Sharma", priority: "High", stage: "Meeting Scheduled", dealValue: 4500000, followUpDate: "2026-09-21", createdAt: "2026-09-05T08:30:00Z", linkedIn: "linkedin.com/in/klausweber" },
  { id: "L006", company: "Singapore Port Authority", industry: "Logistics & Port", country: "Singapore", city: "Singapore", contactName: "Lim Wei Jie", contactDesignation: "Workforce Planning Manager", email: "lim.wj@mpa.gov.sg", phone: "+65-9123-4567", whatsapp: "+65-9123-4567", requirement: "Manpower Supply", description: "Port handlers, crane operators, and logistics staff", requiredCount: 120, salaryRange: "SGD 1,800–2,800", source: "Trade Show", owner: "Priya Menon", priority: "Medium", stage: "New", dealValue: 2800000, followUpDate: "2026-09-25", createdAt: "2026-09-06T07:00:00Z", linkedIn: "" },
  { id: "L007", company: "Emaar Properties", industry: "Real Estate & Construction", country: "UAE", city: "Dubai", contactName: "Farida Hussain", contactDesignation: "Project HR Head", email: "farida.h@emaar.ae", phone: "+971-52-345-6789", whatsapp: "+971-52-345-6789", requirement: "Bulk Hiring", description: "Construction workers for Downtown Dubai expansion project", requiredCount: 500, salaryRange: "AED 1,200–2,000", source: "Referral", owner: "Anita Desai", priority: "High", stage: "Won", dealValue: 7500000, followUpDate: "2026-09-15", createdAt: "2026-08-20T09:00:00Z", linkedIn: "" },
  { id: "L008", company: "Sabic Corporation", industry: "Petrochemicals", country: "Saudi Arabia", city: "Jubail", contactName: "Turki Al Dossari", contactDesignation: "Talent Acquisition Lead", email: "turki@sabic.com", phone: "+966-50-789-0123", whatsapp: "+966-50-789-0123", requirement: "Technical Recruitment", description: "Chemical process engineers and lab technicians", requiredCount: 45, salaryRange: "SAR 6,000–12,000", source: "LinkedIn", owner: "Rahul Sharma", priority: "High", stage: "Qualified", dealValue: 3200000, followUpDate: "2026-09-23", createdAt: "2026-09-07T10:00:00Z", linkedIn: "linkedin.com/in/turkidossari" },
  { id: "L009", company: "Hospitality Group Doha", industry: "Hospitality", country: "Qatar", city: "Doha", contactName: "Amira Al Thani", contactDesignation: "HR Manager", email: "amira@hgd.qa", phone: "+974-55-678-9012", whatsapp: "+974-55-678-9012", requirement: "Overseas Recruitment", description: "Hotel staff: housekeeping, kitchen, front desk for 5-star hotel", requiredCount: 80, salaryRange: "QAR 1,000–1,600", source: "Cold Call", owner: "Priya Menon", priority: "Medium", stage: "New", dealValue: 960000, followUpDate: "2026-09-26", createdAt: "2026-09-08T11:00:00Z", linkedIn: "" },
  { id: "L010", company: "RWE Renewables", industry: "Energy & Renewables", country: "Germany", city: "Essen", contactName: "Heike Müller", contactDesignation: "Global Sourcing Manager", email: "h.muller@rwe.com", phone: "+49-201-5555-1234", whatsapp: "+49-151-5555-1234", requirement: "Technical Recruitment", description: "Electrical engineers for wind energy projects", requiredCount: 25, salaryRange: "EUR 4,000–6,500", source: "LinkedIn", owner: "Anita Desai", priority: "High", stage: "Contacted", dealValue: 3800000, followUpDate: "2026-09-24", createdAt: "2026-09-09T09:30:00Z", linkedIn: "linkedin.com/in/heikemuller" },
  { id: "L011", company: "Nakheel Properties", industry: "Real Estate & Construction", country: "UAE", city: "Dubai", contactName: "Omar Al Maktoum", contactDesignation: "VP Workforce", email: "omar.m@nakheel.ae", phone: "+971-54-789-0123", whatsapp: "+971-54-789-0123", requirement: "Manpower Supply", description: "Civil construction crew for Palm Jebel Ali project", requiredCount: 300, salaryRange: "AED 1,500–2,200", source: "Website", owner: "Rahul Sharma", priority: "High", stage: "Proposal Sent", dealValue: 5400000, followUpDate: "2026-09-20", createdAt: "2026-09-10T08:00:00Z", linkedIn: "" },
  { id: "L012", company: "Maersk Logistics ME", industry: "Logistics & Port", country: "UAE", city: "Sharjah", contactName: "Yusuf Ibrahim", contactDesignation: "Operations HR", email: "y.ibrahim@maersk.com", phone: "+971-56-890-1234", whatsapp: "+971-56-890-1234", requirement: "Manpower Supply", description: "Logistics coordinators and warehouse supervisors", requiredCount: 60, salaryRange: "AED 2,000–3,500", source: "Trade Show", owner: "Anita Desai", priority: "Medium", stage: "Lost", dealValue: 720000, followUpDate: "2026-09-10", createdAt: "2026-09-01T12:00:00Z", linkedIn: "", lostReason: "Budget freeze announced" },
  { id: "L013", company: "Kuwait Finance House", industry: "Banking & Finance", country: "Kuwait", city: "Kuwait City", contactName: "Noor Al Ahmad", contactDesignation: "Human Capital Director", email: "noor.a@kfh.kw", phone: "+965-9090-1234", whatsapp: "+965-9090-1234", requirement: "Overseas Recruitment", description: "IT professionals and data analysts for digital transformation", requiredCount: 35, salaryRange: "KWD 500–900", source: "LinkedIn", owner: "Priya Menon", priority: "Medium", stage: "Qualified", dealValue: 1800000, followUpDate: "2026-09-28", createdAt: "2026-09-11T10:00:00Z", linkedIn: "linkedin.com/in/noorahmad" },
  { id: "L014", company: "Saudi Vision 2030 Contractors", industry: "Infrastructure", country: "Saudi Arabia", city: "Neom", contactName: "Abdulaziz Al Saud", contactDesignation: "Workforce Director", email: "abdulaziz@neom.sa", phone: "+966-56-345-6789", whatsapp: "+966-56-345-6789", requirement: "Bulk Hiring", description: "NEOM megaproject — need 800 construction workers urgently", requiredCount: 800, salaryRange: "SAR 1,800–3,200", source: "Referral", owner: "Rahul Sharma", priority: "High", stage: "Negotiation", dealValue: 15000000, followUpDate: "2026-09-19", createdAt: "2026-09-12T09:00:00Z", linkedIn: "" },
  { id: "L015", company: "Changi Airport Group", industry: "Aviation", country: "Singapore", city: "Singapore", contactName: "Rachel Tan", contactDesignation: "Talent Solutions Manager", email: "rachel.tan@cag.sg", phone: "+65-8234-5678", whatsapp: "+65-8234-5678", requirement: "Overseas Recruitment", description: "Ground crew, baggage handlers, and aviation support staff", requiredCount: 90, salaryRange: "SGD 2,000–3,200", source: "Website", owner: "Anita Desai", priority: "Medium", stage: "New", dealValue: 1980000, followUpDate: "2026-10-01", createdAt: "2026-09-13T11:00:00Z", linkedIn: "" },
  { id: "L016", company: "ADNOC Distribution", industry: "Oil & Gas", country: "UAE", city: "Abu Dhabi", contactName: "Bader Al Lamki", contactDesignation: "HR Business Partner", email: "bader.l@adnoc.ae", phone: "+971-50-567-8901", whatsapp: "+971-50-567-8901", requirement: "Technical Recruitment", description: "Petroleum engineers and HSE specialists", requiredCount: 40, salaryRange: "AED 8,000–15,000", source: "LinkedIn", owner: "Priya Menon", priority: "High", stage: "Meeting Scheduled", dealValue: 4800000, followUpDate: "2026-09-22", createdAt: "2026-09-14T08:30:00Z", linkedIn: "linkedin.com/in/baderlamki" },
  { id: "L017", company: "Volkswagen AG", industry: "Automotive", country: "Germany", city: "Wolfsburg", contactName: "Franz Schmidt", contactDesignation: "International HR Director", email: "f.schmidt@vw.de", phone: "+49-5361-9000-01", whatsapp: "+49-151-9000-0001", requirement: "Technical Recruitment", description: "Automotive engineers for EV manufacturing line", requiredCount: 20, salaryRange: "EUR 5,000–8,000", source: "Conference", owner: "Rahul Sharma", priority: "High", stage: "Proposal Sent", dealValue: 3600000, followUpDate: "2026-09-21", createdAt: "2026-09-15T09:00:00Z", linkedIn: "linkedin.com/in/franzschmidt" },
  { id: "L018", company: "Bahrain Airport Company", industry: "Aviation", country: "Bahrain", city: "Manama", contactName: "Ali Al Hamad", contactDesignation: "Recruitment Coordinator", email: "ali.h@bac.bh", phone: "+973-3333-4567", whatsapp: "+973-3333-4567", requirement: "Overseas Recruitment", description: "Airport retail and hospitality staff", requiredCount: 65, salaryRange: "BHD 350–550", source: "Cold Call", owner: "Anita Desai", priority: "Low", stage: "Contacted", dealValue: 780000, followUpDate: "2026-09-30", createdAt: "2026-09-15T12:00:00Z", linkedIn: "" },
  { id: "L019", company: "DP World", industry: "Logistics & Port", country: "UAE", city: "Dubai", contactName: "Sanjay Gupta", contactDesignation: "Head of Talent", email: "s.gupta@dpworld.com", phone: "+971-55-678-9012", whatsapp: "+971-55-678-9012", requirement: "Bulk Hiring", description: "Port logistics workers and terminal operators", requiredCount: 250, salaryRange: "AED 1,600–2,400", source: "Referral", owner: "Priya Menon", priority: "High", stage: "Won", dealValue: 5000000, followUpDate: "2026-09-15", createdAt: "2026-08-25T09:00:00Z", linkedIn: "" },
  { id: "L020", company: "Al Mana Group", industry: "Retail & FMCG", country: "Qatar", city: "Doha", contactName: "Jasim Al Mana", contactDesignation: "Group HR Director", email: "j.almana@alMana.qa", phone: "+974-44-789-0123", whatsapp: "+974-44-789-0123", requirement: "Manpower Supply", description: "Retail floor staff and supervisors for new mall", requiredCount: 100, salaryRange: "QAR 1,100–1,700", source: "LinkedIn", owner: "Rahul Sharma", priority: "Medium", stage: "Qualified", dealValue: 1200000, followUpDate: "2026-09-27", createdAt: "2026-09-16T10:00:00Z", linkedIn: "linkedin.com/in/jasimalmana" },
  { id: "L021", company: "Siemens Energy", industry: "Energy & Renewables", country: "Germany", city: "Munich", contactName: "Petra Koch", contactDesignation: "Global Mobility Director", email: "p.koch@siemens-energy.com", phone: "+49-89-636-00001", whatsapp: "+49-151-636-0001", requirement: "Technical Recruitment", description: "Power plant engineers and turbine specialists", requiredCount: 35, salaryRange: "EUR 4,500–7,000", source: "LinkedIn", owner: "Anita Desai", priority: "High", stage: "New", dealValue: 5250000, followUpDate: "2026-10-03", createdAt: "2026-09-16T11:30:00Z", linkedIn: "linkedin.com/in/petrakoch" },
  { id: "L022", company: "Kuwait Oil Company", industry: "Oil & Gas", country: "Kuwait", city: "Ahmadi", contactName: "Badr Al Mutairi", contactDesignation: "Manpower Planning Mgr", email: "badr.m@kockw.com", phone: "+965-9191-2345", whatsapp: "+965-9191-2345", requirement: "Technical Recruitment", description: "Drilling engineers and oil rig technicians", requiredCount: 55, salaryRange: "KWD 700–1,200", source: "Referral", owner: "Priya Menon", priority: "High", stage: "Contacted", dealValue: 4400000, followUpDate: "2026-09-23", createdAt: "2026-09-16T13:00:00Z", linkedIn: "" },
  { id: "L023", company: "Aldar Properties", industry: "Real Estate & Construction", country: "UAE", city: "Abu Dhabi", contactName: "Maya Al Kaabi", contactDesignation: "Construction HR Lead", email: "maya.k@aldar.com", phone: "+971-52-456-7890", whatsapp: "+971-52-456-7890", requirement: "Bulk Hiring", description: "Construction laborers for Yas Island development", requiredCount: 400, salaryRange: "AED 1,300–2,000", source: "Cold Call", owner: "Rahul Sharma", priority: "High", stage: "New", dealValue: 6400000, followUpDate: "2026-09-29", createdAt: "2026-09-17T08:00:00Z", linkedIn: "" },
  { id: "L024", company: "Singapore General Hospital", industry: "Healthcare", country: "Singapore", city: "Singapore", contactName: "Dr. Tan Li Hua", contactDesignation: "HR Director", email: "lihua.tan@sgh.com.sg", phone: "+65-9345-6789", whatsapp: "+65-9345-6789", requirement: "Overseas Recruitment", description: "Nurses and healthcare aides for hospital expansion", requiredCount: 70, salaryRange: "SGD 2,200–3,800", source: "Website", owner: "Anita Desai", priority: "Medium", stage: "Qualified", dealValue: 2100000, followUpDate: "2026-09-28", createdAt: "2026-09-17T09:00:00Z", linkedIn: "" },
  { id: "L025", company: "Ooredoo Telecom", industry: "Telecom & IT", country: "Qatar", city: "Doha", contactName: "Noura Al Sulaiti", contactDesignation: "Digital HR Manager", email: "noura.s@ooredoo.qa", phone: "+974-66-890-1234", whatsapp: "+974-66-890-1234", requirement: "Technical Recruitment", description: "Software engineers, network admins for 5G expansion", requiredCount: 45, salaryRange: "QAR 8,000–14,000", source: "LinkedIn", owner: "Priya Menon", priority: "High", stage: "Meeting Scheduled", dealValue: 3600000, followUpDate: "2026-09-20", createdAt: "2026-09-17T10:00:00Z", linkedIn: "linkedin.com/in/nourasulaiti" },
];

const SEED_ACTIVITIES = [];

/* ─────────────── helpers ─────────────── */
const genId = () => `L${Date.now().toString(36).toUpperCase()}`;

const load = (key, seed) => {
  try {
    const s = localStorage.getItem(key);
    if (s) return JSON.parse(s);
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  } catch { return seed; }
};

const save = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
};

/* ─────────────── Leads ─────────────── */
export const getLeads = () => load(CRM_KEY, SEED_LEADS);

export const addLead = (lead) => {
  const leads = getLeads();
  const newLead = { ...lead, id: genId(), createdAt: new Date().toISOString(), stage: lead.stage || "New" };
  leads.unshift(newLead);
  save(CRM_KEY, leads);
  return newLead;
};

export const updateLead = (id, patch) => {
  const leads = getLeads().map(l => l.id === id ? { ...l, ...patch } : l);
  save(CRM_KEY, leads);
  return leads.find(l => l.id === id);
};

export const deleteLead = (id) => {
  const leads = getLeads().filter(l => l.id !== id);
  save(CRM_KEY, leads);
};

/* ─────────────── Activities ─────────────── */
export const getActivities = (leadId) => {
  const all = load(ACT_KEY, SEED_ACTIVITIES);
  return leadId ? all.filter(a => a.leadId === leadId) : all;
};

export const addActivity = (activity) => {
  const all = getActivities();
  const newAct = { ...activity, id: `A${Date.now().toString(36).toUpperCase()}`, createdAt: new Date().toISOString() };
  all.unshift(newAct);
  save(ACT_KEY, all);
  return newAct;
};

/* ─────────────── Stats ─────────────── */
export const getCRMStats = () => {
  const leads = getLeads();
  const today = new Date().toISOString().split("T")[0];
  return {
    total: leads.length,
    newLeads: leads.filter(l => l.stage === "New").length,
    qualified: leads.filter(l => l.stage === "Qualified").length,
    followUpsToday: leads.filter(l => l.followUpDate === today && !["Won","Lost"].includes(l.stage)).length,
    overdue: leads.filter(l => l.followUpDate && l.followUpDate < today && !["Won","Lost"].includes(l.stage)).length,
    proposalSent: leads.filter(l => l.stage === "Proposal Sent").length,
    won: leads.filter(l => l.stage === "Won").length,
    lost: leads.filter(l => l.stage === "Lost").length,
    totalPipelineValue: leads.filter(l => !["Won","Lost"].includes(l.stage)).reduce((s,l) => s+(l.dealValue||0), 0),
    wonValue: leads.filter(l => l.stage === "Won").reduce((s,l) => s+(l.dealValue||0), 0),
  };
};

export const STAGES = ["New","Contacted","Qualified","Meeting Scheduled","Proposal Sent","Negotiation","Won","Lost","On Hold"];
export const COUNTRIES = ["UAE","Saudi Arabia","Qatar","Oman","Kuwait","Bahrain","Germany","Singapore","UK","Canada","Australia"];
export const INDUSTRIES = ["Oil & Gas","Real Estate & Construction","Retail & FMCG","Aviation","Logistics & Port","Healthcare","Manufacturing","Banking & Finance","Telecom & IT","Energy & Renewables","Automotive","Infrastructure","Hospitality"];
export const SOURCES = ["LinkedIn","Referral","Cold Call","Website","Trade Show","Conference","Email Campaign","Direct Visit"];
export const REQUIREMENTS = ["Overseas Recruitment","Manpower Supply","Bulk Hiring","Technical Recruitment","Executive Search","Skilled Worker Placement","Healthcare Staffing","IT & Digital Talent"];
export const PRIORITIES = ["High","Medium","Low"];

export const STAGE_COLORS = {
  "New": "bg-slate-100 text-slate-700",
  "Contacted": "bg-blue-100 text-blue-800",
  "Qualified": "bg-indigo-100 text-indigo-800",
  "Meeting Scheduled": "bg-violet-100 text-violet-800",
  "Proposal Sent": "bg-amber-100 text-amber-800",
  "Negotiation": "bg-orange-100 text-orange-800",
  "Won": "bg-emerald-100 text-emerald-800",
  "Lost": "bg-rose-100 text-rose-800",
  "On Hold": "bg-slate-100 text-slate-500",
};

export const PRIORITY_COLORS = {
  "High": "bg-rose-100 text-rose-800 border-rose-200",
  "Medium": "bg-amber-100 text-amber-700 border-amber-200",
  "Low": "bg-slate-100 text-slate-600 border-slate-200",
};

export const fmtCurrency = (v) => {
  if (!v) return "—";
  if (v >= 10000000) return `₹${(v/10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v/100000).toFixed(1)}L`;
  return `₹${v.toLocaleString()}`;
};
