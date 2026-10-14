import { useState } from 'react';

export type Route = 'home' | 'builder-preview';

/** Minimal in-app routing for Phase 1 (no expo-router; keeps deps light). */
export function useRoute(initial: Route = 'home') {
  const [route, setRoute] = useState<Route>(initial);
  return { route, go: setRoute };
}
