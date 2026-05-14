import type { Approximation } from "../../types/filter";

interface Props {
  value: Approximation;
  onChange: (v: Approximation) => void;
}

const OPTIONS: { value: Approximation; label: string; desc: string }[] = [
  { value: "butterworth",        label: "Butterworth",      desc: "Maximally flat"     },
  { value: "chebyshev",          label: "Chebyshev I",      desc: "Passband ripple"    },
  { value: "inverse_chebyshev",  label: "Chebyshev II",     desc: "Stopband ripple"    },
  { value: "elliptic",           label: "Elliptic",         desc: "Lowest order"       },
];

export function ApproxSelector({ value, onChange }: Props) {
  return (
    <div>
      <p className="sidebar__label">Approximation</p>
      <div className="approx-grid">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`approx-btn ${value === opt.value ? "active" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            <div className="approx-btn__label">{opt.label}</div>
            <div className="approx-btn__desc">{opt.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}