export default function RememberForgotRow({ keepSignedIn = true, setKeepSignedIn, onForgotPassword }) {
  return (
    <div className="flex items-center justify-between text-xs pt-0.5">
      <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium select-none">
        <input
          type="checkbox"
          checked={keepSignedIn}
          onChange={(e) => setKeepSignedIn && setKeepSignedIn(e.target.checked)}
          className="w-4 h-4 rounded text-[#1877f2] focus:ring-blue-500 border-slate-300 accent-[#1877f2] cursor-pointer"
        />
        <span>Keep me signed in</span>
      </label>
      <button
        type="button"
        onClick={onForgotPassword}
        className="text-[#1877f2] hover:underline font-semibold cursor-pointer bg-transparent border-none p-0"
      >
        Forgot Password?
      </button>
    </div>
  );
}
