import { useState } from 'react';

export type Route = 'home' | 'builder' | 'cart';

/** Minimal in-app routing (no expo-router; keeps deps light). */
export function useRoute(initial: Route = 'home') {
  const [route, setRoute] = useState<Route>(initial);
  return { route, go: setRoute };
}
