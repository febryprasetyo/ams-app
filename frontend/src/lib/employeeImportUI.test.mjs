import { test } from 'node:test';
import assert from 'node:assert';
import {
  computeImportSummaryState,
  formatDepartmentNotice,
} from './employeeImportUI.mjs';

test('computeImportSummaryState returns canCommit true when errorCount is 0', () => {
  const summary = {
    totalRows: 242,
    validCount: 242,
    errorCount: 0,
    newDepartmentsCount: 2,
    newDepartments: ['CMC III', 'MARKETING'],
  };
  const state = computeImportSummaryState(summary);
  assert.strictEqual(state.canCommit, true);
  assert.strictEqual(state.badgeVariant, 'success');
  assert.strictEqual(state.headline, 'Siap Di-import');
});

test('computeImportSummaryState returns canCommit false when errorCount > 0', () => {
  const summary = {
    totalRows: 10,
    validCount: 8,
    errorCount: 2,
    newDepartmentsCount: 0,
    newDepartments: [],
  };
  const state = computeImportSummaryState(summary);
  assert.strictEqual(state.canCommit, false);
  assert.strictEqual(state.badgeVariant, 'danger');
  assert.strictEqual(state.headline, 'Terdapat Kesalahan');
});

test('formatDepartmentNotice formats plural departments correctly', () => {
  assert.strictEqual(formatDepartmentNotice([]), null);
  assert.strictEqual(
    formatDepartmentNotice(['CMC III']),
    '1 departemen baru akan otomatis dibuat: CMC III'
  );
  assert.strictEqual(
    formatDepartmentNotice(['CMC III', 'MARKETING']),
    '2 departemen baru akan otomatis dibuat: CMC III, MARKETING'
  );
});
