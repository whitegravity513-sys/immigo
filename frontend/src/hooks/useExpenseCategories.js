import { useState, useEffect } from "react";
import { getExpenseCategories, createExpenseCategory, updateExpenseCategory, deleteExpenseCategory } from "../services/expenseCategoryService";

export const useExpenseCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const [form, setForm] = useState({ name: "", typeDetail: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", typeDetail: "" });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getExpenseCategories();
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setErrorMsg("Failed to load expense categories.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg("Please enter a category name.");
      return;
    }
    setErrorMsg("");
    try {
      await createExpenseCategory(form);
      setSuccessMsg("Category added successfully!");
      setForm({ name: "", typeDetail: "" });
      fetchCategories();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to create category.");
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat._id);
    setEditForm({ name: cat.name, typeDetail: cat.typeDetail || "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", typeDetail: "" });
  };

  const handleUpdate = async (id) => {
    if (!editForm.name.trim()) {
      setErrorMsg("Category name cannot be empty.");
      return;
    }
    try {
      await updateExpenseCategory(id, editForm);
      setSuccessMsg("Category updated successfully!");
      setEditingId(null);
      fetchCategories();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update category.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteExpenseCategory(id);
      setSuccessMsg("Category deleted.");
      fetchCategories();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to delete category.");
    }
  };

  return {
    categories,
    loading,
    errorMsg,
    successMsg,
    form,
    setForm,
    editingId,
    editForm,
    setEditForm,
    handleCreate,
    startEdit,
    cancelEdit,
    handleUpdate,
    handleDelete
  };
};
