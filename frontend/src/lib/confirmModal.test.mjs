import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveConfirmText, resolveVariantStyles } from './confirmModal.ts';

test('resolveConfirmText defaults properly by variant', () => {
  assert.equal(resolveConfirmText('danger'), 'Hapus');
  assert.equal(resolveConfirmText('warning'), 'Lanjutkan');
  assert.equal(resolveConfirmText('primary'), 'Konfirmasi');
});

test('resolveConfirmText prioritizes custom text and trims whitespace', () => {
  assert.equal(resolveConfirmText('danger', ' Hapus Permanen '), 'Hapus Permanen');
  assert.equal(resolveConfirmText('warning', 'Nonaktifkan'), 'Nonaktifkan');
  assert.equal(resolveConfirmText('primary', 'Setujui'), 'Setujui');
});

test('resolveVariantStyles returns appropriate CSS classes for danger', () => {
  const dangerStyles = resolveVariantStyles('danger');
  assert.match(dangerStyles.iconContainerClass, /rose-600/);
  assert.match(dangerStyles.confirmButtonClass, /bg-rose-600/);
});

test('resolveVariantStyles returns appropriate CSS classes for warning', () => {
  const warningStyles = resolveVariantStyles('warning');
  assert.match(warningStyles.iconContainerClass, /amber-600/);
  assert.match(warningStyles.confirmButtonClass, /bg-amber-600/);
});

test('resolveVariantStyles returns appropriate CSS classes for primary', () => {
  const primaryStyles = resolveVariantStyles('primary');
  assert.match(primaryStyles.iconContainerClass, /red-600/);
  assert.match(primaryStyles.confirmButtonClass, /bg-red-600/);
});
