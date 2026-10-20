'use client';

import React, { useState } from 'react';
import { Loader2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import ModalShell from '@/components/ui/ModalShell';
import { api } from '@/lib/api';
import { GA_API_PATH } from '@/lib/goodsRequests';
import { GoodsRequestStatus, getStatusLabel } from '@/lib/ga/goodsRequestStatus';
import { getAvailableTransitionsWithLabels } from '@/lib/ga/statusActions';

interface StatusTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  currentStatus: GoodsRequestStatus;
  onSuccess: () => void;
}

export default function StatusTransitionModal({
  isOpen,
  onClose,
  requestId,
  currentStatus,
  onSuccess,
}: StatusTransitionModalProps) {
  const options = getAvailableTransitionsWithLabels(currentStatus);
  const [selectedStatus, setSelectedStatus] = useState<GoodsRequestStatus>(
    options[0]?.value || 'draft'
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync selected status if modal opens or options change
  React.useEffect(() => {
    if (options.length > 0 && !options.some(o => o.value === selectedStatus)) {
      setSelectedStatus(options[0].value);
    }
    setError('');
    setNotes('');
  }, [isOpen, currentStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (selectedStatus === 'cancelled' && !notes.trim()) {
      setError('Catatan alasan pembatalan wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post(`${GA_API_PATH}/${requestId}/status`, {
        toStatus: selectedStatus,
        notes: notes.trim(),
      });
      onSuccess();
      onClose();
    } catch (cause) {
      setError((cause as Error).message || 'Gagal memperbarui status pengajuan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Pembaruan Status Administrasi GA"
      subtitle={`Status saat ini: ${getStatusLabel(currentStatus)}`}
      icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
      maxWidthClass="max-w-md"
      isLoading={loading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
            Pilih Status Tujuan Baru:
          </label>
          <div className="space-y-2">
            {options.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  selectedStatus === opt.value
                    ? 'border-emerald-600 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <input
                  type="radio"
                  name="targetStatus"
                  value={opt.value}
                  checked={selectedStatus === opt.value}
                  onChange={() => setSelectedStatus(opt.value)}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {opt.label}
                  </div>
                  {opt.description && (
                    <div className="mt-0.5 text-slate-500 dark:text-slate-400 leading-normal">
                      {opt.description}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="status-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Catatan Perubahan Administrasi {selectedStatus === 'cancelled' && <span className="text-rose-600">* (Wajib)</span>}
          </label>
          <textarea
            id="status-notes"
            rows={3}
            maxLength={1000}
            placeholder={
              selectedStatus === 'approved_manually'
                ? 'Misal: Tanda tangan basah telah lengkap diverifikasi sesuai SOP.'
                : selectedStatus === 'pending_signature'
                ? 'Misal: Dokumen fisik dicetak dan diserahkan ke pengaju/pejabat.'
                : 'Berikan keterangan atau alasan status...'
            }
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || options.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            Simpan Status
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
