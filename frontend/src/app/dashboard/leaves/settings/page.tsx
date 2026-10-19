'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  AnnualLeaveConfig,
  MasterLeaveBalanceItem,
  MasterLeaveBalancesResponse,
  UpdateLeaveBalancePayload,
} from '@/types/leaves';
import AnnualLeaveStatsCards from '@/components/leaves/AnnualLeaveStatsCards';
import AnnualLeaveConfigCard from '@/components/leaves/AnnualLeaveConfigCard';
import MasterLeaveBalancesTable from '@/components/leaves/MasterLeaveBalancesTable';
import LeaveBalanceEditModal from '@/components/leaves/LeaveBalanceEditModal';

export default function LeaveSettingsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [config, setConfig] = useState<AnnualLeaveConfig | null>(null);
  const [balances, setBalances] = useState<MasterLeaveBalanceItem[]>([]);
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
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit balance modal state
  const [editingBalance, setEditingBalance] = useState<MasterLeaveBalanceItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

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

  const fetchBalancesAndStats = useCallback(async (year: number) => {
    setIsLoadingData(true);
    try {
      const data = await api.get<MasterLeaveBalancesResponse>(`/leaves/master/balances?year=${year}`);
      if (data) {
        setBalances(data.balances || []);
        setStats({
          totalEmployees: data.totalEmployees || 0,
          averageRemainingDays: data.averageRemainingDays || 0,
          totalUsedDays: data.totalUsedDays || 0,
          totalAllocatedQuota: data.totalAllocatedQuota || 0,
        });
      }
    } catch (err: unknown) {
      console.error('Failed to load leave balances:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const loadAllData = useCallback(async (year: number) => {
    setPageError(null);
    try {
      await Promise.all([fetchConfig(year), fetchBalancesAndStats(year)]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data master cuti.';
      setPageError(msg);
    }
  }, [fetchConfig, fetchBalancesAndStats]);

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

  const handleOpenEditModal = (item: MasterLeaveBalanceItem) => {
    setEditingBalance(item);
    setIsEditModalOpen(true);
  };

  const handleSaveBalance = async (balanceId: number, payload: UpdateLeaveBalancePayload) => {
    try {
      const res = await api.put<{ success: boolean; message: string; balance: unknown }>(
        `/leaves/master/balances/${balanceId}`,
        payload
      );
      // Refresh list to recalculate aggregates
      await fetchBalancesAndStats(selectedYear);
      setToastMessage({
        type: 'success',
        text: res.message || 'Saldo cuti karyawan berhasil diperbarui.',
      });
      return { success: true, message: res.message };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui saldo cuti.';
      return { success: false, message: msg };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
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
                Pengaturan & Rekapitulasi Cuti
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola cuti bersama tahunan, aturan rollover carry forward, dan penyesuaian saldo staf
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar / Refresh */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadAllData(selectedYear)}
            disabled={isLoadingConfig || isLoadingData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${(isLoadingConfig || isLoadingData) ? 'animate-spin' : ''}`} />
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
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
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

      {/* 4 Statistik Ringkasan Kartu */}
      <AnnualLeaveStatsCards
        totalEmployees={stats.totalEmployees}
        averageRemainingDays={stats.averageRemainingDays}
        totalUsedDays={stats.totalUsedDays}
        totalAllocatedQuota={stats.totalAllocatedQuota}
        isLoading={isLoadingData}
      />

      {/* Form Kebijakan Cuti Tahunan */}
      <AnnualLeaveConfigCard
        initialConfig={config}
        onSave={handleSaveConfig}
        isLoading={isLoadingConfig}
      />

      {/* Tabel Rekapitulasi Saldo Cuti Seluruh Karyawan */}
      <MasterLeaveBalancesTable
        balances={balances}
        isLoading={isLoadingData}
        onEditBalance={handleOpenEditModal}
        year={selectedYear}
      />

      {/* Modal Penyesuaian Saldo Individual */}
      <LeaveBalanceEditModal
        balance={editingBalance}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveBalance}
      />
    </div>
  );
}
