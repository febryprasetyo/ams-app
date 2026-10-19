import test from 'node:test';
import assert from 'node:assert/strict';
import { createAttendanceRepository } from './repository.ts';
import { readFile } from 'node:fs/promises';

const empty = JSON.parse(await readFile(new URL('../../../public/mock/attendance.json', import.meta.url), 'utf8'));

test('failed attendance persistence rejects the operation and does not publish local success', async () => {
  const original = { document: globalThis.document, window: globalThis.window, localStorage: globalThis.localStorage, sessionStorage: globalThis.sessionStorage, fetch: globalThis.fetch };
  const saved = new Map();
  const storage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) };
  globalThis.window = {};
  globalThis.document = { cookie: '' };
  globalThis.localStorage = storage;
  globalThis.sessionStorage = storage;
  globalThis.fetch = async (url, options) => {
    const urlStr = String(url);
    if (urlStr.endsWith('/attendance/workspace')) {
      return {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: structuredClone(empty) }),
      };
    }
    if (options?.method === 'POST' && urlStr.endsWith('/attendance/commands')) {
      throw new Error('Database unavailable');
    }
    return {
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => urlStr.endsWith('/employees') ? [{ id: 1, employeeId: 'EMP-001', fullName: 'Employee', isActive: true }] : ({ success: true, data: [] }),
    };
  };
  try {
    const repo = createAttendanceRepository(2);
    await repo.load();
    await assert.rejects(
      repo.execute({ type: 'record_attendance', employeeId: 1, workDate: '2026-10-12', attendanceStatus: 'SAKIT' }),
      /Database unavailable/
    );
    assert.equal(saved.size, 0);
    assert.equal((await repo.load()).records.length, 0);
  } finally {
    for (const key of ['document', 'window', 'localStorage', 'sessionStorage', 'fetch']) {
      if (original[key] === undefined) delete globalThis[key]; else globalThis[key] = original[key];
    }
  }
});
