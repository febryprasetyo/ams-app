import type { ImportRow } from './types';

function minutes(value: string): number {
  if (!value.trim()) return 0;
  const match = /^(\d+):([0-5]\d)$/.exec(value.trim());
  if (!match) throw new Error(`Durasi tidak valid: ${value}`);
  const result = Number(match[1]) * 60 + Number(match[2]);
  if (!Number.isSafeInteger(result)) throw new Error('Durasi terlalu besar.');
  return result;
}
const clock = (value: string | null) => value !== null && /^([01]?\d|2[0-3]):[0-5]\d$/.test(value);

/** Raw LABEL BIFF exported by the attendance machine; not an XLSX/OLE workbook parser. */
export function parseAttendanceBiff(bytes: Uint8Array): ImportRow[] {
  if (bytes.byteLength > 20 * 1024 * 1024) throw new Error('Batas ukuran file 20 MiB.');
  if (bytes.length < 8 || bytes[0] !== 9 || ![0, 2, 8].includes(bytes[1])) throw new Error('Gunakan file .xls BIFF mesin absensi dengan format seperti asd.xls.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const table = new Map<number, Map<number, string>>();
  const decoder = new TextDecoder('utf-8');
  let offset = 0; let eof = false;
  while (offset < bytes.length) {
    if (offset + 4 > bytes.length) throw new Error('Header BIFF terpotong.');
    const type = view.getUint16(offset, true), length = view.getUint16(offset + 2, true);
    const start = offset + 4, end = start + length;
    if (end > bytes.length) throw new Error('Record BIFF terpotong.');
    if (type === 4) {
      if (length < 8 || bytes[start + 7] > length - 8) throw new Error('Teks BIFF rusak.');
      const row = view.getUint16(start, true), col = view.getUint16(start + 2, true);
      const values = table.get(row) ?? new Map<number, string>();
      values.set(col, decoder.decode(bytes.subarray(start + 8, start + 8 + bytes[start + 7])).trim()); table.set(row, values);
      if (table.size > 50001) throw new Error('Batas 50.000 baris terlampaui.');
    }
    if (type === 10) eof = true;
    offset = end;
  }
  if (!eof) throw new Error('File BIFF terpotong: penanda akhir tidak ditemukan.');
  const header = table.get(0);
  if (!header) throw new Error('Header file tidak ditemukan.');
  const columns = new Map([...header].map(([index, name]) => [name, index]));
  for (const name of ['No. ID', 'Nama', 'Tanggal', 'Terlambat', 'Plg. Cepat', 'Lembur']) if (!columns.has(name)) throw new Error(`Kolom wajib ${name} tidak ditemukan.`);
  return [...table].sort(([a], [b]) => a - b).filter(([index]) => index !== 0).map(([index, cells]) => {
    const text = (name: string) => cells.get(columns.get(name) ?? -1) ?? '';
    const optional = (name: string) => text(name) || null;
    const parts = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text('Tanggal'));
    if (!parts) throw new Error(`Tanggal baris ${index} tidak valid.`);
    const date = `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    if (!Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || Number(parts[3]) < 2000 || Number(parts[3]) > 2100) throw new Error(`Tanggal baris ${index} tidak valid.`);
    const rawScanIn = optional('Scan Masuk'), rawScanOut = optional('Scan Pulang');
    const row: ImportRow = { id: index, externalNoId: text('No. ID'), employeeId: null, employeeName: text('Nama'), employeeCode: text('Emp No.'), department: text('Departemen'), workDate: date, shift: optional('Jam Kerja'), scheduleIn: optional('Jam Masuk'), scheduleOut: optional('Jam Pulang'), scanIn: rawScanIn, scanOut: rawScanOut, rawScanIn, rawScanOut, lateMinutes: 0, earlyMinutes: 0, overtimeMinutes: 0, reviewStatus: 'READY', note: '', normalized: false };
    if (!rawScanIn && !rawScanOut) return { ...row, reviewStatus: 'SKIPPED', note: 'Kedua scan kosong; tidak disimpulkan alpha.' };
    try {
      if (!row.externalNoId) throw new Error('No. ID kosong.');
      row.lateMinutes = minutes(text('Terlambat')); row.earlyMinutes = minutes(text('Plg. Cepat')); row.overtimeMinutes = minutes(text('Lembur'));
      if (!rawScanIn) { row.scanIn = row.scheduleIn ?? null; row.lateMinutes = 0; row.normalized = true; }
      if (!rawScanOut) { row.scanOut = row.scheduleOut ?? null; row.earlyMinutes = 0; row.normalized = true; }
      if (!clock(row.scanIn) || !clock(row.scanOut)) throw new Error('Scan atau jadwal tidak valid.');
      if (row.normalized) { row.reviewStatus = 'NEEDS_REVIEW'; row.note = 'Data Excel tidak lengkap, sudah dinormalisasi'; }
    } catch (err) { row.reviewStatus = 'BLOCKED'; row.note = err instanceof Error ? err.message : 'Data tidak valid.'; }
    return row;
  });
}
