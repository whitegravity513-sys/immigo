import { useState, useEffect } from "react";
import { getClients, updateClient, deleteClient } from "../services/clientService";

export const useClientList = () => {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editingClient, setEditingClient] = useState(null);

  useEffect(() => {
    fetchClients();
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

  const fetchClients = async (search = "") => {
    setLoading(true);
    try {
      const data = await getClients(search);
      setClients(data.clients || []);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
      setErrorMsg("Failed to load clients list.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    fetchClients(e.target.value);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingClient) return;
    setLoading(true);
    try {
      await updateClient(editingClient._id, editingClient);
      setSuccessMsg("Client details updated successfully!");
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
    clients,
    searchQuery,
    loading,
    errorMsg,
    successMsg,
    editingClient,
    setEditingClient,
    handleSearchChange,
    handleUpdate,
    handleDelete
  };
};
