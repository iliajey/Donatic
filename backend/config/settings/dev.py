"""Development settings."""
from .base import *  # noqa: F401,F403

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver"]

# Dev-only CORS (Phase 2): the Expo web prototype is served from a different
# origin during local development. This stdlib middleware allows cross-origin
# GET/POST to /api/* in dev only. Prod has no CORS middleware (strict).
MIDDLEWARE = ["config.dev_cors.DevCorsMiddleware"] + MIDDLEWARE  # noqa: F405
