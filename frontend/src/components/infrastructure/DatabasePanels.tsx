'use client';

import React from 'react';
import { Database, HardDrive } from 'lucide-react';
import type { AccurateServerMonitoring } from './types';
import { formatDate, formatBytes } from './utils';

interface DatabasePanelsProps {
  servers: AccurateServerMonitoring[];
}

export default function DatabasePanels({ servers }: DatabasePanelsProps) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-extrabold text-slate-900">
          <Database className="h-5 w-5 text-amber-600" />
          Accurate Database
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          File database yang terakhir dilaporkan oleh accurate_agent.ps1 pada masing-masing server.
        </p>
      </div>

      {servers.map((server) => (
        <article
          key={server.id}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900">
                {server.hostname}{' '}
                <span className="font-mono text-xs font-normal text-slate-500">({server.ipAddress})</span>
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {server.os || 'OS belum dilaporkan'} • Signal {formatDate(server.lastSeenAt)}
              </p>
            </div>
            <div className="flex gap-2 text-[11px] font-bold">
              <span
                className={`rounded-full px-2.5 py-1 ${
                  server.isFirebirdActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
              >
                Firebird {server.isFirebirdActive ? 'aktif' : 'tidak aktif'}
              </span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                {server.databases.length} database •{' '}
                {formatBytes(server.databases.reduce((sum, item) => sum + Number(item.fileSizeBytes), 0))}
              </span>
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
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                      Agent belum melaporkan file .gdb pada server ini.
                    </td>
                  </tr>
                ) : (
                  server.databases.map((database) => (
                    <tr key={database.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-bold text-slate-900">
                        <HardDrive className="mr-2 inline h-4 w-4 text-amber-600" />
                        {database.dbName}
                      </td>
                      <td
                        className="max-w-md truncate px-4 py-3 font-mono text-slate-600"
                        title={database.filePath}
                      >
                        {database.filePath}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        {database.fileSizeFormatted}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {formatDate(database.lastModifiedAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`rounded-full px-2.5 py-1 font-bold ${
                            database.status === 'Online'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {database.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </section>
  );
}
