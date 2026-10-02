import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const sourceFiles = [
  '../components/layout/DashboardLayout.tsx',
  '../app/login/page.tsx',
  '../app/change-password/page.tsx',
  '../components/attendance/attendance.css',
];

async function readInterfaceSources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) return readInterfaceSources(location);
    if (/\.(?:tsx|css)$/.test(entry.name)) return [location];
    return [];
  }));
  return files.flat();
}

test('GAJIANICH entry surfaces use the emerald, mint, and amber palette', async () => {
  const sources = await Promise.all(sourceFiles.map((file) => readFile(new URL(file, import.meta.url), 'utf8')));
  const source = sources.join('\n');

  assert.doesNotMatch(source, /(?:blue|purple|indigo|violet|cyan|sky)-(?:50|100|200|300|400|500|600|700|800|900)/);
  assert.match(source, /emerald-(?:50|500|600|700)/);
  assert.match(source, /amber-(?:50|500|600|700)/);
  assert.match(sources[3], /#059669/);
  assert.match(sources[3], /#047857/);
});

test('GAJIANICH has no remaining cold-color utility classes', async () => {
  const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
  const files = await readInterfaceSources(sourceRoot);
  const sources = await Promise.all(files.map((file) => readFile(file, 'utf8')));

  assert.doesNotMatch(sources.join('\n'), /(?:blue|purple|indigo|violet|cyan|sky)-(?:50|100|200|300|400|500|600|700|800|900)/);
});
