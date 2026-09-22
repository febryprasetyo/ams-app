'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { CustodianSummary } from '@/lib/assetCustodian';
import { Check, Loader2, Pencil, UserRound, X } from 'lucide-react';

interface LocationOption {
  id: number;
  code: string;
  name: string;
}

interface CustodianMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  custodian: CustodianSummary | null; // null for Create mode
  locations: LocationOption[];
  onSuccess: () => void;
}

export default function CustodianMetadataModal({
  isOpen,
  onClose,
  custodian,
  locations,
  onSuccess,
}: CustodianMetadataModalProps) {
  const isEdit = !!custodian;

  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState<number | ''>('');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (custodian) {
        setName(custodian.displayName || '');
        setLocationId(custodian.locationId || '');
        setUnit(custodian.unitText || '');
        setNotes(custodian.notes || '');
      } else {
        setName('');
        setLocationId('');
        setUnit('');
        setNotes('');
      }
    }
  }, [isOpen, custodian]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      if (isEdit && custodian) {
        await api.patch(`/asset-custodians/${custodian.id}`, {
          displayName: name.trim(),
          locationId: locationId === '' ? null : Number(locationId),
          unitText: unit.trim() || null,
          notes: notes.trim() || null,
        });
      } else {
        await api.post('/asset-custodians', {
          displayName: name.trim(),
          locationId: locationId === '' ? null : Number(locationId),
          unitText: unit.trim() || null,
          notes: notes.trim() || null,
          duplicateAcknowledged: true,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || (isEdit ? 'Failed to update custodian' : 'Failed to create custodian'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isEdit ? (
              <Pencil className="h-5 w-5 text-red-600" />
            ) : (
              <UserRound className="h-5 w-5 text-red-600" />
            )}
            <div>
              <h2 className="font-bold text-slate-900">
                {isEdit ? 'Edit Holder Metadata' : 'Create New Custodian'}
              </h2>
              {isEdit && custodian && (
                <p className="text-xs text-slate-500 font-mono">
                  {custodian.employeeCode || `Holder #${custodian.id}`}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Holder Name *
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mutiara Azizah R"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Location</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
            >
              <option value="">Unknown / no location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit / Team</label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. Finance, Marketing, IT"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              IT Notes {isEdit ? '' : '(optional)'}
            </label>
            <textarea
              rows={isEdit ? 3 : 2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isEdit ? 'IT-only notes' : 'Internal notes...'}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>{isEdit ? 'Save metadata' : 'Create Custodian'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
