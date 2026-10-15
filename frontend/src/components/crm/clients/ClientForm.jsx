import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  User,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  FileText,
  Globe,
  AlertCircle,
  FileCheck,
  CreditCard,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import FormSection from "../ui/FormSection.jsx";
import InputField from "../ui/InputField.jsx";
import SelectField from "../ui/SelectField.jsx";
import TextareaField from "../ui/TextareaField.jsx";
import CountrySelectField from "../ui/CountrySelectField.jsx";
import DocumentsList from "../documents/DocumentsList.jsx";
import { useCrmToast } from "../layout/CrmLayout.jsx";

const COMPANY_TYPES = [
  "Construction",
  "Engineering",
  "Manufacturing",
  "Hospitality",
  "Healthcare",
  "Logistics",
  "Oil & Gas",
  "Facility Management",
  "Other",
];

// Validation helpers
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email || "").trim());

const isValidPhone = (phone) => {
  const digits = (phone || "").replace(/[\s\-\(\)\+]/g, "");
  return /^\d{7,15}$/.test(digits);
};

const isValidPAN = (pan) =>
  /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test((pan || "").trim().toUpperCase());

export function ClientForm({
  initialData = null,
  isEdit = false,
  onSubmit,
  loading = false,
}) {
  const navigate = useNavigate();
  const { showToast } = useCrmToast();
  const panFileRef = useRef(null);

  const [formData, setFormData] = useState({
    companyName: "",
    companyType: "Construction",
    registrationNumber: "",
    tradeLicenseNumber: "",
    taxNumber: "",
    website: "",
    email: "",
    phone: "",
    status: "Active",

    // Address
    country: "UAE",
    state: "",
    city: "",
    address: "",
    address2: "",
    postalCode: "",

    // Director Details (NEW)
    directorName: "",
    directorEmail: "",
    directorMobile: "",

    // PAN Details (NEW – MANDATORY)
    panNumber: "",

    // Contacts
    contacts: [
      {
        id: "c-1",
        name: "",
        designation: "HR Director",
        department: "Human Resources",
        email: "",
        phone: "",
        whatsapp: "",
        alternativePhone: "",
        isPrimary: true,
      },
    ],

    // Additional Client Information
    localLicenseNumber: "",
    notes: "",

    // Client Legal & Compliance Documents
    documents: [],

    // Payment Milestones (Optional)
    paymentMilestones: [],
  });

  const [totalPaymentInput, setTotalPaymentInput] = useState(() => {
    if (initialData?.totalAgreedAmount) return String(initialData.totalAgreedAmount);
    return "";
  });
  const [errors, setErrors] = useState({});
  const [panFile, setPanFile] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        companyName: initialData.companyName || "",
        companyType: initialData.companyType || "Construction",
        registrationNumber: initialData.registrationNumber || "",
        tradeLicenseNumber: initialData.tradeLicenseNumber || "",
        taxNumber: initialData.taxNumber || "",
        website: initialData.website || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        status: initialData.status || "Active",

        country: initialData.country || "UAE",
        state: initialData.state || "",
        city: initialData.city || "",
        address: initialData.address || "",
        address2: initialData.address2 || "",
        postalCode: initialData.postalCode || "",

        // Director Details
        directorName: initialData.directorName || "",
        directorEmail: initialData.directorEmail || "",
        directorMobile: initialData.directorMobile || "",

        // PAN
        panNumber: initialData.panNumber || "",

        contacts:
          initialData.contacts && initialData.contacts.length > 0
            ? initialData.contacts
            : [
                {
                  id: "c-1",
                  name: "",
                  designation: "",
                  department: "",
                  email: "",
                  phone: "",
                  whatsapp: "",
                  alternativePhone: "",
                  isPrimary: true,
                },
              ],

        localLicenseNumber: initialData.localLicenseNumber || "",
        notes: initialData.notes || "",
        documents: Array.isArray(initialData.documents) ? initialData.documents : [],
        paymentMilestones:
          Array.isArray(initialData.paymentMilestones) && initialData.paymentMilestones.length > 0
            ? initialData.paymentMilestones.map((m, idx) => ({
                id: m.id || `mls-${idx + 1}`,
                name: m.name || `Milestone ${idx + 1}`,
                amount: String(m.amount || ""),
                condition: m.condition || "",
                timeline: "",
                description: m.description || "",
                status: m.status || "Pending",
                paidAmount: m.paidAmount || 0,
                remainingBalance: m.remainingBalance || m.amount || 0,
                remarks: m.remarks || "",
              }))
            : [],
      });

      if (initialData.totalAgreedAmount) {
        setTotalPaymentInput(String(initialData.totalAgreedAmount));
      } else if (Array.isArray(initialData.paymentMilestones)) {
        const sum = initialData.paymentMilestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
        if (sum > 0) setTotalPaymentInput(String(sum));
      }
    }
  }, [initialData]);

  // Handle simple fields
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Handle contact list
  const handleContactChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.contacts];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, contacts: updated };
    });

    const errKey = `contact_${index}_${field}`;
    if (errors[errKey]) {
      setErrors((prev) => ({ ...prev, [errKey]: "" }));
    }
  };

  const handleAddContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          id: `c-${Date.now()}`,
          name: "",
          designation: "",
          department: "",
          email: "",
          phone: "",
          whatsapp: "",
          alternativePhone: "",
          isPrimary: false,
        },
      ],
    }));
  };

  const handleRemoveContact = (index) => {
    if (formData.contacts.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index),
    }));
  };

  // Total Payment Handlers
  const handleTotalPaymentChange = (e) => {
    const val = e.target.value;
    setTotalPaymentInput(val);

    // If only 1 milestone exists, auto-sync its amount
    if ((formData.paymentMilestones || []).length === 1) {
      setFormData((prev) => ({
        ...prev,
        paymentMilestones: [
          {
            ...prev.paymentMilestones[0],
            amount: val,
          },
        ],
      }));
    }
  };

  const handleAutoDistributeTotal = () => {
    const total = Number(totalPaymentInput);
    if (!total || total <= 0) {
      showToast("Please enter a valid total payment amount to distribute", "warning");
      return;
    }
    const count = (formData.paymentMilestones || []).length;
    if (count === 0) return;

    const baseShare = Math.floor(total / count);
    const remainder = total - baseShare * count;

    setFormData((prev) => ({
      ...prev,
      paymentMilestones: (prev.paymentMilestones || []).map((m, idx) => ({
        ...m,
        amount: String(idx === 0 ? baseShare + remainder : baseShare),
      })),
    }));
    showToast(`Distributed ₹${total.toLocaleString("en-IN")} evenly across ${count} milestones`, "success");
  };

  // Milestone Handlers
  const handleMilestoneChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.paymentMilestones || [])];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "amount") {
        const newTotal = updated.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
        setTotalPaymentInput(String(newTotal));
      }
      return { ...prev, paymentMilestones: updated };
    });

    const errKey = `milestone_${index}_${field}`;
    if (errors[errKey]) {
      setErrors((prev) => ({ ...prev, [errKey]: "" }));
    }
  };

  const handleAddMilestone = () => {
    setFormData((prev) => {
      const list = prev.paymentMilestones || [];
      const newIdx = list.length + 1;
      const currentSum = list.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
      const targetTotal = Number(totalPaymentInput) || 0;
      const unallocated = Math.max(0, targetTotal - currentSum);

      return {
        ...prev,
        paymentMilestones: [
          ...list,
          {
            id: `mls-${Date.now()}-${newIdx}`,
            name: `Milestone ${newIdx}`,
            amount: unallocated > 0 ? String(unallocated) : "",
            condition: "",
            timeline: "",
            description: "",
            status: "Pending",
            paidAmount: 0,
            remainingBalance: 0,
            remarks: "",
          },
        ],
      };
    });
  };

  const handleRemoveMilestone = (index) => {
    setFormData((prev) => {
      const remaining = (prev.paymentMilestones || []).filter((_, i) => i !== index);
      const newTotal = remaining.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
      setTotalPaymentInput(String(newTotal));
      return {
        ...prev,
        paymentMilestones: remaining,
      };
    });
  };

  // PAN file upload handler
  const handlePanFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrors((prev) => ({ ...prev, panFile: "Only PDF files are allowed for PAN Card." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, panFile: "PAN Card file must be under 5 MB." }));
      return;
    }
    setPanFile(file);
    setErrors((prev) => ({ ...prev, panFile: "" }));
  };

  // Validation
  const validate = () => {
    const newErrors = {};

    // Company name is mandatory
    if (!formData.companyName || !formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (formData.email?.trim() && !isValidEmail(formData.email)) {
      newErrors.email = "Enter a valid company email (e.g. info@company.com)";
    }

    if (formData.directorEmail?.trim() && !isValidEmail(formData.directorEmail)) {
      newErrors.directorEmail = "Enter a valid director email (e.g. director@company.com)";
    }

    // Milestones are NOT mandatory: do not require milestones or conditions
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErr = newErrors.companyName || Object.values(newErrors)[0];
      showToast(firstErr || "Please review the errors in the form.", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!validate()) return;

    const companySlug = (formData.companyName || "client").toLowerCase().replace(/[^a-z0-9]/g, "") || "client";
    const resolvedEmail = formData.email?.trim() || `info@${companySlug}.com`;
    const resolvedPhone = formData.phone?.trim() || "+971 4 000 0000";
    const resolvedCountry = formData.country?.trim() || "UAE";
    const resolvedDirectorName = formData.directorName?.trim() || formData.contacts?.[0]?.name?.trim() || `${formData.companyName} Director`;
    const resolvedDirectorEmail = formData.directorEmail?.trim() || resolvedEmail;

    const sanitizedContacts = (formData.contacts && formData.contacts.length > 0 ? formData.contacts : [{}]).map((c, idx) => {
      if (idx === 0) {
        return {
          ...c,
          id: c.id || "c-1",
          name: c.name?.trim() || resolvedDirectorName,
          designation: c.designation || "Managing Director",
          department: c.department || "Management",
          email: c.email?.trim() || resolvedEmail,
          phone: c.phone?.trim() || resolvedPhone,
          isPrimary: true,
        };
      }
      return c;
    });

    const panDocumentName = panFile
      ? panFile.name
      : initialData?.panDocumentName || "";

    const formattedMilestones = (formData.paymentMilestones || [])
      .filter((m) => Number(m.amount) > 0 || (m.name && m.name.trim() && m.name !== "Milestone 1") || (m.condition && m.condition.trim()))
      .map((m, idx) => {
        const amount = Number(m.amount) || 0;
        const paidAmount = Number(m.paidAmount) || 0;
        return {
          ...m,
          id: m.id || `mls-${Date.now()}-${idx + 1}`,
          name: (m.name || `Milestone ${idx + 1}`).trim(),
          amount,
          condition: (m.condition || "").trim(),
          timeline: "",
          description: m.description || "",
          status: m.status || (paidAmount >= amount && amount > 0 ? "Paid" : "Pending"),
          paidAmount,
          remainingBalance: Math.max(0, amount - paidAmount),
          remarks: m.remarks || "",
        };
      });

    const totalAgreedAmount = Number(totalPaymentInput) || formattedMilestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

    onSubmit({
      ...formData,
      companyName: formData.companyName.trim(),
      email: resolvedEmail,
      phone: resolvedPhone,
      country: resolvedCountry,
      directorName: resolvedDirectorName,
      directorEmail: resolvedDirectorEmail,
      contacts: sanitizedContacts,
      panNumber: (formData.panNumber || "").trim().toUpperCase(),
      panDocumentName,
      paymentMilestones: formattedMilestones,
      totalAgreedAmount,
      remainingAmount: totalAgreedAmount - (Number(initialData?.totalPaidAmount) || 0),
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors mb-2 cursor-pointer font-medium"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
            {isEdit ? "Edit Client Profile" : "Register New Client Organization"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Fill all required fields (*). Projects and manpower requirements are created in the next step.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={loading}
            className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex-1 sm:flex-initial text-center justify-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/25 transition-colors cursor-pointer flex-1 sm:flex-initial"
          >
            <Save size={15} />
            <span>{loading ? "Saving Client..." : isEdit ? "Update Client" : "Save Client"}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: COMPANY INFORMATION */}
        <FormSection
          id="company"
          title="1. Company Information"
          subtitle="Corporate identity, official business numbers, and general contact details."
          icon={Building2}
          badge="Required"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleFieldChange}
              placeholder="e.g. ABC Construction LLC"
              required
              error={errors.companyName}
              className="sm:col-span-2"
            />

            <SelectField
              label="Company Industry / Type"
              name="companyType"
              value={formData.companyType}
              onChange={handleFieldChange}
              options={COMPANY_TYPES}
            />

            <InputField
              label="Registration Number"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleFieldChange}
              placeholder="e.g. REG-984210"
            />

            <InputField
              label="Trade License Number"
              name="tradeLicenseNumber"
              value={formData.tradeLicenseNumber}
              onChange={handleFieldChange}
              placeholder="e.g. TL-DXB-2024-889"
            />

            <InputField
              label="Tax / VAT / GST Number"
              name="taxNumber"
              value={formData.taxNumber}
              onChange={handleFieldChange}
              placeholder="e.g. TRN-1002938475"
            />

            <InputField
              label="Company Website"
              name="website"
              value={formData.website}
              onChange={handleFieldChange}
              placeholder="https://www.abc-construction.ae"
            />

            <InputField
              label="Company Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFieldChange}
              placeholder="corporate@company.com"
              required
              error={errors.email}
            />

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Company Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleFieldChange}
                placeholder="+971 4 382 9100"
                className={`w-full px-3 py-2.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                  errors.phone ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                }`}
              />
              {errors.phone && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.phone}
                </p>
              )}
            </div>
          </div>
        </FormSection>

        {/* SECTION 2: DIRECTOR DETAILS */}
        <FormSection
          id="director"
          title="2. Director Details"
          subtitle="Company Director or Authorized Signatory details for official correspondence."
          icon={User}
          badge="Required"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Director Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="directorName"
                value={formData.directorName}
                onChange={handleFieldChange}
                placeholder="e.g. Mohammed Al-Rashid"
                className={`w-full px-3 py-2.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                  errors.directorName ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                }`}
              />
              {errors.directorName && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.directorName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Director Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="directorEmail"
                value={formData.directorEmail}
                onChange={handleFieldChange}
                placeholder="director@company.com"
                className={`w-full px-3 py-2.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                  errors.directorEmail ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                }`}
              />
              {errors.directorEmail && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.directorEmail}
                </p>
              )}
            </div>

          </div>
        </FormSection>

        {/* SECTION 3: CLIENT ADDRESS */}
        <FormSection
          id="address"
          title="3. Client Address & Location"
          subtitle="Overseas headquarters or operational country address."
          icon={MapPin}
          badge="Required"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleFieldChange}
              placeholder="e.g. UAE"
              required
              error={errors.country}
            />

            <InputField
              label="State / Province"
              name="state"
              value={formData.state}
              onChange={handleFieldChange}
              placeholder="e.g. Dubai / Riyadh / Doha"
            />

            <InputField
              label="City"
              name="city"
              value={formData.city}
              onChange={handleFieldChange}
              placeholder="e.g. Dubai"
            />

            <InputField
              label="Address Line 1"
              name="address"
              value={formData.address}
              onChange={handleFieldChange}
              placeholder="e.g. Level 14, Al Saada Commercial Tower"
              className="sm:col-span-2"
            />

            <InputField
              label="Address Line 2"
              name="address2"
              value={formData.address2}
              onChange={handleFieldChange}
              placeholder="e.g. Business Bay / PO Box 12345"
            />

            <InputField
              label="Postal / Zip Code"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleFieldChange}
              placeholder="e.g. 00000"
            />
          </div>
        </FormSection>

        {/* SECTION 4: PRIMARY CONTACT */}
        <FormSection
          id="contact"
          title="4. Contact Person(s)"
          subtitle="Authorized HR or Operations representative for manpower inquiries and interviews."
          icon={User}
          badge="Required"
        >
          <div className="space-y-4">
            {formData.contacts.map((contact, idx) => (
              <div
                key={contact.id || idx}
                className={`p-4 rounded-xl border ${
                  idx === 0
                    ? "bg-blue-50/20 border-blue-100"
                    : "bg-white border-dashed border-gray-300"
                } space-y-4`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span>
                      {idx === 0 ? "Primary Contact Person *" : `Secondary Contact #${idx + 1}`}
                    </span>
                  </span>

                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(idx)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Remove contact"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Full Name {idx === 0 && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => handleContactChange(idx, "name", e.target.value)}
                      placeholder="e.g. Mohammed Ahmed Al-Mansoor"
                      className={`w-full px-3 py-2.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        errors[`contact_${idx}_name`] ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                      }`}
                    />
                    {errors[`contact_${idx}_name`] && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors[`contact_${idx}_name`]}
                      </p>
                    )}
                  </div>

                  <InputField
                    label="Designation / Role"
                    value={contact.designation}
                    onChange={(e) => handleContactChange(idx, "designation", e.target.value)}
                    placeholder="e.g. HR Director / Operations Head"
                  />

                  <InputField
                    label="Department"
                    value={contact.department}
                    onChange={(e) => handleContactChange(idx, "department", e.target.value)}
                    placeholder="e.g. Human Resources"
                  />

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Official Email {idx === 0 && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => handleContactChange(idx, "email", e.target.value)}
                      placeholder="m.ahmed@company.com"
                      className={`w-full px-3 py-2.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        errors[`contact_${idx}_email`] ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                      }`}
                    />
                    {errors[`contact_${idx}_email`] && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors[`contact_${idx}_email`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Contact Phone {idx === 0 && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={contact.phone}
                      onChange={(e) => handleContactChange(idx, "phone", e.target.value)}
                      placeholder="+971 50 123 4567"
                      className={`w-full px-3 py-2.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        errors[`contact_${idx}_phone`] ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                      }`}
                    />
                    {errors[`contact_${idx}_phone`] && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors[`contact_${idx}_phone`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={contact.whatsapp}
                      onChange={(e) => handleContactChange(idx, "whatsapp", e.target.value)}
                      placeholder="+971 50 123 4567"
                      className={`w-full px-3 py-2.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        errors[`contact_${idx}_whatsapp`] ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                      }`}
                    />
                    {errors[`contact_${idx}_whatsapp`] && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors[`contact_${idx}_whatsapp`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Alternative Phone</label>
                    <input
                      type="text"
                      value={contact.alternativePhone}
                      onChange={(e) => handleContactChange(idx, "alternativePhone", e.target.value)}
                      placeholder="+971 4 382 9101"
                      className={`w-full px-3 py-2.5 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        errors[`contact_${idx}_alternativePhone`] ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                      }`}
                    />
                    {errors[`contact_${idx}_alternativePhone`] && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors[`contact_${idx}_alternativePhone`]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}


          </div>
        </FormSection>

        {/* SECTION 5: PAN CARD */}
        <FormSection
          id="pan"
          title="5. PAN Card Details"
          subtitle="Indian PAN details for client registrations."
          icon={CreditCard}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
                  setFormData((prev) => ({ ...prev, panNumber: val }));
                  if (errors.panNumber) setErrors((prev) => ({ ...prev, panNumber: "" }));
                }}
                placeholder="e.g. ABCDE1234F"
                maxLength={10}
                className={`w-full px-3 py-2.5 border rounded-lg text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                  errors.panNumber ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                }`}
              />
              {errors.panNumber && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.panNumber}
                </p>
              )}
              <p className="text-[10px] text-gray-400 mt-1">Format: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                PAN Card Document (PDF)
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                  errors.panFile ? "border-red-400 bg-red-50/30" : panFile ? "border-emerald-400 bg-emerald-50/20" : "border-gray-300"
                }`}
                onClick={() => panFileRef.current?.click()}
              >
                <input
                  ref={panFileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handlePanFileChange}
                />
                {panFile ? (
                  <div className="flex items-center gap-2 w-full">
                    <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-emerald-700 truncate">{panFile.name}</p>
                      <p className="text-[10px] text-emerald-600">{(panFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPanFile(null); }}
                      className="p-0.5 text-gray-400 hover:text-red-500 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : initialData?.panDocumentName ? (
                  <div className="flex items-center gap-2 w-full">
                    <FileCheck size={16} className="text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-blue-700 truncate">{initialData.panDocumentName}</p>
                      <p className="text-[10px] text-gray-400">Existing document · Click to replace</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload size={18} className="text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-600 font-medium">Click to upload PAN Card</p>
                    <p className="text-[10px] text-gray-400">PDF only · Max 5 MB</p>
                  </div>
                )}
              </div>
              {errors.panFile && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.panFile}
                </p>
              )}
            </div>
          </div>
        </FormSection>

        {/* SECTION 6: PAYMENT MILESTONES */}
        <FormSection
          id="milestones"
          title="6. Payment Milestones"
          subtitle="Configure agreed manpower recruitment expenses (selection advance, visa processing, deployment) payable to this client."
          icon={CreditCard}
        >
          <div className="space-y-4">
            {/* Live Calculation Banner with Direct Total Input */}
            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 border border-blue-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block mb-1.5">
                  Total Agreed Payment Amount (₹)
                </label>
                
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="relative w-48 sm:w-56">
                    <span className="absolute left-3 top-2 text-sm font-bold text-blue-600">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={totalPaymentInput}
                      onChange={handleTotalPaymentChange}
                      placeholder="e.g. 50000"
                      className="w-full pl-8 pr-3 py-1.5 text-lg font-black text-blue-950 font-mono bg-white border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoDistributeTotal}
                    title="Auto-distribute this total amount evenly across all milestones"
                    className="px-3 py-2 text-xs font-bold text-blue-700 bg-white hover:bg-blue-100/70 border border-blue-300 rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Auto Distribute
                  </button>

                  <span className="text-xs font-semibold text-blue-700 bg-blue-100/50 px-2.5 py-1.5 rounded-lg border border-blue-200">
                    {(formData.paymentMilestones || []).length} Milestones Configured
                  </span>
                </div>

                {/* Allocation Status Indicator */}
                {(() => {
                  const milestonesSum = (formData.paymentMilestones || []).reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
                  const targetTotal = Number(totalPaymentInput) || 0;
                  return (
                    <div className="flex items-center gap-3 mt-2 text-[11px] flex-wrap">
                      <span className="text-blue-800/80">
                        Milestones Total: <strong className="font-mono text-blue-900 font-bold">₹{milestonesSum.toLocaleString("en-IN")}</strong>
                      </span>
                      {milestonesSum === targetTotal && targetTotal > 0 ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          ✓ Fully allocated
                        </span>
                      ) : targetTotal > milestonesSum ? (
                        <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Unallocated: ₹{(targetTotal - milestonesSum).toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Exceeds total by ₹{(milestonesSum - targetTotal).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  );
                })()}

                <p className="text-[11px] text-blue-600/80 mt-1.5">
                  Agreed manpower recruitment expenses payable upon candidate selection & milestones.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddMilestone}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer self-start md:self-center shrink-0"
              >
                <Plus size={14} />
                <span>Add Milestone</span>
              </button>
            </div>

            {/* Milestones List */}
            {(!formData.paymentMilestones || formData.paymentMilestones.length === 0) ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <p className="text-xs text-gray-500 font-medium">No payment milestones configured (Optional).</p>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer shadow-2xs"
                >
                  <Plus size={13} />
                  <span>Add Payment Milestone (Optional)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {(formData.paymentMilestones || []).map((milestone, idx) => (
                  <div
                    key={milestone.id || idx}
                    className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs hover:border-blue-200 transition-colors space-y-3 relative"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-800">
                          {milestone.name || `Milestone ${idx + 1}`}
                        </span>
                        {Number(milestone.amount) > 0 && (
                          <span className="text-xs font-bold text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            ₹{Number(milestone.amount).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(idx)}
                        className="text-gray-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                        title="Delete this milestone"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Milestone Name */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Milestone Name
                        </label>
                        <input
                          type="text"
                          value={milestone.name}
                          onChange={(e) => handleMilestoneChange(idx, "name", e.target.value)}
                          placeholder={`e.g. Milestone ${idx + 1}`}
                          className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Payment Amount */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Payment Amount (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={milestone.amount}
                            onChange={(e) => handleMilestoneChange(idx, "amount", e.target.value)}
                            placeholder="e.g. 25000"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 bg-white rounded-lg text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Payment Trigger / Condition (Optional) */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                          Payment Trigger / Condition (Optional)
                        </label>
                        <input
                          type="text"
                          value={milestone.condition}
                          onChange={(e) => handleMilestoneChange(idx, "condition", e.target.value)}
                          placeholder="e.g. Candidate successfully selected (Optional)"
                          className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Optional Description / Remarks */}
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Optional Description or Remarks
                      </label>
                      <input
                        type="text"
                        value={milestone.description}
                        onChange={(e) => handleMilestoneChange(idx, "description", e.target.value)}
                        placeholder="e.g. Documentation processing and mobilization advance payment"
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 bg-gray-50/50 focus:outline-none focus:bg-white focus:border-blue-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.paymentMilestones && formData.paymentMilestones.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus size={13} />
                  <span>+ Add Another Milestone</span>
                </button>
              </div>
            )}
          </div>
        </FormSection>

        {/* SECTION 7: CLIENT LEGAL & COMPLIANCE DOCUMENTS */}
        <FormSection
          id="documents"
          title="7. Legal & Compliance Documents"
          icon={FileCheck}
        >
          <DocumentsList
            documents={formData.documents}
            onChange={(docs) => setFormData((prev) => ({ ...prev, documents: docs }))}
          />
        </FormSection>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 bg-white rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Once saved, you can add deployment projects and trade manpower requirements directly under this client.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex-1 sm:flex-initial text-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/25 transition-colors cursor-pointer flex-1 sm:flex-initial"
            >
              <Save size={15} />
              <span>{loading ? "Saving Client..." : isEdit ? "Update Client" : "Save Client"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ClientForm;
