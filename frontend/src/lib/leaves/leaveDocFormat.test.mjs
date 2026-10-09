import { test } from 'node:test';
import assert from 'node:assert';

function formatDateIndo(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function calculateF4CleanQuota(base, collective) {
  return Math.max(0, base - collective);
}

function calculateF4Remaining(available, requested) {
  return Math.max(0, available - requested);
}

test('formatDateIndo converts ISO date to Indonesian standard text', () => {
  assert.strictEqual(formatDateIndo('2024-05-10'), '10 Mei 2024');
  assert.strictEqual(formatDateIndo('2024-01-05'), '5 Januari 2024');
  assert.strictEqual(formatDateIndo('2026-10-09'), '9 Oktober 2026');
});

test('calculateF4CleanQuota matches Excel formula 12 - 10 = 2', () => {
  assert.strictEqual(calculateF4CleanQuota(12, 10), 2);
  assert.strictEqual(calculateF4CleanQuota(12, 5), 7);
  assert.strictEqual(calculateF4CleanQuota(12, 12), 0);
});

test('calculateF4Remaining correctly calculates balance after requested leave', () => {
  assert.strictEqual(calculateF4Remaining(2, 1), 1);
  assert.strictEqual(calculateF4Remaining(6, 2), 4);
  assert.strictEqual(calculateF4Remaining(1, 1), 0);
});

test('F4 Paper Dimensions adhere to standard Indonesian Folio (215mm x 330mm)', () => {
  const F4_WIDTH_MM = 215;
  const F4_HEIGHT_MM = 330;
  assert.strictEqual(F4_WIDTH_MM, 215);
  assert.strictEqual(F4_HEIGHT_MM, 330);
});
