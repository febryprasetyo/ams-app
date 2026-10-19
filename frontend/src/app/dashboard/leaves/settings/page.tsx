'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Settings,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AnnualLeaveConfig } from '@/types/leaves';
import AnnualLeaveConfigCard from '@/components/leaves/AnnualLeaveConfigCard';

export default function LeaveSettingsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [config, setConfig] = useState<AnnualLeaveConfig | null>(null);

  const fetchConfig = useCallback(async (year: number) => {
    setIsLoadingConfig(true);
    setPageError(null);
    try {
      const data = await api.get<AnnualLeaveConfig>(`/leaves/master/config?year=${year}`);
      setConfig(data);
    } catch (err: unknown) {
      console.error('Failed to load leave config:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat pengaturan cuti tahunan.';
      setPageError(msg);
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig(selectedYear);
  }, [selectedYear, fetchConfig]);

  const handleSaveConfig = async (payload: AnnualLeaveConfig) => {
    try {
      const res = await api.post<{ success: boolean; message: string; config: AnnualLeaveConfig; syncedCount?: number }>(
        '/leaves/master/config',
        payload
      );
      if (payload.year !== selectedYear) {
        setSelectedYear(payload.year);
      } else {
        await fetchConfig(payload.year);
      }
      setToastMessage({
        type: 'success',
        text: res.message || `Kebijakan cuti tahun ${payload.year} berhasil disimpan & disinkronkan.`,
      });
      return {
        success: true,
        message: res.message || `Kebijakan cuti tahun ${payload.year} berhasil disimpan.`,
        syncedCount: res.syncedCount,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan konfigurasi.';
      return {
        success: false,
        message: msg,
      };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <Link href="/dashboard/leaves" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
              Cuti
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Pengaturan Cuti
            </span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Pengaturan Kebijakan Cuti
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola hak kuota cuti tahunan dasar dan potongan cuti bersama pemerintah
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar / Year & Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Pilih Tahun Kalender"
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => fetchConfig(selectedYear)}
            disabled={isLoadingConfig}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingConfig ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            Muat Ulang
          </button>
        </div>
      </div>

      {/* Global Toast Banner */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-fadeIn ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {pageError && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div>
            <p className="text-sm font-semibold">Gagal Mengambil Data</p>
            <p className="text-xs mt-0.5">{pageError}</p>
          </div>
        </div>
      )}

      {/* Form Kebijakan Cuti Tahunan */}
      <AnnualLeaveConfigCard
        initialConfig={config}
        onSave={handleSaveConfig}
        isLoading={isLoadingConfig}
      />
    </div>
  );
}
