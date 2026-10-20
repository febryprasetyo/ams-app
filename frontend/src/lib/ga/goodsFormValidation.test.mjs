import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFormSubmission } from './goodsFormValidation.js';

test('validateFormSubmission accepts draft with empty rows and missing evidence', () => {
  const draftData = {
    title: 'Draft Meja',
    purpose: '',
    identity: { requestDate: '2026-10-20', requesterName: 'Budi', jobTitle: '', division: '' },
    rows: [],
  };
  const result = validateFormSubmission(draftData, true);
  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
});

test('validateFormSubmission rejects ready_to_print without title or items', () => {
  const readyWithoutTitle = {
    title: '',
    purpose: '',
    identity: { requestDate: '2026-10-20', requesterName: 'Budi', jobTitle: 'Staff', division: 'GA' },
    rows: [{ name: 'Laptop', quantity: '1', estimatedPrice: '5000000', notes: '', evidenceCount: 1 }],
  };
  const titleCheck = validateFormSubmission(readyWithoutTitle, false);
  assert.equal(titleCheck.isValid, false);
  assert.ok(titleCheck.errors.some(e => e.includes('Judul')));

  const readyWithoutItems = {
    title: 'Pengadaan Laptop',
    purpose: 'Karyawan baru',
    identity: { requestDate: '2026-10-20', requesterName: 'Budi', jobTitle: 'Staff', division: 'GA' },
    rows: [],
  };
  const itemsCheck = validateFormSubmission(readyWithoutItems, false);
  assert.equal(itemsCheck.isValid, false);
  assert.ok(itemsCheck.errors.some(e => e.includes('minimal satu barang')));
});

test('validateFormSubmission rejects ready_to_print items without price proof', () => {
  const missingProof = {
    title: 'Pengadaan Laptop',
    purpose: 'Karyawan baru',
    identity: { requestDate: '2026-10-20', requesterName: 'Budi', jobTitle: 'Staff', division: 'GA' },
    rows: [{ name: 'Laptop', quantity: '1', estimatedPrice: '5000000', notes: '', evidenceCount: 0 }],
  };
  const proofCheck = validateFormSubmission(missingProof, false);
  assert.equal(proofCheck.isValid, false);
  assert.ok(proofCheck.errors.some(e => e.includes('bukti harga')));
});
