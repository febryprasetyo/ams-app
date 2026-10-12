import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSeedCredentials } from './seedCredentials';

test('production seed refuses a missing or default initial password', () => {
  for (const password of [undefined, 'Admin123!', 'a'.repeat(30)]) {
    assert.throws(() => getSeedCredentials({ NODE_ENV: 'production', INITIAL_ADMIN_PASSWORD: password }));
  }
});

test('production bootstrap uses the supplied password and requires a password change', () => {
  const password = 'B7f4!pR9wK2mX6qZ8sT3';
  assert.deepEqual(getSeedCredentials({ NODE_ENV: 'production', INITIAL_ADMIN_PASSWORD: password }), {
    password, mustChangePassword: true,
  });
});

test('development retains its existing seed credentials', () => {
  assert.deepEqual(getSeedCredentials({ NODE_ENV: 'development' }), {
    password: 'Admin123!', mustChangePassword: false,
  });
});
