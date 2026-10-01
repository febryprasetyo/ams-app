'use client';

import React from 'react';
import { Database, Laptop, Search } from 'lucide-react';
import type { AccurateServerMonitoring } from './types';

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
  databaseCount: number;
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
  databaseCount,
}: MonitoringToolbarProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onTabChange('licenses')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'licenses'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Laptop className="mr-2 inline h-4 w-4" />
            Accurate 5 Live Users ({activeLicenses}/{totalLicenses})
          </button>
          <button
            type="button"
            onClick={() => onTabChange('database')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'database'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Database className="mr-2 inline h-4 w-4" />
            Accurate Database ({databaseCount})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row">
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
