import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('dashboard shell uses the GAJIANICH lockup without inert controls', async () => {
  const source = await readFile(new URL('../components/layout/DashboardLayout.tsx', import.meta.url), 'utf8');
  assert.match(source, /next\/image/);
  assert.match(source, /\/branding\/gajianich-cat-favicon\.png/);
  assert.match(source, /BRAND_NAME/);
  assert.doesNotMatch(source, /Quick Search|GajianichMascot/);
  assert.doesNotMatch(source, /<Bell/);
  for (const label of ['Master Data', 'Attendance', 'IT Inventory', 'Service Desk', 'Access Control']) assert.match(source, new RegExp(label));
});
