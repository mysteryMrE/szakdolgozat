from fastapi import Request
import math
import re

_RATE_LIMIT_GUEST_MULTIPLIER = 3.0

"""
Credits:
https://github.com/laurentS/slowapi/issues/13
"""


def key_by_user_or_ip(request: Request) -> str:
    # IMPORTANT: middleware must add these attributes to the request state
    uid = getattr(request.state, "rate_limit_uid", None)
    ip = getattr(request.state, "rate_limit_ip", None)
    if uid:
        return f"u:{uid}"
    return f"ip:{ip or 'unknown'}"


def select_limit(authenticated_limit: str, unauthenticated_limit: str | None = None):
    guest_limit = unauthenticated_limit or _increased_limit(authenticated_limit)

    def _limit_for_key(key: str) -> str:
        return authenticated_limit if key.startswith("u:") else guest_limit

    return _limit_for_key


"""
AI assisted regex for parsing rate limit strings implementation.
"""


def _increased_limit(
    limit_value: str, multiplier: float = _RATE_LIMIT_GUEST_MULTIPLIER
) -> str:
    match = re.fullmatch(r"\s*(\d+)\s*/\s*([A-Za-z]+)\s*", limit_value)
    if not match:
        return limit_value
    amount = int(match.group(1))
    unit = match.group(2)
    return f"{max(1, math.ceil(amount * multiplier))}/{unit}"
