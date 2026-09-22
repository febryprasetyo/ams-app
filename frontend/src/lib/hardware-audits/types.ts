export interface HardwareAuditPeripheral {
  id?: number;
  auditId?: number;
  category: string;
  presetCategory?: string | null;
  customCategory?: string | null;
  brandModel: string;
  serialNumber?: string | null;
}

export interface CandidateAsset {
  id: number;
  assetCode: string;
  name: string;
  serialNumber: string | null;
  categoryName: string;
  hasComputerSpecs: boolean;
  custodianName: string | null;
}

export interface HardwareAuditItem {
  id: number;
  custodianName: string;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  cpuName: string | null;
  ramSizeGb: number | null;
  ramSlotCount: number | null;
  disk1SizeGb: number | null;
  disk2SizeGb: number | null;
  rawSpecs: any;
  notes: string | null;
  status: 'PENDING' | 'SYNCED_AUTO' | 'SYNCED_MANUAL' | 'DISMISSED';
  matchedAssetId: number | null;
  matchedAsset?: {
    id: number;
    assetCode: string;
    name: string;
    serialNumber?: string | null;
  } | null;
  candidateAssets?: CandidateAsset[];
  peripherals?: HardwareAuditPeripheral[];
  hasPeripheral?: boolean;
  scannedAt: string;
  createdAt: string;
}

export interface CategoryOption {
  id: number;
  name: string;
  codePrefix?: string;
  code?: string;
}

export interface LocationOption {
  id: number;
  name: string;
}

export interface AllAssetOption {
  id: number;
  assetCode: string;
  name: string;
  serialNumber: string | null;
  currentCustodianId: number | null;
  assignedEmployeeName?: string | null;
  custodianName?: string | null;
  categoryName?: string;
  computerSpecs?: any;
}

export function isGenericOrPlaceholderSerial(serial?: string | null): boolean {
  if (!serial) return true;
  const s = serial.trim().toLowerCase();
  const placeholders = [
    'unknown',
    'none',
    'null',
    '-',
    '--',
    'default string',
    'system serial number',
    'to be filled by o.e.m.',
    'to be filled by o.e.m',
    'chassis serial number',
    'invalid',
    'not applicable',
    'n/a',
    'na',
    '0',
    '123456789',
  ];
  return placeholders.includes(s) || s.length < 3;
}
