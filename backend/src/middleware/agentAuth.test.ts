import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createAgentAuthenticator } from './agentAuth';

async function withAgentApp(run: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.post('/signal', createAgentAuthenticator('test-agent-key'), (_req, res) => {
    res.status(202).json({ accepted: true });
  });
  const server = app.listen(0);
  const address = server.address() as { port: number };
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
  }
}

test('agent endpoint rejects a request without an agent key', async () => {
  await withAgentApp(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/signal`, { method: 'POST' });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'Invalid agent credentials' });
  });
});

test('agent endpoint accepts the configured X-Agent-Key', async () => {
  await withAgentApp(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/signal`, {
      method: 'POST',
      headers: { 'X-Agent-Key': 'test-agent-key' },
    });
    assert.equal(response.status, 202);
    assert.deepEqual(await response.json(), { accepted: true });
  });
});
