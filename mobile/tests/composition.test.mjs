import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  canonicalString,
  canonicalize,
  clientHash,
  compositionsEqual,
  normalizeToppingIds,
} from '../src/utils/composition.ts';

describe('composition utils', () => {
  it('normalizes topping order and dedupes', () => {
    assert.deepEqual(normalizeToppingIds([3, 1, 2, 1]), [1, 2, 3]);
  });
  it('canonical string is stable regardless of topping order', () => {
    const a = canonicalize(1, 2, [3, 5, 7]);
    const b = canonicalize(1, 2, [7, 3, 5]);
    assert.equal(canonicalString(a), canonicalString(b));
    assert.ok(compositionsEqual(a, b));
  });
  it('different compositions differ', () => {
    const a = canonicalize(1, 2, [3]);
    const b = canonicalize(1, null, [3]);
    const c = canonicalize(2, 2, [3]);
    assert.notEqual(canonicalString(a), canonicalString(b));
    assert.notEqual(canonicalString(a), canonicalString(c));
  });
  it('client hash is deterministic and keyed on canonical input', () => {
    const a = canonicalString(canonicalize(1, 2, [7, 3, 5]));
    const b = canonicalString(canonicalize(1, 2, [3, 5, 7]));
    assert.equal(clientHash(a), clientHash(b));
  });
  it('null sauce uses "-" placeholder', () => {
    assert.ok(canonicalString(canonicalize(1, null, [])).includes('sauce:-'));
  });
});
