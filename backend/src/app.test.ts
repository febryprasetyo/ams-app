import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEnv } from './config/env';
import { createApp } from './app';

test('loadEnv rejects missing required settings', () => {
  assert.throws(() => loadEnv({}), /DATABASE_URL/);
});

test('loadEnv rejects invalid port or invalid URL', () => {
  assert.throws(() => loadEnv({
    DATABASE_URL: 'invalid-url',
    JWT_SECRET: 'secret',
    JWT_REFRESH_SECRET: 'refresh',
    PORT: 'not-a-number'
  }), /PORT|DATABASE_URL/);
});

test('loadEnv requires a dedicated agent API key', () => {
  assert.throws(() => loadEnv({
    DATABASE_URL: 'postgresql://postgres:password@localhost:5432/ams_test',
    JWT_SECRET: 'jwt-secret-key-12345',
    JWT_REFRESH_SECRET: 'jwt-refresh-key-12345',
    NODE_ENV: 'test',
  }), /AGENT_API_KEY/);
});

test('loadEnv parses valid configuration correctly', () => {
  const env = loadEnv({
    DATABASE_URL: 'postgresql://postgres:password@localhost:5432/ams_test',
    JWT_SECRET: 'jwt-secret-key-12345',
    JWT_REFRESH_SECRET: 'jwt-refresh-key-12345',
    PORT: '5001',
    NODE_ENV: 'test',
    AGENT_API_KEY: 'agent-secret-key-12345'
  });

  assert.equal(env.port, 5001);
  assert.equal(env.nodeEnv, 'test');
  assert.equal(env.databaseUrl, 'postgresql://postgres:password@localhost:5432/ams_test');
  assert.equal(env.jwtSecret, 'jwt-secret-key-12345');
  assert.equal(env.jwtRefreshSecret, 'jwt-refresh-key-12345');
  assert.equal(env.agentApiKey, 'agent-secret-key-12345');
});

test('GET /health/live returns 200 OK', async () => {
  const app = createApp({ databaseCheck: async () => {} });
  const server = app.listen(0);
  const address = server.address() as { port: number };

  try {
    const res = await fetch(`http://127.0.0.1:${address.port}/health/live`);
    assert.equal(res.status, 200);
    const body = await res.json() as { status: string };
    assert.equal(body.status.toLowerCase(), 'ok');
  } finally {
    server.close();
  }
});

test('GET /health/ready returns 200 when database connectivity succeeds', async () => {
  const app = createApp({ databaseCheck: async () => {} });
  const server = app.listen(0);
  const address = server.address() as { port: number };

  try {
    const res = await fetch(`http://127.0.0.1:${address.port}/health/ready`);
    assert.equal(res.status, 200);
    const body = await res.json() as { status: string };
    assert.equal(body.status.toLowerCase(), 'ready');
  } finally {
    server.close();
  }
});

test('GET /health/ready returns 503 without leaking error message when database check fails', async () => {
  const app = createApp({
    databaseCheck: async () => {
      throw new Error('Database password failed: secret123');
    }
  });
  const server = app.listen(0);
  const address = server.address() as { port: number };

  try {
    const res = await fetch(`http://127.0.0.1:${address.port}/health/ready`);
    assert.equal(res.status, 503);
    const body = await res.json() as { status: string; error?: string };
    assert.equal(body.status, 'NOT_READY');
    assert.equal(body.error, undefined);
  } finally {
    server.close();
  }
});
