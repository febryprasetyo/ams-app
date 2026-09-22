'use client';

import React, { useState, useEffect } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import CustodianPicker from '@/components/assets/CustodianPicker';
import { api } from '@/lib/api';
import {
  buildCustodianSelectionPayload,
  type CustodianPickerValue,
} from '@/lib/assetCustodian';
import { UserCheck, Loader2, AlertCircle } from 'lucide-react';
import { AssetItem, LocationItem } from '@/lib/assets/types';

export interface AssignAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: AssetItem | null;
  locations: LocationItem[];
  canManage: boolean;
}

export default function AssignAssetModal({
  isOpen,
  onClose,
  onSuccess,
  asset,
  locations,
  canManage,
}: AssignAssetModalProps) {
  const [custodian, setCustodian] = useState<CustodianPickerValue>({ kind: 'none' });
  const [locationId, setLocationId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && asset) {
      setCustodian({ kind: 'none' });
      setLocationId(asset.locationId || '');
      setNotes('');
      setError(null);
    }
  }, [isOpen, asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    if (custodian.kind === 'none') {
      setError('Select an active custodian before assigning this asset.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await api.post(`/assets/${asset.id}/assign`, {
        ...buildCustodianSelectionPayload(custodian),
        assignedToLocationId: locationId ? Number(locationId) : undefined,
        handoverNotes: notes.trim() || null,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign asset');
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
      title="Assign Asset Custody"
      subtitle={`${asset.assetCode} — ${asset.name}`}
      icon={<UserCheck className="w-5 h-5 text-blue-600" />}
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <CustodianPicker
          label="Target Custodian"
          value={custodian}
          onChange={setCustodian}
          locations={locations}
          allowManual={canManage}
          allowClear={false}
          required
          accent="blue"
        />

        <div>
          <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
            Facility Location
          </label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">Keep / Default Holder Location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
            Handover Notes / Remarks
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Handed over for engineering work with charger and mouse..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500"
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
            disabled={submitting || custodian.kind === 'none'}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
            <span>Confirm Assignment</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
