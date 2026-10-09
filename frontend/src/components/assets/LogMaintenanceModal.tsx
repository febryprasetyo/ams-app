'use client';

import React, { useState, useEffect } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { api } from '@/lib/api';
import { Wrench, Loader2, AlertCircle } from 'lucide-react';
import { AssetDetail } from '@/lib/assets/types';

export interface LogMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: AssetDetail;
}

export default function LogMaintenanceModal({
  isOpen,
  onClose,
  onSuccess,
  asset,
}: LogMaintenanceModalProps) {
  const [maintType, setMaintType] = useState('Routine Service');
  const [maintDescription, setMaintDescription] = useState('');
  const [maintCost, setMaintCost] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMaintType('Routine Service');
      setMaintDescription('');
      setMaintCost(0);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      await api.post(`/assets/${asset.id}/maintenance`, {
        maintenanceType: maintType,
        title: `${maintType} - ${asset.assetCode}`,
        description: maintDescription.trim() || null,
        cost: Number(maintCost) || 0,
        status: 'Completed',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to log maintenance record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      isLoading={submitting}
      title="Log Maintenance Service"
      subtitle={`${asset.assetCode} — ${asset.name}`}
      icon={<Wrench className="w-5 h-5 text-amber-600" />}
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
            Service Type
          </label>
          <select
            value={maintType}
            onChange={(e) => setMaintType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono cursor-pointer"
          >
            <option value="Routine Service">Routine Service</option>
            <option value="Hardware Repair">Hardware Repair</option>
            <option value="RAM/SSD Upgrade">RAM/SSD Upgrade</option>
            <option value="OS Reinstall">OS Reinstall</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">
            Description / Findings
          </label>
          <textarea
            rows={2}
            value={maintDescription}
            onChange={(e) => setMaintDescription(e.target.value)}
            placeholder="Details of repair..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">
            Cost (IDR)
          </label>
          <input
            type="number"
            value={maintCost}
            onChange={(e) => setMaintCost(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Log</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
