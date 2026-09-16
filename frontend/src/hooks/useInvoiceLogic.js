import { useState, useEffect } from "react";
import { getInvoicesByProject, createInvoice, updateInvoice, deleteInvoice } from "../services/invoiceService";

export const useInvoiceLogic = (project) => {
  const [activeTab, setActiveTab] = useState("list"); // "list" | "create"
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [editingInvoiceNo, setEditingInvoiceNo] = useState("");

  // Form State
  const clientNameVal = project?.client?.name || project?.clientName || "";
  const companyNameVal = project?.client?.companyName || project?.companyName || "";

  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [supplyAddress, setSupplyAddress] = useState(project?.client?.address || "");
  const [gstn, setGstn] = useState(project?.client?.gstNumber || "");
  const [clientContact, setClientContact] = useState(project?.client?.mobile || project?.client?.phone || "");
  const [clientEmail, setClientEmail] = useState(project?.client?.email || "");
  const [adminCompanyName, setAdminCompanyName] = useState("VESTA Enterprise Solutions");
  const [adminAddress, setAdminAddress] = useState("LG-04, Dallas 1 Business Park H-202, Sector 63, Noida, U.P-201301");
  const [adminContact, setAdminContact] = useState("+91-921-713-5322 | +91-879-641-4339");
  const [adminEmail, setAdminEmail] = useState("sales@vesta.in");
  const [adminGstn, setAdminGstn] = useState("09EPOPS8385K1ZL");
  const [remark, setRemark] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");

  // 3 Default Items
  const [items, setItems] = useState([
    { description: "", sacCode: "998314", amount: "" },
    { description: "", sacCode: "998314", amount: "" },
    { description: "", sacCode: "998314", amount: "" }
  ]);

  // GST Rates
  const [igstRate, setIgstRate] = useState(0);
  const [cgstRate, setCgstRate] = useState(0);
  const [sgstRate, setSgstRate] = useState(0);

  useEffect(() => {
    if (project?._id) {
      fetchInvoices();
    }
  }, [project?._id]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await getInvoicesByProject(project._id);
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setErrorMsg("Failed to load project invoices.");
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleAddItemRow = () => {
    setItems([...items, { description: "", sacCode: "998314", amount: "" }]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const validItems = items.filter(it => it.description.trim() !== "" || Number(it.amount) > 0);
  const subtotal = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const igstAmount = (subtotal * Number(igstRate)) / 100;
  const cgstAmount = (subtotal * Number(cgstRate)) / 100;
  const sgstAmount = (subtotal * Number(sgstRate)) / 100;
  const totalAmount = subtotal + igstAmount + cgstAmount + sgstAmount;

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (validItems.length === 0) {
      setErrorMsg("Please enter at least one item description and amount.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const issueDate = new Date(formDate);
      const due = new Date(issueDate.getTime() + 15 * 24 * 60 * 60 * 1000);
      const dueDateStr = due.toISOString().split("T")[0];

      const payload = {
        project: project._id,
        clientId: project.clientId || project.client?.id || project.client?._id || "",
        dueDate: dueDateStr,
        amount: subtotal,
        tax: igstAmount + cgstAmount + sgstAmount,
        totalAmount,
        status: paymentStatus,
        projectId: project.projectId || "",
        projectName: project.projectName || "",
        clientName: clientNameVal,
        companyName: companyNameVal,
        supplyAddress,
        gstn,
        clientContact,
        clientEmail,
        adminCompanyName,
        adminAddress,
        adminContact,
        adminEmail,
        adminGstn,
        date: formDate,
        items: validItems.map(it => ({
          description: it.description,
          sacCode: it.sacCode || "",
          amount: Number(it.amount) || 0
        })),
        igstRate: Number(igstRate),
        cgstRate: Number(cgstRate),
        sgstRate: Number(sgstRate),
        remark,
        paymentStatus,
      };

      let res;
      if (editingInvoiceId) {
        res = await updateInvoice(editingInvoiceId, payload);
        setSuccessMsg(`Official Invoice updated successfully! (${res.invoice?.invoiceNo || editingInvoiceNo})`);
      } else {
        res = await createInvoice(payload);
        setSuccessMsg(`Official Invoice generated successfully! (${res.invoice?.invoiceNo})`);
      }
      setSelectedInvoice(res.invoice);
      setActiveTab("list");
      setEditingInvoiceId(null);
      setEditingInvoiceNo("");
      fetchInvoices();

      // Reset form items
      resetForm();
    } catch (err) {
      console.error("Failed to create invoice:", err);
      setErrorMsg(err.response?.data?.message || "Failed to generate invoice.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormDate(new Date().toISOString().split("T")[0]);
    setItems([
      { description: "", sacCode: "998314", amount: "" },
      { description: "", sacCode: "998314", amount: "" },
      { description: "", sacCode: "998314", amount: "" }
    ]);
    setIgstRate(0);
    setCgstRate(0);
    setSgstRate(0);
    setRemark("");
    setPaymentStatus("Unpaid");
  };

  const handleEditInvoice = (inv) => {
    setEditingInvoiceId(inv._id);
    setEditingInvoiceNo(inv.invoiceNo || "");
    setFormDate(inv.date || new Date().toISOString().split("T")[0]);
    setSupplyAddress(inv.supplyAddress || project?.client?.address || "");
    setGstn(inv.gstn || project?.client?.gstNumber || "");
    setClientContact(inv.clientContact || project?.client?.mobile || project?.client?.phone || "");
    setClientEmail(inv.clientEmail || project?.client?.email || "");
    setAdminCompanyName(inv.adminCompanyName || "VESTA Enterprise Solutions");
    setAdminAddress(inv.adminAddress || "LG-04, Dallas 1 Business Park H-202, Sector 63, Noida, U.P-201301");
    setAdminContact(inv.adminContact || "+91-921-713-5322 | +91-879-641-4339");
    setAdminEmail(inv.adminEmail || "sales@vesta.in | info@vesta.in");
    setAdminGstn(inv.adminGstn || "");
    setRemark(inv.remark || "");
    setIgstRate(Number(inv.igstRate) || 0);
    setCgstRate(Number(inv.cgstRate) || 0);
    setSgstRate(Number(inv.sgstRate) || 0);
    setPaymentStatus(inv.paymentStatus || inv.status || "Unpaid");
    let parsedItems = [];
    try { parsedItems = typeof inv.items === "string" ? JSON.parse(inv.items) : (inv.items || []); } catch(e) {}

    setItems(
      Array.isArray(parsedItems) && parsedItems.length > 0
        ? parsedItems.map((it) => ({
            description: it.description || "",
            sacCode: it.sacCode || "998314",
            amount: it.amount || "",
          }))
        : [
            { description: "", sacCode: "998314", amount: "" },
            { description: "", sacCode: "998314", amount: "" },
            { description: "", sacCode: "998314", amount: "" },
          ]
    );
    setActiveTab("create");
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await deleteInvoice(id);
      setSuccessMsg("Invoice deleted successfully.");
      fetchInvoices();
    } catch (err) {
      setErrorMsg("Failed to delete invoice.");
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const invNo = (inv.invoiceNo || "").toLowerCase();
    const pName = (inv.projectName || project?.projectName || "").toLowerCase();
    const cName = (inv.clientName || clientNameVal || "").toLowerCase();
    const compName = (inv.companyName || companyNameVal || "").toLowerCase();
    return invNo.includes(q) || pName.includes(q) || cName.includes(q) || compName.includes(q);
  });

  return {
    // State
    activeTab, setActiveTab,
    invoices,
    loading, setLoading,
    errorMsg, setErrorMsg,
    successMsg, setSuccessMsg,
    searchQuery, setSearchQuery,
    selectedInvoice, setSelectedInvoice,
    editingInvoiceId, setEditingInvoiceId,
    editingInvoiceNo, setEditingInvoiceNo,
    
    // Form fields
    clientNameVal, companyNameVal,
    formDate, setFormDate,
    supplyAddress, setSupplyAddress,
    gstn, setGstn,
    clientContact, setClientContact,
    clientEmail, setClientEmail,
    adminCompanyName, setAdminCompanyName,
    adminAddress, setAdminAddress,
    adminContact, setAdminContact,
    adminEmail, setAdminEmail,
    adminGstn, setAdminGstn,
    remark, setRemark,
    paymentStatus, setPaymentStatus,
    items, setItems,
    igstRate, setIgstRate,
    cgstRate, setCgstRate,
    sgstRate, setSgstRate,

    // Actions & Handlers
    handleItemChange, handleAddItemRow, handleRemoveItemRow,
    handleCreateInvoice, handleEditInvoice, handleDeleteInvoice,
    resetForm,

    // Computed values
    filteredInvoices,
    subtotal, igstAmount, cgstAmount, sgstAmount, totalAmount
  };
};
