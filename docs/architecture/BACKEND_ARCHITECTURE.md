# Backend Architecture — Donatic (Django + DRF)

API-first. PostgreSQL is source of truth. Redis for OTP/cache/rate-limit/realtime. All pricing server-side.

## 1. App Layout

```text
backend/
  config/settings/   # base.py, dev.py, staging.py, prod.py
  apps/
    catalog/         # Base, Sauce, Topping, Product availability, images
    builder/         # composition validation + price preview service
    cart/            # cart + cart items (server-persisted)
    orders/          # Order, OrderItem, state machine, ETA
    queue/           # DailyQueue (business_date, queue_number)
    payments/        # stub: intent/create, webhook ready (future)
    users/           # custom user (phone), auth = phone+OTP + JWT
    notifications/   # OTP send, status push/SMS hooks
    loyalty/         # stub models (points ledger ready)
    discounts/       # stub (promo code, rules engine ready)
    reporting/       # aggregates, admin reports
    admin_dashboard/ # staff/admin views, permissions
  common/            # permissions, pagination, errors, idempotency, time utils
```

## 2. Settings / Env Strategy

- Split settings: `base.py` + per-env overrides. Env vars via `django-environ` (or equivalent).
- Required env: `DATABASE_URL`, `REDIS_URL`, `JWT_SIGNING_KEY`, `OTP_TTL`, `TIME_ZONE`, `BUSINESS_DAY_START_HOUR`, `CORS_ALLOWED_ORIGINS`, `MEDIA_STORAGE`.
- No defaults for secrets. Fail fast on missing env in staging/prod.

## 3. Auth

- Primary: phone + OTP. Flow: `request-otp` (rate-limited, Redis TTL) > `verify-otp` > issue JWT pair.
- JWT: short-lived access + rotating refresh (SimpleJWT or equivalent).
- Ready (stubbed): email magic-link, Google/Apple OAuth — same user model keyed on verified identity.
- Permissions: `IsAuthenticated` for cart/orders; `IsStaff` / `IsAdmin` for catalog management, queue override, reports. Object-level: users only see own orders.

## 4. Server-Side Pricing Service

- Location: `builder/services.py`: `validate_composition(base, sauce, toppings)` + `price_composition(...)`.
- Rules: exactly 1 Base (required, available), 0/1 Sauce (available, compatible), 0..N Toppings (available, max count, no duplicates).
- Formula: `unit_price = base.price + sauce.price (if any) + SUM(topping.price)`; `line_total = unit_price * qty`; order total = sum lines + fees − discounts (discounts stubbed at 0).
- Recomputed at: builder preview, cart add/update, order create. Client-submitted totals ignored.

## 5. Order State Machine + ETA Service

- States: `PENDING > CONFIRMED > PREPARING > READY > COMPLETED`, plus `CANCELLED` from `PENDING/CONFIRMED` (customer) or any non-terminal (staff with reason).
- Implement as `orders/services.py` transition functions with allowed-transition map; invalid transitions return 409.
- Audit: `OrderStatusLog(order, from, to, actor, reason, at)` on every transition.
- ETA service: `eta = queue_position * avg_prep_seconds + base_offset`; recomputed on confirm/prepare; exposed via order detail; realtime pub on change.

## 6. DailyQueue Concurrency

- Model: `DailyQueue(business_date: date, queue_number: int, order: OneToOne)` with `UniqueConstraint(business_date, queue_number)`.
- Counter: `DailyCounter(business_date PK, next_number)`; queue starts at 100.
- Allocate inside `transaction.atomic()`:
  1. `SELECT FOR UPDATE` the `DailyCounter` row for `business_date` (create if missing).
  2. Take `next_number`, increment, save.
  3. Create `DailyQueue` row. UniqueConstraint is the backstop; retry on `IntegrityError`.
- Never compute `MAX(queue_number)+1` without a lock.

## 7. Timezone / Business-Day Handling

- Single `common/time.py:get_business_date(now)`: timezone-aware (`TIME_ZONE` setting); if `now.time() < BUSINESS_DAY_START_HOUR`, business date = previous calendar day.
- All queue/reporting logic uses `business_date`, never raw `now().date()` inline.

## 8. File Uploads

- Catalog images / builder sprites via Django `ImageField`; validate type/size/dimensions server-side.
- Local media in dev; S3-compatible backend in staging/prod via storage setting switch. URLs served by API.

## 9. Audit Logs

- `OrderStatusLog`, `PriceSnapshot` (unit price + composition frozen on OrderItem), `AdminActionLog`. Immutable append-only tables.

## 10. Background Jobs

- Celery or Django-RQ with Redis broker: OTP expiry/cleanup, ETA recalc fan-out, notification dispatch, nightly report aggregates.
- Idempotent tasks (keyed by order/event id). Retries with backoff.

## 11. Caching

- Redis cache: catalog list/detail (short TTL, bust on admin save via signals), price-preview memo (composition hash, short TTL).
- Never cache cart, order, or queue state.

## 12. CORS / CSRF

- DRF token/JWT API: CORS allowlist from env; no wildcard in prod.
- CSRF enforced on Django admin/session endpoints; API JWT paths exempt with rate limiting.
