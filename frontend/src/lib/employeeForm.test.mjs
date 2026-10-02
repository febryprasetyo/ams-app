import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEmployeePayload, calculateTalentaDuration } from './employeeForm.ts';

test('buildEmployeePayload defaults blank Barcode to Employee ID and normalizes optional blanks', () => {
  const payload = buildEmployeePayload({
    employeeCode: 'EMP-001',
    fullName: 'Ayu',
    departmentId: 7,
    employmentStatus: 'Tetap',
    barcode: '',
    email: '',
    npwp: '',
  });

  assert.equal(payload.barcode, 'EMP-001');
  assert.equal(payload.email, null);
  assert.equal(payload.npwp, null);
  assert.equal(payload.departmentId, 7);
});

test('calculateTalentaDuration computes exact duration format matching Talenta', () => {
  const ref = new Date(2026, 8, 26); // 2026-09-26
  assert.equal(calculateTalentaDuration('1995-08-14', ref), '31 Year 1 Month 12 Day');
  assert.equal(calculateTalentaDuration('2017-10-11', ref), '8 Year 11 Month 15 Day');
  assert.equal(calculateTalentaDuration('2021-03-12', ref), '5 Year 6 Month 14 Day');
  assert.equal(calculateTalentaDuration(''), '');
  assert.equal(calculateTalentaDuration(null), '');
});

test('buildEmployeePayload automatically populates age and lengthOfService if blank', () => {
  const payload = buildEmployeePayload({
    employeeCode: 'EMP-001',
    fullName: 'Ayu',
    departmentId: 7,
    employmentStatus: 'Tetap',
    birthDate: '1995-08-14',
    joinDate: '2021-03-12',
  });

  assert.ok(payload.age && payload.age.includes('Year'));
  assert.ok(payload.lengthOfService && payload.lengthOfService.includes('Year'));
});
