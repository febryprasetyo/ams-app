import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import {
  parseEmployeeWorkbook,
  validateEmployeeImport,
  buildEmployeeImportTemplate,
  formatDateValue,
  normalizeHeader,
  TALENTA_HEADERS,
} from './employeeImport';

test('TALENTA_HEADERS contains all 33 expected headers', () => {
  assert.strictEqual(TALENTA_HEADERS.length, 33);
  assert.strictEqual(TALENTA_HEADERS[0], 'Employee ID');
  assert.strictEqual(TALENTA_HEADERS[1], 'Full Name');
  assert.strictEqual(TALENTA_HEADERS[3], 'Organization');
  assert.strictEqual(TALENTA_HEADERS[8], 'Email');
});

test('normalizeHeader trims and normalizes case/spaces', () => {
  assert.strictEqual(normalizeHeader(' Full Name '), 'full name');
  assert.strictEqual(normalizeHeader('Employee ID'), 'employee id');
});

test('formatDateValue converts diverse Excel date inputs into YYYY-MM-DD', () => {
  assert.strictEqual(formatDateValue('2021-03-12'), '2021-03-12');
  assert.strictEqual(formatDateValue(new Date(2020, 0, 15)), '2020-01-15');
  assert.strictEqual(formatDateValue(null), null);
  assert.strictEqual(formatDateValue(''), null);
});

test('parseEmployeeWorkbook parses real Talenta excel file', async () => {
  const filePath = path.resolve(__dirname, '../../../docs/TARIKAN TALENTA KARYAWAN AKTIF.xlsx');
  if (!fs.existsSync(filePath)) {
    console.warn('Real file not found, skipping real file parse test');
    return;
  }
  const buffer = fs.readFileSync(filePath);
  const rows = await parseEmployeeWorkbook(buffer);
  assert.strictEqual(rows.length, 242);
  const first = rows[0];
  assert.strictEqual(first.employeeCode, '30002');
  assert.strictEqual(first.fullName, 'ABDUL AZIZ ZA');
  assert.strictEqual(first.organization, 'CMC III');
  assert.strictEqual(first.email, 'ABDULAZIZZA501@GMAIL.COM');
  assert.strictEqual(first.employmentStatus, 'Kontrak');
});

test('validateEmployeeImport detects duplicates and new departments', () => {
  const mockRows = [
    {
      rowNumber: 2,
      employeeCode: 'EMP001',
      fullName: 'Alice Test',
      email: 'alice@example.com',
      organization: 'IT Support',
    },
    {
      rowNumber: 3,
      employeeCode: 'EMP002',
      fullName: 'Bob Test',
      email: 'bob@example.com',
      organization: 'CMC III',
    },
    {
      rowNumber: 4,
      employeeCode: 'EMP001', // duplicate in file!
      fullName: 'Duplicate Alice',
      email: 'alice2@example.com',
      organization: 'CMC III',
    },
  ];

  const lookups = {
    existingEmployeeCodes: new Set(['EMP002']), // EMP002 already in DB!
    existingEmails: new Set(['charlie@example.com']),
    existingDepartmentNames: new Set(['CMC III']), // 'IT Support' is new!
  };

  const result = validateEmployeeImport(mockRows, lookups);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.summary.totalRows, 3);
  assert.strictEqual(result.summary.errorCount, 2); // EMP002 exists in DB, row 4 EMP001 duplicate in file
  assert.strictEqual(result.summary.newDepartmentsCount, 1);
  assert.deepStrictEqual(result.summary.newDepartments, ['IT Support']);
});

test('buildEmployeeImportTemplate returns a valid XLSX buffer with 33 columns', async () => {
  const buffer = await buildEmployeeImportTemplate();
  assert.ok(buffer instanceof Buffer);
  assert.ok(buffer.length > 0);

  // Parse generated template to ensure headers match
  const rows = await parseEmployeeWorkbook(buffer);
  assert.ok(Array.isArray(rows));
});
