import test from 'node:test';
import assert from 'node:assert/strict';
import { getAvailableTransitionsWithLabels } from './statusActions.js';

test('getAvailableTransitionsWithLabels returns labeled options for modal', () => {
  const readyOptions = getAvailableTransitionsWithLabels('ready_to_print');
  assert.equal(readyOptions.length, 3);
  assert.deepEqual(readyOptions.map(o => o.value), ['pending_signature', 'draft', 'cancelled']);
  assert.equal(readyOptions[0].label, 'Menunggu Tanda Tangan');

  const pendingOptions = getAvailableTransitionsWithLabels('pending_signature');
  assert.deepEqual(pendingOptions.map(o => o.value), ['approved_manually', 'draft', 'cancelled']);
  assert.equal(pendingOptions[0].label, 'Persetujuan Manual Lengkap');

  const completedOptions = getAvailableTransitionsWithLabels('completed');
  assert.equal(completedOptions.length, 0);
});
