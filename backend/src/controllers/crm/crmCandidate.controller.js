import CrmCandidate from "../../models/CrmCandidate.js";
import { emitRealtimeEvent } from "../../services/realtime.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { generateNextCandidateId } from "../../utils/idGenerator.js";
import { resolveVendorHrScope } from "../../utils/vendorHrScope.js";

const getVendorAllowedSet = (req) =>
  new Set([req.vendorId, req.userId].filter(Boolean).map((v) => String(v).trim()));

export const getCandidates = asyncHandler(async (req, res) => {
  const { vendorId } = req.query;
  const scope = await resolveVendorHrScope(req.user);
  const filter = {};
  if (req.isVendor) {
    const allowedVendorIds = Array.from(getVendorAllowedSet(req));
    filter.vendorId = allowedVendorIds.length > 1 ? { $in: allowedVendorIds } : allowedVendorIds[0] || "";
  } else if (scope.isVendorHR) {
    if (vendorId && !scope.expandedVendorIds.includes(String(vendorId))) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not assigned to this vendor.",
      });
    }
    if (vendorId) {
      filter.vendorId = String(vendorId);
    } else if (scope.expandedVendorIds.length > 0) {
      filter.vendorId = { $in: scope.expandedVendorIds };
    } else {
      filter._id = null;
    }
  } else if (vendorId) {
    filter.vendorId = String(vendorId);
  }

  const candidates = await CrmCandidate.find(filter).sort({ createdAt: -1 }).lean();
  const formatted = (candidates || []).map((c) => ({
    ...c,
    id: c.candidateId || c._id.toString(),
  }));
  return res.status(200).json({ success: true, candidates: formatted });
});

export const saveCandidate = asyncHandler(async (req, res) => {
  const candData = { ...(req.body || {}) };
  const resolvedFullName = String(candData.fullName || candData.name || "").trim();
  if (!resolvedFullName) {
    return res.status(400).json({ success: false, message: "Candidate fullName is required." });
  }
  candData.fullName = resolvedFullName;
  const rawCandidateId = String(candData.id || candData.candidateId || "").trim();
  delete candData._id;
  delete candData.__v;
  delete candData.id;
  delete candData.createdAt;
  delete candData.updatedAt;

  let doc = null;
  if (rawCandidateId) {
    const query = [{ candidateId: rawCandidateId }, { id: rawCandidateId }];
    if (/^[0-9a-fA-F]{24}$/.test(rawCandidateId)) {
      query.push({ _id: rawCandidateId });
    }
    doc = await CrmCandidate.findOne({ $or: query });
  }

  if (req.isVendor) {
    const allowedSet = getVendorAllowedSet(req);
    if (doc && (!doc.vendorId || !allowedSet.has(String(doc.vendorId).trim()))) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to modify another vendor's candidate.",
      });
    }
    candData.vendorId = doc?.vendorId || req.vendorId || req.userId;
    if (req.vendorName && !candData.vendorName) {
      candData.vendorName = req.vendorName;
    }
  } else if (!doc && !String(candData.vendorId || "").trim()) {
    return res.status(400).json({ success: false, message: "Candidate vendorId is required." });
  }

  const candidateId = doc
    ? doc.candidateId || rawCandidateId
    : rawCandidateId && !/^(cnd|cand|temp)-/i.test(rawCandidateId)
    ? rawCandidateId
    : await generateNextCandidateId();

  if (doc) {
    Object.assign(doc, candData, { candidateId, updatedAt: new Date() });
    await doc.save();
  } else {
    doc = await CrmCandidate.create({
      ...candData,
      candidateId,
    });
  }

  emitRealtimeEvent({
    events: ["immigo:candidate-update", "immigo:dashboard-update", "immigo:vendor-hr-refresh"],
    roles: ["SUPER_ADMIN", "ADMIN", "VENDOR_HR", "VENDOR"],
    vendorId: doc.vendorId ? String(doc.vendorId) : null,
    detail: { candidateId: doc.candidateId },
  });

  return res.status(200).json({
    success: true,
    candidate: { ...doc.toObject(), id: doc.candidateId || doc._id.toString() },
  });
});
