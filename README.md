# Donatic — Phase 1

Premium artisan donut storefront foundation + visual prototype.
Monorepo: Django/DRF API (`backend/`) + Expo RN/TS app (`mobile/`).

## Quick start

Backend (health API):

```powershell
cd C:\PROG\Donatic\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate --settings=config.settings.dev
python manage.py runserver --settings=config.settings.dev
# GET http://127.0.0.1:8000/api/v1/health/
```

Frontend (web prototype):

```powershell
cd C:\PROG\Donatic\mobile
npm install
npm run typecheck
npm run lint
npm run web:build   # output: dist/
npx expo start --web
```

Mobile targets: `npx expo start` (Expo Go) — see `mobile/README.md`.

## Docs

- `docs/reports/phase-00-report.md` — Phase 0 architecture (source of truth).
- `docs/architecture/` — system, backend, frontend, database, API, animation,
  builder specs.
- `docs/design-system/DESIGN_SYSTEM.md` — tokens, components, motion, a11y.
- `docs/reports/phase-01-report.md` — Phase 1 report.
- `backend/README.md`, `mobile/README.md` — setup details per side.

Brand logos (`logo*.jpeg`) are byte-identical masters; usage in design doc.
