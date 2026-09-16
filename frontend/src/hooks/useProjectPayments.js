import { useState, useEffect } from "react";
import { getPaymentsByProject, createPayment, updatePayment, deletePayment } from "../services/paymentService";
import { updateProject } from "../services/projectService";

export const useProjectPayments = (project) => {
  const [currentProject, setCurrentProject] = useState(project);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendInputAmount, setExtendInputAmount] = useState("");
  const [extendRemark, setExtendRemark] = useState("");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    paymentMode: "Bank Transfer",
    tdsDeducted: "",
    igst: "",
    cgst: "",
    sgst: "",
    description: "",
  });

  const [editingPayment, setEditingPayment] = useState(null);

  useEffect(() => {
    setCurrentProject(project);
  }, [project]);

  useEffect(() => {
    if (currentProject?._id) {
      fetchPayments();
    }
  }, [currentProject?._id]);

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

  const fetchPayments = async () => {
    try {
      const data = await getPaymentsByProject(currentProject._id);
      setPayments(data.payments || []);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    }
  };

  const initialValue = (currentProject?.initialAmount !== undefined && Number(currentProject.initialAmount) > 0)
    ? Number(currentProject.initialAmount)
    : (Number(currentProject?.totalAmount || 0) - (Number(currentProject?.extendedAmount) || 0));
  const extendedValue = Number(currentProject?.extendedAmount) || 0;
  const totalProjectAmount = Number(currentProject?.totalAmount) || (initialValue + extendedValue);
  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const totalTDS = payments.reduce((acc, p) => acc + (Number(p.tdsDeducted) || 0), 0);
  const remainingBalance = Math.max(0, totalProjectAmount - totalPaid - totalTDS);

  const handleSaveExtendedBudget = async (e) => {
    e.preventDefault();
    const addAmt = Number(extendInputAmount) || 0;
    const newExtended = extendedValue + addAmt;
    const newTotal = initialValue + newExtended;
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await updateProject(currentProject._id, {
        initialAmount: initialValue,
        extendedAmount: newExtended,
        totalAmount: newTotal,
      });
      if (data?.project) {
        setCurrentProject(data.project);
      } else {
        setCurrentProject({ ...currentProject, initialAmount: initialValue, extendedAmount: newExtended, totalAmount: newTotal });
      }
      setSuccessMsg(`Project value extended by ₹${addAmt.toLocaleString("en-IN")}! New Total: ₹${newTotal.toLocaleString("en-IN")}`);
      setShowExtendModal(false);
      setExtendInputAmount("");
      setExtendRemark("");
    } catch (err) {
      setErrorMsg("Failed to extend project amount.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitNewPayment = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.amount || Number(formData.amount) <= 0) {
      setErrorMsg("Please enter a valid payment amount.");
      return;
    }

    setLoading(true);
    try {
      await createPayment({
        project: currentProject._id,
        date: formData.date,
        amount: Number(formData.amount) || 0,
        paymentMode: formData.paymentMode || "Bank Transfer",
        tdsDeducted: Number(formData.tdsDeducted) || 0,
        igst: formData.igst || "",
        cgst: formData.cgst || "",
        sgst: formData.sgst || "",
        description: formData.description,
      });
      setSuccessMsg("Part Payment added successfully!");
      setFormData({
        date: new Date().toISOString().split("T")[0],
        amount: "",
        paymentMode: "Bank Transfer",
        tdsDeducted: "",
        igst: "",
        cgst: "",
        sgst: "",
        description: "",
      });
      fetchPayments();
    } catch (err) {
      setErrorMsg("Failed to add part payment.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!editingPayment) return;
    setLoading(true);
    try {
      await updatePayment(editingPayment._id, editingPayment);
      setSuccessMsg("Payment updated successfully!");
      setEditingPayment(null);
      fetchPayments();
    } catch (err) {
      setErrorMsg("Failed to update payment.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payment record?")) return;
    try {
      await deletePayment(id);
      setSuccessMsg("Payment deleted successfully!");
      fetchPayments();
    } catch (err) {
      setErrorMsg("Failed to delete payment.");
    }
  };

  return {
    currentProject,
    payments,
    loading,
    errorMsg,
    successMsg,
    showExtendModal,
    setShowExtendModal,
    extendInputAmount,
    setExtendInputAmount,
    extendRemark,
    setExtendRemark,
    formData,
    editingPayment,
    setEditingPayment,
    initialValue,
    extendedValue,
    totalProjectAmount,
    totalPaid,
    totalTDS,
    remainingBalance,
    handleSaveExtendedBudget,
    handleFormChange,
    handleSubmitNewPayment,
    handleUpdatePayment,
    handleDeletePayment
  };
};
