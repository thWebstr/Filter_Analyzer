import math
from fastapi import APIRouter
from scipy.signal import lp2bp_zpk, lp2bs_zpk, lp2hp_zpk, tf2zpk, zpk2tf

from models.schemas import FilterRequest, FilterResult
from engine.bilinear import apply_bilinear_transform
from engine.butterworth import design_butterworth
from engine.chebyshev import design_chebyshev
from engine.common import (
    normalize_frequencies,
    compute_frequency_response,
    compute_lp_selectivity,
)
from engine.elliptic import design_elliptic
from engine.inverse_chebyshev import design_inverse_chebyshev

router = APIRouter()

APPROXIMATION_FUNCTIONS = {
    "butterworth": design_butterworth,
    "chebyshev": design_chebyshev,
    "inverse_chebyshev": design_inverse_chebyshev,
    "elliptic": design_elliptic,
}


def _transform_analog_filter(
    prototype: dict,
    band_config: str,
    w_pass: float,
    w_stop: float,
    w_pass2: float | None = None,
    w_stop2: float | None = None,
) -> dict:
    if band_config == "lowpass":
        return prototype

    poly_num_lp = prototype["poly_num"]
    poly_den_lp = prototype["poly_den"]
    zeros, poles, gain = tf2zpk(poly_num_lp, poly_den_lp)

    if band_config == "highpass":
        zeros, poles, gain = lp2hp_zpk(zeros, poles, gain, wo=w_pass)
    elif band_config == "bandpass":
        wo = math.sqrt(w_pass * w_pass2)
        bw = w_pass2 - w_pass
        zeros, poles, gain = lp2bp_zpk(zeros, poles, gain, wo=wo, bw=bw)
    elif band_config == "bandstop":
        wo = math.sqrt(w_stop * w_stop2)
        bw = w_stop2 - w_stop
        zeros, poles, gain = lp2bs_zpk(zeros, poles, gain, wo=wo, bw=bw)

    poly_num, poly_den = zpk2tf(zeros, poles, gain)
    poly_num = [float(complex(x).real) for x in poly_num]
    poly_den = [float(complex(x).real) for x in poly_den]

    result = prototype.copy()
    result["poly_num"] = poly_num
    result["poly_den"] = poly_den
    result["poles"] = [{"real": float(p.real), "imag": float(p.imag)} for p in poles]
    result["zeros"] = [{"real": float(z.real), "imag": float(z.imag)} for z in zeros]
    result["locus_type"] = prototype.get("locus_type", "ellipse")
    result["locus_params"] = prototype.get("locus_params", {})
    return result


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/design", response_model=FilterResult)
def design_filter(request: FilterRequest):
    design_fn = APPROXIMATION_FUNCTIONS[request.approximation]

    if request.filter_type == "digital":
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
    else:
        w_pass, w_stop = normalize_frequencies(
            request.w_pass, request.w_stop, request.freq_unit
        )

        if request.freq_unit == "hz":
            w_pass2 = (2 * math.pi * request.w_pass2) if request.w_pass2 is not None else None
            w_stop2 = (2 * math.pi * request.w_stop2) if request.w_stop2 is not None else None
        else:
            w_pass2 = request.w_pass2
            w_stop2 = request.w_stop2

        w_pass_lp, w_stop_lp = compute_lp_selectivity(
            request.band_config,
            w_pass,
            w_stop,
            w_pass2=w_pass2,
            w_stop2=w_stop2,
        )

        prototype = design_fn(
            w_pass=w_pass_lp,
            w_stop=w_stop_lp,
            a_pass=request.a_pass,
            a_stop=request.a_stop,
        )

        result = _transform_analog_filter(
            prototype,
            request.band_config,
            w_pass=w_pass,
            w_stop=w_stop,
            w_pass2=w_pass2,
            w_stop2=w_stop2,
        )

        max_edge = max(
            w_pass,
            w_stop,
            w_pass2 or 0.0,
            w_stop2 or 0.0,
        )
        result["freq_response"] = compute_frequency_response(
            poly_num=result["poly_num"],
            poly_den=result["poly_den"],
            w_pass=w_pass,
            w_stop=w_stop,
            w_max=max_edge * 3.0,
        )
        result["digital_coeffs"] = None

    result["approximation"] = request.approximation
    result["filter_type"] = request.filter_type
    result["band_config"] = request.band_config
    result["warnings"] = result.get("warnings", [])
    return result
