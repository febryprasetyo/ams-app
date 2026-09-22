import type { CustodianSummary } from '@/lib/assetCustodian';

export interface ComputerSpecs {
  cpuName?: string | null;
  ramSizeGb?: number | null;
  ramSlotCount?: number | null;
  disk1SizeGb?: number | null;
  disk2SizeGb?: number | null;
}

export interface AssetAccessory {
  id?: number;
  accessoryType: string;
  description?: string | null;
  quantity: number;
  condition: 'Good' | 'Fair' | 'Poor' | 'Damaged';
  notes?: string | null;
}

export interface AssetItem {
  id: number;
  assetCode: string;
  name: string;
  categoryId: number;
  categoryName: string;
  categoryCodePrefix: string;
  locationId: number | null;
  locationName: string | null;
  currentCustodianId: number | null;
  currentCustodian: CustodianSummary | null;
  assignedToEmployeeId?: number | null;
  assignedEmployeeName?: string | null;
  assignedEmployeeCode?: string | null;
  serialNumber: string | null;
  status: 'Available' | 'Assigned' | 'Maintenance' | 'Disposed' | 'Lost';
  condition: 'Good' | 'Fair' | 'Poor' | 'Damaged';
  notes: string | null;
  computerSpecs?: ComputerSpecs | null;
  accessories?: AssetAccessory[];
  createdAt: string;
  updatedAt: string;
}

export interface AssetDetail {
  id: number;
  assetCode: string;
  name: string;
  categoryId: number;
  categoryName?: string;
  categoryCodePrefix?: string;
  locationId?: number | null;
  locationName?: string | null;
  currentCustodianId?: number | null;
  currentCustodian?: CustodianSummary | null;
  assignedToEmployeeId?: number | null;
  assignedEmployeeName?: string | null;
  assignedEmployeeCode?: string | null;
  serialNumber?: string | null;
  status: 'Available' | 'Assigned' | 'Maintenance' | 'Disposed' | 'Lost';
  condition: 'Good' | 'Fair' | 'Poor' | 'Damaged';
  notes?: string | null;
  computerSpecs?: ComputerSpecs | null;
  accessories?: AssetAccessory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  codePrefix: string;
  description?: string | null;
}

export interface LocationItem {
  id: number;
  code: string;
  name: string;
}

export interface AssignmentHistoryRecord {
  id: number;
  assetId: number;
  employeeId?: number | null;
  employeeCode?: string | null;
  employeeName?: string | null;
  employeePosition?: string | null;
  departmentName?: string | null;
  assignedByUsername?: string | null;
  assignedAt: string;
  returnedAt?: string | null;
  conditionOnAssign: string;
  conditionOnReturn?: string | null;
  handoverNotes?: string | null;
  returnNotes?: string | null;
}

export interface MaintenanceRecord {
  id: number;
  assetId: number;
  maintenanceType: string;
  title: string;
  description?: string | null;
  cost: number;
  vendorId?: number | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  status: string;
  performedById?: number | null;
  performedByUsername?: string | null;
  createdAt: string;
}
