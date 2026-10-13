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

test('repository persists dayoff correction with scans and reloads it from database', async () => {
  const { createAttendanceRepository } = await import('./repository.ts');
  const { api } = await import('../api.ts');
  const seed = createSeed();
  seed.records = [{ id: 1, employeeId: 10, workDate: '2026-09-21', scanIn: '09:00', scanOut: '17:00', rawScanIn: '08:59', rawScanOut: '17:01', shift: null, scheduleIn: '08:00', scheduleOut: '17:00', attendanceStatus: 'PRESENT', isDayOff: false, lateMinutes: 60, earlyMinutes: 0, overtimeMinutes: 0, normalized: false, revision: 1, sourceBatchId: null }];
  const originalGet = api.get;
  const originalPost = api.post;
  const storage = new Map([['ams:attendance-workspace:v2', JSON.stringify(seed)]]);
  const mockStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  let saved;
  try {
    globalThis.window = {};
    globalThis.localStorage = mockStorage;
    globalThis.sessionStorage = mockStorage;
    api.get = async endpoint => endpoint === '/attendance/records' && saved ? [saved] : [];
    api.post = async (endpoint, body) => {
      assert.equal(endpoint, '/attendance/commit-batch');
      saved = structuredClone(body.records[0]);
    };
    const repo = createAttendanceRepository();
    await repo.execute({ type: 'correct', recordId: 1, expectedRevision: 1, reason: 'Jadwal off', values: { scanIn: '09:00', scanOut: '17:00', attendanceStatus: 'PRESENT', isDayOff: true, lateMinutes: 60, overtimeMinutes: 0 } });
    assert.equal(saved.isDayOff, true);
    assert.equal(saved.rawScanIn, '08:59');
    assert.equal(saved.scanIn, '09:00');
    storage.set('ams:attendance-workspace:v2', JSON.stringify(seed));
    const loaded = await createAttendanceRepository().load();
    assert.equal(loaded.records[0].isDayOff, true);
  } finally {
    api.get = originalGet;
    api.post = originalPost;
    delete globalThis.window;
    delete globalThis.localStorage;
    delete globalThis.sessionStorage;
  }
});
