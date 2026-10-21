import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidStatusTransition, isRequestEditable, validateGoodsRequest, GoodsInputError } from './goodsRequest';

const payload = () => ({
  title: 'Pengadaan Laptop Baru',
  purpose: 'Untuk staf baru divisi operasional',
  requestDate: '2026-10-20', requesterName: 'Fathiya', jobTitle: 'GA', division: 'HR-GA',
  items: [{ name: 'Laptop', quantity: 2, estimatedPrice: 6199000, notes: 'Karyawan baru', attachmentKeys: ['proof-1'] }],
});

test('status transition follows physical wet signature workflow', () => {
  assert.equal(isValidStatusTransition('ready_to_print', 'approved_manually'), true);
  assert.equal(isValidStatusTransition('draft', 'ready_to_print'), true);
  assert.equal(isValidStatusTransition('ready_to_print', 'pending_signature'), true);
  assert.equal(isValidStatusTransition('pending_signature', 'approved_manually'), true);
  assert.equal(isValidStatusTransition('approved_manually', 'processing'), true);
  assert.equal(isValidStatusTransition('processing', 'completed'), true);

  // Revisions & cancellation
  assert.equal(isValidStatusTransition('pending_signature', 'draft'), true);
  assert.equal(isValidStatusTransition('ready_to_print', 'draft'), true);
  assert.equal(isValidStatusTransition('draft', 'cancelled'), true);
  assert.equal(isValidStatusTransition('pending_signature', 'cancelled'), true);
  assert.equal(isValidStatusTransition('processing', 'cancelled'), true);

  // Disallowed
  assert.equal(isValidStatusTransition('draft', 'approved_manually'), true);
  assert.equal(isValidStatusTransition('draft', 'completed'), false);
  assert.equal(isValidStatusTransition('completed', 'draft'), false);
  assert.equal(isValidStatusTransition('cancelled', 'draft'), false);
});

test('validateGoodsRequest allows draft with zero items and no attachments', () => {
  const draft = {
    title: 'Pembelian Meja',
    purpose: 'Kebutuhan tim baru',
    requestDate: '2026-10-20',
    requesterName: 'Budi',
    jobTitle: 'Staff',
    division: 'Umum',
    items: [],
  };
  const validated = validateGoodsRequest(draft, [], true);
  assert.equal(validated.status, 'draft');
  assert.equal(validated.items.length, 0);
  assert.equal(validated.title, 'Pembelian Meja');
});

test('each item requires evidence and identifies the row', () => {
  const input = payload();
  input.items.push({ ...input.items[0], name: 'Mouse', attachmentKeys: [] });
  assert.throws(() => validateGoodsRequest(input, ['proof-1']), /Item 2.*lampiran/);
  assert.throws(() => validateGoodsRequest(payload(), []), /Item 1.*lampiran/);
});

test('subtotal is computed from unit price instead of accepting client subtotal', () => {
  const input = { ...payload(), items: [{ ...payload().items[0], subtotal: 1 }] };
  assert.equal(validateGoodsRequest(input, ['proof-1']).items[0].subtotal, 12398000);
});

test('rejects invalid dates, quantities and prices', () => {
  assert.throws(() => validateGoodsRequest({ ...payload(), requestDate: '2026-02-30' }, ['proof-1']));
  for (const quantity of [0, -1, 1.5, Infinity]) {
    assert.throws(() => validateGoodsRequest({ ...payload(), items: [{ ...payload().items[0], quantity }] }, ['proof-1']));
  }
  assert.throws(() => validateGoodsRequest({ ...payload(), items: [{ ...payload().items[0], estimatedPrice: -1 }] }, ['proof-1']));
});

test('rejects unused, duplicated and forged upload references', () => {
  assert.throws(() => validateGoodsRequest(payload(), ['other']), /lampiran/);
  assert.throws(() => validateGoodsRequest(payload(), ['proof-1', 'unused']), /tidak digunakan/);
  assert.throws(() => validateGoodsRequest(payload(), ['proof-1', 'proof-1']), /duplikat/);
});

test('new complete requests stay draft until staff approval', () => {
  assert.equal(validateGoodsRequest(payload(), ['proof-1']).status, 'draft');
});

test('staff can reject drafts but cannot reopen rejected requests', () => {
 assert.equal(isValidStatusTransition('draft', 'rejected'), true);
 assert.equal(isValidStatusTransition('rejected', 'approved_manually'), false);
});

test('isRequestEditable allows edit only for draft, ready_to_print, and pending_signature', () => {
  assert.equal(isRequestEditable('draft'), true);
  assert.equal(isRequestEditable('ready_to_print'), true);
  assert.equal(isRequestEditable('pending_signature'), true);
  assert.equal(isRequestEditable('approved_manually'), false);
  assert.equal(isRequestEditable('processing'), false);
  assert.equal(isRequestEditable('completed'), false);
  assert.equal(isRequestEditable('rejected'), false);
  assert.equal(isRequestEditable('cancelled'), false);
});
