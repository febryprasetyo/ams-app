import assert from 'node:assert/strict';
import test from 'node:test';
import { canSubmitAssetForm, isComputerCategoryName } from './assetForm.ts';

const validLaptopForm = {
  assetName: 'ThinkPad T14',
  equipmentTypeId: 1,
  isEditing: false,
  equipmentTypesAvailable: true,
  isComputerType: true,
  cpuName: 'Intel Core i7',
  ramSizeGb: 16,
  ramSlotCount: 2,
  disk1SizeGb: 512,
  disk2SizeGb: '',
  accessories: [{ accessoryType: 'Mouse', quantity: 1, condition: 'Good' }],
};

const validPrinterForm = {
  assetName: 'HP LaserJet',
  equipmentTypeId: 3,
  isEditing: false,
  equipmentTypesAvailable: true,
  isComputerType: false,
};

test('new inventory cannot be submitted without an explicitly selected equipment type', () => {
  assert.equal(canSubmitAssetForm({
    assetName: 'Laptop',
    equipmentTypeId: '',
    isEditing: false,
    equipmentTypesAvailable: true,
  }), false);
});

test('new inventory cannot be submitted while equipment types are unavailable', () => {
  assert.equal(canSubmitAssetForm({
    assetName: 'Laptop',
    equipmentTypeId: 1,
    isEditing: false,
    equipmentTypesAvailable: false,
  }), false);
});

test('an existing inventory item remains editable with its current equipment type', () => {
  assert.equal(canSubmitAssetForm({
    assetName: 'Laptop',
    equipmentTypeId: 1,
    isEditing: true,
    equipmentTypesAvailable: false,
  }), true);
});

test('Laptop requires complete computer specs but permits an empty Disk 2', () => {
  assert.equal(canSubmitAssetForm(validLaptopForm), true);
  assert.equal(canSubmitAssetForm({ ...validLaptopForm, ramSizeGb: 0 }), false);
  assert.equal(canSubmitAssetForm({ ...validLaptopForm, cpuName: ' ' }), false);
  assert.equal(canSubmitAssetForm({ ...validLaptopForm, disk1SizeGb: '' }), false);
});

test('Printer ignores computer-only fields', () => {
  assert.equal(canSubmitAssetForm(validPrinterForm), true);
});

test('isComputerCategoryName detects laptop and pc', () => {
  assert.equal(isComputerCategoryName('Laptop'), true);
  assert.equal(isComputerCategoryName('PC'), true);
  assert.equal(isComputerCategoryName('Printer'), false);
});
