import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Motion tokens — durations 120/200/350ms, ease-out curves,
 * press scale 0.97, reveal fade + translateY(12px).
 * Content is never gated on animation.
 */

export const durations = {
  fast: 120,
  base: 200,
  slow: 350,
} as const;

export const easings = {
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeOutNative: 'ease-out',
} as const;

export const pressScale = 0.97;

export const reveal = {
  from: { opacity: 0, translateY: 12 },
  to: { opacity: 1, translateY: 0 },
} as const;

export const motionTokens = {
  durations,
  easings,
  pressScale,
  reveal,
} as const;

/** Web: honor prefers-reduced-motion via matchMedia. */
export function usePrefersReducedMotionWeb(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    // @deprecated fallback for older browsers
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);
  return reduced;
}

/** Native: honor reduce-motion via RN AccessibilityInfo. */
export function useReduceMotionNative(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    if (Platform.OS === 'web') return;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => {
        if (mounted) setReduced(v === true);
      })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      sub?.remove();
    };
  }, []);
  return reduced;
}

/** Cross-platform hook: true when the user prefers reduced motion. */
export function usePrefersReducedMotion(): boolean {
  const web = usePrefersReducedMotionWeb();
  const native = useReduceMotionNative();
  if (Platform.OS === 'web') return web;
  return native;
}
