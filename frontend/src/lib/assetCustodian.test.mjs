import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCustodianSelectionPayload,
  canManageCustodians,
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
