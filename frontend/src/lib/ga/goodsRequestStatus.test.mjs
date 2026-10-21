import test from 'node:test';
import assert from 'node:assert/strict';
import { getStatusBadgeConfig, getStatusLabel, getAllowedTransitions, isRequestEditable } from './goodsRequestStatus.js';

test('getStatusLabel returns human friendly Indonesian label', () => {
  assert.equal(getStatusLabel('draft'), 'Draft');
  assert.equal(getStatusLabel('ready_to_print'), 'Menunggu Persetujuan');
  assert.equal(getStatusLabel('pending_signature'), 'Menunggu Tanda Tangan');
  assert.equal(getStatusLabel('approved_manually'), 'Disetujui');
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
  assert.deepEqual(getAllowedTransitions('draft'), ['approved_manually', 'rejected']);
  assert.deepEqual(getAllowedTransitions('ready_to_print'), ['approved_manually', 'rejected']);
  assert.deepEqual(getAllowedTransitions('pending_signature'), ['approved_manually', 'rejected']);
  assert.deepEqual(getAllowedTransitions('approved_manually'), ['cancelled']);
  assert.deepEqual(getAllowedTransitions('processing'), ['approved_manually', 'rejected']);
  assert.deepEqual(getAllowedTransitions('completed'), []);
  assert.deepEqual(getAllowedTransitions('cancelled'), []);
});

test('isRequestEditable returns true only for unapproved requests (draft, ready_to_print, pending_signature)', () => {
  assert.equal(isRequestEditable('draft'), true);
  assert.equal(isRequestEditable('ready_to_print'), true);
  assert.equal(isRequestEditable('pending_signature'), true);
  assert.equal(isRequestEditable('approved_manually'), false);
  assert.equal(isRequestEditable('processing'), false);
  assert.equal(isRequestEditable('completed'), false);
  assert.equal(isRequestEditable('rejected'), false);
  assert.equal(isRequestEditable('cancelled'), false);
  assert.equal(isRequestEditable(null), false);
  assert.equal(isRequestEditable(''), false);
});
