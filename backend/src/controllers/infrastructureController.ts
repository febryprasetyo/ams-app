import { Request, Response } from 'express';
import { db } from '../db';
import { accurateLicenseLogs, servers, dbBackups } from '../db/schema/infrastructure';
import { eq, desc } from 'drizzle-orm';

const DEFAULT_ACCURATE_SESSIONS = [
  {
    computerName: 'ACCURATE-FIN-01',
    ipAddress: '192.168.10.45',
    userName: 'Siti Rahma',
    licenseVariant: 'Accurate 5 Enterprise',
    loginTime: new Date(Date.now() - 2 * 3600 * 1000),
    status: 'Active',
  },
  {
    computerName: 'ACCURATE-OPS-02',
    ipAddress: '192.168.10.48',
    userName: 'Ahmad Hidayat',
    licenseVariant: 'Accurate 5 Enterprise',
    loginTime: new Date(Date.now() - 4 * 3600 * 1000),
    status: 'Active',
  },
  {
    computerName: 'ACCURATE-ACC-03',
    ipAddress: '192.168.10.52',
    userName: 'Budi Santoso',
    licenseVariant: 'Accurate 5 Enterprise',
    loginTime: new Date(Date.now() - 1 * 3600 * 1000),
    status: 'Active',
  },
  {
    computerName: 'ACCURATE-TAX-01',
    ipAddress: '192.168.10.60',
    userName: 'Dewi Lestari',
    licenseVariant: 'Accurate 5 Executive',
    loginTime: new Date(Date.now() - 30 * 60 * 1000),
    status: 'Active',
  },
];

const DEFAULT_SERVERS = [
  {
    serverCode: 'SVR-ERP-01',
    name: 'Accurate ERP Primary License & DB Server',
    ipAddress: '192.168.10.160',
    os: 'Windows Server 2019 Datacenter',
    specs: 'Intel Xeon Gold 6248R (16 Cores), 64GB RAM, 2TB NVMe RAID1',
    status: 'Online',
    notes: 'Hosts Accurate 5 License Server (Port 6688) & Firebird SQL DB',
  },
  {
    serverCode: 'SVR-DC-01',
    name: 'Primary Domain Controller & DNS',
    ipAddress: '192.168.10.10',
    os: 'Windows Server 2022 Standard',
    specs: 'Intel Xeon E-2278G (8 Cores), 32GB RAM, 500GB SSD',
    status: 'Online',
    notes: 'Active Directory Domain Controller, DNS, and DHCP Server',
  },
  {
    serverCode: 'SVR-BK-01',
    name: 'Veeam Backup & Disaster Recovery Vault',
    ipAddress: '192.168.10.20',
    os: 'Ubuntu 22.04 LTS Server',
    specs: 'AMD EPYC 7302P (16 Cores), 128GB RAM, 48TB HDD Storage Array',
    status: 'Online',
    notes: 'Automated nightly GDB backups and IT system snapshot repository',
  },
  {
    serverCode: 'SVR-APP-01',
    name: 'ITSM Platform & Middleware Server',
    ipAddress: '192.168.10.50',
    os: 'Ubuntu 24.04 LTS',
    specs: 'Virtual Machine (8 vCPU, 16GB RAM, 200GB SSD)',
    status: 'Online',
    notes: 'Hosts AMS ITSM Express/Node.js Backend and React Frontend',
  },
];

async function ensureDefaultServers() {
  const existing = await db.select().from(servers);
  if (existing.length === 0) {
    const inserted = await db.insert(servers).values(DEFAULT_SERVERS).returning();
    return inserted;
  }
  return existing;
}

async function ensureDefaultBackups(serverList: Array<{ id: number; serverCode: string | null }>) {
  const existingBackups = await db.select().from(dbBackups);
  if (existingBackups.length === 0) {
    const erpServer = serverList.find((s) => s.serverCode === 'SVR-ERP-01') || serverList[0];
    const defaultBackupsList = [
      {
        serverId: erpServer.id,
        dbName: 'ACCURATE_DB_PRIMARY.GDB',
        sizeMb: '4520.50',
        status: 'Success',
        backupPath: 'D:\\AccurateBackups\\2026-07-28_PRIMARY.GDB',
        completedAt: new Date(Date.now() - 4 * 3600 * 1000),
      },
      {
        serverId: erpServer.id,
        dbName: 'ACCURATE_DB_FINANCE.GDB',
        sizeMb: '1280.00',
        status: 'Success',
        backupPath: 'D:\\AccurateBackups\\2026-07-28_FINANCE.GDB',
        completedAt: new Date(Date.now() - 4 * 3600 * 1000),
      },
      {
        serverId: erpServer.id,
        dbName: 'ACCURATE_DB_ARCHIVE_2025.GDB',
        sizeMb: '8900.25',
        status: 'Success',
        backupPath: 'D:\\AccurateBackups\\2026-07-27_ARCHIVE.GDB',
        completedAt: new Date(Date.now() - 28 * 3600 * 1000),
      },
    ];
    const inserted = await db.insert(dbBackups).values(defaultBackupsList).returning();
    return inserted;
  }
  return existingBackups;
}

async function ensureDefaultAccurateLogs() {
  const existing = await db.select().from(accurateLicenseLogs).orderBy(desc(accurateLicenseLogs.scrapedAt));
  if (existing.length === 0) {
    await db.insert(accurateLicenseLogs).values(DEFAULT_ACCURATE_SESSIONS);
    return await db.select().from(accurateLicenseLogs).orderBy(desc(accurateLicenseLogs.scrapedAt));
  }
  return existing;
}

function parseAccurateHtml(html: string) {
  const results: Array<{ computerName: string; ipAddress: string; userName: string; loginTime: Date }> = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;

  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowContent = trMatch[1];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    const cells: string[] = [];
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const cellText = cellMatch[1].replace(/<[^>]+>/g, '').trim();
      cells.push(cellText);
    }

    if (cells.length >= 3) {
      const [c0, c1, c2, c3] = cells;
      const lower0 = c0.toLowerCase();
      const lower1 = c1.toLowerCase();
      if (lower0.includes('computer') || lower0.includes('name') || lower1.includes('ip address')) {
        continue;
      }
      if (c0 && c1) {
        const loginDate = c3 && !isNaN(Date.parse(c3)) ? new Date(c3) : new Date();
        results.push({
          computerName: c0,
          ipAddress: c1,
          userName: c2 || 'Unknown User',
          loginTime: loginDate,
        });
      }
    }
  }
  return results;
}

/**
 * POST /api/v1/infrastructure/accurate/sync
 * Syncs Accurate 5 licenses by web scraping http://192.168.10.160:6688/
 * Falls back gracefully to stored DB snapshot if unreachable.
 */
export async function syncAccurateLicenses(req: Request, res: Response) {
  const targetUrl = process.env.ACCURATE_LICENSE_SERVER_URL || 'http://192.168.10.160:6688/';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const htmlText = await response.text();
      const scrapedRows = parseAccurateHtml(htmlText);

      if (scrapedRows.length > 0) {
        await db.delete(accurateLicenseLogs);
        const inserted = await db
          .insert(accurateLicenseLogs)
          .values(
            scrapedRows.map((r) => ({
              computerName: r.computerName,
              ipAddress: r.ipAddress,
              userName: r.userName,
              licenseVariant: 'Accurate 5 Enterprise',
              loginTime: r.loginTime,
              status: 'Active',
              scrapedAt: new Date(),
            }))
          )
          .returning();

        return res.status(200).json({
          success: true,
          isLive: true,
          message: `Accurate 5 license session data synced live from ${targetUrl}`,
          data: inserted,
          syncedAt: new Date().toISOString(),
        });
      }
    }
    throw new Error('HTTP response not ok or table empty');
  } catch (err: any) {
    clearTimeout(timeoutId);

    let storedLogs = await db.select().from(accurateLicenseLogs).orderBy(desc(accurateLicenseLogs.scrapedAt));
    if (storedLogs.length === 0) {
      storedLogs = await ensureDefaultAccurateLogs();
    }

    return res.status(200).json({
      success: true,
      isLive: false,
      message: `Using stored snapshot (${targetUrl} host offline or unreachable in local subnet)`,
      data: storedLogs,
      syncedAt: storedLogs[0]?.scrapedAt || new Date().toISOString(),
    });
  }
}

/**
 * GET /api/v1/infrastructure/accurate
 * Returns active Accurate 5 sessions & license logs.
 */
export async function getAccurateLicenses(req: Request, res: Response) {
  try {
    let logs = await db.select().from(accurateLicenseLogs).orderBy(desc(accurateLicenseLogs.scrapedAt));
    if (logs.length === 0) {
      logs = await ensureDefaultAccurateLogs();
    }

    return res.status(200).json({
      success: true,
      isLive: false,
      data: logs,
      lastSyncedAt: logs[0]?.scrapedAt || new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Accurate license sessions',
      error: error.message,
    });
  }
}

/**
 * GET /api/v1/infrastructure/servers
 * Returns server infrastructure topology list.
 */
export async function getServers(req: Request, res: Response) {
  try {
    const serverList = await ensureDefaultServers();
    return res.status(200).json({
      success: true,
      data: serverList,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch server infrastructure topology',
      error: error.message,
    });
  }
}

/**
 * GET /api/v1/infrastructure/backups
 * Returns database backup logs joined with servers table.
 */
export async function getDbBackups(req: Request, res: Response) {
  try {
    const serverList = await ensureDefaultServers();
    await ensureDefaultBackups(serverList);

    const backups = await db
      .select({
        id: dbBackups.id,
        serverId: dbBackups.serverId,
        dbName: dbBackups.dbName,
        sizeMb: dbBackups.sizeMb,
        status: dbBackups.status,
        backupPath: dbBackups.backupPath,
        completedAt: dbBackups.completedAt,
        serverName: servers.name,
        serverCode: servers.serverCode,
        serverIp: servers.ipAddress,
      })
      .from(dbBackups)
      .leftJoin(servers, eq(dbBackups.serverId, servers.id))
      .orderBy(desc(dbBackups.completedAt));

    return res.status(200).json({
      success: true,
      data: backups,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch database backup logs',
      error: error.message,
    });
  }
}
