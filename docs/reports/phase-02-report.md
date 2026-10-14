# Phase 02 Report — Real Catalog, Donut Builder, Pricing API & Cart

## 1. Overall status: COMPLETE

All 13 completion criteria verified (details in sections below). Phase 1
behavior preserved: home page, health endpoint, RTL/LTR toggle,
reduced-motion support, design tokens, response envelope, settings split.
No Phase 3 work started (no auth, checkout, orders, payments, queue).

## 2. Initial repository/environment audit

- Repo at `C:\PROG\Donatic`, git repo, Phase 1 committed; working tree was
  clean at start. Stack confirmed: Django 5.2.18 + DRF 3.18.3
  (`backend/.venv`), Expo SDK 52 / RN 0.76.9 / TS 5.3, SQLite dev DB.
- Node v24.21.0, Python 3.14.8, Chrome present. No PostgreSQL, Redis,
  Docker — unchanged from Phase 1, none installed.
- Backend had only `apps/health`; no catalog code. Frontend builder was
  mock-only (`builderBases/Sauces/Toppings` + `estimateBuilderPrice`);
  API client existed but was not wired to any screen.
- Pillow was missing (needed for `ImageField` validation) → added
  `Pillow==11.3.0` to requirements and installed in `backend/.venv` only.
- Logos: root `logo*.jpeg` untouched (byte sizes 59,763 / 89,969 /
  58,332 verified unchanged via `git status` — no modifications).

## 3. UI UX Pro Max skill: path, workflow, decisions

- Skill path: `C:\PROG\Donatic\.opencode\skills\ui-ux-pro-max\`
  (`SKILL.md` read in full; scripts run with Windows `python`).
- Exact queries executed:
  - `search.py "artisan donut builder customization" --design-system -p "Donatic" -f markdown`
  - `search.py "builder selection cart feedback" --domain ux -n 3`
  - `search.py "touch animation list" --stack react-native`
- Adopted: live-preview-first builder pattern (interactive demo with
  final state available as static content), loading-indicator guidance
  (stable busy status, `aria-busy` roles via LoadingState), Pressable +
  hitSlop + press feedback for all chips/buttons, pre-delivery checklist
  (contrast, focus, reduced-motion, 375px+).
- Rejected: suggested Vibrant purple (`#7C3AED`) palette, JetBrains
  Mono/IBM Plex fonts, block/geometric style — conflicts with Donatic
  cream/pink/chocolate identity and Fredoka+Nunito pairing; kept the
  structural guidance, not the suggested theme.
- Resulting improvements: real-data option chips with price details and
  selected states, itemized server-price card, retry paths on every
  failure, draft persistence across navigation, reduced-motion instant
  final states. Design tokens unchanged (`mobile/src/theme/tokens.ts`).

## 4. Backend models and migrations

- New app `backend/apps/catalog/` (`apps.py`, `models.py`, `admin.py`,
  `serializers.py`, `services.py`, `views.py`, `urls.py`,
  `management/commands/seed_catalog.py`, `tests.py`).
- `CatalogItemBase` (abstract) → `BaseDonut`, `Sauce`, `Topping`: name,
  unique slug, description, integer IRR `price` (`PositiveIntegerField` +
  `MinValueValidator(0)` — never floats), `image` (`ImageField`,
  jpg/jpeg/png/webp only via `FileExtensionValidator`, SVG rejected,
  5 MB limit), `visual_key` + `color` renderer hints, `is_active`
  (indexed), `sort_order` (indexed), timestamps. `Meta.ordering =
  [sort_order, name, id]`. Serializer re-validates non-negative int.
- Migration `catalog/0001_initial.py` created and applied; existing
  database and data preserved (no recreate/delete).
- Admin: all three types registered with list display
  (name/slug/price/active/sort/updated), search, active filter,
  ordering, slug prepopulation, inline price/active/sort editing.
  Price/availability/name/sort changes need no code change.
  Price/availability/name/sort changes need no code change.
- REPORT2

## 5. API endpoints and actual example responses

Base: `/api/v1/` (existing versioning + `{code,message,details}` envelope
kept). Public catalog endpoints need no auth; unknown versions 404.

- `GET /api/v1/catalog/` → `{"currency":"IRR","base_donuts":[...],`
  `"sauces":[...],"toppings":[...]}` (active only, deterministic order).
- `GET /api/v1/base-donuts/`, `/api/v1/sauces/`, `/api/v1/toppings/`.
- `POST /api/v1/donut-compositions/validate-price/`.

Live verified response (dev server, seeded DB):

```
GET /api/v1/health/ -> {"status":"ok","version":"v1","service":"donatic-api"}
GET /api/v1/catalog/ -> 4 bases, 3 sauces, 8 toppings; first base:
{"id":1,"name":"Classic Ring","slug":"classic-ring","price":85000,
 "currency":"IRR","image_url":null,"visual_key":"base:classic",
 "color":"#E8B06E","is_active":true,"sort_order":1}
POST validate-price {"base_donut_id":1,"sauce_id":1,"topping_ids":[1,2]} ->
{"valid":true,"canonical":{"base_donut_id":1,"sauce_id":1,
 "topping_ids":[1,2]},"composition_hash":"dn_f514c306bc83b87a",
 "breakdown":{"base":{"id":1,"name":"Classic Ring","price":85000},
 "sauce":{"id":1,"name":"Strawberry","price":15000},
 "toppings":[{"id":1,"name":"Sugar Pearls","price":10000},
 {"id":2,"name":"Cocoa Nibs","price":12000}],
 "toppings_total":22000,"currency":"IRR"},
 "total_price":122000,"currency":"IRR"}
```

Invalid compositions return `400 {"code":"invalid_composition",
"message":..., "details":{"field":...}}` through the standard envelope.

## 6. Validation rules and pricing implementation

- Service layer `apps/catalog/services.py::validate_and_price` — single
  authority; views contain no pricing logic.
- Rules enforced: exactly one base (int, exists + active); sauce null or
  one int (exists + active); toppings list of ints, deduped
  (duplicates → 400), max 8 (`MAX_TOPPINGS`, documented in code);
  bools/strings/floats rejected; unknown or inactive ids rejected.
- `total = base + sauce + sum(toppings)` from freshly fetched DB rows.
  Any client-submitted price fields are ignored (tested).
- Canonical form sorts topping ids; `composition_hash = dn_ + sha256(
  "v1|base:{b}|sauce:{s|-}|top:{sorted}")[:16]`. Hash identifies the
  composition, not a price quote (changing a price keeps the hash —
  covered by test). No orders persisted, no stock, no writes/locks.

## 7. Seed data and idempotency verification

- `manage.py seed_catalog`: 4 bases / 3 sauces / 8 toppings, deterministic
  slugs, demo IRR prices (documented as demo, not business data).
- `update_or_create` on slug; reruns only fill blank visual fields —
  never touch price/name/availability/sort of existing rows.
- Verified: run 1 created 4/3/8; run 2 created 0/0/0 (counts unchanged);
  admin-set price 123456 survived a reseed (automated test).
  admin-set price 123456 survived a reseed (automated test).
- REPORT3

## 8. Frontend files and components created/modified

Created: `src/api/catalog.ts` (typed catalog + validate-price module),
`src/utils/composition.ts` (canonicalize/hash, pure),
`src/utils/money.ts` (formatIRR, integer sums),
`src/features/cartStore.ts` (pure cart reducer/merge/subtotal),
`src/features/cart.tsx` (CartProvider, in-memory),
`src/features/builderDraft.tsx` (draft survives navigation),
`src/components/DonutRenderer.tsx` (layered renderer),
`src/components/visualMapping.ts` (explicit catalog→visual map),
`screens/builder.tsx` (real builder), `screens/cart.tsx`,
`tests/*.test.mjs` (3 suites), `qa/phase2.mjs` + `qa/animations.mjs` +
`qa/reduced.mjs` (Playwright E2E).
Modified: `App.tsx` (routes home|builder|cart, providers, cart count),
`screens/index.tsx` (real-catalog copy, demo cards still labeled demo),
`components/Header.tsx` (Builder/Cart nav), `hooks/useRoute.ts`,
`api/client.ts` (env URL + `http://127.0.0.1:8000` default; direct
`process.env.X` access so babel inlines it), `components/States.tsx`
(ErrorState + Retry), `components/Footer.tsx` (Phase 2 copy),
`tsconfig.json` (`allowImportingTsExtensions` for node:test imports),
`package.json` (`test` script, dev-only `playwright`).
Deleted: `screens/builder-preview.tsx` (mock replaced by real builder).
No Expo SDK upgrade; no new runtime dependencies.

## 9. Renderer architecture and asset mapping

- Boundary: `DonutRenderer({spec, size, label, reducedMotion})` in
  `components/DonutRenderer.tsx`; `spec: DonutVisualSpec` built only by
  `compositionToVisual()` in `components/visualMapping.ts`. No API,
  pricing, or cart concepts inside the renderer — a future 3D renderer
  replaces these two files without touching business logic.
- Layers: base (ring/twist/pillow shapes via radius) → sauce overlay →
  topping sprites (4 distinct silhouettes: dot/bar/flake/curl assigned
  by slug hash, deterministic seeded scatter in an annulus) → hole +
  shine. Missing colors fall back to safe defaults; null sauce omits
  the layer. Pure Views + `Animated` — no new native deps, works on
  web and native.
- Mapping is explicit per `visual_key`/`color`/slug; real product images
  (`image_url`, currently null in seed data) can replace it later.

## 10. Actual animation implementation and visual QA evidence

- Implementation (all `Animated`, UI-thread, content never gated):
  sauce spreads via scale 0.15→1 + opacity over 650ms on selection
  (remount per sauce color); toppings fall from −45% height with
  45ms stagger (cap 12) + fade; slow 18s rotation loop; price pulse
  (scale 1→1.12→1) on each validated total.
- Reduced motion: rotation off, sauce/toppings jump to final state,
  price pulse skipped (all via `usePrefersReducedMotion`).
- Interrupted selections are safe: motion lives in mount-keyed child
  components, so stale animations unmount with removed ingredients;
  price requests are sequenced (`requestSeq`) with 250ms debounce.
- Evidence (real screenshots, `docs/reports/phase-02/`):
  `builder-pour-mid-800.png` (sauce visibly half-spread),
  `builder-pour-settled-800.png`, `builder-drop-mid-800.png` (gold
  topping mid-fall), `builder-full-800.png` (chocolate + 2 toppings,
  137,000 IRR), `builder-reduced-motion-800.png` (instant final state,
  price visible). All inspected by reading the images, not just code.

## 11. Cart identity, hashing, merge logic, price behavior

- Canonicalization shared with backend semantics: sorted topping ids,
  null-sauce placeholder; client line key = FNV-1a of canonical string
  (`c_*`), server `dn_*` hash stored alongside when validation succeeds.
- Merge: identical canonical → same line, quantity+1 (verified live:
  133,000 → 266,000 for two identical adds). Different sauce/toppings/
  base → separate lines (verified: 2 lines, subtotal 393,000).
- Collision safety: reducer compares full canonical strings before
  merging, never merges on key alone.
- Money: integer IRR everywhere; subtotal = Σ unit×qty. Displayed
  prices are labeled server estimates ("Server price" badge + "latest
  server estimates — no order is placed"); price revalidates on every
  composition change with explicit retry after errors. In-memory only
  (no persistence — documented); cart survives builder↔cart navigation
  via root `CartProvider`. No orders, queue numbers, or stock effects.
  via root `CartProvider`. No orders, queue numbers, or stock effects.
- REPORT4

## 12. Exact commands executed and their results

Backend (`backend/`, dev settings):
- `manage.py makemigrations catalog` → `0001_initial.py` (3 models).
- `manage.py migrate` → all applied OK (incl. `catalog.0001_initial`).
- `manage.py check` (dev) → no issues. `manage.py test -v 1` → 20/20 OK.
- `manage.py seed_catalog` twice → `4/3/8 created`, then `0/0/0`.
- `manage.py runserver 127.0.0.1:8000` → live health/catalog/
  validate-price smoke tests all 200 with exact payloads (sec. 5).
- `pip install "Pillow>=11,<12"` → Pillow-11.3.0 in `backend/.venv`.

Frontend (`mobile/`):
- `npm run typecheck` → 0 errors. `npm run lint` → 0 errors, 0 warnings.
- `npm test` → 15/15 pass (node --test, no framework).
- `npm install -D playwright@1.49.1` + `npx playwright install
  chromium` → Chromium 131 downloaded (QA tooling only).
- `npx expo export --platform web --clear` (with
  `EXPO_PUBLIC_API_URL=http://127.0.0.1:8000`) → `Exported: dist`,
  bundle 475 kB.
- `node qa/phase2.mjs` → ALL PASS (22 checks). `node
  qa/animations.mjs` + `node qa/reduced.mjs` → clean.
  `qa/reduced.mjs` → clean.
- REPORT5

## 13. Backend test totals and frontend test totals

- Backend: 20/20 pass — health 3, catalog endpoints 3, pricing valid 5,
  pricing invalid 5, seed 2, admin 2.
- Frontend: 15/15 pass — composition 5, cart store 5, visual mapping 3,
  money 2. Plus Playwright E2E: 22/22 checks pass against the live API.
- Typecheck, lint, web build: all green.

## 14. Build, browser, responsive, accessibility, RTL/LTR results

- Web build (`expo export`): success, `dist/` (475 kB bundle).
- Browser (Playwright Chromium, real backend): home renders, builder
  loads live catalog, server price + breakdown appear, add-to-cart,
  merge (qty 2), distinct lines, increment/decrement, 390px + 800px
  with no horizontal overflow, RTL mirrors correctly, empty-cart
  state, zero console errors, zero page errors.
- Accessibility preserved: checkbox roles + `aria-checked`, price
  `aria-label`s, quantity/remove labels, image labels, alert/progress
  roles, 44pt targets, hitSlop. Reduced-motion run: price visible,
  final state rendered, no errors.
- NOT re-run: Lighthouse (Phase 1 triple-1.0 stands; no a11y
  regressions introduced — same roles/tokens, verified in DOM).
  Native (Expo Go) run: not executed — web + typecheck only.

## 15. Screenshot paths (`docs/reports/phase-02/`)

`home-800.png`, `builder-initial-800.png`, `builder-sauce-800.png`,
`builder-toppings-800.png`, `builder-pour-mid-800.png`,
`builder-pour-settled-800.png`, `builder-drop-mid-800.png`,
`builder-full-800.png`, `builder-reduced-motion-800.png`,
`cart-filled-800.png`, `cart-two-lines-800.png`, `cart-390.png`,
`cart-empty-800.png`, `home-rtl-800.png`. All real captures from the
tested build; each key frame was visually inspected.
  tested build; each key frame was visually inspected.
- REPORT6

## 16. Security considerations

- Public catalog/pricing need no auth (browsing only); admin stays
  behind Django session auth (login required, tested).
- Client prices never trusted; error envelope never leaks tracebacks.
- Uploads: SVG rejected by extension allowlist, 5 MB cap, Pillow image
  validation; media served only if configured (seed uses no files).
- Dev CORS middleware is dev-settings-only (`/api/*`, no credentials);
  prod unchanged and strict. No secrets committed (`.env.example`
  placeholders only).

## 17. Dependency changes and vulnerability audit

- Backend: added `Pillow==11.3.0` (image validation). No other changes.
- Frontend runtime: zero new dependencies (no Reanimated/Zustand/router
  — RN `Animated` + Context were sufficient and Expo-52-safe).
- Frontend dev-only: `playwright@1.49.1` (E2E QA, not shipped).
- `npm audit --omit=dev`: 54 advisories (17 moderate / 36 high /
  1 critical) — identical count to Phase 1, all inherited from the
  Expo SDK tree (xmldom/braces/tar/postcss chains); fixes require
  breaking Expo upgrades, so deferred. No new prod advisories.
- No `pip audit` run (not installed); Pillow 11.3.0 is the current
  11.x patch line.

## 18. Known bugs, limitations, unverified items

- Catalog images: seed data has `image_url: null`; renderer uses
  color/shape mapping until real photos exist (documented).
- Cart is in-memory: reload clears it (documented; persistence deferred
  to checkout phase).
- Max 8 toppings is a documented client/server guard, not confirmed
  business policy — revisit with the business in Phase 3.
- `?page=` pagination not implemented on list endpoints (small catalog;
  deferred).
- Native-device run (Expo Go) not executed; LAN-IP procedure documented
  but not field-tested. PostgreSQL concurrency not tested (SQLite only;
  pricing performs no writes so no lock risk).
- Lighthouse not re-run (see sec. 14).

## 19. Architecture deviations and rationale

- Dev-only stdlib CORS middleware instead of `django-cors-headers`:
  zero-dependency, dev-settings-only, sufficient for local web QA.
- No Reanimated/Zustand/TanStack Query: RN `Animated` + Context +
  direct fetch cover Phase 2 needs with zero compat risk on SDK 52;
  adopt heavier libs only when checkout/offline demands them.
- No `react-native-svg`: pure-View renderer keeps web/native parity
  without native deps.
- `allowImportingTsExtensions` (+ explicit `.ts` extension in one
  import): required so `node --test` can import pure TS sources via
  Node 24 type-stripping; Metro bundles it fine.
- Builder draft context added after QA caught draft loss on
  navigation (spec requires lossless builder↔cart navigation).

## 20. Deferred work and next-phase recommendation

- Phase 3: phone-OTP/JWT auth, checkout + order creation (server
  repricing at submit), daily queue numbers, payments, order lifecycle,
  Postgres/Redis wiring, cart persistence, real product photography,
  native-device field test, Lighthouse re-run.
- Recommended first: auth + `POST /orders` consuming the canonical
  composition + server hash (both already produced), reusing
  `validate_and_price` at submit time.

