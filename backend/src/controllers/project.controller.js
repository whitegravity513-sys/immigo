import ProjectService from "../services/project.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Enterprise Project Controller
 */
export const createProject = asyncHandler(async (req, res) => {
  const project = await ProjectService.createProject(req.body);
  return res.status(201).json({ message: "Project created successfully!", project });
});

export const getProjects = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const projects = await ProjectService.getProjects({ status, search });
  return res.status(200).json({ projects });
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await ProjectService.getProjectById(req.params.id);
  return res.status(200).json({ project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await ProjectService.updateProject(req.params.id, req.body);
  return res.status(200).json({ message: "Project updated successfully!", project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  await ProjectService.deleteProject(req.params.id);
  return res.status(200).json({ message: "Project deleted successfully." });
});

export default {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
