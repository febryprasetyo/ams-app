import { test } from 'node:test';
import assert from 'node:assert';
import { employees } from './employees';

test('employees schema has all 33 Talenta compatible columns', () => {
  // Existing
  assert.ok(employees.id);
  assert.ok(employees.employeeCode);
  assert.ok(employees.fullName);
  assert.ok(employees.email);
  assert.ok(employees.phone);
  assert.ok(employees.departmentId);
  assert.ok(employees.position);
  assert.ok(employees.status);

  // New Talenta HR Columns
  assert.ok(employees.barcode, 'barcode column should exist');
  assert.ok(employees.jobLevel, 'jobLevel column should exist');
  assert.ok(employees.joinDate, 'joinDate column should exist');
  assert.ok(employees.employmentStatus, 'employmentStatus column should exist');
  assert.ok(employees.birthDate, 'birthDate column should exist');
  assert.ok(employees.age, 'age column should exist');
  assert.ok(employees.birthPlace, 'birthPlace column should exist');
  assert.ok(employees.citizenIdAddress, 'citizenIdAddress column should exist');
  assert.ok(employees.residentialAddress, 'residentialAddress column should exist');
  assert.ok(employees.npwp, 'npwp column should exist');
  assert.ok(employees.ptkpStatus, 'ptkpStatus column should exist');
  assert.ok(employees.employeeTaxStatus, 'employeeTaxStatus column should exist');
  assert.ok(employees.bankName, 'bankName column should exist');
  assert.ok(employees.bankAccount, 'bankAccount column should exist');
  assert.ok(employees.bankAccountHolder, 'bankAccountHolder column should exist');
  assert.ok(employees.bpjsKetenagakerjaan, 'bpjsKetenagakerjaan column should exist');
  assert.ok(employees.bpjsKesehatan, 'bpjsKesehatan column should exist');
  assert.ok(employees.nikKtp, 'nikKtp column should exist');
  assert.ok(employees.mobilePhone, 'mobilePhone column should exist');
  assert.ok(employees.secondaryPhone, 'secondaryPhone column should exist');
  assert.ok(employees.religion, 'religion column should exist');
  assert.ok(employees.gender, 'gender column should exist');
  assert.ok(employees.maritalStatus, 'maritalStatus column should exist');
  assert.ok(employees.bloodType, 'bloodType column should exist');
  assert.ok(employees.nationalityCode, 'nationalityCode column should exist');
  assert.ok(employees.currency, 'currency column should exist');
  assert.ok(employees.lengthOfService, 'lengthOfService column should exist');
  assert.ok(employees.npwp16Digit, 'npwp16Digit column should exist');
});
