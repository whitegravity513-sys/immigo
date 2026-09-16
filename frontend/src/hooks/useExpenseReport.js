import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { getExpenses, updateExpense, deleteExpense } from "../services/expenseService";
import { getExpenseCategories } from "../services/expenseCategoryService";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export const useExpenseReport = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [month, year, categoryFilter, typeFilter]);

  async function fetchCategories() {
    try {
      const cats = await getExpenseCategories();
      setCategories(cats || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }

  async function fetchExpenses() {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = {};
      if (month) params.month = month;
      if (year) params.year = year;
      if (categoryFilter) params.category = categoryFilter;
      if (typeFilter) params.type = typeFilter;

      const data = await getExpenses(params);
      setExpenses(data || []);
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setErrorMsg("Failed to load filtered expense report.");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await deleteExpense(id);
      setSuccessMsg("Expense deleted successfully!");
      fetchExpenses();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg("Failed to delete expense.");
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleUpdate = async () => {
    if (!editForm.date || !editForm.name || !editForm.amount) {
      setErrorMsg("Date, Name, and Amount are required.");
      return;
    }
    try {
      await updateExpense(editingId, {
        ...editForm,
        amount: Number(editForm.amount) || 0,
        gst: editForm.gst || "",
        cgst: editForm.cgst || "",
        sgst: editForm.sgst || "",
        igst: editForm.igst || "",
      });
      setSuccessMsg("Expense updated successfully!");
      setEditingId(null);
      fetchExpenses();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg("Failed to update expense.");
    }
  };

  const exportToExcel = () => {
    if (expenses.length === 0) {
      alert("No data available to export for the selected filters.");
      return;
    }

    const mLabel = MONTHS.find((m) => m.value === Number(month))?.label || month;
    const filename = `Expense_Report_${mLabel}_${year}.xlsx`;

    const data = expenses.map((e, idx) => ({
      "S.No": idx + 1,
      Date: e.date,
      "Expense / Vendor Name": e.name,
      Category: e.category || "General",
      Type: e.type || "Expense",
      "Amount (₹)": Number(e.amount || 0),
      "Total GST": e.gst || "-",
      "CGST": e.cgst || "-",
      "SGST": e.sgst || "-",
      "IGST": e.igst || "-",
      "HSN / SAC": e.hsnSac || "",
      Description: e.description || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    const wscols = [
      { wch: 6 }, { wch: 12 }, { wch: 25 }, { wch: 18 }, { wch: 12 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 35 }
    ];
    worksheet["!cols"] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${mLabel} ${year}`);
    XLSX.writeFile(workbook, filename);
  };

  return {
    MONTHS,
    month,
    setMonth,
    year,
    setYear,
    categoryFilter,
    setCategoryFilter,
    categories,
    expenses,
    loading,
    errorMsg,
    successMsg,
    editingId,
    editForm,
    setEditForm,
    handleDelete,
    startEdit,
    cancelEdit,
    handleUpdate,
    exportToExcel
  };
};
