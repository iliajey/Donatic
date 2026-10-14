/** Exact integer-IRR money helpers. No floating point. */
export function formatIRR(price: number): string {
  const n = Math.trunc(price);
  try {
    return new Intl.NumberFormat('en-US').format(n) + ' IRR';
  } catch {
    return n.toLocaleString() + ' IRR';
  }
}

export function sumInts(values: number[]): number {
  return values.reduce((a, b) => a + Math.trunc(b), 0);
}
