import math
import numpy as np
from engine.common import (
    compute_epsilon,
    get_order_mode,
    build_quadratic_factor,
    poles_to_complex_list,
)


def design_chebyshev(
    w_pass: float,
    w_stop: float,
    a_pass: float,
    a_stop: float,
) -> dict:
    """
    Design a normalized Chebyshev Type I low-pass filter.
    Port of cheb.m (Zubair & Olawale, 2022).

    Returns a dict with:
        order, epsilon, D, poles, zeros,
        poly_num, poly_den, locus_type, locus_params
    """

    # --- Step 1: Compute epsilon, order n, ellipse parameter D ---
    epsilon = compute_epsilon(a_pass)

    n_exact = math.acosh(
        math.sqrt(
            (10 ** (-0.1 * a_stop) - 1) /
            (10 ** (-0.1 * a_pass) - 1)
        )
    ) / math.acosh(w_stop / w_pass)             # Eq. 29

    n = math.ceil(n_exact)
    mode = get_order_mode(n)

    D = math.asinh(epsilon ** -1) / n           # Eq. 30

    # --- Step 2: Collect poles ---
    raw_poles = []

    # Real pole for odd order at sigma = -sinh(D)
    real_pole = None
    if mode == 1:
        real_pole = -math.sinh(D)

    # Loop range
    if mode == 2:
        m_range = range(n // 2)
    else:
        m_range = range((n - 1) // 2)

    for m in m_range:
        # Eq. 31 (even) / Eq. 32 (odd) — same formula, different range
        theta_m = math.pi * (2 * m + 1) / (2 * n)
        sigma_m = -math.sinh(D) * math.sin(theta_m)    # Eq. 33
        omega_m = math.cosh(D) * math.cos(theta_m)     # Eq. 34
        raw_poles.append((sigma_m, omega_m))

    # --- Step 3: Build DF matrix ---
    DF = []
    for sigma_m, omega_m in raw_poles:
        DF.append(build_quadratic_factor(sigma_m, omega_m))

    # --- Step 4: Even-order gain constant ---
    # G = 10^(0.05 * Apass)  Eq. 39  (even order only)
    G = 10 ** (0.05 * a_pass) if mode == 2 else None

    # --- Step 5: Expand transfer function ---
    poly_num, poly_den = _expand_transfer_function(
        DF, real_pole, D, mode, G
    )

    # --- Step 6: Format poles for output ---
    poles_out = poles_to_complex_list(raw_poles)
    if real_pole is not None:
        poles_out.append({"real": real_pole, "imag": 0.0})

    return {
        "order": n,
        "epsilon": epsilon,
        "D": D,
        "poles": poles_out,
        "zeros": [],
        "poly_num": poly_num,
        "poly_den": poly_den,
        "locus_type": "ellipse",
        "locus_params": {
            "major_axis": math.cosh(D),     # along jw axis
            "minor_axis": math.sinh(D),     # along real axis
        },
        "warnings": [],
    }


def _expand_transfer_function(
    DF: list,
    real_pole: float | None,
    D: float,
    mode: int,
    G: float | None,
) -> tuple:
    """
    Expand quadratic (and first-order) factors into numerator
    and denominator polynomials.
    Port of ffncexp1.m logic for Chebyshev.

    Eq. 40 (even order), Eq. 41 (odd order).
    """

    poly_den = np.array([1.0])
    B_product = 1.0

    for factor in DF:
        poly_den = np.polymul(poly_den, np.array(factor))
        B_product *= factor[2]              # accumulate B2m

    # First-order factor for odd order: (s + sinh(D))
    if mode == 1 and real_pole is not None:
        sinh_D = math.sinh(D)
        first_order = np.array([1.0, sinh_D])
        poly_den = np.polymul(poly_den, first_order)
        numerator_const = sinh_D * B_product        # Eq. 41
    else:
        # Even order: multiply by gain constant G   Eq. 40
        numerator_const = G * B_product

    poly_num = [numerator_const]

    return poly_num, poly_den.tolist()