import React, { useState, useEffect } from "react";
import { X, Briefcase, Plus, Check } from "lucide-react";
import InputField from "../ui/InputField.jsx";
import SelectField from "../ui/SelectField.jsx";
import CurrencySelectField from "../ui/CurrencySelectField.jsx";
const GENDERS = ["Any", "Male", "Female"];
const QUALIFICATIONS = [
  "BE / B.Tech Civil",
  "BE / B.Tech Mechanical",
  "BE / B.Tech Electrical",
  "Diploma in Engineering",
  "ITI / Vocational Trade Certificate",
  "High School / Secondary (10th/12th)",
  "Skilled / Trade Test Card Holder",
  "Certified Operator / Driver License",
  "Basic / General Labour",
  "Other",
];
const EXPERIENCES = [
  "Fresher / Entry Level",
  "1 Year",
  "2 Years",
  "3-5 Years",
  "5-8 Years",
  "8+ Years",
];
const WORKING_HOURS = [
  "8 Hours/Day (6 Days/Week)",
  "8 Hours/Day (5 Days/Week)",
  "9 Hours/Day",
  "10 Hours/Day (Shift Rotational)",
  "12 Hours/Day (Offshore Rotation)",
];
const OVERTIME_OPTIONS = [
  "Available as per Labor Law",
  "Available (2-3 hrs daily)",
  "Fixed Overtime Included",
  "Not Available",
  "Optional",
];

export function AddPositionModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  currencyDefault = "AED",
}) {
  const [formData, setFormData] = useState({
    position: "",
    quantity: "",
    experience: "2 Years",
    qualification: "ITI / Vocational Trade Certificate",
    minAge: 21,
    maxAge: 45,
    salary: "",
    currency: currencyDefault || "AED",
    gender: "Male",
    workingHours: "8 Hours/Day (6 Days/Week)",
    overtime: "Available as per Labor Law",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        position: initialData.position || "",
        quantity: initialData.quantity || "",
        experience: initialData.experience || "2 Years",
        qualification: initialData.qualification || "ITI / Vocational Trade Certificate",
        minAge: initialData.minAge ?? 21,
        maxAge: initialData.maxAge ?? 45,
        salary: initialData.salary || "",
        currency: initialData.currency || currencyDefault || "AED",
        gender: initialData.gender || "Male",
        workingHours: initialData.workingHours || "8 Hours/Day (6 Days/Week)",
        overtime: initialData.overtime || "Available as per Labor Law",
      });
    } else {
      setFormData({
        position: "",
        quantity: "",
        experience: "2 Years",
        qualification: "ITI / Vocational Trade Certificate",
        minAge: 21,
        maxAge: 45,
        salary: "",
        currency: currencyDefault || "AED",
        gender: "Male",
        workingHours: "8 Hours/Day (6 Days/Week)",
        overtime: "Available as per Labor Law",
      });
    }
    setErrors({});
  }, [initialData, isOpen, currencyDefault]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.position.trim()) {
      newErrors.position = "Position title is required";
    }
    const qty = Number(formData.quantity);
    if (!formData.quantity || isNaN(qty) || qty <= 0) {
      newErrors.quantity = "Quantity must be a positive integer greater than 0";
    }
    if (formData.salary && (isNaN(Number(formData.salary)) || Number(formData.salary) < 0)) {
      newErrors.salary = "Salary must be a valid positive number";
    }
    if (Number(formData.minAge) > Number(formData.maxAge)) {
      newErrors.minAge = "Minimum age cannot exceed maximum age";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...formData,
      quantity: Number(formData.quantity),
      salary: formData.salary ? Number(formData.salary) : 0,
      minAge: Number(formData.minAge) || 21,
      maxAge: Number(formData.maxAge) || 45,
      id: initialData?.id || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-gray-200">
          <form onSubmit={handleSubmit}>
            {/* Modal Header */}
            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                  <Briefcase size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {initialData ? "Edit Manpower Position" : "Add Manpower Position"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Define position details, headcount requirement, and trade criteria.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Position Name"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="e.g. Civil Engineer, Electrician, Mason"
                  required
                  error={errors.position}
                  className="sm:col-span-2"
                />

                <InputField
                  label="Required Quantity (Persons)"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="e.g. 20"
                  required
                  error={errors.quantity}
                  helperText="Total headcount required for this trade"
                />

                <div className="grid grid-cols-2 gap-2">
                  <InputField
                    label="Salary"
                    name="salary"
                    type="number"
                    min="0"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="e.g. 1800"
                    error={errors.salary}
                  />

                  <CurrencySelectField
                    label="Currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <SelectField
                  label="Minimum Experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  options={EXPERIENCES}
                />

                <SelectField
                  label="Qualification / Skill Level"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  options={QUALIFICATIONS}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                <InputField
                  label="Min Age"
                  name="minAge"
                  type="number"
                  min="18"
                  max="65"
                  value={formData.minAge}
                  onChange={handleChange}
                  error={errors.minAge}
                />

                <InputField
                  label="Max Age"
                  name="maxAge"
                  type="number"
                  min="18"
                  max="65"
                  value={formData.maxAge}
                  onChange={handleChange}
                />

                <SelectField
                  label="Gender Requirement"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  options={GENDERS}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <SelectField
                  label="Working Hours"
                  name="workingHours"
                  value={formData.workingHours}
                  onChange={handleChange}
                  options={WORKING_HOURS}
                />

                <SelectField
                  label="Overtime Policy"
                  name="overtime"
                  value={formData.overtime}
                  onChange={handleChange}
                  options={OVERTIME_OPTIONS}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition-colors cursor-pointer"
              >
                {initialData ? <Check size={16} /> : <Plus size={16} />}
                <span>{initialData ? "Update Position" : "Add Position"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddPositionModal;
