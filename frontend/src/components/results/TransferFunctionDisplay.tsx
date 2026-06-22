import type { FilterResult } from "../../types/filter";

interface Props {
  result: FilterResult;
}

function formatPoly(coeffs: number[], variable: string): string {
  return coeffs
    .map((c, i) => {
      const power = coeffs.length - 1 - i;
      const coeff = c.toFixed(4);
      if (power === 0) return coeff;
      if (power === 1) return `${coeff}${variable}`;
      return `${coeff}${variable}^{${power}}`;
    })
    .join(" + ")
    .replace(/\+ -/g, "- ");
}

export function TransferFunctionDisplay({ result }: Props) {
  const variable = result.filter_type === "digital" ? "z^{-1}" : "s";

  const numStr = result.poly_num.length === 1
    ? result.poly_num[0].toFixed(6)
    : formatPoly(result.poly_num, variable);

  const denStr = formatPoly(result.poly_den, variable);

  return (
    <div className="tf-card">
      <p className="tf-card__title">Transfer Function H({result.filter_type === "digital" ? "z" : "s"})</p>

      <div className="tf-display">
        <div className="tf-equation">
          {/* Numerator */}
          <div className="tf-numerator">
            {numStr}
          </div>

          {/* Dividing line */}
          <div className="tf-divider" />

          {/* Denominator */}
          <div className="tf-denominator">
            {denStr}
          </div>
        </div>
      </div>

      {/* Digital coefficients */}
      {result.digital_coeffs && (
        <div className="tf-digital">
          <p className="tf-digital__title">
            Difference Equation Coefficients
          </p>
          <div className="tf-digital__coeffs">
            <div>b = [{result.digital_coeffs.b.map((v) => v.toFixed(6)).join(", ")}]</div>
            <div className="tf-digital__a">
              a = [{result.digital_coeffs.a.map((v) => v.toFixed(6)).join(", ")}]
            </div>
          </div>
        </div>
      )}
    </div>
  );
}