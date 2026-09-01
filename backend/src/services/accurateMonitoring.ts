export interface AccurateLicenseRowInput {
  no: number;
  licenseKey: string;
  date: string | null;
  ip: string | null;
  version: string | null;
  host: string;
  status: string;
}

export function parseAccurateLicenseJson(payload: any): AccurateLicenseRowInput[] {
  if (!payload || payload.s !== true || !Array.isArray(payload.d)) return [];

  return payload.d.map((item: any, index: number) => ({
    no: index + 1,
    licenseKey: requiredText(item?.licenseCode, 'licenseCode'),
    date: optionalText(item?.registerDateView),
    ip: optionalText(item?.ip),
    version: optionalText(item?.version),
    host: optionalText(item?.host) ?? `Seat #${index + 1}`,
    status: optionalText(item?.ip) || optionalText(item?.host) ? 'ACTIVE' : 'RELEASED',
  }));
}

export interface AccurateAgentDatabase {
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  fileSizeMb: number;
  fileSizeFormatted: string;
  lastModified: string | null;
  createdAt: string | null;
}

export interface NormalizedAgentSignal {
  hostname: string;
  ipAddress: string;
  macAddress: string | null;
  os: string | null;
  uptimeSeconds: number;
  agentVersion: string | null;
  licenseServerUrl: string;
  reportedAt: Date;
  overallStatus: string;
  isFirebirdActive: boolean;
  isAccurateActive: boolean;
  services: unknown[];
  processes: unknown[];
  databases: AccurateAgentDatabase[];
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function isPrivateIpv4(value: string): boolean {
  const parts = value.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  return parts[0] === 10
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168);
}

function parseReportedAt(value: unknown): Date {
  if (typeof value !== 'string' || value.trim() === '') return new Date();
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function normalizeAgentSignal(payload: any): NormalizedAgentSignal {
  const pc = payload?.pc ?? {};
  const service = payload?.accurateService ?? {};
  const hostname = requiredText(pc.hostname, 'pc.hostname').toUpperCase();
  const ipAddress = requiredText(pc.ipAddress, 'pc.ipAddress');
  const rawLicenseUrl = optionalText(payload?.licenseServerUrl) ?? `http://${ipAddress}:6688`;

  let licenseServerUrl: string;
  try {
    const parsed = new URL(rawLicenseUrl);
    const port = parsed.port || (parsed.protocol === 'http:' ? '80' : '443');
    if (
      parsed.protocol !== 'http:'
      || !isPrivateIpv4(ipAddress)
      || parsed.hostname !== ipAddress
      || port !== '6688'
      || parsed.username
      || parsed.password
      || parsed.pathname !== '/'
      || parsed.search
      || parsed.hash
    ) {
      throw new Error('unsafe License Server URL');
    }
    licenseServerUrl = parsed.origin;
  } catch {
    throw new Error('licenseServerUrl must be a valid HTTP URL');
  }

  const databaseInputs = Array.isArray(payload?.databases) ? payload.databases : [];
  const databases = databaseInputs.map((item: any) => ({
    fileName: requiredText(item?.fileName, 'databases[].fileName'),
    filePath: requiredText(item?.filePath, 'databases[].filePath'),
    fileSizeBytes: Number.isFinite(Number(item?.fileSizeBytes)) ? Number(item.fileSizeBytes) : 0,
    fileSizeMb: Number.isFinite(Number(item?.fileSizeMb)) ? Number(item.fileSizeMb) : 0,
    fileSizeFormatted: optionalText(item?.fileSizeFormatted) ?? '0 MB',
    lastModified: optionalText(item?.lastModified),
    createdAt: optionalText(item?.createdAt),
  }));

  return {
    hostname,
    ipAddress,
    macAddress: optionalText(pc.macAddress),
    os: optionalText(pc.os),
    uptimeSeconds: Number.isFinite(Number(pc.uptimeSeconds)) ? Math.max(0, Number(pc.uptimeSeconds)) : 0,
    agentVersion: optionalText(payload?.agentVersion),
    licenseServerUrl,
    reportedAt: parseReportedAt(payload?.timestamp ?? pc.lastSignal),
    overallStatus: optionalText(service.overallStatus) ?? 'UNKNOWN',
    isFirebirdActive: service.isFirebirdActive === true,
    isAccurateActive: service.isAccurateActive === true,
    services: Array.isArray(service.services) ? service.services : [],
    processes: Array.isArray(service.processes) ? service.processes : [],
    databases,
  };
}

export function normalizeLicenseSnapshot(
  serverId: number,
  rows: AccurateLicenseRowInput[],
  scrapedAt = new Date(),
) {
  return rows.map((row) => ({
    serverId,
    seatNo: row.no,
    licenseKey: requiredText(row.licenseKey, 'licenseKey'),
    date: optionalText(row.date),
    ip: optionalText(row.ip),
    version: optionalText(row.version),
    host: optionalText(row.host) ?? 'Unassigned',
    status: row.status.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'RELEASED',
    scrapedAt,
  }));
}

export function isHeartbeatOnline(
  lastSeenAt: Date | string | null,
  now = new Date(),
  staleAfterSeconds = 180,
): boolean {
  if (!lastSeenAt) return false;
  const lastSeen = lastSeenAt instanceof Date ? lastSeenAt : new Date(lastSeenAt);
  if (Number.isNaN(lastSeen.getTime())) return false;
  return now.getTime() - lastSeen.getTime() <= staleAfterSeconds * 1000;
}
