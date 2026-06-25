import type { ComplexNumber } from "../../types/filter";
import { downloadCSV }        from "../../utils/download";

interface Props {
  poles: ComplexNumber[];
  zeros: ComplexNumber[];
}

function fmt(v: number): string {
  return (v >= 0 ? " " : "") + v.toFixed(6);
}

function Row({
  type,
  index,
  val,
}: {
  type: "pole" | "zero";
  index: number;
  val: ComplexNumber;
}) {
  return (
    <tr>
      <td className={type}>
        {type === "pole" ? "×" : "○"} {type} {index + 1}
      </td>
      <td>{fmt(val.real)}</td>
      <td>{fmt(val.imag)}</td>
      <td>
        {(Math.sqrt(val.real ** 2 + val.imag ** 2)).toFixed(6)}
      </td>
      <td>
        {(Math.atan2(val.imag, val.real) * (180 / Math.PI)).toFixed(2)}°
      </td>
    </tr>
  );
}

export function PoleZeroTable({ poles, zeros }: Props) {
  const handleDownload = () => {
    const rows = [
      ["Type", "Real", "Imaginary", "Magnitude", "Angle (deg)"],
      ...poles.map((p, i) => [
        `pole_${i + 1}`,
        p.real,
        p.imag,
        Math.sqrt(p.real ** 2 + p.imag ** 2),
        Math.atan2(p.imag, p.real) * (180 / Math.PI),
      ]),
      ...zeros.map((z, i) => [
        `zero_${i + 1}`,
        z.real,
        z.imag,
        Math.sqrt(z.real ** 2 + z.imag ** 2),
        Math.atan2(z.imag, z.real) * (180 / Math.PI),
      ]),
    ];
    downloadCSV(rows, "filter_poles_zeros");
  };

  return (
    <div className="pz-table-container">
      <div className="table-actions">
        <button className="icon-btn" onClick={handleDownload}>
          💾 Download CSV
        </button>
      </div>
      <table className="pz-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Real (σ)</th>
            <th>Imag (jω)</th>
            <th>Magnitude</th>
            <th>Angle</th>
          </tr>
        </thead>
        <tbody>
          {poles.map((p, i) => (
            <Row key={`p-${i}`} type="pole" index={i} val={p} />
          ))}
          {zeros.map((z, i) => (
            <Row key={`z-${i}`} type="zero" index={i} val={z} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
