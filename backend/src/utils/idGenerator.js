import CrmOverseasClient from "../models/CrmOverseasClient.js";
import Client from "../models/Client.js";
import Vendor from "../models/Vendor.js";
import Candidate from "../models/Candidate.js";
import CandidateApplication from "../models/CandidateApplication.js";

export const generateNextVendorId = async () => {
  const latest = await Vendor.findOne(
    { vendorId: /^IMM-VND-\d{5}$/i },
    { vendorId: 1 }
  ).sort({ vendorId: -1 }).lean();

  let nextNum = 1;
  if (latest?.vendorId) {
    const lastNum = parseInt(latest.vendorId.slice(-5), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  let vendorId = `IMM-VND-${String(nextNum).padStart(5, "0")}`;
  while (await Vendor.exists({ vendorId })) {
    nextNum++;
    vendorId = `IMM-VND-${String(nextNum).padStart(5, "0")}`;
  }
  return vendorId;
};

export const generateNextClientId = async () => {
  const yy = new Date().getFullYear().toString().slice(-2);
  const prefix = `IMCL-${yy}-`;
  const regex = new RegExp(`^${prefix}\\d{4}$`, "i");

  const [latestCrm, latestClient] = await Promise.all([
    CrmOverseasClient.findOne({ clientId: regex }, { clientId: 1 }).sort({ clientId: -1 }).lean(),
    Client.findOne({ clientId: regex }, { clientId: 1 }).sort({ clientId: -1 }).lean(),
  ]);

  let maxNum = 0;
  if (latestCrm?.clientId) {
    const num = parseInt(latestCrm.clientId.slice(-4), 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }
  if (latestClient?.clientId) {
    const num = parseInt(latestClient.clientId.slice(-4), 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }

  let nextNum = maxNum + 1;
  let clientId = `${prefix}${String(nextNum).padStart(4, "0")}`;

  while (
    (await CrmOverseasClient.exists({ clientId })) ||
    (await Client.exists({ clientId }))
  ) {
    nextNum++;
    clientId = `${prefix}${String(nextNum).padStart(4, "0")}`;
  }
  return clientId;
};

export const generateNextCandidateId = async (dobInput, dojInput) => {
  const dojDate = dojInput ? new Date(dojInput) : new Date();
  const dojMonth = String(dojDate.getMonth() + 1).padStart(2, "0");
  const dojYear = String(dojDate.getFullYear()).slice(-2);
  const dojStr = `${dojMonth}${dojYear}`;

  let dobStr = "0100";
  if (dobInput) {
    const dobDate = new Date(dobInput);
    if (!isNaN(dobDate.getTime())) {
      const day = String(dobDate.getDate()).padStart(2, "0");
      const yy = String(dobDate.getFullYear()).slice(-2);
      dobStr = `${day}${yy}`;
    }
  }

  const baseCandidateId = `IMC-${dojStr}-${dobStr}`;
  let candidateId = baseCandidateId;
  let counter = 1;

  while (await Candidate.exists({ candidateId })) {
    candidateId = `${baseCandidateId}-${counter}`;
    counter++;
  }

  return candidateId;
};

export const generateNextCandidateApplicationId = async () => {
  const yy = new Date().getFullYear().toString().slice(-2);
  const prefix = `APP-${yy}-`;
  const regex = new RegExp(`^${prefix}\\d{4}$`, "i");

  const latest = await CandidateApplication.findOne(
    { applicationId: regex },
    { applicationId: 1 }
  ).sort({ applicationId: -1 }).lean();

  let nextNum = 1;
  if (latest?.applicationId) {
    const lastNum = parseInt(latest.applicationId.slice(-4), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  let applicationId = `${prefix}${String(nextNum).padStart(4, "0")}`;
  while (await CandidateApplication.exists({ applicationId })) {
    nextNum++;
    applicationId = `${prefix}${String(nextNum).padStart(4, "0")}`;
  }
  return applicationId;
};

