import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accurateLicenseLogs } from './schema/infrastructure';

test('Accurate license snapshots always belong to a reporting server', () => {
  assert.equal(accurateLicenseLogs.serverId.notNull, true);
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('infrastructure migration deletes orphan license rows before requiring server_id', () => {
  const journal = JSON.parse(readFileSync(resolve('drizzle/meta/_journal.json'), 'utf8')) as {
    entries: Array<{ tag: string }>;
  };
  const migration = journal.entries
    .map((entry) => readFileSync(resolve(`drizzle/${entry.tag}.sql`), 'utf8'))
    .find((sql) => sql.includes('ALTER COLUMN "server_id" SET NOT NULL'));
  assert.ok(migration, 'journal must contain the infrastructure server ownership migration');
  const sql = migration;
  const deleteIndex = sql.indexOf('DELETE FROM "accurate_license_logs" WHERE "server_id" IS NULL');
  const constraintIndex = sql.indexOf('ALTER COLUMN "server_id" SET NOT NULL');
  assert.ok(deleteIndex >= 0, 'migration must delete orphan license rows');
  assert.ok(constraintIndex > deleteIndex, 'cleanup must run before the NOT NULL constraint');
});
