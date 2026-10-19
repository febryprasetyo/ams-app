import test from 'node:test';
import assert from 'node:assert/strict';
import { createAttendanceRepository } from './repository.ts';

const createEmptyDataset = () => ({
  schemaVersion: 1,
  meta: { defaultDate: '2026-10-12', periodStart: '2026-10-01', actor: 'HR Admin', role: 'HR_ADMIN', canManageAccess: true, strictIntegrity: false },
  departments: [],
  locations: [],
  sources: [],
  employees: [],
  identities: [],
  records: [],
  batches: [],
  audit: [],
  revisions: [],
  grants: [],
  locks: [],
  shifts: [],
  shiftAssignments: [],
});

test('load returns server workspace and never falls back to mock attendance json', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), method: options?.method || 'GET' });
    if (String(url).endsWith('/attendance/workspace')) {
      return {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: createEmptyDataset() }),
      };
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  try {
    const repo = createAttendanceRepository(1);
    const data = await repo.load();
    assert.equal(data.records.length, 0);
    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.endsWith('/attendance/workspace'));
    assert.ok(!calls.some(c => c.url.includes('/mock/')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('execute sends command to /attendance/commands with Idempotency-Key header', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const empty = createEmptyDataset();

  globalThis.fetch = async (url, options) => {
    const urlStr = String(url);
    calls.push({ url: urlStr, method: options?.method || 'GET', headers: options?.headers, body: options?.body ? JSON.parse(options.body) : null });
    if (urlStr.endsWith('/attendance/workspace')) {
      return {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: empty }),
      };
    }
    if (urlStr.endsWith('/attendance/commands')) {
      const updated = structuredClone(empty);
      updated.records.push({
        id: 999,
        employeeId: 1,
        workDate: '2026-10-12',
        attendanceStatus: 'PRESENT',
        scanIn: '08:00',
        scanOut: '17:00',
        revision: 1,
      });
      return {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: {
            changed: true,
            eventId: '12345',
            data: updated,
          },
        }),
      };
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  try {
    const repo = createAttendanceRepository(1);
    await repo.load();

    const command = {
      type: 'record_attendance',
      employeeId: 1,
      workDate: '2026-10-12',
      attendanceStatus: 'PRESENT',
      scanIn: '08:00',
      scanOut: '17:00',
    };

    const res = await repo.execute(command);
    assert.equal(res.records.length, 1);
    assert.equal(res.records[0].id, 999);

    const postCall = calls.find(c => c.url.endsWith('/attendance/commands'));
    assert.ok(postCall, 'Must call POST /attendance/commands');
    assert.equal(postCall.method, 'POST');
    assert.ok(postCall.body.operationId, 'Must have operationId');
    assert.equal(postCall.headers['Idempotency-Key'], postCall.body.operationId);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('mutation failure rejects and does not corrupt local state', async () => {
  const originalFetch = globalThis.fetch;
  const empty = createEmptyDataset();

  globalThis.fetch = async (url, options) => {
    const urlStr = String(url);
    if (urlStr.endsWith('/attendance/workspace')) {
      return {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: empty }),
      };
    }
    if (urlStr.endsWith('/attendance/commands')) {
      return {
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: false, error: 'Data tanggal ini (2026-10-12) dikunci' }),
      };
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  try {
    const repo = createAttendanceRepository(1);
    await repo.load();

    await assert.rejects(
      () => repo.execute({ type: 'record_attendance', employeeId: 1, workDate: '2026-10-12', attendanceStatus: 'PRESENT' }),
      /Data tanggal ini \(2026-10-12\) dikunci/
    );

    const reloaded = await repo.load();
    assert.equal(reloaded.records.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('sync_employees updates cached employee list in memory without network mutation call', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const empty = createEmptyDataset();

  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), method: options?.method || 'GET' });
    return {
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true, data: empty }),
    };
  };

  try {
    const repo = createAttendanceRepository(1);
    await repo.load();

    const updated = await repo.execute({
      type: 'sync_employees',
      employees: [{ id: 5, employeeCode: 'EMP-005', fullName: 'New Emp', email: '', departmentId: 1, locationId: null, position: 'Staff', isActive: true }],
    });

    assert.equal(updated.employees.length, 1);
    assert.equal(updated.employees[0].employeeCode, 'EMP-005');
    assert.ok(!calls.some(c => c.url.endsWith('/attendance/commands')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
