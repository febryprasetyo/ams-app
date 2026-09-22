'use client';

import React from 'react';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import type { AccurateServerMonitoring } from './types';
import { formatDate } from './utils';

interface MonitoringToolbarProps {
  servers: AccurateServerMonitoring[];
  activeTab: 'licenses' | 'database';
  onTabChange: (tab: 'licenses' | 'database') => void;
  selectedServerId: number | 'all';
  onServerChange: (id: number | 'all') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeLicenses: number;
  totalLicenses: number;
  lastSyncedAt: string | null;
  syncingServer: number | 'all' | null;
  onSync: (id: number | 'all') => void;
}

export default function MonitoringToolbar({
  servers,
  activeTab,
  onTabChange,
  selectedServerId,
  onServerChange,
  searchQuery,
  onSearchChange,
  activeLicenses,
  totalLicenses,
  lastSyncedAt,
  syncingServer,
  onSync,
}: MonitoringToolbarProps) {
  const isSyncing = syncingServer !== null;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Accurate Monitoring</h1>
          <p className="text-xs text-slate-500">
            {activeLicenses} aktif · {totalLicenses} total
            {lastSyncedAt && ` · Sync ${formatDate(lastSyncedAt)}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSync(selectedServerId)}
            disabled={isSyncing}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSyncing && syncingServer === selectedServerId ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {selectedServerId === 'all' ? 'Sync Semua' : 'Sync Server'}
          </button>
          {selectedServerId !== 'all' && (
            <button
              type="button"
              onClick={() => onSync('all')}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSyncing && syncingServer === 'all' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Sync Semua
            </button>
          )}
        </div>
      </div>

      {/* Tabs + Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => onTabChange('licenses')}
            className={`rounded-lg px-3 py-1.5 transition-colors cursor-pointer ${
              activeTab === 'licenses'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Lisensi
          </button>
          <button
            type="button"
            onClick={() => onTabChange('database')}
            className={`rounded-lg px-3 py-1.5 transition-colors cursor-pointer ${
              activeTab === 'database'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Database
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedServerId}
            onChange={(event) =>
              onServerChange(event.target.value === 'all' ? 'all' : Number(event.target.value))
            }
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
          >
            <option value="all">Semua server</option>
            {servers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.hostname}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cari lisensi, host, IP…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-700 sm:w-64"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
