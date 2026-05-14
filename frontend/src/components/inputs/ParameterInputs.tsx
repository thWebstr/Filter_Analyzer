import type { FilterRequest, FreqUnit } from "../../types/filter";

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

function getFields(freqUnit: FreqUnit, isDigital: boolean): FieldConfig[] {
  const fUnit = freqUnit === "hz" ? "Hz" : "rad/s";
  const fields: FieldConfig[] = [
    {
      key:   "w_pass",
      label: `ω_pass (${fUnit})`,
      hint:  "Passband edge — normalized default: 1",
      step:  freqUnit === "hz" ? 10 : 0.1,
      min:   0.001,
    },
    {
      key:   "w_stop",
      label: `ω_stop (${fUnit})`,
      hint:  "Must be > ω_pass. Ratio 1.5–2 recommended",
      step:  freqUnit === "hz" ? 10 : 0.1,
      min:   0.001,
    },
    {
      key:   "a_pass",
      label: "A_pass (dB)",
      hint:  "Max passband attenuation. e.g. −1 or −3",
      step:  0.5,
      max:   -0.01,
    },
    {
      key:   "a_stop",
      label: "A_stop (dB)",
      hint:  "Min stopband attenuation. e.g. −40, −60",
      step:  5,
      max:   -0.01,
    },
  ];

  if (isDigital) {
    fields.push({
      key:   "sampling_freq",
      label: "Sampling Freq (Hz)",
      hint:  "Fs must be > 2 × f_stop (Nyquist)",
      step:  100,
      min:   1,
    });
  }

  return fields;
}

function validate(
  key: keyof FilterRequest,
  value: number,
  request: FilterRequest
): string | null {
  if (key === "w_pass" && value <= 0)
    return "Must be > 0";
  if (key === "w_stop" && value <= request.w_pass)
    return "Must be > ω_pass";
  if (key === "a_pass" && value >= 0)
    return "Must be negative (e.g. −1)";
  if (key === "a_stop" && value >= request.a_pass)
    return "Must be more negative than A_pass";
  if (key === "sampling_freq" && value !== null) {
    const wStopHz =
      request.freq_unit === "hz"
        ? request.w_stop
        : request.w_stop / (2 * Math.PI);
    if (value <= 2 * wStopHz)
      return "Must be > 2 × f_stop";
  }
  return null;
}

export function ParameterInputs({ request, freqUnit, onChange }: Props) {
  const fields = getFields(freqUnit, request.filter_type === "digital");

  return (
    <div className="input-group-container">
      {fields.map((field) => {
        const raw = request[field.key];
        const value = raw === null ? "" : String(raw);
        const numVal = parseFloat(value);
        const error =
          value !== "" && !isNaN(numVal)
            ? validate(field.key, numVal, request)
            : null;

        return (
          <div className="input-group" key={field.key}>
            <label className="input-label">
              <span className="input-label-text">
                {field.label}
              </span>
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