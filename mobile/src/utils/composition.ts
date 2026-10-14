/** Pure composition helpers (no React). Shared by builder, cart, tests. */

export interface CanonicalComposition {
  base_donut_id: number;
  sauce_id: number | null;
  topping_ids: number[];
}

/** Sort + dedupe topping ids into canonical order. */
export function normalizeToppingIds(ids: number[]): number[] {
  return Array.from(new Set(ids.filter((n) => Number.isInteger(n)))).sort((a, b) => a - b);
}

export function canonicalize(baseId: number, sauceId: number | null, toppingIds: number[]): CanonicalComposition {
  return { base_donut_id: baseId, sauce_id: sauceId, topping_ids: normalizeToppingIds(toppingIds) };
}

/** Canonical string; identical configs always produce identical strings. */
export function canonicalString(c: CanonicalComposition): string {
  const sauce = c.sauce_id === null || c.sauce_id === undefined ? '-' : String(c.sauce_id);
  return `v1|base:${c.base_donut_id}|sauce:${sauce}|top:${c.topping_ids.join(',')}`;
}

/** FNV-1a 32-bit hex — client-side line key only (server hash is authoritative). */
export function clientHash(canonical: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return 'c_' + (h >>> 0).toString(16).padStart(8, '0');
}

export function compositionsEqual(a: CanonicalComposition, b: CanonicalComposition): boolean {
  return canonicalString(a) === canonicalString(b);
}
