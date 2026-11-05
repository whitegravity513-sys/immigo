import Candidate from "../models/Candidate.js";
import CandidateApplication from "../models/CandidateApplication.js";
import Job from "../models/Job.js";
import Project from "../models/Project.js";
import Interview from "../models/Interview.js";
import Offer from "../models/Offer.js";
import ActivityLog from "../models/ActivityLog.js";
import Notification from "../models/Notification.js";
import { ApiError } from "../utils/apiError.js";

export class RecruitmentService {
  static async submitCandidate({
    fullName,
    email,
    phone,
    projectId,
    jobId,
    vendorId,
    vendorName,
    resumeUrl = "",
    experience = "",
    skills = [],
    location = "",
    notes = "",
    actorUser,
  }) {
    if (!fullName || !email || !projectId) {
      throw new ApiError(400, "Candidate name, email, and project ID are required.");
    }

    const cleanEmail = email.trim().toLowerCase();

    let candidate = await Candidate.findOne({ email: cleanEmail });
    if (!candidate) {
      const candidateId = `CAND-${Date.now().toString().slice(-6)}`;
      candidate = await Candidate.create({
        candidateId,
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: phone || "",
        password: "TempPassword123!",
        accountStatus: "Approved",
        documentStatus: "Verified",
        jobApplicationAccess: "Unlocked",
      });
    }

    const project = await Project.findOne({
      $or: [{ projectId }, { _id: projectId.match(/^[0-9a-fA-F]{24}$/) ? projectId : null }],
    });
    if (!project) throw new ApiError(404, "Project not found.");

    let job = null;
    if (jobId) {
      job = await Job.findOne({
        $or: [{ jobId }, { _id: jobId.match(/^[0-9a-fA-F]{24}$/) ? jobId : null }],
      });
    }

    const isVendorHR = actorUser?.hrType === "VENDOR_HR";
    const isEmployeeHR = actorUser?.hrType === "EMPLOYEE_HR";

    if (isVendorHR) {
      const allowedVendors = Array.isArray(actorUser?.assignedVendors)
        ? actorUser.assignedVendors
        : [];
      if (vendorId && !allowedVendors.includes(vendorId)) {
        throw new ApiError(403, "You can only submit candidates for your assigned vendor.");
      }
    }

    const effectiveVendorId = vendorId || (isVendorHR ? actorUser?.assignedVendors?.[0] : "");
    const effectiveVendorName = vendorName || (isVendorHR ? actorUser?.name : "");

    const applicationId = `APP-${Date.now().toString().slice(-6)}`;

    const application = await CandidateApplication.create({
      applicationId,
      candidateId: candidate.candidateId,
      candidateObjectId: candidate._id,
      candidateName: candidate.fullName,
      candidateEmail: candidate.email,
      candidatePhone: candidate.phone,
      projectId: project.projectId || project._id.toString(),
      projectName: project.title,
      clientId: project.clientId?.toString() || "",
      jobId: job ? job.jobId : "",
      jobTitle: job ? job.title : project.title,
      vendorId: effectiveVendorId,
      vendorName: effectiveVendorName,
      vendorHrId: isVendorHR ? actorUser?._id?.toString() : "",
      vendorHrName: isVendorHR ? actorUser?.name : "",
      employeeHrId: isEmployeeHR ? actorUser?._id?.toString() : "",
      employeeHrName: isEmployeeHR ? actorUser?.name : "",
      recruitmentStage: "Applied",
      status: "Applied",
      position: job ? job.title : "Candidate",
      appliedAt: new Date(),
    });

    await ActivityLog.create({
      userType: actorUser?.role || "HR",
      userId: actorUser?._id?.toString() || actorUser?.id || "System",
      userName: actorUser?.name || "HR Manager",
      action: "CANDIDATE_SUBMITTED",
      title: `Submitted Candidate [${candidate.fullName}]`,
      description: `Submitted for job ${job ? job.title : project.title} under project ${project.title}.`,
      entityType: "Candidate",
      entityId: candidate.candidateId,
      entityName: candidate.fullName,
      candidateId: candidate.candidateId,
      candidateName: candidate.fullName,
      vendorId: effectiveVendorId,
      vendorName: effectiveVendorName,
      status: "Applied",
      newStatus: "Applied",
      visibility: "ALL",
      remarks: notes || `Submitted by ${actorUser?.name}`,
    });

    return { candidate, application };
  }

  static async updateCandidateStage({
    applicationId,
    newStage,
    newStatus,
    remarks = "",
    offerDetails,
    visaDetails,
    processMilestones,
    newDocument,
    documents,
    actorUser,
  }) {
    if (!applicationId || !newStage) {
      throw new ApiError(400, "Application ID and new recruitment stage are required.");
    }

    const application = await CandidateApplication.findOne({
      $or: [
        { applicationId },
        { _id: applicationId.match(/^[0-9a-fA-F]{24}$/) ? applicationId : null },
      ],
    });

    if (!application) {
      throw new ApiError(404, "Candidate application not found.");
    }

    const isVendorHR = actorUser?.hrType === "VENDOR_HR";
    if (isVendorHR) {
      const allowed = Array.isArray(actorUser?.assignedVendors) ? actorUser.assignedVendors : [];
      if (!allowed.includes(application.vendorId)) {
        throw new ApiError(403, "You can only update candidates belonging to your assigned vendor.");
      }
    }

    const previousStage = application.recruitmentStage || application.status || "Applied";
    const previousStatus = application.status || "Applied";

    application.recruitmentStage = newStage;
    application.status = newStatus || (["Rejected", "On Hold", "Withdrawn"].includes(newStage) ? newStage : "In Progress");

    if (offerDetails) {
      application.offerDetails = { ...(application.offerDetails?.toObject?.() || application.offerDetails || {}), ...offerDetails };
    }
    if (visaDetails) {
      application.visaDetails = { ...(application.visaDetails?.toObject?.() || application.visaDetails || {}), ...visaDetails };
    }
    if (processMilestones) {
      application.processMilestones = processMilestones;
    }

    if (newDocument && (newDocument.fileUrl || newDocument.name || newDocument.fileName)) {
      application.documents = application.documents || [];
      const docEntry = {
        id: newDocument.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        docType: newDocument.docType || "Compliance Document",
        name: newDocument.name || newDocument.fileName || "Candidate Document",
        fileName: newDocument.fileName || newDocument.name || "document.pdf",
        fileUrl: newDocument.fileUrl || "",
        fileSize: newDocument.fileSize || 0,
        status: "Verified",
        uploadedAt: new Date(),
        uploadedBy: actorUser?.name || "HR Staff",
        uploadedByRole: actorUser?.role || "HR",
        visibleToVendor: true,
      };
      application.documents.push(docEntry);

      try {
        const candidateDoc = await Candidate.findOne({
          $or: [
            ...(application.candidateObjectId ? [{ _id: application.candidateObjectId }] : []),
            ...(application.candidateId ? [{ candidateId: application.candidateId }] : []),
          ],
        });
        if (candidateDoc) {
          candidateDoc.documents = candidateDoc.documents || [];
          candidateDoc.documents.push({
            id: docEntry.id,
            docType: docEntry.docType,
            name: docEntry.name,
            fileName: docEntry.fileName,
            fileUrl: docEntry.fileUrl,
            fileSize: docEntry.fileSize,
            status: "Verified",
            uploadedAt: new Date(),
            verifiedAt: new Date(),
            verifiedBy: actorUser?.name || "HR Staff",
          });
          await candidateDoc.save();
        }
      } catch (candErr) {
        console.warn("Could not sync uploaded document to Candidate record:", candErr.message);
      }
    } else if (Array.isArray(documents) && documents.length > 0) {
      application.documents = documents;
    }

    application.statusHistory = application.statusHistory || [];
    application.statusHistory.push({
      status: `${newStage} (${application.status})`,
      updatedBy: actorUser?.name || "HR Staff",
      note: remarks || `Recruitment stage updated to ${newStage}`,
      date: new Date(),
    });

    await application.save();

    await ActivityLog.create({
      userType: actorUser?.role || "HR",
      userId: actorUser?._id?.toString() || actorUser?.id || "System",
      userName: actorUser?.name || "HR Staff",
      action: "RECRUITMENT_STAGE_UPDATED",
      title: `Stage Updated: [${application.candidateName}] -> ${newStage}`,
      description: `Candidate application ${application.applicationId} transitioned from [${previousStage}] to [${newStage}].`,
      entityType: "Candidate",
      entityId: application.candidateId,
      entityName: application.candidateName,
      candidateId: application.candidateId,
      candidateName: application.candidateName,
      vendorId: application.vendorId,
      vendorName: application.vendorName,
      previousStatus: previousStage,
      newStatus: newStage,
      status: application.status,
      visibility: "ALL",
      remarks: remarks || `Updated by ${actorUser?.name} (${actorUser?.role || "HR"})`,
    });

    return application;
  }

  static async scheduleInterview({
    applicationId,
    round = "L1 Interview",
    scheduledDate,
    startTime,
    endTime = "",
    interviewMode = "Google Meet",
    interviewLink = "",
    interviewerName = "",
    interviewerEmail = "",
    actorUser,
  }) {
    if (!applicationId || !scheduledDate || !startTime) {
      throw new ApiError(400, "Application ID, date, and start time are required.");
    }

    const application = await CandidateApplication.findOne({
      $or: [
        { applicationId },
        { _id: applicationId.match(/^[0-9a-fA-F]{24}$/) ? applicationId : null },
      ],
    });

    if (!application) throw new ApiError(404, "Candidate application not found.");

    const interviewId = `INT-${Date.now().toString().slice(-6)}`;

    const interview = await Interview.create({
      interviewId,
      candidateId: application.candidateId,
      candidateRef: application.candidateObjectId,
      candidateName: application.candidateName,
      candidateEmail: application.candidateEmail,
      applicationId: application.applicationId,
      applicationRef: application._id,
      projectId: application.projectId,
      projectName: application.projectName,
      jobId: application.jobId || "",
      jobTitle: application.jobTitle || application.position,
      vendorId: application.vendorId,
      vendorName: application.vendorName,
      round,
      scheduledDate,
      startTime,
      endTime,
      interviewMode,
      interviewLink,
      interviewerName: interviewerName || actorUser?.name || "Interviewer",
      interviewerEmail,
      status: "Scheduled",
      scheduledBy: actorUser?._id?.toString() || actorUser?.id || "System",
      scheduledByName: actorUser?.name || "HR Staff",
      scheduledByRole: actorUser?.role || "HR",
    });

    application.recruitmentStage = "Interview Scheduled";
    application.status = "Interview Scheduled";
    application.interview = {
      scheduledDate,
      scheduledTime: startTime,
      mode: interviewMode,
      locationOrLink: interviewLink,
      interviewerName: interviewerName || actorUser?.name || "Interviewer",
      remarks: `Round: ${round}`,
      updatedAt: new Date(),
    };
    await application.save();

    await ActivityLog.create({
      userType: actorUser?.role || "HR",
      userId: actorUser?._id?.toString() || actorUser?.id || "System",
      userName: actorUser?.name || "HR Staff",
      action: "INTERVIEW_SCHEDULED",
      title: `Scheduled ${round} for [${application.candidateName}]`,
      description: `Interview on ${scheduledDate} at ${startTime} via ${interviewMode}.`,
      entityType: "Candidate",
      entityId: application.candidateId,
      entityName: application.candidateName,
      candidateId: application.candidateId,
      candidateName: application.candidateName,
      vendorId: application.vendorId,
      vendorName: application.vendorName,
      status: "Interview Scheduled",
      visibility: "ALL",
      remarks: `Link: ${interviewLink || "N/A"}`,
    });

    return interview;
  }

  static async recordInterviewFeedback({
    interviewId,
    rating,
    feedback,
    recommendation,
    actorUser,
  }) {
    const interview = await Interview.findOne({
      $or: [
        { interviewId },
        { _id: interviewId.match(/^[0-9a-fA-F]{24}$/) ? interviewId : null },
      ],
    });

    if (!interview) throw new ApiError(404, "Interview record not found.");

    interview.rating = rating || interview.rating;
    interview.feedback = feedback || interview.feedback;
    interview.recommendation = recommendation || interview.recommendation;
    interview.status = "Completed";
    await interview.save();

    const application = await CandidateApplication.findOne({
      applicationId: interview.applicationId,
    });
    if (application) {
      if (recommendation === "Selected") {
        application.recruitmentStage = "Selected";
        application.status = "Selected";
      } else if (recommendation === "Rejected") {
        application.recruitmentStage = "Rejected";
        application.status = "Rejected";
        application.rejectionReason = feedback || "Did not clear technical evaluation";
      } else if (recommendation === "Hold" || recommendation === "On Hold") {
        application.recruitmentStage = "On Hold";
        application.status = "On Hold";
      } else {
        application.recruitmentStage = "Interview Completed";
        application.status = "In Progress";
      }
      await application.save();
    }

    await ActivityLog.create({
      userType: actorUser?.role || "HR",
      userId: actorUser?._id?.toString() || actorUser?.id || "System",
      userName: actorUser?.name || "Interviewer",
      action: "INTERVIEW_FEEDBACK_UPDATED",
      title: `Interview Feedback: [${interview.candidateName}] -> ${recommendation}`,
      description: `Feedback recorded for round ${interview.round}. Rating: ${rating}/5.`,
      entityType: "Candidate",
      entityId: interview.candidateId,
      entityName: interview.candidateName,
      candidateId: interview.candidateId,
      candidateName: interview.candidateName,
      vendorId: interview.vendorId,
      vendorName: interview.vendorName,
      status: recommendation,
      visibility: "ALL",
      remarks: feedback,
    });

    return interview;
  }

  static async reassignCandidateApplication({
    applicationId,
    projectId,
    projectName,
    jobId,
    jobTitle,
    notes = "",
    actorUser,
  }) {
    if (!applicationId || !projectId) {
      throw new ApiError(400, "Application ID and target Project ID are required.");
    }

    const application = await CandidateApplication.findOne({
      $or: [
        { applicationId },
        { _id: applicationId.match(/^[0-9a-fA-F]{24}$/) ? applicationId : null },
      ],
    });

    if (!application) {
      throw new ApiError(404, "Candidate application not found.");
    }

    const project = await Project.findOne({
      $or: [{ projectId }, { _id: projectId.match(/^[0-9a-fA-F]{24}$/) ? projectId : null }],
    });
    const targetProjectName = projectName || project?.title || project?.projectName || "Overseas Project";

    let job = null;
    if (jobId) {
      job = await Job.findOne({
        $or: [{ jobId }, { _id: jobId.match(/^[0-9a-fA-F]{24}$/) ? jobId : null }],
      });
    }
    const targetJobTitle = jobTitle || job?.title || application.jobTitle || targetProjectName;

    const prevProj = application.projectName;
    application.projectId = project?.projectId || projectId;
    application.projectName = targetProjectName;
    application.clientId = project?.clientId?.toString() || application.clientId || "";
    application.jobId = job?.jobId || jobId || "";
    application.jobTitle = targetJobTitle;
    application.position = targetJobTitle;
    application.recruitmentStage = "Applied";
    application.status = "Applied";
    application.rejectionReason = "";
    application.interview = null;
    application.offerDetails = { offerStatus: "Pending", salary: "" };
    application.visaDetails = { visaStatus: "Not Started", visaNumber: "" };

    application.statusHistory = application.statusHistory || [];
    application.statusHistory.push({
      status: "Reassigned to New Project",
      updatedBy: actorUser?.name || "HR Staff",
      note: notes || `Reassigned from [${prevProj}] to [${targetProjectName}] - ${targetJobTitle}`,
      date: new Date(),
    });

    await application.save();

    await ActivityLog.create({
      userType: actorUser?.role || "HR",
      userId: actorUser?._id?.toString() || actorUser?.id || "System",
      userName: actorUser?.name || "HR Staff",
      action: "CANDIDATE_REASSIGNED_PROJECT",
      title: `Candidate Reassigned: [${application.candidateName}] -> ${targetProjectName}`,
      description: `Candidate reallocated from [${prevProj}] to [${targetProjectName}] for trade [${targetJobTitle}].`,
      entityType: "Candidate",
      entityId: application.candidateId,
      entityName: application.candidateName,
      candidateId: application.candidateId,
      candidateName: application.candidateName,
      vendorId: application.vendorId,
      vendorName: application.vendorName,
      status: "Applied",
      newStatus: "Applied",
      visibility: "ALL",
      remarks: notes || `Reassigned by ${actorUser?.name} (${actorUser?.role || "HR"})`,
    });

    return application;
  }
}

export default RecruitmentService;
