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
      });
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

    // Company info
    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Company email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Enter a valid company email (e.g. info@company.com)";
    }
    if (formData.phone.trim() && !isValidPhone(formData.phone)) {
      newErrors.phone = "Enter a valid phone number (7–15 digits)";
    }
    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    // Director details validation
    if (!formData.directorName.trim()) {
      newErrors.directorName = "Director name is required";
    }
    if (!formData.directorEmail.trim()) {
      newErrors.directorEmail = "Director email is required";
    } else if (!isValidEmail(formData.directorEmail)) {
      newErrors.directorEmail = "Enter a valid director email (e.g. director@company.com)";
    }
    
    // PAN validation
    if (formData.panNumber.trim() && !isValidPAN(formData.panNumber)) {
      newErrors.panNumber = "Enter a valid Indian PAN format (e.g. ABCDE1234F)";
    }

    // Primary contact validation
    const primary = formData.contacts[0] || {};
    if (!primary.name || !primary.name.trim()) {
      newErrors.contact_0_name = "Primary contact full name is required";
    }
    if (!primary.email || !primary.email.trim()) {
      newErrors.contact_0_email = "Primary contact email is required";
    } else if (!isValidEmail(primary.email)) {
      newErrors.contact_0_email = "Enter a valid email for primary contact";
    }
    if (!primary.phone || !primary.phone.trim()) {
      newErrors.contact_0_phone = "Primary contact phone is required";
    } else if (!isValidPhone(primary.phone)) {
      newErrors.contact_0_phone = "Enter a valid phone number for primary contact";
    }
    if (primary.whatsapp && !isValidPhone(primary.whatsapp)) {
      newErrors.contact_0_whatsapp = "Enter a valid WhatsApp number";
    }
    if (primary.alternativePhone && !isValidPhone(primary.alternativePhone)) {
      newErrors.contact_0_alternativePhone = "Enter a valid alternative phone";
    }

    // Validate additional contacts
    formData.contacts.forEach((contact, idx) => {
      if (idx === 0) return;
      if (contact.email && !isValidEmail(contact.email)) {
        newErrors[`contact_${idx}_email`] = "Enter a valid email";
      }
      if (contact.phone && !isValidPhone(contact.phone)) {
        newErrors[`contact_${idx}_phone`] = "Enter a valid phone number";
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showToast("Please fill all required fields correctly.", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!validate()) return;

    const panDocumentName = panFile
      ? panFile.name
      : initialData?.panDocumentName || "";

    onSubmit({
      ...formData,
      panNumber: formData.panNumber.trim().toUpperCase(),
      panDocumentName,
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

        {/* SECTION 6: CLIENT LEGAL & COMPLIANCE DOCUMENTS */}
        <FormSection
          id="documents"
          title="6. Legal & Compliance Documents"
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
