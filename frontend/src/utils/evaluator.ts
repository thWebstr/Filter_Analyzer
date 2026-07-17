import type { FrequencyResponse } from "../types/filter";

function polyval(coeff: number[], s: { real: number; imag: number }): { real: number; imag: number } {
  if (coeff.length === 0) return { real: 0, imag: 0 };
  let resReal = coeff[0];
  let resImag = 0;
  for (let i = 1; i < coeff.length; i++) {
    const nextReal = resReal * s.real - resImag * s.imag + coeff[i];
    const nextImag = resReal * s.imag + resImag * s.real;
    resReal = nextReal;
    resImag = nextImag;
  }
  return { real: resReal, imag: resImag };
}


function complexDiv(
  num: { real: number; imag: number },
  den: { real: number; imag: number }
): { real: number; imag: number } {
  const denSq = den.real * den.real + den.imag * den.imag;
  if (denSq < 1e-24) return { real: 0, imag: 0 };
  return {
    real: (num.real * den.real + num.imag * den.imag) / denSq,
    imag: (num.imag * den.real - num.real * den.imag) / denSq,
  };
}

function unwrap(phaseRad: number[]): number[] {
  const unwrapped = [...phaseRad];
  let offset = 0;
  for (let i = 1; i < phaseRad.length; i++) {
    const diff = phaseRad[i] - phaseRad[i - 1];
    if (diff < -Math.PI) {
      offset += 2 * Math.PI;
    } else if (diff > Math.PI) {
      offset -= 2 * Math.PI;
    }
    unwrapped[i] += offset;
  }
  return unwrapped;
}

export function computeClientFreqResponse(
  polyNum: number[],
  polyDen: number[],
  digitalCoeffs: { b: number[]; a: number[] } | null,
  filterType: "analog" | "digital" | string,
  fs: number | null,
  freqMin: number,
  freqMax: number,
  freqUnit: "hz" | "rad_s" | string,
  nPoints: number = 2000
): FrequencyResponse {
  const frequencies: number[] = [];
  const minF = Math.max(0.0001, freqMin);
  const maxF = Math.max(minF + 0.001, freqMax);
  const step = (maxF - minF) / (nPoints - 1);
  for (let i = 0; i < nPoints; i++) {
    frequencies.push(minF + i * step);
  }

  const magnitude_db: number[] = [];
  const phase_rad_raw: number[] = [];

  const isDigital = filterType === "digital";

  frequencies.forEach((f) => {
    // Determine omega (rad/s) for evaluation
    let w = f;
    if (freqUnit === "hz") {
      w = 2 * Math.PI * f;
    }

    let H: { real: number; imag: number };
    if (isDigital && digitalCoeffs) {
      // z^-1 = cos(w * Ts) - j * sin(w * Ts)
      const fsVal = fs || 1;
      const Ts = 1 / fsVal;
      const theta = w * Ts;
      const z_inv = { real: Math.cos(theta), imag: -Math.sin(theta) };

      // Reverse coeffs because polyval evaluates c_0 * x^N + ...
      const b_rev = [...digitalCoeffs.b].reverse();
      const a_rev = [...digitalCoeffs.a].reverse();

      const numVal = polyval(b_rev, z_inv);
      const denVal = polyval(a_rev, z_inv);

      H = complexDiv(numVal, denVal);
    } else {
      // s = j * w
      const s = { real: 0, imag: w };
      const numVal = polyval(polyNum, s);
      const denVal = polyval(polyDen, s);

      H = complexDiv(numVal, denVal);
    }

    const mag = Math.sqrt(H.real * H.real + H.imag * H.imag);
    const magDb = mag > 1e-12 ? 20 * Math.log10(mag) : -240;
    magnitude_db.push(magDb);

    const phase = Math.atan2(H.imag, H.real);
    phase_rad_raw.push(phase);
  });

  const phase_rad = unwrap(phase_rad_raw);
  const phase_deg = phase_rad.map((p) => (p * 180) / Math.PI);

  const group_delay: number[] = [];
  // Numerical differentiator w.r.t rad/s frequency
  for (let i = 0; i < nPoints; i++) {
    let wCurr = frequencies[i];
    let wPrev = i > 0 ? frequencies[i - 1] : frequencies[i];
    let wNext = i < nPoints - 1 ? frequencies[i + 1] : frequencies[i];

    if (freqUnit === "hz") {
      wCurr *= 2 * Math.PI;
      wPrev *= 2 * Math.PI;
      wNext *= 2 * Math.PI;
    }

    let dph: number;
    let dw: number;

    if (i === 0) {
      dph = phase_rad[1] - phase_rad[0];
      dw = wNext - wCurr;
    } else if (i === nPoints - 1) {
      dph = phase_rad[nPoints - 1] - phase_rad[nPoints - 2];
      dw = wCurr - wPrev;
    } else {
      dph = phase_rad[i + 1] - phase_rad[i - 1];
      dw = wNext - wPrev;
    }

    const gd = dw !== 0 ? -dph / dw : 0;
    group_delay.push(gd);
  }

  return {
    frequency: frequencies,
    magnitude_db,
    phase_deg,
    group_delay,
  };
}
