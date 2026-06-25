"""
FastAPI integration tests for /api/design endpoint.

Run from the backend/ directory:
    cd backend
    venv\\Scripts\\activate
    pytest tests/test_api.py -v
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Base LP request payload
# ---------------------------------------------------------------------------

BASE_LP = {
    "approximation": "butterworth",
    "filter_type": "analog",
    "band_config": "lowpass",
    "w_pass": 1.0,
    "w_stop": 2.0,
    "a_pass": -1.0,
    "a_stop": -40.0,
    "freq_unit": "rad_s",
}


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class TestHealth:
    def test_health_ok(self):
        r = client.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Basic LP designs — all four approximations
# ---------------------------------------------------------------------------

class TestLP:
    @pytest.mark.parametrize("approx", ["butterworth", "chebyshev", "inverse_chebyshev", "elliptic"])
    def test_lp_all_approx(self, approx):
        payload = {**BASE_LP, "approximation": approx}
        r = client.post("/api/design", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["order"] >= 1
        assert len(data["freq_response"]["frequency"]) == 2000
        assert data["band_config"] == "lowpass"

    def test_lp_returns_epsilon(self):
        r = client.post("/api/design", json=BASE_LP)
        assert r.json()["epsilon"] > 0

    def test_lp_no_finite_zeros_butterworth(self):
        r = client.post("/api/design", json=BASE_LP)
        assert r.json()["zeros"] == []

    def test_inv_cheb_returns_epsilon_stop(self):
        payload = {**BASE_LP, "approximation": "inverse_chebyshev"}
        r = client.post("/api/design", json=payload)
        data = r.json()
        assert data["epsilon_stop"] is not None
        assert data["epsilon_stop"] > 0


# ---------------------------------------------------------------------------
# High-pass
# ---------------------------------------------------------------------------

class TestHP:
    HP_PAYLOAD = {
        "approximation": "butterworth",
        "filter_type": "analog",
        "band_config": "highpass",
        "w_pass": 2.0,   # passband above 2 rad/s
        "w_stop": 1.0,   # stopband below 1 rad/s
        "a_pass": -1.0,
        "a_stop": -40.0,
        "freq_unit": "rad_s",
    }

    def test_hp_design_butterworth(self):
        r = client.post("/api/design", json=self.HP_PAYLOAD)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["order"] >= 1
        assert data["band_config"] == "highpass"

    @pytest.mark.parametrize("approx", ["butterworth", "chebyshev", "inverse_chebyshev", "elliptic"])
    def test_hp_all_approx(self, approx):
        payload = {**self.HP_PAYLOAD, "approximation": approx}
        r = client.post("/api/design", json=payload)
        assert r.status_code == 200, r.text

    def test_hp_validation_rejects_reversed_freqs(self):
        """For HP, w_stop must be < w_pass — reject if equal or reversed."""
        bad = {**self.HP_PAYLOAD, "w_stop": 3.0}  # w_stop > w_pass → invalid
        r = client.post("/api/design", json=bad)
        assert r.status_code == 422


# ---------------------------------------------------------------------------
# Band-pass
# ---------------------------------------------------------------------------

class TestBP:
    BP_PAYLOAD = {
        "approximation": "butterworth",
        "filter_type": "analog",
        "band_config": "bandpass",
        "w_pass":  1.0,   # lower PB edge
        "w_pass2": 3.0,   # upper PB edge
        "w_stop":  0.5,   # lower SB edge
        "w_stop2": 5.0,   # upper SB edge
        "a_pass": -1.0,
        "a_stop": -40.0,
        "freq_unit": "rad_s",
    }

    def test_bp_design(self):
        r = client.post("/api/design", json=self.BP_PAYLOAD)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["band_config"] == "bandpass"
        assert data["order"] >= 1

    def test_bp_validation_missing_w_pass2(self):
        bad = {k: v for k, v in self.BP_PAYLOAD.items() if k != "w_pass2"}
        r = client.post("/api/design", json=bad)
        assert r.status_code == 422

    @pytest.mark.parametrize("approx", ["butterworth", "chebyshev", "elliptic"])
    def test_bp_all_approx(self, approx):
        payload = {**self.BP_PAYLOAD, "approximation": approx}
        r = client.post("/api/design", json=payload)
        assert r.status_code == 200, r.text


# ---------------------------------------------------------------------------
# Band-stop
# ---------------------------------------------------------------------------

class TestBS:
    BS_PAYLOAD = {
        "approximation": "butterworth",
        "filter_type": "analog",
        "band_config": "bandstop",
        "w_pass":  0.5,   # lower PB edge
        "w_pass2": 5.0,   # upper PB edge
        "w_stop":  1.0,   # lower SB edge
        "w_stop2": 3.0,   # upper SB edge
        "a_pass": -1.0,
        "a_stop": -40.0,
        "freq_unit": "rad_s",
    }

    def test_bs_design(self):
        r = client.post("/api/design", json=self.BS_PAYLOAD)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["band_config"] == "bandstop"

    def test_bs_validation_missing_w_stop2(self):
        bad = {k: v for k, v in self.BS_PAYLOAD.items() if k != "w_stop2"}
        r = client.post("/api/design", json=bad)
        assert r.status_code == 422


# ---------------------------------------------------------------------------
# Digital IIR
# ---------------------------------------------------------------------------

class TestDigital:
    DIGITAL_LP = {
        "approximation": "butterworth",
        "filter_type": "digital",
        "band_config": "lowpass",
        "w_pass": 1.0,
        "w_stop": 2.0,
        "a_pass": -1.0,
        "a_stop": -40.0,
        "freq_unit": "rad_s",
        "sampling_freq": 20.0,
    }

    def test_digital_lp_returns_digital_coeffs(self):
        r = client.post("/api/design", json=self.DIGITAL_LP)
        assert r.status_code == 200
        data = r.json()
        assert data["digital_coeffs"] is not None
        assert len(data["digital_coeffs"]["b"]) > 0
        assert len(data["digital_coeffs"]["a"]) > 0

    def test_digital_nyquist_rejected(self):
        """Sampling freq below Nyquist must be rejected."""
        bad = {**self.DIGITAL_LP, "sampling_freq": 2.0}  # Fs = 2*w_stop → invalid
        r = client.post("/api/design", json=bad)
        assert r.status_code == 422


# ---------------------------------------------------------------------------
# Error cases
# ---------------------------------------------------------------------------

class TestErrors:
    def test_unknown_approximation(self):
        payload = {**BASE_LP, "approximation": "fir"}
        r = client.post("/api/design", json=payload)
        assert r.status_code == 400

    def test_bad_attenuation_ordering(self):
        payload = {**BASE_LP, "a_stop": -0.5}  # a_stop > a_pass → invalid
        r = client.post("/api/design", json=payload)
        assert r.status_code == 422
