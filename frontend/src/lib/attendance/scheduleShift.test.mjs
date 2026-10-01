import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_OFFICE_SHIFT,
  getPayrollCyclePeriod,
  resolveEmployeeShift,
  isWorkDayForShift,
  getScheduleForDate,
  generateFullCalendarGrid,
} from './scheduleShift.ts';

test('getPayrollCyclePeriod computes exact 21st to 20th cut-off range', () => {
  // September 2026 -> 21 August 2026 to 20 September 2026
  const sep = getPayrollCyclePeriod(2026, 9);
  assert.equal(sep.startDate, '2026-08-21');
  assert.equal(sep.endDate, '2026-09-20');
  assert.equal(sep.label, 'September 2026');

  // January 2027 -> 21 December 2026 to 20 January 2027 (crosses year boundary)
  const jan = getPayrollCyclePeriod(2027, 1);
  assert.equal(jan.startDate, '2026-12-21');
  assert.equal(jan.endDate, '2027-01-20');
  assert.equal(jan.label, 'Januari 2027');
});

test('resolveEmployeeShift prioritizes employee override, then department default, then global office', () => {
  const shifts = [
    DEFAULT_OFFICE_SHIFT,
    {
      id: 2,
      code: 'PROD_6D',
      name: 'Produksi 6 Hari',
      scheduleIn: '08:00',
      scheduleOut: '16:00',
      workDays: 6,
      saturdayScheduleIn: '08:00',
      saturdayScheduleOut: '14:00',
      isDefault: false,
      isActive: true,
    },
    {
      id: 3,
      code: 'PROD_MALAM',
      name: 'Produksi Shift Malam',
      scheduleIn: '23:00',
      scheduleOut: '07:00',
      workDays: 5,
      isDefault: false,
      isActive: true,
    },
  ];

  const shiftAssignments = [
    // Department 10 (Produksi) assigned to Shift 2 (PROD_6D)
    { id: 1, shiftId: 2, departmentId: 10, employeeId: null },
    // Employee 105 (Budi) overridden to Shift 3 (PROD_MALAM)
    { id: 2, shiftId: 3, departmentId: null, employeeId: 105 },
  ];

  // Case 1: General employee in Office dept (dept 1) -> Default Office (08:00 - 17:00, 5 days)
  const empOffice = { id: 101, departmentId: 1, fullName: 'Dewi Office' };
  const shiftOffice = resolveEmployeeShift(empOffice, shifts, shiftAssignments);
  assert.equal(shiftOffice.code, 'OFFICE');
  assert.equal(shiftOffice.scheduleIn, '08:00');
  assert.equal(shiftOffice.scheduleOut, '17:00');
  assert.equal(shiftOffice.workDays, 5);

  // Case 2: Employee in Produksi dept (dept 10) -> Produksi 6 Hari
  const empProd = { id: 102, departmentId: 10, fullName: 'Joko Produksi' };
  const shiftProd = resolveEmployeeShift(empProd, shifts, shiftAssignments);
  assert.equal(shiftProd.code, 'PROD_6D');
  assert.equal(shiftProd.scheduleOut, '16:00');
  assert.equal(shiftProd.workDays, 6);

  // Case 3: Employee 105 in Produksi dept overridden to Shift Malam
  const empOverride = { id: 105, departmentId: 10, fullName: 'Budi Malam' };
  const shiftOverride = resolveEmployeeShift(empOverride, shifts, shiftAssignments);
  assert.equal(shiftOverride.code, 'PROD_MALAM');
  assert.equal(shiftOverride.scheduleIn, '23:00');
});

test('isWorkDayForShift correctly identifies Saturday as working for 6-day shift and dayoff for 5-day', () => {
  const prod6d = {
    id: 2,
    code: 'PROD_6D',
    name: 'Produksi 6 Hari',
    scheduleIn: '08:00',
    scheduleOut: '16:00',
    workDays: 6,
    saturdayScheduleIn: '08:00',
    saturdayScheduleOut: '14:00',
    isDefault: false,
    isActive: true,
  };

  // 2026-08-21 is Friday (weekday)
  assert.equal(isWorkDayForShift('2026-08-21', DEFAULT_OFFICE_SHIFT), true);
  assert.equal(isWorkDayForShift('2026-08-21', prod6d), true);

  // 2026-08-22 is Saturday
  assert.equal(isWorkDayForShift('2026-08-22', DEFAULT_OFFICE_SHIFT), false); // Day Off
  assert.equal(isWorkDayForShift('2026-08-22', prod6d), true); // Active working day!

  // 2026-08-23 is Sunday
  assert.equal(isWorkDayForShift('2026-08-23', DEFAULT_OFFICE_SHIFT), false);
  assert.equal(isWorkDayForShift('2026-08-23', prod6d), false);
});

test('getScheduleForDate returns 08:00-14:00 for Saturday on 6-day shift', () => {
  const prod6d = {
    id: 2,
    code: 'PROD_6D',
    name: 'Produksi 6 Hari',
    scheduleIn: '08:00',
    scheduleOut: '16:00',
    workDays: 6,
    saturdayScheduleIn: '08:00',
    saturdayScheduleOut: '14:00',
    isDefault: false,
    isActive: true,
  };

  // Saturday 2026-08-22
  const satSchedule = getScheduleForDate('2026-08-22', prod6d);
  assert.equal(satSchedule.scheduleIn, '08:00');
  assert.equal(satSchedule.scheduleOut, '14:00');
  assert.equal(satSchedule.isDayOff, false);

  // Weekday 2026-08-24 (Monday)
  const monSchedule = getScheduleForDate('2026-08-24', prod6d);
  assert.equal(monSchedule.scheduleIn, '08:00');
  assert.equal(monSchedule.scheduleOut, '16:00');
  assert.equal(monSchedule.isDayOff, false);

  // Sunday 2026-08-23
  const sunSchedule = getScheduleForDate('2026-08-23', prod6d);
  assert.equal(sunSchedule.scheduleIn, '00:00');
  assert.equal(sunSchedule.scheduleOut, '00:00');
  assert.equal(sunSchedule.isDayOff, true);
});

test('generateFullCalendarGrid builds all 31 dates matching Talenta sample', () => {
  const existingRecords = [
    {
      id: 1,
      employeeId: 101,
      workDate: '2026-08-24',
      shift: 'O',
      scheduleIn: '08:00',
      scheduleOut: '17:00',
      scanIn: '07:54',
      scanOut: '17:11',
      rawScanIn: '07:54',
      rawScanOut: '17:11',
      lateMinutes: 0,
      earlyMinutes: 0,
      overtimeMinutes: 11,
      attendanceStatus: 'PRESENT',
      isDayOff: false,
      normalized: false,
      revision: 1,
      sourceBatchId: 1,
    },
    // Sick day on 2026-08-31
    {
      id: 2,
      employeeId: 101,
      workDate: '2026-08-31',
      shift: 'O',
      scheduleIn: '08:00',
      scheduleOut: '17:00',
      scanIn: null,
      scanOut: null,
      rawScanIn: null,
      rawScanOut: null,
      lateMinutes: 0,
      earlyMinutes: 0,
      overtimeMinutes: 0,
      attendanceStatus: 'SAKIT',
      isDayOff: false,
      normalized: false,
      revision: 1,
      sourceBatchId: null,
    },
  ];

  const grid = generateFullCalendarGrid(
    '2026-08-21',
    '2026-09-20',
    DEFAULT_OFFICE_SHIFT,
    existingRecords
  );

  // Exactly 31 days in 21 Aug - 20 Sep
  assert.equal(grid.length, 31);
  assert.equal(grid[0].date, '2026-08-21');
  assert.equal(grid[grid.length - 1].date, '2026-09-20');

  // Day 1 (2026-08-21, Friday): No record in existingRecords -> status = EMPTY / UNRECORDED
  assert.equal(grid[0].record, null);
  assert.equal(grid[0].isDayOff, false);
  assert.equal(grid[0].scheduleIn, '08:00');

  // Day 4 (2026-08-24, Monday): Has present record
  const day4 = grid.find(d => d.date === '2026-08-24');
  assert.ok(day4);
  assert.equal(day4.record.attendanceStatus, 'PRESENT');
  assert.equal(day4.record.scanIn, '07:54');

  // Day 11 (2026-08-31, Monday): Has sick record (SAKIT)
  const day11 = grid.find(d => d.date === '2026-08-31');
  assert.ok(day11);
  assert.equal(day11.record.attendanceStatus, 'SAKIT');
  assert.equal(day11.record.scanIn, null);

  // Saturday (2026-08-22): isDayOff = true
  const sat = grid.find(d => d.date === '2026-08-22');
  assert.ok(sat);
  assert.equal(sat.isDayOff, true);
});

import { applyCommand } from './commands.ts';

test('applyCommand record_attendance creates new SAKIT record for empty date with optional reason', () => {
  const baseData = {
    schemaVersion: 1,
    meta: { defaultDate: '2026-09-01', periodStart: '2026-08-21', actor: 'HR Admin', role: 'HR_ADMIN', canManageAccess: true },
    departments: [{ id: 1, code: 'PROD', name: 'Produksi', isActive: true }],
    locations: [],
    sources: [],
    employees: [{ id: 10, employeeCode: 'EMP010', fullName: 'Budi Santoso', email: 'budi@company.com', departmentId: 1, locationId: null, position: 'Operator', isActive: true }],
    identities: [],
    records: [],
    batches: [],
    audit: [],
    revisions: [],
    grants: [],
    locks: [],
    shifts: [DEFAULT_OFFICE_SHIFT],
    shiftAssignments: [],
  };

  // Test 1: Record SAKIT on 2026-08-31 without reason (reason is optional)
  const result1 = applyCommand(baseData, {
    type: 'record_attendance',
    employeeId: 10,
    workDate: '2026-08-31',
    attendanceStatus: 'SAKIT',
  });

  assert.equal(result1.records.length, 1);
  const rec1 = result1.records[0];
  assert.equal(rec1.workDate, '2026-08-31');
  assert.equal(rec1.attendanceStatus, 'SAKIT');
  assert.equal(rec1.scanIn, null);
  assert.equal(rec1.scanOut, null);
  assert.equal(rec1.lateMinutes, 0);

  // Test 2: Record PRESENT manually on 2026-09-01 with scanIn and scanOut
  const result2 = applyCommand(result1, {
    type: 'record_attendance',
    employeeId: 10,
    workDate: '2026-09-01',
    attendanceStatus: 'PRESENT',
    scanIn: '08:00',
    scanOut: '17:00',
    reason: 'Lupa tap kartu pagi',
  });

  assert.equal(result2.records.length, 2);
  const rec2 = result2.records.find(r => r.workDate === '2026-09-01');
  assert.ok(rec2);
  assert.equal(rec2.attendanceStatus, 'PRESENT');
  assert.equal(rec2.scanIn, '08:00');
  assert.equal(rec2.scanOut, '17:00');
});

test('applyCommand shift and assign_shift manage shift catalog and assignments', () => {
  const baseData = {
    schemaVersion: 1,
    meta: { defaultDate: '2026-09-01', periodStart: '2026-08-21', actor: 'HR Admin', role: 'HR_ADMIN', canManageAccess: true },
    departments: [{ id: 1, code: 'PROD', name: 'Produksi', isActive: true }],
    locations: [],
    sources: [],
    employees: [{ id: 10, employeeCode: 'EMP010', fullName: 'Budi Santoso', email: 'budi@company.com', departmentId: 1, locationId: null, position: 'Operator', isActive: true }],
    identities: [],
    records: [],
    batches: [],
    audit: [],
    revisions: [],
    grants: [],
    locks: [],
    shifts: [DEFAULT_OFFICE_SHIFT],
    shiftAssignments: [],
  };

  // Create shift
  const newShift = {
    id: 0,
    code: 'PROD_SIANG',
    name: 'Produksi Siang',
    scheduleIn: '14:00',
    scheduleOut: '22:00',
    workDays: 6,
    saturdayScheduleIn: '14:00',
    saturdayScheduleOut: '20:00',
    isDefault: false,
    isActive: true,
  };

  const withShift = applyCommand(baseData, {
    type: 'shift',
    action: 'create',
    shift: newShift,
  });

  assert.equal(withShift.shifts.length, 2);
  const createdShift = withShift.shifts.find(s => s.code === 'PROD_SIANG');
  assert.ok(createdShift);
  assert.ok(createdShift.id > 1);

  // Assign shift to employee 10
  const withAssignment = applyCommand(withShift, {
    type: 'assign_shift',
    assignment: {
      id: 0,
      shiftId: createdShift.id,
      employeeId: 10,
    },
  });

  assert.equal(withAssignment.shiftAssignments.length, 1);
  assert.equal(withAssignment.shiftAssignments[0].shiftId, createdShift.id);
  assert.equal(withAssignment.shiftAssignments[0].employeeId, 10);
});
