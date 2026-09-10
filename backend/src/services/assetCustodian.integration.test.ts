import assert from 'node:assert/strict';
import test from 'node:test';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db, closeDatabase } from '../db';
import { assetCustodians } from '../db/schema/assetCustodians';
import { assets, assetCategories } from '../db/schema/assets';
import { employees } from '../db/schema/employees';
import { auditLogs } from '../db/schema/system';
import { createTestOperator } from '../testing/testOperator';
import { CustodianError } from '../domain/assetCustodian';
import { createManualCustodian, lockCustodianDirectory, mergeCustodians, requireActiveCustodian, resolveCustodianSelection, resolveEmployeeCustodian, updateCustodian } from './assetCustodian';
test('custodian transactions serialize selection with deactivation and merge, canonicalize employees, and roll back failed work', async () => {
  const suffix = `${process.pid}${Date.now()}`;
  const operator = await createTestOperator();
  const ids: number[] = [];
  let employeeId: number | undefined;
  let assetId: number | undefined;
  let categoryId: number | undefined;
  try {
    const [employee] = await db.insert(employees).values({ employeeCode: `R${suffix}`, fullName: `Race employee ${suffix}`, email: `r${suffix}@example.test` }).returning();
    employeeId = employee.id;
    const resolved = await Promise.all([db.transaction(tx => resolveEmployeeCustodian(tx, employee.id, operator.userId)), db.transaction(tx => resolveEmployeeCustodian(tx, employee.id, operator.userId))]);
    ids.push(resolved[0].id);
    assert.equal(resolved[0].id, resolved[1].id);
    await assert.rejects(db.transaction(tx => resolveCustodianSelection(tx, { newCustodian: { displayName: 'Staff forbidden' } }, operator.userId, false)), (e: unknown) => e instanceof CustodianError && e.status === 403);
    await assert.rejects(db.transaction(async (tx) => { await createManualCustodian(tx, { displayName: `Rolled back ${suffix}`, duplicateAcknowledged: true }, operator.userId); throw new Error('simulate downstream asset failure'); }), /simulate downstream/);
    assert.equal((await db.select().from(assetCustodians).where(eq(assetCustodians.displayName, `Rolled back ${suffix}`))).length, 0);
    const holder = await db.transaction(tx => createManualCustodian(tx, { displayName: `Mutex holder ${suffix}`, duplicateAcknowledged: true }, operator.userId));
    ids.push(holder.id);
    const [category] = await db.insert(assetCategories).values({ name: `Mutex ${suffix}`, codePrefix: `M${suffix}`.slice(0, 20) }).returning();
    categoryId = category.id;
    const [asset] = await db.insert(assets).values({ assetCode: `M${suffix}`, name: 'Concurrency fixture', categoryId: category.id }).returning();
    assetId = asset.id;
    let selected!: () => void;
    const selectionReady = new Promise<void>(resolve => selected = resolve);
    let release!: () => void;
    const releaseSelection = new Promise<void>(resolve => release = resolve);
    const selection = db.transaction(async (tx) => {
      await lockCustodianDirectory(tx);
      await tx.select().from(assets).where(eq(assets.id, asset.id)).for('update');
      await requireActiveCustodian(tx, holder.id);
      selected();
      await releaseSelection;
      await tx.update(assets).set({ currentCustodianId: holder.id }).where(eq(assets.id, asset.id));
    });
    await selectionReady;
    let deactivationFinished = false;
    const deactivate = db.transaction(tx => updateCustodian(tx, holder.id, { recordStatus: 'INACTIVE' }, operator.userId)).then(() => { deactivationFinished = true; return null; }, err => { deactivationFinished = true; return err; });
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(deactivationFinished, false);
    release();
    await selection;
    const conflict = await deactivate;
    assert.ok(conflict instanceof CustodianError);
    assert.equal(conflict.status, 409);
    const merged = await db.transaction(tx => mergeCustodians(tx, holder.id, resolved[0].id, operator.userId));
    assert.equal(merged.recordStatus, 'MERGED');
    await assert.rejects(db.transaction(tx => requireActiveCustodian(tx, holder.id)), (e: unknown) => e instanceof CustodianError && e.status === 409);
    assert.equal((await db.select().from(assets).where(eq(assets.id, asset.id)))[0].currentCustodianId, resolved[0].id);
    // The database is the final arbiter even if a writer bypasses the service lock.
    await assert.rejects(db.transaction(tx => tx.insert(assetCustodians).values({ displayName: 'Duplicate HR', normalizedName: 'duplicate hr', employeeId: employee.id, verificationStatus: 'VERIFIED' })), (err: any) => err.cause?.code === '23505');
  }
  finally {
    if (assetId)
      await db.delete(assets).where(eq(assets.id, assetId));
    if (categoryId)
      await db.delete(assetCategories).where(eq(assetCategories.id, categoryId));
    if (ids.length) {
      await db.delete(auditLogs).where(and(eq(auditLogs.entity, 'ASSET_CUSTODIAN'), inArray(auditLogs.entityId, ids)));
      await db.delete(assetCustodians).where(inArray(assetCustodians.id, ids));
    }
    if (employeeId)
      await db.delete(employees).where(eq(employees.id, employeeId));
    await operator.cleanup();
    await closeDatabase();
  }
});
