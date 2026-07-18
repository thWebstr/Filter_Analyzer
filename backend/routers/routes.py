import math
import numpy as np
from fastapi import APIRouter, HTTPException
from scipy.signal import tf2zpk, zpk2tf, lp2hp_zpk, lp2bp_zpk, lp2bs_zpk

from models.schemas import FilterRequest, FilterResult
from engine.common import normalize_frequencies, rads_to_hz, compute_frequency_response
from engine.butterworth import design_butterworth
from engine.chebyshev import design_chebyshev
from engine.inverse_chebyshev import design_inverse_chebyshev
from engine.elliptic import design_elliptic
from engine.bilinear import apply_bilinear_transform
from engine.transfer_function import compute_analog_response

router = APIRouter()

MAX_ORDER = 20

DESIGN_FUNCTIONS = {
    "butterworth": design_butterworth,
    "chebyshev": design_chebyshev,
    "inverse_chebyshev": design_inverse_chebyshev,
    "elliptic": design_elliptic,
}


# ─────────────────────────────────────────────────────────────
#  Frequency-transform helpers
# ─────────────────────────────────────────────────────────────

def _hz_to_rads(v: float) -> float:
    return 2 * math.pi * v


def _to_rads(v: float, unit: str) -> float:
    return _hz_to_rads(v) if unit == "hz" else v


def _apply_band_transform(
    lp_result: dict,
    band_config: str,
    w_pass: float,
    w_stop: float,
    w_pass2: float | None,
    w_stop2: float | None,
) -> tuple[list, list, tuple]:
    """
    Apply LP→HP/BP/BS frequency transformation to a normalized LP prototype.
    Returns (poly_num, poly_den, (freq_lo, freq_hi)) for the response plot range.
    """
    if band_config == "lowpass":
        return lp_result["poly_num"], lp_result["poly_den"], (w_pass * 0.1, w_stop * 3)

    z, p, k = tf2zpk(lp_result["poly_num"], lp_result["poly_den"])

    if band_config == "highpass":
        # wo = actual passband edge of the HP filter
        z, p, k = lp2hp_zpk(z, p, k, wo=w_pass)
        freq_range = (w_stop * 0.1, w_pass * 3)

    elif band_config == "bandpass":
        wo = math.sqrt(w_pass * w_pass2)
        bw = w_pass2 - w_pass
        z, p, k = lp2bp_zpk(z, p, k, wo=wo, bw=bw)
        freq_range = (w_stop * 0.1, w_stop2 * 2.5)

    elif band_config == "bandstop":
        wo = math.sqrt(w_stop * w_stop2)
        bw = w_stop2 - w_stop
        z, p, k = lp2bs_zpk(z, p, k, wo=wo, bw=bw)
        freq_range = (w_pass * 0.1, w_pass2 * 2.5)

    else:
        raise ValueError(f"Unknown band_config: {band_config}")

    poly_num, poly_den = zpk2tf(z, p, k)
    poly_num = np.real(poly_num).tolist()
    poly_den = np.real(poly_den).tolist()
    return poly_num, poly_den, freq_range


def _lp_selectivity(band_config: str, w_pass: float, w_stop: float,
                    w_pass2: float | None, w_stop2: float | None) -> tuple[float, float]:
    """
    Return (w_pass_lp, w_stop_lp) for the normalized LP prototype design.
    The prototype is always designed with w_pass_lp, w_stop_lp in rad/s;
    the band transform then re-scales to the target frequencies.
    """
    if band_config == "lowpass":
        return w_pass, w_stop

    elif band_config == "highpass":
        # selectivity = w_pass_HP / w_stop_HP (both > 0, w_pass > w_stop)
        sel = w_pass / w_stop
        return 1.0, sel

    elif band_config == "bandpass":
        wo = math.sqrt(w_pass * w_pass2)
        bw = w_pass2 - w_pass
        # Map both stopband edges to LP domain, take worse case
        Omega_lo = abs((w_stop ** 2 - wo ** 2) / (bw * w_stop))
        Omega_hi = abs((w_stop2 ** 2 - wo ** 2) / (bw * w_stop2))
        sel = min(Omega_lo, Omega_hi)
        return 1.0, sel

    elif band_config == "bandstop":
        wo = math.sqrt(w_stop * w_stop2)
        bw = w_stop2 - w_stop
        # Map both passband edges to LP domain, take worse case
        Omega_lo = abs((w_pass ** 2 - wo ** 2) / (bw * w_pass))
        Omega_hi = abs((w_pass2 ** 2 - wo ** 2) / (bw * w_pass2))
        sel = min(Omega_lo, Omega_hi)
        return 1.0, sel

    raise ValueError(f"Unknown band_config: {band_config}")


def _poles_zeros_from_coeffs(poly_num, poly_den):
    """Return poles/zeros as list[dict] from polynomial coefficients."""
    from numpy.polynomial.polynomial import polyroots
    z_roots = np.roots(poly_num)
    p_roots = np.roots(poly_den)
    poles = [{"real": float(np.real(p)), "imag": float(np.imag(p))} for p in p_roots]
    zeros = [{"real": float(np.real(z)), "imag": float(np.imag(z))} for z in z_roots]
    return poles, zeros


# ─────────────────────────────────────────────────────────────
#  Routes
# ─────────────────────────────────────────────────────────────

@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/design", response_model=FilterResult)
def design_filter(request: FilterRequest):

    # --- Step 1: Normalize all user frequencies to rad/s ---
    w_pass, w_stop = normalize_frequencies(request.w_pass, request.w_stop, request.freq_unit)
    w_pass2 = _to_rads(request.w_pass2, request.freq_unit) if request.w_pass2 is not None else None
    w_stop2 = _to_rads(request.w_stop2, request.freq_unit) if request.w_stop2 is not None else None

    # --- Step 2: Select design function ---
    design_fn = DESIGN_FUNCTIONS.get(request.approximation)
    if design_fn is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown approximation: {request.approximation}"
        )

    # --- Step 3: Run the engine ---
    try:
        if request.filter_type == "analog":

            # --- 3a: Determine LP prototype parameters ---
            w_pass_lp, w_stop_lp = _lp_selectivity(
                request.band_config, w_pass, w_stop, w_pass2, w_stop2
            )

            lp_result = design_fn(
                w_pass=w_pass_lp,
                w_stop=w_stop_lp,
                a_pass=request.a_pass,
                a_stop=request.a_stop,
            )

            # Guard: max order
            if lp_result["order"] > MAX_ORDER:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Computed filter order ({lp_result['order']}) exceeds "
                        f"maximum allowed ({MAX_ORDER}). "
                        "Try widening the transition band or relaxing a_stop."
                    )
                )

            # --- 3b: Apply frequency transformation for HP/BP/BS ---
            poly_num, poly_den, freq_range = _apply_band_transform(
                lp_result, request.band_config,
                w_pass, w_stop, w_pass2, w_stop2,
            )

            # --- 3c: Compute frequency response over meaningful range ---
            freq_lo, freq_hi = freq_range
            freq_resp = compute_frequency_response(
                poly_num=poly_num,
                poly_den=poly_den,
                w_pass=freq_lo,
                w_stop=freq_hi,
                n_points=2000,
            )

            # Convert frequencies back to Hz if user requested Hz
            if request.freq_unit == "hz":
                freq_resp["frequency"] = [
                    rads_to_hz(f) for f in freq_resp["frequency"]
                ]

            # For HP/BP/BS use re-computed poles/zeros from transformed poly
            if request.band_config == "lowpass":
                poles_out = lp_result["poles"]
                zeros_out = lp_result["zeros"]
            else:
                poles_out, zeros_out = _poles_zeros_from_coeffs(poly_num, poly_den)

            result = {
                **lp_result,
                "poly_num": poly_num,
                "poly_den": poly_den,
                "poles": poles_out,
                "zeros": zeros_out,
                "freq_response": freq_resp,
                "digital_coeffs": None,
                "band_config": request.band_config,
            }

        else:
            # Digital IIR via bilinear transform
            result = apply_bilinear_transform(
                sampling_freq=request.sampling_freq,
                w_pass=request.w_pass,
                w_stop=request.w_stop,
                a_pass=request.a_pass,
                a_stop=request.a_stop,
                freq_unit=request.freq_unit,
                design_fn=design_fn,
                band_config=request.band_config,
                w_pass2=request.w_pass2,
                w_stop2=request.w_stop2,
            )

            if result["order"] > MAX_ORDER:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Computed filter order ({result['order']}) exceeds "
                        f"maximum allowed ({MAX_ORDER}). "
                        "Try widening the transition band or relaxing a_stop."
                    )
                )

            result["band_config"] = request.band_config

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Engine error: {str(e)}"
        )

    # --- Step 4: Assemble response ---
    return FilterResult(
        approximation=request.approximation,
        filter_type=request.filter_type,
        band_config=result.get("band_config", "lowpass"),
        order=result["order"],
        epsilon=result["epsilon"],
        epsilon_stop=result.get("epsilon_stop"),
        poles=result["poles"],
        zeros=result["zeros"],
        poly_num=result["poly_num"],
        poly_den=result["poly_den"],
        freq_response=result["freq_response"],
        locus_type=result.get("locus_type", "ellipse"),
        locus_params=result.get("locus_params", {}),
        digital_coeffs=result.get("digital_coeffs"),
        warnings=result.get("warnings", []),
    )