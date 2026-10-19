import test from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultDateRange, createInitialFilters, formatWibDateTime } from './filters.ts';

test('getDefaultDateRange produces valid 30-day range in WIB', () => {
  const fixedNow = new Date('2026-10-12T03:00:00.000Z'); // 10:00 WIB
  const range = getDefaultDateRange(fixedNow);
  assert.equal(range.endDate, '2026-10-12');
  assert.equal(range.startDate, '2026-09-13');
});

test('createInitialFilters returns defaults with blank action and empty keyword', () => {
  const filters = createInitialFilters(new Date('2026-10-12T03:00:00.000Z'));
  assert.equal(filters.startDate, '2026-09-13');
  assert.equal(filters.endDate, '2026-10-12');
  assert.equal(filters.action, undefined);
  assert.equal(filters.actorId, undefined);
  assert.equal(filters.q, '');
});

test('formatWibDateTime formats date with WIB timezone', () => {
  const formatted = formatWibDateTime('2026-10-12T03:00:00.000Z');
  // UTC 03:00 is 10:00 in WIB (Asia/Jakarta)
  assert.ok(/10/.test(formatted));
  assert.ok(/2026/.test(formatted));
});
