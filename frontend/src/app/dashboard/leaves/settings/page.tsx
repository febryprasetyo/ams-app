'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ChevronRight,
  Settings,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AnnualLeaveConfig, MasterLeaveBalancesResponse } from '@/types/leaves';
import AnnualLeaveStatsCards from '@/components/leaves/AnnualLeaveStatsCards';
import AnnualLeaveConfigCard from '@/components/leaves/AnnualLeaveConfigCard';

export default function LeaveSettingsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [config, setConfig] = useState<AnnualLeaveConfig | null>(null);
  const [stats, setStats] = useState<{
    totalEmployees: number;
    averageRemainingDays: number;
    totalUsedDays: number;
    totalAllocatedQuota: number;
  }>({
    totalEmployees: 0,
    averageRemainingDays: 0,
    totalUsedDays: 0,
    totalAllocatedQuota: 0,
  });

  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const fetchConfig = useCallback(async (year: number) => {
    setIsLoadingConfig(true);
    try {
      const data = await api.get<AnnualLeaveConfig>(`/leaves/master/config?year=${year}`);
      setConfig(data);
    } catch (err: unknown) {
      console.error('Failed to load leave config:', err);
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  const fetchStats = useCallback(async (year: number) => {
    setIsLoadingStats(true);
    try {
      const data = await api.get<MasterLeaveBalancesResponse>(`/leaves/master/balances?year=${year}`);
      if (data) {
        setStats({
          totalEmployees: data.totalEmployees || 0,
          averageRemainingDays: data.averageRemainingDays || 0,
          totalUsedDays: data.totalUsedDays || 0,
          totalAllocatedQuota: data.totalAllocatedQuota || 0,
        });
      }
    } catch (err: unknown) {
      console.error('Failed to load leave stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const loadAllData = useCallback(async (year: number) => {
    setPageError(null);
    try {
      await Promise.all([fetchConfig(year), fetchStats(year)]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data master cuti.';
      setPageError(msg);
    }
  }, [fetchConfig, fetchStats]);

  useEffect(() => {
    loadAllData(selectedYear);
  }, [selectedYear, loadAllData]);

  const handleSaveConfig = async (payload: AnnualLeaveConfig) => {
    try {
      const res = await api.post<{ success: boolean; message: string; config: AnnualLeaveConfig; syncedCount?: number }>(
        '/leaves/master/config',
        payload
      );
      if (payload.year !== selectedYear) {
        setSelectedYear(payload.year);
      } else {
        await loadAllData(payload.year);
      }
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Link href="/dashboard/attendance" className="hover:text-slate-800 dark:hover:text-slate-200">
              Absensi
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/dashboard/leaves" className="hover:text-slate-800 dark:hover:text-slate-200">
              Pengajuan Cuti
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Pengaturan Cuti
            </span>
          </nav>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Pengaturan & Kebijakan Cuti
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola cuti bersama tahunan, aturan rollover, dan rekapitulasi saldo karyawan
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar / Refresh */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadAllData(selectedYear)}
            disabled={isLoadingConfig || isLoadingStats}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${(isLoadingConfig || isLoadingStats) ? 'animate-spin' : ''}`} />
            Muat Ulang
          </button>
        </div>
      </div>

      {pageError && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div>
            <p className="text-sm font-semibold">Gagal Mengambil Data</p>
            <p className="text-xs mt-0.5">{pageError}</p>
          </div>
        </div>
      )}

      {/* 4 Statistik Ringkasan Kartu */}
      <AnnualLeaveStatsCards
        totalEmployees={stats.totalEmployees}
        averageRemainingDays={stats.averageRemainingDays}
        totalUsedDays={stats.totalUsedDays}
        totalAllocatedQuota={stats.totalAllocatedQuota}
        isLoading={isLoadingStats}
      />

      {/* Form Kebijakan Cuti Tahunan */}
      <AnnualLeaveConfigCard
        initialConfig={config}
        onSave={handleSaveConfig}
        isLoading={isLoadingConfig}
      />
    </div>
  );
}
