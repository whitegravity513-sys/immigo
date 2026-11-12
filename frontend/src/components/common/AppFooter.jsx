import { ImmiGoLogo } from "./ImmiGoLogo.jsx";

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="select-none shrink-0 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-blue-100 border-t border-blue-800/80 shadow-md mt-auto min-h-[44px] sm:min-h-[48px] py-2 sm:py-1.5 px-4 sm:px-6 flex items-center">
      <div className="w-full max-w-[1680px] mx-auto flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1.5 sm:gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <ImmiGoLogo size="xs" theme="light" />
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-2.5 gap-y-0.5 text-[10px] sm:text-[11px] text-white font-medium">
          <span>&copy; {currentYear} ImmiGo Global Enterprise</span>
          <span className="text-cyan-400 hidden sm:inline">&bull;</span>
          <span className="font-semibold text-cyan-300 tracking-wide">
            Designed by White Gravity Web Solutions
          </span>
        </div>
      </div>
    </footer>
  );
}
