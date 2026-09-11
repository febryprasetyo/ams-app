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

test('hardware audit payload accepts multiple peripherals with preset and manual categories', () => {
  const parsed = hardwareAuditPayloadSchema.parse({
    custodianName: 'Budi Santoso',
    serialNumber: 'PF2XXXXX',
    hasPeripheral: true,
    osName: 'Windows 11 Pro',
    hostname: 'DESKTOP-BUDI',
    macAddresses: '00-15-5D-11-22-33',
    peripherals: [
      {
        category: 'Printer',
        presetCategory: 'printer',
        brandModel: 'Epson L3110',
        serialNumber: 'EP12345',
      },
      {
        category: 'Scanner',
        presetCategory: 'scanner',
        brandModel: 'Canon LiDE 300',
        serialNumber: '-',
      },
      {
        category: 'Monitor',
        presetCategory: 'monitor',
        brandModel: 'Dell P2419H',
        serialNumber: '',
      },
      {
        category: 'Barcode Scanner',
        presetCategory: 'other',
        customCategory: 'Barcode Scanner',
        brandModel: 'Honeywell Voyager 1250g',
        serialNumber: 'UNKNOWN',
      },
    ],
  });

  assert.equal(parsed.hasPeripheral, true);
  assert.equal(parsed.osName, 'Windows 11 Pro');
  assert.equal(parsed.hostname, 'DESKTOP-BUDI');
  const peripherals = parsed.peripherals || [];
  assert.equal(peripherals.length, 4);

  // Printer
  assert.equal(peripherals[0].category, 'Printer');
  assert.equal(peripherals[0].serialNumber, 'EP12345');

  // Scanner - dash normalized to null
  assert.equal(peripherals[1].category, 'Scanner');
  assert.equal(peripherals[1].serialNumber, null);

  // Monitor - empty string normalized to null
  assert.equal(peripherals[2].category, 'Monitor');
  assert.equal(peripherals[2].serialNumber, null);

  // Custom Category Barcode Scanner - UNKNOWN normalized to null
  assert.equal(peripherals[3].category, 'Barcode Scanner');
  assert.equal(peripherals[3].customCategory, 'Barcode Scanner');
  assert.equal(peripherals[3].serialNumber, null);
});

test('hardware audit payload rejects invalid peripheral without brandModel or category', () => {
  assert.throws(() => {
    hardwareAuditPayloadSchema.parse({
      custodianName: 'Budi Santoso',
      peripherals: [
        {
          category: '   ',
          brandModel: 'Epson L3110',
        },
      ],
    });
  });

  assert.throws(() => {
    hardwareAuditPayloadSchema.parse({
      custodianName: 'Budi Santoso',
      peripherals: [
        {
          category: 'Printer',
          brandModel: '   ',
        },
      ],
    });
  });
});

