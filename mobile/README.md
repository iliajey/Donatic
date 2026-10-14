# Donatic Mobile — Phase 2 (Expo + React Native + TypeScript)

Real catalog-driven Donut Builder + client-side cart. Live backend prices,
layered 2D donut renderer with pour/drop motion, no checkout (ends at cart).

## Prerequisites

- Node 24 (Windows PowerShell)
- No global installs needed; everything runs via `npx` / local `node_modules`.

## Commands executed

```powershell
cd C:\PROG\Donatic\mobile
npm install
npm run typecheck   # tsc --noEmit (strict + noUncheckedIndexedAccess)
npm run lint        # eslint . --ext .ts,.tsx,.js
npm test            # node --test (15 pure-function tests, no framework)
npm run web:build   # expo export --platform web  (output: dist/)
npx expo start --web  # dev server (run manually)
```

API configuration (`src/api/client.ts`): `EXPO_PUBLIC_API_URL` when set,
else safe local default `http://127.0.0.1:8000`.

```powershell
$env:EXPO_PUBLIC_API_URL="http://127.0.0.1:8000"; npx expo export --platform web
```

IMPORTANT for physical devices: `localhost`/`127.0.0.1` on the phone points
at the phone itself. Use the dev machine's LAN IP instead, e.g.
`EXPO_PUBLIC_API_URL=http://192.168.1.50:8000`, then rebuild/restart.
(No secrets involved — the catalog API is public.)

## Running backend + frontend together (dev)

```powershell
# Terminal 1 — API (from C:\PROG\Donatic\backend):
.\.venv\Scripts\python manage.py seed_catalog   # idempotent demo catalog
.\.venv\Scripts\python manage.py runserver 127.0.0.1:8000
# Terminal 2 — web build (from C:\PROG\Donatic\mobile):
$env:EXPO_PUBLIC_API_URL="http://127.0.0.1:8000"
npx expo export --platform web --clear
C:/PROG/Donatic/backend/.venv/Scripts/python.exe -m http.server 8081 --directory dist
# Open http://127.0.0.1:8081 — Builder talks to the live API.
```

## Structure

```
mobile/
  App.tsx                 # entry: route state (home | builder | cart), fonts, dir toggle, cart count
  index.js                # registerRootComponent
  app.json / babel.config.js / tsconfig.json / .eslintrc.json / .prettierrc
  src/
    screens/index.tsx       # Home storefront screen
    screens/builder.tsx     # Real Donut Builder (live catalog + server pricing)
    screens/cart.tsx        # Client-side cart (merge by canonical composition)
    components/DonutRenderer.tsx  # layered 2D renderer (base>sauce>toppings>hole+shine)
    components/visualMapping.ts   # explicit catalog->visual mapping (replaceable)
    components/           # Button, Typography (AppText+Heading), IconButton, Badge,
                          # Price, Section, States (Loading/Error/Toast), DonutVisual,
                          # DonutMark, ProductCard, Header, Footer
    theme/tokens.ts       # design tokens (unchanged from Phase 1)
    animations/tokens.ts  # motion tokens + prefers-reduced-motion hooks
    api/client.ts         # typed fetch wrapper (env URL + local default)
    api/catalog.ts        # typed catalog + validate-price API module
    data/demo.ts          # home demo donuts (isDemo:true) — illustrative only
    hooks/useRoute.ts     # minimal route-state hook
    utils/format.ts       # formatPrice (demo USD cards)
    utils/money.ts        # formatIRR + exact integer sums
    utils/composition.ts  # canonicalize + client hash (pure, tested)
    features/cartStore.ts # cart reducer + merge/subtotal (pure, tested)
    features/cart.tsx     # CartProvider (in-memory, no persistence)
    features/builderDraft.tsx  # builder draft survives navigation
```

## Key decisions

- **No expo-router**: plain route state keeps deps light and `expo export --platform web`
  reliable. Screens live in `src/screens/` (NOT `src/app/`, which Expo would
  claim as the router root). Web `output` is `single` (SPA, no SSR) for the
  same reason; verified build output in `dist/`.
- **Logo**: root `logo.jpeg` files live outside the Expo root, so the asset pipeline can't
  bundle them reliably for web export. Phase 1 uses `DonutMark` (drawn in code) in the
  header. To adopt the real logo later: copy (don't move) it to `mobile/assets/logo.jpeg`
  and `require` it in `Header.tsx`. Root logos untouched.
- **Donut visual**: layered Views (dough + glaze + topping dots + hole) — no emoji, no
  external images — works on native and react-native-web without extra deps.
- **Fonts**: Fredoka (display) + Nunito (body) loaded via Google Fonts `<link>` injected on
  web only; system fallback on native.
- **RTL/LTR**: app sets `document.dir` / `lang` on web with an EN/FA toggle in the top bar.
  EN is primary; layout uses flex (RTL-safe), tokens are FA-ready.
- **Motion**: durations 120/200/350ms, ease-out, press scale 0.97, reveal fade+translateY(12px);
  `usePrefersReducedMotion` honors matchMedia (web) + AccessibilityInfo (native); content is
  never gated on animation.
```

