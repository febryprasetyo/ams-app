import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_OFFICE_SHIFT, DEFAULT_PRODUCTION_SHIFT, getWorkingScheduleForDate } from './attendanceSchedule';

test('field duty follows weekday and Saturday shifts, using base hours on normal days off', () => {
  for (const [date, shift, expected] of [
    ['2026-10-19', DEFAULT_OFFICE_SHIFT, { scheduleIn: '08:00', scheduleOut: '17:00' }],
    ['2026-10-17', DEFAULT_OFFICE_SHIFT, { scheduleIn: '08:00', scheduleOut: '17:00' }],
    ['2026-10-18', DEFAULT_OFFICE_SHIFT, { scheduleIn: '08:00', scheduleOut: '17:00' }],
    ['2026-10-17', DEFAULT_PRODUCTION_SHIFT, { scheduleIn: '08:00', scheduleOut: '14:00' }],
    ['2026-10-18', DEFAULT_PRODUCTION_SHIFT, { scheduleIn: '08:00', scheduleOut: '16:00' }],
  ] as const) assert.deepEqual(getWorkingScheduleForDate(date, shift), expected);
});
