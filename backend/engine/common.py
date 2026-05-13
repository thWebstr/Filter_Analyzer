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
    phase_deg = []
    group_delay = []

    num = np.array(poly_num)
    den = np.array(poly_den)

    for w in frequencies:
        jw = 1j * w
        H = np.polyval(num, jw) / np.polyval(den, jw)

        # Magnitude in dB
        mag = abs(H)
        mag_db = 20 * math.log10(mag) if mag > 1e-12 else -240.0
        magnitude_db.append(mag_db)

        # Phase in degrees
        phase = math.degrees(cmath_phase(H))
        phase_deg.append(phase)

    # Group delay: -d(phase)/dw  numerically
    phase_rad = [math.radians(p) for p in phase_deg]
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