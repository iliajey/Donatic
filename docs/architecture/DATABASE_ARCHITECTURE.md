# Donatic — Database Architecture (PostgreSQL + Django ORM)

Status: v1.0 | Store TZ: Europe/Berlin (configurable) | DB: PostgreSQL 15+

Core rules:
- Donut = 1 BaseDonut + 0/1 Sauce + 0..N Toppings, each with independent price.
- Server-side pricing only. Client sends IDs + quantities, never prices.
- Daily queue: first order of day = 100, +1, reset each business day.
- Orders are immutable snapshots. Catalog changes never rewrite history.

## 1. Entities — Catalog

- User(id, email unique, phone, first/last_name, role, is_active, created_at)
- Address(id, user FK, label, street, city, postal_code, country, deleted_at)
- BaseDonut(id, name, slug unique, description, base_price, is_active, is_featured, sort_order)
- Sauce(id, name, slug unique, price, is_active, is_featured, sort_order)
- Topping(id, name, slug unique, price, is_active, is_featured, sort_order)

## 2. DonutConfiguration

- DonutConfiguration(id, base FK NOT NULL, sauce FK NULL, name, config_hash unique, total_price_cached, is_active)
- ConfigurationTopping(id, configuration FK, topping FK, extra_price_snapshot)
- Relationships: Base 1-N Config; Sauce 1-N Config; Config M-N Topping via ConfigurationTopping.
- config_hash = sha256(base_id:sauce_id:sorted(topping_ids)). Enforced unique per active scope.

## 3. Cart

- Cart(id, user FK NULL (guest via session_key), session_key, status, created_at, updated_at)
- CartItem(id, cart FK, configuration FK, quantity, config_hash, unit_price_cached)
- UniqueConstraints: (cart, config_hash). Prevents duplicate rows; quantity merges.
- Pricing: unit_price_cached recomputed server-side on every cart write from live catalog.

## 4. Order (Immutable Snapshot)

- Order(id, user FK, address FK NULL, business_date DATE, queue_number INT, status, subtotal, discount_total, total, currency)
- OrderItem(id, order FK, base_name_snapshot, sauce_name_snapshot, quantity, unit_price_snapshot, line_total)
- ItemTopping(id, order_item FK, topping_name_snapshot, unit_price_snapshot)
- Price-snapshot strategy: every OrderItem/ItemTopping stores name + unit_price_snapshot at checkout. Never FK-join for receipts/reports.

## 5. Daily Queue

- DailyQueueCounter(id, business_date DATE UNIQUE, last_number INT default 99, created_at)
- Order.business_date + Order.queue_number UNIQUE. Index (business_date, queue_number).
- First order of day = 100, then +1. No cron: lazy row-per-day via get_or_create.
- Concurrency: transaction.atomic + select_for_update on counter row, increment, assign to Order.

## 6. Timezone / Reset / Cancelled Numbers

- Store timezone in SiteSettings (e.g. Europe/Berlin). business_date = date in store tz at checkout, not UTC date, not client date.
- Reset strategy: lazy row-per-day. No cron needed. New date -> new counter row starting at 99. Old rows kept for audit.
- Cancelled numbers consumed-not-reused: if Order cancelled, queue_number stays consumed. Rationale: fairness + audit simplicity; gaps acceptable, reuse risks double-call in store display.

## 7. Payment / Discount / Loyalty

- Payment(id, order FK UNIQUE, provider, amount, currency, status, provider_ref, created_at)
- Discount(id, code unique, type percent/fixed, value, min_total, valid_from/to, max_uses, is_active)
- CouponRedemption(id, discount FK, order FK, user FK, amount_applied)
- LoyaltyAccount(id, user FK UNIQUE, points_balance)
- LoyaltyTransaction(id, account FK, order FK NULL, delta, reason, created_at)
- Referral(id, referrer FK, referee FK, code, status, reward_points)

## 8. Notification / Audit / Analytics / CMS

- Notification(id, user FK, order FK NULL, channel, template, payload JSONB, status, sent_at)
- AuditLog(id, actor FK NULL, action, entity, entity_id, diff JSONB, created_at) — append-only, no update/delete.
- AnalyticsEvent(id, user FK NULL, session_key, event_type, props JSONB, created_at) — BRIN on created_at.
- CMSBlock(id, slug unique, title, body_md, is_active, sort_order, updated_at)

## 9. Soft-Delete / Availability / Indexes

- Catalog (Base/Sauce/Topping/CMS/Discount): is_active flag, never hard-delete. Keeps FK history intact.
- User data (Address/Cart): deleted_at timestamp for GDPR erasure; filtered by default manager.
- availability: is_active + sort_order + is_featured drive menu ordering and homepage.
- UniqueConstraints: (business_date, queue_number) on Order; (cart, config_hash) on CartItem; slug unique on catalog; code unique on Discount.
- Indexes for reporting: Order(business_date, status), OrderItem(order), Payment(status, created_at), AuditLog(entity, entity_id), AnalyticsEvent(event_type, created_at).

## 10. Reporting / GDPR / Migrations

- Reporting: daily/weekly/monthly via business_date GROUP BY, sums on Order.total (snapshot, not live join). No redesign needed. Materialized view optional later.
- GDPR: minimize PII (email/phone in User only), addresses soft-deleted on request, AuditLog stores IDs not PII, AnalyticsEvent anonymize IP, retention 13 months.
- Migration/seed plan: 01 catalog tables, 02 config+cart, 03 order+counter+payment, 04 loyalty/discount/referral, 05 notify/audit/analytics/cms. Seed bases/sauces/toppings + CMS blocks.
