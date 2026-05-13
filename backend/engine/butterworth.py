import math
import numpy as np
from engine.common import (
    compute_epsilon,
    get_order_mode,
    build_quadratic_factor,
    poles_to_complex_list,
)


def design_butterworth(
    w_pass: float,
    w_stop: float,
    a_pass: float,
    a_stop: float,
) -> dict:
    """
    Design a normalized Butterworth low-pass filter.
    Port of btw.m (Zubair & Olawale, 2022).

    Returns a dict with:
        order, epsilon, R, poles, zeros,
        poly_num, poly_den, locus_type, locus_params
    """

    # --- Step 1: Compute epsilon, order n, radius R ---
    epsilon = compute_epsilon(a_pass)

    n_exact = math.log(
        (10 ** (-0.1 * a_stop) - 1) / (10 ** (-0.1 * a_pass) - 1)
    ) / (2 * math.log(w_stop / w_pass))

    n = math.ceil(n_exact)                  # Eq. 15
    R = epsilon ** (-1 / n)                 # Eq. 16
    mode = get_order_mode(n)

    # --- Step 2: Collect poles ---
    # raw_poles: list of (sigma, omega) for upper half-plane only
    raw_poles = []

    # If odd order: real pole at sigma = -R
    real_pole = None
    if mode == 1:
        real_pole = -R

    # Loop m from 0 to floor(n/2) - 1
    if mode == 2:
        m_range = range(n // 2)
    else:
        m_range = range((n - 1) // 2)

    for m in m_range:
        # Eq. 17 (even) / Eq. 18 (odd) — same formula, different range
        theta_m = math.pi * (2 * m + n + 1) / (2 * n)
        sigma_m = R * math.cos(theta_m)     # Eq. 19
        omega_m = R * math.sin(theta_m)     # Eq. 20
        raw_poles.append((sigma_m, omega_m))

    # --- Step 3: Build DF matrix (quadratic denominator factors) ---
    # Each row: [1, B1m, B2m]
    DF = []
    for sigma_m, omega_m in raw_poles:
        DF.append(build_quadratic_factor(sigma_m, omega_m))

    # --- Step 4: Expand transfer function polynomials ---
    poly_num, poly_den = _expand_transfer_function(
        DF, real_pole, R, mode
    )

    # --- Step 5: Format poles for output (with conjugates) ---
    poles_out = poles_to_complex_list(raw_poles)
    if real_pole is not None:
        poles_out.append({"real": real_pole, "imag": 0.0})

    return {
        "order": n,
        "epsilon": epsilon,
        "R": R,
        "poles": poles_out,
        "zeros": [],                        # Butterworth: all-pole, no finite zeros
        "poly_num": poly_num,
        "poly_den": poly_den,
        "locus_type": "circle",
        "locus_params": {"radius": R},
        "warnings": [],
    }


def _expand_transfer_function(
    DF: list,
    real_pole: float | None,
    R: float,
    mode: int,
) -> tuple:
    """
    Expand the product of quadratic (and first-order) factors
    into a single numerator and denominator polynomial.
    Port of ffncexp1.m logic for Butterworth.

    Eq. 25 (even order), Eq. 26 (odd order).
    """

    # Start denominator as [1] and multiply in each quadratic factor
    poly_den = np.array([1.0])
    B_product = 1.0

    for factor in DF:
        poly_den = np.polymul(poly_den, np.array(factor))
        B_product *= factor[2]              # accumulate B2m values

    # Multiply in first-order factor for odd order: (s + R)
    if mode == 1 and real_pole is not None:
        first_order = np.array([1.0, R])    # s + R
        poly_den = np.polymul(poly_den, first_order)

    # Numerator: constant = R * product(B2m) for odd
    #            constant = product(B2m) for even      Eq. 25 / 26
    if mode == 1:
        numerator_const = R * B_product
    else:
        numerator_const = B_product

    poly_num = [numerator_const]

    return poly_num, poly_den.tolist()