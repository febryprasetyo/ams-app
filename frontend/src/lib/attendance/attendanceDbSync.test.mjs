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
  let receivedCommand;

  try {
    globalThis.window = {};
    api.get = async endpoint => {
      if (endpoint === '/attendance/workspace') {
        return { success: true, data: structuredClone(seed) };
      }
      return { success: true, data: [] };
    };
    api.post = async (endpoint, body) => {
      assert.equal(endpoint, '/attendance/commands');
      receivedCommand = body.command;
      const updated = structuredClone(seed);
      updated.records[0] = {
        ...updated.records[0],
        isDayOff: body.command.values.isDayOff,
        scanIn: body.command.values.scanIn,
        scanOut: body.command.values.scanOut,
        revision: 2,
      };
      return { success: true, data: { changed: true, eventId: 'evt-1', data: updated } };
    };

    const repo = createAttendanceRepository();
    const result = await repo.execute({
      type: 'correct',
      recordId: 1,
      expectedRevision: 1,
      reason: 'Jadwal off',
      values: {
        scanIn: '09:00',
        scanOut: '17:00',
        attendanceStatus: 'PRESENT',
        isDayOff: true,
        lateMinutes: 60,
        overtimeMinutes: 0,
      },
    });

    assert.equal(receivedCommand.type, 'correct');
    assert.equal(receivedCommand.values.isDayOff, true);
    assert.equal(result.records[0].isDayOff, true);
  } finally {
    api.get = originalGet;
    api.post = originalPost;
    delete globalThis.window;
  }
});

test('repository removes legacy MANUAL_ENTRY batches from import history', async () => {
  const { createAttendanceRepository } = await import('./repository.ts');
  const { api } = await import('../api.ts');
  const originalGet = api.get;
  const seed = createSeed();
  seed.batches = [
    { id: 1, filename: 'MANUAL_ENTRY', sourceId: 1, status: 'COMMITTED', createdAt: '2026-10-01T00:00:00.000Z', rows: [] },
    { id: 2, filename: 'attendance.xlsx', sourceId: 1, status: 'COMMITTED', createdAt: '2026-10-02T00:00:00.000Z', rows: [] },
  ];

  try {
    globalThis.window = {};
    api.get = async endpoint => {
      if (endpoint === '/attendance/workspace') {
        return { success: true, data: structuredClone(seed) };
      }
      return { success: true, data: [] };
    };

    const data = await createAttendanceRepository().load();
    assert.deepEqual(data.batches.map(batch => batch.filename), ['attendance.xlsx']);
  } finally {
    api.get = originalGet;
    delete globalThis.window;
  }
});

test('repository loads manual attendance changes into HR activity history', async () => {
  const { createAttendanceRepository } = await import('./repository.ts');
  const { api } = await import('../api.ts');
  const originalGet = api.get;
  const seed = createSeed();
  seed.audit = [{
    id: 17,
    createdAt: '2026-10-14T06:00:00.000Z',
    actor: 'hr.admin',
    action: 'Koreksi absensi',
    detail: 'Ahmad Dahlan · 2026-09-21 · Jadwal off',
  }];

  try {
    globalThis.window = {};
    api.get = async endpoint => {
      if (endpoint === '/attendance/workspace') {
        return { success: true, data: structuredClone(seed) };
      }
      return { success: true, data: [] };
    };

    const data = await createAttendanceRepository().load();
    assert.deepEqual(data.audit, [{
      id: 17,
      createdAt: '2026-10-14T06:00:00.000Z',
      actor: 'hr.admin',
      action: 'Koreksi absensi',
      detail: 'Ahmad Dahlan · 2026-09-21 · Jadwal off',
    }]);
  } finally {
    api.get = originalGet;
    delete globalThis.window;
  }
});
