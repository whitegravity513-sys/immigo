import CrmCandidate from "../../models/CrmCandidate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getCandidates = asyncHandler(async (req, res) => {
  const { vendorId } = req.query;
  const filter = {};
  if (vendorId) filter.vendorId = String(vendorId);

  const candidates = await CrmCandidate.find(filter).sort({ createdAt: -1 }).lean();
  const formatted = (candidates || []).map((c) => ({
    ...c,
    id: c.candidateId || c._id.toString(),
  }));
  return res.status(200).json({ success: true, candidates: formatted });
});

export const saveCandidate = asyncHandler(async (req, res) => {
  const candData = req.body;
  const candidateId = candData.id || candData.candidateId || `CND-${Date.now().toString().slice(-5)}`;

  let doc = await CrmCandidate.findOne({
    $or: [{ candidateId }, { _id: candidateId.match(/^[0-9a-fA-F]{24}$/) ? candidateId : null }],
  });

  if (doc) {
    Object.assign(doc, candData, { candidateId, updatedAt: new Date() });
    await doc.save();
  } else {
    doc = await CrmCandidate.create({
      ...candData,
      candidateId,
    });
  }

  return res.status(200).json({
    success: true,
    candidate: { ...doc.toObject(), id: doc.candidateId || doc._id.toString() },
  });
});
