import test from 'node:test';
import assert from 'node:assert/strict';
import { checkUserPermission } from './permissions.js';

test('checkUserPermission allows SuperAdmin regardless of permissions array', () => {
  const user = { roleName: 'SuperAdmin', permissions: [] };
  assert.equal(checkUserPermission(user, 'assets.delete'), true);

  const userLower = { roleName: 'super_admin', permissions: [] };
  assert.equal(checkUserPermission(userLower, 'assets.delete'), true);
});

test('checkUserPermission checks permission array for regular user', () => {
  const user = { roleName: 'ITStaff', permissions: ['assets.view', 'tickets.create'] };
  assert.equal(checkUserPermission(user, 'assets.view'), true);
  assert.equal(checkUserPermission(user, 'assets.delete'), false);
});

test('checkUserPermission returns false if user is null or undefined', () => {
  assert.equal(checkUserPermission(null, 'assets.view'), false);
  assert.equal(checkUserPermission(undefined, 'assets.view'), false);
});
