from __future__ import annotations

from typing import Optional

from django.db import DatabaseError, IntegrityError
from rest_framework.exceptions import APIException

try:
    import psycopg2
    from psycopg2 import errorcodes
except Exception:  # pragma: no cover
    psycopg2 = None
    errorcodes = None

try:
    import psycopg
except Exception:  # pragma: no cover
    psycopg = None


class ConflictError(APIException):
    status_code = 409
    default_detail = "Conflict"
    default_code = "conflict"


class BadRequestError(APIException):
    status_code = 400
    default_detail = "Bad request"
    default_code = "bad_request"


class ForbiddenError(APIException):
    status_code = 403
    default_detail = "Forbidden"
    default_code = "forbidden"


def _sqlstate(exc: Exception) -> Optional[str]:
    if getattr(exc, "sqlstate", None):
        return getattr(exc, "sqlstate")
    diag = getattr(exc, "diag", None)
    if getattr(diag, "sqlstate", None):
        return getattr(diag, "sqlstate")
    if getattr(exc, "pgcode", None):
        return getattr(exc, "pgcode")
    cause = getattr(exc, "__cause__", None)
    if getattr(cause, "sqlstate", None):
        return getattr(cause, "sqlstate")
    diag = getattr(cause, "diag", None)
    if getattr(diag, "sqlstate", None):
        return getattr(diag, "sqlstate")
    if getattr(cause, "pgcode", None):
        return getattr(cause, "pgcode")
    orig = getattr(exc, "orig", None)
    if getattr(orig, "sqlstate", None):
        return getattr(orig, "sqlstate")
    diag = getattr(orig, "diag", None)
    if getattr(diag, "sqlstate", None):
        return getattr(diag, "sqlstate")
    if getattr(orig, "pgcode", None):
        return getattr(orig, "pgcode")
    return None


def raise_db_exception(exc: Exception) -> None:
    if (
        not isinstance(exc, (IntegrityError, DatabaseError))
        and (psycopg2 is None or not isinstance(exc, psycopg2.Error))
        and (psycopg is None or not isinstance(exc, getattr(psycopg, "Error", Exception)))
    ):
        raise exc

    code = _sqlstate(exc)
    if code is None:
        raise BadRequestError("Database rejected the operation")

    # SQLSTATE mapping (PostgreSQL)
    if code == "23505":
        raise ConflictError("Conflict")
    if code == "23503":
        raise BadRequestError("Invalid reference")
    if code == "23514":
        raise BadRequestError("Invalid value")
    if code == "23502":
        raise BadRequestError("Missing required field")
    if code == "42501":
        raise ForbiddenError("Forbidden")
    if code == "P0001":
        raise ForbiddenError("Forbidden")

    # psycopg2 fallback when only errorcodes are available
    if errorcodes is not None:
        if code == errorcodes.UNIQUE_VIOLATION:
            raise ConflictError("Conflict")
        if code == errorcodes.FOREIGN_KEY_VIOLATION:
            raise BadRequestError("Invalid reference")
        if code == errorcodes.CHECK_VIOLATION:
            raise BadRequestError("Invalid value")
        if code == errorcodes.NOT_NULL_VIOLATION:
            raise BadRequestError("Missing required field")
        if code == errorcodes.INSUFFICIENT_PRIVILEGE:
            raise ForbiddenError("Forbidden")

    raise BadRequestError("Database rejected the operation")
