import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOverviewMetrics,
  getActionablePriorities,
  getDepartmentPresenceSummary,
  getTimeBasedGreeting,
  formatJakartaDate
} from './overviewMetrics.ts';

const createFixture = () => ({
  schemaVersion: 1,
  meta: { defaultDate: '2026-10-01', periodStart: '2026-10-01', actor: 'HR Admin', role: 'HR_ADMIN', canManageAccess: true },
  departments: [
    { id: 1, code: 'HR', name: 'Human Resources', isActive: true },
    { id: 2, code: 'ENG', name: 'Engineering', isActive: true },
  ],
  locations: [],
  sources: [{ id: 1, code: 'MACHINE', name: 'Fingerprint Kantor', isActive: true }],
  employees: [
    { id: 1, employeeCode: 'EMP-001', fullName: 'Budi Santoso', email: 'budi@corp.com', departmentId: 2, locationId: null, position: 'Lead Dev', isActive: true },
    { id: 2, employeeCode: 'EMP-002', fullName: 'Siti Aminah', email: 'siti@corp.com', departmentId: 1, locationId: null, position: 'HR Officer', isActive: true },
    { id: 3, employeeCode: 'EMP-003', fullName: 'Ahmad Fauzi', email: 'ahmad@corp.com', departmentId: 2, locationId: null, position: 'Junior Dev', isActive: true },
    { id: 4, employeeCode: 'EMP-004', fullName: 'Dewi Lestari', email: 'dewi@corp.com', departmentId: 1, locationId: null, position: 'HR Intern', isActive: false }, // inactive
  ],
  identities: [],
  records: [
    // Budi: Hadir, terlambat 35 menit, lembur 60 menit
    { id: 101, employeeId: 1, workDate: '2026-10-01', shift: 'Pagi', scheduleIn: '08:00', scheduleOut: '17:00', scanIn: '08:35', scanOut: '18:05', rawScanIn: '08:35', rawScanOut: '18:05', lateMinutes: 35, earlyMinutes: 0, overtimeMinutes: 60, attendanceStatus: 'PRESENT', isDayOff: false, normalized: false, revision: 1, sourceBatchId: 1 },
    // Siti: Hadir, tepat waktu, scanIn ada, scanOut kosong (missing punch), pulang cepat 15m
    { id: 102, employeeId: 2, workDate: '2026-10-01', shift: 'Pagi', scheduleIn: '08:00', scheduleOut: '17:00', scanIn: '07:55', scanOut: null, rawScanIn: '07:55', rawScanOut: null, lateMinutes: 0, earlyMinutes: 15, overtimeMinutes: 0, attendanceStatus: 'PRESENT', isDayOff: false, normalized: false, revision: 1, sourceBatchId: 1 },
    // Ahmad: Cuti
    { id: 103, employeeId: 3, workDate: '2026-10-01', shift: null, scheduleIn: null, scheduleOut: null, scanIn: null, scanOut: null, rawScanIn: null, rawScanOut: null, lateMinutes: 0, earlyMinutes: 0, overtimeMinutes: 0, attendanceStatus: 'CUTI', isDayOff: false, normalized: false, revision: 1, sourceBatchId: null },
  ],
  batches: [],
  audit: [],
  revisions: [],
  grants: [],
  locks: [],
});

test('calculateOverviewMetrics accurately computes real active workforce numbers', () => {
  const data = createFixture();
  const metrics = calculateOverviewMetrics(data, '2026-10-01');

  assert.equal(metrics.totalActiveEmployees, 3, 'Dewi is inactive, so total active is 3');
  assert.equal(metrics.presentCount, 2, 'Budi and Siti are PRESENT');
  assert.equal(metrics.presentRate, 66.7, '2 / 3 = 66.7%');
  assert.equal(metrics.onTimeCount, 1, 'Siti is on time (lateMinutes === 0)');
  assert.equal(metrics.lateCount, 1, 'Budi is late');
  assert.equal(metrics.totalLateMinutes, 35);
  assert.equal(metrics.earlyCount, 1, 'Siti left early 15m');
  assert.equal(metrics.totalEarlyMinutes, 15);
  assert.equal(metrics.overtimeCount, 1, 'Budi has overtime');
  assert.equal(metrics.totalOvertimeMinutes, 60);
  assert.equal(metrics.missingScanCount, 1, 'Siti has scanIn but no scanOut');
  assert.equal(metrics.leaveCount, 1, 'Ahmad is on CUTI');
});

test('getActionablePriorities returns priority items for late and missing punch', () => {
  const data = createFixture();
  const priorities = getActionablePriorities(data, '2026-10-01', 5);

  assert.equal(priorities.length, 2);
  const lateItem = priorities.find(p => p.type === 'LATE');
  assert.ok(lateItem);
  assert.equal(lateItem.employeeId, 1);
  assert.match(lateItem.description, /35 menit/);

  const missingItem = priorities.find(p => p.type === 'MISSING_SCAN');
  assert.ok(missingItem);
  assert.equal(missingItem.employeeId, 2);
});

test('getDepartmentPresenceSummary breaks down presence by active departments', () => {
  const data = createFixture();
  const summary = getDepartmentPresenceSummary(data, '2026-10-01');

  assert.equal(summary.length, 2);
  const hrDept = summary.find(s => s.name === 'Human Resources');
  assert.equal(hrDept.activeCount, 1); // Siti is active, Dewi is inactive
  assert.equal(hrDept.presentCount, 1);
  assert.equal(hrDept.rate, 100);

  const engDept = summary.find(s => s.name === 'Engineering');
  assert.equal(engDept.activeCount, 2); // Budi and Ahmad
  assert.equal(engDept.presentCount, 1); // Budi
  assert.equal(engDept.rate, 50);
});

test('getTimeBasedGreeting formats friendly greetings based on hour', () => {
  assert.equal(getTimeBasedGreeting('Bu Rina', 8), 'Pagi, Bu Rina 👋');
  assert.equal(getTimeBasedGreeting('Pak Budi', 13), 'Siang, Pak Budi 👋');
  assert.equal(getTimeBasedGreeting('Rina', 16), 'Sore, Rina 👋');
  assert.equal(getTimeBasedGreeting('', 20), 'Malam 👋');
});

test('formatJakartaDate formats Indonesian date string properly', () => {
  const formatted = formatJakartaDate('2026-10-01');
  assert.match(formatted, /Kamis/);
  assert.match(formatted, /1 Oktober 2026/);
});
