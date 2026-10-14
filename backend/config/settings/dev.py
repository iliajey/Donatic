"""Development settings."""
from .base import *  # noqa: F401,F403

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver"]

# CORS note (Phase 1): no CORS middleware installed yet (keeps deps minimal).
# When the mobile/web client needs cross-origin access, add `django-cors-headers`,
# set CORS_ALLOWED_ORIGINS via env, and insert "corsheaders.middleware.CorsMiddleware"
# at the top of MIDDLEWARE. Deferred until Phase 2.
