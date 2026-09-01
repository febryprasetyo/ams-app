import { Request, Response } from 'express';
import { and, asc, desc, eq, isNotNull } from 'drizzle-orm';
import { db } from '../db';
import {
  accurateDatabases,
  accurateLicenseLogs,
  dbBackups,
  servers,
} from '../db/schema/infrastructure';
import {
  isHeartbeatOnline,
  normalizeAgentSignal,
  normalizeLicenseSnapshot,
  parseAccurateLicenseJson,
} from '../services/accurateMonitoring';

function parseAgentDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function serializeLicense(row: any) {
  return {
    id: row.id,
    serverId: row.serverId,
    serverHostname: row.serverHostname,
    serverIp: row.serverIp,
    no: row.seatNo,
    licenseKey: row.licenseKey,
    date: row.date,
    ip: row.ip,
    version: row.version,
    host: row.host,
    status: row.status,
    scrapedAt: row.scrapedAt,
  };
}

async function readLicenseRows() {
  return db
    .select({
      id: accurateLicenseLogs.id,
      serverId: accurateLicenseLogs.serverId,
      serverHostname: servers.serverCode,
      serverIp: servers.ipAddress,
      seatNo: accurateLicenseLogs.seatNo,
      licenseKey: accurateLicenseLogs.licenseKey,
      date: accurateLicenseLogs.date,
      ip: accurateLicenseLogs.ip,
      version: accurateLicenseLogs.version,
      host: accurateLicenseLogs.host,
      status: accurateLicenseLogs.status,
      scrapedAt: accurateLicenseLogs.scrapedAt,
    })
    .from(accurateLicenseLogs)
    .innerJoin(servers, eq(accurateLicenseLogs.serverId, servers.id))
    .orderBy(asc(servers.id), asc(accurateLicenseLogs.seatNo));
}

export async function receiveAccurateAgentSignal(req: Request, res: Response) {
  try {
    const signal = normalizeAgentSignal(req.body);
    const receivedAt = new Date();

    const server = await db.transaction(async (tx) => {
      const [upsertedServer] = await tx
        .insert(servers)
        .values({
          serverCode: signal.hostname,
          name: signal.hostname,
          ipAddress: signal.ipAddress,
          macAddress: signal.macAddress,
          os: signal.os,
          status: 'Online',
          licenseServerUrl: signal.licenseServerUrl,
          agentVersion: signal.agentVersion,
          uptimeSeconds: signal.uptimeSeconds,
          accurateStatus: signal.overallStatus,
          isAccurateActive: signal.isAccurateActive,
          isFirebirdActive: signal.isFirebirdActive,
          services: signal.services,
          processes: signal.processes,
          lastSeenAt: receivedAt,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: servers.serverCode,
          set: {
            ipAddress: signal.ipAddress,
            macAddress: signal.macAddress,
            os: signal.os,
            status: 'Online',
            licenseServerUrl: signal.licenseServerUrl,
            agentVersion: signal.agentVersion,
            uptimeSeconds: signal.uptimeSeconds,
            accurateStatus: signal.overallStatus,
            isAccurateActive: signal.isAccurateActive,
            isFirebirdActive: signal.isFirebirdActive,
            services: signal.services,
            processes: signal.processes,
            lastSeenAt: receivedAt,
            updatedAt: new Date(),
          },
        })
        .returning();

      await tx
        .update(accurateDatabases)
        .set({ isActive: false, reportedAt: receivedAt })
        .where(eq(accurateDatabases.serverId, upsertedServer.id));

      for (const database of signal.databases) {
        await tx
          .insert(accurateDatabases)
          .values({
            serverId: upsertedServer.id,
            databaseName: database.fileName,
            filePath: database.filePath,
            fileSizeBytes: database.fileSizeBytes,
            fileSizeMb: String(database.fileSizeMb),
            fileSizeFormatted: database.fileSizeFormatted,
            status: signal.isFirebirdActive ? 'Online' : 'Unavailable',
            lastModifiedAt: parseAgentDate(database.lastModified),
            fileCreatedAt: parseAgentDate(database.createdAt),
            reportedAt: receivedAt,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: [accurateDatabases.serverId, accurateDatabases.filePath],
            set: {
              databaseName: database.fileName,
              fileSizeBytes: database.fileSizeBytes,
              fileSizeMb: String(database.fileSizeMb),
              fileSizeFormatted: database.fileSizeFormatted,
              status: signal.isFirebirdActive ? 'Online' : 'Unavailable',
              lastModifiedAt: parseAgentDate(database.lastModified),
              fileCreatedAt: parseAgentDate(database.createdAt),
              reportedAt: receivedAt,
              isActive: true,
            },
          });
      }

      return upsertedServer;
    });

    return res.status(202).json({
      success: true,
      message: 'Telemetry accepted',
      server: {
        id: server.id,
        hostname: server.serverCode,
        databasesCount: signal.databases.length,
        lastSeenAt: receivedAt,
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Invalid agent signal',
    });
  }
}

async function syncOneLicenseServer(server: typeof servers.$inferSelect) {
  if (!server.licenseServerUrl) {
    throw new Error('License Server URL has not been reported by the agent');
  }

  const endpoint = `${server.licenseServerUrl.replace(/\/+$/, '')}/accurate-license-list.do`;
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(8000), redirect: 'error' });
  if (!response.ok) {
    throw new Error(`License Server returned HTTP ${response.status}`);
  }

  const payload = await response.json() as any;
  if (payload?.s !== true || !Array.isArray(payload?.d)) {
    throw new Error('License Server returned an invalid payload');
  }

  const scrapedAt = new Date();
  const snapshot = normalizeLicenseSnapshot(
    server.id,
    parseAccurateLicenseJson(payload),
    scrapedAt,
  );

  await db.transaction(async (tx) => {
    await tx.delete(accurateLicenseLogs).where(eq(accurateLicenseLogs.serverId, server.id));
    if (snapshot.length > 0) {
      await tx.insert(accurateLicenseLogs).values(snapshot);
    }
  });

  return {
    serverId: server.id,
    hostname: server.serverCode,
    success: true,
    licensesCount: snapshot.length,
    syncedAt: scrapedAt,
  };
}

export async function syncAccurateLicenses(req: Request, res: Response) {
  try {
    const requestedServerId = req.body?.serverId == null ? null : Number(req.body.serverId);
    if (requestedServerId != null && !Number.isInteger(requestedServerId)) {
      return res.status(400).json({ success: false, error: 'serverId must be an integer' });
    }

    const targets = requestedServerId == null
      ? await db.select().from(servers).where(isNotNull(servers.lastSeenAt)).orderBy(asc(servers.id))
      : await db.select().from(servers).where(and(eq(servers.id, requestedServerId), isNotNull(servers.lastSeenAt)));

    if (targets.length === 0) {
      return res.status(404).json({ success: false, error: 'No registered Accurate server found' });
    }

    const results: Array<Record<string, unknown>> = [];
    for (const server of targets) {
      try {
        results.push(await syncOneLicenseServer(server));
      } catch (error: any) {
        results.push({
          serverId: server.id,
          hostname: server.serverCode,
          success: false,
          error: error?.message || 'License sync failed',
        });
      }
    }

    const rows = (await readLicenseRows()).map(serializeLicense);
    const successful = results.filter((result) => result.success === true).length;

    return res.status(successful > 0 ? 200 : 502).json({
      success: successful > 0,
      message: `${successful} of ${results.length} License Servers synchronized`,
      results,
      data: rows,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'License sync failed' });
  }
}

export async function getAccurateLicenses(_req: Request, res: Response) {
  try {
    const rows = await readLicenseRows();
    const data = rows.map(serializeLicense);
    const lastSyncedAt = data.reduce<string | null>((latest, row) => {
      const value = row.scrapedAt ? new Date(row.scrapedAt).toISOString() : null;
      return value && (!latest || value > latest) ? value : latest;
    }, null);

    return res.status(200).json({
      success: true,
      data,
      totalLicenses: data.length,
      activeLicenses: data.filter((row) => row.status === 'ACTIVE').length,
      lastSyncedAt,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Unable to read licenses' });
  }
}

export async function getAccurateDatabase(_req: Request, res: Response) {
  try {
    const serverRows = await db.select().from(servers).where(isNotNull(servers.lastSeenAt)).orderBy(asc(servers.id));
    const databaseRows = await db.select().from(accurateDatabases).where(eq(accurateDatabases.isActive, true)).orderBy(
      asc(accurateDatabases.serverId),
      asc(accurateDatabases.databaseName),
    );
    const licenseRows = await db.select().from(accurateLicenseLogs);
    const now = new Date();

    const data = serverRows.map((server) => {
      const databases = databaseRows
        .filter((database) => database.serverId === server.id)
        .map((database) => ({
          id: database.id,
          dbName: database.databaseName,
          filePath: database.filePath,
          fileSizeBytes: database.fileSizeBytes,
          fileSizeMb: database.fileSizeMb,
          fileSizeFormatted: database.fileSizeFormatted,
          status: database.status,
          lastModifiedAt: database.lastModifiedAt,
          createdAt: database.fileCreatedAt,
          reportedAt: database.reportedAt,
        }));
      const licenses = licenseRows.filter((license) => license.serverId === server.id);

      return {
        id: server.id,
        hostname: server.serverCode,
        name: server.name,
        ipAddress: server.ipAddress,
        os: server.os,
        macAddress: server.macAddress,
        status: isHeartbeatOnline(server.lastSeenAt, now) ? 'Online' : 'Offline',
        lastSeenAt: server.lastSeenAt,
        agentVersion: server.agentVersion,
        uptimeSeconds: server.uptimeSeconds,
        licenseServerUrl: server.licenseServerUrl,
        accurateStatus: server.accurateStatus,
        isAccurateActive: server.isAccurateActive,
        isFirebirdActive: server.isFirebirdActive,
        services: server.services,
        processes: server.processes,
        licensesCount: licenses.length,
        activeLicensesCount: licenses.filter((license) => license.status === 'ACTIVE').length,
        databases,
      };
    });

    return res.status(200).json({
      success: true,
      data,
      serversCount: data.length,
      databasesCount: databaseRows.length,
      totalSizeBytes: databaseRows.reduce((total, item) => total + Number(item.fileSizeBytes || 0), 0),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Unable to read Accurate telemetry' });
  }
}

export async function getServers(_req: Request, res: Response) {
  try {
    const now = new Date();
    const rows = await db.select().from(servers).where(isNotNull(servers.lastSeenAt)).orderBy(asc(servers.id));
    return res.status(200).json({
      success: true,
      data: rows.map((server) => ({
        ...server,
        status: isHeartbeatOnline(server.lastSeenAt, now) ? 'Online' : 'Offline',
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Unable to read servers' });
  }
}

export async function getDbBackups(_req: Request, res: Response) {
  try {
    const rows = await db
      .select({
        id: dbBackups.id,
        serverId: dbBackups.serverId,
        serverName: servers.name,
        serverCode: servers.serverCode,
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

    return res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Unable to read backups' });
  }
}
