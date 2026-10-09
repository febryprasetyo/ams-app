'use client';

import React, { useState, useEffect } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { api } from '@/lib/api';
import type { EquipmentTypeItem } from './EquipmentTypeTable';
import { Loader2, Plus, Pencil, AlertCircle } from 'lucide-react';

interface EquipmentTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentType: EquipmentTypeItem | null;
  onSuccess: () => void;
}

export default function EquipmentTypeFormModal({
  isOpen,
  onClose,
  equipmentType,
  onSuccess,
}: EquipmentTypeFormModalProps) {
  const isEdit = Boolean(equipmentType);

  const [name, setName] = useState('');
  const [codePrefix, setCodePrefix] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (equipmentType) {
        setName(equipmentType.name);
        setCodePrefix(equipmentType.codePrefix);
      } else {
        setName('');
        setCodePrefix('');
      }
    }
  }, [isOpen, equipmentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      name: name.trim(),
      codePrefix: codePrefix.trim().toUpperCase(),
    };

    try {
      if (isEdit && equipmentType) {
        await api.put('/assets/categories/' + equipmentType.id, payload);
      } else {
        await api.post('/assets/categories', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || (isEdit ? 'Failed to update equipment type' : 'Failed to register equipment type'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Equipment Type' : 'New Equipment Type'}
      icon={
        isEdit ? (
          <Pencil className="w-5 h-5 text-emerald-600" />
        ) : (
          <Plus className="w-5 h-5 text-emerald-600" />
        )
      }
      maxWidthClass="max-w-lg"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        <div>
          <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
            Tag Code Prefix *
          </label>
          <input
            type="text"
            required
            maxLength={10}
            value={codePrefix}
            onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
            placeholder="e.g. LAP, PC, SRV, PRN"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 uppercase font-bold"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
            Equipment Type Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Laptop / Portable Notebook"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl transition flex items-center gap-2 shadow-sm font-bold cursor-pointer"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isEdit ? 'Update Category' : 'Save Category'}</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
