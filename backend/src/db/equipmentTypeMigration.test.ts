import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('equipment type uniqueness migration audits legacy duplicates before creating indexes', () => {
  const sql = readFileSync('drizzle/0004_melodic_vapor.sql', 'utf8');
  const auditIndex = sql.indexOf('HAVING count(*) > 1');
  const errorIndex = sql.indexOf('RAISE EXCEPTION');
  const uniqueIndex = sql.indexOf('CREATE UNIQUE INDEX');

  assert.ok(auditIndex >= 0, 'migration must audit duplicate legacy values');
  assert.ok(errorIndex > auditIndex, 'duplicate audit must provide an actionable migration error');
  assert.ok(uniqueIndex > errorIndex, 'audit must run before unique indexes are created');
});
