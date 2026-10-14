# System Architecture — Donatic

Donut ordering platform. Composable product model, server-truth pricing, daily queue.

## 1. Vision

- Customer-facing ordering (web + iOS + Android) for customizable donuts.
- `Donut = 1 Base + 0/1 Sauce + 0..N Toppings`. All composition validated and priced server-side.
- Order lifecycle: `PENDING > CONFIRMED > PREPARING > READY > COMPLETED`, plus `CANCELLED` paths.
- Daily pickup queue starts at `100`, resets each business day, concurrency-safe.
- Admin dashboard, reporting, loyalty-ready. Layered-2D-first Donut Builder with 3D upgrade path.

## 2. Monorepo Layout

```text
backend/    # Django + DRF + PostgreSQL API
mobile/     # React Native + TypeScript (Expo, web + iOS + Android)
docs/
  architecture/
  api/
  product/
  ops/
assets/     # logos, builder sprites, static design assets
```

Current workspace contains only root assets (`logo*.jpeg`); `backend/`, `mobile/`, `docs/` are greenfield and follow this layout.

## 3. Component Diagram (text)

```text
[Expo App: web/iOS/Android]
        |  HTTPS /api/v1 (JWT)
        v
[Django + DRF API]
   |-- catalog / builder / cart / orders / queue
   |-- payments (stub) / loyalty / discounts (stubs)
   |-- users-auth / notifications / reporting / admin
        |              |                 |
        v              v                 v
[PostgreSQL]      [Redis]          [Celery/RQ worker]
 system of record  OTP/cache/       OTP expiry, ETA
                   rate-limit/      recalc, reports,
                   realtime pub     notifications
```

## 4. Tech Stack + Decisions

| Layer | Choice | Decision rationale |
|---|---|---|
| Frontend | React Native + TypeScript, Expo | Single codebase for web+iOS+Android |
| Builder rendering | Layered 2D sprites first, 3D upgrade path | Faster to ship, deterministic; 3D later without API change |
| Backend | Python Django + DRF | API-first, admin + ORM + auth ecosystem |
| DB | PostgreSQL | Constraints (`UniqueConstraint`), `SELECT FOR UPDATE`, audit |
| Cache/OTP/RT | Redis | OTP TTL, rate-limit counters, price/cache, realtime pub |
| Auth | Phone + OTP, JWT access/refresh | Low-friction ordering; email-link, Google/Apple ready |
| Jobs | Celery or Django-RQ + Redis | OTP cleanup, ETA, notifications, report aggregates |
| Files | Django media (S3-compatible path later) | Builder sprite uploads, admin-managed catalog images |

## 5. Environments

- `dev`: SQLite allowed for bootstrap, Postgres preferred; debug toolbar; Expo Go.
- `staging`: Postgres + Redis, production-like settings, separate JWT keys.
- `prod`: Postgres (managed), Redis (managed), HTTPS-only, rate limits on, audit logs on.
- Config via env vars only (see `BACKEND_ARCHITECTURE.md` settings strategy). No secrets in repo.

## 6. Redis Evaluation — Yes

Use Redis for:
- OTP storage with TTL + attempt counters (rate-limit brute force).
- API rate limiting (order-create, OTP request/verify).
- Catalog/price cache (short TTL, invalidated on admin change).
- Realtime order-status pub/sub channel (polling fallback).
- Celery/RQ broker + result backend.

Not used as source of truth for orders, pricing, or queue numbers.

## 7. Security Overview

- JWT short-lived access + refresh rotation; phone+OTP login.
- Server-side pricing only; client totals are display hints.
- Idempotency keys on order create; permission classes per role (customer/staff/admin).
- CORS allowlist, CSRF for admin/session paths, rate limits on auth endpoints.
- PII minimization (phone), audit logs on status/price/admin changes.

## 8. Reporting / Analytics Hooks

- `reporting` app aggregates daily sales, queue throughput, top bases/toppings.
- Client analytics events ingested via `POST /api/v1/analytics/events` (builder steps, checkout funnel).
- Loyalty/discounts stubbed so reporting schema stays stable when enabled.

## 9. Risks

- Queue race under burst load → mitigated by DB transaction + row lock (see backend doc).
- Business-day boundary bugs → single timezone-aware `business_date` service.
- Builder asset sprawl → sprite naming convention + admin validation.
- Price drift client/server → server recomputes at cart and order time.

## 10. Evolution Path

1. MVP: catalog + builder (2D) + cart + orders + queue + phone/OTP + admin.
2. Payments integration (stub endpoint first), notifications (SMS/push).
3. Loyalty points + discounts engine.
4. 3D builder renderer (same composition JSON / price API).
5. Multi-store support (add `store` FK to queue/orders).
