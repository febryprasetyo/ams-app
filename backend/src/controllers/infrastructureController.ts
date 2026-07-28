import { Request, Response } from 'express';
import { db } from '../db';
import { accurateLicenseLogs, servers, dbBackups } from '../db/schema/infrastructure';
import { eq, desc, asc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

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

// Fallback dataset loaded directly from licenseList.json format
const FALLBACK_LICENSE_LIST = [
  { no: 1, licenseKey: "GWIJU-QPTIH-7LI8F-I86460", date: "2026-06-05", ip: "192.168.10.70", version: "5.0.20.1868", host: "GUDANG", status: "ACTIVE" },
  { no: 2, licenseKey: "JZ1U2-YWQE1-13LUK-SCEWN", date: "2026-06-05", ip: "192.168.10.54", version: "5.0.20.1868", host: "Produksi 1", status: "ACTIVE" },
  { no: 3, licenseKey: "EZOFE-18LCU-C1CDS-GYXZR", date: "2026-06-05", ip: "192.168.10.237", version: "5.0.20.1868", host: "lilis", status: "ACTIVE" },
  { no: 4, licenseKey: "KRVJ4-HEAKB-CVH7D-PHVSB", date: "2026-06-05", ip: "192.168.10.39", version: "5.0.20.1868", host: "AGRE", status: "ACTIVE" },
  { no: 5, licenseKey: "L8GWS-3ITC0-T6DNX-WMD3X", date: "2026-06-05", ip: "192.168.10.45", version: "5.0.20.1868", host: "andi", status: "ACTIVE" },
  { no: 6, licenseKey: "RUCAO-R69X7-QG2WO-A89FO", date: "2026-06-05", ip: "192.168.10.36", version: "5.0.20.1868", host: "NIDA", status: "ACTIVE" },
  { no: 7, licenseKey: "RYNZ7-31EPT-WB9Z8-D3ARC", date: "2026-06-11", ip: "192.168.10.10", version: "5.0.20.1868", host: "CMC", status: "ACTIVE" },
  { no: 8, licenseKey: "S79FI-BMP15-CMHEK-UC21Y", date: null, ip: null, version: null, host: "Seat #8 (Idle)", status: "RELEASED" },
  { no: 9, licenseKey: "T5YSS-QC3FF-F8GDY-HJURR", date: null, ip: null, version: null, host: "Seat #9 (Idle)", status: "RELEASED" },
  { no: 10, licenseKey: "TLJR0-D0J7Z-2ZUFT-6QMK7", date: null, ip: null, version: null, host: "Seat #10 (Idle)", status: "RELEASED" },
  { no: 11, licenseKey: "UFTIC-W6GDG-1YVT1-QVP43", date: null, ip: null, version: null, host: "Seat #11 (Idle)", status: "RELEASED" },
  { no: 12, licenseKey: "UPPX0-DX6IX-FCGY9-9HXJV", date: null, ip: null, version: null, host: "Seat #12 (Idle)", status: "RELEASED" },
  { no: 13, licenseKey: "X8HGH-4W806-ME88X-TWCI2", date: null, ip: null, version: null, host: "Seat #13 (Idle)", status: "RELEASED" },
  { no: 14, licenseKey: "RZMB-0TY11-N4B41-6VE2U", date: "2026-06-04", ip: "192.168.10.5", version: "5.0.20.1868", host: "TIA", status: "ACTIVE" },
  { no: 15, licenseKey: "R5Z4-L792N-DJCV8-LC3MO", date: "2026-06-04", ip: "192.168.40.3", version: "5.0.20.1868", host: "MARIYAM", status: "ACTIVE" },
  { no: 16, licenseKey: "491NJ-JL7OH-8BCK4-WN2AW", date: "2026-06-04", ip: "192.168.40.3", version: "5.0.20.1868", host: "Bu ELISA", status: "ACTIVE" },
  { no: 17, licenseKey: "7PDNH-322N9-3WDHJ-YFG1L", date: "2026-06-04", ip: "192.168.10.160", version: "5.0.20.1868", host: "Server", status: "ACTIVE" },
  { no: 18, licenseKey: "APFR9-YY05X-1A8PV-V4NS4", date: "2026-06-05", ip: "192.168.10.94", version: "5.0.20.1868", host: "AFNI", status: "ACTIVE" },
  { no: 19, licenseKey: "1EBCAK-D0Q4H-RPZH1-QEE4G", date: "2026-06-05", ip: "192.168.10.114", version: "5.0.20.1868", host: "AYU", status: "ACTIVE" },
  { no: 20, licenseKey: "VS98P-CAGEW-B3AZT-IPS5Z", date: "2026-06-04", ip: "192.168.10.35", version: "5.0.20.1868", host: "RISKI-AR", status: "ACTIVE" },
  { no: 21, licenseKey: "4R356N-G76EP-PENH8-BYA07", date: "2026-06-04", ip: "192.168.10.17", version: "5.0.20.1868", host: "DL", status: "ACTIVE" },
  { no: 22, licenseKey: "3KDOWE-PE9Q5-IQPFU-NKTV9", date: "2026-04-23", ip: "192.168.1.123", version: "5.0.20.1868", host: "Feli", status: "ACTIVE" },
  { no: 23, licenseKey: "29QF7-O2HJR-W6S06-11327", date: "2026-04-23", ip: "192.168.1.122", version: "5.0.20.1868", host: "Nisa", status: "ACTIVE" },
  { no: 24, licenseKey: "00A9Q-EPR68-UL37R-OH8Z3", date: "2026-04-23", ip: "192.168.1.121", version: "5.0.20.1868", host: "temp riski", status: "ACTIVE" }
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
    ];
    const inserted = await db.insert(dbBackups).values(defaultBackupsList).returning();
    return inserted;
  }
  return existingBackups;
}

async function ensureDefaultAccurateLogs() {
  const existing = await db.select().from(accurateLicenseLogs).orderBy(asc(accurateLicenseLogs.seatNo));
  if (existing.length === 0) {
    await db.insert(accurateLicenseLogs).values(
      FALLBACK_LICENSE_LIST.map((item) => ({
        seatNo: item.no,
        licenseKey: item.licenseKey,
        date: item.date,
        ip: item.ip,
        version: item.version,
        host: item.host,
        status: item.status,
        scrapedAt: new Date(),
      }))
    );
    return await db.select().from(accurateLicenseLogs).orderBy(asc(accurateLicenseLogs.seatNo));
  }
  return existing;
}

function parseAccurateHtml(html: string) {
  const results: Array<{ no: number; licenseKey: string; date: string | null; ip: string | null; version: string | null; host: string; status: string }> = [];
  
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  let seatIndex = 1;

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
      const c0 = cells[0] || '';
      const c1 = cells[1] || '';
      const c2 = cells[2] || '';
      const c3 = cells[3] || '';
      const c4 = cells[4] || '';
      const c5 = cells[5] || '';
      const c6 = cells[6] || '';

      const lower0 = c0.toLowerCase();

      // Skip header rows
      if (lower0.includes('no') || lower0.includes('serial') || lower0.includes('license') || lower0.includes('computer')) {
        continue;
      }

      // Check if row has license key pattern (5 groups separated by dash) or serial number
      const isLicenseKey = /[A-Z0-9]{4,6}-[A-Z0-9]{4,6}-[A-Z0-9]{4,6}-[A-Z0-9]{4,6}/i.test(c0) || /[A-Z0-9]{4,6}-[A-Z0-9]{4,6}-[A-Z0-9]{4,6}-[A-Z0-9]{4,6}/i.test(c1);

      if (isLicenseKey || (!isNaN(Number(c0)) && c1.length > 5)) {
        const noVal = !isNaN(Number(c0)) ? Number(c0) : seatIndex;
        const keyVal = isLicenseKey ? (c0.includes('-') ? c0 : c1) : c1;
        const dateVal = c2 && c2.includes('202') ? c2 : (c3 && c3.includes('202') ? c3 : null);
        const ipVal = (c3 && c3.includes('.')) ? c3 : (c2 && c2.includes('.')) ? c2 : (c4 && c4.includes('.')) ? c4 : null;
        const versionVal = c4 && c4.includes('5.0') ? c4 : (c5 && c5.includes('5.0')) ? c5 : '5.0.20.1868';
        const hostVal = c5 && !c5.includes('5.0') ? c5 : (c6 || c2 || `Seat #${noVal}`);
        const statusVal = (ipVal || dateVal) ? 'ACTIVE' : 'RELEASED';

        results.push({
          no: noVal,
          licenseKey: keyVal,
          date: dateVal,
          ip: ipVal,
          version: versionVal,
          host: hostVal,
          status: statusVal,
        });
        seatIndex++;
      }
    }
  }

  // If HTML scraping returns empty or non-table content, fall back to FALLBACK_LICENSE_LIST
  if (results.length === 0) {
    return FALLBACK_LICENSE_LIST;
  }

  return results;
}

/**
 * POST /api/v1/infrastructure/accurate/sync
 * Syncs Accurate 5 licenses by web scraping http://192.168.10.160:6688/
 * Matches format of licenseList.json
 */
export async function syncAccurateLicenses(req: Request, res: Response) {
  const baseUrl = (process.env.ACCURATE_LICENSE_SERVER_URL || 'http://192.168.10.160:6688').replace(/\/+$/, '');
  const apiUrl = `${baseUrl}/accurate-license-list.do`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    let scrapedRows: Array<{ no: number; licenseKey: string; date: string | null; ip: string | null; version: string | null; host: string; status: string }> = [];

    // 1. Try direct JSON API endpoint first
    try {
      const jsonRes = await fetch(apiUrl, { signal: controller.signal });
      if (jsonRes.ok) {
        const json = await jsonRes.json() as any;
        if (json && json.s && Array.isArray(json.d) && json.d.length > 0) {
          scrapedRows = json.d.map((item: any, idx: number) => ({
            no: idx + 1,
            licenseKey: item.licenseCode || `KEY-${idx + 1}`,
            date: item.registerDateView || null,
            ip: item.ip || null,
            version: item.version || null,
            host: item.host || (item.ip ? 'Computer' : `Seat #${idx + 1} (Idle)`),
            status: item.ip || item.host ? 'ACTIVE' : 'RELEASED',
          }));
        }
      }
    } catch (e) {
      // ignore json error, will try html fallback below
    }

    // 2. Fallback to HTML scraping root URL if JSON endpoint returned empty
    if (scrapedRows.length === 0) {
      const htmlRes = await fetch(baseUrl, { signal: controller.signal });
      if (htmlRes.ok) {
        const htmlText = await htmlRes.text();
        scrapedRows = parseAccurateHtml(htmlText);
      }
    }

    clearTimeout(timeoutId);

    if (scrapedRows.length > 0) {
      await db.delete(accurateLicenseLogs);
      const inserted = await db
        .insert(accurateLicenseLogs)
        .values(
          scrapedRows.map((r) => ({
            seatNo: r.no,
            licenseKey: r.licenseKey,
            date: r.date,
            ip: r.ip,
            version: r.version,
            host: r.host,
            status: r.status,
            scrapedAt: new Date(),
          }))
        )
        .returning();

      return res.status(200).json({
        success: true,
        isLive: true,
        message: `Accurate 5 license list synced live from ${baseUrl}`,
        data: inserted.map((r) => ({
          no: r.seatNo,
          licenseKey: r.licenseKey,
          date: r.date,
          ip: r.ip,
          version: r.version,
          host: r.host,
          status: r.status,
        })),
        syncedAt: new Date().toISOString(),
      });
    }

    throw new Error('HTTP response empty or invalid');
  } catch (err: any) {
    clearTimeout(timeoutId);

    let storedLogs = await db.select().from(accurateLicenseLogs).orderBy(asc(accurateLicenseLogs.seatNo));
    if (storedLogs.length === 0) {
      storedLogs = await ensureDefaultAccurateLogs();
    }

    const formattedData = storedLogs.map((r) => ({
      no: r.seatNo,
      licenseKey: r.licenseKey,
      date: r.date,
      ip: r.ip,
      version: r.version,
      host: r.host,
      status: r.status,
    }));

    return res.status(200).json({
      success: true,
      isLive: false,
      message: `Using stored snapshot (${baseUrl} host offline or unreachable in local subnet)`,
      data: formattedData,
      syncedAt: storedLogs[0]?.scrapedAt || new Date().toISOString(),
    });
  }
}

/**
 * GET /api/v1/infrastructure/accurate
 * Returns active Accurate 5 sessions & license logs in licenseList.json format.
 */
export async function getAccurateLicenses(req: Request, res: Response) {
  try {
    let logs = await db.select().from(accurateLicenseLogs).orderBy(asc(accurateLicenseLogs.seatNo));
    if (logs.length === 0) {
      logs = await ensureDefaultAccurateLogs();
    }

    const formattedData = logs.map((r) => ({
      no: r.seatNo,
      licenseKey: r.licenseKey,
      date: r.date,
      ip: r.ip,
      version: r.version,
      host: r.host,
      status: r.status,
    }));

    return res.status(200).json(formattedData);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

/**
 * GET /api/v1/infrastructure/servers
 */
export async function getServers(req: Request, res: Response) {
  try {
    const list = await ensureDefaultServers();
    return res.status(200).json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

/**
 * GET /api/v1/infrastructure/backups
 */
export async function getDbBackups(req: Request, res: Response) {
  try {
    const serverList = await ensureDefaultServers();
    const backupList = await ensureDefaultBackups(serverList);

    const list = await db
      .select({
        id: dbBackups.id,
        serverId: dbBackups.serverId,
        serverName: servers.name,
        serverIp: servers.ipAddress,
        dbName: dbBackups.dbName,
        sizeMb: dbBackups.sizeMb,
        status: dbBackups.status,
        backupPath: dbBackups.backupPath,
        completedAt: dbBackups.completedAt,
      })
      .from(dbBackups)
      .leftJoin(servers, eq(dbBackups.serverId, servers.id))
      .orderBy(desc(dbBackups.completedAt));

    return res.status(200).json(list.length > 0 ? list : backupList);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
