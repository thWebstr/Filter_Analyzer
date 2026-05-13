import math
import numpy as np
from engine.common import (
    compute_epsilon,
    get_order_mode,
    poles_to_complex_list,
    zeros_to_complex_list,
)


def design_inverse_chebyshev(
    w_pass: float,
    w_stop: float,
    a_pass: float,
    a_stop: float,
) -> dict:
    """
    Design a normalized Inverse Chebyshev (Type II) low-pass filter.
    Port of chebinv.m (Zubair & Olawale, 2022).
    """

    # --- Step 1: Compute epsilon_i, order n, Di ---
    epsilon_i = 1 / math.sqrt(10 ** (-0.1 * a_stop) - 1)      # Eq. 43

    n_exact = math.acosh(
        math.sqrt(
            (10 ** (-0.1 * a_stop) - 1) /
            (10 ** (-0.1 * a_pass) - 1)
        )
    ) / math.acosh(w_stop / w_pass)                            # Eq. 44

    n = math.ceil(n_exact)
    mode = get_order_mode(n)

    Di = math.asinh(epsilon_i ** -1) / n                       # Eq. 47

    # --- Step 2: Compute Chebyshev poles (prime) then invert ---
    raw_poles = []      # (sigma_m, omega_m) — actual Inv. Cheb poles
    cheb_poles = []     # (sigma_prime, omega_prime) — intermediate

    real_pole = None
    if mode == 1:
        sigma_real_prime = -math.sinh(Di)
        # Reciprocal of real prime pole
        real_pole = 1 / sigma_real_prime        # stays real, negative

    if mode == 2:
        m_range = range(n // 2)
    else:
        m_range = range((n - 1) // 2)

    for m in m_range:
        theta_m = math.pi * (2 * m + 1) / (2 * n)             # Eq. 50/51

        sigma_prime = -math.sinh(Di) * math.sin(theta_m)      # Eq. 48
        omega_prime = math.cosh(Di) * math.cos(theta_m)       # Eq. 49
        cheb_poles.append((sigma_prime, omega_prime))

        denom = sigma_prime ** 2 + omega_prime ** 2
        sigma_m = sigma_prime / denom                          # Eq. 52
        omega_m = -omega_prime / denom                         # Eq. 53
        raw_poles.append((sigma_m, omega_m))

    # --- Step 3: Compute zeros on jw axis ---
    raw_zeros = []
    for i, m in enumerate(m_range):
        theta_m = math.pi * (2 * m + 1) / (2 * n)
        omega_z = 1 / math.cos(theta_m)                        # Eq. 55 sec(theta)
        raw_zeros.append((0.0, omega_z))                       # Eq. 54: sigma_z = 0

    # --- Step 4: Build DF and NF matrices ---
    DF = []
    NF = []
    A_product = 1.0
    B_product = 1.0

    for i, (sigma_m, omega_m) in enumerate(raw_poles):
        b1m = -2 * sigma_m
        b2m = sigma_m ** 2 + omega_m ** 2
        DF.append([1.0, b1m, b2m])
        B_product *= b2m                                        # Eq. 59

        sigma_z, omega_z = raw_zeros[i]
        a1m = 0.0                                              # Eq. 60
        a2m = omega_z ** 2                                     # Eq. 61
        NF.append([1.0, a1m, a2m])
        A_product *= a2m

    # --- Step 5: Expand transfer function ---
    poly_num, poly_den = _expand_transfer_function(
        DF, NF, real_pole, Di, mode, B_product, A_product
    )

    # --- Step 6: Format output ---
    poles_out = poles_to_complex_list(raw_poles)
    if real_pole is not None:
        poles_out.append({"real": real_pole, "imag": 0.0})

    zeros_out = zeros_to_complex_list(raw_zeros)

    return {
        "order": n,
        "epsilon": epsilon_i,
        "Di": Di,
        "poles": poles_out,
        "zeros": zeros_out,
        "poly_num": poly_num,
        "poly_den": poly_den,
        "locus_type": "ellipse",
        "locus_params": {
            "major_axis": math.cosh(Di),
            "minor_axis": math.sinh(Di),
        },
        "warnings": [],
    }


def _expand_transfer_function(
    DF, NF, real_pole, Di, mode, B_product, A_product
):
    """
    Expand numerator and denominator polynomials.
    Eq. 62 (even), Eq. 63 (odd).
    """
    poly_num = np.array([1.0])
    poly_den = np.array([1.0])

    for i in range(len(DF)):
        poly_num = np.polymul(poly_num, np.array(NF[i]))
        poly_den = np.polymul(poly_den, np.array(DF[i]))

    # Scale numerator and denominator
    # Numerator scaled by B_product, denominator by A_product
    scale = B_product / A_product

    if mode == 1 and real_pole is not None:
        sinh_Di_inv = 1 / math.sinh(Di)
        first_order_num = np.array([sinh_Di_inv])
        first_order_den = np.array([1.0, sinh_Di_inv])
        poly_num = np.polymul(first_order_num, poly_num)
        poly_den = np.polymul(first_order_den, poly_den)

    poly_num = (poly_num * scale).tolist()
    poly_den = poly_den.tolist()

    return poly_num, poly_den