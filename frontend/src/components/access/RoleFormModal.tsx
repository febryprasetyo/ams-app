'use client';

import React, { useState, useEffect } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { RoleItem, RoleFormData } from '@/lib/access/types';
import { Shield, ShieldAlert, Loader2 } from 'lucide-react';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoleFormData) => Promise<void>;
  initialData?: RoleItem | null;
  isLoading?: boolean;
}

export default function RoleFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: RoleFormModalProps) {
  const isEdit = Boolean(initialData);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setName(initialData.name);
      setDescription(initialData.description || '');
    } else {
      setCode('');
      setName('');
      setDescription('');
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEdit && !code.trim()) {
      setError('Role code is required');
      return;
    }

    if (!name.trim()) {
      setError('Role display name is required');
      return;
    }

    try {
      await onSubmit({
        code: code.trim().toLowerCase().replace(/\s+/g, '_'),
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save role');
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Role Details' : 'Create Custom Role'}
      subtitle={isEdit ? 'Update display name and description' : 'Define a new role and configure its permission matrix'}
      icon={<Shield className="w-5 h-5 text-emerald-600" />}
      maxWidthClass="max-w-md"
      isLoading={isLoading}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="role-form"
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isEdit ? 'Save Changes' : 'Create Role'}</span>
          </button>
        </>
      }
    >
      <form id="role-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        {/* Code */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Role Code Identifier <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            disabled={isEdit}
            value={code}
            onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="e.g. warehouse_officer"
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono disabled:bg-slate-100 disabled:text-slate-500"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Lowercase alphanumeric and underscore. Cannot be changed once created.
          </p>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Role Display Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Warehouse Officer"
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain what access privileges this role is intended for..."
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
          />
        </div>
      </form>
    </ModalShell>
  );
}
