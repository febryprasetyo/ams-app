import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { assetAccessories, assetComputerSpecs } from './schema/assets';

test('computer specifications require one asset and allow every hardware field to be omitted', () => {
  assert.equal(assetComputerSpecs.assetId.notNull, true);
  assert.equal(assetComputerSpecs.cpuName.notNull, false);
  assert.equal(assetComputerSpecs.ramSizeGb.notNull, false);
  assert.equal(assetComputerSpecs.ramSlotCount.notNull, false);
  assert.equal(assetComputerSpecs.disk1SizeGb.notNull, false);
  assert.equal(assetComputerSpecs.disk2SizeGb.notNull, false);
});

test('accessories require a parent, type, quantity, and condition', () => {
  assert.equal(assetAccessories.assetId.notNull, true);
  assert.equal(assetAccessories.accessoryType.notNull, true);
  assert.equal(assetAccessories.quantity.notNull, true);
  assert.equal(assetAccessories.condition.notNull, true);
});

test('journal contains computer detail tables and positive checks', () => {
  const journal = JSON.parse(readFileSync(resolve('drizzle/meta/_journal.json'), 'utf8')) as {
    entries: Array<{ tag: string }>;
  };
  const sql = journal.entries
    .map(({ tag }) => readFileSync(resolve(`drizzle/${tag}.sql`), 'utf8'))
    .find((body) => body.includes('CREATE TABLE "asset_computer_specs"'));
  assert.ok(sql);
  assert.match(sql, /CREATE TABLE "asset_accessories"/);
  assert.match(sql, /ON DELETE cascade/);
  assert.match(sql, /CHECK/);
});
