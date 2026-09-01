import assert from 'node:assert/strict';
import test from 'node:test';
import { allocateSequentialCodes } from './assetCode';

test('allocates a collision-free block after the highest valid sequence', () => {
  assert.deepEqual(
    allocateSequentialCodes('LPT', 2026, ['LPT-2026-0001', 'LPT-2026-0003', 'OTHER'], 2),
    ['LPT-2026-0004', 'LPT-2026-0005'],
  );
});

test('starts from 0001 when no existing matching codes exist', () => {
  assert.deepEqual(
    allocateSequentialCodes('PC', 2026, ['LPT-2026-0001', 'PC-2025-0005'], 3),
    ['PC-2026-0001', 'PC-2026-0002', 'PC-2026-0003'],
  );
});

test('handles count = 0 gracefully', () => {
  assert.deepEqual(allocateSequentialCodes('LPT', 2026, ['LPT-2026-0001'], 0), []);
});
