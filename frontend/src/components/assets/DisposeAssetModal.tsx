'use client';

import React, { useState, useEffect } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { api } from '@/lib/api';
import { Archive, Loader2, AlertCircle } from 'lucide-react';
import { AssetDetail } from '@/lib/assets/types';

export interface DisposeAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: AssetDetail;
}

export default function DisposeAssetModal({
  isOpen,
  onClose,
  onSuccess,
  asset,
}: DisposeAssetModalProps) {
  const [disposeReason, setDisposeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDisposeReason('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposeReason.trim()) {
      setError('Please provide a reason for disposal');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await api.post(`/assets/${asset.id}/dispose`, {
        disposalReason: disposeReason.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to dispose asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      isLoading={submitting}
      title="Decommission & Dispose Asset"
      subtitle={`${asset.assetCode} — ${asset.name}`}
      icon={<Archive className="w-5 h-5 text-rose-600" />}
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">
            Reason for Disposal <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={disposeReason}
            onChange={(e) => setDisposeReason(e.target.value)}
            placeholder="e.g. Beyond economical repair, end of life..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Confirm Disposal</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
