'use client';

import React, { useState, useEffect } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { api } from '@/lib/api';
import { UserX, Loader2, AlertCircle } from 'lucide-react';
import { AssetItem } from '@/lib/assets/types';

export interface ReturnAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: AssetItem | null;
}

export default function ReturnAssetModal({
  isOpen,
  onClose,
  onSuccess,
  asset,
}: ReturnAssetModalProps) {
  const [condition, setCondition] = useState<'Good' | 'Fair' | 'Poor' | 'Damaged'>('Good');
  const [returnNotes, setReturnNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && asset) {
      setCondition(asset.condition || 'Good');
      setReturnNotes('');
      setError(null);
    }
  }, [isOpen, asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    try {
      setSubmitting(true);
      setError(null);

      await api.post(`/assets/${asset.id}/unassign`, {
        conditionOnReturn: condition,
        returnNotes: returnNotes.trim() || null,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to return asset to stock');
    } finally {
      setSubmitting(false);
    }
  };

  if (!asset) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      isLoading={submitting}
      title="Return Asset to Stock"
      subtitle={`${asset.assetCode} — ${asset.name}`}
      icon={<UserX className="w-5 h-5 text-amber-600" />}
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
            Condition on Return
          </label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as any)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="Good">Good (Clean / Operational)</option>
            <option value="Fair">Fair (Minor cosmetic scuffs)</option>
            <option value="Poor">Poor (Requires servicing)</option>
            <option value="Damaged">Damaged (Broken hardware)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
            Return / Reallocation Notes
          </label>
          <textarea
            rows={3}
            value={returnNotes}
            onChange={(e) => setReturnNotes(e.target.value)}
            placeholder="e.g. Returned upon resignation or project completion. Checked by IT..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserX className="w-4 h-4" />
            )}
            <span>Return to Stock</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
