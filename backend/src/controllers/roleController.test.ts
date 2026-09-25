import test from 'node:test';
import assert from 'node:assert/strict';
import { getRoles, getPermissionsCatalog, createRole, deleteRole, updateRolePermissions } from './roleController';
import { db } from '../db';
import { roles, permissions, users } from '../db/schema/users';
import { eq } from 'drizzle-orm';

function mockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
  };
  return res;
}

test('getPermissionsCatalog returns permissions grouped by module', async () => {
  const res = mockRes();
  await getPermissionsCatalog({} as any, res);
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.modules));
  assert.ok(res.body.modules.length > 0);
  const assetModule = res.body.modules.find((m: any) => m.module === 'assets');
  assert.ok(assetModule, 'Assets module should exist');
  assert.ok(assetModule.permissions.some((p: any) => p.code === 'assets.view'));
});

test('deleteRole prevents deleting system role', async () => {
  const superAdmin = (await db.select().from(roles).where(eq(roles.code, 'super_admin')))[0];
  assert.ok(superAdmin);

  const req: any = { params: { id: String(superAdmin.id) } };
  const res = mockRes();
  await deleteRole(req, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /system role/i);
});

test('createRole creates a custom role and updateRolePermissions updates permissions atomically', async () => {
  const code = `custom_${Date.now()}`;
  const createReq: any = {
    body: { code, name: `Test Role ${Date.now()}`, description: 'Test role description' },
  };
  const createRes = mockRes();
  await createRole(createReq, createRes);
  assert.equal(createRes.statusCode, 201);
  const createdRoleId = createRes.body.role.id;
  assert.ok(createdRoleId);

  // Update permissions
  const allPerms = await db.select().from(permissions).limit(3);
  const permIds = allPerms.map((p) => p.id);
  const updateReq: any = {
    params: { id: String(createdRoleId) },
    body: { permissionIds: permIds },
  };
  const updateRes = mockRes();
  await updateRolePermissions(updateReq, updateRes);
  assert.equal(updateRes.statusCode, 200);
  assert.equal(updateRes.body.assignedCount, permIds.length);

  // Clean up
  const deleteReq: any = { params: { id: String(createdRoleId) } };
  const deleteRes = mockRes();
  await deleteRole(deleteReq, deleteRes);
  assert.equal(deleteRes.statusCode, 200);
});
