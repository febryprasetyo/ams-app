import assert from 'node:assert/strict';
import test from 'node:test';
import { assessEmployeeDeletion } from './employeeDeletion';

test('allows permanent deletion when attendance history is clear', () => {
  assert.deepEqual(assessEmployeeDeletion({ attendanceCheck: 'clear' }), { allowed: true });
});

test('blocks deletion when attendance history exists', () => {
  const result = assessEmployeeDeletion({ attendanceCheck: 'has-history' });

  assert.equal(result.allowed, false);
  assert.match(result.message ?? '', /riwayat absensi/i);
});

test('blocks deletion when attendance history cannot be checked', () => {
  const result = assessEmployeeDeletion({ attendanceCheck: 'unavailable' });

  assert.equal(result.allowed, false);
  assert.match(result.message ?? '', /tidak dapat diverifikasi/i);
});
