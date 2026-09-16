import { useState, useEffect, useMemo } from "react";
import { getAllPayments, updatePayment, deletePayment } from "../services/paymentService";

export const useAllPaymentsLedger = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [editingPayment, setEditingPayment] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchAllPayments();
  }, []);

  const fetchAllPayments = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await getAllPayments();
      setPayments(data.payments || []);
    } catch (err) {
      console.error("Failed to fetch payments ledger:", err);
      setErrorMsg("Failed to load payments ledger. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!editingPayment) return;
    setEditLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await updatePayment(editingPayment._id, {
        date: editingPayment.date,
        amount: Number(editingPayment.amount) || 0,
        description: editingPayment.description,
        paymentMode: editingPayment.paymentMode || "Bank Transfer",
        tdsDeducted: Number(editingPayment.tdsDeducted) || 0,
        igst: editingPayment.igst || "",
        cgst: editingPayment.cgst || "",
        sgst: editingPayment.sgst || "",
      });
      setSuccessMsg("Payment record updated successfully!");
      setEditingPayment(null);
      fetchAllPayments();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      setErrorMsg("Failed to update payment record.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePayment = async (id, paymentId) => {
    if (!window.confirm(`Are you sure you want to delete payment ${paymentId}?`)) return;
    try {
      await deletePayment(id);
      setSuccessMsg(`Payment ${paymentId} deleted successfully!`);
      fetchAllPayments();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      setErrorMsg("Failed to delete payment.");
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const payId = (p.paymentId || "").toLowerCase();
        const projName = (p.project?.projectName || "").toLowerCase();
        const projId = (p.project?.projectId || "").toLowerCase();
        const clientName = (p.project?.clientName || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const mode = (p.paymentMode || "").toLowerCase();
        const matchesQuery =
          payId.includes(q) ||
          projName.includes(q) ||
          projId.includes(q) ||
          clientName.includes(q) ||
          desc.includes(q) ||
          mode.includes(q);
        if (!matchesQuery) return false;
      }
      if (fromDate && p.date < fromDate) return false;
      if (toDate && p.date > toDate) return false;
      return true;
    });
  }, [payments, searchQuery, fromDate, toDate]);

  const totalReceived = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  }, [filteredPayments]);

  const totalTransactions = filteredPayments.length;

  const uniqueProjectsCount = useMemo(() => {
    const set = new Set();
    filteredPayments.forEach((p) => {
      if (p.project?._id) set.add(p.project._id);
    });
    return set.size;
  }, [filteredPayments]);

  return {
    loading,
    errorMsg,
    successMsg,
    searchQuery,
    setSearchQuery,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    editingPayment,
    setEditingPayment,
    editLoading,
    filteredPayments,
    totalReceived,
    totalTransactions,
    uniqueProjectsCount,
    fetchAllPayments,
    handleUpdatePayment,
    handleDeletePayment
  };
};
