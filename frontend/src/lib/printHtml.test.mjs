import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from './printHtml.ts';

test('escapes asset values before interpolating a printable HTML document', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)"> & \'tag\''), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;tag&#39;');
  assert.equal(escapeHtml('AST-001'), 'AST-001');
});
