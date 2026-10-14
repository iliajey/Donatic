# Donatic Design System v1.0 (Phase 1)

Source of truth for Phase 1 prototype tokens and component rules.
Skill: `.opencode/skills/ui-ux-pro-max` (SKILL.md workflow: `--design-system`,
`--domain color|typography|ux`, `--stack react-native`). See phase report for
exact queries and which recommendations were adopted vs. rejected.

## 1. Brand direction

Premium artisan dessert brand. Playful and delicious, never childish.
Soft pink + warm cream + white + chocolate, restrained gold accents.
Strong typography, generous whitespace, tasteful depth. No emoji as imagery,
no excessive glassmorphism, no generic gradients, no floating-circle clutter.

## 2. Logo assets (originals preserved byte-for-byte in project root)

| File | Size | Usage |
|---|---|---|
| `logo.jpeg` | 59,763 B | Primary. Light backgrounds, header on cream/white, hero, packaging |
| `logo 2.jpeg` | 89,969 B | Dark variant. Splash screens, dark surfaces, footer on ink |
| `logo black and white.jpeg` | 58,332 B | Mono. Receipts, print, single-color, fax-like contexts |

Rules: never recolor, stretch, or re-approximate the logo. Compact layouts may
use the donut mark cropped with clear space. Optimized WebP/SVG derivatives are
deferred (no raster tooling in Phase 1); JPEGs remain the masters.

## 3. Color tokens (`mobile/src/theme/tokens.ts`)

| Token | Hex | Use |
|---|---|---|
| `cream` | `#FFF6EF` | Page background |
| `white` | `#FFFFFF` | Cards, surfaces |
| `blush` | `#F6A8BE` | Decorative glaze tint, never body text |
| `action` | `#C2255C` | Primary buttons, links, key labels on light (contrast-safe) |
| `chocolate` | `#4A2C21` | Secondary text accents, donut dough |
| `ink` | `#241318` | Body text |
| `muted` | `#8A6B75` | Secondary text (large/bold only at small sizes) |
| `border` | `#F3D9E1` | Borders, dividers, subtle surfaces |
| `gold` | `#B98A2F` | Restrained accents (badges, rules, dividers) |
| `success` | `#2F7D4F` | Success states |
| `warning` | `#B45309` | Warning states |
| `error` | `#C0392B` | Error states |

Contrast rules (from skill checklist): body text on cream/white must be
`ink`/`chocolate` (>= 4.5:1). `blush` is decorative only. `action` on white is
the only pink-family text color. Muted text only for large/bold or secondary
meta with sufficient size.

## 4. Typography

- Display: `Fredoka` (600/700) — headings, hero, CTA emphasis.
- Body: `Nunito` (400/500/600/700) — everything else.
- Web loads Google Fonts; native falls back to system rounded/sans.
- Scale: hero 44/52, h2 28/34, h3 22/28, body 16/24, small 14/20.
- Persian + English supported: logical properties / dir-aware layout, no
  hard-coded left/right alignment in components. EN primary in Phase 1.

## 5. Spacing / radii / elevation

- 4pt grid: 4, 8, 12, 16, 24, 32, 48, 64.
- Radii: card 20, control 14, pill 999 (CTAs, chips).
- Shadows: one subtle elevation (soft, warm-tinted); no heavy neumorphism.
- Breakpoints: 360 / 390 / 768 / 1024 / 1440. Gutters widen with viewport.
- Touch targets >= 44pt; small icon buttons get `hitSlop`.

## 6. Components (only what the prototype uses)

Button (primary/secondary/ghost), AppText, Heading, IconButton, Badge,
ProductCard, Price, Section, LoadingState, ErrorState/Toast, Header, Footer.
Rules: `Pressable` with `active:scale-97`-style pressed feedback (skill: ux
"Active States"); semantic roles + accessible labels; disabled = reduced
emphasis + non-interactive; no layout-shifting press states.

## 7. Motion principles

Tokens: `120ms` micro (press), `200ms` standard (reveals, hovers),
`350ms` hero entrance; ease-out curves. Hero: single fade+rise entrance.
Products: subtle lift on hover/press. Sections: one restrained reveal.
Reduced motion (`prefers-reduced-motion` / OS setting): instant final state,
no haptics-gated content, nothing essential waits on animation. (Skill: ux
press feedback + react-native Pressable/hitSlop guidance applied.)

## 8. Accessibility

Keyboard-focusable CTAs with visible focus, live-region for builder preview
changes, decorative SVG `aria-hidden`, min contrast per section 3, 44pt
targets, RTL/LTR-safe layout.

## 9. Do-not-use (anti-generic)

No glassmorphism panels, no purple/blue gradients, no floating decorative
circles, no emoji product imagery, no template card grids with identical
rounding everywhere, no scroll-hijack storytelling, no dark luxury theme
(skill `--design-system` output rejected on style/colors; structure guidance
kept), no animation that blocks content.
