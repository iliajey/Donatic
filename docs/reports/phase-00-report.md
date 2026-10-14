# Phase 0 Report

## Status
PHASE 0 COMPLETE — audit and architecture design done. No Phase 1 implementation started.
## Project Audit
Repo contained only brand logos plus .opencode agent skills. No code, no backend, no mobile app, no docs. Greenfield build. No git repo. Toolchain: Node v24 present; Python and PostgreSQL not installed locally (Phase 1 setup).
## Existing Files / Structure
Root holds logo.jpeg (59,763 B), logo 2.jpeg (89,969 B), logo black and white.jpeg (58,332 B), and .opencode/skills/. No backend/, mobile/, tests, or CI. Target monorepo layout (docs/architecture/SYSTEM_ARCHITECTURE.md): backend/ for Django+DRF, mobile/ for Expo RN+TS, assets/ for logos and builder sprites, docs/ for architecture and reports.

## Existing Assets
All three JPEGs inspected and preserved in place, unmodified:
- logo.jpeg: primary mark, 3D donut with pink glaze and cream dough, gold serif Donatic wordmark with MADE WITH LOVE tagline on cream. Defines brand: premium, playful, pink/white/gold.
- logo 2.jpeg: same artwork on black, for dark mode and splash screens.
- logo black and white.jpeg: flat mono line version, for print, receipts, single-color use.
Derived tokens: cream near #FFF8F0, glaze pink near #F2A7B8, gold near #B98A2F, ink near #1A1A1A. Phase 1 should export SVG/WebP plus responsive sizes; keep JPEGs as masters.

## Technology Decisions
- Frontend: React Native plus TypeScript via Expo, React Native Web for web. One codebase for Web/iOS/Android.
- State: Zustand for client state, TanStack Query for server state. Animation values stay in Reanimated shared values, never in state stores.
- Animation: Reanimated 3 worklets plus Gesture Handler plus expo-haptics.
- Builder renderer for Phase 1: layered 2D (SVG base plus sauce overlay plus topping sprites with seeded scatter). Comparison of Lottie/Rive/Skia/Three.js/R3F/full-3D in docs/architecture/DONUT_BUILDER_ARCHITECTURE.md; renderer-swap contract keeps a 3D upgrade path open without changing the composition model.
- Backend: Python Django plus DRF, PostgreSQL as source of truth, API-first.
- Redis: adopted for OTP store, rate limiting, cache, realtime pub/sub, and job queue.
- Auth: phone plus OTP primary, JWT access/refresh, email-link plus Google/Apple kept compatible but not implemented.
- API: REST at /api/v1 with pagination, error envelope, and Idempotency-Key on order creation.
## Backend Architecture
Django apps: catalog, builder, cart, orders, queue, payments, users/auth, notifications, loyalty, discounts, reporting, staff-admin. Settings per environment via env vars, secrets never in repo. Every cart write and order create runs through a server-side pricing service recomputed from live catalog rows. See docs/architecture/BACKEND_ARCHITECTURE.md.

## Frontend Architecture
Expo monorepo: apps/mobile plus packages/ui plus feature folders (builder, cart, orders, auth, admin) plus theme, navigation, api layer, and shared utilities. No hundreds of empty files up front. Offline cart draft, FlashList for catalog/cart, memo on topping sprites, code splitting and lazy routes. See docs/architecture/FRONTEND_ARCHITECTURE.md.

## Database Architecture
PostgreSQL via Django ORM. Minimum model: User, Address, BaseDonut, Sauce, Topping, DonutConfiguration plus components, Cart/CartItem with config_hash, Order/OrderItem plus ItemTopping with unit-price snapshots, DailyCounter plus Order.business_date and queue_number, Payment, Discount/Coupon, Notification, LoyaltyAccount/Transaction, Referral, AuditLog, AnalyticsEvent, CMSBlock. Order items are immutable snapshots so later price or availability edits never rewrite history. Catalog rows use is_active plus sort_order plus availability flags; soft-delete preferred over hard delete. UniqueConstraints on (business_date, queue_number) and (cart, config_hash). Reporting indexes included so daily/weekly/monthly reports need no redesign. See docs/architecture/DATABASE_ARCHITECTURE.md.

## Authentication Architecture
Phone plus OTP primary: request code (Redis-backed, TTL, per-phone and per-IP rate limits, max attempts, resend cooldown), verify, issue JWT access plus refresh rotation. Email linking field reserved; Google/Apple provider slots reserved; no social login in Phase 0. Admin uses Django staff roles plus object-level checks where needed. Abuse protection: OTP throttling, login attempt caps, device binding hooks.

## Donut Domain Model
Donut equals 1 Base plus 0 or 1 Sauce plus 0..N Toppings. Enforced at DB check constraints, serializer validation, and pricing service. Each topping carries its own price. Canonical composition JSON: base slug, nullable sauce slug, sorted topping slugs, plus a canonical hash used for cart consolidation and idempotent reorder. Example: classic base plus nutella plus m_and_m, pistachio, oreo. Server validates, reprices, and reproduces every configuration; frontend state is never trusted.

## Donut Builder Architecture
Flow: Choose Base, Choose Sauce, Choose Multiple Toppings, See Live Donut, Add to Cart. Renderer contract is composition-in plus frame-out, so layered 2D can later be replaced by Skia or Three.js without touching cart, pricing, or orders. Topping scatter uses seeded RNG so a configuration renders identically everywhere and can be re-rendered on receipts and admin screens. Edit and duplicate reuse the same composition object. See docs/architecture/DONUT_BUILDER_ARCHITECTURE.md.
## Animation Strategy
Reusable system, not scattered logic: an AnimationDirector plus a useDonutAnimation state machine. All progress values are Reanimated SharedValues orchestrated in worklets; JS only sends events and completion callbacks. Choreography: sauce pours via SVG mask progress, toppings fall with spring and settle bounce plus haptic ticks, add-to-cart flies toward the cart icon, order completion fires a confetti micro-interaction. Fallback ladder: full motion, simplified crossfade sprites, static composite for low-end devices, and prefers-reduced-motion support. 60fps budget with dev FPS sampling. See docs/architecture/ANIMATION_ARCHITECTURE.md.

## Daily Queue Strategy
First order of each business day gets 100, then 101, 102, and so on. Implementation: DailyCounter row per business_date created lazily via get_or_create (no cron), allocation inside transaction.atomic plus select_for_update on the counter row, then assign to the Order. UniqueConstraint on (business_date, queue_number) as a backstop so a duplicate can never commit. Cancelled numbers are permanently consumed, never reused, for fairness and audit simplicity; gaps are acceptable. Business date is computed in the store timezone setting, configurable per site. Never compute MAX plus 1 without a lock.

## Order Lifecycle
PENDING to CONFIRMED to PREPARING to READY to COMPLETED, with CANCELLED reachable from PENDING and CONFIRMED by the customer and from any non-terminal state by staff with a reason. ETA service combines per-donut base time, topping complexity factor, queue depth, active-order load, store capacity, and an admin override; rules live in a versioned service so they can evolve without schema changes. READY triggers the customer notification fan-out.

## Pricing Strategy
Final price equals base price plus sauce price plus sum of topping prices, computed server-side on every cart write and frozen as snapshots on order items. Client may display estimates but is never the source of truth. Future discount engine supports percentage, fixed, coupon codes, first-order, minimum basket, campaign and time-based, and customer-specific promotions, all evaluated server-side in a fixed precedence order and recorded on the order for audit.

## Notification Architecture
Event-driven fan-out on order status transitions: order received, confirmed, preparing, ready, completed, cancelled, plus admin alerts for new orders and operational events. Channels designed for in-app, push (Expo/FCM/APNs), SMS/OTP provider compatible, and email compatible, behind one notification dispatcher interface. Only the READY customer message and admin new-order ping are launch-critical; providers are wired in Phase 1 behind the interface, not hardcoded.

## Admin Architecture
Django staff admin plus a fast live order dashboard: queue cards with status, ETA, customer, exact donut configurations, quantities, prices, totals, timestamps, plus accept, reject/cancel with reason, status changes, and ETA override. Catalog management for bases, sauces, and toppings covers name, price, image, availability, active/inactive, featured, and sort order, so a new topping goes live with no code change. Filters, search, sort by queue, and full order history included.

## Reporting Architecture
Append-only AnalyticsEvent stream plus snapshot-rich order tables make daily, weekly, and monthly reports possible with no redesign: orders, revenue, average order value, prep and completion times, cancellations, popular bases/sauces/toppings, topping revenue, peak periods, queue stats, repeat customers, popular combinations, and peak hours. Materialized daily aggregates optional when volume grows.
## Loyalty Architecture
Reserved tables LoyaltyAccount, LoyaltyTransaction, and Referral with an earn/burn ledger designed but not implemented. Hooks placed at order completion for points, plus referral codes, birthday and first-order rewards, tiers, and coupons. No balances are issued in Phase 0.

## Analytics Architecture
Event taxonomy defined: homepage_viewed, builder_started, base_selected, sauce_selected, topping_selected, builder_completed, cart_item_added, checkout_started, order_created, payment_completed, order_ready, order_completed. Funnel analysis (especially builder drop-off) is the launch use case; platform choice deferred to Phase 1.

## Security Architecture
JWT access plus refresh rotation, OTP rate limiting and attempt caps, DRF permission classes plus admin roles plus object-level checks, server-side pricing and order integrity checks, payment verification webhooks (future), validated image uploads (type/size/dimensions), AuditLog on sensitive actions, CORS allowlist plus CSRF for web admin, env-var secrets, and production hardening checklist (HTTPS, HSTS, DB least-privilege, backups) for Phase 1.

## Testing Strategy
Backend: model, API, permission, pricing (base plus sauce plus toppings fixtures), order-state transition, and queue-concurrency tests including parallel allocation asserting uniqueness from 100. Frontend: TypeScript strict, linting, unit, component, integration, and E2E. Builder-critical path test: a given Base plus Sauce plus Toppings triple must produce identical configuration hash, price, cart item, and order item on client preview and server truth.

## Performance Strategy
60fps builder budget, worklet-driven animation, memo and FlashList, optimized sprite sizes (WebP/SVG), lazy loading and code splitting, API caching and pagination, reduced-motion and low-end fallback ladder, asset size caps so 3D models (if ever adopted) cannot regress mobile.

## Accessibility Strategy
Keyboard navigation on web, screen-reader labels on every builder control and live-region status announcements, contrast-checked pink/white theme, minimum touch targets, visible loading and error states, and a reduced-motion mode that keeps the full flow usable with static composites.

## Risks
1. Builder scope creep toward full 3D too early. Mitigated by layered-2D-first plus renderer contract. 2. Queue race under concurrency. Mitigated by row lock plus unique backstop plus tests. 3. Client-trusted pricing bugs. Mitigated by server repricing everywhere. 4. No Python/PostgreSQL locally yet, so Phase 1 starts with environment setup. 5. Notification provider lock-in. Mitigated by dispatcher interface. 6. Logo JPEGs are raster only; need vector exports before merch/print scale.

## Technical Debt
None inherited (greenfield). architecture docs written before code, so Phase 1 must keep docs and implementation in sync. No git repo yet; init with clean history in Phase 1. .opencode/skills content is agent tooling, not product code, and stays untouched.

## Decisions Made
D1 layered-2D builder first, 3D later. D2 server-side pricing everywhere. D3 lazy DailyCounter row per business day, start 100, lock plus unique constraint, cancelled numbers consumed. D4 phone-plus-OTP auth, JWT, social-ready but deferred. D5 Redis adopted. D6 Expo RN plus TS for all clients. D7 event-based analytics and notification dispatcher designed, providers deferred.

## Open Questions
Q1 Store timezone and business-day cutoff rule to confirm with owner. Q2 Payment provider choice (deferred to checkout phase). Q3 SMS/OTP vendor and push provider. Q4 Whether ETA should be customer-visible before CONFIRMED. Q5 Launch catalog size and topping price list. Q6 Single store at launch or multi-store from day one (model reserves store setting).

## Files Created / Modified
Created, existing files preserved and unmodified:
- docs/architecture/SYSTEM_ARCHITECTURE.md
- docs/architecture/BACKEND_ARCHITECTURE.md
- docs/architecture/FRONTEND_ARCHITECTURE.md
- docs/architecture/DATABASE_ARCHITECTURE.md
- docs/architecture/API_ARCHITECTURE.md
- docs/architecture/ANIMATION_ARCHITECTURE.md
- docs/architecture/DONUT_BUILDER_ARCHITECTURE.md
- docs/reports/phase-00-report.md (this file)
Modified: none. Deleted: none. Logos untouched.

## Verification Performed
- Project path verified: C:\PROG\Donatic.
- Logos inspected visually (all three variants) and preserved byte-identical; sizes rechecked.
- All 7 architecture docs plus this report present on disk.
- Grep audit of docs confirmed internal consistency: Donut equals Base plus 0/1 Sauce plus 0..N toppings; independent topping prices; server-side pricing; queue starts at 100 with business-day reset; select_for_update plus UniqueConstraint concurrency design; PENDING through COMPLETED plus CANCELLED lifecycle; ETA service; READY notification; Reanimated plus layered-2D builder with 3D path; Expo Web plus Mobile coverage.
- No Phase 1 code implemented: no backend/, mobile/, checkout, payments, loyalty, notifications, admin UI, analytics, or deployment artifacts created.
- Toolchain noted: Node v24 available; Python/PostgreSQL setup deferred to Phase 1.

## Phase 1 Recommendation
Recommended Phase 1 scope: (1) init git plus Python/Django plus PostgreSQL plus Redis environments; (2) catalog models and admin CRUD for bases, sauces, toppings; (3) composition validate plus server pricing endpoint; (4) cart with config-hash consolidation; (5) order create with atomic DailyCounter allocation from 100 plus state machine plus ETA v1; (6) phone-plus-OTP auth with rate limits; (7) layered-2D builder screen with pour/drop animations and fly-to-cart; (8) live status polling/SSE plus READY notification v1; (9) pricing and concurrency test suites. Defer: payments, loyalty balances, full CMS, analytics platform, production deploy.

