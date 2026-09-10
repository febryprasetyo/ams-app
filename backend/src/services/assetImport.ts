import { isComputerEquipmentType } from '../domain/assetDetails';
import { findCustodianCandidates, normalizeCustodianName } from '../domain/assetCustodian';
import type { ParsedAssetWorkbook } from './assetWorkbook';

export interface EmployeeLookup {
  id: number;
  employeeCode: string;
  fullName: string;
  locationId?: number | null;
  locationName?: string | null;
}

export interface CustodianLookup {
  id: number;
  displayName: string;
  normalizedName: string;
  origin: string;
  verificationStatus: string;
  employeeId?: number | null;
  locationId?: number | null;
  locationName?: string | null;
  recordStatus: string;
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
  custodians: CustodianLookup[];
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

export interface CustodianResolution {
  action: 'REUSE' | 'CREATE_MANUAL' | 'LINK_EMPLOYEE' | 'UNASSIGNED' | 'ERROR';
  holderName: string | null;
  custodianId?: number;
  employeeId?: number;
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
  locationName?: string | null;
  custodianResolution: CustodianResolution;
  assignedDate?: string | null;
  status: string;
  condition: string;
  notes?: string | null;
  computerSpecs: {
    cpuName?: string | null;
    ramSizeGb?: number | null;
    ramSlotCount?: number | null;
    disk1SizeGb?: number | null;
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
  locationName?: string | null;
  custodianResolution: CustodianResolution;
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

function cleanHolderName(name: string): string {
  return name.trim().replace(/\s+/gu, ' ');
}

function resolveCustodianPreview(
  employeeCode: string | null | undefined,
  employeeName: string | null | undefined,
  employeesByCode: Map<string, EmployeeLookup>,
  activeCustodians: CustodianLookup[],
  context: Pick<AssetImportRowMessage, 'sheet' | 'rowNumber'>,
  messages: AssetImportRowMessage[],
): {
  resolution: CustodianResolution;
  defaultLocationId: number | null;
  defaultLocationName: string | null;
} {
  const code = employeeCode?.trim();
  const suppliedName = employeeName ? cleanHolderName(employeeName) : '';

  if (code) {
    const employee = employeesByCode.get(code.toLowerCase());
    if (!employee) {
      messages.push({ ...context, field: 'Employee Code', type: 'error', message: `Employee Code "${code}" not found` });
      return { resolution: { action: 'ERROR', holderName: suppliedName || null }, defaultLocationId: null, defaultLocationName: null };
    }

    if (suppliedName && normalizeCustodianName(suppliedName) !== normalizeCustodianName(employee.fullName)) {
      messages.push({ ...context, field: 'Employee Name', type: 'error', message: `Employee name "${suppliedName}" does not match master record "${employee.fullName}"` });
      return {
        resolution: { action: 'ERROR', holderName: suppliedName, employeeId: employee.id },
        defaultLocationId: employee.locationId ?? null,
        defaultLocationName: employee.locationName ?? null,
      };
    }

    const employeeCustodians = activeCustodians.filter((custodian) => custodian.employeeId === employee.id);
    if (employeeCustodians.length > 1) {
      messages.push({ ...context, field: 'Employee Code', type: 'error', message: `Employee Code "${code}" resolves to multiple active custodians` });
      return {
        resolution: { action: 'ERROR', holderName: employee.fullName, employeeId: employee.id },
        defaultLocationId: employee.locationId ?? null,
        defaultLocationName: employee.locationName ?? null,
      };
    }

    const existing = employeeCustodians[0];
    return {
      resolution: existing
        ? { action: 'REUSE', holderName: existing.displayName, custodianId: existing.id, employeeId: employee.id }
        : { action: 'LINK_EMPLOYEE', holderName: cleanHolderName(employee.fullName), employeeId: employee.id },
      defaultLocationId: existing?.locationId ?? employee.locationId ?? null,
      defaultLocationName: existing?.locationName ?? employee.locationName ?? null,
    };
  }

  if (!suppliedName) {
    return { resolution: { action: 'UNASSIGNED', holderName: null }, defaultLocationId: null, defaultLocationName: null };
  }

  const normalizedName = normalizeCustodianName(suppliedName);
  const exact = activeCustodians.filter((custodian) => custodian.normalizedName === normalizedName);
  if (exact.length > 1) {
    messages.push({ ...context, field: 'Employee Name', type: 'error', message: `Employee name "${suppliedName}" matches multiple active custodians` });
    return { resolution: { action: 'ERROR', holderName: suppliedName }, defaultLocationId: null, defaultLocationName: null };
  }
  if (exact.length === 1) {
    const custodian = exact[0];
    return {
      resolution: {
        action: 'REUSE',
        holderName: custodian.displayName,
        custodianId: custodian.id,
        ...(custodian.employeeId != null ? { employeeId: custodian.employeeId } : {}),
      },
      defaultLocationId: custodian.locationId ?? null,
      defaultLocationName: custodian.locationName ?? null,
    };
  }

  const similar = findCustodianCandidates(suppliedName, activeCustodians)
    .filter((custodian) => custodian.normalizedName !== normalizedName);
  if (similar.length > 0) {
    messages.push({
      ...context,
      field: 'Employee Name',
      type: 'warning',
      message: `Similar custodians exist (${similar.map((custodian) => custodian.displayName).join(', ')}); "${suppliedName}" will remain separate`,
    });
  }
  return { resolution: { action: 'CREATE_MANUAL', holderName: suppliedName }, defaultLocationId: null, defaultLocationName: null };
}

export function validateAssetImport(
  workbook: ParsedAssetWorkbook,
  lookups: AssetImportLookups,
): AssetImportValidationResult {
  const messages: AssetImportRowMessage[] = [];

  const employeeByCode = new Map<string, EmployeeLookup>();
  for (const emp of lookups.employees) {
    employeeByCode.set(emp.employeeCode.trim().toLowerCase(), emp);
  }

  const activeCustodians = lookups.custodians.filter((custodian) => custodian.recordStatus === 'ACTIVE');

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

    const holder = resolveCustodianPreview(
      row.employeeCode,
      row.employeeName,
      employeeByCode,
      activeCustodians,
      { sheet: 'Laptop-PC', rowNumber: rowNum },
      messages,
    );
    if (holder.resolution.action === 'ERROR') rowHasError = true;

    let resolvedLocationId = holder.defaultLocationId;
    let resolvedLocationName = holder.defaultLocationName;
    if (row.locationCode) {
      const loc = locationByCode.get(row.locationCode.trim().toLowerCase());
      if (!loc) {
        messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Location Code', type: 'error', message: `Location Code "${row.locationCode}" not found` });
        rowHasError = true;
      } else {
        resolvedLocationId = loc.id;
        resolvedLocationName = loc.name;
      }
    }
    const status = holder.resolution.action === 'UNASSIGNED' ? 'Available' : 'Assigned';

    const cond = (row.condition || '').trim();
    if (!VALID_CONDITIONS.has(cond)) {
      messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Condition', type: 'error', message: `Condition must be one of: Good, Fair, Poor, Damaged (got "${row.condition}")` });
      rowHasError = true;
    }

    if (row.ramSizeGb != null && row.ramSizeGb <= 0) {
      messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'RAM Size (GB)', type: 'error', message: 'RAM Size (GB) must be greater than 0 if provided' });
      rowHasError = true;
    }

    if (row.ramSlotCount != null && row.ramSlotCount <= 0) {
      messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'RAM Slot Count', type: 'error', message: 'RAM Slot Count must be greater than 0 if provided' });
      rowHasError = true;
    }

    if (row.disk1SizeGb != null && row.disk1SizeGb <= 0) {
      messages.push({ sheet: 'Laptop-PC', rowNumber: rowNum, field: 'Disk 1 Size (GB)', type: 'error', message: 'Disk 1 Size (GB) must be greater than 0 if provided' });
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
        locationName: resolvedLocationName,
        custodianResolution: holder.resolution,
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

    let holder: ReturnType<typeof resolveCustodianPreview> = {
      resolution: { action: 'UNASSIGNED', holderName: null },
      defaultLocationId: null,
      defaultLocationName: null,
    };
    if (assignTypeNorm === 'EMPLOYEE') {
      holder = resolveCustodianPreview(
        row.employeeCode,
        row.employeeName,
        employeeByCode,
        activeCustodians,
        { sheet: 'Other Assets', rowNumber: rowNum },
        messages,
      );
      if (holder.resolution.action === 'UNASSIGNED') {
        messages.push({
          sheet: 'Other Assets',
          rowNumber: rowNum,
          field: 'Employee Name',
          type: 'error',
          message: 'Employee Code or Employee Name is required when Assignment Type is EMPLOYEE',
        });
        holder.resolution = { action: 'ERROR', holderName: null };
      }
      if (holder.resolution.action === 'ERROR') rowHasError = true;
    }

    let resolvedLocationId = holder.defaultLocationId;
    let resolvedLocationName = holder.defaultLocationName;
    if (row.locationCode) {
      const loc = locationByCode.get(row.locationCode.trim().toLowerCase());
      if (!loc) {
        messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Location Code', type: 'error', message: `Location Code "${row.locationCode}" not found` });
        rowHasError = true;
      } else {
        resolvedLocationId = loc.id;
        resolvedLocationName = loc.name;
      }
    } else if (assignTypeNorm === 'SHARED') {
      messages.push({ sheet: 'Other Assets', rowNumber: rowNum, field: 'Location Code', type: 'error', message: 'Location Code is required when Assignment Type is SHARED' });
      rowHasError = true;
    }
    const status = assignTypeNorm === 'EMPLOYEE' && holder.resolution.action !== 'ERROR' ? 'Assigned' : 'Available';

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
        locationName: resolvedLocationName,
        custodianResolution: holder.resolution,
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

export interface CommittedCustodian {
  id: number;
  displayName: string;
  locationId?: number | null;
}

export interface AssetImportRepository {
  resolveEmployeeCustodian(employeeId: number): Promise<CommittedCustodian>;
  createManualCustodian(input: {
    displayName: string;
    locationId?: number | null;
    duplicateAcknowledged: true;
  }): Promise<CommittedCustodian>;
  requireActiveCustodian(custodianId: number): Promise<CommittedCustodian>;
  allocateCodes(prefix: string, count: number): Promise<string[]>;
  insertAsset(data: {
    assetCode: string;
    name: string;
    categoryId: number;
    locationId?: number | null;
    currentCustodianId?: number | null;
    serialNumber?: string | null;
    status: string;
    condition: string;
    notes?: string | null;
  }): Promise<number>;
  insertComputerSpecs(data: {
    assetId: number;
    cpuName?: string | null;
    ramSizeGb?: number | null;
    ramSlotCount?: number | null;
    disk1SizeGb?: number | null;
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
    custodianId: number;
    custodianNameSnapshot: string;
    locationNameSnapshot?: string | null;
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

type ResolvedPersonAsset = ResolvedLaptopAsset | ResolvedOtherAsset;

async function resolveCommitCustodians(
  repository: AssetImportRepository,
  rows: ResolvedPersonAsset[],
): Promise<Map<ResolvedPersonAsset, CommittedCustodian | null>> {
  const result = new Map<ResolvedPersonAsset, CommittedCustodian | null>();
  const existingById = new Map<number, Promise<CommittedCustodian>>();
  const employeeById = new Map<number, Promise<CommittedCustodian>>();
  const manualByName = new Map<string, Promise<CommittedCustodian>>();

  for (const row of rows) {
    const resolution = row.custodianResolution;
    let custodian: CommittedCustodian | null;

    switch (resolution.action) {
      case 'UNASSIGNED':
        custodian = null;
        break;
      case 'ERROR':
        throw new Error('Cannot commit invalid custodian resolution on row ' + row.rowNumber);
      case 'REUSE': {
        if (!resolution.custodianId) throw new Error('Missing custodian ID on row ' + row.rowNumber);
        let pending = existingById.get(resolution.custodianId);
        if (!pending) {
          pending = repository.requireActiveCustodian(resolution.custodianId);
          existingById.set(resolution.custodianId, pending);
        }
        custodian = await pending;
        break;
      }
      case 'LINK_EMPLOYEE': {
        if (!resolution.employeeId) throw new Error('Missing employee ID on row ' + row.rowNumber);
        let pending = employeeById.get(resolution.employeeId);
        if (!pending) {
          pending = repository.resolveEmployeeCustodian(resolution.employeeId);
          employeeById.set(resolution.employeeId, pending);
        }
        custodian = await pending;
        break;
      }
      case 'CREATE_MANUAL': {
        if (!resolution.holderName) throw new Error('Missing holder name on row ' + row.rowNumber);
        const key = normalizeCustodianName(resolution.holderName);
        let pending = manualByName.get(key);
        if (!pending) {
          pending = repository.createManualCustodian({
            displayName: resolution.holderName,
            locationId: row.locationId ?? null,
            duplicateAcknowledged: true,
          });
          manualByName.set(key, pending);
        }
        custodian = await pending;
        break;
      }
    }
    result.set(row, custodian);
  }
  return result;
}

function hasComputerSpecifications(specs: ResolvedLaptopAsset['computerSpecs']): boolean {
  return specs.cpuName != null
    || specs.ramSizeGb != null
    || specs.ramSlotCount != null
    || specs.disk1SizeGb != null
    || specs.disk2SizeGb != null;
}

export async function commitAssetImport(
  repository: AssetImportRepository,
  preview: AssetImportValidationResult,
  actor: { userId: number },
): Promise<AssetImportCommitResult> {
  if (!preview.valid || preview.messages.some((message) => message.type === 'error')) {
    throw new Error('Cannot commit invalid asset import workbook');
  }

  const { laptops, otherAssets, accessories } = preview.resolvedData;
  const committedCustodians = await resolveCommitCustodians(repository, [...laptops, ...otherAssets]);
  const createdAssetIds: number[] = [];
  const compRefToAssetId = new Map<string, number>();

  const laptopsNeedingCodes = laptops.filter((laptop) => !laptop.assetCode);
  const laptopsByPrefix = new Map<string, typeof laptops>();
  for (const laptop of laptopsNeedingCodes) {
    const list = laptopsByPrefix.get(laptop.categoryPrefix) || [];
    list.push(laptop);
    laptopsByPrefix.set(laptop.categoryPrefix, list);
  }

  const allocatedLaptopCodes = new Map<ResolvedLaptopAsset, string>();
  for (const [prefix, rows] of laptopsByPrefix.entries()) {
    const codes = await repository.allocateCodes(prefix, rows.length);
    rows.forEach((row, index) => allocatedLaptopCodes.set(row, codes[index]));
  }

  let computersCreated = 0;
  for (const laptop of laptops) {
    const custodian = committedCustodians.get(laptop) ?? null;
    const assetCode = laptop.assetCode || allocatedLaptopCodes.get(laptop)!;
    const assetId = await repository.insertAsset({
      assetCode,
      name: laptop.name,
      categoryId: laptop.categoryId,
      locationId: laptop.locationId,
      currentCustodianId: custodian?.id ?? null,
      serialNumber: laptop.serialNumber,
      status: custodian ? 'Assigned' : 'Available',
      condition: laptop.condition,
      notes: laptop.notes,
    });

    createdAssetIds.push(assetId);
    compRefToAssetId.set(laptop.computerReference.toLowerCase(), assetId);
    computersCreated++;

    if (hasComputerSpecifications(laptop.computerSpecs)) {
      await repository.insertComputerSpecs({ assetId, ...laptop.computerSpecs });
    }

    if (custodian) {
      await repository.insertAssignmentHistory({
        assetId,
        custodianId: custodian.id,
        custodianNameSnapshot: custodian.displayName,
        locationNameSnapshot: laptop.locationName ?? null,
        assignedDate: laptop.assignedDate ? new Date(laptop.assignedDate) : new Date(),
        action: 'ASSIGNED',
        assignedByUserId: actor.userId,
        conditionOnAssignment: laptop.condition,
        handoverNotes: laptop.notes,
      });
    }

    await repository.insertAuditLog({
      action: 'CREATE',
      entity: 'ASSET',
      entityId: assetId,
      performedBy: actor.userId,
      details: JSON.stringify({
        source: 'XLSX_IMPORT',
        assetCode,
        category: laptop.categoryName,
        custodianResolution: laptop.custodianResolution.action,
        custodianId: custodian?.id ?? null,
      }),
    });
  }

  let accessoriesCreated = 0;
  const accessoriesByRef = new Map<string, ResolvedAccessory[]>();
  for (const accessory of accessories) {
    const key = accessory.computerReference.toLowerCase();
    const list = accessoriesByRef.get(key) || [];
    list.push(accessory);
    accessoriesByRef.set(key, list);
  }
  for (const [key, rows] of accessoriesByRef.entries()) {
    const assetId = compRefToAssetId.get(key);
    if (!assetId) continue;
    await repository.insertAccessories(rows.map((row) => ({
      assetId,
      accessoryType: row.accessoryType,
      description: row.description,
      quantity: row.quantity,
      condition: row.condition,
      notes: row.notes,
    })));
    accessoriesCreated += rows.length;
  }

  const othersNeedingCodes = otherAssets.filter((asset) => !asset.assetCode);
  const othersByPrefix = new Map<string, typeof otherAssets>();
  for (const asset of othersNeedingCodes) {
    const list = othersByPrefix.get(asset.categoryPrefix) || [];
    list.push(asset);
    othersByPrefix.set(asset.categoryPrefix, list);
  }

  const allocatedOtherCodes = new Map<ResolvedOtherAsset, string>();
  for (const [prefix, rows] of othersByPrefix.entries()) {
    const codes = await repository.allocateCodes(prefix, rows.length);
    rows.forEach((row, index) => allocatedOtherCodes.set(row, codes[index]));
  }

  let otherAssetsCreated = 0;
  for (const asset of otherAssets) {
    const custodian = committedCustodians.get(asset) ?? null;
    const assetCode = asset.assetCode || allocatedOtherCodes.get(asset)!;
    const assetId = await repository.insertAsset({
      assetCode,
      name: asset.name,
      categoryId: asset.categoryId,
      locationId: asset.locationId,
      currentCustodianId: custodian?.id ?? null,
      serialNumber: asset.serialNumber,
      status: custodian ? 'Assigned' : 'Available',
      condition: asset.condition,
      notes: asset.notes,
    });

    createdAssetIds.push(assetId);
    otherAssetsCreated++;

    if (custodian) {
      await repository.insertAssignmentHistory({
        assetId,
        custodianId: custodian.id,
        custodianNameSnapshot: custodian.displayName,
        locationNameSnapshot: asset.locationName ?? null,
        assignedDate: asset.assignedDate ? new Date(asset.assignedDate) : new Date(),
        action: 'ASSIGNED',
        assignedByUserId: actor.userId,
        conditionOnAssignment: asset.condition,
        handoverNotes: asset.notes,
      });
    }

    await repository.insertAuditLog({
      action: 'CREATE',
      entity: 'ASSET',
      entityId: assetId,
      performedBy: actor.userId,
      details: JSON.stringify({
        source: 'XLSX_IMPORT',
        assetCode,
        category: asset.categoryName,
        custodianResolution: asset.custodianResolution.action,
        custodianId: custodian?.id ?? null,
      }),
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
