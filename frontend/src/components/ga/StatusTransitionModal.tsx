'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import ModalShell from '@/components/ui/ModalShell';
import { api } from '@/lib/api';
import { GA_API_PATH } from '@/lib/goodsRequests';
import { type GoodsRequestStatus, getStatusLabel, getStatusSelectionClass, getStatusBadgeConfig } from '@/lib/ga/goodsRequestStatus';
import { getAvailableTransitionsWithLabels } from '@/lib/ga/statusActions';

interface StatusTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  currentStatus: GoodsRequestStatus;
  onSuccess: () => void;
  initialStatus?: GoodsRequestStatus;
}

export default function StatusTransitionModal({ isOpen, onClose, requestId, currentStatus, onSuccess, initialStatus }: StatusTransitionModalProps) {
  const options = getAvailableTransitionsWithLabels(currentStatus);
  const [selectedStatus, setSelectedStatus] = useState<GoodsRequestStatus>(initialStatus && options.some(option => option.value === initialStatus) ? initialStatus : options[0]?.value || currentStatus);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const formId = useId();
  const notesId = useId();
  const rejecting = selectedStatus === 'rejected';
  const cancelling = selectedStatus === 'cancelled' || rejecting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || !options.some(option => option.value === selectedStatus)) return;
    if (cancelling && !notes.trim()) {
      setError(rejecting ? 'Alasan penolakan wajib diisi.' : 'Alasan pembatalan wajib diisi.');
      return;
    }
    submitting.current = true;
    setLoading(true);
    setError('');
    try {
      await api.post(`${GA_API_PATH}/${requestId}/status`, { toStatus: selectedStatus, notes: notes.trim() });
      onSuccess();
      onClose();
    } catch (cause) {
      setError((cause as Error).message || 'Status belum tersimpan. Silakan coba kembali.');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Perbarui Status Permintaan"
      subtitle={`Status saat ini: ${getStatusLabel(currentStatus)}`}
      icon={<CheckCircle2 size={20} />}
      maxWidthClass="max-w-lg"
      isLoading={loading}
      footer={<>
        <button type="button" disabled={loading} onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Tutup</button>
        <button type="submit" form={formId} disabled={loading || !options.length} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 ${cancelling ? 'bg-rose-700 hover:bg-rose-800' : 'bg-emerald-700 hover:bg-emerald-800'}`}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Menyimpan...' : 'Simpan Status'}
        </button>
      </>}
    >
      <form id={formId} onSubmit={handleSubmit} noValidate aria-busy={loading} className="space-y-4">
        {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700"><AlertCircle size={16} className="shrink-0" />{error}</p>}
        <fieldset disabled={loading} className="space-y-3">
          <legend className="mb-3 text-xs font-semibold text-slate-700">Status permintaan</legend>
          {!options.length && <p className="text-xs text-slate-600">Tidak ada perubahan status yang tersedia.</p>}
          {options.map(option => (
            <label key={option.value} className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-4 ${selectedStatus === option.value ? getStatusSelectionClass(option.value) : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'}`}>
              <input type="radio" name="targetStatus" value={option.value} checked={selectedStatus === option.value} onChange={() => { setSelectedStatus(option.value); setError(''); }} className={`mt-0.5 h-4 w-4 shrink-0 ${option.value === 'rejected' ? 'accent-rose-700' : option.value === 'cancelled' ? 'accent-slate-700' : 'accent-emerald-700'}`} />
              <span className="text-xs"><span className={`block font-bold ${getStatusBadgeConfig(option.value).textClass}`}>{option.label}</span><span className="mt-1 block leading-relaxed text-slate-600">{option.description}</span></span>
            </label>
          ))}
        </fieldset>
        <div>
          <label htmlFor={notesId} className="mb-2 block text-xs font-semibold text-slate-700">{rejecting ? 'Alasan penolakan (wajib)' : cancelling ? 'Alasan pembatalan (wajib)' : 'Catatan (opsional)'}</label>
          <textarea id={notesId} disabled={loading} required={cancelling} rows={3} maxLength={1000} placeholder={rejecting ? 'Tuliskan alasan permintaan ditolak' : cancelling ? 'Tuliskan alasan permintaan dibatalkan' : 'Tambahkan catatan persetujuan bila diperlukan'} value={notes} onChange={event => setNotes(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 disabled:opacity-50" />
        </div>
      </form>
    </ModalShell>
  );
}
