import { test } from 'node:test';
import assert from 'node:assert';
import {
  leaveHolidayCalendars,
  leaveBalances,
  leaveRequests,
  leaveApprovals
} from './leaves';

test('leaves schema has all required tables and columns for F4 leave request', () => {
  // leaveHolidayCalendars
  assert.ok(leaveHolidayCalendars.id);
  assert.ok(leaveHolidayCalendars.year);
  assert.ok(leaveHolidayCalendars.holidayDate);
  assert.ok(leaveHolidayCalendars.description);
  assert.ok(leaveHolidayCalendars.isCollectiveLeave);

  // leaveBalances
  assert.ok(leaveBalances.id);
  assert.ok(leaveBalances.employeeId);
  assert.ok(leaveBalances.year);
  assert.ok(leaveBalances.baseQuota);
  assert.ok(leaveBalances.collectiveLeaveDeduction);
  assert.ok(leaveBalances.usedQuota);

  // leaveRequests
  assert.ok(leaveRequests.id);
  assert.ok(leaveRequests.requestNumber);
  assert.ok(leaveRequests.employeeId);
  assert.ok(leaveRequests.leaveType);
  assert.ok(leaveRequests.reason);
  assert.ok(leaveRequests.startDate);
  assert.ok(leaveRequests.endDate);
  assert.ok(leaveRequests.durationDays);
  assert.ok(leaveRequests.resumeWorkDate);
  assert.ok(leaveRequests.handoverToEmployeeId);
  assert.ok(leaveRequests.handoverTask);
  assert.ok(leaveRequests.emergencyPhone);
  assert.ok(leaveRequests.hrdNotes);
  assert.ok(leaveRequests.status);
  assert.ok(leaveRequests.snapshotBaseQuota);
  assert.ok(leaveRequests.snapshotCollectiveLeave);
  assert.ok(leaveRequests.snapshotAvailableBefore);
  assert.ok(leaveRequests.snapshotRemainingAfter);

  // leaveApprovals
  assert.ok(leaveApprovals.id);
  assert.ok(leaveApprovals.leaveRequestId);
  assert.ok(leaveApprovals.stage);
  assert.ok(leaveApprovals.approverEmployeeId);
  assert.ok(leaveApprovals.approverName);
  assert.ok(leaveApprovals.status);
  assert.ok(leaveApprovals.signatureDate);
});
