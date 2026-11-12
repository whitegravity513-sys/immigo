import DateInput from "../../../common/DateInput.jsx";

export function AssignProjectModal({
  isOpen,
  onClose,
  allProjects,
  assignProjectForm,
  setAssignProjectForm,
  onSubmit,
  actionLoading,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border-l border-slate-800 max-w-md w-full h-[100dvh] p-4 sm:p-6 space-y-4 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">Assign Project to Vendor</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Select Project *</label>
            <select
              value={assignProjectForm.projectId}
              onChange={(e) => setAssignProjectForm({ ...assignProjectForm, projectId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs cursor-pointer"
              required
            >
              <option value="">Select an active project</option>
              {allProjects.map((p) => (
                <option key={p.id || p.projectId} value={p.projectId || p.id}>
                  {p.projectName || p.name} ({p.projectId || p.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Assignment Terms / Notes</label>
            <textarea
              rows="3"
              value={assignProjectForm.notes}
              onChange={(e) => setAssignProjectForm({ ...assignProjectForm, notes: e.target.value })}
              placeholder="e.g. Quota: 25 welders, Net 30 payment terms..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div className="pt-2 flex flex-wrap justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? "Assigning..." : "Assign Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateHRModal({
  isOpen,
  onClose,
  createHRForm,
  setCreateHRForm,
  onSubmit,
  actionLoading,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border-l border-slate-800 max-w-md w-full h-[100dvh] p-4 sm:p-6 space-y-4 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">Create Vendor HR Account</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-300 font-bold mb-1">HR Full Name *</label>
            <input
              type="text"
              required
              value={createHRForm.name}
              onChange={(e) => setCreateHRForm({ ...createHRForm, name: e.target.value })}
              placeholder="e.g. Priya Sharma"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">HR Login Email *</label>
            <input
              type="email"
              required
              value={createHRForm.email}
              onChange={(e) => setCreateHRForm({ ...createHRForm, email: e.target.value })}
              placeholder="e.g. hr@agency.com"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Password *</label>
            <input
              type="password"
              required
              value={createHRForm.password}
              onChange={(e) => setCreateHRForm({ ...createHRForm, password: e.target.value })}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Phone Number</label>
            <input
              type="text"
              value={createHRForm.phone}
              onChange={(e) => setCreateHRForm({ ...createHRForm, phone: e.target.value })}
              placeholder="e.g. 9876543210"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div className="pt-2 flex flex-wrap justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? "Creating..." : "Create HR Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateMilestoneModal({
  isOpen,
  onClose,
  projects,
  milestoneForm,
  setMilestoneForm,
  onSubmit,
  actionLoading,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border-l border-slate-800 max-w-md w-full h-[100dvh] p-4 sm:p-6 space-y-4 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">Create Payment Milestone</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Milestone Name *</label>
            <input
              type="text"
              required
              value={milestoneForm.milestoneName}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, milestoneName: e.target.value })}
              placeholder="e.g. Trade Test & Medical Completion (30%)"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Select Project</label>
              <select
                value={milestoneForm.projectId}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, projectId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs cursor-pointer"
              >
                <option value="">General (All Projects)</option>
                {projects.map((p) => (
                  <option key={p.projectId || p.id} value={p.projectId || p.id}>
                    {p.projectName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                value={milestoneForm.amount}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })}
                placeholder="e.g. 50000"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Release Conditions</label>
            <textarea
              rows="2"
              value={milestoneForm.conditions}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, conditions: e.target.value })}
              placeholder="e.g. Release upon biometric appointment and GCC medical clearance"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Due Date</label>
            <DateInput
              value={milestoneForm.dueDate}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs cursor-pointer"
            />
          </div>

          <div className="pt-2 flex flex-wrap justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? "Creating..." : "Create Milestone"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DirectPayModal({
  isOpen,
  onClose,
  selectedMilestone,
  payForm,
  setPayForm,
  onSubmit,
  actionLoading,
}) {
  if (!isOpen || !selectedMilestone) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border-l border-slate-800 max-w-md w-full h-[100dvh] p-4 sm:p-6 space-y-4 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Direct Milestone Settlement</h3>
            <p className="text-xs text-slate-400">{selectedMilestone.milestoneName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs font-medium">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Paid Amount (₹) *</label>
              <input
                type="number"
                required
                value={payForm.paidAmount}
                onChange={(e) => setPayForm({ ...payForm, paidAmount: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Payment Method</label>
              <select
                value={payForm.paymentMethod}
                onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs cursor-pointer"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Transaction Ref # / UTR *</label>
            <input
              type="text"
              required
              value={payForm.paymentReference}
              onChange={(e) => setPayForm({ ...payForm, paymentReference: e.target.value })}
              placeholder="e.g. HDFC2026110592817"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Remarks / Note</label>
            <input
              type="text"
              value={payForm.remarks}
              onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}
              placeholder="Direct bank disbursement"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div className="pt-2 flex flex-wrap justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Confirm & Settle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

