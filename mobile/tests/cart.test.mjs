import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { canonicalize } from '../src/utils/composition.ts';
import { cartCount, cartReducer, cartSubtotal, emptyCart } from '../src/features/cartStore.ts';

function add(state, base, sauce, tops, price, hash = 'dn_test') {
  return cartReducer(state, {
    type: 'add',
    composition: canonicalize(base, sauce, tops),
    names: {
      serverHash: hash,
      baseName: `Base${base}`,
      sauceName: sauce === null ? null : `Sauce${sauce}`,
      toppingNames: tops.map((t) => `Top${t}`),
      unitPrice: price,
    },
  });
}

describe('cart store', () => {
  it('identical compositions merge and grow quantity', () => {
    let s = add(emptyCart, 1, 2, [3, 5], 100000);
    s = add(s, 1, 2, [5, 3], 100000);
    assert.equal(s.lines.length, 1);
    assert.equal(s.lines[0].quantity, 2);
    assert.equal(cartSubtotal(s), 200000);
  });
  it('different compositions stay separate', () => {
    let s = add(emptyCart, 1, 2, [3], 100000);
    s = add(s, 1, null, [3], 100000);
    s = add(s, 2, 2, [3], 120000);
    s = add(s, 1, 2, [4], 100000);
    assert.equal(s.lines.length, 4);
  });
  it('quantity and subtotal math is exact integers', () => {
    let s = add(emptyCart, 1, null, [], 85000);
    s = cartReducer(s, { type: 'increment', key: s.lines[0].key });
    s = cartReducer(s, { type: 'increment', key: s.lines[0].key });
    assert.equal(cartSubtotal(s), 255000);
    assert.equal(cartCount(s), 3);
    s = cartReducer(s, { type: 'decrement', key: s.lines[0].key });
    assert.equal(cartSubtotal(s), 170000);
  });
  it('decrement to zero removes the line; remove and clear work', () => {
    let s = add(emptyCart, 1, null, [], 85000);
    const key = s.lines[0].key;
    s = cartReducer(s, { type: 'decrement', key });
    assert.equal(s.lines.length, 0);
    s = add(add(emptyCart, 1, null, [], 1), 2, null, [], 2);
    s = cartReducer(s, { type: 'remove', key: s.lines[0].key });
    assert.equal(s.lines.length, 1);
    s = cartReducer(s, { type: 'clear' });
    assert.equal(s.lines.length, 0);
    assert.equal(cartSubtotal(s), 0);
  });
  it('stores canonical ids and server hash, not price identity', () => {
    const s = add(emptyCart, 1, 2, [5, 3], 999, 'dn_abc123');
    const line = s.lines[0];
    assert.deepEqual(line.composition.topping_ids, [3, 5]);
    assert.equal(line.serverHash, 'dn_abc123');
  });
});
