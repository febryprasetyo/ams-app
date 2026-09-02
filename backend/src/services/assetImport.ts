import { isComputerEquipmentType } from '../domain/assetDetails';
import type { ParsedAssetWorkbook } from './assetWorkbook';

export interface EmployeeLookup {
  id: number;
  employeeCode: string;
  fullName: string;
  locationId?: number | null;
  locationName?: string | null;
}

export interface CategoryLookup {
  id: number;
  name: string;
  codePrefix: string;
}

export interface LocationLookup {
  id: number;
  code: string;
  name: string;
}

export interface AssetImportLookups {
  employees: EmployeeLookup[];
  categories: CategoryLookup[];
  locations: LocationLookup[];
  existingAssetCodes: Set<string>;
  existingSerialNumbers: Set<string>;
}

export interface AssetImportRowMessage {
  sheet: 'Laptop-PC' | 'Other Assets' | 'Accessories';
  rowNumber: number;
  field?: string;
  type: 'error' | 'warning';
  message: string;
}

export interface ResolvedLaptopAsset {
  rowNumber: number;
  computerReference: string;
  categoryId: number;
  categoryName: string;
  categoryPrefix: string;
  assetCode?: string | null;
  name: string;
  serialNumber?: string | null;
  locationId?: number | null;
  assignedToEmployeeId?: number | null;
  assignedDate?: string | null;
  status: string;
  condition: string;
  notes?: string | null;
  computerSpecs: {
    cpuName: string;
    ramSizeGb: number;
    ramSlotCount: number;
    disk1SizeGb: number;
    disk2SizeGb?: number | null;
  };
}

export interface ResolvedOtherAsset {
  rowNumber: number;
  categoryId: number;
  categoryName: string;
  categoryPrefix: string;
  assetCode?: string | null;
  name: string;
  serialNumber?: string | null;
  assignmentType: string;
  locationId?: number | null;
  assignedToEmployeeId?: number | null;
  assignedDate?: string | null;
  status: string;
  condition: string;
  notes?: string | null;
}

export interface ResolvedAccessory {
  rowNumber: number;
  computerReference: string;
  accessoryType: string;
  description?: string | null;
  quantity: number;
  condition: string;
  notes?: string | null;
}

export interface AssetImportValidationResult {
  valid: boolean;
  summary: {
    totalRows: number;
    validRows: number;
    errorCount: number;
    warningCount: number;
    laptopPcCount: number;
    otherAssetCount: number;
    accessoryCount: number;
  };
  messages: AssetImportRowMessage[];
  resolvedData: {
    laptops: ResolvedLaptopAsset[];
    otherAssets: ResolvedOtherAsset[];
    accessories: ResolvedAccessory[];
  };
}

const VALID_CONDITIONS = new Set(['Good', 'Fair', 'Poor', 'Damaged']);

export function validateAssetImport(
  workbook: ParsedAssetWorkbook,
  lookups: AssetImportLookups,
): AssetImportValidationResult {
  const messages: AssetImportRowMessage[] = [];

  const employeeByCode = new Map<string, EmployeeLookup>();
  for (const emp of lookups.employees) {
    employeeByCode.set(emp.employeeCode.trim().toLowerCase(), emp);
  }

  const categoryByName = new Map<string, CategoryLookup>();
  for (const cat of lookups.categories) {
    categoryByName.set(cat.name.trim().toLowerCase(), cat);
    categoryByName.set(cat.codePrefix.trim().toLowerCase(), cat);
  }

  const locationByCode = new Map<string, LocationLookup>();
  for (const loc of lookups.locations) {
    locationByCode.set(loc.code.trim().toLowerCase(), loc);
  }

  const existingCodes = new Set(Array.from(lookups.existingAssetCodes).map((c) => c.trim().toUpperCase()));
  const existingSerials = new Set(Array.from(lookups.existingSerialNumbers).map((s) => s.trim().toUpperCase()));

  const seenWorkbookCodes = new Set<string>();
  const seenWorkbookSerials = new Set<string>();
  const computerReferenceSet = new Set<string>();

  const resolvedLaptops: ResolvedLaptopAsset[] = [];
  const resolvedOtherAssets: ResolvedOtherAsset[] = [];
  const resolvedAccessories: ResolvedAccessory[] = [];

  // 1. Validate Laptop-PC Rows
  for (const row of workbook.laptopPcRows) {
    const rowNum = row.rowNumber;
    let rowHasError = false;

    const effectiveCompRef = (row.computerReference || row.assetCode || '').trim();
    if (!effectiveCompRef) {
      messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Computer Reference', type: 'error', message: 'Computer Reference is required' });
      rowHasError = true;
    } else {
      const refKey = effectiveCompRef.toLowerCase();
      if (computerReferenceSet.has(refKey)) {
        messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Computer Reference', type: 'error', message: `Duplicate Computer Reference "${effectiveCompRef}" in sheet` });
        rowHasError = true;
      } else {
        computerReferenceSet.add(refKey);
      }
    }

    const devTypeNorm = (row.deviceType || '').trim().toLowerCase();
    if (!devTypeNorm || (devTypeNorm !== 'laptop' && devTypeNorm !== 'pc')) {
      messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Device Type', type: 'error', message: 'Device Type must be either "LAPTOP" or "PC"' });
      rowHasError = true;
    }

    const category =
      categoryByName.get(devTypeNorm) ||
      (devTypeNorm === 'pc' ? categoryByName.get('desktop pc') || categoryByName.get('pc') : categoryByName.get('laptop') || categoryByName.get('lpt'));
    if (!category) {
      messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Device Type', type: 'error', message: `Equipment category for "${row.deviceType}" does not exist in master data` });
      rowHasError = true;
    }

    if (!row.assetName) {
      messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Asset Name', type: 'error', message: 'Asset Name is required' });
      rowHasError = true;
    }

    if (row.assetCode) {
      const codeUpper = row.assetCode.trim().toUpperCase();
      if (existingCodes.has(codeUpper)) {
        messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Asset Code', type: 'error', message: `Asset Code "${row.assetCode}" already exists in database` });
        rowHasError = true;
      } else if (seenWorkbookCodes.has(codeUpper)) {
        messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Asset Code', type: 'error', message: `Duplicate Asset Code "${row.assetCode}" in workbook` });
        rowHasError = true;
      } else {
        seenWorkbookCodes.add(codeUpper);
      }
    }

    if (row.serialNumber) {
      const snUpper = row.serialNumber.trim().toUpperCase();
      if (existingSerials.has(snUpper)) {
        messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Serial Number', type: 'error', message: `Serial Number "${row.serialNumber}" already exists in database` });
        rowHasError = true;
      } else if (seenWorkbookSerials.has(snUpper)) {
        messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Serial Number', type: 'error', message: `Duplicate Serial Number "${row.serialNumber}" in workbook` });
        rowHasError = true;
      } else {
        seenWorkbookSerials.add(snUpper);
      }
    }

    let resolvedLocationId: number | null = null;
    let resolvedEmployeeId: number | null = null;
    let status = 'Available';

    if (row.employeeCode) {
      const emp = employeeByCode.get(row.employeeCode.trim().toLowerCase());
      if (!emp) {
        messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Employee Code', type: 'error', message: `Employee Code "${row.employeeCode}" not found` });
        rowHasError = true;
      } else {
        resolvedEmployeeId = emp.id;
        status = 'Assigned';
        if (row.employeeName && row.employeeName.trim().toLowerCase() !== emp.fullName.trim().toLowerCase()) {
          messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Employee Name', type: 'warning', message: `Employee name "${row.employeeName}" does not match master record "${emp.fullName}"` });
        }
        if (row.locationCode) {
          const loc = locationByCode.get(row.locationCode.trim().toLowerCase());
          if (!loc) {
            messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Location Code', type: 'error', message: `Location Code "${row.locationCode}" not found` });
            rowHasError = true;
          } else {
            resolvedLocationId = loc.id;
          }
        } else {
          resolvedLocationId = emp.locationId ?? null;
        }
      }
    } else {
      if (row.locationCode) {
        const loc = locationByCode.get(row.locationCode.trim().toLowerCase());
        if (!loc) {
          messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Location Code', type: 'error', message: `Location Code "${row.locationCode}" not found` });
          rowHasError = true;
        } else {
          resolvedLocationId = loc.id;
        }
      }
    }

    const cond = (row.condition || '').trim();
    if (!VALID_CONDITIONS.has(cond)) {
      messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Condition', type: 'error', message: `Condition must be one of: Good, Fair, Poor, Damaged (got "${row.condition}")` });
      rowHasError = true;
    }

    if (!row.cpuName) {
      messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'CPU Name', type: 'error', message: 'CPU Name is required' });
      rowHasError = true;
    }

    if (!row.ramSizeGb || row.ramSizeGb <= 0) {
      messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'RAM Size (GB)', type: 'error', message: 'RAM Size (GB) must be greater than 0' });
      rowHasError = true;
    }

    if (!row.ramSlotCount || row.ramSlotCount <= 0) {
      messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'RAM Slot Count', type: 'error', message: 'RAM Slot Count must be greater than 0' });
      rowHasError = true;
    }

    if (!row.disk1SizeGb || row.disk1SizeGb <= 0) {
      messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Disk 1 Size (GB)', type: 'error', message: 'Disk 1 Size (GB) must be greater than 0' });
      rowHasError = true;
    }

    if (row.disk2SizeGb !== null && row.disk2SizeGb !== undefined && row.disk2SizeGb <= 0) {
      messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Disk 2 Size (GB)', type: 'error', message: 'Disk 2 Size (GB) must be greater than 0 if provided' });
      rowHasError = true;
    }

    if (category) {
      resolvedLaptops.push({
        rowNumber: rowNum,
        computerReference: effectiveCompRef,
        categoryId: category.id,
        categoryName: category.name,
        categoryPrefix: category.codePrefix,
        assetCode: row.assetCode,
        name: row.assetName,
        serialNumber: row.serialNumber,
        locationId: resolvedLocationId,
        assignedToEmployeeId: resolvedEmployeeId,
        assignedDate: row.assignedDate,
        status,
        condition: cond || 'Good',
        notes: row.complaintNotes,
        computerSpecs: {
          cpuName: row.cpuName,
          ramSizeGb: row.ramSizeGb,
          ramSlotCount: row.ramSlotCount,
          disk1SizeGb: row.disk1SizeGb,
          disk2SizeGb: row.disk2SizeGb,
        },
      });
    }
  }

  // 2. Validate Other Assets Rows
  for (const row of workbook.otherAssetRows) {
    const rowNum = row.rowNumber;
    let rowHasError = false;

    const catNorm = (row.equipmentCategory || '').trim().toLowerCase();
    const category = categoryByName.get(catNorm);
    if (!category) {
      messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Equipment Category', type: 'error', message: `Equipment category "${row.equipmentCategory}" not found in master data` });
      rowHasError = true;
    } else if (isComputerEquipmentType(category.name)) {
      messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Equipment Category', type: 'error', message: `Equipment category "${row.equipmentCategory}" is a computer category; use the Laptop-PC sheet instead` });
      rowHasError = true;
    }

    if (!row.assetName) {
      messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Asset Name', type: 'error', message: 'Asset Name is required' });
      rowHasError = true;
    }

    if (row.assetCode) {
      const codeUpper = row.assetCode.trim().toUpperCase();
      if (existingCodes.has(codeUpper)) {
        messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Asset Code', type: 'error', message: `Asset Code "${row.assetCode}" already exists in database` });
        rowHasError = true;
      } else if (seenWorkbookCodes.has(codeUpper)) {
        messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Asset Code', type: 'error', message: `Duplicate Asset Code "${row.assetCode}" in workbook` });
        rowHasError = true;
      } else {
        seenWorkbookCodes.add(codeUpper);
      }
    }

    if (row.serialNumber) {
      const snUpper = row.serialNumber.trim().toUpperCase();
      if (existingSerials.has(snUpper)) {
        messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Serial Number', type: 'error', message: `Serial Number "${row.serialNumber}" already exists in database` });
        rowHasError = true;
      } else if (seenWorkbookSerials.has(snUpper)) {
        messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Serial Number', type: 'error', message: `Duplicate Serial Number "${row.serialNumber}" in workbook` });
        rowHasError = true;
      } else {
        seenWorkbookSerials.add(snUpper);
      }
    }

    const assignTypeNorm = (row.assignmentType || '').trim().toUpperCase();
    if (assignTypeNorm !== 'EMPLOYEE' && assignTypeNorm !== 'SHARED') {
      messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Assignment Type', type: 'error', message: 'Assignment Type must be either "EMPLOYEE" or "SHARED"' });
      rowHasError = true;
    }

    let resolvedLocationId: number | null = null;
    let resolvedEmployeeId: number | null = null;
    let status = 'Available';

    if (assignTypeNorm === 'EMPLOYEE') {
      if (!row.employeeCode) {
        messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Employee Code', type: 'error', message: 'Employee Code is required when Assignment Type is EMPLOYEE' });
        rowHasError = true;
      } else {
        const emp = employeeByCode.get(row.employeeCode.trim().toLowerCase());
        if (!emp) {
          messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Employee Code', type: 'error', message: `Employee Code "${row.employeeCode}" not found` });
          rowHasError = true;
        } else {
          resolvedEmployeeId = emp.id;
          status = 'Assigned';
          if (row.employeeName && row.employeeName.trim().toLowerCase() !== emp.fullName.trim().toLowerCase()) {
            messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Employee Name', type: 'warning', message: `Employee name "${row.employeeName}" does not match master record "${emp.fullName}"` });
          }
          if (row.locationCode) {
            const loc = locationByCode.get(row.locationCode.trim().toLowerCase());
            if (!loc) {
              messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Location Code', type: 'error', message: `Location Code "${row.locationCode}" not found` });
              rowHasError = true;
            } else {
              resolvedLocationId = loc.id;
            }
          } else {
            resolvedLocationId = emp.locationId ?? null;
          }
        }
      }
    } else if (assignTypeNorm === 'SHARED') {
      if (!row.locationCode) {
        messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Location Code', type: 'error', message: 'Location Code is required when Assignment Type is SHARED' });
        rowHasError = true;
      } else {
        const loc = locationByCode.get(row.locationCode.trim().toLowerCase());
        if (!loc) {
          messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Location Code', type: 'error', message: `Location Code "${row.locationCode}" not found` });
          rowHasError = true;
        } else {
          resolvedLocationId = loc.id;
        }
      }
    }

    const cond = (row.condition || '').trim();
    if (!VALID_CONDITIONS.has(cond)) {
      messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Condition', type: 'error', message: `Condition must be one of: Good, Fair, Poor, Damaged (got "${row.condition}")` });
      rowHasError = true;
    }

    if (category) {
      resolvedOtherAssets.push({
        rowNumber: rowNum,
        categoryId: category.id,
        categoryName: category.name,
        categoryPrefix: category.codePrefix,
        assetCode: row.assetCode,
        name: row.assetName,
        serialNumber: row.serialNumber,
        assignmentType: assignTypeNorm,
        locationId: resolvedLocationId,
        assignedToEmployeeId: resolvedEmployeeId,
        assignedDate: row.assignedDate,
        status,
        condition: cond || 'Good',
        notes: row.complaintNotes,
      });
    }
  }

  // 3. Validate Accessories Rows
  for (const row of workbook.accessoryRows) {
    const rowNum = row.rowNumber;
    let rowHasError = false;

    if (!row.computerReference) {
      messages.push({ sheet: 'Accessories', rowNumber: rowNum, field: 'Computer Reference', type: 'error', message: 'Computer Reference is required' });
      rowHasError = true;
    } else if (!computerReferenceSet.has(row.computerReference.toLowerCase())) {
      messages.push({ sheet: 'Accessories', rowNumber: rowNum, field: 'Computer Reference', type: 'error', message: `Computer Reference "${row.computerReference}" does not exist in the Laptop-PC sheet` });
      rowHasError = true;
    }

    if (!row.accessoryType) {
      messages.push({ sheet: 'Accessories', rowNumber: rowNum, field: 'Accessory Type', type: 'error', message: 'Accessory Type is required' });
      rowHasError = true;
    }

    if (!row.quantity || row.quantity <= 0) {
      messages.push({ sheet: 'Accessories', rowNumber: rowNum, field: 'Quantity', type: 'error', message: 'Quantity must be greater than 0' });
      rowHasError = true;
    }

    const cond = (row.condition || '').trim();
    if (!VALID_CONDITIONS.has(cond)) {
      messages.push({ sheet: 'Accessories', rowNumber: rowNum, field: 'Condition', type: 'error', message: `Condition must be one of: Good, Fair, Poor, Damaged (got "${row.condition}")` });
      rowHasError = true;
    }

    resolvedAccessories.push({
      rowNumber: rowNum,
      computerReference: row.computerReference.trim(),
      accessoryType: row.accessoryType,
      description: row.description,
      quantity: row.quantity,
      condition: cond || 'Good',
      notes: row.notes,
    });
  }

  const errorCount = messages.filter((m) => m.type === 'error').length;
  const warningCount = messages.filter((m) => m.type === 'warning').length;
  const totalRows = workbook.laptopPcRows.length + workbook.otherAssetRows.length + workbook.accessoryRows.length;

  return {
    valid: errorCount === 0,
    summary: {
      totalRows,
      validRows: errorCount === 0 ? totalRows : 0,
      errorCount,
      warningCount,
      laptopPcCount: workbook.laptopPcRows.length,
      otherAssetCount: workbook.otherAssetRows.length,
      accessoryCount: workbook.accessoryRows.length,
    },
    messages,
    resolvedData: {
      laptops: resolvedLaptops,
      otherAssets: resolvedOtherAssets,
      accessories: resolvedAccessories,
    },
  };
}

export interface AssetImportRepository {
  allocateCodes(prefix: string, count: number): Promise<string[]>;
  insertAsset(data: {
    assetCode: string;
    name: string;
    categoryId: number;
    locationId?: number | null;
    assignedToEmployeeId?: number | null;
    serialNumber?: string | null;
    status: string;
    condition: string;
    notes?: string | null;
  }): Promise<number>;
  insertComputerSpecs(data: {
    assetId: number;
    cpuName: string;
    ramSizeGb: number;
    ramSlotCount: number;
    disk1SizeGb: number;
    disk2SizeGb?: number | null;
  }): Promise<void>;
  insertAccessories(data: Array<{
    assetId: number;
    accessoryType: string;
    description?: string | null;
    quantity: number;
    condition: string;
    notes?: string | null;
  }>): Promise<void>;
  insertAssignmentHistory(data: {
    assetId: number;
    employeeId: number;
    assignedDate: Date;
    action: string;
    assignedByUserId: number;
    conditionOnAssignment?: string | null;
    handoverNotes?: string | null;
  }): Promise<void>;
  insertAuditLog(data: {
    action: string;
    entity: string;
    entityId: number;
    performedBy: number;
    details?: string | null;
  }): Promise<void>;
}

export interface AssetImportCommitResult {
  success: boolean;
  computersCreated: number;
  otherAssetsCreated: number;
  accessoriesCreated: number;
  totalAssetsCreated: number;
  createdAssetIds: number[];
}

export async function commitAssetImport(
  repository: AssetImportRepository,
  preview: AssetImportValidationResult,
  actor: { userId: number },
): Promise<AssetImportCommitResult> {
  if (!preview.valid || preview.messages.some((m) => m.type === 'error')) {
    throw new Error('Cannot commit invalid asset import workbook');
  }

  const { laptops, otherAssets, accessories } = preview.resolvedData;
  const createdAssetIds: number[] = [];
  const compRefToAssetId = new Map<string, number>();

  // Allocate codes for laptops without codes
  const laptopsNeedingCodes = laptops.filter((l) => !l.assetCode);
  const laptopsByPrefix = new Map<string, typeof laptops>();
  for (const lap of laptopsNeedingCodes) {
    const list = laptopsByPrefix.get(lap.categoryPrefix) || [];
    list.push(lap);
    laptopsByPrefix.set(lap.categoryPrefix, list);
  }

  const allocatedLaptopCodes = new Map<ResolvedLaptopAsset, string>();
  for (const [prefix, laps] of laptopsByPrefix.entries()) {
    const codes = await repository.allocateCodes(prefix, laps.length);
    laps.forEach((lap, idx) => allocatedLaptopCodes.set(lap, codes[idx]));
  }

  // Insert Laptops
  let computersCreated = 0;
  for (const lap of laptops) {
    const assetCode = lap.assetCode || allocatedLaptopCodes.get(lap)!;
    const assetId = await repository.insertAsset({
      assetCode,
      name: lap.name,
      categoryId: lap.categoryId,
      locationId: lap.locationId,
      assignedToEmployeeId: lap.assignedToEmployeeId,
      serialNumber: lap.serialNumber,
      status: lap.status,
      condition: lap.condition,
      notes: lap.notes,
    });

    createdAssetIds.push(assetId);
    compRefToAssetId.set(lap.computerReference.toLowerCase(), assetId);
    computersCreated++;

    // Computer specs
    await repository.insertComputerSpecs({
      assetId,
      ...lap.computerSpecs,
    });

    // Assignment history
    if (lap.assignedToEmployeeId) {
      await repository.insertAssignmentHistory({
        assetId,
        employeeId: lap.assignedToEmployeeId,
        assignedDate: lap.assignedDate ? new Date(lap.assignedDate) : new Date(),
        action: 'ASSIGNED',
        assignedByUserId: actor.userId,
        conditionOnAssignment: lap.condition,
        handoverNotes: lap.notes,
      });
    }

    // Audit log
    await repository.insertAuditLog({
      action: 'CREATE',
      entity: 'Asset',
      entityId: assetId,
      performedBy: actor.userId,
      details: JSON.stringify({ source: 'XLSX_IMPORT', assetCode, category: lap.categoryName }),
    });
  }

  // Accessories grouped by computerReference
  let accessoriesCreated = 0;
  const accessoriesByRef = new Map<string, ResolvedAccessory[]>();
  for (const acc of accessories) {
    const key = acc.computerReference.toLowerCase();
    const list = accessoriesByRef.get(key) || [];
    list.push(acc);
    accessoriesByRef.set(key, list);
  }

  for (const [key, accList] of accessoriesByRef.entries()) {
    const assetId = compRefToAssetId.get(key);
    if (!assetId) continue;

    await repository.insertAccessories(
      accList.map((a) => ({
        assetId,
        accessoryType: a.accessoryType,
        description: a.description,
        quantity: a.quantity,
        condition: a.condition,
        notes: a.notes,
      })),
    );
    accessoriesCreated += accList.length;
  }

  // Allocate codes for other assets without codes
  const othersNeedingCodes = otherAssets.filter((o) => !o.assetCode);
  const othersByPrefix = new Map<string, typeof otherAssets>();
  for (const oth of othersNeedingCodes) {
    const list = othersByPrefix.get(oth.categoryPrefix) || [];
    list.push(oth);
    othersByPrefix.set(oth.categoryPrefix, list);
  }

  const allocatedOtherCodes = new Map<ResolvedOtherAsset, string>();
  for (const [prefix, oths] of othersByPrefix.entries()) {
    const codes = await repository.allocateCodes(prefix, oths.length);
    oths.forEach((oth, idx) => allocatedOtherCodes.set(oth, codes[idx]));
  }

  // Insert Other Assets
  let otherAssetsCreated = 0;
  for (const oth of otherAssets) {
    const assetCode = oth.assetCode || allocatedOtherCodes.get(oth)!;
    const assetId = await repository.insertAsset({
      assetCode,
      name: oth.name,
      categoryId: oth.categoryId,
      locationId: oth.locationId,
      assignedToEmployeeId: oth.assignedToEmployeeId,
      serialNumber: oth.serialNumber,
      status: oth.status,
      condition: oth.condition,
      notes: oth.notes,
    });

    createdAssetIds.push(assetId);
    otherAssetsCreated++;

    // Assignment history if assigned to employee
    if (oth.assignedToEmployeeId) {
      await repository.insertAssignmentHistory({
        assetId,
        employeeId: oth.assignedToEmployeeId,
        assignedDate: oth.assignedDate ? new Date(oth.assignedDate) : new Date(),
        action: 'ASSIGNED',
        assignedByUserId: actor.userId,
        conditionOnAssignment: oth.condition,
        handoverNotes: oth.notes,
      });
    }

    // Audit log
    await repository.insertAuditLog({
      action: 'CREATE',
      entity: 'Asset',
      entityId: assetId,
      performedBy: actor.userId,
      details: JSON.stringify({ source: 'XLSX_IMPORT', assetCode, category: oth.categoryName }),
    });
  }

  return {
    success: true,
    computersCreated,
    otherAssetsCreated,
    accessoriesCreated,
    totalAssetsCreated: computersCreated + otherAssetsCreated,
    createdAssetIds,
  };
}
