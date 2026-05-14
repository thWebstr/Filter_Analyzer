import type { FilterDomain } from "../../types/filter";

interface Props {
  value: FilterDomain;
  onChange: (v: FilterDomain) => void;
}

export function FilterTypeSelector({ value, onChange }: Props) {
  return (
    <div>
      <p className="sidebar__label">Filter Domain</p>
      <div className="toggle-group">
        <button
          className={`toggle-btn ${value === "analog" ? "active" : ""}`}
          onClick={() => onChange("analog")}
        >
          Analog
        </button>
        <button
          className={`toggle-btn ${value === "digital" ? "active" : ""}`}
          onClick={() => onChange("digital")}
        >
          Digital IIR
        </button>
      </div>
    </div>
  );
}