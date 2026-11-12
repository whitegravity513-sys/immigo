import mongoose from "mongoose";
import CrmOverseasClient from "../models/CrmOverseasClient.js";
import Client from "../models/Client.js";
import Project from "../models/Project.js";
import Vendor from "../models/Vendor.js";
import Candidate from "../models/Candidate.js";
import CrmCandidate from "../models/CrmCandidate.js";
import CandidateApplication from "../models/CandidateApplication.js";
import CrmCandidateApplication from "../models/CrmCandidateApplication.js";
import User from "../models/User.js";

const getNextNumericMax = (prefix, values = []) => {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rx = new RegExp(`^${escaped}(\\d+)$`, "i");
  let max = 0;
  for (const val of values) {
    if (!val) continue;
    const match = String(val).trim().match(rx);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!Number.isNaN(n) && n > max) {
        max = n;
      }
    }
  }
  return max;
};

const formatSeq = (prefix, num, pad = 3) =>
  `${prefix}${String(num).padStart(pad, "0")}`;

const reserveNextSequence = async (counterKey, currentMax = 0) => {
  try {
    const col = mongoose.connection?.db?.collection("id_counters");
    if (!col) return currentMax + 1;
    const minBase = Math.max(0, Number(currentMax) || 0);
    await col.updateOne(
      { _id: counterKey },
      { $max: { seq: minBase } },
      { upsert: true }
    );
    const res = await col.findOneAndUpdate(
      { _id: counterKey },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
    const seq = Number(res?.value?.seq ?? res?.seq ?? 0);
    return Number.isFinite(seq) && seq > minBase ? seq : minBase + 1;
  } catch {
    return currentMax + 1;
  }
};

export const generateNextVendorId = async () => {
  const prefix = "IMMI-VE-";
  const regex = /^IMMI-VE-\d+$/i;
  const rows = await Vendor.find({ vendorId: regex }, { vendorId: 1 }).lean();
  let nextNum = await reserveNextSequence(
    "vendor_id",
    getNextNumericMax(prefix, rows.map((r) => r.vendorId))
  );
  let vendorId = formatSeq(prefix, nextNum, 3);
  while (await Vendor.exists({ vendorId })) {
    nextNum = await reserveNextSequence("vendor_id", nextNum);
    vendorId = formatSeq(prefix, nextNum, 3);
  }
  return vendorId;
};

export const generateNextProjectId = async () => {
  const prefix = "IMMI-PR-";
  const regex = /^IMMI-PR-\d+$/i;
  const [directRows, clientRows] = await Promise.all([
    Project.find({ projectId: regex }, { projectId: 1 }).lean(),
    CrmOverseasClient.find({}, { "projects.id": 1, "projects.projectId": 1 }).lean(),
  ]);
  const existingVals = [
    ...directRows.map((r) => r.projectId),
    ...clientRows.flatMap((c) =>
      (Array.isArray(c.projects) ? c.projects : []).flatMap((p) => [p?.id, p?.projectId])
    ),
  ];
  let nextNum = await reserveNextSequence("project_id", getNextNumericMax(prefix, existingVals));
  let projectId = formatSeq(prefix, nextNum, 3);
  while (
    (await Project.exists({ projectId })) ||
    (await CrmOverseasClient.exists({
      $or: [{ "projects.id": projectId }, { "projects.projectId": projectId }],
    }))
  ) {
    nextNum = await reserveNextSequence("project_id", nextNum);
    projectId = formatSeq(prefix, nextNum, 3);
  }
  return projectId;
};

export const generateNextCandidateId = async () => {
  const prefix = "IMMI-CA-";
  const regex = /^IMMI-CA-\d+$/i;
  const [candRows, crmCandRows, appRows, crmAppRows] = await Promise.all([
    Candidate.find({ candidateId: regex }, { candidateId: 1 }).lean(),
    CrmCandidate.find({ candidateId: regex }, { candidateId: 1 }).lean(),
    CandidateApplication.find({ candidateId: regex }, { candidateId: 1 }).lean(),
    CrmCandidateApplication.find({ candidateId: regex }, { candidateId: 1 }).lean(),
  ]);
  const existingVals = [
    ...candRows.map((r) => r.candidateId),
    ...crmCandRows.map((r) => r.candidateId),
    ...appRows.map((r) => r.candidateId),
    ...crmAppRows.map((r) => r.candidateId),
  ];
  let nextNum = await reserveNextSequence("candidate_id", getNextNumericMax(prefix, existingVals));
  let candidateId = formatSeq(prefix, nextNum, 3);
  while (
    (await Candidate.exists({ candidateId })) ||
    (await CrmCandidate.exists({ candidateId }))
  ) {
    nextNum = await reserveNextSequence("candidate_id", nextNum);
    candidateId = formatSeq(prefix, nextNum, 3);
  }
  return candidateId;
};

export const generateNextMouId = async () => {
  const prefix = "IMMI-MO-";
  const regex = /^IMMI-MO-\d+$/i;
  const rows = await Vendor.find(
    {
      $or: [
        { "mouDocument.mouNumber": regex },
        { "mouDocument.refNumber": regex },
      ],
    },
    { "mouDocument.mouNumber": 1, "mouDocument.refNumber": 1 }
  ).lean();
  const existingVals = rows.flatMap((r) => [
    r?.mouDocument?.mouNumber,
    r?.mouDocument?.refNumber,
  ]);
  let nextNum = await reserveNextSequence("mou_id", getNextNumericMax(prefix, existingVals));
  let mouNumber = formatSeq(prefix, nextNum, 3);
  while (
    await Vendor.exists({
      $or: [
        { "mouDocument.mouNumber": mouNumber },
        { "mouDocument.refNumber": mouNumber },
      ],
    })
  ) {
    nextNum = await reserveNextSequence("mou_id", nextNum);
    mouNumber = formatSeq(prefix, nextNum, 3);
  }
  return mouNumber;
};

export const generateNextHRId = async () => {
  const prefix = "IMMI-HR-";
  const regex = /^IMMI-HR-\d+$/i;
  const rows = await User.find({ hrId: regex }, { hrId: 1 }).lean();
  let nextNum = await reserveNextSequence("hr_id", getNextNumericMax(prefix, rows.map((r) => r.hrId)));
  let hrId = formatSeq(prefix, nextNum, 3);
  while (await User.exists({ hrId })) {
    nextNum = await reserveNextSequence("hr_id", nextNum);
    hrId = formatSeq(prefix, nextNum, 3);
  }
  return hrId;
};

export const generateNextClientId = async () => {
  const yy = new Date().getFullYear().toString().slice(-2);
  const prefix = `IMCL-${yy}-`;
  const regex = new RegExp(`^${prefix}\\d{4}$`, "i");

  const [crmRows, clientRows] = await Promise.all([
    CrmOverseasClient.find({ clientId: regex }, { clientId: 1 }).lean(),
    Client.find({ clientId: regex }, { clientId: 1 }).lean(),
  ]);

  let nextNum = await reserveNextSequence(
    `client_id_${yy}`,
    getNextNumericMax(prefix, [
      ...crmRows.map((r) => r.clientId),
      ...clientRows.map((r) => r.clientId),
    ])
  );
  let clientId = formatSeq(prefix, nextNum, 4);

  while (
    (await CrmOverseasClient.exists({ clientId })) ||
    (await Client.exists({ clientId }))
  ) {
    nextNum = await reserveNextSequence(`client_id_${yy}`, nextNum);
    clientId = formatSeq(prefix, nextNum, 4);
  }
  return clientId;
};

export const generateNextCandidateApplicationId = async () => {
  const yy = new Date().getFullYear().toString().slice(-2);
  const prefix = `APP-${yy}-`;
  const regex = new RegExp(`^${prefix}\\d+$`, "i");

  const [appRows, crmAppRows] = await Promise.all([
    CandidateApplication.find({ applicationId: regex }, { applicationId: 1 }).lean(),
    CrmCandidateApplication.find({ applicationId: regex }, { applicationId: 1 }).lean(),
  ]);

  let nextNum = await reserveNextSequence(
    `application_id_${yy}`,
    getNextNumericMax(prefix, [
      ...appRows.map((r) => r.applicationId),
      ...crmAppRows.map((r) => r.applicationId),
    ])
  );
  let applicationId = formatSeq(prefix, nextNum, 4);
  while (
    (await CandidateApplication.exists({ applicationId })) ||
    (await CrmCandidateApplication.exists({ applicationId }))
  ) {
    nextNum = await reserveNextSequence(`application_id_${yy}`, nextNum);
    applicationId = formatSeq(prefix, nextNum, 4);
  }
  return applicationId;
};
