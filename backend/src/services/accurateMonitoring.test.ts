import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isHeartbeatOnline,
  normalizeAgentSignal,
  normalizeLicenseSnapshot,
  parseAccurateLicenseJson,
} from './accurateMonitoring';

test('normalizeAgentSignal keeps the reporting server identity and its real database files', () => {
  const signal = normalizeAgentSignal({
    agentVersion: '1.0.0',
    timestamp: '2026-08-20 13:45:00',
    licenseServerUrl: 'http://10.0.0.10:6688/',
    pc: {
      hostname: 'ACCURATE-SRV-01',
      ipAddress: '10.0.0.10',
      macAddress: '00-11-22-33-44-55',
      os: 'Windows Server 2019',
      uptimeSeconds: 86400,
      status: 'Online',
    },
    accurateService: {
      isFirebirdActive: true,
      isAccurateActive: true,
      overallStatus: 'ACTIVE',
      services: [{ serviceName: 'FirebirdServer25', status: 'Running', isStarted: true }],
      processes: [{ processName: 'fbserver', processId: 1234, workingSetMb: 120 }],
    },
    databasesCount: 2,
    databases: [
      {
        fileName: 'MAIN.GDB',
        filePath: 'G:\\IJR\\MAIN.GDB',
        fileSizeBytes: 1048576,
        fileSizeMb: 1,
        fileSizeFormatted: '1 MB',
        lastModified: '2026-08-20 13:40:00',
        createdAt: '2025-01-01 08:00:00',
      },
      {
        fileName: 'FINANCE.GDB',
        filePath: 'G:\\KANTOR\\FINANCE.GDB',
        fileSizeBytes: 2097152,
        fileSizeMb: 2,
        fileSizeFormatted: '2 MB',
        lastModified: '2026-08-20 13:42:00',
        createdAt: '2025-02-01 08:00:00',
      },
    ],
  });

  assert.equal(signal.hostname, 'ACCURATE-SRV-01');
  assert.equal(signal.licenseServerUrl, 'http://10.0.0.10:6688');
  assert.equal(signal.databases.length, 2);
  assert.deepEqual(signal.databases.map((item) => item.fileName), ['MAIN.GDB', 'FINANCE.GDB']);
  assert.equal(signal.isFirebirdActive, true);
});

test('normalizeAgentSignal rejects a signal without a stable hostname', () => {
  assert.throws(
    () => normalizeAgentSignal({ pc: { ipAddress: '10.0.0.11' }, databases: [] }),
    /hostname/i,
  );
});

test('normalizeLicenseSnapshot scopes identical keys to their reporting server', () => {
  const syncedAt = new Date('2026-08-20T06:00:00.000Z');
  const rows = normalizeLicenseSnapshot(42, [
    {
      no: 1,
      licenseKey: 'AAAAA-BBBBB-CCCCC-DDDDD',
      date: '20/08/2026 13:00:00',
      ip: '10.0.0.70',
      version: '5.0.20.1868',
      host: 'ACCOUNTING-01',
      status: 'ACTIVE',
    },
  ], syncedAt);

  assert.deepEqual(rows, [{
    serverId: 42,
    seatNo: 1,
    licenseKey: 'AAAAA-BBBBB-CCCCC-DDDDD',
    date: '20/08/2026 13:00:00',
    ip: '10.0.0.70',
    version: '5.0.20.1868',
    host: 'ACCOUNTING-01',
    status: 'ACTIVE',
    scrapedAt: syncedAt,
  }]);
});

test('isHeartbeatOnline marks stale servers offline', () => {
  const now = new Date('2026-08-20T07:00:00.000Z');

  assert.equal(isHeartbeatOnline(new Date('2026-08-20T06:58:30.000Z'), now, 180), true);
  assert.equal(isHeartbeatOnline(new Date('2026-08-20T06:55:00.000Z'), now, 180), false);
  assert.equal(isHeartbeatOnline(null, now, 180), false);
});

test('parseAccurateLicenseJson returns exactly the licenses reported by one server', () => {
  const rows = parseAccurateLicenseJson({
    s: true,
    d: [
      {
        licenseCode: 'SERVER1-KEY01-AAAAA-BBBBB',
        registerDateView: '20/08/2026 13:00:00',
        ip: '10.0.0.70',
        version: '5.0.20.1868',
        host: 'ACCOUNTING-01',
      },
      {
        licenseCode: 'SERVER1-KEY02-AAAAA-BBBBB',
        registerDateView: null,
        ip: null,
        version: null,
        host: null,
      },
    ],
  });

  assert.equal(rows.length, 2);
  assert.equal(rows[0].status, 'ACTIVE');
  assert.equal(rows[1].status, 'RELEASED');
  assert.equal(rows[1].licenseKey, 'SERVER1-KEY02-AAAAA-BBBBB');
});

test('parseAccurateLicenseJson does not invent fallback licenses for an empty response', () => {
  assert.deepEqual(parseAccurateLicenseJson({ s: true, d: [] }), []);
});

test('normalizeAgentSignal rejects a License Server URL that does not match the reporting private IP', () => {
  assert.throws(() => normalizeAgentSignal({
    timestamp: '2026-08-20T13:45:00+07:00',
    licenseServerUrl: 'http://169.254.169.254:6688',
    pc: {
      hostname: 'ACCURATE-SRV-01',
      ipAddress: '10.0.0.10',
    },
    accurateService: {},
    databases: [],
  }), /licenseServerUrl/i);
});

test('normalizeAgentSignal rejects a License Server port other than 6688', () => {
  assert.throws(() => normalizeAgentSignal({
    timestamp: '2026-08-20T13:45:00+07:00',
    licenseServerUrl: 'http://10.0.0.10:8080',
    pc: {
      hostname: 'ACCURATE-SRV-01',
      ipAddress: '10.0.0.10',
    },
    accurateService: {},
    databases: [],
  }), /licenseServerUrl/i);
});
