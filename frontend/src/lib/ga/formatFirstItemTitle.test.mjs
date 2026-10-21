import test from 'node:test';
import assert from 'node:assert/strict';
import { formatFirstItemTitle } from '../goodsRequests.ts';

test('formatFirstItemTitle strips "Pengajuan" and "Pengadaan" from firstItemName and title', () => {
  assert.equal(
    formatFirstItemTitle({ firstItemName: 'Pengadaan Laptop ThinkPad', title: 'Pengadaan Laptop' }),
    'Laptop ThinkPad'
  );

  assert.equal(
    formatFirstItemTitle({ firstItemName: 'Pengajuan: Monitor LG 27 Inch' }),
    'Monitor LG 27 Inch'
  );

  assert.equal(
    formatFirstItemTitle({ firstItemName: 'EZVIZ H8C 2MP' }),
    'EZVIZ H8C 2MP'
  );
});

test('formatFirstItemTitle falls back to title if firstItemName is missing', () => {
  assert.equal(
    formatFirstItemTitle({ firstItemName: null, title: 'Pengadaan Router WiFi TP-Link' }),
    'Router WiFi TP-Link'
  );

  assert.equal(
    formatFirstItemTitle({ firstItemName: '', title: 'Pengajuan Meja Kerja' }),
    'Meja Kerja'
  );
});

test('formatFirstItemTitle handles empty or undefined values gracefully', () => {
  assert.equal(formatFirstItemTitle({}), 'Belum ada barang');
  assert.equal(formatFirstItemTitle({ firstItemName: '', title: '' }), 'Belum ada barang');
});

import { formatFormDate, formatRupiahNumber } from '../goodsRequests.ts';

test('formatFormDate formats YYYY-MM-DD into DD-Mmm-YY standard', () => {
  assert.equal(formatFormDate('2026-01-29'), '29-Jan-26');
  assert.equal(formatFormDate('2026-10-20'), '20-Okt-26');
  assert.equal(formatFormDate(''), '');
  assert.equal(formatFormDate(null), '');
});

test('formatRupiahNumber formats whole amounts with comma separator matching print layout', () => {
  assert.equal(formatRupiahNumber(12398000), '12,398,000');
  assert.equal(formatRupiahNumber('6199000'), '6,199,000');
  assert.equal(formatRupiahNumber(0), '0');
});
