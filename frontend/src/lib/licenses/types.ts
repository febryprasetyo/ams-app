export interface Vendor {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  fullName: string;
  employeeCode: string;
  email?: string;
  position?: string;
}

export interface Asset {
  id: number;
  name: string;
  assetCode: string;
  serialNumber?: string;
  status?: string;
}

export interface LocationItem {
  id: number;
  name: string;
  code: string;
}

export interface SoftwareLicense {
  id: number;
  name: string;
  licenseKey?: string | null;
  licenseType?: string | null; // 'CD / Dongle', 'OEM Bundled', 'Subscription', 'Perpetual'
  vendorId?: number | null;
  vendorName?: string | null;
  locationId?: number | null;
  locationName?: string | null;
  locationCode?: string | null;
  totalSeats: number;
  usedSeats: number;
  purchaseDate?: string | null;
  expirationDate?: string | null;
  cost?: string | number | null;
  status: string; // 'Active', 'Expired', 'Deactivated'
  notes?: string | null;
  createdAt?: string;
}

export interface LicenseAllocation {
  id: number;
  licenseId: number;
  employeeId?: number | null;
  employeeName?: string | null;
  employeeCode?: string | null;
  employeeEmail?: string | null;
  employeePosition?: string | null;
  assetId?: number | null;
  assetName?: string | null;
  assetCode?: string | null;
  assetSerialNumber?: string | null;
  allocatedAt: string;
  notes?: string | null;
}

export interface SoftwareLicenseDetail extends SoftwareLicense {
  allocations: LicenseAllocation[];
}
