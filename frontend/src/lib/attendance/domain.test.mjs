import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { filterRecords, summarizeEmployees, durationLabel, reportCsv, validatePeriod, parseImportRows } from './domain.ts';
import { applyCommand } from './commands.ts';

const seed = JSON.parse(await readFile(new URL('../../../public/mock/attendance.json', import.meta.url)));
const fixture = () => structuredClone(seed);
const range = { startDate: seed.meta.periodStart, endDate: seed.meta.defaultDate };

test('final records total per employee, without draft rows or duplicate identities', () => {
  const data = fixture();
  const base = data.records[0];
  data.records = [15, 20, 10].map((lateMinutes, i) => ({ ...base, id: i + 1, employeeId: 1, workDate: `2026-09-${21 + i}`, lateMinutes, overtimeMinutes: [60, 90, 0][i] }));
  const report = summarizeEmployees(data, { startDate: '2026-09-21', endDate: '2026-09-25' }).find(row => row.employee.id === 1);
  assert.equal(report.lateMinutes, 45);
  assert.equal(report.overtimeMinutes, 150);
  assert.equal(report.recordCount, 3);
  assert.equal(durationLabel(1500), '25 jam 0 menit');
});
test('date and department filters operate before aggregation; no records is distinct from zero', () => {
  const data = fixture();
  const rows = filterRecords(data, { ...range, departmentId: 1 });
  assert.ok(rows.length > 0);
  assert.ok(rows.every(row => data.employees.find(e => e.id === row.employeeId).departmentId === 1));
  assert.equal(filterRecords(data, { startDate: '2000-01-01', endDate: '2000-01-01' }).length, 0);
  assert.ok(summarizeEmployees(data, { startDate: '2000-01-01', endDate: '2000-01-01' }).every(row => row.recordCount === 0));
});
test('period and imports reject malformed dates, negative durations and missing fields', () => {
  assert.throws(() => validatePeriod('2026-09-25', '2026-09-01'));
  assert.throws(() => validatePeriod('2026-02-30', '2026-03-01'));
  assert.throws(() => validatePeriod('2020-01-01', '2026-09-25'));
  assert.throws(() => parseImportRows('[{"employeeId":1}]'));
  const row = { externalNoId: '001', workDate: '2026-09-26', scanIn: '08:00', scanOut: '16:00', lateMinutes: 0, earlyMinutes: 0, overtimeMinutes: 30 };
  assert.equal(parseImportRows(JSON.stringify([row]))[0].externalNoId, '001');
  assert.throws(() => parseImportRows(JSON.stringify([{ ...row, overtimeMinutes: -1 }])));
});
test('correction replaces totals, retains revision and rejects stale or locked edits', () => {
  let data = fixture();
  const r = data.records.find(r => r.attendanceStatus === 'PRESENT');
  const cmd = { type: 'correct', recordId: r.id, expectedRevision: r.revision, reason: 'Koreksi contoh', values: { scanIn: r.scanIn, scanOut: r.scanOut, lateMinutes: 45, overtimeMinutes: 90, attendanceStatus: 'PRESENT' } };
  data = applyCommand(data, cmd);
  assert.equal(data.records.find(row => row.id === r.id).lateMinutes, 45);
  assert.equal(data.revisions.at(-1).before.lateMinutes, r.lateMinutes);
  assert.throws(() => applyCommand(data, cmd), /berubah/);
  data = applyCommand(data, { type: 'lock', workDate: r.workDate, locked: true, reason: 'Final' });
  assert.throws(() => applyCommand(data, { ...cmd, expectedRevision: r.revision + 1 }), /dikunci/);
  assert.throws(() => applyCommand(data, { type: 'lock', workDate: r.workDate, locked: false, reason: '' }), /Alasan/);
});
test('unmapped import blocks commit; mapping, review and commit create records exactly once', () => {
  let data = fixture();
  const rows = parseImportRows(JSON.stringify([{ externalNoId: 'NEW-01', workDate: '2026-09-26', scanIn: '08:00', scanOut: '16:00', lateMinutes: 10, earlyMinutes: 0, overtimeMinutes: 45 }]));
  data = applyCommand(data, { type: 'import', filename: 'new.json', sourceId: 1, rows });
  const batchId = data.batches.at(-1).id;
  assert.throws(() => applyCommand(data, { type: 'batch', batchId, action: 'commit' }), /review/);
  data = applyCommand(data, { type: 'identity', value: { id: 0, sourceId: 1, externalNoId: 'NEW-01', employeeId: 1 } });
  data = applyCommand(data, { type: 'review', batchId, rowId: 1, employeeId: 1, skipped: false, reason: 'Pemetaan diperiksa' });
  const count = data.records.length;
  data = applyCommand(data, { type: 'batch', batchId, action: 'commit' });
  assert.equal(data.records.length, count + 1);
  data = applyCommand(data, { type: 'batch', batchId, action: 'commit' });
  assert.equal(data.records.length, count + 1);
});
test('conflicting import cannot overwrite or partially commit records', () => {
  let data = fixture();
  const existing = data.records[0];
  const identity = data.identities.find(i => i.employeeId === existing.employeeId);
  const rows = parseImportRows(JSON.stringify([{ externalNoId: identity.externalNoId, workDate: existing.workDate, scanIn: '08:00', scanOut: '16:00', lateMinutes: 0, earlyMinutes: 0, overtimeMinutes: 0 }]));
  data = applyCommand(data, { type: 'import', filename: 'duplicate.json', sourceId: identity.sourceId, rows });
  assert.throws(() => applyCommand(data, { type: 'batch', batchId: data.batches.at(-1).id, action: 'commit' }), /duplikat|review/);
});
test('read-only demo role cannot mutate attendance and non-present correction clears durations', () => {
  const data = fixture();
  data.meta.role = 'REPORT_VIEWER';
  assert.throws(() => applyCommand(data, { type: 'lock', workDate: range.endDate, locked: true, reason: 'Test' }), /akses/);
  const editable = fixture();
  const r = editable.records[0];
  const corrected = applyCommand(editable, { type: 'correct', recordId: r.id, expectedRevision: r.revision, reason: 'Izin', values: { attendanceStatus: 'IZIN', scanIn: '08:00', scanOut: '16:00', lateMinutes: 30, overtimeMinutes: 40 } });
  assert.equal(corrected.records[0].scanIn, null);
  assert.equal(corrected.records[0].overtimeMinutes, 0);
});
test('CSV quotes names and protects spreadsheet formulas', () => {
  const data = fixture();
  data.employees[0].fullName = '=SUM(1,2)';
  const csv = reportCsv(summarizeEmployees(data, range), range);
  assert.ok(csv.includes('"\'=SUM(1,2)"'));
  assert.ok(csv.includes('Keterlambatan (menit)'));
});

test('review cannot acknowledge away immutable parser errors', () => {
  let data = fixture();
  const identity = data.identities[0];
  const bad = { id: 1, externalNoId: identity.externalNoId, employeeId: null, workDate: '2026-09-26', scanIn: '08:00', scanOut: '16:00', lateMinutes: 0, earlyMinutes: 0, overtimeMinutes: 0, reviewStatus: 'BLOCKED', note: 'Durasi tidak valid: 01:60', issues: ['Durasi tidak valid: 01:60'] };
  data = applyCommand(data, { type: 'import', filename: 'bad.xls', sourceId: identity.sourceId, rows: [bad] });
  assert.throws(() => applyCommand(data, { type: 'review', batchId: data.batches.at(-1).id, rowId: 1, employeeId: identity.employeeId, skipped: false, reason: 'Ditinjau' }), /Durasi/);
});

test('same source and content hash reuses existing batch', () => {
  let data = fixture();
  const rows = parseImportRows(JSON.stringify([{ externalNoId: data.identities[0].externalNoId, workDate: '2026-09-26', scanIn: '08:00', scanOut: '16:00', lateMinutes: 0, earlyMinutes: 0, overtimeMinutes: 0 }]));
  const cmd = { type: 'import', sourceId: 1, filename: 'same.xls', fileHash: 'test-content-hash', rows };
  data = applyCommand(data, cmd);
  const count = data.batches.length;
  data = applyCommand(data, { ...cmd, filename: 'renamed.xls' });
  assert.equal(data.batches.length, count);
});

test("import command defaults to active source if sourceId is omitted", () => {
  let data = fixture();
  const rows = parseImportRows(JSON.stringify([{ externalNoId: data.identities[0].externalNoId, workDate: "2026-09-26", scanIn: "08:00", scanOut: "16:00", lateMinutes: 0, earlyMinutes: 0, overtimeMinutes: 0 }]));
  const countBefore = data.batches.length;
  // Omit sourceId entirely
  const cmd = { type: "import", filename: "no-source.xls", rows };
  data = applyCommand(data, cmd);
  assert.equal(data.batches.length, countBefore + 1);
  const createdBatch = data.batches.at(-1);
  assert.ok(createdBatch.sourceId > 0, "Batch should have a valid default sourceId");
  assert.equal(createdBatch.rows[0].employeeId, data.identities[0].employeeId, "Employee should be mapped via externalNoId");
});

test('sync_employees updates employee list and departments in attendance dataset', () => {
  let data = fixture();
  const newEmployees = [
    { id: 101, employeeCode: 'EMP001', fullName: 'Talenta User 1', email: 'user1@company.com', departmentId: 99, locationId: null, position: 'Staff', isActive: true }
  ];
  const newDepts = [
    { id: 99, code: 'HR', name: 'Human Resources', isActive: true }
  ];
  data = applyCommand(data, { type: 'sync_employees', employees: newEmployees, departments: newDepts });
  assert.equal(data.employees.length, 1);
  assert.equal(data.employees[0].fullName, 'Talenta User 1');
  assert.equal(data.departments.length, 1);
  assert.equal(data.departments[0].name, 'Human Resources');
});
