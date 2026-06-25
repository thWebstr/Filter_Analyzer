import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useRef } from "react";
import type { FrequencyResponse } from "../../types/filter";
import { downloadSVG, downloadPNG } from "../../utils/download";

interface Props {
  freqResponse: FrequencyResponse;
  wPass: number;
  wStop: number;
  aPass: number;
  aStop: number;
  freqUnit: string;
}

export function MagnitudeResponsePlot({
  freqResponse,
  wPass,
  wStop,
  aPass,
  aStop,
  freqUnit,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const data = freqResponse.frequency.map((f, i) => ({
    f: parseFloat(f.toFixed(4)),
    mag: parseFloat(freqResponse.magnitude_db[i].toFixed(3)),
  }));

  const handleDownload = (type: "svg" | "png") => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    if (type === "svg") downloadSVG(svg, "magnitude_plot");
    else downloadPNG(svg, "magnitude_plot");
  };

  const fLabel = freqUnit === "hz" ? "Hz" : "rad/s";
  const yMin = Math.min(aStop - 10, -120);

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
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            opacity={0.5}
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
            domain={[yMin, 5]}
            tickFormatter={(v) => `${v}`}
            tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
            label={{
              value: "Gain (dB)",
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
            formatter={(v: any) => [`${Number(v).toFixed(2)} dB`, "Gain"]}
          />

          {/* Spec lines */}
          <ReferenceLine
            x={wPass}
            stroke="var(--color-plot-spec-line)"
            strokeDasharray="4 3"
            label={{ value: "ωp", fill: "var(--color-plot-spec-line)", fontSize: 9 }}
          />
          <ReferenceLine
            x={wStop}
            stroke="var(--color-plot-spec-line)"
            strokeDasharray="4 3"
            label={{ value: "ωs", fill: "var(--color-plot-spec-line)", fontSize: 9 }}
          />
          <ReferenceLine
            y={aPass}
            stroke="var(--color-plot-spec-line)"
            strokeDasharray="4 3"
            label={{ value: "Ap", fill: "var(--color-plot-spec-line)", fontSize: 9, position: "insideTopRight" }}
          />
          <ReferenceLine
            y={aStop}
            stroke="var(--color-plot-spec-line)"
            strokeDasharray="4 3"
            label={{ value: "As", fill: "var(--color-plot-spec-line)", fontSize: 9, position: "insideTopRight" }}
          />

          <Line
            type="monotone"
            dataKey="mag"
            stroke="var(--color-plot-magnitude)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: "var(--color-plot-magnitude)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}