import math
from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, Literal


class FilterRequest(BaseModel):
    approximation: Literal["butterworth", "chebyshev", "inverse_chebyshev", "elliptic"]
    filter_type: Literal["analog", "digital"]
    w_pass: float
    w_stop: float
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
        if self.w_stop <= self.w_pass:
            raise ValueError("w_stop must be greater than w_pass")
        if self.a_stop >= self.a_pass:
            raise ValueError("a_stop must be more negative than a_pass")
        if self.filter_type == "digital" and self.sampling_freq is None:
            raise ValueError("sampling_freq is required for digital filters")
        if self.filter_type == "digital" and self.sampling_freq is not None:
            # convert w_stop to hz for nyquist check if needed
            w_stop_hz = self.w_stop if self.freq_unit == "hz" else self.w_stop / (2 * math.pi)
            if self.sampling_freq <= 2 * w_stop_hz:
                raise ValueError("sampling_freq must be greater than 2 × w_stop (Nyquist criterion)")
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
    order: int
    epsilon: float
    poles: list[ComplexNumber]
    zeros: list[ComplexNumber]
    poly_num: list[float]
    poly_den: list[float]
    freq_response: FrequencyResponse
    locus_type: str
    locus_params: dict
    digital_coeffs: Optional[dict] = None
    warnings: list[str] = []