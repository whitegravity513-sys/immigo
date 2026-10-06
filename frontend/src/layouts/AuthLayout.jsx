import { DashboardWatermark } from "../components/common/ImmiGoLogo.jsx";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between relative overflow-x-hidden selection:bg-blue-600 selection:text-white">
      <DashboardWatermark />
      <div className="relative z-10 w-full flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
