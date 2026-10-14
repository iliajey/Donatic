"""Base settings shared by all environments (Phase 1 foundation).

Env-var driven. No secrets are hardcoded here.
"""
import os
from pathlib import Path
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-only-insecure-secret-key-change-me")

DEBUG = False

ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if h.strip()
]


def _parse_database_url(url: str) -> dict:
    """Minimal DATABASE_URL parser (no extra dependencies).

    Supports:
      - sqlite:///relative/or/abs/path.db  (default when DATABASE_URL unset)
      - sqlite:////abs/path.db
      - postgres://user:pass@host:port/dbname
      - postgresql://user:pass@host:port/dbname
    """
    parsed = urlparse(url)
    scheme = parsed.scheme.lower()

    if scheme == "sqlite":
        # urlparse keeps netloc+path for sqlite URLs; handle both
        # sqlite:///db.sqlite3 -> path=/db.sqlite3, netloc empty
        # sqlite:////tmp/x.db  -> path=//tmp/x.db
        raw_path = (parsed.netloc + parsed.path) if parsed.netloc else parsed.path
        # A single leading "/" with a relative name means backend/<name>
        if raw_path.startswith("/") and not raw_path.startswith("//") and len(raw_path) > 1 and "/" not in raw_path[1:]:
            name = (BASE_DIR / raw_path.lstrip("/")).as_posix()
        elif raw_path.startswith("//"):
            name = raw_path[1:]  # absolute posix path
        elif os.path.isabs(raw_path):
            name = raw_path
        else:
            name = (BASE_DIR / raw_path).as_posix() if raw_path else (BASE_DIR / "db.sqlite3").as_posix()
        return {"ENGINE": "django.db.backends.sqlite3", "NAME": name}

    if scheme in ("postgres", "postgresql"):
        return {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": (parsed.path or "/").lstrip("/"),
            "USER": parsed.username or "",
            "PASSWORD": parsed.password or "",
            "HOST": parsed.hostname or "",
            "PORT": str(parsed.port) if parsed.port else "",
        }

    raise ValueError(f"Unsupported DATABASE_URL scheme: {scheme!r}")


_database_url = os.environ.get("DATABASE_URL", "").strip()
if _database_url:
    DATABASES = {"default": _parse_database_url(_database_url)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "apps.health",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    # API versioning: URL path versioning, e.g. /api/v1/health/.
    "DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.URLPathVersioning",
    "DEFAULT_VERSION": "v1",
    "ALLOWED_VERSIONS": ["v1"],
    "VERSION_PARAM": "version",
    # Consistent error envelope for every DRF error response.
    "EXCEPTION_HANDLER": "apps.health.exceptions.drf_exception_handler",
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}
