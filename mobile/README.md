# Donatic Mobile — Phase 1 (Expo + React Native + TypeScript)

Prototype storefront. Demo content only — no cart, checkout, auth, or payments.

## Prerequisites

- Node 24 (Windows PowerShell)
- No global installs needed; everything runs via `npx` / local `node_modules`.

## Commands executed

```powershell
cd C:\PROG\Donatic\mobile
npm install
npm run typecheck   # tsc --noEmit (strict + noUncheckedIndexedAccess)
npm run lint        # eslint . --ext .ts,.tsx,.js
npm run web:build   # expo export --platform web  (output: dist/)
npx expo start --web  # dev server (run manually; not executed in scaffold)
```

Environment: copy nothing; for a real API later set `EXPO_PUBLIC_API_URL`:

```powershell
$env:EXPO_PUBLIC_API_URL="http://localhost:3000"; npx expo start --web
```

## Structure

```
mobile/
  App.tsx                 # entry: route state (home | builder-preview), fonts, dir toggle
  index.js                # registerRootComponent
  app.json / babel.config.js / tsconfig.json / .eslintrc.json / .prettierrc
  src/
    screens/index.tsx       # Home storefront screen
    screens/builder-preview.tsx  # Builder preview screen (mock, estimate only)
    components/           # Button, Typography (AppText+Heading), IconButton, Badge,
                          # Price, Section, States (Loading/Error/Toast), DonutVisual,
                          # DonutMark, ProductCard, Header, Footer
    theme/tokens.ts       # exact Phase-1 design tokens
    animations/tokens.ts  # motion tokens + prefers-reduced-motion hooks
    api/client.ts         # typed fetch wrapper (NOT wired to UI; backend not required)
    data/demo.ts          # demo donuts (isDemo:true) + builder options
    hooks/useRoute.ts     # minimal route-state hook
    utils/format.ts       # formatPrice + estimateBuilderPrice (mock)
    features/storefront/  # placeholder for later phases
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

