import ActivityLog from "../models/ActivityLog.js";

export const recordCandidateActivity = async ({
  candidateId,
  candidateName = "",
  updatedByUserId = "",
  updatedByName = "System",
  updatedByRole = "ADMIN",
  vendorId = "",
  vendorName = "",
  actionType = "STATUS_UPDATE",
  previousStatus = "",
  newStatus = "",
  previousStage = "",
  newStage = "",
  previousMilestone = "",
  newMilestone = "",
  remarks = "",
  meetingRef = "",
  metadata = {},
}) => {
  if (!candidateId) return null;

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

    let displayRole = updatedByRole;
    if (updatedByRole === "HR" || updatedByRole === "VENDOR_HR") {
      displayRole = "Vendor Management HR";
    } else if (updatedByRole === "EMPLOYEE_HR") {
      displayRole = "Employee Management HR";
    } else if (updatedByRole === "VENDOR") {
      displayRole = "Vendor";
    } else if (updatedByRole === "SUPER_ADMIN") {
      displayRole = "Super Admin";
    } else if (updatedByRole === "ADMIN") {
      displayRole = "Admin";
    }

    const doc = await ActivityLog.create({
      userType: updatedByRole === "VENDOR" ? "VENDOR" : "ADMIN",
      userId: String(updatedByUserId || ""),
      userName: updatedByName || "System",
      action: actionType,
      title: `${actionType.replace(/_/g, " ")}: ${candidateName || candidateId}`,
      description:
        remarks ||
        `Candidate ${candidateName || candidateId} updated by ${updatedByName} (${displayRole}).`,
      entityType: "Candidate",
      entityId: String(candidateId || ""),
      entityName: candidateName || "Candidate",
      status: newStatus || "Updated",
      visibility: "ALL",

      candidateId: String(candidateId || ""),
      candidateName: candidateName || "",
      updatedByUserId: String(updatedByUserId || ""),
      updatedByName: updatedByName || "System",
      updatedByRole: displayRole,
      vendorId: String(vendorId || ""),
      vendorName: vendorName || "",
      actionType,
      previousStatus: previousStatus || "",
      newStatus: newStatus || "",
      previousStage: previousStage || "",
      newStage: newStage || "",
      previousMilestone: previousMilestone || "",
      newMilestone: newMilestone || "",
      remarks: remarks || "",
      date: dateStr,
      time: timeStr,
      meetingRef: String(meetingRef || ""),
      metadata,
    });

    return doc;
  } catch (err) {
    console.error("Failed to record candidate activity:", err.message);
    return null;
  }
};

export default { recordCandidateActivity };

