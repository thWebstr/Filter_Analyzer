import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useRef } from "react";
import type { FrequencyResponse } from "../../types/filter";
import { downloadSVG, downloadPNG } from "../../utils/download";

interface Props {
  freqResponse: FrequencyResponse;
  freqUnit: string;
}

export function PhaseResponsePlot({ freqResponse, freqUnit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const data = freqResponse.frequency.map((f, i) => ({
    f: parseFloat(f.toFixed(4)),
    phase: parseFloat(freqResponse.phase_deg[i].toFixed(3)),
  }));

  const handleDownload = (type: "svg" | "png") => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    if (type === "svg") downloadSVG(svg, "phase_plot");
    else downloadPNG(svg, "phase_plot");
  };

  const fLabel = freqUnit === "hz" ? "Hz" : "rad/s";

  return (
    <div className="chart-container" ref={containerRef}>
      <div className="table-actions">
        <button className="icon-btn" onClick={() => handleDownload("svg")}>
          🔻 SVG
        </button>
        <button className="icon-btn" onClick={() => handleDownload("png")}>
          🖼️ PNG
        </button>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <defs>
            <pattern id="grid-minor-phase" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--color-border)" strokeWidth="0.5" opacity="0.35"/>
            </pattern>
            <pattern id="grid-major-phase" width="50" height="50" patternUnits="userSpaceOnUse">
              <rect width="50" height="50" fill="url(#grid-minor-phase)"/>
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="var(--color-border)" strokeWidth="1" opacity="0.55"/>
            </pattern>
          </defs>
          <CartesianGrid
            fill="url(#grid-major-phase)"
            stroke="none"
          />
          <XAxis
            dataKey="f"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v) => v.toFixed(1)}
            tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
            label={{
              value: fLabel,
              position: "insideBottomRight",
              offset: -4,
              fill: "var(--color-text-muted)",
              fontSize: 10,
            }}
          />
          <YAxis
            tickFormatter={(v) => `${v}°`}
            tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
            label={{
              value: "Phase (°)",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fill: "var(--color-text-muted)",
              fontSize: 10,
            }}
            width={52}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
            labelFormatter={(v) => `${Number(v).toFixed(3)} ${fLabel}`}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any) => [`${Number(v).toFixed(2)}°`, "Phase"]}
          />
          <Line
            type="monotone"
            dataKey="phase"
            stroke="var(--color-plot-phase)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: "var(--color-plot-phase)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}