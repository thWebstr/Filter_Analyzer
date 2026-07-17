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
  freqMin: number;
  freqMax: number;
  onMinChange: (v: number) => void;
  onMaxChange: (v: number) => void;
  onReset: () => void;
}

export function MagnitudeResponsePlot({
  freqResponse,
  wPass,
  wStop,
  aPass,
  aStop,
  freqUnit,
  freqMin,
  freqMax,
  onMinChange,
  onMaxChange,
  onReset,
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

  const handleMinChange = (raw: string) => {
    const v = parseFloat(raw);
    if (!isNaN(v)) onMinChange(Math.max(0, v));
  };

  const handleMaxChange = (raw: string) => {
    const v = parseFloat(raw);
    if (!isNaN(v)) onMaxChange(Math.max(0, v));
  };


  return (
    <div className="chart-container" ref={containerRef}>
      {/* Toolbar — download buttons only */}
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
            <pattern id="grid-minor-mag" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--color-border)" strokeWidth="0.5" opacity="0.35"/>
            </pattern>
            <pattern id="grid-major-mag" width="50" height="50" patternUnits="userSpaceOnUse">
              <rect width="50" height="50" fill="url(#grid-minor-mag)"/>
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="var(--color-border)" strokeWidth="1" opacity="0.55"/>
            </pattern>
          </defs>
          <CartesianGrid fill="url(#grid-major-mag)" stroke="none" />
          <XAxis
            dataKey="f"
            type="number"
            domain={[freqMin, freqMax]}
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
          <ReferenceLine x={wPass} stroke="var(--color-plot-spec-line)" strokeDasharray="4 3"
            label={{ value: "ωp", fill: "var(--color-plot-spec-line)", fontSize: 9 }} />
          <ReferenceLine x={wStop} stroke="var(--color-plot-spec-line)" strokeDasharray="4 3"
            label={{ value: "ωs", fill: "var(--color-plot-spec-line)", fontSize: 9 }} />
          <ReferenceLine y={aPass} stroke="var(--color-plot-spec-line)" strokeDasharray="4 3"
            label={{ value: "Ap", fill: "var(--color-plot-spec-line)", fontSize: 9, position: "insideTopRight" }} />
          <ReferenceLine y={aStop} stroke="var(--color-plot-spec-line)" strokeDasharray="4 3"
            label={{ value: "As", fill: "var(--color-plot-spec-line)", fontSize: 9, position: "insideTopRight" }} />
          <Line type="monotone" dataKey="mag" stroke="var(--color-plot-magnitude)"
            strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "var(--color-plot-magnitude)" }} />
        </LineChart>
      </ResponsiveContainer>

      {/* Frequency range inputs — below the chart */}
      <div className="freq-range-inputs">
        <span className="freq-range-inputs__label">Freq. Range ({fLabel})</span>
        <div className="freq-range-inputs__fields">
          <label className="freq-range-inputs__field">
            <span>Min</span>
            <input
              className="input-field freq-range-inputs__input"
              type="number"
              value={freqMin}
              step="any"
              title="Minimum frequency to display"
              aria-label="Minimum frequency"
              onChange={(e) => handleMinChange(e.target.value)}
            />
          </label>
          <span className="freq-range-inputs__sep">—</span>
          <label className="freq-range-inputs__field">
            <span>Max</span>
            <input
              className="input-field freq-range-inputs__input"
              type="number"
              value={freqMax}
              step="any"
              title="Maximum frequency to display"
              aria-label="Maximum frequency"
              onChange={(e) => handleMaxChange(e.target.value)}
            />
          </label>

          <button
            className="icon-btn"
            title="Reset to full range"
            aria-label="Reset frequency range"
            onClick={onReset}
          >
            ↺ Reset
          </button>
        </div>
      </div>
    </div>
  );
}