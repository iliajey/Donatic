# Donatic API — Phase 2 (Catalog + Server Pricing)

Django + DRF: health endpoint, real product catalog (base donuts, sauces,
toppings) with Django Admin CRUD, public catalog API, and a
server-authoritative composition validate/price endpoint. No
auth/checkout/orders/payments (out of scope until Phase 3).

## Stack (pinned, verified on Python 3.14.8)

From `requirements.txt`:

- `Django==5.2.18`
- `djangorestframework==3.18.3`
- `Pillow==11.3.0` (catalog image validation only)
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
# Found 20 test(s) ... Ran 20 tests ... OK
```

Tests cover: health shape/content-type/no-leak (3), catalog schema +
active-only filtering + ordering (3), validate-price correct totals,
base-only, client-price-ignored, hash stability, price-change (5),
invalid compositions incl. duplicates/limits/types (5), seed idempotency +
admin preservation (2), admin login/CRUD access (2).

## Catalog & pricing (Phase 2)

Models (`apps/catalog/`): `BaseDonut`, `Sauce`, `Topping` — name, unique
slug, description, integer IRR `price` (never floats), optional image
(jpg/jpeg/png/webp only, SVG rejected, max 5 MB), `visual_key` + `color`
for the 2D renderer, `is_active`, `sort_order`, timestamps. Public API
returns only active items ordered by `sort_order, name, id`.

Endpoints (`/api/v1/`):

- `GET catalog/` — combined builder entry point
- `GET base-donuts/`, `GET sauces/`, `GET toppings/`
- `POST donut-compositions/validate-price/`
  `{"base_donut_id":1,"sauce_id":2,"topping_ids":[3,5]}` →
  `{valid, canonical, composition_hash, breakdown, total_price}`.
  Rules: exactly 1 active base, 0/1 active sauce, no duplicate toppings,
  max 8 toppings. Client prices are ignored; the `dn_*` hash identifies
  the composition, not a price quote.

Seed (idempotent demo data — 4 bases, 3 sauces, 8 toppings):

```powershell
.\.venv\Scripts\python manage.py seed_catalog --settings=config.settings.dev
```

Safe to rerun: keyed on slug, never duplicates, never overwrites an
admin's customized price/name/availability. Admin CRUD at `/admin/`.

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
- **CORS:** dev settings include a tiny stdlib middleware
  (`config/dev_cors.py`) allowing cross-origin GET/POST to `/api/*` for
  local web development only. Prod has no CORS middleware (strict).
