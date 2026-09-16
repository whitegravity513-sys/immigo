import { useState, useEffect } from "react";
import { getProjectById, updateProject } from "../services/projectService";

export const useProjectDetail = (initialProject, onUpdate) => {
  const [project, setProject] = useState(initialProject);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [currentSubView, setCurrentSubView] = useState("overview"); // "overview" | "invoice" | "payments"
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendInputAmount, setExtendInputAmount] = useState("");
  const [extendRemark, setExtendRemark] = useState("");

  const [editForm, setEditForm] = useState({
    projectName: "",
    projectType: "",
    industryName: "",
    clientName: "",
    salesPerson: "",
    leadSource: "",
    description: "",
    totalAmount: "",
    remark: "",
    status: "Ongoing",
  });

  useEffect(() => {
    if (project?._id) {
      fetchProjectData(project._id);
    }
  }, []);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 5000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(""), 5000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  const fetchProjectData = async (id) => {
    try {
      const data = await getProjectById(id);
      if (data.project) {
        setProject(data.project);
        setPaymentSummary(data.paymentSummary);
        setEditForm({
          projectName: data.project.projectName || "",
          projectType: data.project.projectType || "",
          industryName: data.project.industryName || "Web Development / IT",
          clientName: data.project.clientName || data.project.client?.name || "",
          salesPerson: data.project.salesPerson || "",
          leadSource: data.project.leadSource || "",
          description: data.project.description || "",
          totalAmount: data.project.totalAmount || "",
          remark: data.project.remark || "",
          status: data.project.status || "Ongoing",
        });
      }
    } catch (err) {
      console.error("Failed to load project detail:", err);
    }
  };

  const initialValue = (project?.initialAmount !== undefined && Number(project.initialAmount) > 0)
    ? Number(project.initialAmount)
    : (Number(project?.totalAmount || 0) - (Number(project?.extendedAmount) || 0));
  const extendedValue = Number(project?.extendedAmount) || 0;
  const totalProjectValue = Number(project?.totalAmount) || (initialValue + extendedValue);
  const totalPaid = Number(paymentSummary?.totalPaid || 0);
  const totalTDS = Number(paymentSummary?.totalTDS || 0);
  const remainingBalance = Math.max(0, totalProjectValue - totalPaid - totalTDS);

  const handleSaveExtendedBudget = async (e) => {
    e.preventDefault();
    const addAmt = Number(extendInputAmount) || 0;
    const newExtended = extendedValue + addAmt;
    const newTotal = initialValue + newExtended;
    
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await updateProject(project._id, {
        initialAmount: initialValue,
        extendedAmount: newExtended,
        totalAmount: newTotal,
      });
      if (data?.project) {
        setProject(data.project);
        if (onUpdate) onUpdate(data.project);
      } else {
        setProject({ ...project, initialAmount: initialValue, extendedAmount: newExtended, totalAmount: newTotal });
      }
      setSuccessMsg(`Project value extended by ₹${addAmt.toLocaleString("en-IN")}! New Total: ₹${newTotal.toLocaleString("en-IN")}`);
      setShowExtendModal(false);
      setExtendInputAmount("");
      setExtendRemark("");
      fetchProjectData(project._id);
    } catch (err) {
      setErrorMsg("Failed to extend project amount.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const data = await updateProject(project._id, editForm);
      setSuccessMsg("Project details updated successfully!");
      setProject(data.project);
      setIsEditing(false);
      if (onUpdate) onUpdate(data.project);
      fetchProjectData(project._id);
    } catch (err) {
      setErrorMsg("Failed to update project details.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  return {
    project,
    paymentSummary,
    currentSubView,
    setCurrentSubView,
    isEditing,
    setIsEditing,
    loading,
    errorMsg,
    successMsg,
    showExtendModal,
    setShowExtendModal,
    extendInputAmount,
    setExtendInputAmount,
    extendRemark,
    setExtendRemark,
    editForm,
    handleEditFormChange,
    initialValue,
    extendedValue,
    totalProjectValue,
    totalPaid,
    totalTDS,
    remainingBalance,
    handleSaveExtendedBudget,
    handleEditSubmit,
    fetchProjectData
  };
};
