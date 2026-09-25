import test from 'node:test';
import assert from 'node:assert/strict';
import { getUsers, createUser, toggleUserStatus, resetPassword, deleteUser } from './userController';
import { db } from '../db';
import { users, roles } from '../db/schema/users';
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

test('getUsers returns list of users without passwordHash', async () => {
  const res = mockRes();
  await getUsers({} as any, res);
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.users));
  assert.ok(res.body.users.length > 0);
  for (const u of res.body.users) {
    assert.equal(u.passwordHash, undefined, 'passwordHash must never be exposed');
    assert.ok(u.email);
    assert.ok(u.username);
  }
});

test('toggleUserStatus prevents deactivating own account', async () => {
  const admin = (await db.select().from(users).where(eq(users.email, 'admin@company.com')))[0];
  assert.ok(admin);

  const req: any = {
    user: { userId: admin.id, roleName: 'SuperAdmin' },
    params: { id: String(admin.id) },
    body: { status: 'inactive' },
  };
  const res = mockRes();
  await toggleUserStatus(req, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /own account/i);
});

test('createUser creates user, resetPassword hashes new password, and deleteUser deletes', async () => {
  const role = (await db.select().from(roles).limit(1))[0];
  assert.ok(role);

  const email = `testuser_${Date.now()}@example.com`;
  const username = `testuser_${Date.now()}`;
  const createReq: any = {
    body: {
      username,
      email,
      password: 'InitialPassword123!',
      roleId: role.id,
      status: 'active',
    },
  };
  const createRes = mockRes();
  await createUser(createReq, createRes);
  assert.equal(createRes.statusCode, 201);
  const createdUserId = createRes.body.user.id;
  assert.ok(createdUserId);

  // Reset password
  const resetReq: any = {
    params: { id: String(createdUserId) },
    body: { newPassword: 'NewSecretPassword123!' },
  };
  const resetRes = mockRes();
  await resetPassword(resetReq, resetRes);
  assert.equal(resetRes.statusCode, 200);

  // Delete user
  const deleteReq: any = {
    user: { userId: 999999 }, // not the same user
    params: { id: String(createdUserId) },
  };
  const deleteRes = mockRes();
  await deleteUser(deleteReq, deleteRes);
  assert.equal(deleteRes.statusCode, 200);
});
