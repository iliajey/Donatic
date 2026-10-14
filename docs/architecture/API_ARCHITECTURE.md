# API Architecture — Donatic (`/api/v1`)

REST, JSON. Server is truth for pricing, queue numbers, order status.

## 1. Conventions

- Versioning: prefix all routes `/api/v1`. Breaking changes → `/api/v2`.
- Pagination: cursor or page-based, default page size 20: `?page=&page_size=`; responses `{count, next, previous, results}`.
- Errors: `{code, message, details}` with HTTP semantics: 400 validation, 401 auth, 403 permission, 404 missing, 409 state conflict, 429 rate-limit.
- Idempotency: `POST /api/v1/orders` requires `Idempotency-Key` header; same key returns original order (409 on conflicting payload).
- Auth: `Authorization: Bearer <access>`; refresh via `/auth/refresh`.

## 2. Auth Endpoints

```text
POST /api/v1/auth/otp/request   {phone} -> 202 (rate-limited)
POST /api/v1/auth/otp/verify    {phone, code} -> {access, refresh, user}
POST /api/v1/auth/refresh       {refresh} -> {access}
POST /api/v1/auth/logout        (blacklist refresh)
GET  /api/v1/users/me
```

Email-link / Google / Apple: reserved under `/api/v1/auth/` (future).

## 3. Catalog Endpoints

```text
GET /api/v1/bases               list available bases (id, name, price, image)
GET /api/v1/sauces
GET /api/v1/toppings
GET /api/v1/catalog             combined snapshot for builder (versioned)
```

Admin (staff only): `POST/PATCH/DELETE` on each + availability toggle.

## 4. Builder Validate / Price Preview

```text
POST /api/v1/builder/validate   {composition} -> {valid, errors[]}
POST /api/v1/builder/price      {composition} -> {unit_price, breakdown}
```

Rules enforced: 1 base required, 0/1 sauce, 0..N toppings, availability, compatibility. Prices from DB only.

## 5. Cart

```text
GET    /api/v1/cart
POST   /api/v1/cart/items        {composition, qty} -> priced line
PATCH  /api/v1/cart/items/{id}  {qty}
DELETE /api/v1/cart/items/{id}
POST   /api/v1/cart/clear
```

Server reprices every mutation.

## 6. Orders + Status + ETA

```text
POST /api/v1/orders              {cart_id | items[], Idempotency-Key} -> {order, queue_number, eta}
GET  /api/v1/orders              own order history (paginated)
GET  /api/v1/orders/{id}         {status, queue_number, eta, items[], price_snapshot}
POST /api/v1/orders/{id}/cancel  {reason} (customer, PENDING/CONFIRMED only)
```

Staff: `POST /api/v1/orders/{id}/confirm|prepare|ready|complete` with transition guard (409 on illegal). `GET /api/v1/queue/today` → current serving number, waiting count.

## 7. Payments (future)

```text
POST /api/v1/payments/intent     {order_id} -> {client_secret|redirect} (stub)
POST /api/v1/payments/webhook    provider callback (signature-verified)
```

Orders function as pay-at-pickup until enabled.

## 8. Notifications

```text
GET /api/v1/notifications        own notifications
POST /api/v1/devices/register    {platform, token} (push ready)
```

Realtime: WS/SSE channel `order:{id}` planned; polling `GET order detail` is fallback.

## 9. Loyalty / Discounts (future)

```text
GET  /api/v1/loyalty/balance
POST /api/v1/orders/preview      {items[], promo_code?} -> {total, discount, loyalty_earned}
POST /api/v1/discounts/validate  {promo_code} -> {valid, amount}
```

Currently return zero discount; schema stable.

## 10. Admin Groups

- `customer`: cart, orders, own data.
- `staff`: order transitions, queue view, catalog availability.
- `admin`: full catalog CRUD, reports, user management.

## 11. Analytics Events Ingest

```text
POST /api/v1/analytics/events    {event, props, ts} -> 202
```

Events: `builder_step`, `builder_complete`, `checkout_start`, `order_placed`. Batched, auth-optional with rate limit.

## 12. Example Composition JSON + Price Formula

```json
{
  "base_id": "base_classic_glazed",
  "sauce_id": "sauce_choco",
  "topping_ids": ["top_sprinkles", "top_crushed_nuts"],
  "qty": 2
}
```

Price (server-computed):

```text
unit_price = base.price + (sauce.price or 0) + SUM(topping.price)
line_total = unit_price * qty
order_total = SUM(line_total) + fees - discounts
```

Example: base 2.50 + sauce 0.50 + toppings (0.30 + 0.40) = 3.70 unit; qty 2 → 7.40. Response includes `breakdown` and frozen `price_snapshot` on the order.
