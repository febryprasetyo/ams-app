'use client';

import React from 'react';
import type { AccurateLicenseLog } from './types';
import { formatDate } from './utils';

interface AccurateLicenseTableProps {
  licenses: AccurateLicenseLog[];
}

export default function AccurateLicenseTable({ licenses }: AccurateLicenseTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h2 className="font-extrabold text-slate-900">Accurate 5 Live Users</h2>
        <p className="mt-1 text-xs text-slate-500">
          Data tersimpan dari sync manual terakhir; membuka halaman tidak memicu sinkronisasi.
        </p>
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
            {licenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  Belum ada data lisensi tersimpan untuk pilihan ini.
                </td>
              </tr>
            ) : (
              licenses.map((license) => (
                <tr key={`${license.serverId}-${license.licenseKey}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-700">{license.serverHostname}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">#{license.no}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{license.licenseKey}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{license.host || 'Unassigned'}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{license.ip || '—'}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{license.version || '—'}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{formatDate(license.date)}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        license.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {license.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
