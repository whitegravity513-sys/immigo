import React from "react";
import vendorManpowerBanner from "../../../assets/vendor-manpower-banner.jpg";

export function VendorRegisterShowcase() {
  return (
    <>
      <div className="lg:hidden w-full relative overflow-hidden bg-slate-950 border-b border-slate-800">
        <div className="relative h-44 sm:h-52 w-full flex items-center justify-center overflow-hidden">
          <img
            src={vendorManpowerBanner}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-md opacity-35 scale-110 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
          <img
            src={vendorManpowerBanner}
            alt="Vendor Registration Showcase"
            className="relative z-10 h-full w-auto max-w-full object-contain p-2 drop-shadow-xl"
          />
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] lg:h-screen lg:sticky lg:top-0 relative items-center justify-center p-6 xl:p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800 select-none overflow-hidden">
        <img
          src={vendorManpowerBanner}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-125 pointer-events-none"
        />
        <div className="absolute inset-0 bg-radial from-transparent via-slate-950/50 to-slate-950/90 pointer-events-none" />

        <div className="relative z-10 w-full h-full flex items-center justify-center max-w-[620px] max-h-[92vh]">
          <img
            src={vendorManpowerBanner}
            alt="Partner With Us - Build Global Opportunities"
            className="w-auto h-auto max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl border border-white/10 ring-1 ring-white/10 transition-all duration-300"
          />
        </div>
      </div>
    </>
  );
}

export default VendorRegisterShowcase;
