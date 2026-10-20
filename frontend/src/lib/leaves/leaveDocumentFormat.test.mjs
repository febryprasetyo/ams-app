import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatLeaveHistoryDescription } from './leaveDocumentFormat.ts';

const history = (durationDays, startDate, endDate) => ({
  no: 1, description: `${durationDays} = Cuti tahunan tgl ${startDate}`,
  durationDays, startDate, endDate,
});

test('one-day leave history shows a single Indonesian date', () => {
  assert.equal(formatLeaveHistoryDescription(history(1, '2026-10-20', '2026-10-20')), '1 = Cuti tahunan tgl 20 Oktober 2026');
});

test('two-day leave history shows the actual start and end dates across a weekend', () => {
  assert.equal(formatLeaveHistoryDescription(history(2, '2026-10-23', '2026-10-26')), '2 = Cuti tahunan tgl 23 Oktober 2026 s/d 26 Oktober 2026');
});

test('leave history longer than two days only shows its start date', () => {
  assert.equal(formatLeaveHistoryDescription(history(3, '2026-10-26', '2026-10-28')), '3 = Cuti tahunan tgl 26 Oktober 2026');
});

test('history preserves descriptions when structured dates are unavailable', () => {
  for (const description of ['', '4 = Akumulasi 2 cuti sebelumnya', '1 = Cuti tahunan tgl 2026-10-20']) {
    assert.equal(formatLeaveHistoryDescription({ no: 1, description }), description);
  }
});

test('two-day legacy history without an end date does not invent a date', () => {
  assert.equal(formatLeaveHistoryDescription(history(2, '2026-10-23')), '2 = Cuti tahunan tgl 23 Oktober 2026');
});
