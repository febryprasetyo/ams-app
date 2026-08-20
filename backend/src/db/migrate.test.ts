import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runMigrations } from './migrate';
import fs from 'fs';
import path from 'path';

test('runMigrations is exported and rejects invalid database URL without swallowing errors', async () => {
  await assert.rejects(
    async () => {
      // Connect to unreachable port
      await runMigrations('postgresql://invalid:invalid@127.0.0.1:54321/nonexistent_db');
    },
    (err: any) => {
      assert.ok(err, 'Expected migration to throw an error');
      return true;
    }
  );
});

test('drizzle meta journal exists and is valid json', () => {
  const journalPath = path.resolve(__dirname, '../../drizzle/meta/_journal.json');
  assert.ok(fs.existsSync(journalPath), 'Expected _journal.json to exist in drizzle/meta');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  assert.ok(Array.isArray(journal.entries), 'Expected entries array in journal');
});
