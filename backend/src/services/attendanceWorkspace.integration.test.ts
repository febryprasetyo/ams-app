import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import path from "node:path";
import { createHrAuditTestDatabase } from "../testing/hrAuditDatabase";
import { runMigrations } from "../db/migrate";
import { hrAuditEvents, hrAuditTargets } from "../db/schema/hrAudit";
import { users, roles } from "../db/schema/users";
import { departments } from "../db/schema/master";
import { employees } from "../db/schema/employees";
import {
  attendanceSources,
  attendanceShifts,
  attendanceShiftAssignments,
  attendanceLocks,
  attendanceGrants,
  attendanceIdentities,
} from "../db/schema/attendanceWorkspace";
import { attendanceBatches, attendanceRecords } from "../db/schema/attendance";
import {
  loadAttendanceWorkspace,
  executeAttendanceCommand,
} from "./attendanceWorkspace";
import type { AuditContext } from "../domain/hrAudit";
import type { ServerAttendanceCommand } from "../domain/attendanceCommands";

const migrations = path.resolve(__dirname, "../../drizzle");

test("Attendance Workspace & Commands Integration Tests", async (t) => {
  const fixture = await createHrAuditTestDatabase();
  t.after(async () => {
    await fixture.cleanup();
  });
  const { owner, runtime, runtimeRole, ownerUrl } = fixture;

  await runMigrations(ownerUrl, migrations, runtimeRole);

  // Grant runtime role permissions for test tables
  await owner.query(`GRANT ALL ON ALL TABLES IN SCHEMA public TO "${runtimeRole}"`);
  await owner.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "${runtimeRole}"`);
  await owner.query(`REVOKE UPDATE, DELETE, TRUNCATE ON hr_audit_events, hr_audit_targets, hr_mutation_receipts FROM "${runtimeRole}"`);

  const adminDb = drizzle(owner);
  const db = drizzle(runtime);

  const [role] = await adminDb
    .insert(roles)
    .values({
      name: "HR Admin",
      code: "hr_admin",
      isSystem: true,
    })
    .returning();

  const [user] = await adminDb
    .insert(users)
    .values({
      username: "hradmin_ws",
      email: "hradmin_ws@company.local",
      passwordHash: "dummy",
      roleId: role.id,
    })
    .returning();

  const [dept] = await adminDb
    .insert(departments)
    .values({
      name: "Engineering",
      code: "ENG",
    })
    .returning();

  const [emp] = await adminDb
    .insert(employees)
    .values({
      employeeCode: "EMP-WS-01",
      fullName: "Alice Engineer",
      email: "alice@company.local",
      departmentId: dept.id,
      status: "Active",
    })
    .returning();

  const context: AuditContext = {
    actor: {
      id: String(user.id),
      username: user.username,
      name: "Alice HR Admin",
    },
    operationId: randomUUID(),
  };

  await t.test("empty database returns empty collections without dummy/mock rows", async () => {
    const ws = await db.transaction(async (tx) => {
      return await loadAttendanceWorkspace(tx, context);
    });

    assert.equal(ws.schemaVersion, 1);
    assert.equal(ws.records.length, 0);
    assert.equal(ws.batches.length, 0);
    assert.equal(ws.locks.length, 0);
    assert.equal(ws.shifts.length, 0);
    assert.equal(ws.shiftAssignments.length, 0);
    assert.equal(ws.identities.length, 0);
    assert.equal(ws.sources.length, 0);
    assert.equal(ws.audit.length, 0);
    assert.equal(ws.employees.length, 1);
    assert.equal(ws.departments.length, 1);
  });

  await t.test("round-trip source, shift, assignment, identity, lock, grant commands and audit capture", async () => {
    // 1. Source
    const resSource = await db.transaction(async (tx) => {
      return await executeAttendanceCommand(tx, { ...context, operationId: randomUUID() }, {
        type: "source",
        action: "create",
        source: { id: 0, code: "FINGER_01", name: "Mesin Fingerprint Utama", isActive: true },
      });
    });
    assert.ok(resSource.eventId);
    assert.equal(resSource.data.sources.length, 1);
    const sourceId = resSource.data.sources[0].id;

    // 2. Identity
    const resId = await db.transaction(async (tx) => {
      return await executeAttendanceCommand(tx, { ...context, operationId: randomUUID() }, {
        type: "identity",
        value: { id: 0, sourceId, externalNoId: "1001", employeeId: emp.id },
      });
    });
    assert.ok(resId.eventId);
    assert.equal(resId.data.identities.length, 1);

    // 3. Shift
    const resShift = await db.transaction(async (tx) => {
      return await executeAttendanceCommand(tx, { ...context, operationId: randomUUID() }, {
        type: "shift",
        action: "create",
        shift: {
          id: 0,
          code: "OFFICE_REG",
          name: "Office Reguler",
          scheduleIn: "08:30",
          scheduleOut: "17:30",
          workDays: 5,
          isDefault: true,
          isActive: true,
        },
      });
    });
    assert.ok(resShift.eventId);
    const shiftId = resShift.data.shifts[0].id;

    // 4. Shift Assignment
    const resAssign = await db.transaction(async (tx) => {
      return await executeAttendanceCommand(tx, { ...context, operationId: randomUUID() }, {
        type: "assign_shift",
        assignment: { id: 0, shiftId, employeeId: emp.id },
      });
    });
    assert.ok(resAssign.eventId);
    assert.equal(resAssign.data.shiftAssignments.length, 1);

    // 5. Lock
    const resLock = await db.transaction(async (tx) => {
      return await executeAttendanceCommand(tx, { ...context, operationId: randomUUID() }, {
        type: "lock",
        workDate: "2026-10-15",
        locked: true,
        reason: "Tutup periode payroll",
      });
    });
    assert.ok(resLock.eventId);
    assert.equal(resLock.data.locks.length, 1);

    // 6. Grant
    const resGrant = await db.transaction(async (tx) => {
      return await executeAttendanceCommand(tx, { ...context, operationId: randomUUID() }, {
        type: "grant",
        value: { id: 0, principalKey: "group:hr_payroll", displayName: "HR Payroll Group", role: "HR_ADMIN", isActive: true },
        action: "save",
      });
    });
    assert.ok(resGrant.eventId);
    assert.equal(resGrant.data.grants.length, 1);
  });

  await t.test("lock prevents record correction on locked date", async () => {
    // Insert an attendance record on locked date 2026-10-15 directly
    const [rec] = await adminDb
      .insert(attendanceRecords)
      .values({
        employeeId: emp.id,
        workDate: "2026-10-15",
        scanIn: "08:30",
        scanOut: "17:30",
        attendanceStatus: "PRESENT",
        revision: 1,
      })
      .returning();

    await assert.rejects(
      async () => {
        await db.transaction(async (tx) => {
          return await executeAttendanceCommand(tx, { ...context, operationId: randomUUID() }, {
            type: "correct",
            recordId: rec.id,
            expectedRevision: 1,
            values: { scanIn: "08:45", scanOut: "17:30", lateMinutes: 15, overtimeMinutes: 0, attendanceStatus: "PRESENT" },
            reason: "Koreksi jam masuk",
          });
        });
      },
      /dikunci/i
    );
  });

  await t.test("record correction succeeds when date is unlocked and tracks revision and audit", async () => {
    // Unlock date
    await db.transaction(async (tx) => {
      return await executeAttendanceCommand(tx, { ...context, operationId: randomUUID() }, {
        type: "lock",
        workDate: "2026-10-15",
        locked: false,
        reason: "Buka kunci untuk koreksi",
      });
    });

    const [rec] = await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.employeeId, emp.id));

    // Stale revision test (expectedRevision: 99 -> error)
    await assert.rejects(
      async () => {
        await db.transaction(async (tx) => {
          return await executeAttendanceCommand(tx, { ...context, operationId: randomUUID() }, {
            type: "correct",
            recordId: rec.id,
            expectedRevision: 99,
            values: { scanIn: "08:45", scanOut: "17:30", lateMinutes: 15, overtimeMinutes: 0, attendanceStatus: "PRESENT" },
            reason: "Koreksi jam masuk",
          });
        });
      },
      /Data sudah berubah/i
    );

    // Valid revision
    const resCorrect = await db.transaction(async (tx) => {
      return await executeAttendanceCommand(tx, { ...context, operationId: randomUUID() }, {
        type: "correct",
        recordId: rec.id,
        expectedRevision: rec.revision,
        values: { scanIn: "08:45", scanOut: "17:30", lateMinutes: 15, overtimeMinutes: 0, attendanceStatus: "PRESENT" },
        reason: "Koreksi jam masuk terlambat",
      });
    });

    assert.ok(resCorrect.eventId);
    const updatedRec = resCorrect.data.records.find((r) => r.id === rec.id);
    assert.equal(updatedRec?.lateMinutes, 15);
    assert.equal(updatedRec?.revision, rec.revision + 1);

    // Verify revision record exists
    assert.equal(resCorrect.data.revisions.length, 1);
    assert.equal(resCorrect.data.revisions[0].recordId, rec.id);
  });

  await t.test("import draft, review row, stale batch revision, commit, and delete draft without losing audit", async () => {
    // 1. Import draft
    const resImport = await db.transaction(async (tx) => {
      return await executeAttendanceCommand(tx, { ...context, operationId: randomUUID() }, {
        type: "import",
        filename: "fingerprint_oct.xlsx",
        rows: [
          {
            id: 0,
            externalNoId: "1001",
            employeeId: emp.id,
            workDate: "2026-10-16",
            scanIn: "08:32",
            scanOut: "17:35",
            lateMinutes: 2,
            earlyMinutes: 0,
            overtimeMinutes: 5,
            reviewStatus: "READY",
            note: "Tervalidasi",
            attendanceStatus: "PRESENT",
          },
        ],
      });
    });

    assert.ok(resImport.eventId);
    const batch = resImport.data.batches[0];
    assert.equal(batch.status, "DRAFT");
    assert.equal(batch.revision, 1);
    assert.equal(batch.rows.length, 1);
    const rowId = batch.rows[0].id;

    // 2. Review row with stale expectedBatchRevision (expected 99 -> error)
    await assert.rejects(
      async () => {
        await db.transaction(async (tx) => {
          return await executeAttendanceCommand(
            tx,
            { ...context, operationId: randomUUID() },
            {
              type: "review",
              batchId: batch.id,
              rowId,
              employeeId: emp.id,
              skipped: false,
              reason: "Verifikasi review",
              values: { scanIn: "08:30" },
            },
            99
          );
        });
      },
      /Data batch sudah berubah/i
    );

    // 3. Review row with correct expectedBatchRevision
    const resReview = await db.transaction(async (tx) => {
      return await executeAttendanceCommand(
        tx,
        { ...context, operationId: randomUUID() },
        {
          type: "review",
          batchId: batch.id,
          rowId,
          employeeId: emp.id,
          skipped: false,
          reason: "Verifikasi review sukses",
          values: { scanIn: "08:30" },
        },
        batch.revision
      );
    });

    assert.ok(resReview.eventId);
    const reviewedBatch = resReview.data.batches.find((b) => b.id === batch.id);
    assert.equal(reviewedBatch?.revision, 2);

    // 4. Commit batch
    const resCommit = await db.transaction(async (tx) => {
      return await executeAttendanceCommand(
        tx,
        { ...context, operationId: randomUUID() },
        {
          type: "batch",
          batchId: batch.id,
          action: "commit",
        },
        reviewedBatch?.revision
      );
    });

    assert.ok(resCommit.eventId);
    const committedBatch = resCommit.data.batches.find((b) => b.id === batch.id);
    assert.equal(committedBatch?.status, "COMMITTED");

    // 5. Verify record 2026-10-16 created in attendanceRecords
    const commRec = resCommit.data.records.find((r) => r.workDate === "2026-10-16");
    assert.ok(commRec);
    assert.equal(commRec.employeeId, emp.id);

    // 6. Delete draft: create a 2nd draft then delete it
    const resDraft2 = await db.transaction(async (tx) => {
      return await executeAttendanceCommand(tx, { ...context, operationId: randomUUID() }, {
        type: "import",
        filename: "draft_to_delete.xlsx",
        rows: [],
      });
    });
    const draft2Id = resDraft2.data.batches.find((b) => b.filename === "draft_to_delete.xlsx")!.id;

    const resDelDraft = await db.transaction(async (tx) => {
      return await executeAttendanceCommand(tx, { ...context, operationId: randomUUID() }, {
        type: "batch",
        batchId: draft2Id,
        action: "delete",
      });
    });
    assert.ok(resDelDraft.eventId);

    // Verify all past audit events are still immutable and present in hr_audit_events
    const allAuditEvents = await adminDb.select().from(hrAuditEvents);
    assert.ok(allAuditEvents.length >= 8, "All HR audit events must persist after draft deletion");
  });
});
