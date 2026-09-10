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
  custodians: [
    {
      id: 201,
      displayName: 'John Doe',
      normalizedName: 'john doe',
      origin: 'HRD',
      verificationStatus: 'VERIFIED',
      employeeId: 101,
      locationId: 1,
      locationName: 'Jakarta HQ',
      recordStatus: 'ACTIVE',
    },
    {
      id: 202,
      displayName: 'Manual Holder',
      normalizedName: 'manual holder',
      origin: 'MANUAL',
      verificationStatus: 'UNVERIFIED',
      employeeId: null,
      locationId: 2,
      locationName: 'Surabaya Branch',
      recordStatus: 'ACTIVE',
    },
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
  assert.deepEqual(result.resolvedData.laptops[0].custodianResolution, {
    action: 'REUSE',
    holderName: 'John Doe',
    custodianId: 201,
    employeeId: 101,
  });
});

test('employee code and name conflict is an error instead of silently assigning the coded employee', () => {
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
  assert.equal(result.valid, false);
  assert.equal(result.summary.errorCount, 1);
  assert.equal(result.resolvedData.laptops[0].custodianResolution.action, 'ERROR');
  assert.match(result.messages[0].message, /does not match/i);
});

test('valid employee code proposes an explicit verified custodian resolution when none exists', () => {
  const wb: ParsedAssetWorkbook = {
    ...validWorkbook,
    laptopPcRows: [{
      ...validWorkbook.laptopPcRows[0],
      employeeCode: 'EMP002',
      employeeName: '  JANE   SMITH ',
      locationCode: null,
    }],
  };

  const result = validateAssetImport(wb, mockLookups);

  assert.equal(result.valid, true);
  assert.deepEqual(result.resolvedData.laptops[0].custodianResolution, {
    action: 'LINK_EMPLOYEE',
    holderName: 'Jane Smith',
    employeeId: 102,
  });
  assert.equal(result.resolvedData.laptops[0].locationId, 2);
});

test('normalized name alone reuses one exact active custodian without asserting an HR identity', () => {
  const wb: ParsedAssetWorkbook = {
    ...validWorkbook,
    laptopPcRows: [{
      ...validWorkbook.laptopPcRows[0],
      employeeCode: null,
      employeeName: '  MANUAL   HOLDER ',
      locationCode: null,
    }],
  };

  const result = validateAssetImport(wb, mockLookups);

  assert.equal(result.valid, true);
  assert.deepEqual(result.resolvedData.laptops[0].custodianResolution, {
    action: 'REUSE',
    holderName: 'Manual Holder',
    custodianId: 202,
  });
  assert.equal(result.resolvedData.laptops[0].locationId, 2);
});

test('name alone never links an employee and instead proposes a manual custodian', () => {
  const wb: ParsedAssetWorkbook = {
    ...validWorkbook,
    laptopPcRows: [{
      ...validWorkbook.laptopPcRows[0],
      employeeCode: null,
      employeeName: 'Jane Smith',
      locationCode: null,
    }],
  };

  const result = validateAssetImport(wb, mockLookups);

  assert.equal(result.valid, true);
  assert.deepEqual(result.resolvedData.laptops[0].custodianResolution, {
    action: 'CREATE_MANUAL',
    holderName: 'Jane Smith',
  });
});

test('similar names warn but remain a separate manual custodian proposal', () => {
  const wb: ParsedAssetWorkbook = {
    ...validWorkbook,
    laptopPcRows: [{
      ...validWorkbook.laptopPcRows[0],
      employeeCode: null,
      employeeName: 'Manual Holdar',
    }],
  };

  const result = validateAssetImport(wb, mockLookups);

  assert.equal(result.valid, true);
  assert.equal(result.resolvedData.laptops[0].custodianResolution.action, 'CREATE_MANUAL');
  assert.ok(result.messages.some((message) => message.type === 'warning' && /similar/i.test(message.message)));
});

test('ambiguous exact active custodian names are rejected', () => {
  const duplicate = {
    ...mockLookups.custodians[1],
    id: 203,
  };
  const wb: ParsedAssetWorkbook = {
    ...validWorkbook,
    laptopPcRows: [{
      ...validWorkbook.laptopPcRows[0],
      employeeCode: null,
      employeeName: 'manual holder',
    }],
  };

  const result = validateAssetImport(wb, {
    ...mockLookups,
    custodians: [...mockLookups.custodians, duplicate],
  });

  assert.equal(result.valid, false);
  assert.equal(result.resolvedData.laptops[0].custodianResolution.action, 'ERROR');
  assert.ok(result.messages.some((message) => message.type === 'error' && /multiple active custodians/i.test(message.message)));
});

test('blank holder data leaves a laptop unassigned', () => {
  const wb: ParsedAssetWorkbook = {
    ...validWorkbook,
    laptopPcRows: [{
      ...validWorkbook.laptopPcRows[0],
      employeeCode: null,
      employeeName: null,
      assignedDate: null,
    }],
  };

  const result = validateAssetImport(wb, mockLookups);

  assert.equal(result.valid, true);
  assert.deepEqual(result.resolvedData.laptops[0].custodianResolution, {
    action: 'UNASSIGNED',
    holderName: null,
  });
  assert.equal(result.resolvedData.laptops[0].status, 'Available');
});

test('other assets accept a manual holder name without HR data', () => {
  const wb: ParsedAssetWorkbook = {
    ...validWorkbook,
    laptopPcRows: [],
    accessoryRows: [],
    otherAssetRows: [{
      ...validWorkbook.otherAssetRows[0],
      assignmentType: 'EMPLOYEE',
      employeeCode: null,
      employeeName: 'Warehouse Contractor',
    }],
  };

  const result = validateAssetImport(wb, { ...mockLookups, employees: [] });

  assert.equal(result.valid, true);
  assert.deepEqual(result.resolvedData.otherAssets[0].custodianResolution, {
    action: 'CREATE_MANUAL',
    holderName: 'Warehouse Contractor',
  });
  assert.equal(result.resolvedData.otherAssets[0].status, 'Assigned');
});

test('laptop hardware specifications may be blank or partially populated', () => {
  const blankSpecs: ParsedAssetWorkbook = {
    ...validWorkbook,
    laptopPcRows: [{
      ...validWorkbook.laptopPcRows[0],
      cpuName: null,
      ramSizeGb: null,
      ramSlotCount: null,
      disk1SizeGb: null,
      disk2SizeGb: null,
    }],
  };
  const partialSpecs: ParsedAssetWorkbook = {
    ...validWorkbook,
    laptopPcRows: [{
      ...validWorkbook.laptopPcRows[0],
      cpuName: 'Intel Core i5',
      ramSizeGb: null,
      ramSlotCount: 2,
      disk1SizeGb: null,
      disk2SizeGb: 512,
    }],
  };

  assert.equal(validateAssetImport(blankSpecs, mockLookups).valid, true);
  assert.equal(validateAssetImport(partialSpecs, mockLookups).valid, true);
});

test('supplied laptop hardware numeric values must be positive', () => {
  const wb: ParsedAssetWorkbook = {
    ...validWorkbook,
    laptopPcRows: [{
      ...validWorkbook.laptopPcRows[0],
      ramSizeGb: 0,
      disk1SizeGb: -1,
    }],
  };

  const result = validateAssetImport(wb, mockLookups);

  assert.equal(result.valid, false);
  assert.ok(result.messages.some((message) => message.field === 'RAM Size (GB)'));
  assert.ok(result.messages.some((message) => message.field === 'Disk 1 Size (GB)'));
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
    resolveEmployeeCustodian: async (employeeId) => ({
      id: 300 + employeeId,
      displayName: employeeId === 102 ? 'Jane Smith' : 'John Doe',
      locationId: employeeId === 102 ? 2 : 1,
      locationName: employeeId === 102 ? 'Surabaya Branch' : 'Jakarta HQ',
    }),
    createManualCustodian: async (input) => {
      const custodian = {
        id: idCounter++,
        displayName: input.displayName,
        locationId: input.locationId ?? null,
        locationName: input.locationId === 1 ? 'Jakarta HQ' : input.locationId === 2 ? 'Surabaya Branch' : null,
      };
      calls.push({ type: 'custodian', payload: { ...custodian, duplicateAcknowledged: input.duplicateAcknowledged } });
      return custodian;
    },
    requireActiveCustodian: async (custodianId) => {
      const custodian = mockLookups.custodians.find((item) => item.id === custodianId);
      if (!custodian) throw new Error('Custodian is no longer active');
      return custodian;
    },
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

  const asset = calls.find((call) => call.type === 'asset')!.payload as Record<string, unknown>;
  assert.equal(asset.currentCustodianId, 201);
  assert.equal(Object.hasOwn(asset, 'assignedToEmployeeId'), false);

  const history = calls.find((call) => call.type === 'assignmentHistory')!.payload as Record<string, unknown>;
  assert.equal(history.custodianId, 201);
  assert.equal(history.custodianNameSnapshot, 'John Doe');
  assert.equal(history.locationNameSnapshot, 'Jakarta HQ');
});

test('commit creates one manual custodian for repeated normalized names across asset sheets', async () => {
  const { calls, repository } = createRecordingImportRepository();
  const wb: ParsedAssetWorkbook = {
    ...validWorkbook,
    laptopPcRows: [{
      ...validWorkbook.laptopPcRows[0],
      employeeCode: null,
      employeeName: '  Contract   Holder ',
    }],
    otherAssetRows: [{
      ...validWorkbook.otherAssetRows[0],
      assignmentType: 'EMPLOYEE',
      employeeCode: null,
      employeeName: 'Contract Holder',
    }],
  };
  const validation = validateAssetImport(wb, mockLookups);

  const result = await commitAssetImport(repository, validation, { userId: 41 });

  assert.equal(result.totalAssetsCreated, 2);
  const custodianCalls = calls.filter((call) => call.type === 'custodian');
  assert.equal(custodianCalls.length, 1);
  assert.equal((custodianCalls[0].payload as any).duplicateAcknowledged, true);
  const assetCustodianIds = calls
    .filter((call) => call.type === 'asset')
    .map((call) => (call.payload as any).currentCustodianId);
  assert.deepEqual(assetCustodianIds, [1, 1]);
  assert.equal(calls.filter((call) => call.type === 'assignmentHistory').length, 2);
});

test('commit rejects a stale reuse decision before inserting assets', async () => {
  const { calls, repository } = createRecordingImportRepository();
  repository.requireActiveCustodian = async () => {
    throw new Error('Custodian is no longer active');
  };
  const validation = validateAssetImport(validWorkbook, mockLookups);

  await assert.rejects(
    () => commitAssetImport(repository, validation, { userId: 1 }),
    /no longer active/i,
  );
  assert.equal(calls.some((call) => call.type === 'asset'), false);
});
