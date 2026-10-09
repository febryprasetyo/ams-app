import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { assets } from './schema/assets';

describe('Asset Schema Operational Columns', () => {
  test('assets table schema contains purchaseDate and warrantyExpiry', () => {
    assert.ok('purchaseDate' in assets, 'purchaseDate field should exist on assets schema');
    assert.ok('warrantyExpiry' in assets, 'warrantyExpiry field should exist on assets schema');
  });
});
