import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalJson,
  hashRequestPayload,
  sanitizeAuditTarget,
  sanitizeSnapshot,
  ALLOWED_ENTITY_FIELDS,
} from './hrAudit';

test('canonicalJson produces deterministic string regardless of key order', () => {
  const obj1 = { b: 2, a: 1, c: { y: 'hello', x: 'world' } };
  const obj2 = { a: 1, c: { x: 'world', y: 'hello' }, b: 2 };
  assert.equal(canonicalJson(obj1), canonicalJson(obj2));
  assert.equal(hashRequestPayload(obj1), hashRequestPayload(obj2));
});

test('sensitive_values_are_redacted_everywhere in sanitizeSnapshot and sanitizeAuditTarget', () => {
  const sensitiveEmployee = {
    id: 101,
    code: 'EMP-001',
    name: 'Budi Santoso',
    password: 'secret_password_123',
    token: 'jwt.token.abc',
    nik: '3201234567890001',
    npwp: '01.234.567.8-901.000',
    bankAccount: '1234567890',
    rekening: '987654321',
    unallowedField: 'should be excluded',
  };

  const sanitized = sanitizeSnapshot('employee', sensitiveEmployee);
  assert.ok(sanitized);
  assert.equal(sanitized.id, 101);
  assert.equal(sanitized.code, 'EMP-001');
  assert.equal(sanitized.name, 'Budi Santoso');
  // Sensitive keys must NEVER be in the snapshot
  assert.equal('password' in sanitized, false);
  assert.equal('token' in sanitized, false);
  assert.equal('nik' in sanitized, false);
  assert.equal('npwp' in sanitized, false);
  assert.equal('bankAccount' in sanitized, false);
  assert.equal('rekening' in sanitized, false);
  assert.equal('unallowedField' in sanitized, false);
});

test('sanitizeAuditTarget tracks changedFields and handles null before/after', () => {
  const before = {
    id: 10,
    name: 'Engineering',
    code: 'ENG',
    description: 'Old Description',
  };
  const after = {
    id: 10,
    name: 'Engineering & Tech',
    code: 'ENG',
    description: 'New Description',
  };

  const target = sanitizeAuditTarget('department', before, after, {
    entityId: '10',
    entityLabel: 'Engineering',
  });

  assert.equal(target.entityType, 'department');
  assert.equal(target.entityId, '10');
  assert.equal(target.entityLabel, 'Engineering');
  assert.deepEqual(target.changedFields.sort(), ['description', 'name'].sort());
  assert.equal(target.before?.name, 'Engineering');
  assert.equal(target.after?.name, 'Engineering & Tech');
});

test('sanitizeAuditTarget throws if target identity cannot be resolved', () => {
  assert.throws(
    () => sanitizeAuditTarget('department', {}, {}),
    /Invalid target identity/
  );
});
