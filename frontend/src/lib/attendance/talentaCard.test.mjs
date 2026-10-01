import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTalentaKpi,
  formatTalentaDate,
  formatTalentaRow,
} from './talentaCard.ts';

test('formatTalentaDate formats ISO date to Wed, 23 Sep 2026 style', () => {
  assert.equal(formatTalentaDate('2026-09-23'), 'Wed, 23 Sep 2026');
  assert.equal(formatTalentaDate('2026-09-26'), 'Sat, 26 Sep 2026');
  assert.equal(formatTalentaDate('2026-09-27'), 'Sun, 27 Sep 2026');
});

test('formatTalentaRow correctly formats normal work day and dayoff rows', () => {
  // 1. Day off row
  const dayOffRow = {
    date: '2026-09-26',
    dayName: 'Sabtu',
    dayOfWeek: 6,
    isDayOff: true,
    shiftName: 'Office Standar (5 Hari)',
    scheduleIn: '00:00',
    scheduleOut: '00:00',
    record: null,
  };
  const formattedDayOff = formatTalentaRow(dayOffRow);
  assert.equal(formattedDayOff.dateDisplay, 'Sat, 26 Sep 2026');
  assert.equal(formattedDayOff.shiftCode, 'dayoff');
  assert.equal(formattedDayOff.isDayOff, true);
  assert.equal(formattedDayOff.scheduleIn, '00:00');
  assert.equal(formattedDayOff.scheduleOut, '00:00');
  assert.equal(formattedDayOff.clockIn, '-');
  assert.equal(formattedDayOff.clockOut, '-');
  assert.equal(formattedDayOff.attendanceCode, '-');
  assert.equal(formattedDayOff.timeOffCode, '-');
  assert.equal(formattedDayOff.overtime, '-');

  // 2. Normal working day with attendance
  const workDayRow = {
    date: '2026-09-23',
    dayName: 'Rabu',
    dayOfWeek: 3,
    isDayOff: false,
    shiftName: 'Office Standar (5 Hari)',
    scheduleIn: '08:00',
    scheduleOut: '17:00',
    record: {
      id: 101,
      employeeId: 1,
      workDate: '2026-09-23',
      scanIn: '08:05',
      scanOut: '17:15',
      lateMinutes: 5,
      earlyMinutes: 0,
      overtimeMinutes: 90,
      attendanceStatus: 'PRESENT',
      revision: 1,
    },
  };
  const formattedWorkDay = formatTalentaRow(workDayRow);
  assert.equal(formattedWorkDay.dateDisplay, 'Wed, 23 Sep 2026');
  assert.equal(formattedWorkDay.shiftCode, 'O');
  assert.equal(formattedWorkDay.isDayOff, false);
  assert.equal(formattedWorkDay.scheduleIn, '08:00');
  assert.equal(formattedWorkDay.scheduleOut, '17:00');
  assert.equal(formattedWorkDay.clockIn, '08:05');
  assert.equal(formattedWorkDay.clockOut, '17:15');
  assert.equal(formattedWorkDay.attendanceCode, 'H');
  assert.equal(formattedWorkDay.timeOffCode, '-');
  assert.equal(formattedWorkDay.overtime, '01:30');

  // 3. Sick day (Sakit)
  const sickRow = {
    date: '2026-09-24',
    dayName: 'Kamis',
    dayOfWeek: 4,
    isDayOff: false,
    shiftName: 'Office Standar (5 Hari)',
    scheduleIn: '08:00',
    scheduleOut: '17:00',
    record: {
      id: 102,
      employeeId: 1,
      workDate: '2026-09-24',
      scanIn: null,
      scanOut: null,
      lateMinutes: 0,
      earlyMinutes: 0,
      overtimeMinutes: 0,
      attendanceStatus: 'SAKIT',
      revision: 1,
    },
  };
  const formattedSick = formatTalentaRow(sickRow);
  assert.equal(formattedSick.attendanceCode, 'S');
  assert.equal(formattedSick.timeOffCode, 'S');
});

test('calculateTalentaKpi calculates accurate 3-segment KPI stats', () => {
  const rows = [
    // Past dayoff (Sat, Sun) -> 2 days off
    { date: '2026-09-20', isDayOff: true, record: null },
    { date: '2026-09-21', isDayOff: false, record: { attendanceStatus: 'PRESENT', scanIn: '08:00', scanOut: '16:30', earlyMinutes: 30, lateMinutes: 0 } }, // Early clock out
    { date: '2026-09-22', isDayOff: false, record: { attendanceStatus: 'PRESENT', scanIn: '08:00', scanOut: null, earlyMinutes: 0, lateMinutes: 0 } }, // No clock out
    { date: '2026-09-23', isDayOff: false, record: { attendanceStatus: 'PRESENT', scanIn: null, scanOut: '17:00', earlyMinutes: 0, lateMinutes: 0 } }, // No clock in
    { date: '2026-09-24', isDayOff: false, record: { attendanceStatus: 'SAKIT', scanIn: null, scanOut: null, earlyMinutes: 0, lateMinutes: 0 } }, // Time off (Sakit)
    { date: '2026-09-25', isDayOff: false, record: null }, // Past unrecorded -> Absent
    { date: '2026-09-26', isDayOff: true, record: null }, // Day off
    // Future days (relative to 2026-09-26)
    { date: '2026-09-27', isDayOff: true, record: null }, // Future dayoff
    { date: '2026-09-28', isDayOff: false, record: null }, // Future workday (next workday)
    { date: '2026-09-29', isDayOff: false, record: null }, // Future workday (next workday)
  ];

  const todayStr = '2026-09-26';
  const kpi = calculateTalentaKpi(rows, todayStr);

  // Segment 1
  assert.equal(kpi.earlyClockOut, 1);
  assert.equal(kpi.noClockOut, 1);
  assert.equal(kpi.noClockIn, 1);
  assert.equal(kpi.invalid, 0);

  // Segment 2
  assert.equal(kpi.absent, 1); // unrecorded past work day
  assert.equal(kpi.dayOff, 3); // 4 total dayoffs in period
  assert.equal(kpi.timeOff, 1); // 1 SAKIT

  // Segment 3
  assert.equal(kpi.nextWorkdays, 2); // 28th and 29th
});
