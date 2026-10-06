import React, { useState, useEffect } from "react";
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

export function ClientForm({
  initialData = null,
  isEdit = false,
  onSubmit,
  loading = false,
}) {
  const navigate = useNavigate();
  const { showToast } = useCrmToast();

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

  // Validation
  const validate = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Company email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid company email address";
    }
    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    const primary = formData.contacts[0] || {};
    if (!primary.name || !primary.name.trim()) {
      newErrors.contact_0_name = "Primary contact full name is required";
    }
    if (!primary.email || !primary.email.trim()) {
      newErrors.contact_0_email = "Primary contact email is required";
    }
    if (!primary.phone || !primary.phone.trim()) {
      newErrors.contact_0_phone = "Primary contact phone is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showToast("Please fill all required client fields.", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
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
            Step 1: Register client company details. Projects and manpower requirements are created in the next step.
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

            <InputField
              label="Company Phone"
              name="phone"
              value={formData.phone}
              onChange={handleFieldChange}
              placeholder="+971 4 382 9100"
            />
          </div>
        </FormSection>

        {/* SECTION 2: CLIENT ADDRESS */}
        <FormSection
          id="address"
          title="2. Client Address & Location"
          subtitle="Overseas headquarters or operational country address."
          icon={MapPin}
          badge="Required"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CountrySelectField
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleFieldChange}
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

        {/* SECTION 3: PRIMARY CONTACT */}
        <FormSection
          id="contact"
          title="3. Primary Contact Person"
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
                  <InputField
                    label="Full Name"
                    value={contact.name}
                    onChange={(e) => handleContactChange(idx, "name", e.target.value)}
                    placeholder="e.g. Mohammed Ahmed Al-Mansoor"
                    required={idx === 0}
                    error={idx === 0 ? errors.contact_0_name : ""}
                  />

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

                  <InputField
                    label="Official Email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => handleContactChange(idx, "email", e.target.value)}
                    placeholder="m.ahmed@company.com"
                    required={idx === 0}
                    error={idx === 0 ? errors.contact_0_email : ""}
                  />

                  <InputField
                    label="Contact Phone"
                    value={contact.phone}
                    onChange={(e) => handleContactChange(idx, "phone", e.target.value)}
                    placeholder="+971 50 123 4567"
                    required={idx === 0}
                    error={idx === 0 ? errors.contact_0_phone : ""}
                  />

                  <InputField
                    label="WhatsApp Number"
                    value={contact.whatsapp}
                    onChange={(e) => handleContactChange(idx, "whatsapp", e.target.value)}
                    placeholder="+971 50 123 4567"
                  />

                  <InputField
                    label="Alternative Phone"
                    value={contact.alternativePhone}
                    onChange={(e) => handleContactChange(idx, "alternativePhone", e.target.value)}
                    placeholder="+971 4 382 9101"
                  />
                </div>
              </div>
            ))}
          </div>
        </FormSection>

        {/* SECTION 4: ADDITIONAL CLIENT INFORMATION */}
        <FormSection
          id="additional"
          title="4. Additional Client Information"
          subtitle="Country-specific licensing, internal operational notes, and special instructions."
          icon={FileText}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Local License / Commercial ID"
              name="localLicenseNumber"
              value={formData.localLicenseNumber}
              onChange={handleFieldChange}
              placeholder="e.g. Chamber of Commerce #55231"
            />

            <InputField
              label="Alternative Website / Portal"
              name="companyWebsite"
              value={formData.companyWebsite || ""}
              onChange={handleFieldChange}
              placeholder="https://careers.company.com"
            />

            <div className="sm:col-span-2">
              <TextareaField
                label="Internal Client Notes"
                name="notes"
                value={formData.notes}
                onChange={handleFieldChange}
                placeholder="Add special notes, preferred hiring nationalities, client payment terms, or recruitment liaison instructions..."
                rows={3}
              />
            </div>
          </div>
        </FormSection>

        {/* SECTION 5: CLIENT LEGAL & COMPLIANCE DOCUMENTS */}
        <FormSection
          id="documents"
          title="5. Legal & Compliance Documents"
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
