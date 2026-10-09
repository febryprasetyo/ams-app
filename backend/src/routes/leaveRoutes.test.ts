import { test } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import leaveRoutes from './leaveRoutes';

test('leave routes register expected endpoints', () => {
  const router = leaveRoutes;
  const routes = router.stack
    .filter((layer: any) => layer.route)
    .map((layer: any) => ({
      path: layer.route.path,
      method: Object.keys(layer.route.methods)[0].toUpperCase(),
    }));

  const paths = routes.map((r: any) => `${r.method} ${r.path}`);
  assert.ok(paths.includes('GET /balance-summary'), 'GET /balance-summary must exist');
  assert.ok(paths.includes('POST /calculate-days'), 'POST /calculate-days must exist');
  assert.ok(paths.includes('POST /requests'), 'POST /requests must exist');
  assert.ok(paths.includes('GET /requests/:id'), 'GET /requests/:id must exist');
  assert.ok(paths.includes('GET /requests'), 'GET /requests must exist');
  assert.ok(paths.includes('GET /holidays'), 'GET /holidays must exist');
});
