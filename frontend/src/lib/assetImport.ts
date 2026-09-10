export interface AssetImportRowMessage {
  sheet: 'Laptop-PC' | 'Other Assets' | 'Accessories';
  rowNumber: number;
  field?: string;
  type: 'error' | 'warning';
  message: string;
}

export interface AssetImportSummary {
  totalRows: number;
  validRows: number;
  errorCount: number;
  warningCount: number;
  laptopPcCount: number;
  otherAssetCount: number;
  accessoryCount: number;
}

export type CustodianResolutionAction = 'REUSE' | 'CREATE_MANUAL' | 'LINK_EMPLOYEE' | 'UNASSIGNED' | 'ERROR';

export interface CustodianResolution {
  action: CustodianResolutionAction;
  holderName: string | null;
  custodianId?: number | null;
  employeeId?: number | null;
}

export interface ResolvedAssetImportRow {
  rowNumber: number;
  name: string;
  custodianResolution: CustodianResolution;
}

export interface CustodianResolutionDisplayRow {
  source: 'Laptop-PC' | 'Other Assets';
  rowNumber: number;
  assetName: string;
  action: CustodianResolutionAction;
  holderName: string | null;
}

export interface AssetImportPreview {
  valid: boolean;
  summary: AssetImportSummary;
  messages: AssetImportRowMessage[];
  resolvedData?: {
    laptops: ResolvedAssetImportRow[];
    otherAssets: ResolvedAssetImportRow[];
    accessories: unknown[];
  };
}

export interface AssetImportCommitResult {
  success: boolean;
  computersCreated: number;
  otherAssetsCreated: number;
  accessoriesCreated: number;
  totalAssetsCreated: number;
  createdAssetIds: number[];
}

export function normalizeRole(role?: string | null): string {
  return (role || '').trim().toLowerCase();
}

export function canManageAssets(roleName?: string | null): boolean {
  const role = normalizeRole(roleName);
  return role === 'superadmin' || role === 'itadmin';
}

export function canManageLifecycle(roleName?: string | null): boolean {
  const role = normalizeRole(roleName);
  return role === 'superadmin' || role === 'itadmin' || role === 'itstaff';
}

export function canCommitAssetImport(preview: AssetImportPreview | null, submitting: boolean): boolean {
  if (submitting) return false;
  if (!preview) return false;
  if (!preview.valid) return false;
  if (preview.summary.errorCount > 0) return false;
  return preview.summary.totalRows > 0;
}

export function getCustodianResolutionRows(preview: AssetImportPreview): CustodianResolutionDisplayRow[] {
  const laptops = preview.resolvedData?.laptops || [];
  const otherAssets = preview.resolvedData?.otherAssets || [];
  return [
    ...laptops.map((row) => ({
      source: 'Laptop-PC' as const,
      rowNumber: row.rowNumber,
      assetName: row.name,
      action: row.custodianResolution.action,
      holderName: row.custodianResolution.holderName,
    })),
    ...otherAssets.map((row) => ({
      source: 'Other Assets' as const,
      rowNumber: row.rowNumber,
      assetName: row.name,
      action: row.custodianResolution.action,
      holderName: row.custodianResolution.holderName,
    })),
  ];
}
