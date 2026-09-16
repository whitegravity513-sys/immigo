import Project from "../models/Project.js";
import { ApiError } from "../utils/apiError.js";

/**
 * Enterprise Project Management Service
 */
export class ProjectService {
  static formatProject(project) {
    if (!project) return null;
    const clientObj = project.clientId;
    return {
      ...(project.toObject ? project.toObject() : project),
      id: project._id?.toString() || project.id,
      _id: project._id?.toString() || project.id,
      projectName: project.title,
      client: clientObj
        ? {
            ...(clientObj.toObject ? clientObj.toObject() : clientObj),
            id: clientObj._id?.toString() || clientObj.toString(),
            _id: clientObj._id?.toString() || clientObj.toString(),
          }
        : null,
    };
  }

  static async createProject(data) {
    const {
      projectId,
      title,
      projectName,
      description,
      projectType,
      industryName,
      salesPerson,
      leadSource,
      remark,
      clientId,
      client,
      budget,
      totalAmount,
      initialAmount,
      extendedAmount,
      status,
      startDate,
      deadline,
    } = data;

    const finalTitle = title || projectName;
    const finalClientId = clientId || client;
    if (!finalTitle || !finalClientId) {
      throw new ApiError(400, "Project Title and Client are required.");
    }

    const initAmt = Number(initialAmount) || Number(totalAmount) || Number(budget) || 0;
    const extAmt = Number(extendedAmount) || 0;
    const totAmt = initAmt + extAmt;

    const newProject = await Project.create({
      projectId: projectId || `PRJ-${Date.now().toString().slice(-4)}`,
      title: finalTitle.trim(),
      description: description || "",
      projectType: projectType || "",
      industryName: industryName || "",
      salesPerson: salesPerson || "",
      leadSource: leadSource || "",
      remark: remark || "",
      clientId: finalClientId,
      budget: totAmt,
      initialAmount: initAmt,
      extendedAmount: extAmt,
      totalAmount: totAmt,
      status: status || "Pending",
      startDate: startDate ? new Date(startDate) : null,
      deadline: deadline ? new Date(deadline) : null,
    });

    await newProject.populate("clientId");
    return this.formatProject(newProject);
  }

  static async getProjects(filters = {}) {
    const { status, search } = filters;
    let query = {};
    if (status) query.status = status;
    if (search && search.trim()) {
      query.title = new RegExp(search.trim(), "i");
    }

    const projects = await Project.find(query)
      .populate("clientId")
      .sort({ createdAt: -1 })
      .lean();

    return projects.map((p) => this.formatProject(p));
  }

  static async getProjectById(id) {
    const project = await Project.findById(id).populate("clientId").lean();
    if (!project) {
      throw new ApiError(404, "Project not found.");
    }
    return this.formatProject(project);
  }

  static async updateProject(id, data) {
    const {
      title,
      projectName,
      description,
      projectType,
      industryName,
      salesPerson,
      leadSource,
      remark,
      clientId,
      client,
      initialAmount,
      extendedAmount,
      totalAmount,
      budget,
      status,
      startDate,
      deadline,
    } = data;

    const project = await Project.findById(id);
    if (!project) {
      throw new ApiError(404, "Project not found.");
    }

    if (title || projectName) project.title = (title || projectName).trim();
    if (description !== undefined) project.description = description;
    if (projectType !== undefined) project.projectType = projectType;
    if (industryName !== undefined) project.industryName = industryName;
    if (salesPerson !== undefined) project.salesPerson = salesPerson;
    if (leadSource !== undefined) project.leadSource = leadSource;
    if (remark !== undefined) project.remark = remark;
    if (clientId || client) project.clientId = clientId || client;

    if (initialAmount !== undefined) project.initialAmount = Number(initialAmount);
    if (extendedAmount !== undefined) project.extendedAmount = Number(extendedAmount);
    if (totalAmount !== undefined || budget !== undefined) {
      project.totalAmount = Number(totalAmount || budget);
      project.budget = Number(totalAmount || budget);
    } else if (initialAmount !== undefined || extendedAmount !== undefined) {
      project.totalAmount = (project.initialAmount || 0) + (project.extendedAmount || 0);
      project.budget = project.totalAmount;
    }

    if (status) project.status = status;
    if (startDate !== undefined) project.startDate = startDate ? new Date(startDate) : null;
    if (deadline !== undefined) project.deadline = deadline ? new Date(deadline) : null;

    await project.save();
    await project.populate("clientId");
    return this.formatProject(project);
  }

  static async deleteProject(id) {
    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      throw new ApiError(404, "Project not found.");
    }
    return project;
  }
}

export default ProjectService;
