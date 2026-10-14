"""Production settings. Everything sensitive comes from env vars."""
import os

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403

if not os.environ.get("DJANGO_SECRET_KEY"):
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set in production.")

DEBUG = os.environ.get("DJANGO_DEBUG", "false").lower() in ("1", "true", "yes")

_allowed = os.environ.get("DJANGO_ALLOWED_HOSTS", "").strip()
ALLOWED_HOSTS = [h.strip() for h in _allowed.split(",") if h.strip()]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# CORS note (prod): configure exact allowed origins via django-cors-headers when a
# browser client exists. Do NOT use CORS_ALLOW_ALL_ORIGINS=True in production.
# Deferred (with Docker/Postgres/Redis wiring) until deployment phase.
