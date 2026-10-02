'use client';

import React from 'react';
import { ExternalLink, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import type { AccurateServerMonitoring } from './types';
import { formatDate, formatUptime } from './utils';

interface AccurateServerCardProps {
  server: AccurateServerMonitoring;
  isSyncing: boolean;
  onSync: () => void;
}

export default function AccurateServerCard({
  server,
  isSyncing,
  onSync,
}: AccurateServerCardProps) {
  const isOnline = server.status === 'Online';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-emerald-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <h2 className="font-extrabold text-slate-900">{server.hostname}</h2>
          </div>
          <p className="mt-1 font-mono text-xs text-slate-500">{server.ipAddress}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {server.status}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-slate-400">Lisensi</dt>
          <dd className="mt-1 font-bold text-slate-800">
            {server.activeLicensesCount} aktif / {server.licensesCount}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Database</dt>
          <dd className="mt-1 font-bold text-slate-800">
            {server.databases?.length ?? 0} file
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Accurate</dt>
          <dd className="mt-1 font-bold text-slate-800">
            {server.isAccurateActive ? 'Aktif' : 'Tidak aktif'}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Firebird</dt>
          <dd className="mt-1 font-bold text-slate-800">
            {server.isFirebirdActive ? 'Aktif' : 'Tidak aktif'}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Uptime</dt>
          <dd className="mt-1 font-bold text-slate-800">
            {formatUptime(server.uptimeSeconds)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Signal terakhir</dt>
          <dd className="mt-1 font-bold text-slate-800">
            {formatDate(server.lastSeenAt)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing || !server.licenseServerUrl}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`}
          />
          Sync lisensi
        </button>
        {server.licenseServerUrl && (
          <a
            href={server.licenseServerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-emerald-600 transition-colors"
            title="Buka License Server"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </article>
  );
}
