import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import Vendor from "../../models/Vendor.js";
import ProjectAssignment from "../../models/ProjectAssignment.js";
import CandidateApplication from "../../models/CandidateApplication.js";
import CrmCandidateApplication from "../../models/CrmCandidateApplication.js";
import Candidate from "../../models/Candidate.js";
import CrmCandidate from "../../models/CrmCandidate.js";
import Interview from "../../models/Interview.js";
import Job from "../../models/Job.js";
import ActivityLog from "../../models/ActivityLog.js";
import CrmRefund from "../../models/CrmRefund.js";
import env from "../../config/env.js";
import { getCookieOptions } from "../../config/security.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import PermissionService from "../../services/permission.service.js";
import {
  fetchAllMergedProjects,
  resolveProjectMilestonesData,
  normalizeMilestoneStages,
} from "../../utils/projectResolver.js";
import { isRecordRefundLocked } from "../../utils/refundLock.js";
import { generateNextHRId } from "../../utils/idGenerator.js";
import { escapeRegex } from "../../utils/regex.js";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

const cleanCandidateEmail = (val) => {
  const s = String(val || "").trim();
  if (!s || s.toLowerCase().includes("@candidate.local")) return "";
  return s;
};

const normalizeRecruitmentStageValue = (val) => {
  if (!val) return "Screening";
  const s = String(val).trim();
  if (s === "Submitted" || s === "Under Review") return "Screening";
  if (s === "Interview") return "Interview Scheduled";
  if (s === "Visa Allotted") return "Visa Issued";
  return s;
};

const POST_SELECTION_STAGES = new Set([
  "Selected",
  "Processing",
  "Completed",
  "Offer Released",
  "Offer Accepted",
  "Visa Processing",
  "Visa Issued",
  "Visa Allotted",
  "Joined",
  "Deployed",
]);

const isValidObjectId = (val) =>
  typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val.trim());

export const vendorHRLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email/HR ID and password are required.");
  }

  const rawIdentifier = String(email).trim();
  const cleanEmail = rawIdentifier.toLowerCase();
  const userQuery = rawIdentifier.includes("@")
    ? { email: cleanEmail }
    : {
        $or: [
          { email: cleanEmail },
          { hrId: rawIdentifier.toUpperCase() },
          { hrId: { $regex: new RegExp(`^${escapeRegex(rawIdentifier)}$`, "i") } },
        ],
      };

  const user = await User.findOne(userQuery).select("+passwordHash");

  if (!user) {
    throw new ApiError(401, "Invalid email/HR ID or password.");
  }

  if (user.isActive === false) {
    throw new ApiError(403, "Your account is deactivated. Contact your administrator.");
  }

  if (user.role !== "HR" || user.hrType !== "VENDOR_HR") {
    throw new ApiError(403, "Access restricted. This portal is strictly for Vendor HR personnel.");
  }

  if (typeof user.isLocked === "function" && user.isLocked()) {
    const remainingMins = Math.max(1, Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000));
    throw new ApiError(423, `Account temporarily locked due to multiple failed attempts. Retry in ${remainingMins} minute(s).`);
  }

  const isMatch = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!isMatch) {
    const nextAttempts = (user.failedLoginAttempts || 0) + 1;
    user.failedLoginAttempts = nextAttempts;
    if (nextAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
    }
    await user.save();
    throw new ApiError(401, "Invalid email/HR ID or password.");
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  if (!user.hrId) {
    user.hrId = await generateNextHRId();
  }
  await user.save();

  const assignedVendors = Array.isArray(user.assignedVendors) ? user.assignedVendors : [];
  const vendorDocs = await Vendor.find({ vendorId: { $in: assignedVendors } }).select("-password").lean();

  const resolved = await PermissionService.resolveUserPermissions(user);

  const tokenPayload = {
    id: user._id.toString(),
    _id: user._id.toString(),
    sub: user._id.toString(),
    role: "HR",
    hrType: "VENDOR_HR",
    hrId: user.hrId || "",
    assignedVendors,
    email: user.email,
    name: user.name,
    isSuperAdmin: false,
    tokenVersion: user.tokenVersion || 0,
  };

  const accessToken = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn: "30d" });
  const refreshToken = jwt.sign({ id: user._id.toString() }, env.JWT_SECRET, { expiresIn: "30d" });

  res.cookie("refreshToken", refreshToken, getCookieOptions(req));

  return ApiResponse.send(res, 200, "Vendor HR login successful", {
    accessToken,
    refreshToken,
    user: {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: "HR",
      hrType: "VENDOR_HR",
      hrId: user.hrId || "",
      assignedVendors,
      vendors: vendorDocs.map((v) => ({
        vendorId: v.vendorId,
        companyName: v.companyName,
      })),
      permissions: resolved.permissions,
    },
  });
});

export const getVendorHRDashboard = asyncHandler(async (req, res) => {
  const user = req.user;
  const isAdminOrSuper =
    req.isSuperAdmin ||
    req.userRole === "ADMIN" ||
    req.userRole === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN";

  const userIdStr = user?._id?.toString() || user?.id || "";
  let freshAssignedVendors = Array.isArray(user?.assignedVendors)
    ? user.assignedVendors.map(String)
    : [];

  if (!isAdminOrSuper && userIdStr) {
    try {
      const freshUser = await User.findById(userIdStr).select("assignedVendors").lean();
      if (freshUser && Array.isArray(freshUser.assignedVendors)) {
        freshAssignedVendors = freshUser.assignedVendors.map(String);
      }
    } catch {}
  }

  let vendorDocs = [];
  let expandedAssignedVendors = [...freshAssignedVendors];

  if (isAdminOrSuper) {
    if (req.query.vendorId && req.query.vendorId !== "ALL") {
      const qVId = String(req.query.vendorId).trim();
      vendorDocs = await Vendor.find({
        $or: [
          { vendorId: qVId },
          { id: qVId },
          ...(isValidObjectId(qVId) ? [{ _id: qVId }] : []),
        ],
      })
        .select("-password")
        .lean();
      expandedAssignedVendors = Array.from(
        new Set(
          [
            qVId,
            ...vendorDocs.flatMap((v) => [v.vendorId, v._id?.toString()].filter(Boolean)),
          ].map(String)
        )
      );
      freshAssignedVendors = vendorDocs.map((v) => v.vendorId || v._id?.toString()).filter(Boolean);
    } else {
      vendorDocs = await Vendor.find().select("-password").lean();
      expandedAssignedVendors = vendorDocs
        .flatMap((v) => [v.vendorId, v._id?.toString()].filter(Boolean))
        .map(String);
      freshAssignedVendors = vendorDocs.map((v) => v.vendorId || v._id?.toString()).filter(Boolean);
    }
  } else {
    const hexVendorIds = freshAssignedVendors.filter(isValidObjectId);
    vendorDocs =
      freshAssignedVendors.length > 0
        ? await Vendor.find({
            $or: [
              { vendorId: { $in: freshAssignedVendors } },
              { id: { $in: freshAssignedVendors } },
              ...(hexVendorIds.length > 0 ? [{ _id: { $in: hexVendorIds } }] : []),
            ],
          })
            .select("-password")
            .lean()
        : [];
    expandedAssignedVendors = Array.from(
      new Set(
        [
          ...freshAssignedVendors,
          ...vendorDocs.flatMap((v) => [v.vendorId, v._id?.toString()].filter(Boolean)),
        ].map(String)
      )
    );
  }

  const assignmentQuery = isAdminOrSuper
    ? {
        status: "Active",
        ...(req.query.vendorId && req.query.vendorId !== "ALL"
          ? { vendorId: { $in: expandedAssignedVendors } }
          : {}),
      }
    : {
        $or: [
          ...(expandedAssignedVendors.length > 0
            ? [{ vendorId: { $in: expandedAssignedVendors } }]
            : []),
          ...(userIdStr
            ? [{ userId: userIdStr }, { vendorHRUserId: userIdStr }]
            : []),
        ],
        status: "Active",
      };

  const [rawActiveAssignments, userHRAssignmentHistory, allMergedProjects] = await Promise.all([
    !isAdminOrSuper && expandedAssignedVendors.length === 0 && !userIdStr
      ? Promise.resolve([])
      : ProjectAssignment.find(assignmentQuery).lean(),
    !isAdminOrSuper && userIdStr
      ? ProjectAssignment.find({
          assignmentType: "VENDOR_HR_PROJECT",
          userId: userIdStr,
          status: { $in: ["Active", "Removed"] },
        }).lean()
      : Promise.resolve([]),
    fetchAllMergedProjects(),
  ]);

  const activeHRPairKeys = new Set();
  const activeHRProjectIds = new Set();
  userHRAssignmentHistory.forEach((a) => {
    if (a.status === "Active") {
      activeHRProjectIds.add(String(a.projectId));
      activeHRPairKeys.add(`${String(a.projectId)}::${String(a.vendorId || "")}`);
    }
  });

  const removedHRPairKeys = new Set();
  const removedHRProjectIds = new Set();
  userHRAssignmentHistory.forEach((a) => {
    if (a.status === "Removed") {
      const pId = String(a.projectId);
      const pairKey = `${pId}::${String(a.vendorId || "")}`;
      if (!activeHRPairKeys.has(pairKey)) {
        removedHRPairKeys.add(pairKey);
      }
      if (!activeHRProjectIds.has(pId)) {
        removedHRProjectIds.add(pId);
      }
    }
  });

  const assignments = isAdminOrSuper
    ? rawActiveAssignments
    : rawActiveAssignments.filter((a) => {
        const pId = String(a.projectId || "");
        const vId = String(a.vendorId || "");
        if (a.assignmentType === "VENDOR_HR_PROJECT" && String(a.userId || "") === userIdStr) {
          return true;
        }
        if (activeHRPairKeys.has(`${pId}::${vId}`)) {
          return true;
        }
        if (removedHRPairKeys.has(`${pId}::${vId}`)) {
          return false;
        }
        if (removedHRProjectIds.has(pId) && !activeHRProjectIds.has(pId)) {
          return false;
        }
        return true;
      });

  const expandedVendorSet = new Set(expandedAssignedVendors.map(String));

  const filteredProjectDocs = allMergedProjects.filter((doc) => {
    const candidates = Array.isArray(doc.rawIdCandidates) && doc.rawIdCandidates.length > 0
      ? doc.rawIdCandidates.map(String)
      : [String(doc.projectId)];

    const matchingAssignment = assignments.some(
      (a) =>
        candidates.includes(String(a.projectId || "")) ||
        (a.projectRef && candidates.includes(String(a.projectRef)))
    );

    if (isAdminOrSuper) {
      if (req.query.vendorId && req.query.vendorId !== "ALL") {
        const hasVendorInDoc = (doc.assignedVendors || []).some((v) =>
          expandedVendorSet.has(String(v.vendorId || v.id || v._id || v))
        );
        return matchingAssignment || hasVendorInDoc;
      }
      return true;
    }

    if (matchingAssignment) return true;

    const isRemovedForUser = candidates.some(
      (cid) => removedHRProjectIds.has(cid) && !activeHRProjectIds.has(cid)
    );
    if (isRemovedForUser) return false;

    const hasAssignedVendor = (doc.assignedVendors || []).some((v) => {
      const vId = String(v.vendorId || v.id || v._id || v);
      if (!expandedVendorSet.has(vId)) return false;
      const pairRemoved = candidates.some((cid) => removedHRPairKeys.has(`${cid}::${vId}`));
      return !pairRemoved;
    });
    if (hasAssignedVendor) return true;

    const hasDirectHR = (doc.assignedVendorHRs || []).some(
      (h) => userIdStr && String(h.userId || h._id || "") === userIdStr
    );
    return hasDirectHR;
  });

  const assignedProjectIds = Array.from(
    new Set([
      ...assignments.map((a) => String(a.projectId)).filter(Boolean),
      ...filteredProjectDocs.flatMap((d) =>
        Array.isArray(d.rawIdCandidates) ? d.rawIdCandidates : [d.projectId]
      ),
    ])
  );

  const enrichedProjects = filteredProjectDocs.map((doc) => {
    const pId = doc.projectId;
    const candidates = Array.isArray(doc.rawIdCandidates) && doc.rawIdCandidates.length > 0
      ? doc.rawIdCandidates.map(String)
      : [String(pId)];

    const matchingAssignments = assignments.filter(
      (a) =>
        candidates.includes(String(a.projectId || "")) ||
        (a.projectRef && candidates.includes(String(a.projectRef)))
    );

    const vendorNamesSet = new Set();
    matchingAssignments.forEach((a) => {
      if (a.vendorName) vendorNamesSet.add(a.vendorName);
    });
    if (Array.isArray(doc.assignedVendors)) {
      doc.assignedVendors.forEach((v) => {
        if (v.vendorName) vendorNamesSet.add(v.vendorName);
      });
    }

    const hrNamesSet = new Set();
    matchingAssignments.forEach((a) => {
      if (a.userName) hrNamesSet.add(a.userName);
    });
    if (Array.isArray(doc.assignedVendorHRs)) {
      doc.assignedVendorHRs.forEach((h) => {
        if (h.name) hrNamesSet.add(h.name);
      });
    }

    const positionsList =
      Array.isArray(doc.jobPositions) && doc.jobPositions.length > 0
        ? doc.jobPositions.map((pos) => ({
            ...pos,
            salary: pos.salary || doc.salary || "",
            currency: pos.currency || doc.currency || "",
          }))
        : Array.isArray(doc.manpowerRequirements)
        ? doc.manpowerRequirements.map((r) => ({
            title: r.positionTitle || r.position || r.title || r.role || "General Trade",
            openings: Number(r.quantity || r.openings || 1) || 1,
            filled: Number(r.filled || 0),
            salary: r.salary || doc.salary || "",
            currency: r.currency || doc.currency || "",
          }))
        : [];

    const openingsTotal = positionsList.reduce((sum, p) => sum + Number(p.openings || 1), 0);

    return {
      id: doc.id || pId,
      projectId: pId,
      projectName: doc.projectName || doc.title || "Overseas Project",
      clientName: doc.clientName || "",
      destinationCountry: doc.destinationCountry || doc.country || "",
      status: doc.status || "Active",
      targetHiring: doc.targetHiring > 0 ? doc.targetHiring : openingsTotal,
      salary: doc.salary || "",
      currency: doc.currency || "",
      paymentMilestones: doc.paymentMilestones || [],
      paymentMilestoneConfig: doc.paymentMilestoneConfig || null,
      totalMilestoneAmount: doc.totalMilestoneAmount || 0,
      positions: positionsList,
      assignedVendors: Array.from(vendorNamesSet),
      assignedVendorHRs: Array.from(hrNamesSet),
      assignedAt: doc.createdAt,
      notes: doc.description || "",
    };
  });

  const filterProjectId = req.query.projectId ? String(req.query.projectId).trim() : "";
  const isProjectFiltered = Boolean(filterProjectId && filterProjectId !== "ALL");
  const matchedFilterProj = isProjectFiltered
    ? filteredProjectDocs.find((d) =>
        (d.rawIdCandidates || [d.projectId]).includes(filterProjectId)
      )
    : null;
  const filterProjectIdCandidates = matchedFilterProj
    ? matchedFilterProj.rawIdCandidates
    : isProjectFiltered
    ? [filterProjectId]
    : [];

  const projectFilterClause = isProjectFiltered
    ? { projectId: { $in: filterProjectIdCandidates } }
    : {};

  const hrScopeAppFilter =
    req.query.vendorId && req.query.vendorId !== "ALL"
      ? { vendorId: { $in: expandedAssignedVendors } }
      : !isAdminOrSuper
      ? expandedAssignedVendors.length === 0 && assignedProjectIds.length === 0 && !userIdStr
        ? { _id: null }
        : {
            $or: [
              ...(expandedAssignedVendors.length > 0
                ? [{ vendorId: { $in: expandedAssignedVendors } }]
                : []),
              ...(assignedProjectIds.length > 0
                ? [{ projectId: { $in: assignedProjectIds } }]
                : []),
              ...(userIdStr ? [{ vendorHrId: userIdStr }] : []),
            ],
          }
      : {};

  const appQuery = {
    ...hrScopeAppFilter,
    ...projectFilterClause,
  };

  const jobQuery = {
    ...(isProjectFiltered
      ? { projectId: { $in: filterProjectIdCandidates } }
      : !isAdminOrSuper
      ? {
          $or: [
            ...(expandedAssignedVendors.length > 0
              ? [{ "assignedVendors.vendorId": { $in: expandedAssignedVendors } }]
              : []),
            ...(assignedProjectIds.length > 0
              ? [{ projectId: { $in: assignedProjectIds } }]
              : []),
          ],
          ...(expandedAssignedVendors.length === 0 && assignedProjectIds.length === 0
            ? { _id: null }
            : {}),
        }
      : {}),
  };

  const interviewQuery = {
    ...(req.query.vendorId && req.query.vendorId !== "ALL"
      ? { vendorId: { $in: expandedAssignedVendors } }
      : !isAdminOrSuper
      ? expandedAssignedVendors.length === 0 && assignedProjectIds.length === 0
        ? { _id: null }
        : {
            $or: [
              ...(expandedAssignedVendors.length > 0
                ? [{ vendorId: { $in: expandedAssignedVendors } }]
                : []),
              ...(assignedProjectIds.length > 0
                ? [{ projectId: { $in: assignedProjectIds } }]
                : []),
            ],
          }
      : {}),
    ...projectFilterClause,
  };

  const activityQuery = {
    ...(req.query.vendorId && req.query.vendorId !== "ALL"
      ? { vendorId: { $in: expandedAssignedVendors } }
      : !isAdminOrSuper
      ? {
          vendorId:
            expandedAssignedVendors.length > 0 ? { $in: expandedAssignedVendors } : { $in: [] },
        }
      : {}),
  };

  const refundQuery =
    req.query.vendorId && req.query.vendorId !== "ALL"
      ? { vendorId: { $in: expandedAssignedVendors } }
      : !isAdminOrSuper
      ? {
          vendorId:
            expandedAssignedVendors.length > 0 ? { $in: expandedAssignedVendors } : { $in: [] },
        }
      : {};

  const [directApplications, crmApplications, dbJobs, interviews, activities, rawRefunds] = await Promise.all([
    CandidateApplication.find(appQuery).sort({ createdAt: -1 }).lean(),
    CrmCandidateApplication.find(appQuery).sort({ createdAt: -1 }).lean(),
    Job.find(jobQuery).sort({ createdAt: -1 }).lean(),
    Interview.find(interviewQuery).sort({ scheduledDate: 1, startTime: 1 }).lean(),
    ActivityLog.find(activityQuery).sort({ createdAt: -1 }).limit(30).lean(),
    CrmRefund.find(refundQuery).sort({ createdAt: -1 }).lean(),
  ]);

  const combinedAppMap = new Map();
  const mergeAppRecord = (rec) => {
    if (!rec) return;
    const pId = String(rec.projectId || "");
    const vId = String(rec.vendorId || "");
    if (!isAdminOrSuper && pId) {
      if (removedHRPairKeys.has(`${pId}::${vId}`)) return;
      if (
        removedHRProjectIds.has(pId) &&
        !activeHRProjectIds.has(pId) &&
        !(userIdStr && String(rec.vendorHrId || "") === userIdStr)
      ) {
        return;
      }
    }

    const appId = String(rec.applicationId || rec.id || rec._id || "");
    const pairKey =
      rec.candidateId && rec.projectId ? `${String(rec.candidateId)}::${String(rec.projectId)}` : appId;
    const existing =
      combinedAppMap.get(appId) ||
      Array.from(combinedAppMap.values()).find(
        (x) =>
          pairKey &&
          x.candidateId &&
          x.projectId &&
          `${String(x.candidateId)}::${String(x.projectId)}` === pairKey
      );

    if (!existing) {
      combinedAppMap.set(appId, {
        ...rec,
        id: appId,
        applicationId: appId,
      });
    } else {
      const existingTs = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const incomingTs = new Date(rec.updatedAt || rec.createdAt || 0).getTime();
      const newer = incomingTs >= existingTs ? rec : existing;
      const older = incomingTs >= existingTs ? existing : rec;
      const keyToUse = existing.applicationId || appId;
      combinedAppMap.set(keyToUse, {
        ...older,
        ...newer,
        id: keyToUse,
        applicationId: keyToUse,
        processMilestones:
          Array.isArray(newer.processMilestones) && newer.processMilestones.length > 0
            ? newer.processMilestones
            : older.processMilestones || [],
        candidateData: {
          ...(older.candidateData || {}),
          ...(newer.candidateData || {}),
        },
        interview: newer.interview?.scheduledDate ? newer.interview : older.interview,
        interviewDetails:
          newer.interviewDetails?.dateTime || newer.interviewDetails?.scheduledDate
            ? newer.interviewDetails
            : older.interviewDetails,
      });
    }
  };

  (crmApplications || []).forEach(mergeAppRecord);
  (directApplications || []).forEach(mergeAppRecord);

  const rawApplications = Array.from(combinedAppMap.values()).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const candidateIds = Array.from(
    new Set(rawApplications.map((a) => a.candidateId).filter(Boolean).map(String))
  );
  const [candidateRecords, crmCandidateRecords] =
    candidateIds.length > 0
      ? await Promise.all([
          Candidate.find({ candidateId: { $in: candidateIds } })
            .select("candidateId fullName email phone documents profile")
            .lean(),
          CrmCandidate.find({
            $or: [{ candidateId: { $in: candidateIds } }, { id: { $in: candidateIds } }],
          }).lean(),
        ])
      : [[], []];

  const candidateMap = new Map(candidateRecords.map((c) => [String(c.candidateId), c]));
  const crmCandidateMap = new Map();
  (crmCandidateRecords || []).forEach((c) => {
    if (c.candidateId) crmCandidateMap.set(String(c.candidateId), c);
    if (c.id) crmCandidateMap.set(String(c.id), c);
    if (c._id) crmCandidateMap.set(String(c._id), c);
  });

  const projectMap = new Map();
  const rawProjectMap = new Map();
  enrichedProjects.forEach((p, idx) => {
    projectMap.set(p.projectId, p);
    const rawDoc = filteredProjectDocs[idx];
    if (rawDoc) rawProjectMap.set(p.projectId, rawDoc);
    if (rawDoc?.rawIdCandidates) {
      rawDoc.rawIdCandidates.forEach((cid) => {
        projectMap.set(String(cid), p);
        rawProjectMap.set(String(cid), rawDoc);
      });
    }
  });

  const applications = rawApplications.map((app) => {
    const cRec = candidateMap.get(String(app.candidateId || ""));
    const crmRec = crmCandidateMap.get(String(app.candidateId || ""));
    const cData = app.candidateData || {};
    const proj = projectMap.get(String(app.projectId || ""));
    const rawProj = rawProjectMap.get(String(app.projectId || ""));

    const passportNumber =
      app.passportNumber ||
      cRec?.profile?.passportNumber ||
      crmRec?.passportNumber ||
      cData.passportNumber ||
      "";

    const matchedInterview = interviews.find(
      (i) =>
        i.applicationId === app.applicationId ||
        (i.candidateId === app.candidateId && i.projectId === app.projectId) ||
        i.candidateId === app.candidateId
    );

    const mappedInterviewDetails =
      app.interviewDetails?.dateTime || app.interviewDetails?.scheduledDate
        ? {
            scheduledDate:
              app.interviewDetails.scheduledDate ||
              (app.interviewDetails.dateTime
                ? String(app.interviewDetails.dateTime).split("T")[0]
                : ""),
            scheduledTime:
              app.interviewDetails.scheduledTime ||
              (app.interviewDetails.dateTime &&
              String(app.interviewDetails.dateTime).includes("T")
                ? String(app.interviewDetails.dateTime).split("T")[1].slice(0, 5)
                : ""),
            round: app.interviewDetails.round || "L1 Interview",
            interviewerName: app.interviewDetails.interviewer || "",
            interviewLink:
              app.interviewDetails.meetingLink || app.interviewDetails.locationOrLink || "",
            mode: app.interviewDetails.mode || "Google Meet",
          }
        : null;

    const interviewData = app.interview?.scheduledDate
      ? app.interview
      : mappedInterviewDetails?.scheduledDate
      ? mappedInterviewDetails
      : matchedInterview
      ? {
          scheduledDate: matchedInterview.scheduledDate,
          scheduledTime: matchedInterview.startTime,
          round: matchedInterview.round,
          interviewerName: matchedInterview.interviewerName,
          interviewLink: matchedInterview.interviewLink,
          mode: matchedInterview.interviewMode || "Google Meet",
        }
      : app.interview || null;

    const resumeFileCandidates = [
      { label: "Resume / CV", type: "Resume / CV", url: app.resumeUrl || cData.resumeUrl || cData.cvUrl || crmRec?.resumeUrl || cRec?.resumeUrl },
      { label: "CV Document", type: "Resume / CV", url: app.cvUrl || crmRec?.cvUrl || cRec?.cvUrl },
      { label: "Passport Copy", type: "Passport Copy", url: app.passportCopyUrl || cData.passportCopyUrl || crmRec?.passportCopyUrl || cRec?.profile?.passportCopyUrl },
    ].filter((item) => item.url && String(item.url).trim());

    const syntheticDocs = resumeFileCandidates.map((item, idx) => ({
      id: `doc-synth-${app.applicationId || app._id || idx}-${idx}`,
      docType: item.type,
      type: item.type,
      name: item.label,
      fileName: item.label,
      fileUrl: String(item.url).trim(),
      status: "Submitted",
    }));

    const rawDocs = [
      ...(Array.isArray(app.documents) ? app.documents : []),
      ...(Array.isArray(cData.documents) ? cData.documents : []),
      ...(Array.isArray(crmRec?.documents) ? crmRec.documents : []),
      ...(Array.isArray(cRec?.documents) ? cRec.documents : []),
      ...syntheticDocs,
    ];
    const seenDocKeys = new Set();
    const combinedDocs = rawDocs.filter((doc) => {
      if (!doc || (!doc.fileUrl && !doc.url && !doc.fileName && !doc.name)) return false;
      const resolvedUrl = doc.fileUrl || doc.url || "";
      const key = resolvedUrl
        ? `url:${String(resolvedUrl).slice(0, 120)}`
        : `${doc.fileName || ""}|${doc.name || doc.docType || ""}`;
      if (seenDocKeys.has(key)) return false;
      seenDocKeys.add(key);
      return true;
    }).map((doc, idx) => ({
      ...doc,
      id: doc.id || `doc-${idx}`,
      name: doc.name || doc.docType || doc.type || doc.fileName || `Document ${idx + 1}`,
      docType: doc.docType || doc.type || doc.name || "Document",
      fileName: doc.fileName || doc.name || doc.docType || `Document ${idx + 1}`,
      fileUrl: doc.fileUrl || doc.url || "",
    }));

    const primaryResumeUrl =
      app.resumeUrl ||
      cData.resumeUrl ||
      cData.cvUrl ||
      crmRec?.resumeUrl ||
      cRec?.resumeUrl ||
      combinedDocs.find((d) =>
        `${d.docType || ""} ${d.type || ""} ${d.name || ""} ${d.fileName || ""}`
          .toLowerCase()
          .match(/resume|cv|curriculum/)
      )?.fileUrl ||
      combinedDocs[0]?.fileUrl ||
      "";

    const normalizedStage = normalizeRecruitmentStageValue(
      app.recruitmentStage || app.status || cData.stage || "Screening"
    );
    const normalizedStatus = normalizeRecruitmentStageValue(app.status || normalizedStage);

    let processMilestones = Array.isArray(app.processMilestones) ? app.processMilestones : [];
    let totalAmount = Number(app.paymentPlan?.totalAmount || 0);
    if (
      POST_SELECTION_STAGES.has(normalizedStage) ||
      POST_SELECTION_STAGES.has(normalizedStatus) ||
      processMilestones.length > 0
    ) {
      if (rawProj && !app.milestonesOverridden) {
        const resolved = resolveProjectMilestonesData(rawProj, processMilestones, false);
        if (resolved.processMilestones.length > 0) {
          processMilestones = resolved.processMilestones;
          totalAmount = resolved.totalAmount;
        } else {
          processMilestones = normalizeMilestoneStages(processMilestones);
          totalAmount = processMilestones.reduce(
            (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
            0
          );
        }
      } else {
        processMilestones = normalizeMilestoneStages(processMilestones);
        totalAmount = processMilestones.reduce(
          (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
          0
        );
      }
    }

    const expVal =
      app.experienceYears ||
      cRec?.profile?.experienceYears ||
      crmRec?.experienceYears ||
      cData.experienceYears ||
      "";

    const activeMatchedRefund = (rawRefunds || []).find((r) => {
      if (r.reassigned) return false;
      const appMatch =
        (app.applicationId && String(r.applicationId || "") === String(app.applicationId)) ||
        (app.candidateId &&
          String(r.candidateId || "") === String(app.candidateId) &&
          (!r.projectName ||
            String(r.projectName).trim().toLowerCase() ===
              String(app.projectName || "").trim().toLowerCase()));
      if (!appMatch) return false;
      if (r.projectId && app.projectId && String(r.projectId) !== String(app.projectId)) {
        return false;
      }
      return true;
    });

    const syncedRefundStatus = activeMatchedRefund?.refundStatus || app.refundStatus || "";
    const syncedRefundDetails = activeMatchedRefund
      ? {
          amount: Number(activeMatchedRefund.refundAmount || 0),
          status: activeMatchedRefund.refundStatus,
          reason: activeMatchedRefund.refundReason || "",
          date: activeMatchedRefund.refundDate || "",
          remarks: activeMatchedRefund.remarks || "",
          paymentRef: activeMatchedRefund.paymentRef || "",
        }
      : app.refundDetails || null;

    const resolvedEmail = cleanCandidateEmail(
      app.candidateEmail || cRec?.email || crmRec?.email || cData.email || ""
    );

    return {
      ...app,
      id: app.applicationId || app.id || app._id?.toString(),
      applicationId: app.applicationId || app.id || app._id?.toString(),
      refundStatus: syncedRefundStatus,
      refundDetails: syncedRefundDetails,
      isRefundLocked: isRecordRefundLocked({
        status: normalizedStatus,
        refundStatus: syncedRefundStatus,
        refundDetails: syncedRefundDetails,
      }),
      candidateEmail: resolvedEmail,
      candidatePhone:
        app.candidatePhone || cRec?.phone || crmRec?.phone || cData.phone || "",
      dob: app.dob || cRec?.profile?.dob || crmRec?.dob || cData.dob || "",
      gender: app.gender || cRec?.profile?.gender || crmRec?.gender || cData.gender || "",
      address: app.address || app.location || cRec?.profile?.address || crmRec?.address || cData.address || cData.location || "",
      city: app.city || cRec?.profile?.city || crmRec?.city || cData.city || "",
      state: app.state || cRec?.profile?.state || crmRec?.state || cData.state || "",
      pincode: app.pincode || cRec?.profile?.pincode || crmRec?.pincode || cData.pincode || "",
      nationality: app.nationality || crmRec?.nationality || cData.nationality || "Indian",
      qualification: app.qualification || crmRec?.qualification || cData.qualification || "",
      education: cRec?.profile?.education || crmRec?.education || cData.education || [],
      skills:
        (Array.isArray(app.skills) && app.skills.length > 0 ? app.skills : null) ||
        (Array.isArray(cRec?.profile?.skills) && cRec.profile.skills.length > 0 ? cRec.profile.skills : null) ||
        (Array.isArray(crmRec?.skills) && crmRec.skills.length > 0 ? crmRec.skills : null) ||
        (Array.isArray(cData.skills) ? cData.skills : []),
      languages:
        (Array.isArray(cRec?.profile?.languages) && cRec.profile.languages.length > 0 ? cRec.profile.languages : null) ||
        (Array.isArray(crmRec?.languages) && crmRec.languages.length > 0 ? crmRec.languages : null) ||
        [],
      trade: app.trade || cRec?.profile?.trade || crmRec?.trade || cData.trade || "",
      currentPosition: crmRec?.currentPosition || cData.currentPosition || cRec?.profile?.currentOccupation || "",
      passportExpiry: app.passportExpiry || cRec?.profile?.passportExpiry || crmRec?.passportExpiry || cData.passportExpiry || "",
      passportIssueCountry: app.passportIssueCountry || cRec?.profile?.passportIssueCountry || crmRec?.passportIssueCountry || cData.passportIssueCountry || "",
      notes: app.notes || cData.notes || crmRec?.notes || "",
      adminRemarks: app.adminRemarks || app.adminRemark || "",
      rejectionReason: app.rejectionReason || "",
      holdReason: app.holdReason || "",
      didNotJoinReason: app.didNotJoinReason || "",
      resumeUrl: primaryResumeUrl,
      candidateData: {
        ...(app.candidateData || {}),
        email: resolvedEmail,
        resumeUrl: primaryResumeUrl || app.candidateData?.resumeUrl || "",
        documents: combinedDocs,
      },
      position:
        app.position ||
        app.jobTitle ||
        crmRec?.currentPosition ||
        cData.currentPosition ||
        "",
      jobTitle:
        app.jobTitle ||
        app.position ||
        crmRec?.currentPosition ||
        cData.currentPosition ||
        "",
      passportNumber,
      recruitmentStage: normalizedStage,
      status: normalizedStatus,
      salary:
        (proj?.salary !== undefined && proj?.salary !== "" ? proj.salary : "") ||
        (rawProj?.salary !== undefined && rawProj?.salary !== "" ? rawProj.salary : "") ||
        app.salary ||
        "",
      currency:
        (proj?.currency !== undefined && proj?.currency !== "" ? proj.currency : "") ||
        (rawProj?.currency !== undefined && rawProj?.currency !== "" ? rawProj.currency : "") ||
        app.currency ||
        "",
      destinationCountry:
        proj?.destinationCountry ||
        rawProj?.destinationCountry ||
        app.destinationCountry ||
        crmRec?.preferredCountry ||
        "",
      clientName: proj?.clientName || app.clientName || "",
      projectName: proj?.projectName || rawProj?.projectName || app.projectName || "Overseas Project",
      interview: interviewData,
      documents: combinedDocs,
      experienceYears: expVal ? String(expVal) : "",
      processMilestones,
      paymentPlan: {
        ...(app.paymentPlan || { currency: "INR" }),
        totalAmount,
        milestones: processMilestones,
      },
      visaDetails: {
        ...(app.visaDetails || {}),
        visaStatus: ["Visa Issued", "Joined", "Deployed"].includes(normalizedStage)
          ? "Visa Issued"
          : normalizedStage === "Visa Processing"
          ? "In Process"
          : app.visaDetails?.visaStatus || "Not Started",
        visaNumber: app.visaDetails?.visaNumber || "",
      },
    };
  });

  const allJobs = dbJobs.map((j) => {
    const proj = projectMap.get(String(j.projectId || ""));
    const rawProj = rawProjectMap.get(String(j.projectId || ""));
    const textSalary = j.salary || j.salaryText || proj?.salary || rawProj?.salary || "";
    const textCurrency = j.currency || proj?.currency || rawProj?.currency || "";
    const hasNumericRange = j.salaryRange && (Number(j.salaryRange.min) > 0 || Number(j.salaryRange.max) > 0);
    return {
      ...j,
      projectName: j.projectName || proj?.projectName || "Overseas Project",
      clientName: j.clientName || proj?.clientName || "",
      salary: textSalary,
      currency: textCurrency,
      salaryRange: hasNumericRange
        ? j.salaryRange
        : {
            min: 0,
            max: 0,
            text: textSalary,
            currency: textCurrency,
            period: "monthly",
          },
    };
  });

  const existingJobTitlesByProj = new Set(
    allJobs.map((j) => `${j.projectId}_${(j.title || "").toLowerCase().trim()}`)
  );

  filteredProjectDocs.forEach((p) => {
    const pId = p.projectId;
    if (isProjectFiltered && !(p.rawIdCandidates || [pId]).includes(filterProjectId)) return;

    const combinedPositions = [
      ...(Array.isArray(p.jobPositions) ? p.jobPositions : []),
      ...(Array.isArray(p.manpowerRequirements) ? p.manpowerRequirements : []),
    ];

    combinedPositions.forEach((pos, idx) => {
      const posTitle = String(
        pos?.title || pos?.positionTitle || pos?.position || pos?.role || ""
      ).trim();
      if (!posTitle) return;
      const titleKey = `${pId}_${posTitle.toLowerCase()}`;
      if (!existingJobTitlesByProj.has(titleKey)) {
        const proj = projectMap.get(pId);
        const posSalary = pos.salary || p.salary || proj?.salary || "";
        const posCurrency = pos.currency || p.currency || proj?.currency || "";
        allJobs.push({
          id: `synth_${pId}_${idx}`,
          jobId: `JOB-${pId}-${idx + 1}`,
          title: posTitle,
          projectId: pId,
          projectName: proj?.projectName || p.projectName || p.title,
          clientId: p.clientId || "",
          clientName: proj?.clientName || p.clientName || "",
          department: "Technical Trade",
          tradeCategory: "Skilled Trade",
          openings: Number(pos.openings || pos.quantity || pos.count || 1) || 1,
          filledPositions: Number(pos.filled || pos.filledPositions || 0),
          salary: posSalary,
          currency: posCurrency,
          salaryRange: {
            min: 0,
            max: 0,
            text: posSalary,
            currency: posCurrency,
            period: "monthly",
          },
          destinationCountry: proj?.destinationCountry || p.destinationCountry || "",
          status: "Open",
          createdAt: p.createdAt,
        });
        existingJobTitlesByProj.add(titleKey);
      }
    });
  });

  enrichedProjects.forEach((ep, idx) => {
    const rawDoc = filteredProjectDocs[idx];
    const candIds = new Set(rawDoc?.rawIdCandidates || [ep.projectId]);
    const pJobs = allJobs.filter((j) => candIds.has(String(j.projectId)));
    ep.jobsCount = pJobs.length;
    ep.candidatesCount = applications.filter((a) => candIds.has(String(a.projectId))).length;
    const openingsSum = pJobs.reduce((sum, j) => sum + (j.openings || 0), 0);
    if (openingsSum > 0 && (!ep.targetHiring || ep.targetHiring === 0)) {
      ep.targetHiring = openingsSum;
    }
  });

  const kpis = {
    assignedProjects: enrichedProjects.length,
    activeOpenings: allJobs.reduce(
      (sum, j) => sum + ((j.openings || 1) - (j.filledPositions || 0)),
      0
    ),
    totalCandidates: applications.length,
    inScreening: applications.filter(
      (a) => a.recruitmentStage === "Screening" || a.status === "Screening"
    ).length,
    interviewsScheduled: applications.filter(
      (a) =>
        a.recruitmentStage?.includes("Interview") ||
        a.status?.includes("Interview") ||
        Boolean(a.interview?.scheduledDate)
    ).length,
    selected: applications.filter(
      (a) =>
        (a.recruitmentStage === "Selected" || a.status === "Selected") &&
        !isRecordRefundLocked(a)
    ).length,
    refundClaims: (rawRefunds || []).filter((r) => !r.reassigned && r.refundStatus !== "Rejected").length,
    offersReleased: applications.filter(
      (a) =>
        !isRecordRefundLocked(a) &&
        (["Offer Released", "Offer Accepted"].includes(a.recruitmentStage) ||
          a.offerDetails?.offerStatus === "Released" ||
          a.offerDetails?.offerStatus === "Accepted")
    ).length,
    visaInProcess: applications.filter(
      (a) =>
        !isRecordRefundLocked(a) &&
        (["Visa Processing", "Visa Issued"].includes(a.recruitmentStage) ||
          (a.visaDetails && a.visaDetails.visaStatus && a.visaDetails.visaStatus !== "Not Started"))
    ).length,
    joined: applications.filter(
      (a) =>
        !isRecordRefundLocked(a) &&
        (["Joined", "Deployed"].includes(a.recruitmentStage) ||
          a.visaDetails?.visaStatus === "Deployed")
    ).length,
  };

  let vendorHRProfile = null;
  if (user && !isAdminOrSuper) {
    if (user.role === "HR" && !user.hrId) {
      const generatedHrId = await generateNextHRId();
      await User.findByIdAndUpdate(user._id, { $set: { hrId: generatedHrId } }).catch(() => {});
      user.hrId = generatedHrId;
    }
    vendorHRProfile = {
      id: user._id?.toString() || "",
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "HR",
      hrType: user.hrType || "VENDOR_HR",
      hrId: user.hrId || "",
    };
  }

  return ApiResponse.send(res, 200, "Vendor HR dashboard fetched successfully", {
    kpis,
    vendorHRProfile,
    projects: enrichedProjects,
    assignedVendors: freshAssignedVendors,
    vendor: vendorDocs[0] || null,
    vendors: vendorDocs,
    jobs: allJobs,
    applications,
    recentApplications: applications.slice(0, 10),
    interviews,
    upcomingInterviews: interviews.filter((i) => i.status === "Scheduled").slice(0, 15),
    activities,
    recentActivities: activities,
    refunds: (rawRefunds || []).map((r) => ({
      ...r,
      id: r.refundId || r._id?.toString(),
      _id: r._id?.toString() || "",
    })),
  });
});
