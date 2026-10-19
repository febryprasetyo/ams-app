import test from 'node:test';
import assert from 'node:assert/strict';
import { getImportBatchRowCount } from './importBatch.ts';

test('committed database imports display persisted total rows when detail rows are not loaded', () => {
  assert.equal(getImportBatchRowCount({ totalRows: 1146, rows: [] }), 1146);
});

test('draft imports display their loaded row count', () => {
  assert.equal(getImportBatchRowCount({ rows: [{ id: 1 }, { id: 2 }] }), 2);
});
