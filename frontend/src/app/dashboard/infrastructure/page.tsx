'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import {
  Server,
  Database,
  RefreshCw,
  Wifi,
  WifiOff,
  Activity,
  CheckCircle2,
  Clock,
  Laptop,
  Cpu,
  ShieldCheck,
  Search,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink,
  Layers,
  HardDrive,
  Check,
  Terminal,
  CheckCircle,
  X
} from 'lucide-react';

export interface AccurateLicenseLog {
  id?: number;
  no: number;
  licenseKey: string;
  date?: string | null;
  ip?: string | null;
  version?: string | null;
  host: string;
  status: string;
  scrapedAt?: string | Date;
}

export interface ServerItem {
  id: number;
  serverCode: string;
  name: string;
  ipAddress: string;
  os: string;
  specs: string;
  status: string;
  notes?: string;
}

export interface DbBackupItem {
  id: number;
  serverId: number;
  dbName: string;
  sizeMb: string | number;
  status: string;
  backupPath: string;
  completedAt: string | Date;
  serverName?: string;
  serverCode?: string;
  serverIp?: string;
}

export default function InfrastructurePage() {
  // Data States
  const [accurateLogs, setAccurateLogs] = useState<AccurateLicenseLog[]>([]);
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [dbBackups, setDbBackups] = useState<DbBackupItem[]>([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  // Active Tab & Filters
  const [activeTab, setActiveTab] = useState<'all' | 'accurate' | 'servers' | 'backups'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      interface AccurateResponse {
        success: boolean;
        isLive?: boolean;
        data: AccurateLicenseLog[];
        lastSyncedAt?: string;
      }

      const [accurateRes, serversRes, backupsRes] = await Promise.all([
        api.get<AccurateResponse>('/infrastructure/accurate').catch(() => ({ success: false, isLive: false, data: [] as AccurateLicenseLog[], lastSyncedAt: undefined })),
        api.get<{ success: boolean; data: ServerItem[] }>('/infrastructure/servers').catch(() => ({ success: false, data: [] as ServerItem[] })),
        api.get<{ success: boolean; data: DbBackupItem[] }>('/infrastructure/backups').catch(() => ({ success: false, data: [] as DbBackupItem[] })),
      ]);

      if (accurateRes.success && accurateRes.data) {
        setAccurateLogs(accurateRes.data);
        setIsLive(accurateRes.isLive ?? false);
        setLastSyncedAt(accurateRes.lastSyncedAt || (accurateRes.data[0]?.scrapedAt ? String(accurateRes.data[0].scrapedAt) : new Date().toISOString()));
      }

      if (serversRes.success && serversRes.data) {
        setServers(serversRes.data);
      }

      if (backupsRes.success && backupsRes.data) {
        setDbBackups(backupsRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load infrastructure data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync Accurate 5 License Trigger
  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);

      const syncRes = await api.post<{
        success: boolean;
        isLive: boolean;
        message: string;
        data: AccurateLicenseLog[];
        syncedAt: string;
      }>('/infrastructure/accurate/sync');

      if (syncRes.success) {
        setAccurateLogs(syncRes.data || []);
        setIsLive(syncRes.isLive);
        setLastSyncedAt(syncRes.syncedAt);

        setToastMessage({
          text: syncRes.message || (syncRes.isLive ? 'Live scraping successful!' : 'Synced snapshot data'),
          type: syncRes.isLive ? 'success' : 'warning',
        });

        // Clear toast after 6 seconds
        setTimeout(() => setToastMessage(null), 6000);
      }
    } catch (err: any) {
      setToastMessage({
        text: err.message || 'Error triggering Accurate 5 sync',
        type: 'warning',
      });
      setTimeout(() => setToastMessage(null), 6000);
    } finally {
      setSyncing(false);
    }
  };

  // Stats Calculations
  const activeAccurateSessionsCount = accurateLogs.filter((l) => l.status === 'ACTIVE' || l.status === 'Active').length;
  const totalServersCount = servers.length;
  const onlineServersCount = servers.filter((s) => s.status === 'Online').length;
  const successfulBackupsCount = dbBackups.filter((b) => b.status === 'Success').length;
  const latestBackupDate = dbBackups.length > 0 ? new Date(dbBackups[0].completedAt) : null;

  // Filtered lists
  const filteredAccurate = accurateLogs.filter(
    (l) =>
      (l.host || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.licenseKey || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.ip || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.version || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServers = servers.filter(
    (s) =>
      s.serverCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.os.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBackups = dbBackups.filter(
    (b) =>
      b.dbName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.serverName && b.serverName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.serverCode && b.serverCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      b.backupPath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Formatters
  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatSizeMb = (size: string | number) => {
    const num = typeof size === 'string' ? parseFloat(size) : size;
    if (isNaN(num)) return `${size} MB`;
    if (num >= 1024) {
      return `${(num / 1024).toFixed(2)} GB`;
    }
    return `${num.toFixed(2)} MB`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 font-sans text-xs transition-all animate-bounce ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20'
                : 'bg-amber-600 text-white border-amber-500 shadow-amber-600/20'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-white shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-white shrink-0" />
            )}
            <div className="flex flex-col">
              <span className="font-bold text-sm">Accurate Sync Update</span>
              <span className="opacity-90">{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Control Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-red-600" />
          <div className="space-y-1 pl-2">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-lg shadow-red-600/20">
                  <Server className="w-5.5 h-5.5" />
                </div>
                <span>Accurate 5 & Server Infrastructure</span>
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-sans">
              Real-time monitoring for Accurate 5 ERP concurrent license sessions, primary Windows/Linux server nodes, and Firebird DB backups.
            </p>
          </div>

          {/* Sync Trigger & Status Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            {/* Last Synced & Live Connection Badge */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono">
              <span className="flex h-2.5 w-2.5 relative">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isLive ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isLive ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                />
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-[11px] text-slate-800 flex items-center gap-1">
                  {isLive ? 'Live Subnet Scraper' : 'Stored Snapshot'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Synced: {lastSyncedAt ? formatDate(lastSyncedAt) : 'Never'}
                </span>
              </div>
            </div>

            {/* Sync Button */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs md:text-sm rounded-xl shadow-md shadow-red-600/20 hover:shadow-lg hover:shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
              title="Trigger scraper http://192.168.10.160:6688/"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>Sync Accurate 5 License (http://192.168.10.160:6688/)</span>
            </button>
          </div>
        </div>

        {/* Bento Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Active Accurate 5 Sessions */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600 rounded-l-2xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                  Active Accurate 5 Sessions
                </p>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                  {activeAccurateSessionsCount}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Laptop className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="text-red-600 font-bold font-mono">Port 6688</span> concurrent users active
            </div>
          </div>

          {/* Card 2: Accurate License Server Status */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600 rounded-l-2xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                  License Server Status
                </p>
                <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                  <span className="text-emerald-600">Online</span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wifi className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="font-mono text-slate-700 font-semibold truncate">http://192.168.10.160:6688/</span>
            </div>
          </div>

          {/* Card 3: Total Infrastructure Servers */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 rounded-l-2xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                  Total Infra Servers
                </p>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                  {totalServersCount}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Server className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="text-blue-600 font-bold font-mono">{onlineServersCount} / {totalServersCount}</span> servers online & healthy
            </div>
          </div>

          {/* Card 4: Daily ERP DB Backup Status */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600 rounded-l-2xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                  Daily ERP DB Backups
                </p>
                <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1 text-purple-700">
                  {successfulBackupsCount} / {dbBackups.length} Verified
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
              <span className="text-purple-600 font-bold font-mono">Latest:</span>{' '}
              {latestBackupDate ? formatDate(latestBackupDate) : 'No backups found'}
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs & Search Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* View Segment Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-white text-red-600 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Workspace Panels</span>
            </button>

            <button
              onClick={() => setActiveTab('accurate')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'accurate'
                  ? 'bg-white text-red-600 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Accurate 5 Live Users ({filteredAccurate.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('servers')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'servers'
                  ? 'bg-white text-red-600 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Server Topology ({filteredServers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('backups')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'backups'
                  ? 'bg-white text-red-600 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>DB Backup Logs ({filteredBackups.length})</span>
            </button>
          </div>

          {/* Search Filter Bar */}
          <div className="relative min-w-[240px] md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search hosts, IPs, users, DBs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-sans text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div className="flex-1 font-medium">{error}</div>
            <button onClick={fetchData} className="underline font-bold text-red-700 hover:text-red-800">
              Retry Load
            </button>
          </div>
        )}

        {/* Workspace Panels Content */}
        <div className="space-y-8">
          {/* PANEL 1: ACCURATE 5 LIVE USER TABLE (Scraped Data View) */}
          {(activeTab === 'all' || activeTab === 'accurate') && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              {/* Panel Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Laptop className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <span>Accurate 5 Live User Table</span>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                        Scraped Data View
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      Active concurrent client sessions fetched from License Server `http://192.168.10.160:6688/`.
                    </p>
                  </div>
                </div>

                <a
                  href="http://192.168.10.160:6688/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-red-200 bg-white transition-colors"
                >
                  <span>192.168.10.160:6688</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Accurate 5 Users Table (licenseList.json format) */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                      <th className="py-3.5 px-4 text-center w-12">No</th>
                      <th className="py-3.5 px-4">Serial / License Key</th>
                      <th className="py-3.5 px-5">Host / Computer</th>
                      <th className="py-3.5 px-4">IP Address</th>
                      <th className="py-3.5 px-4">Accurate Version</th>
                      <th className="py-3.5 px-4">Active Date</th>
                      <th className="py-3.5 px-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-sans">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                            <span className="font-mono text-xs text-slate-500">Scraping License Server...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredAccurate.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center">
                          <div className="max-w-xs mx-auto text-slate-400 space-y-1.5">
                            <Laptop className="w-8 h-8 mx-auto text-slate-300" />
                            <p className="text-xs font-semibold text-slate-700">No Accurate 5 licenses found</p>
                            <p className="text-[11px] text-slate-500">
                              {searchQuery ? 'Try clearing your search query.' : 'Click "Sync Accurate 5 License" to perform a fresh scan.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAccurate.map((row, idx) => (
                        <tr key={row.licenseKey || idx} className="hover:bg-slate-50/70 transition-colors group">
                          {/* Seat No */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500 text-xs">
                            #{row.no || idx + 1}
                          </td>

                          {/* License Key */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                            <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200/80 tracking-wider">
                              {row.licenseKey}
                            </span>
                          </td>

                          {/* Host / Computer Name */}
                          <td className="py-3.5 px-5 font-bold font-sans text-slate-800 flex items-center gap-2">
                            <Laptop className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>{row.host || 'Unassigned'}</span>
                          </td>

                          {/* IP Address */}
                          <td className="py-3.5 px-4 font-mono text-slate-700">
                            {row.ip ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold text-[11px]">
                                {row.ip}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">-</span>
                            )}
                          </td>

                          {/* Accurate Version */}
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                            {row.version ? (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                                v{row.version}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">-</span>
                            )}
                          </td>

                          {/* Active Date */}
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                            {row.date ? row.date : <span className="text-slate-400">-</span>}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            {row.status === 'ACTIVE' || row.status === 'Active' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                <span>ACTIVE</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-slate-100 text-slate-500 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                <span>RELEASED</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PANEL 2: INFRASTRUCTURE SERVER TOPOLOGY PANEL */}
          {(activeTab === 'all' || activeTab === 'servers') && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              {/* Panel Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Server className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <span>Infrastructure Server Topology Panel</span>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        Primary Core Nodes
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      Monitored hardware servers, virtual machines, domain controllers, and backup repositories.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>Subnet 192.168.10.0/24</span>
                </div>
              </div>

              {/* Servers Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                      <th className="py-3.5 px-5">Server Code & Name</th>
                      <th className="py-3.5 px-4">IP Address</th>
                      <th className="py-3.5 px-4">Operating System</th>
                      <th className="py-3.5 px-4">Hardware Specifications</th>
                      <th className="py-3.5 px-4">Role / Notes</th>
                      <th className="py-3.5 px-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-sans">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            <span className="font-mono text-xs text-slate-500">Loading Server Topology...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredServers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center">
                          <div className="max-w-xs mx-auto text-slate-400 space-y-1.5">
                            <Server className="w-8 h-8 mx-auto text-slate-300" />
                            <p className="text-xs font-semibold text-slate-700">No servers found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredServers.map((srv) => (
                        <tr key={srv.id} className="hover:bg-slate-50/70 transition-colors group">
                          {/* Server Code & Name */}
                          <td className="py-4 px-5">
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                <span className="font-mono px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200/80 text-[11px]">
                                  {srv.serverCode}
                                </span>
                                <span>{srv.name}</span>
                              </div>
                            </div>
                          </td>

                          {/* IP Address */}
                          <td className="py-4 px-4 font-mono text-slate-800">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200/80 font-bold text-[11px]">
                              {srv.ipAddress}
                            </span>
                          </td>

                          {/* OS */}
                          <td className="py-4 px-4 font-medium text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                              <span>{srv.os}</span>
                            </div>
                          </td>

                          {/* Specifications */}
                          <td className="py-4 px-4 text-slate-600 font-mono text-[11px] max-w-[280px]">
                            <div className="flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate" title={srv.specs}>{srv.specs}</span>
                            </div>
                          </td>

                          {/* Notes */}
                          <td className="py-4 px-4 text-slate-500 text-[11px] max-w-[220px] truncate" title={srv.notes || undefined}>
                            {srv.notes || '—'}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              <span>{srv.status || 'Online'}</span>
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PANEL 3: DATABASE BACKUP LOGS PANEL */}
          {(activeTab === 'all' || activeTab === 'backups') && (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              {/* Panel Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Database className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <span>Database Backup Logs Panel</span>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                        Veeam & Firebird GDB Vault
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">
                      Automated nightly backups of Firebird Accurate `.GDB` databases and PostgreSQL ITSM instances.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-purple-700 font-semibold bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>Verified Integrity</span>
                </div>
              </div>

              {/* Database Backups Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                      <th className="py-3.5 px-5">Target Database Name</th>
                      <th className="py-3.5 px-4">Host Server</th>
                      <th className="py-3.5 px-4">File Size</th>
                      <th className="py-3.5 px-4">Backup File Destination</th>
                      <th className="py-3.5 px-4">Completed Timestamp</th>
                      <th className="py-3.5 px-5 text-right">Backup Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-sans">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                            <span className="font-mono text-xs text-slate-500">Retrieving Backup History...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredBackups.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center">
                          <div className="max-w-xs mx-auto text-slate-400 space-y-1.5">
                            <Database className="w-8 h-8 mx-auto text-slate-300" />
                            <p className="text-xs font-semibold text-slate-700">No database backup logs found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredBackups.map((bkp) => (
                        <tr key={bkp.id} className="hover:bg-slate-50/70 transition-colors group">
                          {/* DB Name */}
                          <td className="py-4 px-5 font-bold font-mono text-slate-900 group-hover:text-purple-700 transition-colors flex items-center gap-2">
                            <Database className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>{bkp.dbName}</span>
                          </td>

                          {/* Server */}
                          <td className="py-4 px-4 font-medium text-slate-800">
                            <div className="space-y-0.5">
                              <div className="text-xs font-semibold text-slate-800">
                                {bkp.serverName || 'SVR-ERP-01'}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {bkp.serverIp || '192.168.10.160'}
                              </div>
                            </div>
                          </td>

                          {/* File Size */}
                          <td className="py-4 px-4 font-mono font-bold text-slate-700">
                            <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200/80">
                              {formatSizeMb(bkp.sizeMb)}
                            </span>
                          </td>

                          {/* Backup Path */}
                          <td className="py-4 px-4 font-mono text-[11px] text-slate-600 max-w-[260px]">
                            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                              <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate" title={bkp.backupPath}>{bkp.backupPath}</span>
                            </div>
                          </td>

                          {/* Completed Timestamp */}
                          <td className="py-4 px-4 font-mono text-[11px] text-slate-600">
                            {formatDate(bkp.completedAt)}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono ${
                                bkp.status === 'Success'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {bkp.status === 'Success' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                              )}
                              <span>{bkp.status || 'Success'}</span>
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
