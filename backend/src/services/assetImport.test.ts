import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateAssetImport,
  commitAssetImport,
  type AssetImportLookups,
  type AssetImportRepository,
} from './assetImport';
import type { ParsedAssetWorkbook } from './assetWorkbook';

const mockLookups: AssetImportLookups = {
  employees: [
    { id: 101, employeeCode: 'EMP001', fullName: 'John Doe', locationId: 1, locationName: 'Jakarta HQ' },
    { id: 102, employeeCode: 'EMP002', fullName: 'Jane Smith', locationId: 2, locationName: 'Surabaya Branch' },
  ],
  categories: [
    { id: 1, name: 'Laptop', codePrefix: 'LPT' },
    { id: 2, name: 'PC', codePrefix: 'PC' },
    { id: 3, name: 'Printer', codePrefix: 'PRN' },
    { id: 4, name: 'Monitor', codePrefix: 'MON' },
  ],
  locations: [
    { id: 1, code: 'JKT-HQ', name: 'Jakarta HQ' },
    { id: 2, code: 'SBY-BR', name: 'Surabaya Branch' },
  ],
  existingAssetCodes: new Set(['AST-LPT-2026-0001']),
  existingSerialNumbers: new Set(['EXISTING_SN']),
};

const validWorkbook: ParsedAssetWorkbook = {
  laptopPcRows: [
    {
      rowNumber: 2,
      computerReference: 'COMP-01',
      deviceType: 'LAPTOP',
      assetCode: null,
      assetName: 'ThinkPad T14 Gen 2',
      serialNumber: 'SN-TP-001',
      locationCode: 'JKT-HQ',
      employeeCode: 'EMP001',
      employeeName: 'John Doe',
      assignedDate: '2026-02-01',
      condition: 'Good',
      cpuName: 'Intel Core i7-1165G7',
      ramSizeGb: 16,
      ramSlotCount: 2,
      disk1SizeGb: 512,
      disk2SizeGb: null,
      complaintNotes: null,
      raw: {},
    },
  ],
  otherAssetRows: [
    {
      rowNumber: 2,
      equipmentCategory: 'Printer',
      assetCode: null,
      assetName: 'HP LaserJet Pro',
      serialNumber: 'SN-HP-001',
      assignmentType: 'SHARED',
      locationCode: 'JKT-HQ',
      employeeCode: null,
      employeeName: null,
      assignedDate: null,
      condition: 'Good',
      complaintNotes: null,
      raw: {},
    },
  ],
  accessoryRows: [
    {
      rowNumber: 2,
      computerReference: 'COMP-01',
      accessoryType: 'Mouse',
      description: 'Logitech B100',
      quantity: 1,
      condition: 'Good',
      notes: null,
      raw: {},
    },
  ],
};

test('validates references and passes clean workbook', () => {
  const result = validateAssetImport(validWorkbook, mockLookups);
  assert.equal(result.valid, true);
  assert.equal(result.summary.errorCount, 0);
  assert.equal(result.summary.laptopPcCount, 1);
  assert.equal(result.summary.otherAssetCount, 1);
  assert.equal(result.summary.accessoryCount, 1);
});

test('employee code as authority produces warning when employee name differs', () => {
  const wb: ParsedAssetWorkbook = {
    ...validWorkbook,
    laptopPcRows: [
      {
        ...validWorkbook.laptopPcRows[0],
        employeeName: 'Johnny Doe', // differs from John Doe
      },
    ],
  };
  const result = validateAssetImport(wb, mockLookups);
  assert.equal(result.valid, true);
  assert.equal(result.summary.warningCount, 1);
  assert.match(result.messages[0].message, /Employee name/i);
});

test('invalid accessory parents flag errors', () => {
  const wb: ParsedAssetWorkbook = {
    ...validWorkbook,
    accessoryRows: [
      {
        ...validWorkbook.accessoryRows[0],
        computerReference: 'COMP-999', // does not exist in laptopPcRows
      },
    ],
  };
  const result = validateAssetImport(wb, mockLookups);
  assert.equal(result.valid, false);
  assert.ok(result.messages.some((m) => m.type === 'error' && m.message.includes('COMP-999')));
});

test('duplicate asset codes and serials are rejected', () => {
  const wb: ParsedAssetWorkbook = {
    ...validWorkbook,
    laptopPcRows: [
      {
        ...validWorkbook.laptopPcRows[0],
        assetCode: 'AST-LPT-2026-0001', // existing in DB
        serialNumber: 'EXISTING_SN', // existing in DB
      },
    ],
  };
  const result = validateAssetImport(wb, mockLookups);
  assert.equal(result.valid, false);
  assert.ok(result.messages.some((m) => m.type === 'error' && m.message.includes('Asset Code')));
  assert.ok(result.messages.some((m) => m.type === 'error' && m.message.includes('Serial Number')));
});

function createRecordingImportRepository() {
  const calls: Array<{ type: string; payload: unknown }> = [];
  let idCounter = 1;
  const repository: AssetImportRepository = {
    allocateCodes: async (prefix, count) => {
      const year = new Date().getFullYear();
      return Array.from({ length: count }, (_, i) => `${prefix}-${year}-${String(i + 1).padStart(4, '0')}`);
    },
    insertAsset: async (data) => {
      const id = idCounter++;
      calls.push({ type: 'asset', payload: { id, ...data } });
      return id;
    },
    insertComputerSpecs: async (data) => {
      calls.push({ type: 'computerSpecs', payload: data });
    },
    insertAccessories: async (data) => {
      calls.push({ type: 'accessories', payload: data });
    },
    insertAssignmentHistory: async (data) => {
      calls.push({ type: 'assignmentHistory', payload: data });
    },
    insertAuditLog: async (data) => {
      calls.push({ type: 'auditLog', payload: data });
    },
  };
  return { calls, repository };
}

test('commit creates computer, specs, accessories, assignment, and audit in one transaction', async () => {
  const { calls, repository } = createRecordingImportRepository();
  const validation = validateAssetImport(validWorkbook, mockLookups);
  const result = await commitAssetImport(repository, validation, { userId: 1 });

  assert.equal(result.success, true);
  assert.equal(result.computersCreated, 1);
  assert.equal(result.otherAssetsCreated, 1);
  assert.equal(result.accessoriesCreated, 1);
  assert.equal(result.totalAssetsCreated, 2);

  const callTypes = calls.map((c) => c.type);
  assert.ok(callTypes.includes('asset'));
  assert.ok(callTypes.includes('computerSpecs'));
  assert.ok(callTypes.includes('accessories'));
  assert.ok(callTypes.includes('assignmentHistory'));
  assert.ok(callTypes.includes('auditLog'));
});
