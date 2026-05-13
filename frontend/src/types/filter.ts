export type Approximation =
  | "butterworth"
  | "chebyshev"
  | "inverse_chebyshev"
  | "elliptic";

export type FilterDomain = "analog" | "digital";
export type FreqUnit = "rad_s" | "hz";

export interface FilterRequest {
  approximation: Approximation;
  filter_type: FilterDomain;
  w_pass: number;
  w_stop: number;
  a_pass: number;
  a_stop: number;
  freq_unit: FreqUnit;
  sampling_freq: number | null;
}

export interface ComplexNumber {
  real: number;
  imag: number;
}

export interface FrequencyResponse {
  frequency: number[];
  magnitude_db: number[];
  phase_deg: number[];
  group_delay: number[];
}

export interface DigitalCoeffs {
  b: number[];
  a: number[];
}

export interface FilterResult {
  approximation: string;
  filter_type: string;
  order: number;
  epsilon: number;
  poles: ComplexNumber[];
  zeros: ComplexNumber[];
  poly_num: number[];
  poly_den: number[];
  freq_response: FrequencyResponse;
  locus_type: string;
  locus_params: Record<string, number>;
  digital_coeffs: DigitalCoeffs | null;
  warnings: string[];
}

export interface TabState {
  id: string;
  name: string;
  request: FilterRequest;
  result: FilterResult | null;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  freqUnit: FreqUnit;
}

export type ActivePlot =
  | "magnitude"
  | "phase"
  | "group_delay"
  | "pole_zero";