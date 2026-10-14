# Donatic API — Phase 1 Backend Foundation

Minimal Django + DRF foundation. Health endpoint only; no catalog/cart/orders/auth code (out of scope).

## Stack (pinned, verified on Python 3.14.8)

From `requirements.txt` (installed 2026-10-14, all wheels installed cleanly on Python 3.14):

- `Django==5.2.18`
- `djangorestframework==3.18.3`
- `asgiref==3.12.1`, `sqlparse==0.6.0`, `tzdata==2026.5`

## Setup (exact commands executed)

Run from the repo root (`C:\PROG\Donatic`):

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/pip install "Django>=5.2,<6.0" "djangorestframework>=3.15"
backend/.venv/Scripts/pip freeze   # record pins into backend/requirements.txt
```

## Run

From `backend/`:

```powershell
.\.venv\Scripts\python manage.py check --settings=config.settings.dev
# System check identified no issues (0 silenced).

.\.venv\Scripts\python manage.py runserver --settings=config.settings.dev
# GET http://127.0.0.1:8000/api/v1/health/
# -> {"status":"ok","version":"v1","service":"donatic-api"}
```

`manage.py` defaults to `config.settings.dev`, so `--settings=...` may be omitted locally.

## Test

From `backend/`:

```powershell
.\.venv\Scripts\python manage.py test --settings=config.settings.dev -v 2
# Found 3 test(s) ... Ran 3 tests ... OK
```

Tests (`apps/health/tests.py`) cover: 200 + exact JSON shape, `application/json`
content-type, and no leakage of secrets/tracebacks in the response body.

Prod settings also pass system checks:

```powershell
.\.venv\Scripts\python manage.py check --settings=config.settings.prod
# System check identified no issues (0 silenced).
```

## Configuration

- Settings are split: `config/settings/{base,dev,prod}.py`, env-var driven.
- `DATABASE_URL` optional; when unset, SQLite `backend/db.sqlite3` is used.
  `base.py` parses `sqlite:///...` and `postgres(ql)://...` URLs with stdlib only
  (no `dj-database-url` dependency).
- Copy `backend/.env.example` to `backend/.env` for local overrides
  (placeholders only, no real secrets).
- DRF: URL-path versioning (`/api/v1/...`, only `v1` allowed) plus a custom
  exception handler (`apps.health.exceptions.drf_exception_handler`) that returns
  a consistent `{code, message, details}` envelope and never leaks tracebacks.
  Example: `POST /api/v1/health/` → `405 {"code":"method_not_allowed",...}`;
  `GET /api/v2/health/` → `404 {"code":"not_found",...}`.

## Deferred (not required for Phase 1, no Docker needed)

- **Postgres wiring:** set `DATABASE_URL=postgresql://user:pass@host:port/dbname`
  and install `psycopg[binary]` (e.g. `.\.venv\Scripts\pip install "psycopg[binary]"`),
  then `python manage.py migrate`. The `_parse_database_url()` helper in
  `config/settings/base.py` already maps the URL to `django.db.backends.postgresql`;
  only the driver install + a reachable server are missing.
- **Redis/caching:** not installed. When needed: `pip install django-redis`,
  set `CACHES` via env in `prod.py`, and point sessions/cache at it.
- **Docker:** intentionally not used here; the app runs directly on the
  project-local venv (`backend/.venv`). A `Dockerfile`/`compose.yml` can be added
  at deployment time (Python + `pip install -r backend/requirements.txt` +
  `gunicorn`, with `DATABASE_URL` pointing at managed Postgres).
- **CORS:** no middleware installed yet (keeps deps minimal). When a
  browser/mobile-web client needs it, add `django-cors-headers` and set
  `CORS_ALLOWED_ORIGINS` via env (see notes in `dev.py`/`prod.py`).
