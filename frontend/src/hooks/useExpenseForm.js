import { useState, useEffect } from "react";
import { createExpense } from "../services/expenseService";
import { getExpenseCategories } from "../services/expenseCategoryService";

const getTodayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const useExpenseForm = (onSuccess) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    date: getTodayStr(),
    type: "Expense",
    name: "",
    category: "General",
    amount: "",
    gst: "",
    cgst: "",
    sgst: "",
    igst: "",
    hsnSac: "",
    description: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const cats = await getExpenseCategories();
      setCategories(cats || []);
      if (cats.length > 0 && form.category === "General") {
        setForm((prev) => ({ ...prev, category: cats[0].name }));
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.name.trim() || !form.amount) {
      setErrorMsg("Please fill in Date, Expense Name, and Amount.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      await createExpense({
        ...form,
        amount: Number(form.amount) || 0,
        gst: form.gst || "",
        cgst: form.cgst || "",
        sgst: form.sgst || "",
        igst: form.igst || "",
      });

      setSuccessMsg("Expense recorded successfully!");
      setForm((prev) => ({
        ...prev,
        amount: "",
        name: "",
        project: "",
        gst: "",
        cgst: "",
        sgst: "",
        igst: "",
        hsnSac: "",
        description: "",
      }));

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1200);
      }
    } catch (err) {
      console.error("Error creating expense:", err);
      setErrorMsg(err.response?.data?.message || "Failed to submit expense. Please check your inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    categories,
    loading,
    submitting,
    errorMsg,
    successMsg,
    form,
    handleChange,
    handleSubmit
  };
};
