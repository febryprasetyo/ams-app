import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePastedPrice } from './pricePaste.js';

test('preserves whole rupiah amounts copied with grouping and currency formatting', () => {
  for (const input of ['6.199.000', '6,199,000', '6199000', 'Rp 6.199.000', 'Rp\u00a06.199.000,00', '6,199,000.00', '6199000,00']) {
    assert.equal(normalizePastedPrice(input), '6199000', input);
  }
  assert.equal(normalizePastedPrice('150.000'), '150000');
  assert.equal(normalizePastedPrice('0'), '0');
});

test('rejects fractional prices and ambiguous clipboard text without changing the amount', () => {
  for (const input of ['6.199.000,50', '1,25', '-150.000', '1e6', 'Harga 150.000 diskon 20%', '', '12.34.56']) {
    assert.equal(normalizePastedPrice(input), null, input);
  }
});
