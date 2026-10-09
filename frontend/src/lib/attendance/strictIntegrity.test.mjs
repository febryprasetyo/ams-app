import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCommand } from './commands.ts';

const createSeed = () => ({
  schemaVersion: 1,
  meta: { defaultDate: '2026-09-25', periodStart: '2026-09-01', actor: 'Test HR', role: 'HR_ADMIN', canManageAccess: true },
  departments: [{ id: 1, code: 'HR', name: 'Human Resources', isActive: true }],
  locations: [],
  sources: [{ id: 1, code: 'MACHINE', name: 'Mesin', isActive: true }],
  employees: [
    { id: 1, employeeCode: 'EMP-001', fullName: 'Budi Santoso', email: '', departmentId: 1, locationId: null, position: 'Staff', isActive: true },
    { id: 2, employeeCode: 'EMP-002', fullName: 'Siti Aminah', email: '', departmentId: 1, locationId: null, position: 'Staff', isActive: true },
  ],
  identities: [
    { id: 1, sourceId: 1, externalNoId: '001', employeeId: 1 },
    { id: 2, sourceId: 1, externalNoId: '002', employeeId: 2 },
  ],
  records: [
    // Pre-existing final record for employee 1 on 2026-09-20
    { id: 1, employeeId: 1, workDate: '2026-09-20', shift: null, scheduleIn: null, scheduleOut: null, scanIn: '08:00', scanOut: '17:00', rawScanIn: '08:00', rawScanOut: '17:00', lateMinutes: 0, earlyMinutes: 0, overtimeMinutes: 0, attendanceStatus: 'PRESENT', isDayOff: false, normalized: false, revision: 1, sourceBatchId: null },
  ],
  batches: [],
  audit: [],
  revisions: [],
  grants: [],
  locks: [],
});

test('strict integrity ON (default): blocks batch commit if rows have NEEDS_REVIEW or BLOCKED', () => {
  let data = createSeed();
  data.batches.push({
    id: 1,
    filename: 'test-import.xls',
    sourceId: 1,
    createdAt: new Date().toISOString(),
    status: 'DRAFT',
    strictIntegrity: true,
    rows: [
      { id: 1, externalNoId: '001', employeeId: 1, workDate: '2026-09-21', scanIn: '08:00', scanOut: '17:00', lateMinutes: 0, earlyMinutes: 0, overtimeMinutes: 0, reviewStatus: 'READY', note: 'Siap' },
      { id: 2, externalNoId: '002', employeeId: 2, workDate: '2026-09-21', scanIn: '08:05', scanOut: '17:00', lateMinutes: 5, earlyMinutes: 0, overtimeMinutes: 0, reviewStatus: 'NEEDS_REVIEW', note: 'Data Excel tidak lengkap, sudah dinormalisasi' },
    ],
  });

  assert.throws(
    () => applyCommand(data, { type: 'batch', batchId: 1, action: 'commit' }),
    /Selesaikan review seluruh baris sebelum menyimpan/
  );
});

test('strict integrity OFF: bypasses review and saves valid rows without manual review', () => {
  let data = createSeed();
  data.batches.push({
    id: 1,
    filename: 'test-import.xls',
    sourceId: 1,
    createdAt: new Date().toISOString(),
    status: 'DRAFT',
    strictIntegrity: false,
    rows: [
      { id: 1, externalNoId: '001', employeeId: 1, workDate: '2026-09-21', scanIn: '08:00', scanOut: '17:00', lateMinutes: 0, earlyMinutes: 0, overtimeMinutes: 0, reviewStatus: 'READY', note: 'Siap' },
      { id: 2, externalNoId: '002', employeeId: 2, workDate: '2026-09-21', scanIn: '08:05', scanOut: '17:00', lateMinutes: 5, earlyMinutes: 0, overtimeMinutes: 0, reviewStatus: 'NEEDS_REVIEW', note: 'Data dinormalisasi' },
    ],
  });

  const next = applyCommand(data, { type: 'batch', batchId: 1, action: 'commit', strictIntegrity: false });
  const batch = next.batches.find(b => b.id === 1);
  assert.equal(batch.status, 'COMMITTED');
  // Both rows for 2026-09-21 should be committed into records
  const newRecords = next.records.filter(r => r.workDate === '2026-09-21');
  assert.equal(newRecords.length, 2);
  assert.ok(newRecords.some(r => r.employeeId === 1));
  assert.ok(newRecords.some(r => r.employeeId === 2));
});

test('strict integrity OFF: automatically skips unmapped rows and duplicate dates', () => {
  let data = createSeed();
  data.batches.push({
    id: 1,
    filename: 'test-import.xls',
    sourceId: 1,
    createdAt: new Date().toISOString(),
    status: 'DRAFT',
    strictIntegrity: false,
    rows: [
      // Valid row
      { id: 1, externalNoId: '002', employeeId: 2, workDate: '2026-09-22', scanIn: '08:00', scanOut: '17:00', lateMinutes: 0, earlyMinutes: 0, overtimeMinutes: 0, reviewStatus: 'READY', note: 'Siap' },
      // Duplicate against existing record (employee 1 on 2026-09-20 already exists)
      { id: 2, externalNoId: '001', employeeId: 1, workDate: '2026-09-20', scanIn: '08:30', scanOut: '17:00', lateMinutes: 30, earlyMinutes: 0, overtimeMinutes: 0, reviewStatus: 'BLOCKED', note: 'Catatan duplikat.' },
      // Duplicate intra-batch (second row for employee 2 on 2026-09-22)
      { id: 3, externalNoId: '002', employeeId: 2, workDate: '2026-09-22', scanIn: '08:15', scanOut: '17:00', lateMinutes: 15, earlyMinutes: 0, overtimeMinutes: 0, reviewStatus: 'BLOCKED', note: 'Catatan duplikat.' },
      // Unmapped employee (no employeeId and externalNoId unknown)
      { id: 4, externalNoId: '999', employeeId: null, workDate: '2026-09-22', scanIn: '08:00', scanOut: '17:00', lateMinutes: 0, earlyMinutes: 0, overtimeMinutes: 0, reviewStatus: 'BLOCKED', note: 'Karyawan tidak ditemukan.' },
    ],
  });

  const next = applyCommand(data, { type: 'batch', batchId: 1, action: 'commit', strictIntegrity: false });
  const batch = next.batches.find(b => b.id === 1);
  assert.equal(batch.status, 'COMMITTED');

  // Verify only row 1 was committed to records
  const recordsOn22 = next.records.filter(r => r.workDate === '2026-09-22');
  assert.equal(recordsOn22.length, 1);
  assert.equal(recordsOn22[0].employeeId, 2);

  // Pre-existing record for 2026-09-20 should not have been duplicated
  const recordsOn20 = next.records.filter(r => r.workDate === '2026-09-20');
  assert.equal(recordsOn20.length, 1);

  // In batch rows, duplicates and unmapped must be marked SKIPPED
  const row2 = batch.rows.find(r => r.id === 2);
  assert.equal(row2.reviewStatus, 'SKIPPED');
  assert.match(row2.note, /duplikat|ganda/i);

  const row3 = batch.rows.find(r => r.id === 3);
  assert.equal(row3.reviewStatus, 'SKIPPED');
  assert.match(row3.note, /duplikat|ganda/i);

  const row4 = batch.rows.find(r => r.id === 4);
  assert.equal(row4.reviewStatus, 'SKIPPED');
});

test('toggle_strict_integrity command updates batch strictIntegrity mode', () => {
  let data = createSeed();
  data.batches.push({
    id: 1,
    filename: 'test.xls',
    sourceId: 1,
    createdAt: new Date().toISOString(),
    status: 'DRAFT',
    strictIntegrity: true,
    rows: [],
  });

  const toggledOff = applyCommand(data, { type: 'toggle_strict_integrity', batchId: 1, enabled: false });
  assert.equal(toggledOff.batches.find(b => b.id === 1).strictIntegrity, false);

  const toggledOn = applyCommand(toggledOff, { type: 'toggle_strict_integrity', batchId: 1, enabled: true });
  assert.equal(toggledOn.batches.find(b => b.id === 1).strictIntegrity, true);
});
