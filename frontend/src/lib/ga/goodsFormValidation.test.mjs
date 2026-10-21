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

const validData = () => ({
  title: 'Pengadaan Laptop', purpose: 'Operasional',
  identity: { requestDate: '2026-10-20', requesterName: 'GA', jobTitle: 'Staf', division: 'GA' },
  rows: [{ name: 'Laptop', quantity: '2', estimatedPrice: '6199000', evidenceCount: 1 }],
});

test('ready to print accepts whole amounts and rejects fractional or non-finite quantities and prices', () => {
  assert.equal(validateFormSubmission(validData(), false).isValid, true);
  for (const [field, values] of [
    ['quantity', ['1.5', 'Infinity', '1000001']],
    ['estimatedPrice', ['100.5', 'Infinity', '100000000001']],
  ]) {
    for (const value of values) {
      const data = validData(); data.rows[0][field] = value;
      assert.equal(validateFormSubmission(data, false).isValid, false, `${field}: ${value}`);
    }
  }
});

test('ready to print rejects invalid dates and rows exceeding server limits', () => {
  for (const date of ['2026-02-30', '2026-13-01', '20/10/2026']) {
    const data = validData(); data.identity.requestDate = date;
    assert.equal(validateFormSubmission(data, false).isValid, false, date);
  }
  const tooManyItems = validData();
  tooManyItems.rows = Array.from({ length: 21 }, () => ({ ...tooManyItems.rows[0] }));
  assert.equal(validateFormSubmission(tooManyItems, false).isValid, false);
  const tooManyImages = validData(); tooManyImages.rows[0].evidenceCount = 4;
  assert.equal(validateFormSubmission(tooManyImages, false).isValid, false);
  const excessiveSubtotal = validData();
  excessiveSubtotal.rows[0].quantity = '1000000';
  excessiveSubtotal.rows[0].estimatedPrice = '100000000000';
  assert.equal(validateFormSubmission(excessiveSubtotal, false).isValid, false);
});
