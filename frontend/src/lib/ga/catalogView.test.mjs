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

test('filterTabs provides all administrative workflow statuses', () => {
  const keys = filterTabs.map(t => t.key);
  assert.ok(keys.includes('all'));
  assert.ok(keys.includes('draft'));
  assert.ok(keys.includes('ready_to_print'));
  assert.ok(keys.includes('pending_signature'));
  assert.ok(keys.includes('approved_manually'));
  assert.ok(keys.includes('processing'));
  assert.ok(keys.includes('completed'));
});
