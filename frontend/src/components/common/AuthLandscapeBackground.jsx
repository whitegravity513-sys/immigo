export default function AuthLandscapeBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Sky Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#eaf6fc] via-[#daf0f9] to-[#cbeaf6]" />

      {/* Clouds Top Layer */}
      <svg className="absolute top-0 left-0 w-full h-44 opacity-80" viewBox="0 0 1440 180" preserveAspectRatio="none" fill="none">
        <path d="M80 60 C100 35, 150 35, 170 60 C190 45, 230 50, 240 70 C250 90, 240 100, 220 100 L90 100 C65 100, 60 80, 80 60 Z" fill="white" opacity="0.65" />
        <path d="M420 35 C440 15, 485 15, 505 35 C525 22, 555 28, 565 45 C575 60, 565 70, 545 70 L430 70 C410 70, 405 52, 420 35 Z" fill="white" opacity="0.5" />
        <path d="M780 50 C805 25, 855 25, 880 50 C900 35, 940 40, 950 60 C960 80, 950 90, 930 90 L790 90 C765 90, 760 70, 780 50 Z" fill="white" opacity="0.6" />
        <path d="M1160 40 C1180 20, 1220 20, 1240 40 C1255 30, 1285 35, 1295 50 C1305 65, 1295 75, 1275 75 L1170 75 C1150 75, 1145 58, 1160 40 Z" fill="white" opacity="0.45" />
      </svg>

      {/* Landscape Hills, Waves & Trees Bottom Layer */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[54vh] min-h-[350px]"
        viewBox="0 0 1440 440"
        preserveAspectRatio="none"
        fill="none"
      >
        {/* Layer 1: Far Soft Hill */}
        <path
          d="M0 220 Q320 140 640 200 T1440 170 L1440 440 L0 440 Z"
          fill="#c4e8f3"
        />

        {/* Tree 1 */}
        <g transform="translate(100, 130)">
          <path d="M18 0 C30 35, 36 75, 28 110 C24 125, 12 125, 8 110 C0 75, 6 35, 18 0 Z" fill="#3eb9ce" />
          <path d="M18 10 C24 40, 24 85, 18 120" stroke="#259ab0" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Tree 2 */}
        <g transform="translate(480, 120)">
          <path d="M16 0 C28 30, 32 65, 25 95 C21 110, 11 110, 7 95 C0 65, 4 30, 16 0 Z" fill="#44c0d4" />
          <path d="M16 10 C21 35, 21 75, 16 105" stroke="#279bb1" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Tree 3 */}
        <g transform="translate(860, 100)">
          <path d="M22 0 C38 45, 42 95, 34 140 C28 158, 16 158, 10 140 C0 95, 6 45, 22 0 Z" fill="#36b3c8" />
          <path d="M22 15 C30 50, 30 110, 22 150" stroke="#218c9f" strokeWidth="2.2" strokeLinecap="round" />
        </g>

        {/* Tree 4 */}
        <g transform="translate(1140, 115)">
          <path d="M18 0 C32 40, 36 85, 28 120 C24 135, 12 135, 8 120 C0 85, 4 40, 18 0 Z" fill="#42bfd3" />
          <path d="M18 12 C24 45, 24 95, 18 130" stroke="#279bb1" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Tree 5 */}
        <g transform="translate(1360, 95)">
          <path d="M24 0 C42 50, 46 105, 36 155 C30 175, 18 175, 12 155 C0 105, 6 50, 24 0 Z" fill="#34b1c6" />
          <path d="M24 15 C32 55, 32 120, 24 165" stroke="#1f899c" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Layer 2: Mid Hill */}
        <path
          d="M0 270 Q400 200 800 250 T1440 220 L1440 440 L0 440 Z"
          fill="#a4dde9"
        />

        {/* Mid Hill Trees */}
        <g transform="translate(640, 175)">
          <path d="M20 0 C35 40, 38 85, 30 125 C25 140, 15 140, 10 125 C0 85, 5 40, 20 0 Z" fill="#30abc0" />
          <path d="M20 12 C28 45, 28 95, 20 135" stroke="#1c8497" strokeWidth="2" strokeLinecap="round" />
        </g>

        <g transform="translate(1000, 160)">
          <path d="M22 0 C38 45, 42 95, 34 135 C28 150, 16 150, 10 135 C0 95, 6 45, 22 0 Z" fill="#34b1c6" />
          <path d="M22 15 C30 50, 30 105, 22 145" stroke="#1f899c" strokeWidth="2.2" strokeLinecap="round" />
        </g>

        {/* Layer 3: Foreground Wave */}
        <path
          d="M0 325 Q450 290 900 315 T1440 295 L1440 440 L0 440 Z"
          fill="#78c7d6"
        />

        {/* Layer 4: Lower Wave White Backing */}
        <path
          d="M0 365 Q480 348 960 358 T1440 345 L1440 440 L0 440 Z"
          fill="#ffffff"
        />

        {/* Layer 5: Accent Blue Strip */}
        <path
          d="M0 380 Q480 366 960 374 T1440 362 L1440 402 Q960 412 480 402 T0 412 Z"
          fill="#bce4f2"
        />

        {/* Layer 6: Base White Foreground */}
        <path
          d="M0 402 Q480 392 960 398 T1440 388 L1440 440 L0 440 Z"
          fill="#ffffff"
        />

        {/* Foreground Foliage Right */}
        <g transform="translate(1260, 260) scale(1.2)">
          <path d="M60 140 C50 90, 20 60, 0 50 C-10 65, 0 95, 10 120 C20 140, 50 145, 60 140 Z" fill="#249fb3" />
          <path d="M60 140 C35 105, 15 80, 0 50" stroke="#157787" strokeWidth="2.5" />
          <path d="M70 140 C85 85, 115 50, 140 35 C150 50, 140 85, 125 110 C110 135, 80 145, 70 140 Z" fill="#38bed3" />
          <path d="M70 140 C100 100, 120 70, 140 35" stroke="#2194a6" strokeWidth="2.5" />
        </g>

        {/* Foreground Foliage Left */}
        <g transform="translate(50, 280) scale(1)">
          <path d="M50 130 C30 80, 5 50, -10 40 C-15 55, -5 85, 5 110 C15 130, 40 135, 50 130 Z" fill="#28a2b6" />
          <path d="M50 130 C25 95, 10 70, -10 40" stroke="#187b8b" strokeWidth="2.2" />
        </g>
      </svg>
    </div>
  );
}
