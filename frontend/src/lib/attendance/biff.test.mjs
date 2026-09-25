import assert from 'node:assert/strict';
import test from 'node:test';
import { parseAttendanceBiff } from './biff.ts';

function record(type, payload = Buffer.alloc(0)) { const h = Buffer.alloc(4); h.writeUInt16LE(type); h.writeUInt16LE(payload.length, 2); return Buffer.concat([h, payload]); }
function fixture(overrides = {}) {
  const cells = { 'No. ID': '001', Nama: 'Karyawan Uji', Tanggal: '14/10/2025', 'Jam Kerja': 'Reguler', 'Jam Masuk': '08:00', 'Jam Pulang': '16:00', 'Scan Masuk': '08:15', 'Scan Pulang': '17:00', Terlambat: '00:15', 'Plg. Cepat': '', Lembur: '01:00', ...overrides };
  const labels = [];
  for (const [col, [header, value]] of Object.entries(cells).entries()) {
    for (const [row, text] of [[0, header], [1, value]]) {
      const bytes = Buffer.from(text); const payload = Buffer.alloc(8 + bytes.length); payload.writeUInt16LE(row); payload.writeUInt16LE(col, 2); payload[7] = bytes.length; bytes.copy(payload, 8); labels.push(record(4, payload));
    }
  }
  return new Uint8Array(Buffer.concat([record(0x0009, Buffer.alloc(4)), ...labels, record(10)]));
}
test('machine BIFF preserves leading zeros, schedules and source durations', () => {
  const row = parseAttendanceBiff(fixture())[0];
  assert.equal(row.externalNoId, '001'); assert.equal(row.workDate, '2025-10-14');
  assert.equal(row.lateMinutes, 15); assert.equal(row.overtimeMinutes, 60); assert.equal(row.scheduleOut, '16:00');
});
test('missing single scan uses schedule and zeros only its associated duration', () => {
  const row = parseAttendanceBiff(fixture({ 'Scan Masuk': '', Terlambat: '00:30', 'Plg. Cepat': '00:10', Lembur: '25:00' }))[0];
  assert.equal(row.rawScanIn, null); assert.equal(row.scanIn, '08:00'); assert.equal(row.normalized, true);
  assert.equal(row.lateMinutes, 0); assert.equal(row.earlyMinutes, 10); assert.equal(row.overtimeMinutes, 1500);
});
test('both empty scans stay skipped and invalid duration blocks the row', () => {
  assert.equal(parseAttendanceBiff(fixture({ 'Scan Masuk': '', 'Scan Pulang': '' }))[0].reviewStatus, 'SKIPPED');
  assert.equal(parseAttendanceBiff(fixture({ Lembur: '01:60' }))[0].reviewStatus, 'BLOCKED');
});
test('broken signatures, truncated streams and impossible dates fail explicitly', () => {
  assert.throws(() => parseAttendanceBiff(new Uint8Array([1, 2, 3, 4])));
  const bytes = fixture(); assert.throws(() => parseAttendanceBiff(bytes.slice(0, -2)), /terpotong|rusak/);
  assert.throws(() => parseAttendanceBiff(fixture({ Tanggal: '30/02/2025' })), /Tanggal/);
});
