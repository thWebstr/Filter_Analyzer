import type { BandConfig } from "../../types/filter";

interface Props {
  value: BandConfig;
  onChange: (v: BandConfig) => void;
}

const BANDS: { key: BandConfig; label: string; desc: string }[] = [
  { key: "lowpass",  label: "LP", desc: "Low Pass"  },
  { key: "highpass", label: "HP", desc: "High Pass" },
  { key: "bandpass", label: "BP", desc: "Band Pass" },
  { key: "bandstop", label: "BS", desc: "Band Stop" },
];

export function BandConfigSelector({ value, onChange }: Props) {
  return (
    <div className="band-selector">
      <p className="sidebar__label">Filter Shape</p>
      <div className="band-selector__grid">
        {BANDS.map((b) => (
          <button
            key={b.key}
            className={`band-btn ${value === b.key ? "active" : ""}`}
            onClick={() => onChange(b.key)}
            title={b.desc}
          >
            <span className="band-btn__label">{b.label}</span>
            <span className="band-btn__desc">{b.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
