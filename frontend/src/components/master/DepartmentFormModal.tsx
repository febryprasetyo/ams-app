'use client';

import React, { useState, useEffect } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { api } from '@/lib/api';
import type { DepartmentItem } from './DepartmentTable';
import { Loader2, Plus, Pencil, AlertCircle } from 'lucide-react';

interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: DepartmentItem | null;
  onSuccess: () => void;
}

export default function DepartmentFormModal({
  isOpen,
  onClose,
  department,
  onSuccess,
}: DepartmentFormModalProps) {
  const isEdit = Boolean(department);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (department) {
        setCode(department.code);
        setName(department.name);
      } else {
        setCode('');
        setName('');
      }
    }
  }, [isOpen, department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
    };

    try {
      if (isEdit && department) {
        await api.put('/master/departments/' + department.id, payload);
      } else {
        await api.post('/master/departments', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || (isEdit ? 'Failed to update department' : 'Failed to register department'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Department' : 'Register New Department'}
      icon={
        isEdit ? (
          <Pencil className="w-5 h-5 text-red-600" />
        ) : (
          <Plus className="w-5 h-5 text-red-600" />
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
            Department Code *
          </label>
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. IT-OPS"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 uppercase font-bold"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
            Department Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Information Technology & Infrastructure"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
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
            <span>{isEdit ? 'Update Department' : 'Save Department'}</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
