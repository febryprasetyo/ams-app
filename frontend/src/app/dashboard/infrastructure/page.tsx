'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  HardDrive,
  Laptop,
  Loader2,
  RefreshCw,
  Search,
  Server,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';

interface AccurateLicenseLog {
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

interface AccurateDatabaseFile {
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

interface AccurateServerMonitoring {
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

interface LicensesResponse {
  success: boolean;
  data: AccurateLicenseLog[];
  totalLicenses: number;
  activeLicenses: number;
  lastSyncedAt: string | null;
}

interface MonitoringResponse {
  success: boolean;
  data: AccurateServerMonitoring[];
  serversCount: number;
  databasesCount: number;
  totalSizeBytes: number;
}

interface SyncResponse {
  success: boolean;
  message: string;
  data: AccurateLicenseLog[];
  results: Array<{
    serverId: number;
    hostname: string;
    success: boolean;
    licensesCount?: number;
    syncedAt?: string;
    error?: string;
  }>;
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const standardMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (standardMatch) {
    const [, day, month, year, hour = '00', minute = '00', second = '00'] = standardMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}h ${hours}j ${minutes}m`;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

export default function InfrastructurePage() {
  const [licenses, setLicenses] = useState<AccurateLicenseLog[]>([]);
  const [servers, setServers] = useState<AccurateServerMonitoring[]>([]);
  const [activeTab, setActiveTab] = useState<'licenses' | 'database'>('licenses');
  const [selectedServerId, setSelectedServerId] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncingServer, setSyncingServer] = useState<number | 'all' | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'warning'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [licenseResponse, monitoringResponse] = await Promise.all([
        api.get<LicensesResponse>('/infrastructure/accurate'),
        api.get<MonitoringResponse>('/infrastructure/accurate/database'),
      ]);
      setLicenses(licenseResponse.data ?? []);
      setLastSyncedAt(licenseResponse.lastSyncedAt ?? null);
      setServers(monitoringResponse.data ?? []);
    } catch (requestError: unknown) {
      setError(errorMessage(requestError, 'Gagal membaca data monitoring Accurate.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial remote data load is the external synchronization owned by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleSync = async (serverId: number | 'all') => {
    setSyncingServer(serverId);
    setError(null);
    try {
      const response = await api.post<SyncResponse>(
        '/infrastructure/accurate/sync',
        serverId === 'all' ? {} : { serverId },
      );
      setLicenses(response.data ?? []);
      const latestSuccess = response.results
        .filter((result) => result.success && result.syncedAt)
        .map((result) => result.syncedAt as string)
        .sort()
        .at(-1);
      if (latestSuccess) setLastSyncedAt(latestSuccess);
      setToast({
        type: response.results.every((result) => result.success) ? 'success' : 'warning',
        text: response.results.map((result) => (
          result.success
            ? `${result.hostname}: ${result.licensesCount ?? 0} lisensi`
            : `${result.hostname}: ${result.error || 'gagal'}`
        )).join(' • '),
      });
      await fetchData();
    } catch (requestError: unknown) {
      setToast({ type: 'warning', text: errorMessage(requestError, 'Sinkronisasi lisensi gagal.') });
    } finally {
      setSyncingServer(null);
      window.setTimeout(() => setToast(null), 7000);
    }
  };

  const filteredLicenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return licenses.filter((license) => {
      if (selectedServerId !== 'all' && license.serverId !== selectedServerId) return false;
      if (!query) return true;
      return [
        license.licenseKey,
        license.host,
        license.ip,
        license.version,
        license.serverHostname,
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [licenses, searchQuery, selectedServerId]);

  const visibleServers = selectedServerId === 'all'
    ? servers
    : servers.filter((server) => server.id === selectedServerId);
  const activeLicenses = licenses.filter((license) => (
    license.status === 'ACTIVE'
    && (selectedServerId === 'all' || license.serverId === selectedServerId)
  )).length;
  const totalLicenses = licenses.filter((license) => (
    selectedServerId === 'all' || license.serverId === selectedServerId
  )).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 max-w-xl rounded-2xl border px-5 py-4 text-sm text-white shadow-xl ${
            toast.type === 'success' ? 'border-emerald-500 bg-emerald-600' : 'border-amber-500 bg-amber-600'
          }`}>
            <div className="flex items-start gap-3">
              {toast.type === 'success' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />}
              <span className="flex-1">{toast.text}</span>
              <button onClick={() => setToast(null)} aria-label="Tutup notifikasi"><X className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="absolute inset-y-0 left-0 w-2 bg-red-600" />
          <div className="flex flex-col gap-5 pl-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white">
                  <Server className="h-5 w-5" />
                </span>
                Accurate Database
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Telemetry server, Firebird database, dan lisensi Accurate dari agent yang terdaftar otomatis.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <Clock className="mr-1.5 inline h-4 w-4" />
                Sync lisensi terakhir: <strong>{formatDate(lastSyncedAt)}</strong>
              </div>
              <button
                onClick={() => handleSync('all')}
                disabled={syncingServer !== null || servers.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${syncingServer === 'all' ? 'animate-spin' : ''}`} />
                Sync Semua Lisensi
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={fetchData} className="font-bold underline">Muat ulang</button>
          </div>
        )}


        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-12 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Membaca telemetry dari database…
            </div>
          ) : servers.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Server className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-3 font-bold text-slate-800">Belum ada server Accurate terdaftar</h2>
              <p className="mt-1 text-sm text-slate-500">Jalankan accurate_agent.ps1 pada server pertama untuk mengirim heartbeat.</p>
            </div>
          ) : servers.map((server) => (
            <article key={server.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {server.status === 'Online' ? <Wifi className="h-5 w-5 text-emerald-600" /> : <WifiOff className="h-5 w-5 text-red-500" />}
                    <h2 className="font-extrabold text-slate-900">{server.hostname}</h2>
                  </div>
                  <p className="mt-1 font-mono text-xs text-slate-500">{server.ipAddress}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  server.status === 'Online' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>{server.status}</span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div><dt className="text-slate-400">Lisensi</dt><dd className="mt-1 font-bold text-slate-800">{server.activeLicensesCount} aktif / {server.licensesCount}</dd></div>
                <div><dt className="text-slate-400">Database</dt><dd className="mt-1 font-bold text-slate-800">{server.databases.length} file</dd></div>
                <div><dt className="text-slate-400">Accurate</dt><dd className="mt-1 font-bold text-slate-800">{server.isAccurateActive ? 'Aktif' : 'Tidak aktif'}</dd></div>
                <div><dt className="text-slate-400">Firebird</dt><dd className="mt-1 font-bold text-slate-800">{server.isFirebirdActive ? 'Aktif' : 'Tidak aktif'}</dd></div>
                <div><dt className="text-slate-400">Uptime</dt><dd className="mt-1 font-bold text-slate-800">{formatUptime(server.uptimeSeconds)}</dd></div>
                <div><dt className="text-slate-400">Signal terakhir</dt><dd className="mt-1 font-bold text-slate-800">{formatDate(server.lastSeenAt)}</dd></div>
              </dl>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => handleSync(server.id)}
                  disabled={syncingServer !== null || !server.licenseServerUrl}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncingServer === server.id ? 'animate-spin' : ''}`} />
                  Sync lisensi
                </button>
                {server.licenseServerUrl && (
                  <a href={server.licenseServerUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-red-600" title="Buka License Server">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setActiveTab('licenses')} className={`rounded-xl px-4 py-2 text-xs font-bold ${activeTab === 'licenses' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Laptop className="mr-2 inline h-4 w-4" />
                Accurate 5 Live Users ({activeLicenses}/{totalLicenses})
              </button>
              <button onClick={() => setActiveTab('database')} className={`rounded-xl px-4 py-2 text-xs font-bold ${activeTab === 'database' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Database className="mr-2 inline h-4 w-4" />
                Accurate Database ({visibleServers.reduce((sum, server) => sum + server.databases.length, 0)})
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={selectedServerId}
                onChange={(event) => setSelectedServerId(event.target.value === 'all' ? 'all' : Number(event.target.value))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
              >
                <option value="all">Semua server</option>
                {servers.map((server) => <option key={server.id} value={server.id}>{server.hostname}</option>)}
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari lisensi, host, IP…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 sm:w-64"
                />
              </div>
            </div>
          </div>
        </section>

        {activeTab === 'licenses' ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-extrabold text-slate-900">Accurate 5 Live Users</h2>
              <p className="mt-1 text-xs text-slate-500">Data tersimpan dari sync manual terakhir; membuka halaman tidak memicu sinkronisasi.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Server</th>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">License Key</th>
                    <th className="px-4 py-3">Host</th>
                    <th className="px-4 py-3">IP</th>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3">Active Date</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLicenses.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">Belum ada data lisensi tersimpan untuk pilihan ini.</td></tr>
                  ) : filteredLicenses.map((license) => (
                    <tr key={`${license.serverId}-${license.licenseKey}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-700">{license.serverHostname}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">#{license.no}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{license.licenseKey}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{license.host || 'Unassigned'}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{license.ip || '—'}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{license.version || '—'}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{formatDate(license.date)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${license.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {license.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-extrabold text-slate-900"><Database className="h-5 w-5 text-purple-600" />Accurate Database</h2>
              <p className="mt-1 text-xs text-slate-500">File database yang terakhir dilaporkan oleh accurate_agent.ps1 pada masing-masing server.</p>
            </div>
            {visibleServers.map((server) => (
              <article key={server.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900">{server.hostname} <span className="font-mono text-xs font-normal text-slate-500">({server.ipAddress})</span></h3>
                    <p className="mt-1 text-xs text-slate-500">{server.os || 'OS belum dilaporkan'} • Signal {formatDate(server.lastSeenAt)}</p>
                  </div>
                  <div className="flex gap-2 text-[11px] font-bold">
                    <span className={`rounded-full px-2.5 py-1 ${server.isFirebirdActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>Firebird {server.isFirebirdActive ? 'aktif' : 'tidak aktif'}</span>
                    <span className="rounded-full bg-purple-50 px-2.5 py-1 text-purple-700">{server.databases.length} database • {formatBytes(server.databases.reduce((sum, item) => sum + Number(item.fileSizeBytes), 0))}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-white text-[11px] uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Database</th>
                        <th className="px-4 py-3">Lokasi file</th>
                        <th className="px-4 py-3">Ukuran</th>
                        <th className="px-4 py-3">Terakhir berubah</th>
                        <th className="px-5 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {server.databases.length === 0 ? (
                        <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">Agent belum melaporkan file .gdb pada server ini.</td></tr>
                      ) : server.databases.map((database) => (
                        <tr key={database.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-bold text-slate-900"><HardDrive className="mr-2 inline h-4 w-4 text-purple-600" />{database.dbName}</td>
                          <td className="max-w-md truncate px-4 py-3 font-mono text-slate-600" title={database.filePath}>{database.filePath}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-700">{database.fileSizeFormatted}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">{formatDate(database.lastModifiedAt)}</td>
                          <td className="px-5 py-3 text-right">
                            <span className={`rounded-full px-2.5 py-1 font-bold ${database.status === 'Online' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                              {database.status}
                            </span>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </section>
        )}

        <footer className="flex items-center gap-2 text-xs text-slate-400">
          <Activity className="h-4 w-4" />
          Status online dihitung dari heartbeat agent tiga menit terakhir. Tidak ada data monitoring contoh yang ditampilkan.
        </footer>
      </div>
    </DashboardLayout>
  );
}
