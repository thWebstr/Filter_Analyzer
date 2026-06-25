import math
from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, Literal


class FilterRequest(BaseModel):
    approximation: Literal["butterworth", "chebyshev", "inverse_chebyshev", "elliptic"]
    filter_type: Literal["analog", "digital"]
    band_config: Literal["lowpass", "highpass", "bandpass", "bandstop"] = "lowpass"
    w_pass: float
    w_stop: float
    w_pass2: Optional[float] = None   # upper passband edge — required for BP/BS
    w_stop2: Optional[float] = None   # upper stopband edge — required for BP/BS
    a_pass: float
    a_stop: float
    freq_unit: Literal["rad_s", "hz"]
    sampling_freq: Optional[float] = None

    @field_validator("w_pass")
    @classmethod
    def w_pass_positive(cls, v):
        if v <= 0:
            raise ValueError("w_pass must be greater than 0")
        return v

    @field_validator("a_pass")
    @classmethod
    def a_pass_negative(cls, v):
        if v >= 0:
            raise ValueError("a_pass must be less than 0")
        return v

    @field_validator("a_stop")
    @classmethod
    def a_stop_more_negative(cls, v):
        if v >= 0:
            raise ValueError("a_stop must be less than 0")
        return v

    @model_validator(mode="after")
    def cross_field_checks(self):
        bc = self.band_config

        # ── dB ordering (applies to all band configs) ─────────────────────
        if self.a_stop >= self.a_pass:
            raise ValueError("a_stop must be more negative than a_pass")

        # ── LP: w_stop > w_pass ────────────────────────────────────────────
        if bc == "lowpass":
            if self.w_stop <= self.w_pass:
                raise ValueError("For lowpass: w_stop must be greater than w_pass")

        # ── HP: w_stop < w_pass (stopband below passband) ─────────────────
        elif bc == "highpass":
            if self.w_stop >= self.w_pass:
                raise ValueError("For highpass: w_stop must be less than w_pass (stopband edge is below passband)")

        # ── BP: w_stop < w_pass < w_pass2 < w_stop2 ───────────────────────
        elif bc == "bandpass":
            if self.w_pass2 is None or self.w_stop2 is None:
                raise ValueError("bandpass requires w_pass2 and w_stop2")
            if self.w_stop >= self.w_pass:
                raise ValueError("For bandpass: w_stop (lower SB) must be less than w_pass (lower PB)")
            if self.w_pass >= self.w_pass2:
                raise ValueError("For bandpass: w_pass2 (upper PB) must be greater than w_pass")
            if self.w_stop2 <= self.w_pass2:
                raise ValueError("For bandpass: w_stop2 (upper SB) must be greater than w_pass2")

        # ── BS: w_pass < w_stop < w_stop2 < w_pass2 ───────────────────────
        elif bc == "bandstop":
            if self.w_pass2 is None or self.w_stop2 is None:
                raise ValueError("bandstop requires w_pass2 and w_stop2")
            if self.w_stop <= self.w_pass:
                raise ValueError("For bandstop: w_stop (lower SB edge) must be greater than w_pass")
            if self.w_stop2 <= self.w_stop:
                raise ValueError("For bandstop: w_stop2 (upper SB edge) must be greater than w_stop")
            if self.w_pass2 <= self.w_stop2:
                raise ValueError("For bandstop: w_pass2 (upper PB edge) must be greater than w_stop2")

        # ── Digital Nyquist check ──────────────────────────────────────────
        if self.filter_type == "digital" and self.sampling_freq is None:
            raise ValueError("sampling_freq is required for digital filters")

        if self.filter_type == "digital" and self.sampling_freq is not None:
            # Use the highest frequency edge for Nyquist check
            highest_freq = self.w_stop
            if bc in ("highpass",):
                highest_freq = self.w_pass
            elif bc in ("bandpass", "bandstop") and self.w_stop2 is not None:
                highest_freq = self.w_stop2

            freq_hz = highest_freq if self.freq_unit == "hz" else highest_freq / (2 * math.pi)
            if self.sampling_freq <= 2 * freq_hz:
                raise ValueError("sampling_freq must be greater than 2 × highest edge frequency (Nyquist criterion)")

        return self


class ComplexNumber(BaseModel):
    real: float
    imag: float


class FrequencyResponse(BaseModel):
    frequency: list[float]
    magnitude_db: list[float]
    phase_deg: list[float]
    group_delay: list[float]


class FilterResult(BaseModel):
    approximation: str
    filter_type: str
    band_config: str = "lowpass"
    order: int
    epsilon: float
    epsilon_stop: Optional[float] = None
    poles: list[ComplexNumber]
    zeros: list[ComplexNumber]
    poly_num: list[float]
    poly_den: list[float]
    freq_response: FrequencyResponse
    locus_type: str
    locus_params: dict
    digital_coeffs: Optional[dict] = None
    warnings: list[str] = []