import assert from 'node:assert/strict';
import test from 'node:test';
import router from './assetRoutes';

function registeredMethods(path: string): string[] {
  const stack = (router as unknown as { stack: Array<{ route?: { path: string; methods: Record<string, boolean> } }> }).stack;
  return stack
    .filter((item) => item.route?.path === path)
    .flatMap((item) => Object.keys(item.route!.methods).filter((method) => item.route!.methods[method]));
}

test('IT equipment type routes expose complete CRUD operations', () => {
  assert.deepEqual(registeredMethods('/categories'), ['get', 'post']);
  assert.deepEqual(registeredMethods('/categories/:id'), ['put', 'delete']);
});

test('asset import routes are registered before the dynamic asset id route', () => {
  const stack = (router as unknown as { stack: Array<{ route?: { path: string; methods: Record<string, boolean> } }> }).stack;
  const paths = stack.flatMap((layer) => layer.route ? [layer.route.path] : []);
  assert.ok(paths.indexOf('/import/template') < paths.indexOf('/:id'));
  assert.ok(paths.indexOf('/import/preview') < paths.indexOf('/:id'));
  assert.ok(paths.indexOf('/import/commit') < paths.indexOf('/:id'));
});

test('asset import endpoints expose download and upload methods', () => {
  assert.deepEqual(registeredMethods('/import/template'), ['get']);
  assert.deepEqual(registeredMethods('/import/preview'), ['post']);
  assert.deepEqual(registeredMethods('/import/commit'), ['post']);
});
