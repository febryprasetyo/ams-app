import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCommand } from './commands.ts';

const createSeed = () => ({
  schemaVersion: 1,
  meta: { defaultDate: '2026-09-25', periodStart: '2026-09-01', actor: 'HR Staff', role: 'HR_STAFF', canManageAccess: false },
  departments: [{ id: 1, code: 'IT', name: 'IT Dept', isActive: true }],
  locations: [],
  sources: [{ id: 1, code: 'MACHINE', name: 'Fingerprint Mesin', isActive: true }],
  employees: [
    { id: 10, employeeCode: 'EMP-010', fullName: 'Ahmad Dahlan', email: '', departmentId: 1, locationId: null, position: 'Engineer', isActive: true },
  ],
  identities: [
    { id: 1, sourceId: 1, externalNoId: '10', employeeId: 10 },
  ],
  records: [],
  batches: [],
  audit: [],
  revisions: [],
  grants: [],
  locks: [],
  shifts: [],
  shiftAssignments: [],
});

test('batch commit produces valid records with sourceBatchId for database persistence', () => {
  const seed = createSeed();
  
  // 1. Import a batch
  const imported = applyCommand(seed, {
    type: 'import',
    filename: 'SEPTEMBER_FINGERPRINT.xlsx',
    sourceId: 1,
    rows: [
      {
        id: 1,
        externalNoId: '10',
        employeeId: 10,
        workDate: '2026-09-21',
        scanIn: '07:55',
        scanOut: '17:05',
        lateMinutes: 0,
        earlyMinutes: 0,
        overtimeMinutes: 5,
        reviewStatus: 'READY',
        note: 'Normal scan',
      },
    ],
  });

  const batchId = imported.batches[0].id;
  assert.equal(imported.batches[0].status, 'DRAFT');

  // 2. Commit batch
  const committed = applyCommand(imported, {
    type: 'batch',
    batchId,
    action: 'commit',
    strictIntegrity: true,
  });

  assert.equal(committed.batches[0].status, 'COMMITTED');
  assert.equal(committed.records.length, 1);
  assert.equal(committed.records[0].employeeId, 10);
  assert.equal(committed.records[0].workDate, '2026-09-21');
  assert.equal(committed.records[0].sourceBatchId, batchId);
});

test('manual record_attendance creates record ready for database persistence', () => {
  const seed = createSeed();

  const result = applyCommand(seed, {
    type: 'record_attendance',
    employeeId: 10,
    workDate: '2026-09-22',
    attendanceStatus: 'SAKIT',
    reason: 'Demam tinggi',
  });

  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].employeeId, 10);
  assert.equal(result.records[0].workDate, '2026-09-22');
  assert.equal(result.records[0].attendanceStatus, 'SAKIT');
});
