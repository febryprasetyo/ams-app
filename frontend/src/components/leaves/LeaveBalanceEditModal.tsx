'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { MasterLeaveBalanceItem, UpdateLeaveBalancePayload } from '@/types/leaves';
import {
  calculateCleanQuota,
  calculateRemainingQuota,
  getLeaveBalanceStatus,
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
  const [baseQuota, setBaseQuota] = useState<number>(12);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (balance) {
      setBaseQuota(balance.baseQuota);
      setErrorMessage(null);
    }
  }, [balance]);

  if (!isOpen || !balance) return null;

  // Pratinjau kalkulasi instan
  const previewCleanQuota = calculateCleanQuota(baseQuota, balance.collectiveLeaveDeduction);
  const previewRemaining = calculateRemainingQuota(previewCleanQuota, balance.usedQuota);
  const previewStatus = getLeaveBalanceStatus(previewRemaining);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balance.balanceId) {
      setErrorMessage('ID Saldo tidak ditemukan. Pastikan data tersimpan.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await onSave(balance.balanceId, {
        baseQuota,
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.message || 'Gagal menyimpan penyesuaian saldo.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Penyesuaian Saldo Karyawan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ubah hak dasar kuota cuti tahunan staf untuk tahun {balance.year}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
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
          <div className="mx-6 mt-4 p-3 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Hak Kuota Dasar Cuti
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={60}
                value={baseQuota}
                onChange={(e) => setBaseQuota(Number(e.target.value))}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400 pointer-events-none">
                Hari
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Standar umum kebijakan: 12 hari</p>
          </div>

          {/* Pratinjau Kalkulasi Instan */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-950 dark:text-emerald-200">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
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

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-center">
              <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-emerald-100 dark:border-slate-800 shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Hak Bersih</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{previewCleanQuota} Hari</span>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-emerald-100 dark:border-slate-800 shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Sisa Saldo</span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{previewRemaining} Hari</span>
              </div>
            </div>
          </div>

          {/* Info proteksi custom */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 text-xs">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p>
              Penyesuaian manual akan menandai karyawan ini memiliki <strong>kuota khusus</strong>, sehingga tidak tertimpa saat sinkronisasi kebijakan cuti massal.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Simpan Penyesuaian
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
