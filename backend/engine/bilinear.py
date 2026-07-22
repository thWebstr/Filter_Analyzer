import math
import numpy as np
from scipy import signal
from scipy.signal import tf2zpk, zpk2tf, lp2hp_zpk, lp2bp_zpk, lp2bs_zpk
from engine.common import compute_lp_selectivity


def apply_bilinear_transform(
    sampling_freq: float,
    w_pass: float,
    w_stop: float,
    a_pass: float,
    a_stop: float,
    freq_unit: str,
    design_fn,
    band_config: str = "lowpass",
    w_pass2: float | None = None,
    w_stop2: float | None = None,
) -> dict:
    """
    Convert an analog filter design to a digital IIR filter
    using the Bilinear Transform with pre-warping.
    Supports lowpass, highpass, bandpass, and bandstop configurations.
    """

    Fs = sampling_freq
    T = 1 / Fs

    # --- Step 1: Convert user frequencies to rad/s ---
    def to_rads(v):
        return 2 * math.pi * v if freq_unit == "hz" else v

    w_pass_rads  = to_rads(w_pass)
    w_stop_rads  = to_rads(w_stop)
    w_pass2_rads = to_rads(w_pass2) if w_pass2 is not None else None
    w_stop2_rads = to_rads(w_stop2) if w_stop2 is not None else None

    # --- Step 2: Pre-warp critical frequencies ---
    def prewarp(w):
        return (2 / T) * math.tan(w * T / 2)

    wp1 = prewarp(w_pass_rads)
    ws1 = prewarp(w_stop_rads)
    wp2 = prewarp(w_pass2_rads) if w_pass2_rads else None
    ws2 = prewarp(w_stop2_rads) if w_stop2_rads else None

    # --- Step 3: Compute LP prototype selectivity ---
    w_pass_lp, w_stop_lp = compute_lp_selectivity(band_config, wp1, ws1, wp2, ws2)

    # --- Step 4: Design LP prototype ---
    analog_lp = design_fn(
        w_pass=w_pass_lp,
        w_stop=w_stop_lp,
        a_pass=a_pass,
        a_stop=a_stop,
    )

    poly_num_lp = analog_lp["poly_num"]
    poly_den_lp = analog_lp["poly_den"]

    # --- Step 5: Apply band transform to get the analog prototype ---
    if band_config == "lowpass":
        poly_num_analog = poly_num_lp
        poly_den_analog = poly_den_lp
    else:
        z, p, k = tf2zpk(poly_num_lp, poly_den_lp)

        if band_config == "highpass":
            z, p, k = lp2hp_zpk(z, p, k, wo=wp1)
        elif band_config == "bandpass":
            wo = math.sqrt(wp1 * wp2)
            bw = wp2 - wp1
            z, p, k = lp2bp_zpk(z, p, k, wo=wo, bw=bw)
        elif band_config == "bandstop":
            wo = math.sqrt(ws1 * ws2)
            bw = ws2 - ws1
            z, p, k = lp2bs_zpk(z, p, k, wo=wo, bw=bw)

        poly_num_analog, poly_den_analog = zpk2tf(z, p, k)
        poly_num_analog = np.real(poly_num_analog).tolist()
        poly_den_analog = np.real(poly_den_analog).tolist()

    # --- Step 6: Apply BLT via scipy bilinear ---
    b_digital, a_digital = signal.bilinear(poly_num_analog, poly_den_analog, fs=Fs)

    # --- Step 7: Compute digital frequency response ---
    w_digital, H_digital = signal.freqz(b_digital, a_digital, worN=2000)

    freq_hz        = (w_digital * Fs) / (2 * math.pi)
    magnitude_db   = 20 * np.log10(np.abs(H_digital) + 1e-12)
    phase_deg      = np.degrees(np.unwrap(np.angle(H_digital)))
    _, gd          = signal.group_delay((b_digital, a_digital), w=w_digital)
    gd_seconds     = (gd / Fs).tolist()

    # --- Step 8: Compute digital poles and zeros ---
    z_zeros, z_poles, _ = signal.tf2zpk(b_digital, a_digital)

    digital_poles = [{"real": float(p.real), "imag": float(p.imag)} for p in z_poles]
    digital_zeros = [{"real": float(z.real), "imag": float(z.imag)} for z in z_zeros]

    # --- Step 9: Assemble result ---
    result = analog_lp.copy()
    result["poles"]         = digital_poles
    result["zeros"]         = digital_zeros
    result["poly_num"]      = b_digital.tolist()
    result["poly_den"]      = a_digital.tolist()
    result["digital_coeffs"] = {
        "b": b_digital.tolist(),
        "a": a_digital.tolist(),
    }
    result["freq_response"] = {
        "frequency":    freq_hz.tolist(),
        "magnitude_db": magnitude_db.tolist(),
        "phase_deg":    phase_deg.tolist(),
        "group_delay":  gd_seconds,
    }
    result["locus_type"] = result.get("locus_type", "ellipse")

    return result