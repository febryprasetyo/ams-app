import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAttendanceRecordPayload } from './attendanceController';

test('normalizeAttendanceRecordPayload validates required fields and sets defaults', () => {
  const valid = normalizeAttendanceRecordPayload({
    employeeId: 10,
    workDate: '2026-09-22',
    scanIn: '08:00',
    scanOut: '17:00',
  });
  assert.equal(valid.employeeId, 10);
  assert.equal(valid.workDate, '2026-09-22');
  assert.equal(valid.attendanceStatus, 'PRESENT');
  assert.equal(valid.lateMinutes, 0);
  assert.equal(valid.earlyMinutes, 0);
  assert.equal(valid.isDayOff, false);
});

test('normalizeAttendanceRecordPayload rejects missing employeeId or invalid date', () => {
  assert.throws(() => {
    normalizeAttendanceRecordPayload({ workDate: '2026-09-22' });
  }, /employeeId is required/);

  assert.throws(() => {
    normalizeAttendanceRecordPayload({ employeeId: 10, workDate: 'invalid-date' });
  }, /Invalid workDate format/);
});
