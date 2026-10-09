import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCustodianSelectionPayload,
  canManageCustodians,
  filterEmployeeCandidates,
  getDefaultReconciliationMatchTab,
  getEmployeeConflictAdvisory,
  prepareManualCustodian,
} from './assetCustodian.ts';

const activeCustodian = {
  id: 42,
  displayName: 'Rina Hartono',
  origin: 'MANUAL',
  verificationStatus: 'UNVERIFIED',
  recordStatus: 'ACTIVE',
};

test('existing selection emits the stable custodian ID', () => {
  assert.deepEqual(
    buildCustodianSelectionPayload({ kind: 'custodian', custodian: activeCustodian }),
    { custodianId: 42 },
  );
});

test('clear is omitted during create and explicit during edit', () => {
  assert.deepEqual(buildCustodianSelectionPayload({ kind: 'none' }), {});
  assert.deepEqual(buildCustodianSelectionPayload({ kind: 'none' }, { explicitClear: true }), {
    custodianId: null,
  });
});

test('manual selection trims values and converts optional blanks to null', () => {
  const manual = prepareManualCustodian({
    displayName: '  Rina Hartono  ',
    locationId: 7,
    unitText: '  Finance  ',
    notes: '   ',
    duplicateAcknowledged: true,
  });

  assert.deepEqual(
    buildCustodianSelectionPayload({ kind: 'manual', newCustodian: manual }),
    {
      newCustodian: {
        displayName: 'Rina Hartono',
        locationId: 7,
        unitText: 'Finance',
        notes: null,
        duplicateAcknowledged: true,
      },
    },
  );
});

test('manual selection rejects an empty display name', () => {
  assert.throws(
    () => prepareManualCustodian({ displayName: '   ' }),
    /Holder name is required/,
  );
});

test('manual selection requires acknowledgement when candidates are visible', () => {
  assert.throws(
    () => prepareManualCustodian({ displayName: 'Rina Hartono' }, { hasDuplicateCandidates: true }),
    /Review the possible duplicates/,
  );
  assert.equal(
    prepareManualCustodian(
      { displayName: 'Rina Hartono', duplicateAcknowledged: true },
      { hasDuplicateCandidates: true },
    ).duplicateAcknowledged,
    true,
  );
});

test('existing selection rejects inactive and merged custodians', () => {
  assert.throws(
    () => buildCustodianSelectionPayload({
      kind: 'custodian',
      custodian: { ...activeCustodian, recordStatus: 'INACTIVE' },
    }),
    /active custodian/,
  );
  assert.throws(
    () => buildCustodianSelectionPayload({
      kind: 'custodian',
      custodian: { ...activeCustodian, recordStatus: 'MERGED' },
    }),
    /active custodian/,
  );
});

test('custodian metadata and reconciliation controls are admin-only', () => {
  assert.equal(canManageCustodians('SuperAdmin'), true);
  assert.equal(canManageCustodians('ITAdmin'), true);
  assert.equal(canManageCustodians('it_admin'), true);
  assert.equal(canManageCustodians('ITStaff'), false);
  assert.equal(canManageCustodians(undefined), false);
});

test("getDefaultReconciliationMatchTab chooses suggested when matches exist and manual otherwise", () => {
  assert.equal(getDefaultReconciliationMatchTab(3), "suggested");
  assert.equal(getDefaultReconciliationMatchTab(1), "suggested");
  assert.equal(getDefaultReconciliationMatchTab(0), "manual");
});

test("filterEmployeeCandidates filters candidates by name, code, or department case-insensitively", () => {
  const candidates = [
    { id: 1, employeeCode: "EMP-001", fullName: "Budi Santoso", departmentName: "IT Support" },
    { id: 2, employeeCode: "EMP-002", fullName: "Siti Rahma", departmentName: "Finance" },
    { id: 3, employeeCode: "EMP-003", fullName: "Ahmad Fauzi", departmentName: "Human Resources" },
  ];

  assert.deepEqual(filterEmployeeCandidates(candidates, ""), candidates);
  assert.deepEqual(filterEmployeeCandidates(candidates, "   "), candidates);
  assert.deepEqual(filterEmployeeCandidates(candidates, "budi"), [candidates[0]]);
  assert.deepEqual(filterEmployeeCandidates(candidates, "emp-002"), [candidates[1]]);
  assert.deepEqual(filterEmployeeCandidates(candidates, "human"), [candidates[2]]);
  assert.deepEqual(filterEmployeeCandidates(candidates, "nonexistent"), []);
});

test("getEmployeeConflictAdvisory detects whether employee already has an active custodian", () => {
  const employeeWithoutCustodian = {
    id: 1,
    employeeCode: "EMP-001",
    fullName: "Budi Santoso",
    custodianId: null,
  };
  const employeeWithCustodian = {
    id: 2,
    employeeCode: "EMP-002",
    fullName: "Siti Rahma",
    custodianId: 88,
  };

  assert.deepEqual(
    getEmployeeConflictAdvisory(employeeWithoutCustodian),
    { hasConflict: false, activeCustodianId: null },
  );
  assert.deepEqual(
    getEmployeeConflictAdvisory(employeeWithCustodian),
    { hasConflict: true, activeCustodianId: 88 },
  );
  assert.deepEqual(
    getEmployeeConflictAdvisory(undefined),
    { hasConflict: false, activeCustodianId: null },
  );
});
