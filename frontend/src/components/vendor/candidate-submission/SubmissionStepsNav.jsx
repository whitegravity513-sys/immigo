import React from "react";
import { Check } from "lucide-react";

export default function SubmissionStepsNav({ currentStep, setCurrentStep }) {
  const steps = [
    { num: 1, label: "Select Project & Trade" },
    { num: 2, label: "Select Candidates" },
    { num: 3, label: "Review & Submit" },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3">
      <div className="flex items-center justify-between max-w-xl mx-auto">
        {steps.map((st, idx) => {
          const isDone = currentStep > st.num;
          const isCurrent = currentStep === st.num;

          return (
            <React.Fragment key={st.num}>
              <button
                type="button"
                onClick={() => isDone && setCurrentStep(st.num)}
                className={`flex items-center gap-2 cursor-pointer transition ${
                  isCurrent
                    ? "text-blue-700 font-bold"
                    : isDone
                    ? "text-emerald-700 hover:text-emerald-800"
                    : "text-slate-400 cursor-not-allowed"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-xs"
                      : isDone
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {isDone ? <Check size={12} /> : st.num}
                </div>
                <span className="text-xs hidden sm:inline">{st.label}</span>
              </button>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 transition ${
                    currentStep > st.num ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

