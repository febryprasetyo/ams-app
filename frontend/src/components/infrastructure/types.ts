// Domain types for Accurate monitoring / infrastructure page

export interface AccurateLicenseLog {
  id: number;
  serverId: number;
  serverHostname: string;
  serverIp: string;
  no: number;
  licenseKey: string;
  date: string | null;
  ip: string | null;
  version: string | null;
  host: string;
  status: string;
  scrapedAt: string | null;
}

export interface AccurateDatabaseFile {
  id: number;
  dbName: string;
  filePath: string;
  fileSizeBytes: number;
  fileSizeMb: string;
  fileSizeFormatted: string;
  status: string;
  lastModifiedAt: string | null;
  createdAt: string | null;
  reportedAt: string;
}

export interface AccurateServerMonitoring {
  id: number;
  hostname: string;
  name: string | null;
  ipAddress: string;
  os: string | null;
  macAddress: string | null;
  status: 'Online' | 'Offline';
  lastSeenAt: string | null;
  agentVersion: string | null;
  uptimeSeconds: number;
  licenseServerUrl: string | null;
  accurateStatus: string | null;
  isAccurateActive: boolean;
  isFirebirdActive: boolean;
  services: Array<{ serviceName?: string; displayName?: string; status?: string; isStarted?: boolean }>;
  processes: Array<{ processName?: string; processId?: number; workingSetMb?: number }>;
  licensesCount: number;
  activeLicensesCount: number;
  databases: AccurateDatabaseFile[];
}

export interface LicensesResponse {
  success: boolean;
  data: AccurateLicenseLog[];
  totalLicenses: number;
  activeLicenses: number;
  lastSyncedAt: string | null;
}

export interface MonitoringResponse {
  success: boolean;
  data: AccurateServerMonitoring[];
}

export interface SyncResultItem {
  hostname: string;
  success: boolean;
  licensesCount?: number;
  syncedAt?: string;
  error?: string;
}

export interface SyncResponse {
  success: boolean;
  data: AccurateLicenseLog[];
  results: SyncResultItem[];
}
