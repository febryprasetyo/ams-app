export type CustodianOrigin = 'MANUAL' | 'HRD';
export type CustodianVerificationStatus = 'UNVERIFIED' | 'VERIFIED';
export type CustodianRecordStatus = 'ACTIVE' | 'INACTIVE' | 'MERGED';

export interface CustodianSummary {
  id: number;
  displayName: string;
  normalizedName?: string;
  origin: CustodianOrigin;
  verificationStatus: CustodianVerificationStatus;
  employeeId?: number | null;
  employeeCode?: string | null;
  locationId?: number | null;
  locationName?: string | null;
  unitText?: string | null;
  notes?: string | null;
  recordStatus: CustodianRecordStatus;
  mergedIntoCustodianId?: number | null;
  assignedAssetCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeCandidate {
  id: number;
  employeeCode: string;
  fullName: string;
  locationId?: number | null;
  locationName?: string | null;
  departmentName?: string | null;
  custodianId?: number | null;
}

export interface CustodianSearchResponse {
  custodians: CustodianSummary[];
  employees: EmployeeCandidate[];
}

export interface ManualCustodianInput {
  displayName: string;
  locationId?: number | null;
  unitText?: string | null;
  notes?: string | null;
  duplicateAcknowledged?: boolean;
}

export type CustodianPickerValue =
  | { kind: 'none' }
  | { kind: 'custodian'; custodian: CustodianSummary }
  | { kind: 'manual'; newCustodian: ManualCustodianInput };

export type CustodianSelection =
  | { custodianId: number; newCustodian?: never }
  | { custodianId?: never; newCustodian: ManualCustodianInput };

export type CustodianMutationPayload = CustodianSelection | { custodianId: null } | Record<string, never>;

function optionalText(value?: string | null): string | null {
  const normalized = value?.trim() || '';
  return normalized || null;
}

export function prepareManualCustodian(
  input: ManualCustodianInput,
  options: { hasDuplicateCandidates?: boolean } = {},
): ManualCustodianInput {
  const displayName = input.displayName.trim();
  if (!displayName) throw new Error('Holder name is required.');
  if (input.locationId != null && (!Number.isInteger(input.locationId) || input.locationId <= 0)) {
    throw new Error('Select a valid holder location.');
  }
  if (options.hasDuplicateCandidates && !input.duplicateAcknowledged) {
    throw new Error('Review the possible duplicates and acknowledge creating a separate holder.');
  }

  return {
    displayName,
    locationId: input.locationId ?? null,
    unitText: optionalText(input.unitText),
    notes: optionalText(input.notes),
    duplicateAcknowledged: input.duplicateAcknowledged === true,
  };
}

export function buildCustodianSelectionPayload(
  value: CustodianPickerValue,
  options: { explicitClear?: boolean } = {},
): CustodianMutationPayload {
  if (value.kind === 'none') {
    return options.explicitClear ? { custodianId: null } : {};
  }
  if (value.kind === 'manual') {
    return { newCustodian: prepareManualCustodian(value.newCustodian) };
  }
  if (value.custodian.recordStatus !== 'ACTIVE') {
    throw new Error('Select an active custodian.');
  }
  return { custodianId: value.custodian.id };
}

export function canManageCustodians(roleName?: string | null): boolean {
  const role = (roleName || '').trim().toLowerCase().replace(/_/g, '');
  return role === 'superadmin' || role === 'itadmin';
}

export function custodianDisplayDetail(custodian: CustodianSummary): string {
  return custodian.employeeCode || custodian.unitText || custodian.locationName || 'Manual holder';
}


export interface CustodianHeldAsset {
  id: number;
  assetCode: string;
  name: string;
  categoryId: number;
  categoryName?: string | null;
  serialNumber?: string | null;
  status: string;
  condition: string;
  notes?: string | null;
  locationId?: number | null;
  locationName?: string | null;
  createdAt: string;
  computerSpecs?: {
    cpuName?: string | null;
    ramSizeGb?: number | null;
    ramSlotCount?: number | null;
    disk1SizeGb?: number | null;
    disk2SizeGb?: number | null;
  } | null;
  accessories: Array<{
    id: number;
    accessoryType: string;
    description?: string | null;
    quantity: number;
    condition: string;
  }>;
}

export interface CustodianAssetsResponse {
  custodian: CustodianSummary;
  assets: CustodianHeldAsset[];
}

export function getDefaultReconciliationMatchTab(matchesCount: number): "suggested" | "manual" {
  return matchesCount > 0 ? "suggested" : "manual";
}

export function filterEmployeeCandidates(
  employees: EmployeeCandidate[],
  search: string,
): EmployeeCandidate[] {
  const query = search.trim().toLowerCase();
  if (!query) return employees;
  return employees.filter((employee) => {
    const fullName = (employee.fullName || "").toLowerCase();
    const employeeCode = (employee.employeeCode || "").toLowerCase();
    const departmentName = (employee.departmentName || "").toLowerCase();
    return (
      fullName.includes(query) ||
      employeeCode.includes(query) ||
      departmentName.includes(query)
    );
  });
}

export function getEmployeeConflictAdvisory(employee?: EmployeeCandidate): {
  hasConflict: boolean;
  activeCustodianId: number | null;
} {
  if (!employee || employee.custodianId == null) {
    return { hasConflict: false, activeCustodianId: null };
  }
  return {
    hasConflict: true,
    activeCustodianId: employee.custodianId,
  };
}
