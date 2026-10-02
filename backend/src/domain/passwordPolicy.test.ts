import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePasswordStrength,
  generateSecureTemporaryPassword,
  PASSWORD_POLICY_REGEX,
} from './passwordPolicy';

test('Password policy: requires at least 8 chars with mix of letters, numbers & symbols', () => {
  // Too short
  assert.equal(validatePasswordStrength('Ab1!').isValid, false);
  // Missing symbols
  assert.equal(validatePasswordStrength('Abcdefgh1').isValid, false);
  // Missing numbers
  assert.equal(validatePasswordStrength('Abcdefgh!').isValid, false);
  // Missing letters
  assert.equal(validatePasswordStrength('12345678!').isValid, false);

  // Valid password with letters, numbers, and symbols
  assert.equal(validatePasswordStrength('Admin123!').isValid, true);
  assert.equal(validatePasswordStrength('SecureP@ss99').isValid, true);
});

test('generateSecureTemporaryPassword generates password satisfying the policy', () => {
  for (let i = 0; i < 20; i++) {
    const pwd = generateSecureTemporaryPassword(12);
    assert.ok(pwd.length >= 12);
    const result = validatePasswordStrength(pwd);
    assert.equal(result.isValid, true, `Generated password "${pwd}" failed policy check: ${result.error}`);
    assert.ok(PASSWORD_POLICY_REGEX.test(pwd));
  }
});
