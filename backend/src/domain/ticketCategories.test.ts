import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_TICKET_CATEGORIES,
  DEFAULT_SLA_POLICIES,
  normalizeTicketCategoryInput,
  parseTicketCategoryInput,
  shouldSeedDefaultTicketCategories,
  shouldSeedDefaultSlaPolicies,
} from './ticketCategories';

test('default ticket categories cover common IT helpdesk issues with unique codes and names', () => {
  const codes = DEFAULT_TICKET_CATEGORIES.map((c) => c.code);
  const names = DEFAULT_TICKET_CATEGORIES.map((c) => c.name);

  assert.equal(new Set(codes).size, codes.length, 'Codes must be unique');
  assert.equal(new Set(names).size, names.length, 'Names must be unique');
  assert.ok(names.includes('Hardware'));
  assert.ok(names.includes('Software & Application'));
  assert.ok(names.includes('Network & Connectivity'));
  assert.ok(names.includes('Account & Access'));
});

test('default SLA policies cover Critical, High, Medium, Low priorities', () => {
  const priorities = DEFAULT_SLA_POLICIES.map((p) => p.priority);
  assert.deepEqual(priorities, ['Critical', 'High', 'Medium', 'Low']);
  for (const policy of DEFAULT_SLA_POLICIES) {
    assert.ok(policy.targetResponseHours > 0);
    assert.ok(policy.targetResolutionHours > policy.targetResponseHours);
  }
});

test('normalizeTicketCategoryInput trims whitespace and uppercases code', () => {
  const result = normalizeTicketCategoryInput({
    name: '  Cybersecurity  ',
    code: ' sec ',
    description: '  Security incidents  ',
  });
  assert.equal(result.name, 'Cybersecurity');
  assert.equal(result.code, 'SEC');
  assert.equal(result.description, 'Security incidents');
});

test('parseTicketCategoryInput validates input schema and rejects empty names/codes', () => {
  assert.throws(() => parseTicketCategoryInput({ name: '', code: 'HDW' }));
  assert.throws(() => parseTicketCategoryInput({ name: 'Hardware', code: '' }));
  assert.doesNotThrow(() => parseTicketCategoryInput({ name: 'Hardware', code: 'HDW' }));
});

test('seeding predicates return true only when count is zero', () => {
  assert.equal(shouldSeedDefaultTicketCategories(0), true);
  assert.equal(shouldSeedDefaultTicketCategories(1), false);
  assert.equal(shouldSeedDefaultSlaPolicies(0), true);
  assert.equal(shouldSeedDefaultSlaPolicies(4), false);
});
