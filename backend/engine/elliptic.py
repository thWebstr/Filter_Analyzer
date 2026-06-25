import math
import numpy as np
from scipy.special import ellipk, ellipj, ellipkinc
from engine.common import (
    compute_epsilon,
    get_order_mode,
    poles_to_complex_list,
    zeros_to_complex_list,
)


# ---------------------------------------------------------------------------
# CEI helpers — backed by scipy.special (C-level, accurate, fast)
# ---------------------------------------------------------------------------

def cei_forward(k: float) -> float:
    """
    Complete Elliptic Integral of the first kind K(k).
    Uses scipy.special.ellipk(m) where m = k².
    Eq. 67/68 (Zubair & Olawale, 2022).
    """
    return float(ellipk(k ** 2))


def _ellipj(u: float, k: float):
    """
    Return (sn, cn, dn) = Jacobi elliptic functions at amplitude u, modulus k.
    Uses scipy.special.ellipj(u, m) where m = k².
    """
    sn_v, cn_v, dn_v, _ = ellipj(u, k ** 2)
    return float(sn_v), float(cn_v), float(dn_v)


def sn(u: float, k: float) -> float:
    """Jacobi elliptic sn(u, k)."""
    sn_v, _, _ = _ellipj(u, k)
    return sn_v


def cn(u: float, k: float) -> float:
    """Jacobi elliptic cn(u, k)."""
    _, cn_v, _ = _ellipj(u, k)
    return cn_v


def dn(u: float, k: float) -> float:
    """Jacobi elliptic dn(u, k)."""
    _, _, dn_v = _ellipj(u, k)
    return dn_v


def sc_inverse(u: float, k: float) -> float:
    """
    sc⁻¹(u, k): Inverse Jacobi sc function.
    sc(φ, k) = sin(φ)/cos(φ) = u  →  φ = atan(u).
    Returns F(atan(u), k²) = incomplete elliptic integral.
    Port of CEIinv usage for v0 computation (Eq. 74).
    """
    return float(ellipkinc(math.atan(u), k ** 2))


# ---------------------------------------------------------------------------
# Main design function
# ---------------------------------------------------------------------------

def design_elliptic(
    w_pass: float,
    w_stop: float,
    a_pass: float,
    a_stop: float,
) -> dict:
    """
    Design a normalized Elliptic (Cauer) low-pass filter.
    Port of eff.m (Zubair & Olawale, 2022).
    """

    # --- Step 1: Compute epsilon, rt, kn ---
    epsilon = compute_epsilon(a_pass)
    rt = w_pass / w_stop                                        # Eq. 65
    kn = math.sqrt(
        (10 ** (-0.1 * a_pass) - 1) /
        (10 ** (-0.1 * a_stop) - 1)
    )                                                           # Eq. 66

    # --- Step 2: Compute CEI values and order n ---
    cei_rt        = cei_forward(rt)
    cei_kn        = cei_forward(kn)
    cei_sqrt_1_rt = cei_forward(math.sqrt(1 - rt ** 2))
    cei_sqrt_1_kn = cei_forward(math.sqrt(1 - kn ** 2))

    n_exact = (cei_rt * cei_sqrt_1_kn) / (cei_sqrt_1_rt * cei_kn)  # Eq. 64
    n = math.ceil(n_exact)
    mode = get_order_mode(n)

    # --- Step 3: Compute v0 ---
    # sc^-1(epsilon^-1, kn) via incomplete elliptic integral
    sc_inv = sc_inverse(epsilon ** -1, kn)
    v0 = (cei_rt * sc_inv) / (n * cei_kn)                      # Eq. 74

    # Precompute values needed for pole calculation
    k_prime_rt = math.sqrt(1 - rt ** 2)
    sn_v0, cn_v0, dn_v0 = _ellipj(v0, k_prime_rt)
    sn2_v0 = sn_v0 ** 2

    # --- Step 4: Real pole for odd order ---
    real_pole = None
    if mode == 1:
        # Eq. 79
        num = sn_v0 * cn_v0
        den = 1 - sn2_v0
        real_pole = -(num / den) if abs(den) > 1e-12 else None

    # --- Step 5: Compute poles and zeros ---
    raw_poles = []
    raw_zeros = []

    if mode == 2:
        m_range = range(n // 2)
        f_formula = lambda m: cei_rt * (2 * m + 1) / n         # Eq. 77
    else:
        m_range = range((n - 1) // 2)
        f_formula = lambda m: cei_rt * (2 * m + 2) / n         # Eq. 78

    for m in m_range:
        fm = f_formula(m)

        sn_fm, cn_fm_v, dn_fm_v = _ellipj(fm, rt)
        dn2_fm = dn_fm_v ** 2

        denom = 1 - dn2_fm * sn2_v0

        if abs(denom) < 1e-12:
            continue

        sigma_m = -(cn_fm_v * dn_fm_v * sn_v0 * cn_v0) / denom    # Eq. 75
        omega_m = (sn_fm * dn_v0) / denom                          # Eq. 76
        raw_poles.append((sigma_m, omega_m))

        # Zero location — purely imaginary                          Eq. 80/81
        omega_z = 1 / (rt * sn_fm) if abs(sn_fm) > 1e-12 else 1e12
        raw_zeros.append((0.0, omega_z))

    # --- Step 6: Build DF and NF matrices ---
    DF = []
    NF = []
    B_product = 1.0
    A_product = 1.0

    for i, (sigma_m, omega_m) in enumerate(raw_poles):
        b1m = -2 * sigma_m
        b2m = sigma_m ** 2 + omega_m ** 2
        DF.append([1.0, b1m, b2m])
        B_product *= b2m

        sigma_z, omega_z = raw_zeros[i]
        a2m = omega_z ** 2                                      # Eq. 87
        NF.append([1.0, 0.0, a2m])
        A_product *= a2m

    # --- Step 7: Expand transfer function ---
    G = 10 ** (0.05 * a_pass) if mode == 2 else None
    poly_num, poly_den = _expand_transfer_function(
        DF, NF, real_pole, mode, B_product, A_product, G
    )

    # --- Step 8: Format output ---
    poles_out = poles_to_complex_list(raw_poles)
    if real_pole is not None:
        poles_out.append({"real": real_pole, "imag": 0.0})

    zeros_out = zeros_to_complex_list(raw_zeros)

    return {
        "order": n,
        "epsilon": epsilon,
        "rt": rt,
        "kn": kn,
        "poles": poles_out,
        "zeros": zeros_out,
        "poly_num": poly_num,
        "poly_den": poly_den,
        "locus_type": "ellipse",
        "locus_params": {
            "rt": rt,
            "kn": kn,
            "v0": v0,
        },
        "warnings": [],
    }


def _expand_transfer_function(
    DF, NF, real_pole, mode, B_product, A_product, G
):
    """
    Expand numerator and denominator polynomials.
    Eq. 88 (even), Eq. 89 (odd).
    """
    poly_num = np.array([1.0])
    poly_den = np.array([1.0])

    for i in range(len(DF)):
        poly_num = np.polymul(poly_num, np.array(NF[i]))
        poly_den = np.polymul(poly_den, np.array(DF[i]))

    scale = B_product / A_product

    if mode == 1 and real_pole is not None:
        sigma_R = abs(real_pole)
        first_order_num = np.array([sigma_R])
        first_order_den = np.array([1.0, sigma_R])
        poly_num = np.polymul(first_order_num, poly_num)
        poly_den = np.polymul(first_order_den, poly_den)
        poly_num = (poly_num * scale).tolist()
    else:
        poly_num = (poly_num * scale * G).tolist()

    poly_den = poly_den.tolist()

    return poly_num, poly_den
