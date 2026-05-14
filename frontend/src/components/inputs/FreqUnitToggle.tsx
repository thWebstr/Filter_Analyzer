import type { FreqUnit } from "../../types/filter";

interface Props {
  value: FreqUnit;
  onChange: (v: FreqUnit) => void;
}

export function FreqUnitToggle({ value, onChange }: Props) {
  return (
    <div className="freq-unit">
      <span className="freq-unit__label">
        Frequency unit
      </span>
      <div className="toggle-group freq-unit__toggle">
        <button
          className={`toggle-btn freq-unit__btn ${value === "rad_s" ? "active" : ""}`}
          onClick={() => onChange("rad_s")}
        >
          rad/s
        </button>
        <button
          className={`toggle-btn freq-unit__btn ${value === "hz" ? "active" : ""}`}
          onClick={() => onChange("hz")}
        >
          Hz
        </button>
      </div>
    </div>
  );
}