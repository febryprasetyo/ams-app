import test from 'node:test';
import assert from 'node:assert/strict';
import { getTableColumns } from 'drizzle-orm';
import { goodsRequests, goodsRequestStatusLogs, goodsRequestSignedDocuments } from './goodsRequests';

test('goodsRequests schema exposes title, purpose, status, and version columns', () => {
  const columns = getTableColumns(goodsRequests);
  assert.ok(columns.title, 'title column must exist');
  assert.ok(columns.purpose, 'purpose column must exist');
  assert.ok(columns.status, 'status column must exist');
  assert.ok(columns.version, 'version column must exist');
});

test('goodsRequestStatusLogs schema exposes required audit columns', () => {
  const columns = getTableColumns(goodsRequestStatusLogs);
  assert.ok(columns.id, 'id column must exist');
  assert.ok(columns.requestId, 'requestId column must exist');
  assert.ok(columns.fromStatus, 'fromStatus column must exist');
  assert.ok(columns.toStatus, 'toStatus column must exist');
  assert.ok(columns.notes, 'notes column must exist');
  assert.ok(columns.changedBy, 'changedBy column must exist');
  assert.ok(columns.createdAt, 'createdAt column must exist');
});

test('goodsRequestSignedDocuments schema exposes archive columns', () => {
  const columns = getTableColumns(goodsRequestSignedDocuments);
  assert.ok(columns.id, 'id column must exist');
  assert.ok(columns.requestId, 'requestId column must exist');
  assert.ok(columns.storageKey, 'storageKey column must exist');
  assert.ok(columns.fileName, 'fileName column must exist');
  assert.ok(columns.size, 'size column must exist');
  assert.ok(columns.uploadedBy, 'uploadedBy column must exist');
  assert.ok(columns.createdAt, 'createdAt column must exist');
});
