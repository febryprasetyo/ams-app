import test from 'node:test';
import assert from 'node:assert/strict';
import { APPROVAL_CATEGORIES, filterTabs } from './catalogConfig.js';

test('catalog defines Pembelian Barang as only active category in phase 1', () => {
  const active = APPROVAL_CATEGORIES.filter(c => c.active);
  assert.equal(active.length, 1);
  assert.equal(active[0].id, 'goods_request');
  assert.equal(active[0].title, 'Pembelian Barang');

  const inactive = APPROVAL_CATEGORIES.filter(c => !c.active);
  assert.ok(inactive.length >= 3, 'Other categories are defined as inactive non-goals');
  for (const cat of inactive) {
    assert.equal(cat.active, false);
    assert.ok(cat.badgeText.includes('Segera') || cat.badgeText.includes('Tahap'));
  }
});

test('filterTabs offers approval and cancellation', () => {
  assert.deepEqual(filterTabs.map(t => t.key), ['all', 'draft', 'rejected', 'approved_manually', 'cancelled']);
});
