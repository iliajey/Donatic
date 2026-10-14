# Frontend Architecture — Donatic

> Stack: React Native + TypeScript (Expo, React Native Web for web).
> Brand: premium playful donut builder. Cream `#FFF8F0`-ish, pink glaze, gold accents.
> Domain rule: Donut = 1 Base + 0/1 Sauce + 0..N Toppings.
> Animation principle: **User Action > Visual Feedback > Physical Animation > State Change**.

## 1. Monorepo layout (Expo + RN Web)

```
apps/
  mobile/                 # Expo app (iOS/Android), expo-router
  web/                    # thin Vite/Next shell OR same Expo app via RN Web
packages/
  ui/                     # design-system components (Button, Card, Sheet, Price)
  theme/                  # tokens: colors, type, spacing, radii, shadows
  features/
    builder/              # BuilderScreen, layers, sauce/topping pickers, Live Donut
    cart/                 # cart store, fly-to-cart hook, CartSheet
    orders/               # checkout, tracking, celebration
    auth/                # login, session, guards
    admin/                # dashboard, catalog CRUD (gated)
  animation/              # AnimationDirector, useDonutAnimation, worklets
  api/                    # REST client, endpoints, DTOs, validation
  state/                  # zustand stores, query client, persistence
  utils/                  # hash, seeded-random, money, a11y labels
```

- `apps/mobile` is the deployable Expo app; `apps/web` re-exports screens via React Native Web (single codebase, platform files `*.native.tsx` / `*.web.tsx` only at leaf components).
- `packages/*` are TS path-aliased (`@donatic/ui`, `@donatic/builder`, …) with strict `tsconfig` base, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- Builder UX order enforced by router: `Base > Sauce (pour/spread) > Toppings (fall/settle) > Live Donut > Add to cart (fly-to-cart)`.

## 2. Theme (`packages/theme`)

```ts
export const palette = {
  cream: '#FFF8F0', glazePink: '#F7A8C4', glazeDeep: '#E85D9E',
  cocoa: '#4A2C21', gold: '#D4A24C', white: '#FFFFFF',
} as const;
```

- Tokens only (no raw hex outside theme). Dark-mode not required V1; ensure 4.5:1 text contrast on cream.
- Typography: display (rounded, e.g. Baloo/Fredoka via Expo Font), body (Inter/System).
- Spacing 4pt grid, radii: card 20, pill 999, donut ring tokens for builder canvas.

## 3. Navigation

- `expo-router` stacks: `(tabs)/builder`, `(tabs)/menu`, `/cart`, `/checkout`, `/orders/[id]`, `/admin/*` (role-guarded).
- Deep links: `donatic://builder?base=…&sauce=…&toppings=…` reconstructs composition (see DONUT_BUILDER_ARCHITECTURE.md).
- Web mirrors routes via RN Web + router adapter; SEO pages (`/menu`) can be static.

## 4. API layer (`packages/api`)

- Single `apiClient` (fetch wrapper): base URL from env, JSON, timeout 15s, typed errors (`ApiError { code, message, fieldErrors? }`).
- Endpoints: `/catalog`, `/cart/validate`, `/orders`, `/orders/:id`, `/auth/*`, `/admin/*`.
- DTOs versioned (`v1/`), zod schemas shared client/server for composition validation.
- Auth header injection + 401 refresh + retry-once.

## 5. State — Zustand + TanStack Query (decision)

- **Decision: Zustand for client state, TanStack Query for server state.** No RTK Query (lighter, suits Expo).
- Stores: `useBuilderStore` (transient composition + step), `useCartStore` (persisted), `useSessionStore` (auth), `useUiStore` (sheets, toasts, motion prefs).
- Server data (catalog, orders, admin) via TanStack Query with stale-while-revalidate; mutations invalidate.
- Why not Redux: less boilerplate, smaller bundle, per-store selectors avoid re-renders during 60fps animations (animation values stay in Reanimated shared values, never in Zustand).

## 6. Auth storage

- Tokens in `expo-secure-store` (native) / `httpOnly` cookie session for web — never AsyncStorage/localStorage for refresh tokens.
- `useSessionStore` holds in-memory access token + expiry; silent refresh on 401; logout clears SecureStore + Query cache + cart PII.

## 7. Reduced motion & accessibility

- Global `prefersReducedMotion = useReducedMotion()` (Reanimated) OR `AccessibilityInfo.isReduceMotionEnabled()`.
- When on: skip pour/drop/fly/confetti — instant crossfade + state change; haptics off. Expose Settings toggle overriding OS.
- All builder controls real buttons with `accessibilityLabel` (e.g. "Add strawberry glaze sauce"); Live Donut has live-region description.

## 8. Offline cart

- `useCartStore` persisted (AsyncStorage, MMKV if installed) with schema version + migration.
- Offline: add/edit/remove works locally; `pendingSync` queue; on reconnect `POST /cart/validate` (price/stock check) then reconcile (keep local, flag conflicts).
- Canonical hash per line item (see builder doc) enables dedupe offline.

## 9. Performance / code-splitting

- Bundle: lazy-route admin (`React.lazy`), `expo-router` automatic splitting; SVG sprite sheets for toppings; images via `expo-image` with `contentFit`, thumb→full.
- Lists: FlashList for catalog/cart; `memo` on topping sprites; animation values off-JS-thread (Reanimated worklets).
- Budget: TTI < 2.5s mid-tier Android, JS bundle mobile < 1.2MB gz initial, 60fps builder interactions.

## 10. Testing / linting

- ESLint (expo config + `@typescript-eslint`, import order, no raw-color rule via custom lint), Prettier, `tsc --noEmit` in CI.
- Tests: Vitest unit (hash, scatter, validation, stores), Maestro smoke (build→add→checkout), Playwright web (builder flow + reduced-motion snapshot), visual regression on Live Donut compositions.
- CI gates: lint + typecheck + unit + bundle-size check.
