import type { CanonicalComposition } from '../utils/composition';
import { canonicalString, clientHash, normalizeToppingIds } from '../utils/composition.ts';

export interface CartLine {
  key: string;
  composition: CanonicalComposition;
  serverHash: string | null;
  baseName: string;
  sauceName: string | null;
  toppingNames: string[];
  unitPrice: number;
  quantity: number;
}

export interface CartState {
  lines: CartLine[];
}

export type CartAction =
  | { type: 'add'; composition: CanonicalComposition; names: Omit<CartLine, 'key' | 'composition' | 'quantity'> & { quantity?: number } }
  | { type: 'increment'; key: string }
  | { type: 'decrement'; key: string }
  | { type: 'remove'; key: string }
  | { type: 'clear' };

export const emptyCart: CartState = { lines: [] };

function lineKey(c: CanonicalComposition): string {
  return clientHash(canonicalString(c));
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const composition: CanonicalComposition = {
        base_donut_id: action.composition.base_donut_id,
        sauce_id: action.composition.sauce_id,
        topping_ids: normalizeToppingIds(action.composition.topping_ids),
      };
      const key = lineKey(composition);
      const qty = Math.max(1, Math.trunc(action.names.quantity ?? 1));
      const existing = state.lines.find((l) => l.key === key);
      if (existing) {
        if (canonicalString(existing.composition) !== canonicalString(composition)) {
          return state;
        }
        return {
          lines: state.lines.map((l) => (l.key === key ? { ...l, quantity: l.quantity + qty } : l)),
        };
      }
      const line: CartLine = {
        key,
        composition,
        serverHash: action.names.serverHash,
        baseName: action.names.baseName,
        sauceName: action.names.sauceName,
        toppingNames: action.names.toppingNames,
        unitPrice: Math.trunc(action.names.unitPrice),
        quantity: qty,
      };
      return { lines: [...state.lines, line] };
    }
    case 'increment':
      return {
        lines: state.lines.map((l) => (l.key === action.key ? { ...l, quantity: l.quantity + 1 } : l)),
      };
    case 'decrement':
      return {
        lines: state.lines
          .map((l) => (l.key === action.key ? { ...l, quantity: l.quantity - 1 } : l))
          .filter((l) => l.quantity > 0),
      };
    case 'remove':
      return { lines: state.lines.filter((l) => l.key !== action.key) };
    case 'clear':
      return emptyCart;
  }
}

export function cartSubtotal(state: CartState): number {
  return state.lines.reduce((sum, l) => sum + Math.trunc(l.unitPrice) * l.quantity, 0);
}

export function cartCount(state: CartState): number {
  return state.lines.reduce((sum, l) => sum + l.quantity, 0);
}
