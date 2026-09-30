import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessRoute, findMatchingRouteRule, getDefaultRedirectForUser } from './routes.ts';

test('findMatchingRouteRule matches the most specific prefix first', () => {
  const equipRule = findMatchingRouteRule('/dashboard/master/equipment-types');
  assert.equal(equipRule?.prefix, '/dashboard/master/equipment-types');
  assert.equal(equipRule?.itOnly, true);

  const deptRule = findMatchingRouteRule('/dashboard/master/departments');
  assert.equal(deptRule?.prefix, '/dashboard/master/departments');
  assert.equal(deptRule?.permission, 'master.view');

  const assetRule = findMatchingRouteRule('/dashboard/assets/123');
  assert.equal(assetRule?.prefix, '/dashboard/assets');
  assert.equal(assetRule?.permission, 'assets.view');
});

test('SuperAdmin can access all routes', () => {
  const superAdmin = { roleName: 'SuperAdmin', permissions: ['*'] };
  assert.equal(canAccessRoute('/dashboard/assets', superAdmin), true);
  assert.equal(canAccessRoute('/dashboard/access', superAdmin), true);
  assert.equal(canAccessRoute('/dashboard/master/equipment-types', superAdmin), true);
  assert.equal(canAccessRoute('/dashboard/attendance', superAdmin), true);
  assert.equal(getDefaultRedirectForUser(superAdmin), '/dashboard/master/departments');
});

test('HRD / HR Attendance user is strictly restricted to HR and blocked from IT master data', () => {
  const hrdUser = {
    roleName: 'HR Attendance & Time',
    role: 'HR Attendance & Time',
    permissions: [
      'attendance.view',
      'attendance.import',
      'attendance.manage',
    ],
  };

  // ALLOWED (HR module and HR master data)
  assert.equal(canAccessRoute('/dashboard/attendance', hrdUser), true);
  assert.equal(canAccessRoute('/dashboard/attendance/imports', hrdUser), true);
  assert.equal(canAccessRoute('/dashboard/attendance/reports', hrdUser), true);
  assert.equal(canAccessRoute('/dashboard/attendance/master/departments', hrdUser), true);
  assert.equal(canAccessRoute('/dashboard/attendance/master/employees', hrdUser), true);
  assert.equal(canAccessRoute('/dashboard/attendance/master/locations', hrdUser), true);

  // BLOCKED (IT Master Data)
  assert.equal(canAccessRoute('/dashboard/master/departments', hrdUser), false);
  assert.equal(canAccessRoute('/dashboard/master/employees', hrdUser), false);
  assert.equal(canAccessRoute('/dashboard/master/locations', hrdUser), false);

  // BLOCKED (Forbidden)
  assert.equal(canAccessRoute('/dashboard/assets', hrdUser), false, 'HRD must not access IT Assets');
  assert.equal(canAccessRoute('/dashboard/assets/99', hrdUser), false, 'HRD must not access IT Asset Detail');
  assert.equal(canAccessRoute('/dashboard/hardware-audits', hrdUser), false, 'HRD must not access Hardware Audits');
  assert.equal(canAccessRoute('/dashboard/licenses', hrdUser), false, 'HRD must not access Licenses');
  assert.equal(canAccessRoute('/dashboard/tickets', hrdUser), false, 'HRD must not access IT Tickets');
  assert.equal(canAccessRoute('/dashboard/infrastructure', hrdUser), false, 'HRD must not access Server Infrastructure');
  assert.equal(canAccessRoute('/dashboard/access', hrdUser), false, 'HRD must not access User Access Control');
  assert.equal(canAccessRoute('/dashboard/master/equipment-types', hrdUser), false, 'HRD must not access IT Equipment Types');
  assert.equal(canAccessRoute('/dashboard/master/vendors', hrdUser), false, 'HRD must not access Vendors');
  assert.equal(canAccessRoute('/dashboard/master/asset-custodians', hrdUser), false, 'HRD must not access Asset Custodians');

  // Default redirect for HRD must be attendance
  assert.equal(getDefaultRedirectForUser(hrdUser), '/dashboard/attendance');
});

test('ITAdmin user can access IT modules, master data, and audits', () => {
  const itAdmin = {
    roleName: 'ITAdmin',
    permissions: [
      'assets.view', 'assets.create', 'assets.edit', 'assets.delete', 'assets.assign',
      'tickets.view', 'tickets.create', 'tickets.manage',
      'licenses.view', 'licenses.manage',
      'infrastructure.view', 'infrastructure.manage',
      'hardware_audits.view', 'hardware_audits.manage',
      'master.view', 'master.manage',
      'access.users.view',
    ],
  };

  assert.equal(canAccessRoute('/dashboard/assets', itAdmin), true);
  assert.equal(canAccessRoute('/dashboard/hardware-audits', itAdmin), true);
  assert.equal(canAccessRoute('/dashboard/licenses', itAdmin), true);
  assert.equal(canAccessRoute('/dashboard/tickets', itAdmin), true);
  assert.equal(canAccessRoute('/dashboard/infrastructure', itAdmin), true);
  assert.equal(canAccessRoute('/dashboard/master/equipment-types', itAdmin), true);
  assert.equal(canAccessRoute('/dashboard/master/vendors', itAdmin), true);
  assert.equal(canAccessRoute('/dashboard/master/asset-custodians', itAdmin), true);
  assert.equal(canAccessRoute('/dashboard/access', itAdmin), true);

  assert.equal(getDefaultRedirectForUser(itAdmin), '/dashboard/assets');
});

test('Employee user can only access tickets', () => {
  const employee = {
    roleName: 'Employee',
    permissions: ['tickets.view', 'tickets.create'],
  };

  assert.equal(canAccessRoute('/dashboard/tickets', employee), true);
  assert.equal(canAccessRoute('/dashboard/assets', employee), false);
  assert.equal(canAccessRoute('/dashboard/master/departments', employee), false);
  assert.equal(canAccessRoute('/dashboard/access', employee), false);
  assert.equal(getDefaultRedirectForUser(employee), '/dashboard/tickets');
});
