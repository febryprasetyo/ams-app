import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hardwareAuditPayloadSchema,
  batchHardwareAuditSchema,
  linkAssetAuditSchema,
} from './hardwareAudit';

test('hardware audit payload accepts valid computer specifications', () => {
  const parsed = hardwareAuditPayloadSchema.parse({
    custodianName: 'Budi Santoso',
    serialNumber: 'PF2XXXXX',
    manufacturer: 'Lenovo',
    model: 'ThinkPad T14',
    cpuName: '11th Gen Intel Core i7-1165G7',
    ramSizeGb: 16,
    ramSlotCount: 2,
    disk1SizeGb: 512,
    disk2SizeGb: null,
    notes: 'Laptop Finance',
  });

  assert.equal(parsed.custodianName, 'Budi Santoso');
  assert.equal(parsed.serialNumber, 'PF2XXXXX');
  assert.equal(parsed.ramSizeGb, 16);
  assert.equal(parsed.disk1SizeGb, 512);
});

test('hardware audit payload rejects empty or blank custodian name', () => {
  assert.throws(() => {
    hardwareAuditPayloadSchema.parse({
      custodianName: '   ',
      serialNumber: 'PF2XXXXX',
    });
  }, /Custodian name is required/);
});

test('hardware audit payload normalizes blank strings to null', () => {
  const parsed = hardwareAuditPayloadSchema.parse({
    custodianName: 'Siti Aminah',
    serialNumber: '',
    cpuName: '   ',
    notes: '   ',
  });

  assert.equal(parsed.serialNumber, null);
  assert.equal(parsed.cpuName, null);
  assert.equal(parsed.notes, null);
});

test('hardware audit payload rejects non-positive ram or disk sizes', () => {
  assert.throws(() => {
    hardwareAuditPayloadSchema.parse({
      custodianName: 'Ahmad',
      ramSizeGb: 0,
    });
  });

  assert.throws(() => {
    hardwareAuditPayloadSchema.parse({
      custodianName: 'Ahmad',
      disk1SizeGb: -256,
    });
  });
});

test('batch hardware audit schema requires at least one audit record', () => {
  assert.throws(() => {
    batchHardwareAuditSchema.parse({
      audits: [],
    });
  }, /At least one audit record is required/);

  const parsed = batchHardwareAuditSchema.parse({
    audits: [
      { custodianName: 'User 1', serialNumber: 'SN1' },
      { custodianName: 'User 2', serialNumber: 'SN2' },
    ],
  });
  assert.equal(parsed.audits.length, 2);
});

test('link asset audit schema validates assetId and defaults options', () => {
  const parsed = linkAssetAuditSchema.parse({
    assetId: 42,
  });
  assert.equal(parsed.assetId, 42);
  assert.equal(parsed.updateSerialNumber, true);
  assert.equal(parsed.updateSpecs, true);
});
