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
