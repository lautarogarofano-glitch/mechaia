export function TurbulenceFilter() {
  return (
    <svg
      className="absolute w-0 h-0 pointer-events-none"
      aria-hidden
      focusable="false"
    >
      <defs>
        <filter id="liquid-glass" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.009"
            numOctaves="2"
            seed="3"
            result="turb"
          >
            <animate
              attributeName="baseFrequency"
              dur="11s"
              values="0.006;0.014;0.006"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="turb" scale="48" />
        </filter>

        <filter id="liquid-blob" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008"
            numOctaves="3"
            seed="7"
            result="turb"
          >
            <animate
              attributeName="baseFrequency"
              dur="18s"
              values="0.005;0.012;0.005"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="turb" scale="80" />
        </filter>
      </defs>
    </svg>
  );
}
