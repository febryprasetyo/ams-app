'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Save,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Info,
  ShieldCheck,
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
  const [allowCarryForward, setAllowCarryForward] = useState<boolean>(
    initialConfig?.allowCarryForward ?? false
  );
  const [maxCarryForwardDays, setMaxCarryForwardDays] = useState<number>(
    initialConfig?.maxCarryForwardDays ?? 0
  );
  const [notes, setNotes] = useState<string>(initialConfig?.notes || '');

  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (initialConfig) {
      setYear(initialConfig.year);
      setBaseQuota(initialConfig.baseQuota);
      setCollectiveLeaveDays(initialConfig.collectiveLeaveDays);
      setAllowCarryForward(initialConfig.allowCarryForward);
      setMaxCarryForwardDays(initialConfig.maxCarryForwardDays);
      setNotes(initialConfig.notes || '');
    }
  }, [initialConfig]);

  const cleanQuotaPreview = calculateCleanQuota(baseQuota, collectiveLeaveDays);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (baseQuota < 0 || collectiveLeaveDays < 0 || maxCarryForwardDays < 0) {
      setFeedback({
        type: 'error',
        message: 'Angka kuota cuti tidak boleh bernilai negatif.',
      });
      return;
    }

    if (allowCarryForward && maxCarryForwardDays <= 0) {
      setFeedback({
        type: 'error',
        message: 'Batas maksimal hari bawaan cuti (carry forward) harus lebih dari 0 jika diaktifkan.',
      });
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    setShowConfirmModal(false);

    try {
      const payload: AnnualLeaveConfig = {
        year,
        baseQuota: Number(baseQuota) || 12,
        collectiveLeaveDays: Number(collectiveLeaveDays) || 0,
        allowCarryForward,
        maxCarryForwardDays: allowCarryForward ? Number(maxCarryForwardDays) || 0 : 0,
        notes: notes.trim() || null,
      };

      const result = await onSave(payload);
      if (result.success) {
        setFeedback({
          type: 'success',
          message: result.message || `Kebijakan cuti tahun ${year} berhasil disimpan dan disinkronkan ke seluruh karyawan aktif.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: result.message || 'Gagal menyimpan konfigurasi master cuti.',
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data.';
      setFeedback({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Pengaturan Kebijakan Cuti Tahunan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Konfigurasi hak dasar, potongan cuti bersama, dan rollover carry forward
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
            <ShieldCheck className="h-3.5 w-3.5" />
            Tahun Berjalan: {year}
          </span>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`mx-6 mt-4 p-3.5 rounded-lg text-sm flex items-start gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          )}
          <p className="font-medium">{feedback.message}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tahun Kalender */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Tahun Kalender
            </label>
            <input
              type="number"
              min={2020}
              max={2040}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              disabled={isLoading || isSubmitting}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all font-medium"
              required
            />
            <p className="mt-1 text-[11px] text-slate-500">Tahun acuan kalender kerja</p>
          </div>

          {/* Kuota Dasar Default */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Hak Cuti Dasar (Hari)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={365}
                value={baseQuota}
                onChange={(e) => setBaseQuota(Number(e.target.value))}
                disabled={isLoading || isSubmitting}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all font-medium"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400">Hari / Thn</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Standar umum: 12 hari kerja</p>
          </div>

          {/* Total Cuti Bersama */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Cuti Bersama Tahunan (Hari)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={365}
                value={collectiveLeaveDays}
                onChange={(e) => setCollectiveLeaveDays(Number(e.target.value))}
                disabled={isLoading || isSubmitting}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all font-medium"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400">Hari</span>
            </div>
            <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Info className="h-3 w-3 shrink-0" />
              Memotong hak cuti bersih karyawan
            </p>
          </div>
        </div>

        {/* Live Calculation Preview Banner */}
        <div className="rounded-lg border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0">
              =
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                Pratinjau Hak Cuti Bersih Default ({year}):
              </p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-400">
                Formula: Kuota Dasar ({baseQuota}) - Cuti Bersama ({collectiveLeaveDays})
              </p>
            </div>
          </div>
          <div className="px-4 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800/80 text-sm font-bold text-indigo-600 dark:text-indigo-400 shadow-sm">
            {cleanQuotaPreview} Hari Bersih
          </div>
        </div>

        {/* Carry Forward Section */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-slate-50/30 dark:bg-slate-800/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allowCarryForward"
                checked={allowCarryForward}
                onChange={(e) => setAllowCarryForward(e.target.checked)}
                disabled={isLoading || isSubmitting}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label
                htmlFor="allowCarryForward"
                className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer select-none"
              >
                Izinkan Bawa Sisa Cuti (Carry Forward) dari Tahun Sebelumnya ({year - 1})
              </label>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                allowCarryForward
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {allowCarryForward ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>

          {allowCarryForward && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Batas Maksimal Hari Rollover
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={maxCarryForwardDays}
                    onChange={(e) => setMaxCarryForwardDays(Number(e.target.value))}
                    disabled={isLoading || isSubmitting}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all font-medium"
                    placeholder="Contoh: 5"
                    required={allowCarryForward}
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">Hari</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Sisa cuti di atas batas ini akan hangus otomatis.
                </p>
              </div>

              <div className="flex items-center text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                <HelpCircle className="h-4 w-4 text-indigo-500 mr-2 shrink-0" />
                Sisa saldo tahun {year - 1} akan di-rollover otomatis saat sinkronisasi saldo dijalankan.
              </div>
            </div>
          )}
        </div>

        {/* Catatan Kebijakan HR */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            Catatan Kebijakan HR (Opsional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading || isSubmitting}
            placeholder="Contoh: SK Direksi No. 04/HR/2026 tentang Penetapan Hari Libur & Cuti Bersama 2026."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Menyimpan & Menerapkan Saldo...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan & Terapkan Saldo
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Terapkan Kebijakan Cuti {year}?
              </h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Menyimpan kebijakan ini akan memperbarui potongan <strong>Cuti Bersama ({collectiveLeaveDays} Hari)</strong> dan menghitung ulang hak bersih untuk <strong>seluruh karyawan aktif</strong> di tahun {year}.
            </p>

            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-slate-600 dark:text-slate-400 mb-6 space-y-1.5 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Karyawan dengan penyesuaian khusus (custom override) tidak akan tertimpa.
              </div>
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Karyawan baru di tahun {year} akan dibuatkan saldo default otomatis.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white shadow-sm transition-colors flex items-center gap-2"
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
