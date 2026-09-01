import assert from 'node:assert/strict';
import test from 'node:test';
import { replaceAssetDetails, type AssetDetailsRepository } from './assetDetailsPersistence';

function recordingRepository() {
  const calls: Array<{ operation: string; value?: unknown }> = [];
  const repository: AssetDetailsRepository = {
    deleteComputerSpecs: async (assetId) => { calls.push({ operation: 'deleteSpecs', value: assetId }); },
    deleteAccessories: async (assetId) => { calls.push({ operation: 'deleteAccessories', value: assetId }); },
    insertComputerSpecs: async (value) => { calls.push({ operation: 'insertSpecs', value }); },
    insertAccessories: async (values) => { calls.push({ operation: 'insertAccessories', value: values }); },
  };
  return { calls, repository };
}

test('Laptop replaces specs and accessories in deterministic order', async () => {
  const { calls, repository } = recordingRepository();
  await replaceAssetDetails(repository, {
    assetId: 7,
    categoryName: 'Laptop',
    computerSpecs: { cpuName: 'Intel Core i5', ramSizeGb: 16, ramSlotCount: 2, disk1SizeGb: 512, disk2SizeGb: null },
    accessories: [{ accessoryType: 'Mouse', quantity: 1, condition: 'Good' }],
  });
  assert.deepEqual(calls.map((item) => item.operation), [
    'deleteSpecs', 'deleteAccessories', 'insertSpecs', 'insertAccessories',
  ]);
});

test('Printer rejects computer-only child values', async () => {
  const { repository } = recordingRepository();
  await assert.rejects(() => replaceAssetDetails(repository, {
    assetId: 8,
    categoryName: 'Printer',
    computerSpecs: { cpuName: 'CPU', ramSizeGb: 8, ramSlotCount: 1, disk1SizeGb: 256 },
    accessories: [],
  }), /Laptop or PC/i);
});

test('changing to a non-computer category removes existing child rows', async () => {
  const { calls, repository } = recordingRepository();
  await replaceAssetDetails(repository, {
    assetId: 9,
    categoryName: 'Printer',
    computerSpecs: null,
    accessories: [],
  });
  assert.deepEqual(calls.map((item) => item.operation), ['deleteSpecs', 'deleteAccessories']);
});
