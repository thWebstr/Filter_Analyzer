import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { FrequencyResponse } from "../../types/filter";


interface Props {
  freqResponse: FrequencyResponse;
  freqUnit: string;
}

export function GroupDelayPlot({ freqResponse, freqUnit }: Props) {
  const data = freqResponse.frequency.map((f, i) => ({
    f: parseFloat(f.toFixed(4)),
    gd: parseFloat(freqResponse.group_delay[i].toFixed(5)),
  }));

  // Clip extreme outliers for display
  const gds = data.map((d) => d.gd).filter((v) => isFinite(v));
  const median = gds.sort((a, b) => a - b)[Math.floor(gds.length / 2)];
  const clipped = data.map((d) => ({
    ...d,
    gd: Math.abs(d.gd) > Math.abs(median) * 20 ? null : d.gd,
  }));

  const fLabel = freqUnit === "hz" ? "Hz" : "rad/s";

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart
        data={clipped}
        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
      >
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
  );
}