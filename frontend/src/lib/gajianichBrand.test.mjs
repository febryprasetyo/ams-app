import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BRAND_COLORS,
  BRAND_DESCRIPTION,
  BRAND_NAME,
  BRAND_TAGLINE,
} from './gajianichBrand.ts';

test('defines the approved GAJIANICH identity', () => {
  assert.equal(BRAND_NAME, 'GAJIANICH');
  assert.equal(BRAND_TAGLINE, 'Biar Kantor Jalan, Semua Kebagian.');
  assert.equal(BRAND_DESCRIPTION, 'Grup Administrasi, Jadwal, & Informasi Internal');
});

test('defines the approved GAJIANICH palette', () => {
  assert.deepEqual(BRAND_COLORS, {
    primary: '#059669',
    mint: '#10B981',
    amber: '#F59E0B',
    canvas: '#F8FAFC',
    ink: '#0F172A',
  });
});
