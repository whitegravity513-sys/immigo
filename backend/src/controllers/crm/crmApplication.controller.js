import CrmCandidateApplication from "../../models/CrmCandidateApplication.js";
import CrmOverseasClient from "../../models/CrmOverseasClient.js";
import CrmNotification from "../../models/CrmNotification.js";
import Notification from "../../models/Notification.js";
import ActivityService from "../../services/activity.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getApplications = asyncHandler(async (req, res) => {
  const { vendorId, projectId } = req.query;
  const filter = {};
  if (vendorId) filter.vendorId = String(vendorId);
  if (projectId) filter.projectId = String(projectId);

  const applications = await CrmCandidateApplication.find(filter).sort({ createdAt: -1 }).lean();
  const formatted = (applications || []).map((a) => ({
    ...a,
    id: a.applicationId || a._id.toString(),
  }));

  return res.status(200).json({ success: true, applications: formatted });
});

export const submitApplication = asyncHandler(async (req, res) => {
  const appData = req.body;
  const appId = appData.id || appData.applicationId || `app-${Date.now().toString().slice(-6)}`;

  const created = await CrmCandidateApplication.create({
    ...appData,
    applicationId: appId,
    status: appData.status || "Submitted",
  });

  try {
    const adminMsg = `Vendor ${appData.vendorName || appData.vendorId || "Partner"} submitted ${appData.candidateName} for "${appData.projectName}" (${appData.position || "Role"}).`;

    await CrmNotification.create({
      notificationId: `notif-adm-${Date.now()}`,
      recipientRole: "ADMIN",
      title: "New Candidate Assigned to Project",
      message: adminMsg,
      type: "info",
      link: "/admin/vendor-candidates",
    });

    await Notification.create({
      type: "DOCUMENT_UPLOAD",
      title: "New Candidate Assigned to Project",
      message: adminMsg,
      targetRole: "ADMIN",
      targetType: "ALL",
    });
  } catch {}

  return res.status(201).json({
    success: true,
    application: { ...created.toObject(), id: created.applicationId || created._id.toString() },
  });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const queryConditions = [
    { applicationId: id },
    { id: id },
  ];
  if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    queryConditions.push({ _id: id });
  }

  let app = await CrmCandidateApplication.findOne({ $or: queryConditions });

  if (!app && updateData.candidateId && updateData.projectId) {
    app = await CrmCandidateApplication.findOne({
      candidateId: updateData.candidateId,
      projectId: updateData.projectId,
    });
  }

  if (!app) {
    app = await CrmCandidateApplication.create({
      ...updateData,
      applicationId: id,
      status: updateData.status || "Submitted",
    });
  } else {
    Object.assign(app, updateData);
    await app.save();
  }

  if (updateData.status) {
    try {
      const statusTitle =
        updateData.status === "Selected"
          ? "Candidate Selected! 🎉"
          : updateData.status === "Rejected"
          ? "Candidate Application Rejected"
          : updateData.status === "Interview" || updateData.status === "Interview Scheduled"
          ? "Interview Scheduled 🎥"
          : updateData.status === "On Hold"
          ? "Candidate Put On Hold ⏸️"
          : `Candidate Status Updated: ${updateData.status}`;

      const statusMsg =
        updateData.status === "Selected"
          ? `${app.candidateName} has been selected for ${app.projectName} (${app.position || "Role"}). Processing timeline initiated.`
          : updateData.status === "Rejected"
          ? `${app.candidateName} was not selected for ${app.projectName}. Reason: ${app.rejectionReason || "Criteria not met"}. Candidate returned to pool for reuse.`
          : updateData.status === "Interview" || updateData.status === "Interview Scheduled"
          ? `Interview scheduled for ${app.candidateName} on ${app.projectName}. Date: ${app.interviewDetails?.dateTime || "TBD"}.`
          : updateData.status === "On Hold"
          ? `${app.candidateName} was put On Hold for ${app.projectName}. Candidate is reusable for other projects.`
          : `Candidate ${app.candidateName} status changed to "${updateData.status}" on project ${app.projectName}.`;

      await CrmNotification.create({
        notificationId: `notif-ven-${Date.now()}`,
        recipientRole: "VENDOR",
        vendorId: app.vendorId,
        title: statusTitle,
        message: statusMsg,
        type: updateData.status === "Selected" ? "success" : updateData.status === "Rejected" ? "warning" : "info",
        link: updateData.status === "Selected" ? "/vendor/selected" : updateData.status === "Rejected" ? "/vendor/rejected" : "/vendor/applications",
      });

      if (updateData.status === "Selected") {
        try {
          const clientId = app.clientId;
          let clientDoc = null;
          if (clientId) {
            clientDoc = await CrmOverseasClient.findOne({
              $or: [{ clientId: String(clientId) }, { _id: clientId.match(/^[0-9a-fA-F]{24}$/) ? clientId : null }],
            });
          }
          if (!clientDoc && app.projectId) {
            clientDoc = await CrmOverseasClient.findOne({ "projects.id": app.projectId });
          }

          if (clientDoc && Array.isArray(clientDoc.paymentMilestones)) {
            const msIdx = clientDoc.paymentMilestones.findIndex(
              (m) =>
                m.status === "Pending" &&
                (m.condition?.toLowerCase().includes("select") ||
                  m.name?.toLowerCase().includes("select") ||
                  m.condition?.toLowerCase().includes("candidate"))
            );

            if (msIdx !== -1) {
              const ms = clientDoc.paymentMilestones[msIdx];
              ms.status = "Due";
              ms.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              ms.relatedCandidateId = app.candidateId || "";
              ms.relatedCandidateName = app.candidateName || "";
              ms.relatedProjectId = app.projectId || "";
              ms.relatedProjectName = app.projectName || "";
              clientDoc.paymentMilestones[msIdx] = ms;
              clientDoc.markModified("paymentMilestones");
              await clientDoc.save();

              await ActivityService.log({
                userType: "SYSTEM",
                action: "CLIENT_MILESTONE_DUE",
                title: `Client Milestone Due: ${ms.name}`,
                description: `Milestone "${ms.name}" (₹${Number(ms.amount).toLocaleString()}) became DUE for ${clientDoc.companyName} upon selection of candidate ${app.candidateName}.`,
                entityType: "Client",
                entityId: clientDoc.clientId || clientDoc._id.toString(),
                entityName: clientDoc.companyName,
                status: "Due",
                visibility: "ADMIN",
                metadata: { candidateName: app.candidateName, milestoneId: ms.id },
              });
            }
          }

          await ActivityService.log({
            userType: "ADMIN",
            action: "CANDIDATE_SELECTED",
            title: `Candidate Selected: ${app.candidateName}`,
            description: `${app.candidateName} selected for ${app.projectName} (${app.position || "Role"}).`,
            entityType: "Candidate",
            entityId: app.candidateId || app._id.toString(),
            entityName: app.candidateName,
            status: "Selected",
            visibility: "ADMIN",
          });
        } catch (selErr) {
          console.error("Failed to trigger milestone on candidate selection:", selErr.message);
        }
      }
    } catch (notifErr) {
      console.error("Failed to create vendor notification:", notifErr.message);
    }
  }

  return res.status(200).json({
    success: true,
    application: { ...app.toObject(), id: app.applicationId || app._id.toString() },
  });
});
