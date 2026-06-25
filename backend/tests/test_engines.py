"""
Regression tests for all four filter design engines.

Run from the backend/ directory:
    cd backend
    venv\\Scripts\\activate
    pip install pytest
    pytest tests/test_engines.py -v
"""

import sys
import os
import math

# Ensure engine modules are importable when running from backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from scipy import signal as scipy_signal
import numpy as np

from engine.butterworth      import design_butterworth
from engine.chebyshev        import design_chebyshev
from engine.inverse_chebyshev import design_inverse_chebyshev
from engine.elliptic         import design_elliptic
from engine.bilinear         import apply_bilinear_transform
from engine.common           import compute_frequency_response


# ---------------------------------------------------------------------------
# Shared specs used across tests
# ---------------------------------------------------------------------------
SPECS = dict(
    w_pass = 1.0,
    w_stop = 2.0,
    a_pass = -1.0,   # −1 dB passband ripple
    a_stop = -40.0,  # −40 dB stopband attenuation
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def eval_magnitude_db(poly_num, poly_den, w):
    """Evaluate |H(jw)| in dB for an analog filter at angular frequency w."""
    s = 1j * w
    num = np.polyval(poly_num, s)
    den = np.polyval(poly_den, s)
    return 20 * math.log10(abs(num / den) + 1e-300)


# ---------------------------------------------------------------------------
# Butterworth
# ---------------------------------------------------------------------------

class TestButterworth:
    def test_order_is_positive_integer(self):
        res = design_butterworth(**SPECS)
        assert isinstance(res["order"], int)
        assert res["order"] >= 1

    def test_order_ceiling(self):
        """Known result: Butterworth n ≥ 7 for these specs."""
        res = design_butterworth(**SPECS)
        assert res["order"] >= 7

    def test_passband_gain_within_spec(self):
        res = design_butterworth(**SPECS)
        mag = eval_magnitude_db(res["poly_num"], res["poly_den"], SPECS["w_pass"])
        assert mag >= SPECS["a_pass"], f"Passband gain {mag:.3f} dB exceeds spec {SPECS['a_pass']} dB"

    def test_stopband_attenuation(self):
        res = design_butterworth(**SPECS)
        mag = eval_magnitude_db(res["poly_num"], res["poly_den"], SPECS["w_stop"])
        assert mag <= SPECS["a_stop"], f"Stopband gain {mag:.3f} dB not attenuated enough"

    def test_poles_in_left_half_plane(self):
        res = design_butterworth(**SPECS)
        for p in res["poles"]:
            assert p["real"] < 0, f"Pole {p} not in LHP"

    def test_no_zeros(self):
        """Butterworth has no finite zeros."""
        res = design_butterworth(**SPECS)
        assert len(res["zeros"]) == 0

    def test_epsilon_positive(self):
        res = design_butterworth(**SPECS)
        assert res["epsilon"] > 0


# ---------------------------------------------------------------------------
# Chebyshev I
# ---------------------------------------------------------------------------

class TestChebyshev:
    def test_order_correct(self):
        """Chebyshev I achieves the same spec in fewer taps than Butterworth."""
        res_btw = design_butterworth(**SPECS)
        res_cheb = design_chebyshev(**SPECS)
        assert res_cheb["order"] <= res_btw["order"]

    def test_passband_gain_within_spec(self):
        res = design_chebyshev(**SPECS)
        mag = eval_magnitude_db(res["poly_num"], res["poly_den"], SPECS["w_pass"])
        assert mag >= SPECS["a_pass"] - 0.01  # 0.01 dB numerical tolerance

    def test_stopband_attenuation(self):
        res = design_chebyshev(**SPECS)
        mag = eval_magnitude_db(res["poly_num"], res["poly_den"], SPECS["w_stop"])
        assert mag <= SPECS["a_stop"]

    def test_poles_in_left_half_plane(self):
        res = design_chebyshev(**SPECS)
        for p in res["poles"]:
            assert p["real"] < 0, f"Pole {p} not in LHP"


# ---------------------------------------------------------------------------
# Inverse Chebyshev (Type II)
# ---------------------------------------------------------------------------

class TestInverseChebyshev:
    def test_order_positive(self):
        res = design_inverse_chebyshev(**SPECS)
        assert res["order"] >= 1

    def test_epsilon_is_passband(self):
        """After B5 fix, epsilon must be the passband ripple factor, not stopband."""
        res = design_inverse_chebyshev(**SPECS)
        epsilon_pass_expected = 1 / math.sqrt(10 ** (-0.1 * SPECS["a_pass"]) - 1)
        assert abs(res["epsilon"] - epsilon_pass_expected) < 1e-10

    def test_epsilon_stop_exposed(self):
        """epsilon_stop (stopband ripple factor) should also be returned."""
        res = design_inverse_chebyshev(**SPECS)
        assert "epsilon_stop" in res
        epsilon_stop_expected = 1 / math.sqrt(10 ** (-0.1 * SPECS["a_stop"]) - 1)
        assert abs(res["epsilon_stop"] - epsilon_stop_expected) < 1e-10

    def test_zeros_on_imaginary_axis(self):
        """Inv. Chebyshev zeros are purely imaginary (real part = 0)."""
        res = design_inverse_chebyshev(**SPECS)
        for z in res["zeros"]:
            assert abs(z["real"]) < 1e-10, f"Zero {z} not on jω axis"

    def test_poles_in_left_half_plane(self):
        res = design_inverse_chebyshev(**SPECS)
        for p in res["poles"]:
            assert p["real"] < 0, f"Pole {p} not in LHP"

    def test_stopband_attenuation(self):
        res = design_inverse_chebyshev(**SPECS)
        mag = eval_magnitude_db(res["poly_num"], res["poly_den"], SPECS["w_stop"])
        assert mag <= SPECS["a_stop"], f"Stopband gain {mag:.3f} dB not attenuated enough"


# ---------------------------------------------------------------------------
# Elliptic
# ---------------------------------------------------------------------------

class TestElliptic:
    def test_order_minimal(self):
        """Elliptic achieves spec in ≤ Chebyshev order."""
        res_cheb = design_chebyshev(**SPECS)
        res_ell  = design_elliptic(**SPECS)
        assert res_ell["order"] <= res_cheb["order"]

    def test_poles_in_left_half_plane(self):
        res = design_elliptic(**SPECS)
        for p in res["poles"]:
            assert p["real"] < 0, f"Pole {p} not in LHP"

    def test_zeros_on_imaginary_axis(self):
        """Elliptic zeros are purely imaginary."""
        res = design_elliptic(**SPECS)
        for z in res["zeros"]:
            assert abs(z["real"]) < 1e-10, f"Zero {z} not on jω axis"

    def test_passband_gain_within_spec(self):
        res = design_elliptic(**SPECS)
        mag = eval_magnitude_db(res["poly_num"], res["poly_den"], SPECS["w_pass"])
        assert mag >= SPECS["a_pass"] - 0.05  # 0.05 dB tolerance

    def test_stopband_attenuation(self):
        res = design_elliptic(**SPECS)
        mag = eval_magnitude_db(res["poly_num"], res["poly_den"], SPECS["w_stop"])
        assert mag <= SPECS["a_stop"], f"Stopband gain {mag:.3f} dB not attenuated enough"

    def test_v0_locus_params_present(self):
        res = design_elliptic(**SPECS)
        assert "rt" in res["locus_params"]
        assert "kn" in res["locus_params"]
        assert "v0" in res["locus_params"]

    def test_sc_inverse_fix(self):
        """
        Regression test for B6: sc_inverse must compute F(atan(u), k²).
        A known value: sc^-1(1, 0) = F(pi/4, 0) = pi/4.
        """
        from engine.elliptic import sc_inverse
        result = sc_inverse(1.0, 0.0)
        assert abs(result - math.pi / 4) < 1e-6, f"sc_inverse(1, 0) = {result}, expected pi/4"

    def test_cei_forward_known_value(self):
        """
        K(0) = pi/2 exactly.
        """
        from engine.elliptic import cei_forward
        assert abs(cei_forward(0.0) - math.pi / 2) < 1e-8


# ---------------------------------------------------------------------------
# Bilinear Transform (Digital IIR)
# ---------------------------------------------------------------------------

class TestBilinear:
    def test_digital_coeffs_returned(self):
        res = apply_bilinear_transform(
            sampling_freq=10.0,
            w_pass=1.0,
            w_stop=2.0,
            a_pass=SPECS["a_pass"],
            a_stop=SPECS["a_stop"],
            freq_unit="rad_s",
            design_fn=design_butterworth,
        )
        assert "digital_coeffs" in res
        assert "b" in res["digital_coeffs"]
        assert "a" in res["digital_coeffs"]

    def test_freq_response_returned(self):
        res = apply_bilinear_transform(
            sampling_freq=10.0,
            w_pass=1.0,
            w_stop=2.0,
            a_pass=SPECS["a_pass"],
            a_stop=SPECS["a_stop"],
            freq_unit="rad_s",
            design_fn=design_butterworth,
        )
        assert "freq_response" in res
        assert len(res["freq_response"]["frequency"]) == 2000

    def test_all_approximations_work(self):
        """Smoke test: all four approximations produce valid digital results."""
        for fn in [design_butterworth, design_chebyshev,
                   design_inverse_chebyshev, design_elliptic]:
            res = apply_bilinear_transform(
                sampling_freq=10.0,
                w_pass=1.0,
                w_stop=2.0,
                a_pass=SPECS["a_pass"],
                a_stop=SPECS["a_stop"],
                freq_unit="rad_s",
                design_fn=fn,
            )
            assert res["order"] >= 1
            b = res["digital_coeffs"]["b"]
            a = res["digital_coeffs"]["a"]
            assert len(b) > 0
            assert len(a) > 0
