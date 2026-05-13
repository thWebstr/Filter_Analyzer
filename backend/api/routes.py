import math
from fastapi import APIRouter, HTTPException
from models.schemas import FilterRequest, FilterResult
from engine.common import normalize_frequencies, rads_to_hz
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


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/design", response_model=FilterResult)
def design_filter(request: FilterRequest):

    # --- Step 1: Normalize frequencies to rad/s ---
    w_pass, w_stop = normalize_frequencies(
        request.w_pass, request.w_stop, request.freq_unit
    )

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
            result = design_fn(
                w_pass=w_pass,
                w_stop=w_stop,
                a_pass=request.a_pass,
                a_stop=request.a_stop,
            )

            # Guard: max order
            if result["order"] > MAX_ORDER:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Computed filter order ({result['order']}) exceeds "
                        f"maximum allowed ({MAX_ORDER}). "
                        "Try increasing w_stop or relaxing a_stop."
                    )
                )

            # Compute frequency response
            freq_resp = compute_analog_response(
                poly_num=result["poly_num"],
                poly_den=result["poly_den"],
                w_pass=w_pass,
                w_stop=w_stop,
            )

            # Convert frequencies back to Hz if user requested Hz
            if request.freq_unit == "hz":
                freq_resp["frequency"] = [
                    rads_to_hz(f) for f in freq_resp["frequency"]
                ]

            result["freq_response"] = freq_resp
            result["digital_coeffs"] = None

        else:
            # Digital IIR via bilinear transform
            result = apply_bilinear_transform(
                analog_result={},
                sampling_freq=request.sampling_freq,
                w_pass=request.w_pass,
                w_stop=request.w_stop,
                a_pass=request.a_pass,
                a_stop=request.a_stop,
                freq_unit=request.freq_unit,
                design_fn=design_fn,
            )

            if result["order"] > MAX_ORDER:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Computed filter order ({result['order']}) exceeds "
                        f"maximum allowed ({MAX_ORDER}). "
                        "Try increasing w_stop or relaxing a_stop."
                    )
                )

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
        order=result["order"],
        epsilon=result["epsilon"],
        poles=result["poles"],
        zeros=result["zeros"],
        poly_num=result["poly_num"],
        poly_den=result["poly_den"],
        freq_response=result["freq_response"],
        locus_type=result["locus_type"],
        locus_params=result["locus_params"],
        digital_coeffs=result.get("digital_coeffs"),
        warnings=result.get("warnings", []),
    )