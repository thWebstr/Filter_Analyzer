import math
import numpy as np
from scipy import signal


def apply_bilinear_transform(
    sampling_freq: float,
    w_pass: float,
    w_stop: float,
    a_pass: float,
    a_stop: float,
    freq_unit: str,
    design_fn,
) -> dict:
    """
    Convert an analog filter design to a digital IIR filter
    using the Bilinear Transform with pre-warping.

    Parameters
    ----------
    sampling_freq : float
        Sampling frequency in Hz.
    w_pass, w_stop : float
        Original user-specified frequencies (in freq_unit units).
    a_pass, a_stop : float
        Passband/stopband gains in dB.
    freq_unit : str
        'rad_s' or 'hz'
    design_fn : callable
        The analog design function to call with pre-warped frequencies.

    Returns
    -------
    dict — result dict with digital_coeffs and digital frequency response.
    """

    Fs = sampling_freq
    T = 1 / Fs

    # --- Step 1: Convert user frequencies to rad/s ---
    if freq_unit == "hz":
        w_pass_rads = 2 * math.pi * w_pass
        w_stop_rads = 2 * math.pi * w_stop
    else:
        w_pass_rads = w_pass
        w_stop_rads = w_stop

    # --- Step 2: Pre-warp critical frequencies ---
    # Eq: w_analog = (2/T) * tan(w_digital * T / 2)
    w_pass_analog = (2 / T) * math.tan(w_pass_rads * T / 2)
    w_stop_analog = (2 / T) * math.tan(w_stop_rads * T / 2)

    # --- Step 3: Re-design analog prototype with pre-warped frequencies ---
    analog_prewarped = design_fn(
        w_pass=w_pass_analog,
        w_stop=w_stop_analog,
        a_pass=a_pass,
        a_stop=a_stop,
    )

    poly_num = analog_prewarped["poly_num"]
    poly_den = analog_prewarped["poly_den"]

    # --- Step 4: Apply BLT via scipy bilinear_zpk or bilinear ---
    # Use scipy.signal.bilinear on polynomial coefficients
    b_digital, a_digital = signal.bilinear(poly_num, poly_den, fs=Fs)

    # --- Step 5: Compute digital frequency response ---
    w_digital, H_digital = signal.freqz(b_digital, a_digital, worN=2000)

    # Convert w from rad/sample to Hz
    freq_hz = (w_digital * Fs) / (2 * math.pi)
    magnitude_db = 20 * np.log10(np.abs(H_digital) + 1e-12)
    phase_deg = np.degrees(np.unwrap(np.angle(H_digital)))

    # Group delay
    _, gd = signal.group_delay((b_digital, a_digital), w=w_digital)

    # Convert group delay from samples to seconds
    gd_seconds = (gd / Fs).tolist()

    # --- Step 6: Compute digital poles and zeros ---
    z_zeros, z_poles, _ = signal.tf2zpk(b_digital, a_digital)

    digital_poles = [{"real": float(p.real), "imag": float(p.imag)}
                     for p in z_poles]
    digital_zeros = [{"real": float(z.real), "imag": float(z.imag)}
                     for z in z_zeros]

    # --- Step 7: Assemble result ---
    result = analog_prewarped.copy()
    result["poles"] = digital_poles
    result["zeros"] = digital_zeros
    result["digital_coeffs"] = {
        "b": b_digital.tolist(),
        "a": a_digital.tolist(),
    }
    result["freq_response"] = {
        "frequency": freq_hz.tolist(),
        "magnitude_db": magnitude_db.tolist(),
        "phase_deg": phase_deg.tolist(),
        "group_delay": gd_seconds,
    }
    result["locus_type"] = result.get("locus_type", "ellipse")

    return result