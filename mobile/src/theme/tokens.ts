/**
 * Donatic design tokens — Phase 1. Values implemented exactly per spec.
 */

export const colors = {
  cream: '#FFF6EF',
  white: '#FFFFFF',
  blush: '#F6A8BE',
  action: '#C2255C',
  chocolate: '#4A2C21',
  ink: '#241318',
  muted: '#8A6B75',
  border: '#F3D9E1',
  gold: '#B98A2F',
  success: '#2F7D4F',
  warning: '#B45309',
  error: '#C0392B',
} as const;

export type ColorName = keyof typeof colors;

export const typography = {
  displayFamily: "'Fredoka', system-ui, sans-serif",
  bodyFamily: "'Nunito', system-ui, sans-serif",
  scale: {
    hero: { fontSize: 44, lineHeight: 48 },
    h2: { fontSize: 28, lineHeight: 34 },
    h3: { fontSize: 22, lineHeight: 28 },
    body: { fontSize: 16, lineHeight: 24 },
    small: { fontSize: 14, lineHeight: 20 },
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export const radii = {
  card: 20,
  pill: 999,
  control: 14,
} as const;

export const shadows = {
  subtle: {
    shadowColor: '#4A2C21',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export const breakpoints = {
  sm: 360,
  md: 390,
  lg: 768,
  xl: 1024,
  xxl: 1440,
} as const;

export const touchTarget = {
  min: 44,
} as const;

export const tokens = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  breakpoints,
  touchTarget,
} as const;

export type Tokens = typeof tokens;
