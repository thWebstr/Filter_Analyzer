import math
import numpy as np


def compute_epsilon(a_pass: float) -> float:
    """
    Compute the passband ripple factor epsilon.
    Eq. 14 from Zubair & Olawale (2022).
    """
    return math.sqrt(10 ** (-0.1 * a_pass) - 1)


def get_order_mode(n: int) -> int:
    """
    Port of odev.m
    Returns 1 if n is odd, 2 if n is even.
    """
    return 1 if n % 2 != 0 else 2


def hz_to_rads(freq_hz: float) -> float:
    """Convert frequency in Hz to rad/s."""
    return 2 * math.pi * freq_hz


def rads_to_hz(freq_rads: float) -> float:
    """Convert frequency in rad/s to Hz."""
    return freq_rads / (2 * math.pi)


def normalize_frequencies(w_pass: float, w_stop: float, freq_unit: str):
    """
    Convert input frequencies to rad/s if they were given in Hz.
    Returns (w_pass_rads, w_stop_rads).
    """
    if freq_unit == "hz":
        return hz_to_rads(w_pass), hz_to_rads(w_stop)
    return w_pass, w_stop


def compute_lp_selectivity(
    band_config: str,
    w_pass: float,
    w_stop: float,
    w_pass2: float | None = None,
    w_stop2: float | None = None,
) -> tuple[float, float]:
    """Return normalized low-pass prototype edge frequencies for analog/digital transforms."""
    if band_config == "lowpass":
        return w_pass, w_stop

    if band_config == "highpass":
        return 1.0, w_pass / w_stop

    if band_config == "bandpass":
        assert w_pass2 is not None and w_stop2 is not None
        w0 = math.sqrt(w_pass * w_pass2)
        bw = w_pass2 - w_pass
        omega_s1 = abs((w_stop ** 2 - w0 ** 2) / (bw * w_stop))
        omega_s2 = abs((w_stop2 ** 2 - w0 ** 2) / (bw * w_stop2))
        return 1.0, min(omega_s1, omega_s2)

    if band_config == "bandstop":
        assert w_pass2 is not None and w_stop2 is not None
        w0 = math.sqrt(w_stop * w_stop2)
        bw = w_stop2 - w_stop
        omega_p1 = abs((w_pass ** 2 - w0 ** 2) / (bw * w_pass))
        omega_p2 = abs((w_pass2 ** 2 - w0 ** 2) / (bw * w_pass2))
        return 1.0, min(omega_p1, omega_p2)

    raise ValueError(f"Unsupported band_config: {band_config}")


def build_quadratic_factor(sigma: float, omega: float) -> list:
    """
    Build coefficients [1, B1m, B2m] for a quadratic denominator factor.
    B1m = -2 * sigma  (Eq. 23)
    B2m = sigma^2 + omega^2  (Eq. 24)
    """
    b1m = -2 * sigma
    b2m = sigma ** 2 + omega ** 2
    return [1.0, b1m, b2m]


def compute_frequency_response(
    poly_num: list,
    poly_den: list,
    w_pass: float,
    w_stop: float,
    n_points: int = 2000,
) -> dict:
    """
    Evaluate |H(jw)|, phase, and group delay over a frequency range.
    Port of pltfreq.m / pltfreq1.m logic.

    Returns dict with keys:
        frequency, magnitude_db, phase_deg, group_delay
    """
    # Frequency range: 0 to 3 * w_stop
    w_max = 3 * w_stop
    frequencies = np.linspace(0.001 * w_pass, w_max, n_points)

    magnitude_db = []
    phase_rad_raw = []

    num = np.array(poly_num)
    den = np.array(poly_den)

    for w in frequencies:
        jw = 1j * w
        H = np.polyval(num, jw) / np.polyval(den, jw)

        # Magnitude in dB
        mag = abs(H)
        mag_db = 20 * math.log10(mag) if mag > 1e-12 else -240.0
        magnitude_db.append(mag_db)

        # Phase (raw, in radians — unwrap applied after full loop)
        phase_rad_raw.append(cmath_phase(H))

    # Unwrap phase to remove ±π discontinuities, then convert to degrees
    phase_rad = np.unwrap(phase_rad_raw).tolist()
    phase_deg = [math.degrees(p) for p in phase_rad]
    group_delay = []
    freq_arr = frequencies.tolist()

    for i in range(len(freq_arr)):
        if i == 0:
            dph = phase_rad[1] - phase_rad[0]
            dw = freq_arr[1] - freq_arr[0]
        elif i == len(freq_arr) - 1:
            dph = phase_rad[-1] - phase_rad[-2]
            dw = freq_arr[-1] - freq_arr[-2]
        else:
            dph = phase_rad[i + 1] - phase_rad[i - 1]
            dw = freq_arr[i + 1] - freq_arr[i - 1]
        gd = -dph / dw if dw != 0 else 0.0
        group_delay.append(gd)

    return {
        "frequency": freq_arr,
        "magnitude_db": magnitude_db,
        "phase_deg": phase_deg,
        "group_delay": group_delay,
    }


def cmath_phase(c: complex) -> float:
    """Return phase angle of complex number in radians."""
    return math.atan2(c.imag, c.real)


def poles_to_complex_list(poles: list) -> list:
    """
    Convert list of (sigma, omega) tuples to list of dicts
    with real and imag keys, including conjugate pairs.
    """
    result = []
    for sigma, omega in poles:
        result.append({"real": sigma, "imag": omega})
        if abs(omega) > 1e-10:
            result.append({"real": sigma, "imag": -omega})
    return result


def zeros_to_complex_list(zeros: list) -> list:
    """
    Convert list of (sigma_z, omega_z) tuples to list of dicts
    with real and imag keys, including conjugate pairs.
    """
    result = []
    for sigma_z, omega_z in zeros:
        result.append({"real": sigma_z, "imag": omega_z})
        if abs(omega_z) > 1e-10:
            result.append({"real": sigma_z, "imag": -omega_z})
    return result