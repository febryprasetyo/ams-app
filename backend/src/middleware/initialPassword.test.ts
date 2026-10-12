import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticateToken } from './auth';
import { generateToken } from '../utils/jwt';

function invoke(path: string, method: string, mustChangePassword: boolean) {
  let nextCalled = false;
  let status = 0;
  const token = generateToken({ userId: 1, email: 'admin@company.com', roleId: 1, roleName: 'SuperAdmin', mustChangePassword });
  const req: any = { headers: { authorization: `Bearer ${token}` }, originalUrl: path, method };
  const res: any = { status(code: number) { status = code; return this; }, json() { return this; } };
  authenticateToken(req, res, () => { nextCalled = true; });
  return { nextCalled, status };
}

test('initial administrator password must be changed before protected API access', () => {
  assert.deepEqual(invoke('/api/v1/employees', 'GET', true), { nextCalled: false, status: 403 });
});

test('initial password token can fetch its account and change its password', () => {
  assert.equal(invoke('/api/v1/auth/me', 'GET', true).nextCalled, true);
  assert.equal(invoke('/api/v1/auth/change-password', 'POST', true).nextCalled, true);
});

test('regular password token can access protected APIs', () => {
  assert.equal(invoke('/api/v1/employees', 'GET', false).nextCalled, true);
});
