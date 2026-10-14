"""Consistent DRF error envelope: {code, message, details}.

Never leaks secrets or tracebacks to clients.
"""
from rest_framework import status
from rest_framework.views import exception_handler


def _envelope(code: str, message: str, details=None, status_code: int = 400):
    from rest_framework.response import Response

    payload = {"code": code, "message": message, "details": details or {}}
    return Response(payload, status=status_code)


def drf_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        status_code = response.status_code
        data = response.data

        if status_code == 400:
            return _envelope("bad_request", "Request failed validation.", data, 400)
        if status_code == 401:
            return _envelope("unauthorized", "Authentication required.", {}, 401)
        if status_code == 403:
            return _envelope("forbidden", "Permission denied.", {}, 403)
        if status_code == 404:
            return _envelope("not_found", "Resource not found.", {}, 404)
        if status_code == 405:
            return _envelope("method_not_allowed", "Method not allowed.", {}, 405)
        if status_code == 429:
            return _envelope("throttled", "Too many requests.", {}, 429)

        if 400 <= status_code < 500:
            message = "Request failed."
            if isinstance(data, dict) and "detail" in data:
                message = str(data["detail"])
            return _envelope("client_error", message, {}, status_code)

        # 5xx from DRF (rare): generic message, no traceback.
        return _envelope(
            "server_error", "Internal server error.", {}, status_code
        )

    # Unhandled exception (incl. Django Http404/PermissionDenied mapped by DRF
    # would have been handled above; this is the true-500 path).
    return _envelope(
        "server_error",
        "Internal server error.",
        {},
        status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
