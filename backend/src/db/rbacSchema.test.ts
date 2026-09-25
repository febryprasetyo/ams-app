import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from './index';
import { permissions, roles, rolePermissions } from './schema/users';
import { eq } from 'drizzle-orm';

test('RBAC schema has permissions catalog and seeded system roles', async () => {
  const allRoles = await db.select().from(roles);
  assert.ok(allRoles.length > 0, 'Roles should exist');
  const superAdmin = allRoles.find((r) => r.code === 'super_admin');
  assert.ok(superAdmin, 'SuperAdmin role should exist');
  assert.equal(superAdmin?.isSystem, true, 'SuperAdmin must have isSystem = true');

  const allPerms = await db.select().from(permissions);
  assert.ok(allPerms.length >= 20, 'Should have at least 20 seeded catalog permissions');
  assert.ok(allPerms.some((p) => p.code === 'assets.view'));
  assert.ok(allPerms.some((p) => p.code === 'access.roles.manage'));
});
