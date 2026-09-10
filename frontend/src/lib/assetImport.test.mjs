import assert from 'node:assert/strict';
import test from 'node:test';
import { canManageAssets, canManageLifecycle, canCommitAssetImport, getCustodianResolutionRows } from './assetImport.ts';

test('only asset admins can import and manage assets', () => {
  assert.equal(canManageAssets('SuperAdmin'), true);
  assert.equal(canManageAssets('ITAdmin'), true);
  assert.equal(canManageAssets('itadmin'), true);
  assert.equal(canManageAssets('ITStaff'), false);
  assert.equal(canManageAssets('Employee'), false);
  assert.equal(canManageAssets(null), false);
});

test('lifecycle roles include ITStaff', () => {
  assert.equal(canManageLifecycle('SuperAdmin'), true);
  assert.equal(canManageLifecycle('ITAdmin'), true);
  assert.equal(canManageLifecycle('ITStaff'), true);
  assert.equal(canManageLifecycle('Employee'), false);
});

test('canCommitAssetImport validates preview state and submission status', () => {
  assert.equal(canCommitAssetImport(null, false), false);
  assert.equal(canCommitAssetImport({ valid: false, summary: { totalRows: 1, errorCount: 1, warningCount: 0, validRows: 0, laptopPcCount: 1, otherAssetCount: 0, accessoryCount: 0 }, messages: [{ type: 'error' }] }, false), false);
  assert.equal(canCommitAssetImport({ valid: true, summary: { totalRows: 1, errorCount: 0, warningCount: 0, validRows: 1, laptopPcCount: 1, otherAssetCount: 0, accessoryCount: 0 }, messages: [] }, true), false);
  assert.equal(canCommitAssetImport({ valid: true, summary: { totalRows: 1, errorCount: 0, warningCount: 1, validRows: 1, laptopPcCount: 1, otherAssetCount: 0, accessoryCount: 0 }, messages: [{ type: 'warning' }] }, false), true);
});

test('custodian resolution rows combine computer and other asset decisions', () => {
  const rows = getCustodianResolutionRows({
    valid: true,
    summary: { totalRows: 2, errorCount: 0, warningCount: 1, validRows: 2, laptopPcCount: 1, otherAssetCount: 1, accessoryCount: 0 },
    messages: [],
    resolvedData: {
      laptops: [{ rowNumber: 2, name: 'Laptop', custodianResolution: { action: 'REUSE', holderName: 'Rina' } }],
      otherAssets: [{ rowNumber: 3, name: 'Printer', custodianResolution: { action: 'UNASSIGNED', holderName: null } }],
      accessories: [],
    },
  });

  assert.deepEqual(rows, [
    { source: 'Laptop-PC', rowNumber: 2, assetName: 'Laptop', action: 'REUSE', holderName: 'Rina' },
    { source: 'Other Assets', rowNumber: 3, assetName: 'Printer', action: 'UNASSIGNED', holderName: null },
  ]);
});
