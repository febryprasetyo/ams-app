import assert from 'node:assert/strict';
import test from 'node:test';
import { employeeDetailGroups, formatEmployeeValue } from './employeeDetail.ts';

test('groups every Talenta field exactly once', () => {
  const fields = employeeDetailGroups.flatMap(group => group.fields.map(field => field.key));
  assert.equal(fields.length, 33);
  assert.equal(new Set(fields).size, 33);
});

test('formats missing optional values for the detail page', () => {
  assert.equal(formatEmployeeValue(null), 'Belum diisi');
  assert.equal(formatEmployeeValue(''), 'Belum diisi');
});
