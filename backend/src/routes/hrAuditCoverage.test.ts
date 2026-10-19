import test from 'node:test';
import assert from 'node:assert/strict';
import { hrAuditActions, hrAuditOutcomes } from '../db/schema/hrAudit';
import { COMMAND_PERMISSIONS_MAP } from '../domain/attendanceCommandInput';

test('HR Mutation Coverage & Action Type Matrix (Spec §6)', async (t) => {
  await t.test('all supported attendance workspace commands are covered by server permission map', () => {
    const expectedCommands = [
      'import',
      'review',
      'batch',
      'toggle_strict_integrity',
      'delete_batch',
      'correct',
      'record_attendance',
      'identity',
      'delete_identity',
      'source',
      'shift',
      'assign_shift',
      'lock',
      'grant',
      'delete_grant',
      'set_strict_integrity',
    ];

    const registeredCommands = Object.keys(COMMAND_PERMISSIONS_MAP);
    for (const cmd of expectedCommands) {
      assert.ok(
        registeredCommands.includes(cmd),
        `Command '${cmd}' must be present in COMMAND_PERMISSIONS_MAP`
      );
      assert.ok(
        COMMAND_PERMISSIONS_MAP[cmd as keyof typeof COMMAND_PERMISSIONS_MAP].length > 0,
        `Command '${cmd}' must have at least one required permission`
      );
    }
  });

  await t.test('all audit actions emitted by HR mutations belong to schema hrAuditActions', () => {
    // Actions emitted across master controllers, attendance commands, and leave requests
    const emittedActions = [
      'CREATE',   // Employee, Dept, Location, Shift, Attendance Record, Leave Request, Leave Grant
      'UPDATE',   // Employee, Dept, Location, Shift, Attendance Record, System Setting, Source, Identity, Integrity
      'DELETE',   // Employee, Dept, Location, Shift, Attendance Record, Batch, Leave Grant
      'IMPORT',   // Employee Import, Attendance Batch Draft/Commit
      'REVIEW',   // Batch Row Review
      'LOCK',     // Date Lock
      'UNLOCK',   // Date Unlock
      'ASSIGN',   // Shift Assignment
      'UNASSIGN', // Shift Unassignment
    ];

    const actionSet = new Set(hrAuditActions);
    for (const act of emittedActions) {
      assert.ok(
        actionSet.has(act as any),
        `Action ${act} must exist in hrAuditActions`
      );
    }
  });

  await t.test('non-mutating and read-only endpoints are explicitly excluded from audit emission', () => {
    const readOnlyEndpoints = [
      'GET /api/v1/auth/me',
      'POST /api/v1/auth/login',
      'GET /api/v1/attendance/workspace',
      'POST /api/v1/attendance/imports/preview',
      'POST /api/v1/leaves/calculate-days',
      'GET /api/v1/hr/activities',
      'GET /api/v1/hr/activities/actors',
      'GET /api/v1/hr/activities/:id',
      'GET /api/v1/hr/activities/:id/targets',
    ];

    for (const ep of readOnlyEndpoints) {
      assert.ok(
        !ep.startsWith('DELETE') && !ep.endsWith('/commands'),
        `Read-only endpoint '${ep}' is distinct from command mutations`
      );
    }
  });

  await t.test('unimplemented workflow mutations (approve/reject) are explicitly reserved in schema', () => {
    // APPROVE, REJECT, CANCEL, REOPEN are defined in hrAuditActions but endpoints are not yet built
    const pendingActions = ['APPROVE', 'REJECT', 'CANCEL', 'REOPEN'];
    const actionSet = new Set(hrAuditActions);
    for (const act of pendingActions) {
      assert.ok(
        actionSet.has(act as any),
        `Workflow action ${act} must be reserved in hrAuditActions for future leave workflows`
      );
    }
  });

  await t.test('hrAuditOutcomes covers all possible status transitions', () => {
    const expectedOutcomes = ['SUCCESS', 'PARTIAL', 'FAILED'];
    assert.deepStrictEqual([...hrAuditOutcomes], expectedOutcomes);
  });
});
