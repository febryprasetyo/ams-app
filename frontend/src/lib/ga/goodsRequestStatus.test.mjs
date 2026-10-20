import test from 'node:test';
import assert from 'node:assert/strict';
import { getStatusBadgeConfig, getStatusLabel, getAllowedTransitions } from './goodsRequestStatus.js';

test('getStatusLabel returns human friendly Indonesian label', () => {
  assert.equal(getStatusLabel('draft'), 'Draft');
  assert.equal(getStatusLabel('ready_to_print'), 'Siap Cetak');
  assert.equal(getStatusLabel('pending_signature'), 'Menunggu Tanda Tangan');
  assert.equal(getStatusLabel('approved_manually'), 'Persetujuan Manual Lengkap');
  assert.equal(getStatusLabel('processing'), 'Diproses');
  assert.equal(getStatusLabel('completed'), 'Selesai');
  assert.equal(getStatusLabel('cancelled'), 'Dibatalkan');
});

test('getStatusBadgeConfig returns valid Emerald Enterprise token styles', () => {
  const approved = getStatusBadgeConfig('approved_manually');
  assert.ok(approved.bgClass.includes('emerald'));
  assert.ok(approved.textClass.includes('emerald'));

  const pending = getStatusBadgeConfig('pending_signature');
  assert.ok(pending.bgClass.includes('amber'));
  assert.ok(pending.textClass.includes('amber'));

  const draft = getStatusBadgeConfig('draft');
  assert.ok(draft.bgClass.includes('slate'));
  assert.ok(draft.textClass.includes('slate'));
});

test('getAllowedTransitions returns valid next steps in physical workflow', () => {
  assert.deepEqual(getAllowedTransitions('draft'), ['ready_to_print', 'cancelled']);
  assert.deepEqual(getAllowedTransitions('ready_to_print'), ['pending_signature', 'draft', 'cancelled']);
  assert.deepEqual(getAllowedTransitions('pending_signature'), ['approved_manually', 'draft', 'cancelled']);
  assert.deepEqual(getAllowedTransitions('approved_manually'), ['processing', 'cancelled']);
  assert.deepEqual(getAllowedTransitions('processing'), ['completed', 'cancelled']);
  assert.deepEqual(getAllowedTransitions('completed'), []);
  assert.deepEqual(getAllowedTransitions('cancelled'), []);
});
