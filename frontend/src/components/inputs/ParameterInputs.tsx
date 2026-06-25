import type { FilterRequest, FreqUnit, BandConfig } from "../../types/filter";

interface Props {
  request: FilterRequest;
  freqUnit: FreqUnit;
  onChange: (patch: Partial<FilterRequest>) => void;
}

interface FieldConfig {
  key: keyof FilterRequest;
  label: string;
  hint: string;
  step: number;
  min?: number;
  max?: number;
}

// ── Dynamic fields per band config ──────────────────────────────────────────

function getFields(freqUnit: FreqUnit, isDigital: boolean, bc: BandConfig): FieldConfig[] {
  const fu = freqUnit === "hz" ? "Hz" : "rad/s";
  const step = freqUnit === "hz" ? 10 : 0.1;

  const LP_HP: FieldConfig[] = [
    {
      key:   "w_pass",
      label: bc === "highpass" ? `ω_pass — PB edge (${fu})` : `ω_pass (${fu})`,
      hint:  bc === "highpass"
        ? "Passband starts above this frequency"
        : "Passband edge — normalized default: 1",
      step, min: 0.001,
    },
    {
      key:   "w_stop",
      label: bc === "highpass" ? `ω_stop — SB edge (${fu})` : `ω_stop (${fu})`,
      hint:  bc === "highpass"
        ? "Must be < ω_pass (stopband is below passband)"
        : "Must be > ω_pass. Ratio 1.5–2 recommended",
      step, min: 0.001,
    },
  ];

  const BP_BS: FieldConfig[] = bc === "bandpass"
    ? [
        { key: "w_pass",  label: `ω_p1 — Lower PB edge (${fu})`, hint: "Lower passband edge", step, min: 0.001 },
        { key: "w_pass2", label: `ω_p2 — Upper PB edge (${fu})`, hint: "Upper passband edge — must be > ω_p1", step, min: 0.001 },
        { key: "w_stop",  label: `ω_s1 — Lower SB edge (${fu})`, hint: "Lower stopband edge — must be < ω_p1", step, min: 0.001 },
        { key: "w_stop2", label: `ω_s2 — Upper SB edge (${fu})`, hint: "Upper stopband edge — must be > ω_p2", step, min: 0.001 },
      ]
    : [
        { key: "w_pass",  label: `ω_p1 — Lower PB edge (${fu})`, hint: "Lower passband edge", step, min: 0.001 },
        { key: "w_stop",  label: `ω_s1 — Lower SB edge (${fu})`, hint: "Lower stopband edge — must be > ω_p1", step, min: 0.001 },
        { key: "w_stop2", label: `ω_s2 — Upper SB edge (${fu})`, hint: "Upper stopband edge — must be > ω_s1", step, min: 0.001 },
        { key: "w_pass2", label: `ω_p2 — Upper PB edge (${fu})`, hint: "Upper passband edge — must be > ω_s2", step, min: 0.001 },
      ];

  const freqFields: FieldConfig[] =
    bc === "bandpass" || bc === "bandstop" ? BP_BS : LP_HP;

  const gainFields: FieldConfig[] = [
    { key: "a_pass", label: "A_pass (dB)", hint: "Max passband attenuation e.g. −1 or −3", step: 0.5, max: -0.01 },
    { key: "a_stop", label: "A_stop (dB)", hint: "Min stopband attenuation e.g. −40, −60", step:  5,   max: -0.01 },
  ];

  const fields = [...freqFields, ...gainFields];

  if (isDigital) {
    fields.push({
      key:   "sampling_freq",
      label: "Sampling Freq (Hz)",
      hint:  "Fs must be > 2 × highest edge frequency",
      step:  100,
      min:   1,
    });
  }

  return fields;
}

// ── Validation ───────────────────────────────────────────────────────────────

function validate(
  key: keyof FilterRequest,
  value: number,
  request: FilterRequest
): string | null {
  const bc = request.band_config;

  if (value <= 0 && key !== "a_pass" && key !== "a_stop") return "Must be > 0";

  if (key === "a_pass" && value >= 0)  return "Must be negative (e.g. −1)";
  if (key === "a_stop" && value >= request.a_pass) return "Must be more negative than A_pass";

  if (bc === "lowpass"  && key === "w_stop" && value <= request.w_pass) return "Must be > ω_pass";
  if (bc === "highpass" && key === "w_stop" && value >= request.w_pass) return "Must be < ω_pass (HP: SB below PB)";

  if (bc === "bandpass") {
    if (key === "w_pass2" && request.w_pass && value <= request.w_pass) return "Must be > ω_p1";
    if (key === "w_stop"  && request.w_pass && value >= request.w_pass) return "Must be < ω_p1";
    if (key === "w_stop2" && request.w_pass2 && value <= request.w_pass2) return "Must be > ω_p2";
  }
  if (bc === "bandstop") {
    if (key === "w_stop"  && request.w_pass && value <= request.w_pass) return "Must be > ω_p1";
    if (key === "w_stop2" && request.w_stop && value <= request.w_stop) return "Must be > ω_s1";
    if (key === "w_pass2" && request.w_stop2 && value <= request.w_stop2) return "Must be > ω_s2";
  }

  if (key === "sampling_freq") {
    const highestFreq = request.w_stop2 ?? (bc === "highpass" ? request.w_pass : request.w_stop);
    const hz = request.freq_unit === "hz" ? highestFreq : highestFreq / (2 * Math.PI);
    if (value <= 2 * hz) return "Must be > 2 × highest edge freq";
  }

  return null;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ParameterInputs({ request, freqUnit, onChange }: Props) {
  const fields = getFields(freqUnit, request.filter_type === "digital", request.band_config);

  return (
    <div className="input-group-container">
      {fields.map((field) => {
        const raw   = request[field.key];
        const value = raw === null ? "" : String(raw);
        const numVal = parseFloat(value);
        const error  =
          value !== "" && !isNaN(numVal)
            ? validate(field.key, numVal, request)
            : null;

        return (
          <div className="input-group" key={field.key}>
            <label className="input-label">
              <span className="input-label-text">{field.label}</span>
              <span className="input-hint">{field.hint}</span>
            </label>

            <input
              type="number"
              title={field.label}
              placeholder={field.hint}
              className={`input-field ${error ? "error" : ""}`}
              value={value}
              step={field.step}
              min={field.min}
              max={field.max}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) {
                  onChange({ [field.key]: v } as Partial<FilterRequest>);
                }
              }}
            />

            {error && <span className="input-error">⚠ {error}</span>}
          </div>
        );
      })}
    </div>
  );
}