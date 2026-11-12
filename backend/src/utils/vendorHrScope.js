import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import ProjectAssignment from "../models/ProjectAssignment.js";

const isValidObjectId = (val) =>
  typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val.trim());

export async function resolveVendorHrScope(user) {
  const roleUpper = String(user?.role || "").toUpperCase();
  const hrTypeUpper = String(user?.hrType || "").toUpperCase();
  const isVendorHR =
    roleUpper === "VENDOR_HR" || (roleUpper === "HR" && hrTypeUpper === "VENDOR_HR");
  const userIdStr = user?._id?.toString() || user?.id?.toString() || "";

  if (!isVendorHR) {
    return {
      isVendorHR: false,
      userIdStr,
      assignedVendorIds: [],
      expandedVendorIds: [],
      assignedProjectIds: [],
    };
  }

  let baseVendors = Array.isArray(user?.assignedVendors)
    ? user.assignedVendors.map(String).filter(Boolean)
    : [];

  // Query DB for fresh assignedVendors so admin updates apply without requiring a token refresh.
  if (userIdStr && isValidObjectId(userIdStr)) {
    try {
      const freshUser = await User.findById(userIdStr)
        .select("assignedVendors hrType role")
        .lean();
      if (freshUser && Array.isArray(freshUser.assignedVendors)) {
        baseVendors = freshUser.assignedVendors.map(String).filter(Boolean);
      }
    } catch {}
  }

  const hexIds = baseVendors.filter(isValidObjectId);
  const vendorDocs =
    baseVendors.length > 0
      ? await Vendor.find({
          $or: [
            { vendorId: { $in: baseVendors } },
            ...(hexIds.length > 0 ? [{ _id: { $in: hexIds } }] : []),
          ],
        })
          .select("_id vendorId")
          .lean()
      : [];

  const expandedVendorIds = Array.from(
    new Set([
      ...baseVendors,
      ...vendorDocs.flatMap((v) => [v.vendorId, v._id?.toString()].filter(Boolean)),
    ])
  );

  const [activeAssignments, hrHistory] = await Promise.all([
    expandedVendorIds.length > 0 || userIdStr
      ? ProjectAssignment.find({
          $or: [
            ...(expandedVendorIds.length > 0
              ? [{ vendorId: { $in: expandedVendorIds } }]
              : []),
            ...(userIdStr ? [{ userId: userIdStr }] : []),
          ],
          status: "Active",
        }).lean()
      : Promise.resolve([]),
    userIdStr
      ? ProjectAssignment.find({
          assignmentType: "VENDOR_HR_PROJECT",
          userId: userIdStr,
          status: { $in: ["Active", "Removed"] },
        }).lean()
      : Promise.resolve([]),
  ]);

  const activeHRProjectIds = new Set(
    hrHistory.filter((a) => a.status === "Active").map((a) => String(a.projectId))
  );
  const removedHRProjectIds = new Set(
    hrHistory
      .filter((a) => a.status === "Removed" && !activeHRProjectIds.has(String(a.projectId)))
      .map((a) => String(a.projectId))
  );

  const assignedProjectIds = Array.from(
    new Set([
      ...Array.from(activeHRProjectIds),
      ...activeAssignments
        .filter((a) => !removedHRProjectIds.has(String(a.projectId)))
        .map((a) => String(a.projectId))
        .filter(Boolean),
    ])
  );

  return {
    isVendorHR: true,
    userIdStr,
    assignedVendorIds: baseVendors,
    expandedVendorIds,
    assignedProjectIds,
  };
}

export default {
  resolveVendorHrScope,
};

