export function formatSalary(salary) {
  if (!salary) return "Not Specified";
  if (typeof salary === "string") return salary.trim() || "Not Specified";
  if (typeof salary === "number") return salary.toLocaleString();
  if (typeof salary === "object") {
    if (salary.text && String(salary.text).trim()) {
      return String(salary.text).trim();
    }
    if (salary.salary !== undefined && salary.salary !== null && String(salary.salary).trim()) {
      return [salary.salary, salary.currency].filter(Boolean).join(" ").trim();
    }
    const { min, max, currency } = salary;
    const curr = currency ? String(currency).trim() : "";
    if (min !== undefined && min !== "" && max !== undefined && max !== "") {
      const minVal = !isNaN(Number(min)) ? Number(min).toLocaleString() : String(min);
      const maxVal = !isNaN(Number(max)) ? Number(max).toLocaleString() : String(max);
      return [curr ? `${minVal} - ${maxVal} ${curr}` : `${minVal} - ${maxVal}`].join("");
    }
    if (min !== undefined && min !== "") {
      const minVal = !isNaN(Number(min)) ? Number(min).toLocaleString() : String(min);
      return curr ? `From ${minVal} ${curr}` : `From ${minVal}`;
    }
    if (max !== undefined && max !== "") {
      const maxVal = !isNaN(Number(max)) ? Number(max).toLocaleString() : String(max);
      return curr ? `Up to ${maxVal} ${curr}` : `Up to ${maxVal}`;
    }
    return curr ? `Competitive (${curr})` : "Not Specified";
  }
  return String(salary);
}

export function formatCandidateEmail(email) {
  const clean = String(email || "").trim();
  if (!clean || clean.toLowerCase().includes("@candidate.local")) return "";
  return clean;
}

export function getCandidateInitials(name) {
  const clean = String(name || "").trim();
  if (!clean) return "C";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export function extractCandidateDocuments(cand) {
  if (!cand) return { docs: [], primaryResume: null };
  const rawList = [];

  const pushDoc = (entry, fallbackLabel = "Candidate Document") => {
    if (!entry) return;
    if (typeof entry === "string") {
      const url = entry.trim();
      if (!url) return;
      rawList.push({
        name: fallbackLabel,
        fileName: fallbackLabel,
        docType: fallbackLabel,
        fileUrl: url,
        mimeType: "",
      });
      return;
    }
    if (typeof entry === "object") {
      const url = String(entry.fileUrl || entry.url || entry.dataUrl || entry.path || "").trim();
      if (!url) return;
      const name = entry.name || entry.docType || entry.title || entry.fileName || fallbackLabel;
      rawList.push({
        name,
        fileName: entry.fileName || name,
        docType: entry.docType || name,
        fileUrl: url,
        mimeType: entry.mimeType || entry.type || "",
      });
    }
  };

  [cand.documents, cand.candidateData?.documents].forEach((arr) => {
    if (Array.isArray(arr)) {
      arr.forEach((doc) => pushDoc(doc, doc?.docType || doc?.name || doc?.title || "Candidate Document"));
    }
  });

  pushDoc(cand.resumeUrl, "Resume / CV");
  pushDoc(cand.cvUrl, "Resume / CV");
  pushDoc(cand.passportCopyUrl, "Passport Copy");
  pushDoc(cand.candidateData?.resumeUrl, "Resume / CV");
  pushDoc(cand.candidateData?.cvUrl, "Resume / CV");
  pushDoc(cand.candidateData?.passportCopyUrl, "Passport Copy");

  const seen = new Set();
  const docs = [];
  rawList.forEach((d) => {
    const key = `${String(d.fileUrl)}::${String(d.name || d.fileName).toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    docs.push(d);
  });

  const primaryResume =
    docs.find((d) => /resume|cv/i.test(`${d.name} ${d.docType} ${d.fileName}`)) ||
    docs[0] ||
    null;

  return { docs, primaryResume };
}

export function getEffectiveStage(cand) {
  if (!cand) return "Applied";
  const candidates = [cand.recruitmentStage, cand.status]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  const priorityChecks = [
    (s) => s === "Did Not Join",
    (s) => s === "Rejected",
    (s) => s === "On Hold",
    (s) => s === "Joined" || s === "Deployed" || s === "Completed",
    (s) => s === "Visa Issued" || s === "Visa Allotted",
    (s) =>
      ["Visa Processing", "Offer Accepted", "Offer Released", "Processing", "Selected"].includes(
        s
      ),
    (s) => /interview/i.test(s),
    (s) => s === "Shortlisted",
  ];

  for (const check of priorityChecks) {
    const match = candidates.find(check);
    if (match) return match;
  }

  if (cand.interview?.scheduledDate) {
    return "Interview Scheduled";
  }

  return candidates[0] || "Applied";
}

