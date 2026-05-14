import type { ComplexNumber } from "../../types/filter";

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
  return (
    <div className="pz-table-container">
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