import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, count } from 'drizzle-orm';
import { createHrAuditTestDatabase } from '../testing/hrAuditDatabase';
import { runMigrations } from '../db/migrate';
import path from 'node:path';
import { hrAuditEvents, hrMutationReceipts } from '../db/schema/hrAudit';
import { users, roles } from '../db/schema/users';
import { resolveAuditContext, appendHrAudit } from './hrAudit';
import { runHrMutation } from './hrMutation';
import { hashRequestPayload, type AuditContext } from '../domain/hrAudit';

const migrations = path.resolve(__dirname, '../../drizzle');

test('HR Mutation & Audit Transactional Integration Tests', async (t) => {
  const fixture = await createHrAuditTestDatabase();
  t.after(async () => { await fixture.cleanup(); });
  const { owner, runtime, runtimeRole, ownerUrl } = fixture;

  await runMigrations(ownerUrl, migrations, runtimeRole);

  // Grant runtime role table permissions for business tables used in tests
  await owner.query(`GRANT ALL ON ALL TABLES IN SCHEMA public TO "${runtimeRole}"`);
  await owner.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "${runtimeRole}"`);
  // Re-revoke unsafe privileges on audit tables so runtime cannot UPDATE/DELETE/TRUNCATE audit
  await owner.query(`REVOKE UPDATE, DELETE, TRUNCATE ON hr_audit_events, hr_audit_targets, hr_mutation_receipts FROM "${runtimeRole}"`);

  // Setup test user and role
  const adminDb = drizzle(owner);
  const [role] = await adminDb.insert(roles).values({
    name: 'HR Attendance',
    code: 'hr_attendance',
    isSystem: true,
  }).returning();

  const [user] = await adminDb.insert(users).values({
    username: 'hrauthenticated',
    email: 'hrstaff@company.local',
    passwordHash: 'dummy_hash',
    roleId: role.id,
  }).returning();

  const db = drizzle(runtime);

  await t.test('actor_comes_from_authenticated_account resolves from DB and rejects unauthenticated', async () => {
    // Valid authenticated request
    const mockReq = {
      user: { userId: user.id, email: user.email, roleId: role.id, roleName: 'hr_attendance' },
      headers: {},
      body: {},
    } as any;

    const ctx = await resolveAuditContext(mockReq, db as any);
    assert.equal(ctx.actor.id, String(user.id));
    assert.equal(ctx.actor.username, 'hrauthenticated');
    assert.equal(ctx.actor.name, 'hrauthenticated');
    assert.ok(ctx.operationId);

    // Unauthenticated request
    await assert.rejects(
      () => resolveAuditContext({ headers: {}, body: {} } as any, db as any),
      /Authentication required/
    );

    // Non-existent user
    await assert.rejects(
      () => resolveAuditContext({ user: { userId: 9999999 } } as any, db as any),
      /Authenticated account not found/
    );
  });

  await t.test('retry_returns_original_response and executes work exactly once', async () => {
    const opId = randomUUID();
    const ctx: AuditContext = {
      actor: { id: String(user.id), username: user.username, name: 'HR Staff Official' },
      operationId: opId,
    };
    const payload = { action: 'test_action', date: '2026-10-19' };
    const requestHash = hashRequestPayload(payload);

    let executionCount = 0;
    const work = async (tx: any) => {
      executionCount++;
      await appendHrAudit(tx, {
        operationId: opId,
        actor: ctx.actor,
        action: 'CREATE',
        entityType: 'department',
        entityId: '100',
        entityLabel: 'Test Dept',
        outcome: 'SUCCESS',
        summary: 'Department created in retry test',
        metadata: {},
        targets: [],
      });
      return { success: true, count: executionCount };
    };

    // First call
    const res1 = await runHrMutation(ctx, requestHash, work, db as any);
    assert.deepEqual(res1, { success: true, count: 1 });
    assert.equal(executionCount, 1);

    // Second call (retry with same operationId & requestHash)
    const res2 = await runHrMutation(ctx, requestHash, work, db as any);
    assert.deepEqual(res2, { success: true, count: 1 }); // must return cached response
    assert.equal(executionCount, 1); // work must NOT execute again

    // Verify DB count
    const [eventCount] = await db
      .select({ count: count() })
      .from(hrAuditEvents)
      .where(eq(hrAuditEvents.operationId, opId));
    assert.equal(Number(eventCount.count), 1);
  });

  await t.test('parallel_retry_creates_one_event across concurrent requests', async () => {
    const opId = randomUUID();
    const ctx: AuditContext = {
      actor: { id: String(user.id), username: user.username, name: 'HR Staff Official' },
      operationId: opId,
    };
    const payload = { action: 'concurrent_action', key: 'unique' };
    const requestHash = hashRequestPayload(payload);

    let executionCount = 0;
    const work = async (tx: any) => {
      executionCount++;
      await new Promise((r) => setTimeout(r, 50)); // simulate work delay
      await appendHrAudit(tx, {
        operationId: opId,
        actor: ctx.actor,
        action: 'UPDATE',
        entityType: 'department',
        entityId: '101',
        entityLabel: 'Concurrent Dept',
        outcome: 'SUCCESS',
        summary: 'Department updated in concurrent test',
        metadata: {},
        targets: [],
      });
      return { success: true, parallel: true };
    };

    const [resA, resB] = await Promise.all([
      runHrMutation(ctx, requestHash, work, db as any),
      runHrMutation(ctx, requestHash, work, db as any),
    ]);

    assert.deepEqual(resA, { success: true, parallel: true });
    assert.deepEqual(resB, { success: true, parallel: true });
    assert.equal(executionCount, 1);

    const [eventCount] = await db
      .select({ count: count() })
      .from(hrAuditEvents)
      .where(eq(hrAuditEvents.operationId, opId));
    assert.equal(Number(eventCount.count), 1);
  });

  await t.test('changed_payload_returns_409 when operationId is reused with different payload', async () => {
    const opId = randomUUID();
    const ctx: AuditContext = {
      actor: { id: String(user.id), username: user.username, name: 'HR Staff Official' },
      operationId: opId,
    };
    const payloadA = { action: 'initial' };
    const payloadB = { action: 'altered_payload' };

    await runHrMutation(ctx, hashRequestPayload(payloadA), async (tx) => {
      await appendHrAudit(tx, {
        operationId: opId,
        actor: ctx.actor,
        action: 'CREATE',
        entityType: 'department',
        entityId: '102',
        entityLabel: 'Conflict Dept',
        outcome: 'SUCCESS',
        summary: 'Conflict test',
        metadata: {},
        targets: [],
      });
      return { ok: true };
    }, db as any);

    // Call with different hash
    await assert.rejects(
      () => runHrMutation(ctx, hashRequestPayload(payloadB), async () => ({ ok: true }), db as any),
      (err: any) => {
        assert.equal(err.statusCode || err.status, 409);
        return true;
      }
    );
  });

  await t.test('audit_failure_rolls_back_business_write in transaction', async () => {
    const opId = randomUUID();
    const ctx: AuditContext = {
      actor: { id: String(user.id), username: user.username, name: 'HR Staff Official' },
      operationId: opId,
    };

    let businessCreated = false;

    await assert.rejects(async () => {
      await runHrMutation(ctx, 'some_hash', async (tx) => {
        // Business write
        await (tx as any).insert(roles).values({
          name: 'Should Be Rolled Back',
          code: 'rollback_role',
          isSystem: false,
        });
        businessCreated = true;

        // Deliberate audit failure (invalid action violating check constraint)
        await (tx as any).insert(hrAuditEvents).values({
          operationId: opId,
          actorId: BigInt(user.id),
          actorUsername: user.username,
          actorName: 'HR Staff Official',
          action: 'INVALID_ACTION' as any,
          entityType: 'role',
          entityLabel: 'Role',
          outcome: 'SUCCESS',
          summary: 'Should fail',
        });
      }, db as any);
    });

    assert.equal(businessCreated, true);

    // Verify role was NOT saved in database
    const [foundRole] = await db.select().from(roles).where(eq(roles.code, 'rollback_role'));
    assert.equal(foundRole, undefined);

    // Verify receipt was NOT saved
    const [receipt] = await db
      .select()
      .from(hrMutationReceipts)
      .where(eq(hrMutationReceipts.operationId, opId));
    assert.equal(receipt, undefined);
  });
});
