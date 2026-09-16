import { useState, useEffect } from "react";
import { getClients } from "../services/clientService";
import { createProject } from "../services/projectService";

export const useAddProject = (onSuccess) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    projectName: "",
    projectType: "",
    industryName: "",
    client: "",
    clientName: "",
    salesPerson: "",
    leadSource: "",
    description: "",
    totalAmount: "",
    remark: "",
  });

  useEffect(() => {
    fetchClientsData();
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

  const fetchClientsData = async () => {
    try {
      const data = await getClients();
      setClients(data.clients || []);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "client") {
      const selected = clients.find((c) => c._id === value);
      setFormData({
        ...formData,
        client: value,
        clientName: selected ? selected.name : "",
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.projectName.trim() || !formData.projectType.trim()) {
      setErrorMsg("Project Name and Project Type are required!");
      return;
    }
    if (!formData.totalAmount || Number(formData.totalAmount) <= 0) {
      setErrorMsg("Please enter a valid Project Amount.");
      return;
    }

    setLoading(true);
    try {
      await createProject(formData);
      setSuccessMsg("Project created successfully!");
      setFormData({
        projectName: "",
        projectType: "",
        industryName: "Web Development / IT",
        client: "",
        clientName: "",
        salesPerson: "",
        leadSource: "",
        description: "",
        totalAmount: "",
        remark: "",
      });
      if (onSuccess) {
        setTimeout(onSuccess, 1000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  return {
    clients,
    formData,
    loading,
    successMsg,
    errorMsg,
    handleChange,
    handleSubmit
  };
};
