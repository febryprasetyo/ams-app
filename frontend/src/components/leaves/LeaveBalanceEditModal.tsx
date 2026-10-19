'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  Save,
  RefreshCw,
  User,
  ShieldAlert,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { MasterLeaveBalanceItem, UpdateLeaveBalancePayload } from '@/types/leaves';
import {
  calculateCleanQuota,
  calculateTotalEntitlement,
  calculateRemainingQuota,
  getLeaveBalanceStatus,
  formatIndoDays,
} from '@/lib/leaves/masterLeaveUtils';

interface LeaveBalanceEditModalProps {
  balance: MasterLeaveBalanceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (balanceId: number, payload: UpdateLeaveBalancePayload) => Promise<{ success: boolean; message?: string }>;
}

export default function LeaveBalanceEditModal({
  balance,
  isOpen,
  onClose,
  onSave,
}: LeaveBalanceEditModalProps) {
  const [baseQuota, setBaseQuota] = useState<number>(balance?.baseQuota ?? 12);
  const [carriedOverQuota, setCarriedOverQuota] = useState<number>(balance?.carriedOverQuota ?? 0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (balance) {
      setBaseQuota(balance.baseQuota);
      setCarriedOverQuota(balance.carriedOverQuota);
      setErrorMessage(null);
    }
  }, [balance]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !balance) return null;

  const collectiveDeduction = balance.collectiveLeaveDeduction;
  const usedQuota = balance.usedQuota;

  const previewCleanQuota = calculateCleanQuota(baseQuota, collectiveDeduction);
  const previewTotalEntitlement = calculateTotalEntitlement(previewCleanQuota, carriedOverQuota);
  const previewRemaining = calculateRemainingQuota(previewTotalEntitlement, usedQuota);
  const previewStatus = getLeaveBalanceStatus(previewRemaining);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (balance.balanceId === null || balance.balanceId === undefined) {
      setErrorMessage('Record saldo belum terinisialisasi. Silakan simpan kebijakan tahunan terlebih dahulu.');
      return;
    }

    if (baseQuota < 0 || carriedOverQuota < 0) {
      setErrorMessage('Angka kuota dasar dan carry over tidak boleh bernilai negatif.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: UpdateLeaveBalancePayload = {
        baseQuota: Number(baseQuota),
        carriedOverQuota: Number(carriedOverQuota),
      };

      const result = await onSave(balance.balanceId, payload);
      if (result.success) {
        onClose();
      } else {
        setErrorMessage(result.message || 'Gagal menyimpan penyesuaian saldo.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan penyesuaian saldo.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-balance-title"
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 id="edit-balance-title" className="text-base font-bold text-slate-900 dark:text-white">
                Penyesuaian Saldo Cuti Individual
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tahun Kalender: {balance.year}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Employee Summary Banner */}
        <div className="px-6 py-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {balance.fullName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {balance.employeeCode} • {balance.department} ({balance.position})
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Cuti Bersama
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              -{balance.collectiveLeaveDeduction} Hari
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Hak Kuota Dasar
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={baseQuota}
                  onChange={(e) => setBaseQuota(Number(e.target.value))}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">Hari</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Standar umum: 12 hari</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Carry Over (Bawaan)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={carriedOverQuota}
                  onChange={(e) => setCarriedOverQuota(Number(e.target.value))}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">Hari</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Sisa dari tahun sebelumnya</p>
            </div>
          </div>

          {/* Pratinjau Kalkulasi Instan */}
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/60 to-slate-50/60 dark:from-indigo-950/20 dark:to-slate-900/20 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-950 dark:text-indigo-200">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Kalkulasi Pratinjau Saldo:
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  previewStatus === 'SAFE'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : previewStatus === 'WARNING'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                }`}
              >
                Status: {previewStatus === 'SAFE' ? 'Aman' : previewStatus === 'WARNING' ? 'Menipis' : 'Habis'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40 text-center">
              <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Hak Bersih</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{previewCleanQuota} Hari</span>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total Hak</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{previewTotalEntitlement} Hari</span>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Sisa Cuti</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{previewRemaining} Hari</span>
              </div>
            </div>
          </div>

          {/* Info proteksi custom */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-xs">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p>
              Penyesuaian manual akan menandai karyawan ini memiliki <strong>kuota khusus</strong>, sehingga tidak akan ditimpa saat sinkronisasi kebijakan cuti massal.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Simpan Penyesuaian Saldo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
