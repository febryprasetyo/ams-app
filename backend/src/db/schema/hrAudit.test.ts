import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, getTableName } from 'drizzle-orm';
import { hrAuditEvents, hrAuditTargets, hrMutationReceipts } from './hrAudit';
import { createHrAuditTestDatabase } from '../../testing/hrAuditDatabase';
import { runMigrations } from '../migrate';
import { DEFAULT_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '../../domain/rbac';

const migrations = path.resolve(__dirname, '../../../drizzle');
const pgError = (code: string) => (error: unknown) => {
  const cause = error as { code?: string; cause?: { code?: string } };
  assert.equal(cause.code ?? cause.cause?.code, code);
  return true;
};

test('HR audit storage enforces its contract on a disposable PostgreSQL database', async (t) => {
  const fixture = await createHrAuditTestDatabase();
  t.after(() => fixture.cleanup());
  const { owner, runtime, runtimeRole, ownerUrl } = fixture;
  const previous = await mkdtemp(path.join(tmpdir(), 'hr-audit-migrations-'));
  t.after(() => rm(previous, { recursive: true, force: true }));
  await cp(migrations, previous, { recursive: true });
  const journal = JSON.parse(await readFile(path.join(previous, 'meta/_journal.json'), 'utf8'));
  journal.entries = journal.entries.filter((entry: { idx: number }) => entry.idx < 15);
  await writeFile(path.join(previous, 'meta/_journal.json'), JSON.stringify(journal));
  await runMigrations(ownerUrl, previous);
  await owner.query(`INSERT INTO roles (code,name,is_system) VALUES
    ('hr_attendance','HR',true), ('super_admin','SuperAdmin',true),
    ('management','Management',true), ('custom_hr','Custom HR',false)`);
  await owner.query(`INSERT INTO permissions (code,name,module) VALUES ('custom.keep','Keep','custom')`);
  await owner.query(`INSERT INTO role_permissions (role_id,permission_id)
    SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='custom_hr'`);

  await t.test('migration refuses an owner runtime role and rolls back new tables', async () => {
    const { rows: [role] } = await owner.query('SELECT current_user AS name');
    await assert.rejects(runMigrations(ownerUrl, migrations, role.name), /runtime role/i);
    const { rows: [result] } = await owner.query("SELECT to_regclass('public.hr_audit_events') AS table_name");
    assert.equal(result.table_name, null);
  });
  await runMigrations(ownerUrl, migrations, runtimeRole);
  await t.test('truncate is rejected even before any audit rows exist', async () => {
    await assert.rejects(owner.query('TRUNCATE hr_audit_targets'), pgError('55000'));
    await assert.rejects(owner.query('TRUNCATE hr_audit_events CASCADE'), pgError('55000'));
  });
  const db = drizzle(runtime);
  const event = () => ({
    operationId: randomUUID(), actorId: 9007199254740993n,
    actorUsername: 'operator', actorName: 'Nama Pelaku Lama', action: 'CREATE' as const,
    entityType: 'employee', entityId: '42', entityLabel: 'EMP-42',
    outcome: 'SUCCESS' as const, summary: 'Karyawan dibuat',
  });
  const [saved] = await db.insert(hrAuditEvents).values(event()).returning();
  const [target] = await db.insert(hrAuditTargets).values({
    eventId: saved.id, entityType: 'employee', entityId: '42', entityLabel: 'EMP-42',
    before: null, after: { employeeCode: 'EMP-42' }, changedFields: ['employeeCode'],
  }).returning();

  await t.test('schema round-trips bigint, server time, JSON snapshots and receipt uniqueness', async () => {
    assert.equal(getTableName(hrAuditEvents), 'hr_audit_events');
    assert.equal(getTableName(hrAuditTargets), 'hr_audit_targets');
    assert.equal(getTableName(hrMutationReceipts), 'hr_mutation_receipts');
    assert.equal(saved.actorId, 9007199254740993n);
    assert.equal(typeof saved.id, 'bigint');
    assert.ok(saved.occurredAt instanceof Date);
    assert.equal(saved.schemaVersion, 1);
    assert.deepEqual(saved.metadata, {});
    assert.deepEqual(target.after, { employeeCode: 'EMP-42' });
    const receipt = { actorId: saved.actorId, operationId: saved.operationId, requestHash: 'a'.repeat(64), response: { eventId: String(saved.id) } };
    await db.insert(hrMutationReceipts).values(receipt);
    await assert.rejects(db.insert(hrMutationReceipts).values(receipt), pgError('23505'));
    await db.insert(hrMutationReceipts).values({ ...receipt, actorId: 2n });
  });

  await t.test('runtime has only select/insert and cannot become the table owner', async () => {
    const { rows: [row] } = await runtime.query(`SELECT current_user AS name,
      pg_get_userbyid(c.relowner) AS owner, r.rolsuper, r.rolcreaterole,
      pg_has_role(current_user,c.relowner,'MEMBER') AS owner_member
      FROM pg_class c JOIN pg_roles r ON r.rolname=current_user
      WHERE c.oid='hr_audit_events'::regclass`);
    assert.equal(row.name, runtimeRole);
    assert.notEqual(row.owner, runtimeRole);
    assert.equal(row.rolsuper, false);
    assert.equal(row.rolcreaterole, false);
    assert.equal(row.owner_member, false);
    for (const table of ['hr_audit_events', 'hr_audit_targets']) {
      for (const privilege of ['UPDATE','DELETE','TRUNCATE','TRIGGER','REFERENCES']) {
        const { rows: [permissions] } = await runtime.query('SELECT has_table_privilege(current_user,$1,$2) AS allowed', [table, privilege]);
        assert.equal(permissions.allowed, false, `${table}: ${privilege}`);
      }
      await assert.rejects(runtime.query(`UPDATE ${table} SET entity_label='changed'`), pgError('42501'));
      await assert.rejects(runtime.query(`DELETE FROM ${table}`), pgError('42501'));
      await assert.rejects(runtime.query(`TRUNCATE ${table} CASCADE`), pgError('42501'));
      await assert.rejects(runtime.query(`ALTER TABLE ${table} DISABLE TRIGGER ALL`), pgError('42501'));
    }
  });

  await t.test('triggers reject mutation even for the owner', async () => {
    for (const table of ['hr_audit_events', 'hr_audit_targets']) {
      for (const statement of [`UPDATE ${table} SET entity_label='changed'`, `DELETE FROM ${table}`, `TRUNCATE ${table} CASCADE`]) {
        await assert.rejects(owner.query(statement), pgError('55000'));
      }
    }
    const { rows: [row] } = await runtime.query('SELECT count(*)::int AS count FROM hr_audit_targets');
    assert.equal(row.count, 1);
  });

  await t.test('source deletion and renames do not alter actor or object snapshots', async () => {
    const { rows: [employee] } = await owner.query("INSERT INTO employees (employee_number,full_name) VALUES ('AUDIT-TEST','Nama Awal') RETURNING id");
    const { rows: [user] } = await owner.query("INSERT INTO users (username,email,password_hash,employee_id) VALUES ('audit-test','audit@example.test','not-a-login',$1) RETURNING id", [employee.id]);
    const [record] = await db.insert(hrAuditEvents).values({ ...event(), actorId: BigInt(user.id), entityId: employee.id }).returning();
    await db.insert(hrAuditTargets).values({ eventId: record.id, entityType: 'employee', entityId: employee.id, entityLabel: 'Nama Awal', before: { fullName: 'Nama Awal' }, changedFields: ['fullName'] });
    await owner.query("UPDATE users SET username='nama-baru' WHERE id=$1", [user.id]);
    await owner.query("UPDATE employees SET full_name='Nama Baru' WHERE id=$1", [employee.id]);
    await owner.query('DELETE FROM users WHERE id=$1', [user.id]);
    await owner.query('DELETE FROM employees WHERE id=$1', [employee.id]);
    const [retained] = await db.select().from(hrAuditEvents).where(eq(hrAuditEvents.id, record.id));
    assert.equal(retained.actorName, 'Nama Pelaku Lama');
    assert.equal(retained.actorId, BigInt(user.id));
    const [retainedTarget] = await db.select().from(hrAuditTargets).where(eq(hrAuditTargets.eventId, record.id));
    assert.deepEqual(retainedTarget.before, { fullName: 'Nama Awal' });
  });

  await t.test('rollback removes event, target and receipt together', async () => {
    const input = event();
    await assert.rejects(db.transaction(async (tx) => {
      const [record] = await tx.insert(hrAuditEvents).values(input).returning();
      await tx.insert(hrAuditTargets).values({ eventId: record.id, entityType: 'employee', entityId: '42', entityLabel: 'EMP-42', changedFields: [] });
      await tx.insert(hrMutationReceipts).values({ actorId: input.actorId, operationId: input.operationId, requestHash: 'b'.repeat(64), response: {} });
      throw new Error('business failure');
    }), /business failure/);
    assert.equal((await db.select().from(hrAuditEvents).where(eq(hrAuditEvents.operationId,input.operationId))).length, 0);
    assert.equal((await db.select().from(hrMutationReceipts).where(eq(hrMutationReceipts.operationId,input.operationId))).length, 0);
    const { rows: [orphans] } = await owner.query('SELECT count(*)::int AS count FROM hr_audit_targets t LEFT JOIN hr_audit_events e ON e.id=t.event_id WHERE e.id IS NULL');
    assert.equal(orphans.count, 0);
  });

  await t.test('database rejects invalid action, outcome, snapshot shape and orphan target', async () => {
    await assert.rejects(runtime.query(`INSERT INTO hr_audit_events (operation_id,actor_id,actor_username,actor_name,action,entity_type,entity_label,outcome,summary) VALUES ($1,1,'u','n','LOGIN','employee','e','SUCCESS','s')`, [randomUUID()]), pgError('23514'));
    await assert.rejects(runtime.query(`INSERT INTO hr_audit_events (operation_id,actor_id,actor_username,actor_name,action,entity_type,entity_label,outcome,summary) VALUES ($1,1,'u','n','CREATE','employee','e','UNKNOWN','s')`, [randomUUID()]), pgError('23514'));
    await assert.rejects(runtime.query(`INSERT INTO hr_audit_targets (event_id,entity_type,entity_id,entity_label,changed_fields) VALUES ($1,'employee','1','e','{}')`, [saved.id.toString()]), pgError('23514'));
    await assert.rejects(db.insert(hrAuditTargets).values({ eventId: 999999n, entityType: 'employee', entityId: '1', entityLabel: 'e', changedFields: [] }), pgError('23503'));
  });

  await t.test('permission migration is idempotent and preserves custom role grants', async () => {
    await runMigrations(ownerUrl, migrations, runtimeRole);
    const sql = await readFile(path.join(migrations, '0015_hr_activity_audit.sql'), 'utf8');
    const permissionSql = sql.slice(sql.indexOf('-- HR audit permission catalog'));
    assert.ok(permissionSql.startsWith('-- HR audit permission catalog'));
    await owner.query(permissionSql);
    await owner.query(permissionSql);
    const { rows } = await owner.query(`SELECT r.code FROM roles r JOIN role_permissions rp ON rp.role_id=r.id JOIN permissions p ON p.id=rp.permission_id WHERE p.code='hr.audit.view' ORDER BY r.code`);
    assert.deepEqual(rows.map((row) => row.code), ['hr_attendance']);
    const { rows: [custom] } = await owner.query(`SELECT count(*)::int AS count FROM role_permissions rp JOIN roles r ON rp.role_id=r.id JOIN permissions p ON rp.permission_id=p.id WHERE r.code='custom_hr' AND p.code='custom.keep'`);
    assert.equal(custom.count, 1);
    assert.equal(DEFAULT_PERMISSIONS.filter((p) => p.code === 'hr.audit.view').length, 1);
    assert.ok(DEFAULT_ROLE_PERMISSIONS.hr_attendance.includes('hr.audit.view'));
    assert.ok(DEFAULT_ROLE_PERMISSIONS.super_admin.includes('*'));
    assert.ok(!DEFAULT_ROLE_PERMISSIONS.management.includes('hr.audit.view'));
  });
});
