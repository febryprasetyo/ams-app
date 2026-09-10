import assert from 'node:assert/strict';
import test from 'node:test';
import { assetDetailsSchema, isComputerEquipmentType, computerSpecsSchema, accessorySchema } from './assetDetails';

test('computer details accept canonical positive values', () => {
  const result = assetDetailsSchema.parse({
    computerSpecs: { cpuName: 'Intel Core i5-1135G7', ramSizeGb: 12, ramSlotCount: 2, disk1SizeGb: 1024, disk2SizeGb: 256 },
    accessories: [{ accessoryType: 'Mouse', description: 'Logitech M100', quantity: 1, condition: 'Good', notes: null }],
  });
  assert.equal(result.computerSpecs?.cpuName, 'Intel Core i5-1135G7');
  assert.equal(result.accessories.length, 1);
  assert.equal(result.accessories[0].accessoryType, 'Mouse');
});

test('computer details reject zero sizes and quantities', () => {
  assert.throws(() => assetDetailsSchema.parse({
    computerSpecs: { cpuName: 'CPU', ramSizeGb: 0, ramSlotCount: 2, disk1SizeGb: 512 },
    accessories: [{ accessoryType: 'Mouse', quantity: 0, condition: 'Good' }],
  }));
});

test('computer details reject negative disk2SizeGb', () => {
  assert.throws(() => computerSpecsSchema.parse({
    cpuName: 'CPU',
    ramSizeGb: 16,
    ramSlotCount: 2,
    disk1SizeGb: 512,
    disk2SizeGb: -10,
  }));
});

test('accessory accepts valid conditions and defaults quantity to 1', () => {
  const acc = accessorySchema.parse({ accessoryType: 'Keyboard' });
  assert.equal(acc.quantity, 1);
  assert.equal(acc.condition, 'Good');
});

test('accessory rejects invalid conditions', () => {
  assert.throws(() => accessorySchema.parse({
    accessoryType: 'Keyboard',
    condition: 'Broken',
  }));
});

test('computer type matching covers laptop, desktop pc, workstation, and pc variations', () => {
  assert.equal(isComputerEquipmentType('Laptop'), true);
  assert.equal(isComputerEquipmentType('Desktop PC'), true);
  assert.equal(isComputerEquipmentType('pc'), true);
  assert.equal(isComputerEquipmentType(' PC '), true);
  assert.equal(isComputerEquipmentType('laptop'), true);
  assert.equal(isComputerEquipmentType('Mini PC'), true);
  assert.equal(isComputerEquipmentType('Workstation'), true);
  assert.equal(isComputerEquipmentType('Personal Computer'), true);
  assert.equal(isComputerEquipmentType('Notebook'), true);
  assert.equal(isComputerEquipmentType('Printer'), false);
  assert.equal(isComputerEquipmentType('Server Physical'), false);
  assert.equal(isComputerEquipmentType('Monitor'), false);
  assert.equal(isComputerEquipmentType('Other IT Equipment'), false);
});

test('computer specifications allow omitted, blank and partial fields', () => {
  assert.deepEqual(computerSpecsSchema.parse({}), {});
  assert.deepEqual(computerSpecsSchema.parse({ cpuName: '   ', ramSizeGb: null }), { cpuName: null, ramSizeGb: null });
  assert.deepEqual(computerSpecsSchema.parse({ ramSizeGb: 16 }), { ramSizeGb: 16 });
  assert.deepEqual(computerSpecsSchema.parse({ cpuName: '  Intel  ' }), { cpuName: 'Intel' });
  assert.throws(() => computerSpecsSchema.parse({ ramSizeGb: 0 }));
  assert.throws(() => computerSpecsSchema.parse({ ramSlotCount: 1.5 }));
  assert.throws(() => computerSpecsSchema.parse({ disk1SizeGb: -1 }));
});
