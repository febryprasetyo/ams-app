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

const validPcForm = {
  assetName: 'OptiPlex 7090 Tower',
  equipmentTypeId: 2,
  isEditing: false,
  equipmentTypesAvailable: true,
  isComputerType: true,
  cpuName: 'Intel Core i7-11700',
  ramSizeGb: 32,
  ramSlotCount: 4,
  disk1SizeGb: 512,
  disk2SizeGb: 1000,
  accessories: [
    { accessoryType: 'Keyboard', quantity: 1, condition: 'Good' },
    { accessoryType: 'Mouse', quantity: 1, condition: 'Good' },
  ],
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

test('Desktop PC supports full computer hardware specs and accessories', () => {
  assert.equal(canSubmitAssetForm(validPcForm), true);
  assert.equal(canSubmitAssetForm({ ...validPcForm, cpuName: '' }), false);
  assert.equal(canSubmitAssetForm({ ...validPcForm, ramSlotCount: 0 }), false);
});

test('Printer ignores computer-only fields', () => {
  assert.equal(canSubmitAssetForm(validPrinterForm), true);
});

test('isComputerCategoryName detects laptop, desktop pc, workstation, and pc variations', () => {
  assert.equal(isComputerCategoryName('Laptop'), true);
  assert.equal(isComputerCategoryName('Desktop PC'), true);
  assert.equal(isComputerCategoryName('PC'), true);
  assert.equal(isComputerCategoryName('PC Desktop'), true);
  assert.equal(isComputerCategoryName('Mini PC'), true);
  assert.equal(isComputerCategoryName('Workstation'), true);
  assert.equal(isComputerCategoryName('Personal Computer'), true);
  assert.equal(isComputerCategoryName('Printer'), false);
  assert.equal(isComputerCategoryName('Monitor'), false);
  assert.equal(isComputerCategoryName('Server Physical'), false);
});
