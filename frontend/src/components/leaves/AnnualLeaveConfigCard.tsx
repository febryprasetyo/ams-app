'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Save,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { AnnualLeaveConfig } from '@/types/leaves';
import { calculateCleanQuota } from '@/lib/leaves/masterLeaveUtils';

interface AnnualLeaveConfigCardProps {
  initialConfig?: AnnualLeaveConfig | null;
  onSave: (config: AnnualLeaveConfig) => Promise<{ success: boolean; message?: string; syncedCount?: number }>;
  isLoading?: boolean;
}

export default function AnnualLeaveConfigCard({
  initialConfig,
  onSave,
  isLoading = false,
}: AnnualLeaveConfigCardProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(initialConfig?.year || currentYear);
  const [baseQuota, setBaseQuota] = useState<number>(initialConfig?.baseQuota ?? 12);
  const [collectiveLeaveDays, setCollectiveLeaveDays] = useState<number>(
    initialConfig?.collectiveLeaveDays ?? 0
  );
  const [notes, setNotes] = useState<string>(initialConfig?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setYear(initialConfig.year);
      setBaseQuota(initialConfig.baseQuota);
      setCollectiveLeaveDays(initialConfig.collectiveLeaveDays);
      setNotes(initialConfig.notes || '');
    }
  }, [initialConfig]);

  const cleanQuotaPreview = calculateCleanQuota(baseQuota, collectiveLeaveDays);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);
    try {
      await onSave({
        year,
        baseQuota,
        collectiveLeaveDays,
        allowCarryForward: false,
        maxCarryForwardDays: 0,
        notes: notes.trim() || null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs">
      <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Pengaturan Kebijakan Cuti Tahunan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Konfigurasi hak kuota dasar & potongan cuti bersama untuk tahun kalender {year}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tahun Kalender */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Tahun Kalender
            </label>
            <div className="relative">
              <input
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                disabled={isLoading || isSubmitting}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-all font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
              <Calendar className="absolute right-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Periode berlakunya kebijakan cuti</p>
          </div>

          {/* Hak Cuti Dasar Default */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Hak Dasar Cuti Tahunan
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={60}
                value={baseQuota}
                onChange={(e) => setBaseQuota(Number(e.target.value))}
                disabled={isLoading || isSubmitting}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-all font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400 pointer-events-none">
                Hari
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Standar perusahaan umum: 12 hari</p>
          </div>

          {/* Cuti Bersama Tahunan */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Potongan Cuti Bersama
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={30}
                value={collectiveLeaveDays}
                onChange={(e) => setCollectiveLeaveDays(Number(e.target.value))}
                disabled={isLoading || isSubmitting}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-all font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400 pointer-events-none">
                Hari
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Mengurangi langsung dari hak dasar</p>
          </div>
        </div>

        {/* Live Quota Formula Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-900 dark:text-emerald-300">
            <HelpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span>Kalkulasi Hak Cuti Bersih Default Karyawan: </span>
              <span className="font-mono text-emerald-800 dark:text-emerald-300">
                {baseQuota} (Dasar) - {collectiveLeaveDays} (Cuti Bersama)
              </span>
            </div>
          </div>
          <div className="px-4 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 text-sm font-bold text-emerald-700 dark:text-emerald-400 shadow-2xs self-start sm:self-auto">
            {cleanQuotaPreview} Hari Bersih
          </div>
        </div>

        {/* Catatan Kebijakan HR */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Catatan Kebijakan HR (Opsional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading || isSubmitting}
            placeholder="Contoh: Berdasarkan SKB 3 Menteri dan Keputusan Direksi tentang Libur & Cuti Bersama 2026."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Menyimpan Kebijakan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan & Terapkan Kebijakan
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                <AlertCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Terapkan Kebijakan Cuti {year}?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Menyimpan kebijakan ini akan memperbarui potongan <strong>Cuti Bersama ({collectiveLeaveDays} Hari)</strong> dan menghitung ulang hak bersih untuk <strong>seluruh staf aktif</strong> di tahun {year}.
            </p>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5 text-xs text-slate-600 dark:text-slate-400 mb-6 space-y-2 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                Karyawan dengan kuota khusus tidak akan tertimpa.
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                Karyawan baru di tahun {year} otomatis mendapatkan kuota bersih {cleanQuotaPreview} hari.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                Ya, Terapkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
