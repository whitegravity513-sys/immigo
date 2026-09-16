import { useState, useEffect } from "react";
import { getProjects, deleteProject } from "../services/projectService";

export const useProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async (search = "") => {
    setLoading(true);
    try {
      const data = await getProjects(search);
      setProjects(data.projects || []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setErrorMsg("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    fetchProjects(e.target.value);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this project and its related invoices/payments?")) return;
    try {
      await deleteProject(id);
      setSuccessMsg("Project deleted successfully!");
      fetchProjects(searchQuery);
    } catch (err) {
      setErrorMsg("Failed to delete project.");
    }
  };

  const activeProjectsCount = projects.filter(p => !['Completed', 'Inactive', 'Cancelled'].includes(p.status)).length;
  const inactiveProjectsCount = projects.filter(p => ['Completed', 'Inactive', 'Cancelled'].includes(p.status)).length;

  return {
    projects,
    searchQuery,
    loading,
    errorMsg,
    successMsg,
    handleSearchChange,
    handleDelete,
    activeProjectsCount,
    inactiveProjectsCount
  };
};
