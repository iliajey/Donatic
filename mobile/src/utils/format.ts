export function formatPrice(price: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
}

/** Builder estimate only — mock math, never a real charge. */
export function estimateBuilderPrice(baseIndex: number, toppingCount: number): number {
  const base = 2.5 + baseIndex * 0.3;
  return Math.round((base + toppingCount * 0.4) * 100) / 100;
}
