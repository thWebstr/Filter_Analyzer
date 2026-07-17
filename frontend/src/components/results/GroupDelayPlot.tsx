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

export function GroupDelayPlot({ freqResponse, freqUnit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const data = freqResponse.frequency.map((f, i) => ({
    f: parseFloat(f.toFixed(4)),
    gd: parseFloat(freqResponse.group_delay[i].toFixed(5)),
  }));

  const handleDownload = (type: "svg" | "png") => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    if (type === "svg") downloadSVG(svg, "group_delay_plot");
    else downloadPNG(svg, "group_delay_plot");
  };

  // Clip extreme outliers for display
  const gds = data.map((d) => d.gd).filter((v) => isFinite(v));
  const median = gds.sort((a, b) => a - b)[Math.floor(gds.length / 2)];
  const clipped = data.map((d) => ({
    ...d,
    gd: Math.abs(d.gd) > Math.abs(median) * 20 ? null : d.gd,
  }));

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
        <LineChart
          data={clipped}
          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
        >
          <defs>
            <pattern id="grid-minor-gd" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--color-border)" strokeWidth="0.5" opacity="0.35"/>
            </pattern>
            <pattern id="grid-major-gd" width="50" height="50" patternUnits="userSpaceOnUse">
              <rect width="50" height="50" fill="url(#grid-minor-gd)"/>
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="var(--color-border)" strokeWidth="1" opacity="0.55"/>
            </pattern>
          </defs>
          <CartesianGrid
            fill="url(#grid-major-gd)"
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
            tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
            label={{
              value: "Group Delay (s)",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fill: "var(--color-text-muted)",
              fontSize: 10,
            }}
            width={60}
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
            formatter={(v: any) => [`${Number(v).toFixed(5)} s`, "Group Delay"]}
          />
          <Line
            type="monotone"
            dataKey="gd"
            stroke="var(--color-plot-group-delay)"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            activeDot={{ r: 3, fill: "var(--color-plot-group-delay)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}