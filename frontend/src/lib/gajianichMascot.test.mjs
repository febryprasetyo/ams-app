import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('mascot supports compact and hero use with accessible alternatives', async () => {
  const source = await read('components/branding/GajianichMascot.tsx');
  assert.match(source, /size\?: 'compact' \| 'hero'/);
  assert.match(source, /decorative\?: boolean/);
  assert.match(source, /aria-hidden/);
  assert.match(source, /Kucing kantor GAJIANICH/);
});

test('root uses the GAJIANICH contract and an emerald focus treatment', async () => {
  const [layout, css] = await Promise.all([read('app/layout.tsx'), read('app/globals.css')]);
  assert.match(layout, /BRAND_NAME/);
  assert.match(layout, /lang="id"/);
  assert.match(css, /#059669/);
  assert.match(css, /#10B981/);
  assert.match(css, /#F59E0B/);
  assert.match(css, /:focus-visible/);
});
