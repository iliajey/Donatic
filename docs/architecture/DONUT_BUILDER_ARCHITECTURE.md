# Donut Builder Architecture — Donatic

> Builder UX: **Base > Sauce (pour/spread) > Toppings (fall/settle) > Live Donut > Add to cart (fly-to-cart).**
> Domain: Donut = 1 Base + 0/1 Sauce + 0..N Toppings.

## 1. Technology comparison

| Approach | Visual quality | Perf (mobile) | Web (RN Web) | Maintainability | Asset cost | Control | Verdict |
|----------|---------------|---------------|--------------|-----------------|------------|---------|---------|
| **Layered 2D SVG/Canvas** (base + sauce overlay + topping sprites) | High for stylized premium look | Excellent 60fps, UI-thread transforms | Native (SVG works both) | High — plain components + JSON | Low — N bases/sauces/toppings drawn once | Full — per-layer progress, seeded scatter | **Phase 1 pick** |
| Lottie (JSON mocap-ish) | Good, fixed clips | Good, but one clip per combo explodes | OK (`lottie-react`) | Medium — After Effects pipeline | Medium — artist per animation | Low — baked, not parametric | Reject as core; OK for tiny celebratory loops |
| Rive (state-machine rigs) | Very good, interactive | Good (runtime dep, ~500KB) | Good (WASM/canvas) | Medium — needs Rive editor skill | Medium — rig per base/sauce | Medium — inputs, not per-topping | Optional: sauce-pour micro-anim only |
| Skia (`@shopify/react-native-skia`) | Excellent (shaders, gooey glaze) | Great on GPU, weak on low-end CPU fallback | Partial (web canvas, heavier) | Lower — custom shaders, niche hiring | Low–Medium | Full | Phase 2 upgrade path for glaze/gold shaders |
| Three.js / R3F (real 3D) | Best realism | Heavy — battery/draw-calls, overkill for stylized brand | Good web, heavy mobile | Lowest — 3D pipeline, lighting, assets | High — modeled/textured donuts | Full but expensive | Reject V1; revisit only for 3D showcase mode |
| Full 3D asset set (pre-rendered) | High static | Great playback, zero flexibility | Great | Low — combinatorial explosion (bases×sauces×toppings) | Very high | None — cannot compose unseen combos | Reject |

## 2. Recommendation (Phase 1)

**Layered 2D: SVG base + sauce overlay + topping sprites, driven by Reanimated.**

- Renderer layers (bottom→top): `BaseSvg → SauceOverlay (clip-path progress) → ToppingSprites (seeded positions) → Shine/Shadow → (web same via react-native-svg)`.
- Topping scatter is **deterministic**: seeded PRNG from composition hash → positions/rotations stable across renders, devices, server.
- **Rive optional**: single pour-loop rig swappable behind `SaucePourView` interface; not required.
- **Asset contract** (renderer-agnostic) so Three.js/Skia can replace the renderer later without changing the composition model:

```ts
interface DonutRenderer {
  render(ctx: RenderCtx, comp: DonutComposition): void;
  snapshot(comp: DonutComposition): Promise<ImageRef>; // for fly-to-cart
}
```

Phase 2 = implement `SkiaDonutRenderer` (same `DonutComposition` in, prettier glaze out). Composition, hash, validation untouched.

## 3. Composition model

### JSON schema

```ts
interface DonutComposition {
  version: 1;
  baseId: string;                 // required, exactly 1
  sauceId: string | null;         // 0..1
  toppings: { toppingId: string; qty: number }[]; // 0..N, sorted by id
  seed: number;                   // scatter seed, derived if 0
}
```

- zod schema enforces: 1 base (must exist in catalog), sauce null-or-one, toppings unique ids, `qty 1..5`, total pieces cap (e.g. 40).
- `seed = hash(baseId, sauceId, toppings)` when client sends 0 → server recomputes; stills identical everywhere.

### Canonical hash (cart consolidation)

```
canonical = `v1|base:{b}|sauce:{s ?? '-'}|top:{ids sorted: id×qty joined '+'}`
hash = sha256(canonical) → `dn_xxxx`
```

- Cart lines keyed by `hash`: same build → qty++ (no duplicate lines); any ingredient change → new hash → new line.
- Hash computed client-side for instant UI + **recomputed server-side** (never trust client).

### Server validate / reproduce

1. Validate ids vs catalog, exclusivity (one sauce), caps, price = `base + sauce + Σ topping×qty` (server prices win).
2. Recompute seed + scatter → render proof thumbnail (for admin/orders) → store composition JSON + hash on order line.
3. Reject with `fieldErrors` on drift (e.g. topping discontinued) → client offers nearest fix.

## 4. Seeded scatter (deterministic toppings)

```ts
mulberry32(hash(canonical)) → for each topping piece i: { x, y (in ring), r (rotation), s (scale 0.9–1.1) }
```

- Ring mask: keep `(x,y)` inside glaze annulus (`0.35R < d < 0.95R`), resample ≤8 tries else clamp to edge.
- Same hash → same donut on mobile, web, server thumbnail, reorder. Animation targets = scatter points (drop lands exactly on still).

## 5. Edit / reorder flow

- Cart line stores `{ hash, composition, unitPrice snapshot }`. Edit → deep-link builder prefilled (`donatic://builder?h={hash}` → fetch composition) → new hash on change (old line kept until confirm → replace).
- Reorder (orders history) → composition re-validated vs current catalog; drift → "rebuild with swaps" sheet (maps discontinued → suggested substitute, price delta shown) → adds as new line.
- Live Donut preview available at every step; Add-to-cart commits composition first, then fly animation (never gated on animation).

## 6. Accessibility labels

- Builder steps as `role=tablist` with `aria-selected`; each ingredient button: `"{name}, {type}, {price}, {selected?}"`.
- Live Donut: `accessibilityLabel = describeDonut(comp)` e.g. "Glazed donut, strawberry sauce, rainbow sprinkles ×2, crushed pistachio." + `accessibilityLiveRegion="polite"` announcing changes ("Strawberry sauce added").
- Scatter canvas marked `accessible={false}` (decorative); semantic list of toppings exposed as adjacent list. Reduced-motion honored per ANIMATION_ARCHITECTURE.md.
