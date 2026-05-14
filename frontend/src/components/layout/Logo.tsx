import { useEffect, useRef } from "react";

interface LogoProps {
  animate?: boolean;
  size?: "sm" | "md" | "lg";
  onAnimationComplete?: () => void;
}

const SIZES = {
  sm: { iconW: 32,  iconH: 24, strokeW: 1.5, fontSize: 14, gap: 8  },
  md: { iconW: 48,  iconH: 36, strokeW: 2,   fontSize: 18, gap: 10 },
  lg: { iconW: 120, iconH: 90, strokeW: 3,   fontSize: 36, gap: 20 },
};

function buildWavePoints(w: number, h: number): string {
  const mid = h / 2;

  // Each triangle: peak up, back to mid, peak down, back to mid
  // Amplitude diminishes left to right — filter rolloff effect
  const amplitudes = [
    0.90, 0.90,   // triangle 1 — tallest
    0.65, 0.65,   // triangle 2
    0.42, 0.42,   // triangle 3
    0.22, 0.22,   // triangle 4
    0.10, 0.10,   // triangle 5 — nearly flat
  ];

  const segments = amplitudes.length; // 10 half-cycles
  const segW = w / segments;

  const points: [number, number][] = [[0, mid]];

  amplitudes.forEach((amp, i) => {
    const x1 = (i + 0.5) * segW;
    const x2 = (i + 1)   * segW;
    const direction = i % 2 === 0 ? -1 : 1; // alternate up/down
    points.push([x1, mid + direction * amp * (h / 2 - 2)]);
    points.push([x2, mid]);
  });

  return points.map((p) => p.join(",")).join(" ");
}

export function Logo({
  animate = false,
  size = "md",
  onAnimationComplete,
}: LogoProps) {
  const pathRef = useRef<SVGPolylineElement>(null);

  const { iconW, iconH, strokeW, fontSize } = SIZES[size];
  const points = buildWavePoints(iconW, iconH);

  useEffect(() => {
    if (!animate || !pathRef.current) return;

    const el = pathRef.current;

    // Measure total path length
    const length = el.getTotalLength ? el.getTotalLength() : 400;

    // Start fully hidden
    el.style.strokeDasharray  = `${length}`;
    el.style.strokeDashoffset = `${length}`;

    // Small delay so the browser registers the initial state
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "stroke-dashoffset 900ms cubic-bezier(0.4, 0, 0.2, 1)";
        el.style.strokeDashoffset = "0";
      });
    });

    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, 1000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [animate, onAnimationComplete]);

  return (
    <div className={`logo logo--${size}`}>
      {/* Icon — waveform in a box */}
      <svg
        width={iconW}
        height={iconH}
        viewBox={`0 0 ${iconW} ${iconH}`}
        xmlns="http://www.w3.org/2000/svg"
        className="logo__icon"
      >
        {/* Panel background */}
        <rect
          width={iconW}
          height={iconH}
          rx={size === "lg" ? 10 : size === "md" ? 6 : 4}
          fill="#13161E"
          stroke="#252A3A"
          strokeWidth="1"
        />

        {/* Centre baseline (subtle) */}
        <line
          x1={0}    y1={iconH / 2}
          x2={iconW} y2={iconH / 2}
          stroke="#252A3A"
          strokeWidth="0.75"
        />

        {/* Glow — duplicate path behind, blurred */}
        <polyline
          points={points}
          fill="none"
          stroke="#00D4FF"
          strokeWidth={strokeW + 3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.12"
        />

        {/* Main waveform — this is the one that animates */}
        <polyline
          ref={pathRef}
          points={points}
          fill="none"
          stroke="#00D4FF"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Wordmark */}
      <div className="logo__wordmark" style={{ fontSize }}>
        <span className="logo__wordmark-accent">Filter</span>
        <span>Analyzer</span>
      </div>
    </div>
  );
}