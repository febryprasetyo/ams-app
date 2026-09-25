import test from 'node:test';
import assert from 'node:assert/strict';
import { requirePermission, getUserPermissions, AuthenticatedRequest } from './auth';
import { db } from '../db';
import { roles, permissions, rolePermissions } from '../db/schema/users';
import { eq } from 'drizzle-orm';

test('requirePermission allows SuperAdmin regardless of explicit permissions', async () => {
  const middleware = requirePermission('assets.delete');
  let nextCalled = false;
  const req: any = {
    user: { userId: 1, roleName: 'SuperAdmin', roleId: 1, email: 'admin@company.com' },
  };
  const res: any = {
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: any) {
      this.body = body;
      return this;
    },
  };
  await middleware(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true, 'SuperAdmin should bypass permission check');
});

test('requirePermission returns 401 if unauthenticated', async () => {
  const middleware = requirePermission('assets.view');
  let nextCalled = false;
  const req: any = {};
  let statusCode = 0;
  let responseBody: any = null;
  const res: any = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: any) {
      responseBody = body;
      return this;
    },
  };
  await middleware(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(statusCode, 401);
});

test('requirePermission returns 403 when user lacks permission', async () => {
  const middleware = requirePermission('access.roles.manage');
  let nextCalled = false;
  let statusCode = 0;
  let body: any = null;
  const req: any = {
    user: { userId: 999999, roleName: 'ITStaff', roleId: 999999, email: 'staff@company.com' },
  };
  const res: any = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(b: any) {
      body = b;
      return this;
    },
  };
  await middleware(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(statusCode, 403);
  assert.match(body.error, /Missing permission/);
});

test('getUserPermissions returns all permissions for SuperAdmin', async () => {
  const perms = await getUserPermissions(undefined, 'SuperAdmin');
  assert.ok(perms.length >= 20);
  assert.ok(perms.includes('assets.view'));
});
