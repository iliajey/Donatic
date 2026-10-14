import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { compositionToVisual, scatterPosition } from '../src/components/visualMapping.ts';
import { formatIRR, sumInts } from '../src/utils/money.ts';

const item = (over = {}) => ({
  id: 1, name: 'X', slug: 'classic-ring', description: '', price: 85000,
  currency: 'IRR', image_url: null, visual_key: 'base:classic',
  color: '#E8B06E', is_active: true, sort_order: 1, ...over,
});

describe('visual mapping', () => {
  it('maps base/sauce/toppings explicitly', () => {
    const spec = compositionToVisual(
      item(),
      item({ id: 2, slug: 'chocolate', visual_key: 'sauce:chocolate', color: '#6B3E2E' }),
      [item({ id: 3, slug: 'pearls', color: '#FFFFFF' })],
    );
    assert.equal(spec.baseShape, 'ring');
    assert.equal(spec.sauceColor, '#6B3E2E');
    assert.equal(spec.toppings.length, 1);
    assert.ok(['dot', 'bar', 'flake', 'curl'].includes(spec.toppings[0].shape));
  });
  it('null sauce yields no sauce layer; missing colors fall back', () => {
    const spec = compositionToVisual(item({ color: '' }), null, []);
    assert.equal(spec.sauceColor, null);
    assert.equal(spec.baseColor, '#E8B06E');
  });
  it('scatter is deterministic', () => {
    assert.deepEqual(scatterPosition(2, 5), scatterPosition(2, 5));
    assert.notDeepEqual(scatterPosition(1, 5), scatterPosition(2, 5));
  });
});

describe('money', () => {
  it('formats integer IRR without decimals', () => {
    assert.equal(formatIRR(125000), '125,000 IRR');
  });
  it('sums exactly', () => {
    assert.equal(sumInts([85000, 18000, 22000]), 125000);
  });
});
