import mongoose from "mongoose";
import Meeting from "../models/Meeting.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Vendor from "../models/Vendor.js";
import CandidateApplication from "../models/CandidateApplication.js";
import ProjectAssignment from "../models/ProjectAssignment.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";
import NotificationService, { resolveActorInfo } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ROLES } from "../constants/roles.js";
import { fetchAllMergedProjects } from "../utils/projectResolver.js";
import { escapeRegex } from "../utils/regex.js";
import { emitRealtimeEvent } from "../services/realtime.service.js";

const emitMeetingSync = (meeting) => {
  const targetVendors = Array.isArray(meeting?.targetVendors) ? meeting.targetVendors.filter(Boolean) : [];
  const resolvedVendorId =
    targetVendors.length > 1
      ? null
      : meeting?.vendorId
      ? String(meeting.vendorId)
      : targetVendors.length === 1
      ? String(targetVendors[0])
      : null;

  const roles = ["SUPER_ADMIN", "ADMIN", "VENDOR_HR", "VENDOR", "HR", "EMPLOYEE"];
  const candidateId = meeting?.candidateId ? String(meeting.candidateId) : null;
  if (candidateId) {
    roles.push("CANDIDATE");
  }

  emitRealtimeEvent({
    events: [
      "immigo:meeting-update",
      "immigo:dashboard-update",
      "immigo:vendor-hr-refresh",
      "immigo:notification-update",
      "immigo:admin-notification",
      "immigo:vendor-notification",
    ],
    roles,
    vendorId: resolvedVendorId,
    candidateId,
  });
};

const isHexObjectId = (val) =>
  typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val.trim());

const resolveVendorAliasesForCaller = async ({ vendorUser, vendorId, userId }) => {
  const aliases = new Set(
    [vendorId, userId, vendorUser?.vendorId, vendorUser?._id?.toString(), vendorUser?.id]
      .filter(Boolean)
      .map((v) => String(v).trim())
  );

  let vendorDoc =
    vendorUser && (vendorUser.companyName || vendorUser.vendorId) ? vendorUser : null;
  if (!vendorDoc && aliases.size > 0) {
    const aliasArr = Array.from(aliases);
    const hexIds = aliasArr.filter(isHexObjectId);
    vendorDoc = await Vendor.findOne({
      $or: [
        { vendorId: { $in: aliasArr } },
        ...(hexIds.length > 0 ? [{ _id: { $in: hexIds } }] : []),
      ],
    }).lean();
  }

  if (vendorDoc) {
    if (vendorDoc.vendorId) aliases.add(String(vendorDoc.vendorId).trim());
    if (vendorDoc._id) aliases.add(vendorDoc._id.toString());
    if (vendorDoc.id) aliases.add(String(vendorDoc.id).trim());
  }

  return {
    vendorDoc,
    canonicalVendorId: vendorDoc?.vendorId || vendorId || vendorDoc?._id?.toString() || "",
    vendorName: vendorDoc?.companyName || vendorUser?.companyName || "",
    aliases,
  };
};

const resolveEligibleVendorHRsForVendor = async ({
  vendorUser,
  vendorId,
  userId,
  search = "",
}) => {
  const { vendorDoc, canonicalVendorId, vendorName, aliases } =
    await resolveVendorAliasesForCaller({ vendorUser, vendorId, userId });

  if (aliases.size === 0) {
    return { eligibleHRs: [], vendorDoc, canonicalVendorId, vendorName };
  }

  const [allMergedProjects, vendorProjectAssignments, hrProjectAssignments, vendorHRUsers] =
    await Promise.all([
      fetchAllMergedProjects(),
      ProjectAssignment.find({
        assignmentType: "VENDOR_PROJECT",
        status: { $in: ["Active", "Removed"] },
      }).lean(),
      ProjectAssignment.find({
        assignmentType: "VENDOR_HR_PROJECT",
        status: { $in: ["Active", "Removed"] },
      }).lean(),
      User.find({ role: "HR", hrType: "VENDOR_HR", isActive: { $ne: false } })
        .select("_id name email role hrType assignedVendors department phone")
        .lean(),
    ]);

  const projectByCandidateId = new Map();
  (allMergedProjects || []).forEach((proj) => {
    const cands = new Set([
      proj.projectId,
      proj.id,
      ...(Array.isArray(proj.rawIdCandidates) ? proj.rawIdCandidates : []),
    ]);
    cands.forEach((cid) => {
      if (cid) projectByCandidateId.set(String(cid).trim(), proj);
    });
  });

  const activeVendorProjKeys = new Set();
  const removedVendorProjKeys = new Set();
  const activeFallbackVendorProjects = new Map();

  (vendorProjectAssignments || []).forEach((a) => {
    const aVendorStr = String(a.vendorId || "").trim();
    const aRefStr = a.vendorRef ? String(a.vendorRef).trim() : "";
    if (!aliases.has(aVendorStr) && !aliases.has(aRefStr)) return;

    const pRaw = String(a.projectId || "").trim();
    const matchedProj = projectByCandidateId.get(pRaw);
    const key = matchedProj ? String(matchedProj.projectId) : pRaw;
    if (!key) return;

    if (a.status === "Active") {
      activeVendorProjKeys.add(key);
      if (!matchedProj) {
        activeFallbackVendorProjects.set(key, {
          projectId: key,
          projectName: a.projectName || "Assigned Project",
          title: a.projectName || "Assigned Project",
          status: "Active",
          rawIdCandidates: [key],
          assignedVendors: [{ vendorId: aVendorStr }],
          assignedVendorHRs: [],
        });
      }
    } else if (a.status === "Removed") {
      removedVendorProjKeys.add(key);
    }
  });

  const vendorProjectsMap = new Map();
  const vendorProjByCandidateId = new Map();

  const registerVendorProject = (proj) => {
    const key = String(proj.projectId);
    vendorProjectsMap.set(key, proj);
    const cands = new Set([
      proj.projectId,
      proj.id,
      ...(Array.isArray(proj.rawIdCandidates) ? proj.rawIdCandidates : []),
    ]);
    cands.forEach((cid) => {
      if (cid) vendorProjByCandidateId.set(String(cid).trim(), proj);
    });
  };

  (allMergedProjects || []).forEach((proj) => {
    const statusLower = String(proj.status || "Active").toLowerCase();
    if (statusLower === "deleted" || statusLower === "cancelled" || statusLower === "inactive") {
      return;
    }
    const key = String(proj.projectId);
    const isExplicitActive = activeVendorProjKeys.has(key);
    const hasEmbeddedVendor = (proj.assignedVendors || []).some(
      (v) =>
        v.status !== "Removed" &&
        aliases.has(String(v.vendorId || v.id || v._id || "").trim())
    );
    const isExplicitRemoved = removedVendorProjKeys.has(key) && !isExplicitActive;

    if (isExplicitActive || (hasEmbeddedVendor && !isExplicitRemoved)) {
      registerVendorProject(proj);
    }
  });

  activeFallbackVendorProjects.forEach((proj, key) => {
    if (!vendorProjectsMap.has(key)) {
      registerVendorProject(proj);
    }
  });

  const q = String(search || "").trim().toLowerCase();
  const eligibleHRs = [];

  for (const hr of vendorHRUsers || []) {
    const hrIdStr = hr._id.toString();
    const hrEmail = String(hr.email || "").trim().toLowerCase();
    const hrAssignedVendors = new Set((hr.assignedVendors || []).map((v) => String(v).trim()));
    const hrHasVendorAssigned = Array.from(aliases).some((al) => hrAssignedVendors.has(al));

    const sharedProjectsMap = new Map();
    const activeHRProjIds = new Set();
    const activeHRExplicitPairs = new Set();
    const revokedHRProjKeys = new Set();

    (hrProjectAssignments || []).forEach((a) => {
      const aUserStr = a.userId ? String(a.userId).trim() : "";
      const aEmail = String(a.userEmail || "").trim().toLowerCase();
      if (aUserStr !== hrIdStr && (!hrEmail || aEmail !== hrEmail)) return;

      const proj = vendorProjByCandidateId.get(String(a.projectId || "").trim());
      if (!proj) return;

      const pKey = String(proj.projectId);
      const aVendorStr = String(a.vendorId || "").trim();

      if (a.status === "Active") {
        activeHRProjIds.add(pKey);
        if (aVendorStr) activeHRExplicitPairs.add(`${pKey}::${aVendorStr}`);
        const vendorMatches = aVendorStr ? aliases.has(aVendorStr) : hrHasVendorAssigned;
        if (vendorMatches) {
          sharedProjectsMap.set(pKey, {
            projectId: pKey,
            projectName: proj.projectName || proj.title || "Assigned Project",
          });
        }
      }
    });

    (hrProjectAssignments || []).forEach((a) => {
      if (a.status !== "Removed") return;
      const aUserStr = a.userId ? String(a.userId).trim() : "";
      const aEmail = String(a.userEmail || "").trim().toLowerCase();
      if (aUserStr !== hrIdStr && (!hrEmail || aEmail !== hrEmail)) return;

      const proj = vendorProjByCandidateId.get(String(a.projectId || "").trim());
      if (!proj) return;

      const pKey = String(proj.projectId);
      const aVendorStr = String(a.vendorId || "").trim();
      if (aVendorStr) {
        if (!activeHRExplicitPairs.has(`${pKey}::${aVendorStr}`)) {
          revokedHRProjKeys.add(`${pKey}::${aVendorStr}`);
        }
      } else if (!activeHRProjIds.has(pKey)) {
        revokedHRProjKeys.add(pKey);
      }
    });

    vendorProjectsMap.forEach((proj) => {
      const pKey = String(proj.projectId);
      (proj.assignedVendorHRs || []).forEach((entry) => {
        const entryUid = String(entry?.userId || entry?._id || entry?.id || "").trim();
        const entryEmail = String(entry?.email || "").trim().toLowerCase();
        if (entryUid !== hrIdStr && (!hrEmail || entryEmail !== hrEmail)) return;

        const eVendorStr = String(entry?.vendorId || "").trim();
        const isRevoked =
          revokedHRProjKeys.has(pKey) ||
          (eVendorStr && revokedHRProjKeys.has(`${pKey}::${eVendorStr}`));
        if (isRevoked) return;

        const vendorMatches = eVendorStr ? aliases.has(eVendorStr) : hrHasVendorAssigned;
        if (vendorMatches) {
          sharedProjectsMap.set(pKey, {
            projectId: pKey,
            projectName: proj.projectName || proj.title || "Assigned Project",
          });
        }
      });
    });

    if (!hrHasVendorAssigned && sharedProjectsMap.size === 0) continue;

    const assignedProjects = Array.from(sharedProjectsMap.values());
    if (q) {
      const matchesText =
        hr.name?.toLowerCase().includes(q) ||
        hr.email?.toLowerCase().includes(q) ||
        hr.department?.toLowerCase().includes(q) ||
        assignedProjects.some(
          (p) =>
            p.projectName?.toLowerCase().includes(q) ||
            p.projectId?.toLowerCase().includes(q)
        );
      if (!matchesText) continue;
    }

    eligibleHRs.push({
      id: hrIdStr,
      _id: hrIdStr,
      name: hr.name,
      email: hr.email,
      role: hr.role,
      hrType: "VENDOR_HR",
      assignedVendors: hr.assignedVendors || [],
      assignedProjects,
      department: hr.department || "",
      phone: hr.phone || "",
    });
  }

  return { eligibleHRs, vendorDoc, canonicalVendorId, vendorName };
};

export const logCandidateMeetingActivity = async ({
  meeting,
  actionType,
  previousStatus = "",
  newStatus = "",
  remarks = "",
  updater,
}) => {
  if (!meeting.candidateId) return;

  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const updaterRole = updater?.userRole || updater?.role || "ADMIN";
    const updaterName = updater?.name || updater?.companyName || "System";
    const updaterId = updater?._id?.toString() || updater?.id || updater?.vendorId || "";

    await ActivityLog.create({
      userType: updaterRole === ROLES.VENDOR ? "VENDOR" : "ADMIN",
      userId: updaterId,
      userName: updaterName,
      action: actionType,
      title: `Meeting: ${meeting.title} - ${actionType}`,
      description: remarks || `Meeting [${meeting.title}] updated for candidate ${meeting.candidateName || meeting.candidateId}.`,
      entityType: "Candidate",
      entityId: meeting.candidateId,
      entityName: meeting.candidateName || "Candidate",
      status: newStatus || meeting.status,
      visibility: "ALL",

      candidateId: meeting.candidateId,
      candidateName: meeting.candidateName || "",
      updatedByUserId: updaterId,
      updatedByName: updaterName,
      updatedByRole: updaterRole,
      vendorId: meeting.vendorId || "",
      vendorName: meeting.vendorName || "",
      actionType,
      previousStatus,
      newStatus,
      remarks: remarks || meeting.remarks || meeting.description || "",
      date: dateStr,
      time: timeStr,
      meetingRef: meeting._id.toString(),
      metadata: {
        meetingId: meeting._id.toString(),
        meetingDate: meeting.date,
        meetingTime: meeting.startTime,
        meetingLink: meeting.meetingLink,
        platform: meeting.platform,
        outcome: meeting.outcome || "",
        attendance: meeting.attendance || "",
      },
    });
  } catch (err) {
    console.error("Failed to log candidate meeting activity:", err.message);
  }
};

export const createMeeting = asyncHandler(async (req, res) => {
  const {
    title,
    description = "",
    meetingType = "GENERAL",
    date,
    startTime,
    endTime = "",
    meetingLink,
    platform = "Google Meet",
    targetType = "ALL",
    targetEmployees = [],
    targetVendors = [],
    targetHRs = [],
    targetAdmins = [],
    attendees = [],
    candidateId = "",
    candidateName = "",
    candidateEmail = "",
    applicationId = "",
    vendorId = "",
    vendorName = "",
    hrId = "",
    hrName = "",
    projectId = "",
    projectName = "",
    remarks = "",
  } = req.body;

  if (!title || !date || !startTime || !meetingLink) {
    throw new ApiError(400, "Title, Date, Start Time, and Meeting Link are required.");
  }

  const todayStr = new Date().toISOString().split("T")[0];
  if (date < todayStr) {
    throw new ApiError(
      400,
      "Meeting date cannot be in the past. Please select today or a future date."
    );
  }

  const role = req.userRole || req.user?.role || "ADMIN";
  const isSuperAdmin = req.isSuperAdmin || role === ROLES.SUPER_ADMIN;
  const isVendor = req.isVendor || role === ROLES.VENDOR;
  const hrType = req.hrType || req.user?.hrType || "";
  const isEmployeeHR = role === ROLES.HR && (hrType === "EMPLOYEE_HR" || hrType === "");
  const isVendorHR = role === ROLES.HR && hrType === "VENDOR_HR";

  let vendorRestrictedHRs = null;
  let vendorCanonicalId = req.vendorId || "";
  let vendorCanonicalName = req.vendorName || "";

  if (isVendor) {
    if (vendorId && req.vendorId && String(vendorId) !== String(req.vendorId) && String(vendorId) !== String(req.userId)) {
      throw new ApiError(403, "Vendors can only schedule meetings for their own agency.");
    }
    if (meetingType !== "INTERNAL_HR") {
      throw new ApiError(
        403,
        "Vendors can only schedule meetings with their assigned Vendor HR."
      );
    }

    const eligibleRes = await resolveEligibleVendorHRsForVendor({
      vendorUser: req.user,
      vendorId: req.vendorId,
      userId: req.userId,
    });
    vendorCanonicalId = eligibleRes.canonicalVendorId || vendorCanonicalId;
    vendorCanonicalName = eligibleRes.vendorName || vendorCanonicalName;

    const requestedHRIds = Array.from(
      new Set(
        [
          ...(Array.isArray(targetHRs) ? targetHRs : []),
          ...(hrId ? [hrId] : []),
          ...(Array.isArray(attendees) ? attendees.map((a) => a?.id || a?._id) : []),
        ]
          .filter(Boolean)
          .map(String)
      )
    );

    if (targetType === "ALL" && requestedHRIds.length === 0) {
      throw new ApiError(
        403,
        "Vendors must select a specific Vendor HR assigned to their agency."
      );
    }
    if (requestedHRIds.length === 0) {
      throw new ApiError(
        400,
        "Please select an assigned Vendor HR to schedule this meeting."
      );
    }

    const eligibleMap = new Map((eligibleRes.eligibleHRs || []).map((h) => [String(h.id), h]));
    const selectedHRDocs = requestedHRIds.map((id) => eligibleMap.get(id)).filter(Boolean);

    if (
      eligibleRes.eligibleHRs.length === 0 ||
      selectedHRDocs.length !== requestedHRIds.length
    ) {
      throw new ApiError(
        403,
        "You can only schedule meetings with a Vendor HR assigned to your agency."
      );
    }

    vendorRestrictedHRs = selectedHRDocs;
  } else if (isVendorHR) {
    if (vendorId) {
      const assigned = req.assignedVendors || [];
      const hasAccess = assigned.some(
        (v) => String(v).toLowerCase() === String(vendorId).toLowerCase()
      );
      if (!hasAccess && !isSuperAdmin && role !== ROLES.ADMIN) {
        throw new ApiError(403, "You can only schedule meetings for vendors assigned to your account.");
      }
    }
  } else if (isEmployeeHR && !isSuperAdmin && role !== ROLES.ADMIN) {
    if (candidateId && !isSuperAdmin) {
      throw new ApiError(403, "Employee Management HR is restricted to workforce and internal meetings.");
    }
  }

  const organizerId = req.userId || req.user?._id?.toString() || req.user?.id || req.vendorId;
  const organizerName = req.user?.name || req.user?.companyName || req.vendorName || "Organizer";
  const organizerRole = isSuperAdmin
    ? "SUPER_ADMIN"
    : isVendor
    ? "VENDOR"
    : isVendorHR
    ? "VENDOR_HR"
    : isEmployeeHR
    ? "EMPLOYEE_HR"
    : role;

  let resolvedTargetEmployees = [];
  const processedAttendees = Array.isArray(attendees) ? [...attendees] : [];

  if (Array.isArray(targetEmployees) && targetEmployees.length > 0) {
    for (const empRef of targetEmployees) {
      if (!empRef) continue;
      let empDoc = null;
      if (mongoose.Types.ObjectId.isValid(empRef)) {
        empDoc = await Employee.findById(empRef);
      }
      if (!empDoc) {
        empDoc = await Employee.findOne({
          $or: [{ employeeId: empRef }, { email: empRef }, { name: empRef }],
        });
      }
      if (empDoc) {
        resolvedTargetEmployees.push(empDoc._id);
        if (!processedAttendees.some((a) => a.id === empDoc._id.toString() || a.email === empDoc.email)) {
          processedAttendees.push({
            id: empDoc._id.toString(),
            name: empDoc.name,
            email: empDoc.email,
            role: "EMPLOYEE",
            code: empDoc.employeeId,
            designation: empDoc.designation,
          });
        }
      } else if (mongoose.Types.ObjectId.isValid(empRef)) {
        resolvedTargetEmployees.push(empRef);
      }
    }
  }

  for (const att of processedAttendees) {
    if (att && (att.role === "EMPLOYEE" || att.name)) {
      const empDoc = await Employee.findOne({
        $or: [
          ...(att.id && mongoose.Types.ObjectId.isValid(att.id) ? [{ _id: att.id }] : []),
          ...(att.email ? [{ email: att.email }] : []),
          ...(att.name ? [{ name: att.name }] : []),
        ],
      });
      if (empDoc && !resolvedTargetEmployees.some((id) => id.toString() === empDoc._id.toString())) {
        resolvedTargetEmployees.push(empDoc._id);
      }
    }
  }

  const hasSpecificTargets =
    isVendor ||
    resolvedTargetEmployees.length > 0 ||
    (Array.isArray(targetVendors) && targetVendors.length > 0) ||
    (Array.isArray(targetHRs) && targetHRs.length > 0) ||
    (Array.isArray(targetAdmins) && targetAdmins.length > 0) ||
    targetType === "SPECIFIC";

  const effectiveTargetType = isVendor ? "SPECIFIC" : hasSpecificTargets ? "SPECIFIC" : targetType;

  let resolvedProjectId = String(projectId || "").trim();
  let resolvedProjectName = String(projectName || "").trim();
  let finalTargetEmployees = resolvedTargetEmployees;
  let finalTargetVendors = Array.isArray(targetVendors) ? targetVendors : [];
  let finalTargetHRs = Array.isArray(targetHRs) ? targetHRs : [];
  let finalTargetAdmins = Array.isArray(targetAdmins) ? targetAdmins.map(String).filter(Boolean) : [];
  let finalAttendees = processedAttendees;
  let finalCandidateId = candidateId;
  let finalCandidateName = candidateName;
  let finalCandidateEmail = candidateEmail;
  let finalHrId = hrId;
  let finalHrName = hrName;

  if (isVendor && Array.isArray(vendorRestrictedHRs) && vendorRestrictedHRs.length > 0) {
    finalTargetEmployees = [];
    finalTargetVendors = vendorCanonicalId ? [vendorCanonicalId] : [];
    finalTargetHRs = vendorRestrictedHRs.map((h) => String(h.id));
    finalAttendees = vendorRestrictedHRs.map((h) => ({
      id: String(h.id),
      name: h.name,
      email: h.email || "",
      role: "VENDOR_HR",
      code: "",
      companyName: "",
      designation: "VENDOR_HR",
    }));
    finalCandidateId = "";
    finalCandidateName = "";
    finalCandidateEmail = "";
    finalHrId = finalTargetHRs[0] || "";
    finalHrName = vendorRestrictedHRs.map((h) => h.name).filter(Boolean).join(", ");

    const sharedProjectList = [];
    const seenProjIds = new Set();
    vendorRestrictedHRs.forEach((h) => {
      (h.assignedProjects || []).forEach((p) => {
        const pid = String(p.projectId || "");
        if (pid && !seenProjIds.has(pid)) {
          seenProjIds.add(pid);
          sharedProjectList.push(p);
        }
      });
    });

    if (resolvedProjectId) {
      const matchedProj = sharedProjectList.find(
        (p) => String(p.projectId) === resolvedProjectId
      );
      if (matchedProj) {
        resolvedProjectName = matchedProj.projectName || resolvedProjectName;
      } else if (sharedProjectList.length > 0) {
        throw new ApiError(
          403,
          "Selected project is not jointly assigned to both your agency and the chosen Vendor HR."
        );
      }
    } else if (sharedProjectList.length > 0) {
      resolvedProjectId = String(sharedProjectList[0].projectId || "");
      resolvedProjectName = sharedProjectList
        .map((p) => p.projectName)
        .filter(Boolean)
        .join(", ");
    }
  } else if (meetingType === "INTERNAL_HR" && !finalHrId && finalTargetHRs.length > 0) {
    finalHrId = String(finalTargetHRs[0]);
    if (!finalHrName) {
      finalHrName = processedAttendees
        .filter((a) => a.role?.includes("HR") || finalTargetHRs.includes(String(a.id)))
        .map((a) => a.name)
        .filter(Boolean)
        .join(", ");
    }
  }

  const meeting = await Meeting.create({
    title: title.trim(),
    description: description.trim(),
    meetingType,
    date,
    startTime,
    endTime,
    meetingLink: meetingLink.trim(),
    platform,
    targetType: effectiveTargetType,
    targetEmployees: finalTargetEmployees,
    targetVendors: finalTargetVendors,
    targetHRs: finalTargetHRs,
    targetAdmins: finalTargetAdmins,
    attendees: finalAttendees,
    candidateId: finalCandidateId,
    candidateName: finalCandidateName,
    candidateEmail: finalCandidateEmail,
    applicationId,
    vendorId: isVendor ? (vendorCanonicalId || req.vendorId || vendorId) : vendorId,
    vendorName: isVendor ? (vendorCanonicalName || req.vendorName || vendorName) : vendorName,
    hrId: finalHrId,
    hrName: finalHrName,
    projectId: resolvedProjectId,
    projectName: resolvedProjectName,
    remarks,
    status: "SCHEDULED",
    createdBy: organizerId,
    createdByName: organizerName,
    organizerRole,
    remindersSent: [],
  });

  if (finalCandidateId) {
    await logCandidateMeetingActivity({
      meeting,
      actionType: "MEETING_SCHEDULED",
      previousStatus: "Pending",
      newStatus: "Meeting Scheduled",
      remarks: `Meeting scheduled: "${meeting.title}" on ${meeting.date} at ${meeting.startTime}. Link: ${meeting.meetingLink}`,
      updater: req.user,
    });
  }

  const meetingMetadata = {
    meetingId: meeting._id.toString(),
    meetingLink: meeting.meetingLink,
    date: meeting.date,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    platform: meeting.platform,
    title: meeting.title,
    candidateName: meeting.candidateName,
    vendorId: meeting.vendorId,
    vendorName: meeting.vendorName,
    hrName: meeting.hrName,
    projectId: meeting.projectId,
    projectName: meeting.projectName,
  };

  try {
    const actorSource = {
      ...(req.user?.toObject ? req.user.toObject() : req.user || {}),
      role: isVendor ? "VENDOR" : req.userRole || req.user?.role,
    };
    const actorMeta = resolveActorInfo(actorSource);
    if (meetingType === "VENDOR_DISCUSSION") {
      if (effectiveTargetType === "ALL") {
        const activeVendors = await Vendor.find({ status: { $ne: "Rejected" } }).select("vendorId companyName email");
        for (const v of activeVendors) {
          await Notification.create({
            type: "MEETING",
            title: `📅 Vendor Conference: ${meeting.title}`,
            message: `A vendor conference "${meeting.title}" is scheduled on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
            targetRole: "VENDOR",
            targetVendorId: v.vendorId,
            actorId: actorMeta.actorId,
            actorRole: actorMeta.actorRole,
            moduleScope: "MEETING",
            metadata: { ...meetingMetadata, link: "/vendor/meetings" },
          });
        }
        const allVendorHRs = await User.find({ role: "HR", hrType: "VENDOR_HR" }).select("_id");
        for (const vhr of allVendorHRs) {
          await Notification.create({
            type: "MEETING",
            title: `📅 Vendor Conference: ${meeting.title}`,
            message: `A vendor conference "${meeting.title}" is scheduled on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
            targetRole: "VENDOR_HR",
            targetUserId: vhr._id.toString(),
            actorId: actorMeta.actorId,
            actorRole: actorMeta.actorRole,
            moduleScope: "MEETING",
            metadata: { ...meetingMetadata, link: "/vendor-hr/dashboard?view=meetings" },
          });
        }
      } else {
        const targetVList = [
          ...new Set([
            ...(Array.isArray(targetVendors) ? targetVendors : []),
            ...(meeting.vendorId ? [meeting.vendorId] : []),
            ...processedAttendees.filter((a) => a.role === "VENDOR").map((a) => a.code || a.id),
          ]),
        ].filter(Boolean);

        for (const vRef of targetVList) {
          await Notification.create({
            type: "MEETING",
            title: `📅 Vendor Discussion: ${meeting.title}`,
            message: `You are invited to a meeting "${meeting.title}" on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
            targetRole: "VENDOR",
            targetVendorId: vRef,
            actorId: actorMeta.actorId,
            actorRole: actorMeta.actorRole,
            moduleScope: "MEETING",
            metadata: { ...meetingMetadata, link: "/vendor/meetings" },
          });

          const assignedVHRs = await User.find({
            role: "HR",
            hrType: "VENDOR_HR",
            assignedVendors: vRef,
          }).select("_id");
          for (const vhr of assignedVHRs) {
            await Notification.create({
              type: "MEETING",
              title: `📅 Vendor Discussion: ${meeting.title}`,
              message: `Vendor meeting "${meeting.title}" involving agency ${vRef} is scheduled on ${meeting.date} at ${meeting.startTime} (${meeting.platform}).`,
              targetRole: "VENDOR_HR",
              targetUserId: vhr._id.toString(),
              actorId: actorMeta.actorId,
              actorRole: actorMeta.actorRole,
              moduleScope: "MEETING",
              metadata: { ...meetingMetadata, link: "/vendor-hr/dashboard?view=meetings" },
            });
          }
        }
      }
    }

    else if (meetingType === "INTERNAL_HR") {
      if (effectiveTargetType === "ALL" && !isVendor) {
        const allHRs = await User.find({ role: "HR", isActive: { $ne: false } }).select("_id hrType");
        for (const hr of allHRs) {
          const resolvedHrType = hr.hrType || "EMPLOYEE_HR";
          const hrLink =
            resolvedHrType === "VENDOR_HR"
              ? "/vendor-hr/dashboard?view=meetings"
              : "/hr/meetings";
          await NotificationService.createNotification({
            type: "MEETING",
            title: `📅 HR Operations Sync: ${meeting.title}`,
            message: `HR Team sync "${meeting.title}" is scheduled on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
            targetRole: resolvedHrType,
            targetRoles: [resolvedHrType],
            targetType: "SPECIFIC",
            targetUserId: hr._id.toString(),
            actorId: actorMeta.actorId,
            actorRole: actorMeta.actorRole,
            moduleScope: "MEETING",
            metadata: { ...meetingMetadata, link: hrLink },
          });
        }
      } else {
        const targetHRList = [
          ...new Set([
            ...(Array.isArray(finalTargetHRs) ? finalTargetHRs : []),
            ...(meeting.hrId ? [meeting.hrId] : []),
            ...finalAttendees.filter((a) => a.role?.includes("HR")).map((a) => a.id),
          ]),
        ]
          .map((v) => String(v || "").trim())
          .filter(Boolean);

        const validHrObjectIds = targetHRList.filter(isHexObjectId);
        const hrDocs = validHrObjectIds.length > 0
          ? await User.find({ _id: { $in: validHrObjectIds } })
              .select("_id hrType")
              .lean()
          : [];
        const hrTypeMap = new Map(
          hrDocs.map((h) => [h._id.toString(), h.hrType || "EMPLOYEE_HR"])
        );

        for (const hrUserId of targetHRList) {
          const hrIdStr = String(hrUserId);
          const resolvedHrType = hrTypeMap.get(hrIdStr) || (isVendor ? "VENDOR_HR" : "VENDOR_HR");
          const hrLink =
            resolvedHrType === "VENDOR_HR"
              ? "/vendor-hr/dashboard?view=meetings"
              : "/hr/meetings";
          await NotificationService.createNotification({
            type: "MEETING",
            title: isVendor
              ? `📅 Vendor Meeting Request: ${meeting.title}`
              : `📅 HR Meeting: ${meeting.title}`,
            message: isVendor
              ? `${meeting.vendorName || "Assigned vendor"} scheduled a meeting "${meeting.title}"${meeting.projectName ? ` (${meeting.projectName})` : ""} on ${meeting.date} at ${meeting.startTime} (${meeting.platform}).`
              : `You are invited to an HR meeting "${meeting.title}" on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
            targetRole: resolvedHrType,
            targetRoles: [resolvedHrType],
            targetType: "SPECIFIC",
            targetUserId: hrIdStr,
            targetVendorId: meeting.vendorId ? String(meeting.vendorId) : null,
            actorId: actorMeta.actorId,
            actorRole: actorMeta.actorRole,
            moduleScope: "MEETING",
            metadata: { ...meetingMetadata, link: hrLink },
          });
        }
      }
    }

    else if (meetingType === "ADMIN_DISCUSSION") {
      const adminAttendees = finalAttendees.filter(
        (a) => a.role === "ADMIN" || a.role === "SUPER_ADMIN"
      );
      if (effectiveTargetType === "ALL" && finalTargetAdmins.length === 0 && adminAttendees.length === 0) {
        await Promise.allSettled([
          NotificationService.createNotification({
            type: "MEETING",
            title: `📅 Admin Discussion: ${meeting.title}`,
            message: `${organizerName} scheduled "${meeting.title}" on ${meeting.date} at ${meeting.startTime} (${meeting.platform}).`,
            targetRole: "ADMIN",
            targetRoles: ["ADMIN"],
            targetType: "ALL",
            actorId: actorMeta.actorId,
            actorRole: actorMeta.actorRole,
            moduleScope: "MEETING",
            metadata: { ...meetingMetadata, link: "/admin/meetings" },
          }),
          NotificationService.createNotification({
            type: "MEETING",
            title: `📅 Admin Discussion: ${meeting.title}`,
            message: `${organizerName} scheduled "${meeting.title}" on ${meeting.date} at ${meeting.startTime} (${meeting.platform}).`,
            targetRole: "SUPER_ADMIN",
            targetRoles: ["SUPER_ADMIN"],
            targetType: "ALL",
            actorId: actorMeta.actorId,
            actorRole: actorMeta.actorRole,
            moduleScope: "MEETING",
            metadata: { ...meetingMetadata, link: "/admin/meetings" },
          }),
        ]);
      } else {
        const requestedAdminIds = Array.from(
          new Set([
            ...finalTargetAdmins,
            ...adminAttendees.map((a) => String(a.id || a._id || "")).filter(Boolean),
          ])
        );
        const attendeeRoleMap = new Map(
          adminAttendees.map((a) => [String(a.id || a._id || ""), String(a.role || "ADMIN").toUpperCase()])
        );
        const hexAdminIds = requestedAdminIds.filter(isHexObjectId);
        const userAdmins = hexAdminIds.length > 0
          ? await User.find({ _id: { $in: hexAdminIds } }).select("_id role").lean()
          : [];
        const userRoleMap = new Map(
          userAdmins.map((u) => [u._id.toString(), String(u.role || "ADMIN").toUpperCase()])
        );

        for (const adminIdStr of requestedAdminIds) {
          const resolvedAdminRole =
            userRoleMap.get(adminIdStr) || attendeeRoleMap.get(adminIdStr) || "ADMIN";
          await NotificationService.createNotification({
            type: "MEETING",
            title: `📅 Meeting Invitation: ${meeting.title}`,
            message: `${organizerName} scheduled "${meeting.title}" with you on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click to join.`,
            targetRole: resolvedAdminRole,
            targetRoles: [resolvedAdminRole],
            targetType: "SPECIFIC",
            targetUserId: adminIdStr,
            actorId: actorMeta.actorId,
            actorRole: actorMeta.actorRole,
            moduleScope: "MEETING",
            metadata: { ...meetingMetadata, link: "/admin/meetings" },
          });
        }
      }
    }

    else if (meetingType === "EMPLOYEE") {
      if (effectiveTargetType === "ALL") {
        await NotificationService.createNotification({
          type: "MEETING",
          title: `📅 Company Meeting: ${meeting.title}`,
          message: `A company meeting is scheduled on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
          targetRole: "EMPLOYEE",
          targetType: "ALL",
          actor: actorSource,
          moduleScope: "MEETING",
          metadata: { ...meetingMetadata, link: "/employee/dashboard" },
        });
      } else if (finalTargetEmployees.length > 0) {
        await Promise.all(
          finalTargetEmployees.map((empId) =>
            NotificationService.createNotification({
              type: "MEETING",
              title: `📅 Meeting Invitation: ${meeting.title}`,
              message: `You are invited to a meeting "${meeting.title}" on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
              targetRole: "EMPLOYEE",
              targetType: "SPECIFIC",
              targetEmployeeId: empId,
              employeeId: empId,
              actor: actorSource,
              moduleScope: "MEETING",
              metadata: { ...meetingMetadata, link: "/employee/dashboard" },
            })
          )
        );
      }
    }

    else if (meetingType === "CANDIDATE_INTERVIEW") {
      if (meeting.vendorId && !isVendor) {
        await Notification.create({
          type: "MEETING",
          title: `📅 Candidate Interview: ${meeting.title}`,
          message: `An interview has been scheduled for candidate ${meeting.candidateName || "Partner"} on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
          targetRole: "VENDOR",
          targetVendorId: meeting.vendorId,
          actorId: actorMeta.actorId,
          actorRole: actorMeta.actorRole,
          moduleScope: "MEETING",
          metadata: { ...meetingMetadata, link: "/vendor/meetings" },
        });

        const vendorHRUsers = await User.find({
          role: "HR",
          hrType: "VENDOR_HR",
          assignedVendors: meeting.vendorId,
        }).select("_id name email");

        for (const vhr of vendorHRUsers) {
          await Notification.create({
            type: "MEETING",
            title: `📅 Candidate Interview: ${meeting.title}`,
            message: `Interview "${meeting.title}" for ${meeting.candidateName || "candidate"} is scheduled on ${meeting.date} at ${meeting.startTime} (${meeting.platform}).`,
            targetRole: "VENDOR_HR",
            targetUserId: vhr._id.toString(),
            actorId: actorMeta.actorId,
            actorRole: actorMeta.actorRole,
            moduleScope: "MEETING",
            metadata: { ...meetingMetadata, link: "/vendor-hr/dashboard?view=meetings" },
          });
        }
      }
      if (finalTargetEmployees.length > 0) {
        await Promise.all(
          finalTargetEmployees.map((empId) =>
            NotificationService.createNotification({
              type: "MEETING",
              title: `📅 Candidate Interview: ${meeting.title}`,
              message: `You are scheduled to interview candidate ${meeting.candidateName} on ${meeting.date} at ${meeting.startTime} (${meeting.platform}).`,
              targetRole: "EMPLOYEE",
              targetType: "SPECIFIC",
              targetEmployeeId: empId,
              employeeId: empId,
              actor: actorSource,
              moduleScope: "MEETING",
              metadata: { ...meetingMetadata, link: "/employee/dashboard" },
            })
          )
        );
      }
    }

    else {
      if (effectiveTargetType === "ALL") {
        await NotificationService.createNotification({
          type: "MEETING",
          title: `📅 General Meeting: ${meeting.title}`,
          message: `A meeting is scheduled on ${meeting.date} at ${meeting.startTime} (${meeting.platform}). Click below to join.`,
          targetRole: "EMPLOYEE",
          targetType: "ALL",
          actor: actorSource,
          moduleScope: "MEETING",
          metadata: { ...meetingMetadata, link: "/employee/dashboard" },
        });
      }
    }

    if (meetingType !== "ADMIN_DISCUSSION") {
      await NotificationService.notifyStaffAction({
        actor: actorSource,
        type: "MEETING",
        title: `📅 Meeting Scheduled: ${meeting.title}`,
        message: `Meeting "${meeting.title}" scheduled on ${meeting.date} at ${meeting.startTime} (${meeting.platform}).`,
        moduleScope: "MEETING",
        metadata: { ...meetingMetadata, link: "/admin/meetings" },
      });
    }

    if (isVendor) {
      await NotificationService.createNotification({
        type: "MEETING",
        title: `📅 Vendor Meeting Scheduled: ${meeting.title}`,
        message: `${meeting.vendorName || "Vendor"} scheduled a meeting "${meeting.title}" with Vendor HR ${meeting.hrName || ""}${meeting.projectName ? ` (${meeting.projectName})` : ""} on ${meeting.date} at ${meeting.startTime} (${meeting.platform}).`,
        targetRole: "ADMIN",
        targetRoles: ["SUPER_ADMIN", "ADMIN"],
        targetType: "ALL",
        targetVendorId: meeting.vendorId ? String(meeting.vendorId) : null,
        actorId: actorMeta.actorId,
        actorRole: "VENDOR",
        moduleScope: "MEETING",
        metadata: { ...meetingMetadata, link: "/admin/meetings" },
      });
    }
  } catch (err) {
    console.error("Failed to dispatch meeting notification:", err.message);
  }

  emitMeetingSync(meeting);

  return res.status(201).json({
    success: true,
    message: "Meeting scheduled successfully",
    meeting,
  });
});

export const getAdminMeetings = asyncHandler(async (req, res) => {
  const { month, year, date, status, candidateId, vendorId, meetingType, upcoming } = req.query;
  const filter = {};

  const role = req.userRole || req.user?.role || "ADMIN";
  const isSuperAdmin = req.isSuperAdmin || role === ROLES.SUPER_ADMIN;
  const isVendor = req.isVendor || role === ROLES.VENDOR;
  const hrType = req.hrType || req.user?.hrType || "";
  const isEmployeeHR = role === ROLES.HR && (hrType === "EMPLOYEE_HR" || hrType === "");
  const isVendorHR = role === ROLES.HR && hrType === "VENDOR_HR";

  if (isVendor) {
    const { aliases } = await resolveVendorAliasesForCaller({
      vendorUser: req.user,
      vendorId: req.vendorId,
      userId: req.userId,
    });
    const aliasArr = Array.from(aliases);
    filter.$or = [
      ...(aliasArr.length > 0
        ? [
            { vendorId: { $in: aliasArr } },
            { targetVendors: { $in: aliasArr } },
            { "attendees.id": { $in: aliasArr } },
            { "attendees.code": { $in: aliasArr } },
          ]
        : []),
      ...(req.userId ? [{ createdBy: req.userId }] : []),
      ...(req.user?.email ? [{ "attendees.email": req.user.email }] : []),
      { targetType: "ALL", meetingType: "VENDOR_DISCUSSION" },
    ];
  } else if (isVendorHR && !isSuperAdmin && role !== ROLES.ADMIN) {
    const assigned = req.assignedVendors || [];
    filter.$or = [
      { vendorId: { $in: assigned } },
      { targetVendors: { $in: assigned } },
      { hrId: req.userId },
      { targetHRs: req.userId },
      { targetAdmins: req.userId },
      { createdBy: req.userId },
      { "attendees.id": req.userId },
      { "attendees.email": req.user?.email },
      { targetType: "ALL", meetingType: { $in: ["VENDOR_DISCUSSION", "INTERNAL_HR"] } },
    ];
  } else if (isEmployeeHR && !isSuperAdmin && role !== ROLES.ADMIN) {
    filter.$or = [
      { meetingType: { $in: ["INTERNAL_HR", "EMPLOYEE", "GENERAL"] } },
      { createdBy: req.userId },
      { hrId: req.userId },
      { targetHRs: req.userId },
      { "attendees.id": req.userId },
      { "attendees.email": req.user?.email },
      { targetType: "ALL" },
    ];
  }

  if (date) {
    filter.date = date;
  } else if (month && year) {
    const formattedMonth = escapeRegex(String(month).padStart(2, "0"));
    const safeYear = escapeRegex(String(year).trim());
    filter.date = { $regex: `^${safeYear}-${formattedMonth}` };
  }

  if (status && status !== "ALL") {
    filter.status = status;
  }

  if (candidateId) {
    filter.candidateId = candidateId;
  }

  if (vendorId && !isVendor) {
    filter.vendorId = vendorId;
  }

  if (meetingType && meetingType !== "ALL") {
    filter.meetingType = meetingType;
  }

  if (upcoming === "true") {
    const todayStr = new Date().toISOString().split("T")[0];
    filter.date = { $gte: todayStr };
    if (!status) {
      filter.status = { $in: ["SCHEDULED", "RESCHEDULED"] };
    }
  }

  const meetings = await Meeting.find(filter)
    .populate("targetEmployees", "name employeeId email designation")
    .sort({ date: 1, startTime: 1 })
    .lean();

  return res.status(200).json(meetings);
});

export const getMeetingCalendarStats = asyncHandler(async (req, res) => {
  const role = req.userRole || req.user?.role || "ADMIN";
  const isSuperAdmin = req.isSuperAdmin || role === ROLES.SUPER_ADMIN;
  const isVendor = req.isVendor || role === ROLES.VENDOR;
  const hrType = req.hrType || req.user?.hrType || "";
  const isEmployeeHR = role === ROLES.HR && (hrType === "EMPLOYEE_HR" || hrType === "");
  const isVendorHR = role === ROLES.HR && hrType === "VENDOR_HR";

  const baseFilter = {};
  if (isVendor) {
    const { aliases } = await resolveVendorAliasesForCaller({
      vendorUser: req.user,
      vendorId: req.vendorId,
      userId: req.userId,
    });
    const aliasArr = Array.from(aliases);
    baseFilter.$or = [
      ...(aliasArr.length > 0
        ? [
            { vendorId: { $in: aliasArr } },
            { targetVendors: { $in: aliasArr } },
            { "attendees.id": { $in: aliasArr } },
            { "attendees.code": { $in: aliasArr } },
          ]
        : []),
      ...(req.userId ? [{ createdBy: req.userId }] : []),
      ...(req.user?.email ? [{ "attendees.email": req.user.email }] : []),
      { targetType: "ALL", meetingType: "VENDOR_DISCUSSION" },
    ];
  } else if (isVendorHR && !isSuperAdmin && role !== ROLES.ADMIN) {
    const assigned = req.assignedVendors || [];
    baseFilter.$or = [
      { vendorId: { $in: assigned } },
      { targetVendors: { $in: assigned } },
      { hrId: req.userId },
      { targetHRs: req.userId },
      { targetAdmins: req.userId },
      { createdBy: req.userId },
      { "attendees.id": req.userId },
      { "attendees.email": req.user?.email },
      { targetType: "ALL", meetingType: { $in: ["VENDOR_DISCUSSION", "INTERNAL_HR"] } },
    ];
  } else if (isEmployeeHR && !isSuperAdmin && role !== ROLES.ADMIN) {
    baseFilter.$or = [
      { meetingType: { $in: ["INTERNAL_HR", "EMPLOYEE", "GENERAL"] } },
      { createdBy: req.userId },
      { hrId: req.userId },
      { targetHRs: req.userId },
      { "attendees.id": req.userId },
      { "attendees.email": req.user?.email },
      { targetType: "ALL" },
    ];
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const next7DaysStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [
    todayMeetings,
    upcomingMeetings,
    completedMeetings,
    cancelledMeetings,
    next7DaysMeetings,
  ] = await Promise.all([
    Meeting.find({ ...baseFilter, date: todayStr }).sort({ startTime: 1 }).lean(),
    Meeting.find({
      ...baseFilter,
      date: { $gte: todayStr },
      status: { $in: ["SCHEDULED", "RESCHEDULED"] },
    })
      .sort({ date: 1, startTime: 1 })
      .limit(10)
      .lean(),
    Meeting.countDocuments({ ...baseFilter, status: "COMPLETED" }),
    Meeting.countDocuments({ ...baseFilter, status: "CANCELLED" }),
    Meeting.find({
      ...baseFilter,
      date: { $gte: todayStr, $lte: next7DaysStr },
      status: { $in: ["SCHEDULED", "RESCHEDULED"] },
    })
      .sort({ date: 1, startTime: 1 })
      .lean(),
  ]);

  const totalScheduled = await Meeting.countDocuments({
    ...baseFilter,
    status: { $in: ["SCHEDULED", "RESCHEDULED"] },
  });

  const nextMeeting = upcomingMeetings.length > 0 ? upcomingMeetings[0] : null;

  return res.status(200).json({
    success: true,
    stats: {
      todayMeetingsCount: todayMeetings.length,
      upcomingMeetingsCount: totalScheduled,
      completedMeetingsCount: completedMeetings,
      cancelledMeetingsCount: cancelledMeetings,
      next7DaysMeetingsCount: next7DaysMeetings.length,
      totalScheduledMeetings: totalScheduled,
      nextMeeting,
    },
    todayMeetings,
    upcomingMeetings,
    next7DaysMeetings,
  });
});

export const updateMeeting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const isVendor = req.isVendor || req.userRole === ROLES.VENDOR;

  const meeting = await Meeting.findById(id);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  if (isVendor) {
    const { aliases } = await resolveVendorAliasesForCaller({
      vendorUser: req.user,
      vendorId: req.vendorId,
      userId: req.userId,
    });
    const ownsMeeting =
      (meeting.createdBy && String(meeting.createdBy) === String(req.userId)) ||
      (meeting.vendorId && aliases.has(String(meeting.vendorId))) ||
      (Array.isArray(meeting.targetVendors) && meeting.targetVendors.some((v) => aliases.has(String(v))));
    if (!ownsMeeting) {
      throw new ApiError(403, "You are not authorized to update this meeting.");
    }
  }

  const prevStatus = meeting.status;

  if (updateData.title) meeting.title = updateData.title.trim();
  if (updateData.description !== undefined) meeting.description = updateData.description.trim();
  if (updateData.meetingType && !isVendor) meeting.meetingType = updateData.meetingType;
  if (updateData.date) meeting.date = updateData.date;
  if (updateData.startTime) meeting.startTime = updateData.startTime;
  if (updateData.endTime !== undefined) meeting.endTime = updateData.endTime;
  if (updateData.meetingLink) meeting.meetingLink = updateData.meetingLink.trim();
  if (updateData.platform) meeting.platform = updateData.platform;
  if (updateData.status) meeting.status = updateData.status;
  if (updateData.remarks !== undefined) meeting.remarks = updateData.remarks;
  if (updateData.attendance) meeting.attendance = updateData.attendance;
  if (updateData.outcome) meeting.outcome = updateData.outcome;
  if (updateData.outcomeRemarks !== undefined) meeting.outcomeRemarks = updateData.outcomeRemarks;
  if (Array.isArray(updateData.attendees) && !isVendor) meeting.attendees = updateData.attendees;

  await meeting.save();

  if (meeting.candidateId && (updateData.status || updateData.outcome || updateData.attendance)) {
    await logCandidateMeetingActivity({
      meeting,
      actionType: updateData.outcome ? "MEETING_OUTCOME" : "MEETING_UPDATED",
      previousStatus: prevStatus,
      newStatus: updateData.status || meeting.status,
      remarks: updateData.outcomeRemarks || updateData.remarks || `Meeting updated: Outcome [${meeting.outcome || "N/A"}], Attendance [${meeting.attendance || "N/A"}].`,
      updater: req.user,
    });
  }

  emitMeetingSync(meeting);

  return res.status(200).json({
    success: true,
    message: "Meeting updated successfully",
    meeting,
  });
});

export const rescheduleMeeting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, startTime, endTime, meetingLink, remarks } = req.body;
  const isVendor = req.isVendor || req.userRole === ROLES.VENDOR;

  if (!date || !startTime) {
    throw new ApiError(400, "New date and start time are required to reschedule.");
  }

  const todayStr = new Date().toISOString().split("T")[0];
  if (date < todayStr) {
    throw new ApiError(400, "Rescheduled date cannot be in the past.");
  }

  const meeting = await Meeting.findById(id);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  if (isVendor) {
    const { aliases } = await resolveVendorAliasesForCaller({
      vendorUser: req.user,
      vendorId: req.vendorId,
      userId: req.userId,
    });
    const ownsMeeting =
      (meeting.createdBy && String(meeting.createdBy) === String(req.userId)) ||
      (meeting.vendorId && aliases.has(String(meeting.vendorId))) ||
      (Array.isArray(meeting.targetVendors) && meeting.targetVendors.some((v) => aliases.has(String(v))));
    if (!ownsMeeting) {
      throw new ApiError(403, "You are not authorized to reschedule this meeting.");
    }
  }

  const oldDate = meeting.date;
  const oldTime = meeting.startTime;

  meeting.date = date;
  meeting.startTime = startTime;
  if (endTime) meeting.endTime = endTime;
  if (meetingLink) meeting.meetingLink = meetingLink.trim();
  if (remarks) meeting.remarks = remarks.trim();
  meeting.status = "RESCHEDULED";
  meeting.remindersSent = [];

  await meeting.save();

  if (meeting.candidateId) {
    await logCandidateMeetingActivity({
      meeting,
      actionType: "MEETING_RESCHEDULED",
      previousStatus: "Scheduled",
      newStatus: "Rescheduled",
      remarks: remarks || `Meeting rescheduled from ${oldDate} ${oldTime} to ${date} ${startTime}.`,
      updater: req.user,
    });
  }

  try {
    const actorSource = {
      ...(req.user?.toObject ? req.user.toObject() : req.user || {}),
      role: isVendor ? "VENDOR" : req.userRole || req.user?.role,
    };
    const actorMeta = resolveActorInfo(actorSource);
    const message = `Meeting "${meeting.title}" has been RESCHEDULED to ${meeting.date} at ${meeting.startTime}. Click to join.`;
    if (meeting.meetingType === "EMPLOYEE" || meeting.meetingType === "GENERAL" || (Array.isArray(meeting.targetEmployees) && meeting.targetEmployees.length > 0)) {
      await Notification.create({
        type: "MEETING_RESCHEDULED",
        title: `🔄 Meeting Rescheduled: ${meeting.title}`,
        message,
        targetRole: "EMPLOYEE",
        actorId: actorMeta.actorId,
        actorRole: actorMeta.actorRole,
        moduleScope: "MEETING",
        metadata: {
          meetingId: meeting._id.toString(),
          meetingLink: meeting.meetingLink,
          date: meeting.date,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          link: "/employee/dashboard",
        },
      });
    }
    const targetHRIds = [...new Set([...(meeting.targetHRs || []), ...(meeting.hrId ? [meeting.hrId] : [])])]
      .map((idVal) => String(idVal || "").trim())
      .filter(Boolean);
    const validHrObjectIds = targetHRIds.filter(isHexObjectId);
    const hrDocs = validHrObjectIds.length > 0
      ? await User.find({ _id: { $in: validHrObjectIds } }).select("_id hrType").lean()
      : [];
    const hrTypeMap = new Map(hrDocs.map((h) => [h._id.toString(), h.hrType || "EMPLOYEE_HR"]));
    for (const hId of targetHRIds) {
      const resolvedHrType = hrTypeMap.get(hId) || "VENDOR_HR";
      const hrLink =
        resolvedHrType === "VENDOR_HR"
          ? "/vendor-hr/dashboard?view=meetings"
          : "/hr/meetings";
      await NotificationService.createNotification({
        type: "MEETING_RESCHEDULED",
        title: `🔄 Meeting Rescheduled: ${meeting.title}`,
        message,
        targetRole: resolvedHrType,
        targetRoles: [resolvedHrType],
        targetType: "SPECIFIC",
        targetUserId: hId,
        targetVendorId: meeting.vendorId ? String(meeting.vendorId) : null,
        actorId: actorMeta.actorId,
        actorRole: actorMeta.actorRole,
        moduleScope: "MEETING",
        metadata: {
          meetingId: meeting._id.toString(),
          meetingLink: meeting.meetingLink,
          date: meeting.date,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          link: hrLink,
        },
      });
    }
    const reschedVendors = Array.from(
      new Set([...(meeting.targetVendors || []), ...(meeting.vendorId ? [meeting.vendorId] : [])].map(String).filter(Boolean))
    );
    for (const vRef of reschedVendors) {
      await NotificationService.createNotification({
        type: "MEETING_RESCHEDULED",
        title: `🔄 Meeting Rescheduled: ${meeting.title}`,
        message,
        targetRole: "VENDOR",
        targetRoles: ["VENDOR"],
        targetType: "SPECIFIC",
        targetVendorId: vRef,
        actorId: actorMeta.actorId,
        actorRole: actorMeta.actorRole,
        moduleScope: "MEETING",
        metadata: {
          meetingId: meeting._id.toString(),
          meetingLink: meeting.meetingLink,
          date: meeting.date,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          link: "/vendor/meetings",
        },
      });
    }
    const reschedAdmins = Array.from(new Set((meeting.targetAdmins || []).map(String).filter(Boolean)));
    for (const admId of reschedAdmins) {
      await NotificationService.createNotification({
        type: "MEETING_RESCHEDULED",
        title: `🔄 Meeting Rescheduled: ${meeting.title}`,
        message,
        targetRole: "ADMIN",
        targetRoles: ["ADMIN", "SUPER_ADMIN"],
        targetType: "SPECIFIC",
        targetUserId: admId,
        actorId: actorMeta.actorId,
        actorRole: actorMeta.actorRole,
        moduleScope: "MEETING",
        metadata: {
          meetingId: meeting._id.toString(),
          meetingLink: meeting.meetingLink,
          date: meeting.date,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          link: "/admin/meetings",
        },
      });
    }
    await NotificationService.notifyStaffAction({
      actor: actorSource,
      type: "MEETING_RESCHEDULED",
      title: `🔄 Meeting Rescheduled: ${meeting.title}`,
      message,
      moduleScope: "MEETING",
      metadata: {
        meetingId: meeting._id.toString(),
        date: meeting.date,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        link: "/admin/meetings",
      },
    });
    if (isVendor) {
      await NotificationService.createNotification({
        type: "MEETING_RESCHEDULED",
        title: `🔄 Vendor Meeting Rescheduled: ${meeting.title}`,
        message,
        targetRole: "ADMIN",
        targetRoles: ["SUPER_ADMIN", "ADMIN"],
        targetType: "ALL",
        targetVendorId: meeting.vendorId ? String(meeting.vendorId) : null,
        actorId: actorMeta.actorId,
        actorRole: "VENDOR",
        moduleScope: "MEETING",
        metadata: {
          meetingId: meeting._id.toString(),
          date: meeting.date,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          link: "/admin/meetings",
        },
      });
    }
  } catch (err) {
    console.error("Failed to notify of reschedule:", err.message);
  }

  emitMeetingSync(meeting);

  return res.status(200).json({
    success: true,
    message: "Meeting rescheduled successfully and reminders updated.",
    meeting,
  });
});

export const cancelMeeting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = "" } = req.body;
  const isVendor = req.isVendor || req.userRole === ROLES.VENDOR;

  const meeting = await Meeting.findById(id);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }

  if (isVendor) {
    const { aliases } = await resolveVendorAliasesForCaller({
      vendorUser: req.user,
      vendorId: req.vendorId,
      userId: req.userId,
    });
    const ownsMeeting =
      (meeting.createdBy && String(meeting.createdBy) === String(req.userId)) ||
      (meeting.vendorId && aliases.has(String(meeting.vendorId))) ||
      (Array.isArray(meeting.targetVendors) && meeting.targetVendors.some((v) => aliases.has(String(v))));
    if (!ownsMeeting) {
      throw new ApiError(403, "You are not authorized to cancel this meeting.");
    }
  }

  meeting.status = "CANCELLED";
  meeting.remarks = reason || meeting.remarks || "Meeting cancelled by organizer.";
  await meeting.save();

  if (meeting.candidateId) {
    await logCandidateMeetingActivity({
      meeting,
      actionType: "MEETING_CANCELLED",
      previousStatus: "Scheduled",
      newStatus: "Cancelled",
      remarks: reason || "Meeting was cancelled.",
      updater: req.user,
    });
  }

  try {
    const actorSource = {
      ...(req.user?.toObject ? req.user.toObject() : req.user || {}),
      role: isVendor ? "VENDOR" : req.userRole || req.user?.role,
    };
    const actorMeta = resolveActorInfo(actorSource);
    const cancelMsg = `The meeting scheduled for ${meeting.date} at ${meeting.startTime} has been cancelled. Reason: ${reason || "Cancelled by host."}`;
    if (meeting.meetingType === "EMPLOYEE" || meeting.meetingType === "GENERAL" || (Array.isArray(meeting.targetEmployees) && meeting.targetEmployees.length > 0)) {
      await Notification.create({
        type: "MEETING_CANCELLED",
        title: `❌ Meeting Cancelled: ${meeting.title}`,
        message: cancelMsg,
        targetRole: "EMPLOYEE",
        actorId: actorMeta.actorId,
        actorRole: actorMeta.actorRole,
        moduleScope: "MEETING",
        metadata: { meetingId: meeting._id.toString(), link: "/employee/dashboard" },
      });
    }
    const targetHRIds = [...new Set([...(meeting.targetHRs || []), ...(meeting.hrId ? [meeting.hrId] : [])])]
      .map((idVal) => String(idVal || "").trim())
      .filter(Boolean);
    const validHrObjectIds = targetHRIds.filter(isHexObjectId);
    const hrDocs = validHrObjectIds.length > 0
      ? await User.find({ _id: { $in: validHrObjectIds } }).select("_id hrType").lean()
      : [];
    const hrTypeMap = new Map(hrDocs.map((h) => [h._id.toString(), h.hrType || "EMPLOYEE_HR"]));
    for (const hId of targetHRIds) {
      const resolvedHrType = hrTypeMap.get(hId) || "VENDOR_HR";
      const hrLink =
        resolvedHrType === "VENDOR_HR"
          ? "/vendor-hr/dashboard?view=meetings"
          : "/hr/meetings";
      await NotificationService.createNotification({
        type: "MEETING_CANCELLED",
        title: `❌ Meeting Cancelled: ${meeting.title}`,
        message: cancelMsg,
        targetRole: resolvedHrType,
        targetRoles: [resolvedHrType],
        targetType: "SPECIFIC",
        targetUserId: hId,
        targetVendorId: meeting.vendorId ? String(meeting.vendorId) : null,
        actorId: actorMeta.actorId,
        actorRole: actorMeta.actorRole,
        moduleScope: "MEETING",
        metadata: { meetingId: meeting._id.toString(), link: hrLink },
      });
    }
    const cancelVendors = Array.from(
      new Set([...(meeting.targetVendors || []), ...(meeting.vendorId ? [meeting.vendorId] : [])].map(String).filter(Boolean))
    );
    for (const vRef of cancelVendors) {
      await NotificationService.createNotification({
        type: "MEETING_CANCELLED",
        title: `❌ Meeting Cancelled: ${meeting.title}`,
        message: cancelMsg,
        targetRole: "VENDOR",
        targetRoles: ["VENDOR"],
        targetType: "SPECIFIC",
        targetVendorId: vRef,
        actorId: actorMeta.actorId,
        actorRole: actorMeta.actorRole,
        moduleScope: "MEETING",
        metadata: { meetingId: meeting._id.toString(), link: "/vendor/meetings" },
      });
    }
    const cancelAdmins = Array.from(new Set((meeting.targetAdmins || []).map(String).filter(Boolean)));
    for (const admId of cancelAdmins) {
      await NotificationService.createNotification({
        type: "MEETING_CANCELLED",
        title: `❌ Meeting Cancelled: ${meeting.title}`,
        message: cancelMsg,
        targetRole: "ADMIN",
        targetRoles: ["ADMIN", "SUPER_ADMIN"],
        targetType: "SPECIFIC",
        targetUserId: admId,
        actorId: actorMeta.actorId,
        actorRole: actorMeta.actorRole,
        moduleScope: "MEETING",
        metadata: { meetingId: meeting._id.toString(), link: "/admin/meetings" },
      });
    }
    await NotificationService.notifyStaffAction({
      actor: actorSource,
      type: "MEETING_CANCELLED",
      title: `❌ Meeting Cancelled: ${meeting.title}`,
      message: `Meeting "${meeting.title}" scheduled for ${meeting.date} was cancelled.`,
      moduleScope: "MEETING",
      metadata: { meetingId: meeting._id.toString(), link: "/admin/meetings" },
    });
    if (isVendor) {
      await NotificationService.createNotification({
        type: "MEETING_CANCELLED",
        title: `❌ Vendor Meeting Cancelled: ${meeting.title}`,
        message: `Meeting "${meeting.title}" scheduled for ${meeting.date} was cancelled.`,
        targetRole: "ADMIN",
        targetRoles: ["SUPER_ADMIN", "ADMIN"],
        targetType: "ALL",
        targetVendorId: meeting.vendorId ? String(meeting.vendorId) : null,
        actorId: actorMeta.actorId,
        actorRole: "VENDOR",
        moduleScope: "MEETING",
        metadata: { meetingId: meeting._id.toString(), link: "/admin/meetings" },
      });
    }
  } catch {}

  emitMeetingSync(meeting);

  return res.status(200).json({
    success: true,
    message: "Meeting cancelled successfully.",
    meeting,
  });
});

export const deleteMeeting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const meeting = await Meeting.findByIdAndDelete(id);
  if (!meeting) {
    throw new ApiError(404, "Meeting not found");
  }
  emitMeetingSync(meeting);
  return res.status(200).json({
    success: true,
    message: "Meeting record deleted permanently.",
  });
});

export const getMeetingEmployees = asyncHandler(async (req, res) => {
  if (req.isVendor || req.userRole === ROLES.VENDOR) {
    return res.status(200).json({ success: true, employees: [] });
  }
  const { search = "" } = req.query;
  const filter = { status: { $ne: "inactive" } };
  if (search) {
    const q = escapeRegex(String(search).trim());
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { employeeId: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { designation: { $regex: q, $options: "i" } },
      ];
    }
  }
  const employees = await Employee.find(filter)
    .select("_id employeeId name email designation department")
    .limit(50)
    .lean();

  return res.status(200).json({
    success: true,
    employees: employees.map((e) => ({
      id: e._id.toString(),
      _id: e._id.toString(),
      name: e.name,
      employeeId: e.employeeId,
      email: e.email,
      designation: e.designation || "Employee",
      department: e.department || "",
    })),
  });
});

export const getMeetingVendors = asyncHandler(async (req, res) => {
  if (req.isVendor || req.userRole === ROLES.VENDOR) {
    return res.status(200).json({ success: true, vendors: [] });
  }
  const { search = "" } = req.query;
  const role = req.userRole || req.user?.role || "";
  const isSuperAdmin = req.isSuperAdmin || role === ROLES.SUPER_ADMIN;
  const hrType = req.hrType || req.user?.hrType || "";
  const isRestrictedVendorHR =
    role === ROLES.HR && hrType === "VENDOR_HR" && !isSuperAdmin && role !== ROLES.ADMIN;

  const filter = { status: { $ne: "Rejected" } };
  if (isRestrictedVendorHR) {
    const userDoc = req.userId
      ? await User.findById(req.userId).select("assignedVendors").lean()
      : null;
    const assigned = Array.from(
      new Set([
        ...(Array.isArray(req.assignedVendors) ? req.assignedVendors : []),
        ...(Array.isArray(userDoc?.assignedVendors) ? userDoc.assignedVendors : []),
      ].map((v) => String(v || "").trim()).filter(Boolean))
    );
    if (assigned.length === 0) {
      return res.status(200).json({ success: true, vendors: [] });
    }
    const hexIds = assigned.filter(isHexObjectId);
    filter.$and = [
      {
        $or: [
          { vendorId: { $in: assigned } },
          ...(hexIds.length > 0 ? [{ _id: { $in: hexIds } }] : []),
        ],
      },
    ];
  }
  if (search) {
    const q = escapeRegex(String(search).trim());
    if (q) {
      const searchOr = [
        { companyName: { $regex: q, $options: "i" } },
        { vendorId: { $regex: q, $options: "i" } },
        { contactPerson: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
      if (filter.$and) {
        filter.$and.push({ $or: searchOr });
      } else {
        filter.$or = searchOr;
      }
    }
  }
  const vendors = await Vendor.find(filter)
    .select("_id vendorId companyName contactPerson email phone mobile status")
    .limit(50)
    .lean();

  return res.status(200).json({
    success: true,
    vendors: vendors.map((v) => ({
      id: v.vendorId || v._id.toString(),
      _id: v._id.toString(),
      vendorId: v.vendorId,
      companyName: v.companyName,
      name: v.companyName,
      contactPerson: v.contactPerson || v.companyName,
      email: v.email,
      phone: v.phone || v.mobile || "",
      status: v.status || "Active",
    })),
  });
});

export const getMeetingAdmins = asyncHandler(async (req, res) => {
  if (req.isVendor || req.userRole === ROLES.VENDOR) {
    return res.status(200).json({ success: true, admins: [] });
  }
  const { search = "" } = req.query;
  const userFilter = {
    role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
    isActive: { $ne: false },
  };
  const adminFilter = {};
  if (search) {
    const q = escapeRegex(String(search).trim());
    if (q) {
      userFilter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { role: { $regex: q, $options: "i" } },
      ];
      adminFilter.$or = [{ email: { $regex: q, $options: "i" } }];
    }
  }

  const [staffUsers, legacyAdmins] = await Promise.all([
    User.find(userFilter).select("_id name email role department phone").limit(50).lean(),
    Admin.find(adminFilter).select("_id email").limit(20).lean(),
  ]);

  const mergedByEmail = new Map();
  (staffUsers || []).forEach((u) => {
    const emailKey = String(u.email || u._id.toString()).toLowerCase().trim();
    const roleVal = u.role === ROLES.SUPER_ADMIN ? "SUPER_ADMIN" : "ADMIN";
    mergedByEmail.set(emailKey, {
      id: u._id.toString(),
      _id: u._id.toString(),
      name: u.name || (u.email ? u.email.split("@")[0] : "Administrator"),
      email: u.email || "",
      role: roleVal,
      roleLabel: roleVal === "SUPER_ADMIN" ? "Super Admin" : "Admin",
      department: u.department || "Administration",
      phone: u.phone || "",
    });
  });

  (legacyAdmins || []).forEach((a) => {
    const emailKey = String(a.email || a._id.toString()).toLowerCase().trim();
    if (!mergedByEmail.has(emailKey)) {
      mergedByEmail.set(emailKey, {
        id: a._id.toString(),
        _id: a._id.toString(),
        name: a.email ? a.email.split("@")[0] : "Administrator",
        email: a.email || "",
        role: "ADMIN",
        roleLabel: "Admin",
        department: "Administration",
        phone: "",
      });
    }
  });

  const admins = Array.from(mergedByEmail.values()).sort((x, y) => {
    if (x.role === "SUPER_ADMIN" && y.role !== "SUPER_ADMIN") return -1;
    if (x.role !== "SUPER_ADMIN" && y.role === "SUPER_ADMIN") return 1;
    return String(x.name || "").localeCompare(String(y.name || ""));
  });

  return res.status(200).json({
    success: true,
    admins,
  });
});

export const getMeetingHRs = asyncHandler(async (req, res) => {
  const { search = "", hrType = "" } = req.query;

  if (req.isVendor || req.userRole === ROLES.VENDOR) {
    const { eligibleHRs } = await resolveEligibleVendorHRsForVendor({
      vendorUser: req.user,
      vendorId: req.vendorId,
      userId: req.userId,
      search,
    });
    return res.status(200).json({
      success: true,
      hrs: eligibleHRs,
    });
  }

  const filter = { role: "HR", isActive: { $ne: false } };
  if (hrType) {
    filter.hrType = hrType;
  }
  if (search) {
    const q = escapeRegex(String(search).trim());
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { department: { $regex: q, $options: "i" } },
      ];
    }
  }
  const hrs = await User.find(filter)
    .select("_id name email role hrType assignedVendors department phone")
    .limit(50)
    .lean();

  return res.status(200).json({
    success: true,
    hrs: hrs.map((h) => ({
      id: h._id.toString(),
      _id: h._id.toString(),
      name: h.name,
      email: h.email,
      role: h.role,
      hrType: h.hrType || "EMPLOYEE_HR",
      assignedVendors: h.assignedVendors || [],
      department: h.department || "",
      phone: h.phone || "",
    })),
  });
});

export const getMeetingCandidates = asyncHandler(async (req, res) => {
  if (req.isVendor || req.userRole === ROLES.VENDOR) {
    return res.status(200).json({ success: true, candidates: [] });
  }
  const { search = "", vendorId = "" } = req.query;
  const filter = {};
  if (vendorId) {
    filter.vendorId = vendorId;
  }
  if (search) {
    const q = escapeRegex(String(search).trim());
    if (q) {
      filter.$or = [
        { candidateName: { $regex: q, $options: "i" } },
        { candidateId: { $regex: q, $options: "i" } },
        { candidateEmail: { $regex: q, $options: "i" } },
        { position: { $regex: q, $options: "i" } },
        { projectName: { $regex: q, $options: "i" } },
      ];
    }
  }
  const candidates = await CandidateApplication.find(filter)
    .select(
      "_id applicationId candidateId candidateName candidateEmail candidatePhone position projectName vendorId vendorName currentStage"
    )
    .limit(50)
    .lean();

  return res.status(200).json({
    success: true,
    candidates: candidates.map((c) => ({
      id: c.candidateId || c._id.toString(),
      _id: c._id.toString(),
      applicationId: c.applicationId,
      candidateId: c.candidateId,
      name: c.candidateName,
      candidateName: c.candidateName,
      email: c.candidateEmail,
      candidateEmail: c.candidateEmail,
      phone: c.candidatePhone,
      position: c.position || "Candidate",
      projectName: c.projectName || "",
      vendorId: c.vendorId || "",
      vendorName: c.vendorName || "",
      stage: c.currentStage || "Applied",
    })),
  });
});

export const getEmployeeMeetings = asyncHandler(async (req, res) => {
  const employeeId = req.employee?._id || req.user?._id;
  const employeeEmail = req.employee?.email || req.user?.email;
  const employeeName = req.employee?.name || req.user?.name;

  const query = {
    status: { $ne: "CANCELLED" },
  };

  const orConditions = [{ targetType: "ALL" }];
  if (employeeId) {
    orConditions.push({ targetEmployees: employeeId });
    orConditions.push({ targetEmployees: employeeId.toString() });
    orConditions.push({ "attendees.id": employeeId.toString() });
    orConditions.push({ "attendees.userId": employeeId.toString() });
  }
  if (employeeEmail) {
    orConditions.push({ "attendees.email": employeeEmail.toLowerCase() });
  }
  if (employeeName) {
    orConditions.push({ "attendees.name": { $regex: new RegExp(`^${escapeRegex(employeeName)}$`, "i") } });
  }
  query.$or = orConditions;

  if (req.query.upcoming === "true") {
    const todayStr = new Date().toISOString().split("T")[0];
    query.date = { $gte: todayStr };
    query.status = { $in: ["SCHEDULED", "RESCHEDULED"] };
  } else if (req.query.status && req.query.status !== "ALL") {
    query.status = req.query.status;
  }

  const meetings = await Meeting.find(query).sort({ date: 1, startTime: 1 });

  return res.status(200).json({
    success: true,
    count: meetings.length,
    meetings,
  });
});

export const sendBroadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, targetRole = "ALL" } = req.body;
  if (!title || !message) {
    throw new ApiError(400, "Title and Message are required");
  }

  const notification = await Notification.create({
    type: "SYSTEM_ALERT",
    title,
    message,
    targetRole,
    targetType: "ALL",
  });

  emitRealtimeEvent({
    events: ["immigo:notification-update", "immigo:dashboard-update", "immigo:admin-notification", "immigo:vendor-notification"],
    roles: ["SUPER_ADMIN", "ADMIN", "VENDOR_HR", "VENDOR", "HR", "EMPLOYEE"],
  });

  return res.status(201).json({
    success: true,
    message: "Broadcast notification dispatched",
    notification,
  });
});
