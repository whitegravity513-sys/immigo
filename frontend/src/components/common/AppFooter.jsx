import { ImmiGoLogo } from "./ImmiGoLogo.jsx";

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="select-none shrink-0 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-blue-100 border-t border-blue-800/80 shadow-md mt-auto h-[48px] min-h-[48px] px-4 sm:px-6 flex items-center">
      <div className="w-full flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <ImmiGoLogo size="xs" theme="light" />
        </div>

        <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] text-white font-medium">
          <span>&copy; {currentYear} ImmiGo Global Enterprise</span>
          <span className="text-cyan-400">&bull;</span>
          <span className="font-semibold text-cyan-300 tracking-wide">
            Designed by White Gravity Web Solutions
          </span>
        </div>
      </div>
    </footer>
  );
}
