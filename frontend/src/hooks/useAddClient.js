import { useState, useEffect } from "react";
import { getClients, createClient, updateClient, deleteClient } from "../services/clientService";

export const useAddClient = () => {
  const [activeTab, setActiveTab] = useState("add"); // "add" | "list"
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    companyName: "",
    address: "",
    gstPan: "",
    remark: "",
  });

  const [editingClient, setEditingClient] = useState(null);

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

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async (search = "") => {
    try {
      const data = await getClients(search);
      setClients(data.clients || []);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    fetchClients(e.target.value);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!formData.name.trim() || !formData.mobile.trim()) {
      setErrorMsg("Client Name and Mobile Number are required.");
      return;
    }
    setLoading(true);
    try {
      await createClient(formData);
      setSuccessMsg("Client details saved successfully!");
      setFormData({
        name: "",
        mobile: "",
        email: "",
        companyName: "",
        address: "",
        gstPan: "",
        remark: "",
      });
      fetchClients(searchQuery);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Failed to save client details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingClient) return;
    setLoading(true);
    try {
      await updateClient(editingClient._id, editingClient);
      setSuccessMsg("Client updated successfully!");
      setEditingClient(null);
      fetchClients(searchQuery);
    } catch (err) {
      setErrorMsg("Failed to update client.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;
    try {
      await deleteClient(id);
      setSuccessMsg("Client deleted successfully!");
      fetchClients(searchQuery);
    } catch (err) {
      setErrorMsg("Failed to delete client.");
    }
  };

  return {
    activeTab,
    setActiveTab,
    clients,
    searchQuery,
    loading,
    successMsg,
    errorMsg,
    formData,
    editingClient,
    setEditingClient,
    handleSearchChange,
    handleChange,
    handleSubmit,
    handleUpdate,
    handleDelete
  };
};
