# Animation Architecture — Donatic

> Principle: **User Action > Visual Feedback > Physical Animation > State Change.**
> No state commit waits on animation end except where taste demands (sauce pour completes before topping step unlocks — with skip on reduced-motion/tap).

## 1. Reusable system

### AnimationDirector (singleton, UI-thread safe)

```ts
// packages/animation/director.ts
type AnimEvent =
  | { type: 'SAUCE_POUR'; sauceId: string }
  | { type: 'TOPPING_DROP'; toppingId: string; seeds: SeedPoint[] }
  | { type: 'CART_FLY'; from: LayoutRect; to: LayoutRect }
  | { type: 'ORDER_CELEBRATE' };
director.emit(event); // fans out to registered actors, respects motion prefs
```

- Actors: `SauceLayer`, `ToppingLayer`, `LiveDonut`, `CartBadge`, `CelebrationOverlay` subscribe via `useAnimActor(type, handler)`.
- All progress values are Reanimated `SharedValue`s; orchestration (sequence/parallel/stagger) in worklets. JS only sends events + completion callbacks (`runOnJS`).

### useDonutAnimation — builder state machine

```
idle → saucePouring → sauceSettled → toppingDropping → settled → flyingToCart → idle
                              ↘ (reduced-motion / skip) → settled
```

```ts
const { phase, pour, dropTopping, flyToCart, reset } = useDonutAnimation({
  reducedMotion, onPhase: (p) => store.setStep(p),
});
```

- Guards: `dropTopping` ignored while `saucePouring` (or queued ≤3); `flyToCart` snapshots composition first so animation never blocks cart write.
- Exposes `playState` for tests (`phase`, `progress`) without rendering.

### Stack

- **Reanimated 3** (worklets, `withTiming`/`withSpring`, `useAnimatedProps` for SVG), **Gesture Handler** (drag toppings onto donut, swipe Live Donut to rotate preview), `expo-haptics` (ticks on settle, success on cart).
- Reduced-motion fallback: `useReducedMotion()` → every choreography replaced by 120ms crossfade; `fireCompletion` immediately.

## 2. Per-event choreography

### Sauce pour — SVG mask / clip-path progress

- Sauce is an SVG path layer over base with `clipPath` circle expanding from pour point: `r: 0 → R` via `useAnimatedProps`, `withTiming(900ms, Easing.out)`.
- Drips: 3–5 droplet sprites scale/translate with slight delay (`stagger 60ms`); glaze shine sweep (linear-gradient translate) once `r > 0.8R`.
- Completion → light haptic + `sauceSettled`; step unlock. Fallback ladder: low-end → single opacity fade, no drips.

### Topping drop — spring / bounce

- Each topping sprite spawns above target (`y: -120`), falls `withSpring(damping 8, stiffness 180)` to seeded `(x, y, rotation)`; on land: scale squash `1.15→1` (120ms) + tiny haptic tick.
- Stagger: batch drops `delay = i * 45ms`, cap concurrent animated nodes at ~40 (rest appear settled).
- Deterministic targets from seeded scatter (see builder doc) so animation and final still agree.

### Cart fly — Live Donut thumbnail to badge

- Snapshot Live Donut as scaled clone (`<View>` ref → `measure`), animate `translate + scale 1→0.25` along slight arc (`Easing.inOut`, 550ms) into cart tab badge; badge pops (`scale 1→1.3→1`) + count++ on arrival.
- State already committed at tap time; if animation cancelled (nav away), badge still correct.

### Order celebration — confetti + haptics

- Full-screen overlay: ~80 confetti particles (worklet-driven, recycled pool), 1.6s burst + `NotificationFeedbackType.Success`; donut "box opens" scale-in.
- Auto-dismiss 2.4s or tap; skipped entirely under reduced-motion (static success card).

## 3. 60fps budget

- Animations run on UI thread (worklets); JS thread must stay < 8ms/frame: no `setState` per frame, no layout thrash (use `measure` once, transforms only — `translate/scale/rotate/opacity`).
- SVG: animate `clipPath` radius + `opacity` only; avoid path-data interpolation per frame. Cap topping nodes; use sprite atlas.
- Perf hooks: `useAnimatedStyle` memo per layer; `shouldMemoize` on static base; FPS sampled in dev (`Reanimated` FPS meter) — fail CI if builder trace drops < 55fps median on reference device.

## 4. GPU / low-end fallback ladder

| Tier | Detect | Behavior |
|------|--------|----------|
| Full | `>= 3GB RAM`, no reduce-motion | all choreographies |
| Lite | low RAM / old GPU (`expo-device` + slow first-pour timing) | no drips/shine, ≤12 concurrent topping anims, confetti 30 |
| Static | reduced-motion OR `accessibilityReduceMotion` OR user toggle | crossfades only, zero haptics |

- Tier stored in `useUiStore.motionTier`, re-evaluated on launch; user toggle overrides down (never up beyond OS reduce-motion).
