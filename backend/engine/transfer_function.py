from engine.common import compute_frequency_response


def compute_analog_response(
    poly_num: list,
    poly_den: list,
    w_pass: float,
    w_stop: float,
) -> dict:
    """
    Compute magnitude, phase and group delay for an analog filter.
    Wrapper around common.compute_frequency_response.
    """
    return compute_frequency_response(
        poly_num=poly_num,
        poly_den=poly_den,
        w_pass=w_pass,
        w_stop=w_stop,
        n_points=2000,
    )