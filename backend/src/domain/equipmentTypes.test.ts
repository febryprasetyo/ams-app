import assert from 'node:assert/strict';
import test from 'node:test';

type EquipmentTypeDomain = {
  DEFAULT_IT_EQUIPMENT_TYPES: ReadonlyArray<{ name: string; codePrefix: string }>;
  normalizeEquipmentTypeInput: (input: { name: string; codePrefix: string }) => {
    name: string;
    codePrefix: string;
  };
  equipmentTypeDeleteConflict: (assetCount: number) => string | null;
  shouldSeedDefaultEquipmentTypes: (existingCount: number) => boolean;
  parseEquipmentTypeInput: (input: { name: string; codePrefix: string }) => {
    name: string;
    codePrefix: string;
  };
};

async function loadDomain(): Promise<EquipmentTypeDomain> {
  return import('./equipmentTypes').catch(() => ({
    DEFAULT_IT_EQUIPMENT_TYPES: [],
    normalizeEquipmentTypeInput: (input: { name: string; codePrefix: string }) => input,
    equipmentTypeDeleteConflict: () => null,
    shouldSeedDefaultEquipmentTypes: () => true,
    parseEquipmentTypeInput: (input: { name: string; codePrefix: string }) => input,
  })) as Promise<EquipmentTypeDomain>;
}

test('default IT equipment type catalog covers common company devices with unique prefixes', async () => {
  const domain = await loadDomain();
  const expectedNames = [
    'Desktop PC',
    'Laptop',
    'Monitor',
    'Mouse',
    'Keyboard',
    'USB Hub',
    'USB Flash Drive',
    'External HDD / SSD',
    'USB Wi-Fi Adapter',
    'Sound Card',
    'Speaker',
    'Printer',
    'Scanner',
    'Other IT Equipment',
  ];

  const names = domain.DEFAULT_IT_EQUIPMENT_TYPES.map((item) => item.name);
  for (const name of expectedNames) {
    assert.ok(names.includes(name), `missing default equipment type: ${name}`);
  }

  const prefixes = domain.DEFAULT_IT_EQUIPMENT_TYPES.map((item) => item.codePrefix);
  assert.equal(new Set(prefixes).size, prefixes.length);
});

test('equipment type input trims names and uppercases code prefixes', async () => {
  const domain = await loadDomain();
  assert.deepEqual(
    domain.normalizeEquipmentTypeInput({ name: '  Docking Station  ', codePrefix: ' dck ' }),
    { name: 'Docking Station', codePrefix: 'DCK' },
  );
});

test('equipment type input rejects blank names and unsafe code prefixes', async () => {
  const domain = await loadDomain();
  assert.throws(() => domain.parseEquipmentTypeInput({ name: '   ', codePrefix: 'LPT' }), /name/i);
  assert.throws(() => domain.parseEquipmentTypeInput({ name: 'Laptop', codePrefix: 'A|B' }), /prefix/i);
  assert.throws(() => domain.parseEquipmentTypeInput({ name: 'Laptop', codePrefix: '[' }), /prefix/i);
});

test('equipment type deletion is blocked while inventory references it', async () => {
  const domain = await loadDomain();
  assert.match(domain.equipmentTypeDeleteConflict(2) || '', /2 inventory items/i);
  assert.equal(domain.equipmentTypeDeleteConflict(0), null);
});

test('default catalog is only seeded into an empty equipment type table', async () => {
  const domain = await loadDomain();
  const shouldSeed = domain.shouldSeedDefaultEquipmentTypes || (() => true);
  assert.equal(shouldSeed(0), true);
  assert.equal(shouldSeed(1), false);
  assert.equal(shouldSeed(25), false);
});
