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

export interface AssetImportPreview {
  valid: boolean;
  summary: AssetImportSummary;
  messages: AssetImportRowMessage[];
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
