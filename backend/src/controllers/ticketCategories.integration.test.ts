import assert from 'node:assert/strict';
import test from 'node:test';
import type { Server } from 'node:http';
import { createApp } from '../app';
import { closeDatabase } from '../db';
import { createTestOperator } from '../testing/testOperator';

type ApiResult = {
  status: number;
  body: any;
};

test('GET /api/v1/tickets/categories enforces authentication and returns ticket categories', async () => {
  const app = createApp({ databaseCheck: async () => {} });
  const server = app.listen(0);
  const port = (server.address() as { port: number }).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;
  const operator = await createTestOperator();
  const token = operator.token();

  async function api(path: string, tokenHeader?: string): Promise<ApiResult> {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(tokenHeader ? { Authorization: `Bearer ${tokenHeader}` } : {}),
      },
    });
    return {
      status: response.status,
      body: await response.json(),
    };
  }

  try {
    // 1. Unauthorized request without token
    const unauthorized = await api('/tickets/categories');
    assert.equal(unauthorized.status, 401);

    // 2. Authorized request
    const authorized = await api('/tickets/categories', token);
    assert.equal(authorized.status, 200);
    assert.ok(Array.isArray(authorized.body), 'Response should be an array of categories');
    assert.ok(authorized.body.length > 0, 'Should have at least one ticket category');

    const firstCat = authorized.body[0];
    assert.ok('id' in firstCat, 'Category should have id');
    assert.ok('name' in firstCat, 'Category should have name');
    assert.ok('code' in firstCat, 'Category should have code');

    const names = authorized.body.map((c: { name: string }) => c.name);
    assert.ok(names.includes('Hardware'));
  } finally {
    await new Promise<void>((resolve) => (server as Server).close(() => resolve()));
    await operator.cleanup();
    await closeDatabase();
  }
});
