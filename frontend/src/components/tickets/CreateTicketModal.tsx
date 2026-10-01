'use client';

import React, { useState } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { api } from '@/lib/api';
import { TicketCategory, AssetItem } from '@/lib/tickets/types';
import { Ticket, AlertCircle, Loader2 } from 'lucide-react';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: TicketCategory[];
  assets: AssetItem[];
  onSuccess: () => void;
}

export default function CreateTicketModal({
  isOpen,
  onClose,
  categories,
  assets,
  onSuccess,
}: CreateTicketModalProps) {
  const [formType, setFormType] = useState<'Incident' | 'Request'>('Incident');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [formPriority, setFormPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [formAssetId, setFormAssetId] = useState<number | ''>('');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setFormType('Incident');
    setFormCategoryId('');
    setFormPriority('Medium');
    setFormAssetId('');
    setFormSubject('');
    setFormDescription('');
    setError(null);
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formCategoryId || !formDescription.trim()) {
      setError('Please fill in all required fields (Category, Subject, and Description).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.post('/tickets', {
        type: formType,
        categoryId: Number(formCategoryId),
        priority: formPriority,
        assetId: formAssetId ? Number(formAssetId) : null,
        subject: formSubject.trim(),
        description: formDescription.trim(),
      });
      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create IT ticket';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-red-600" />
          <span>Create IT Support Ticket</span>
        </div>
      }
      maxWidthClass="max-w-lg"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Select */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
              Ticket Type *
            </label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as 'Incident' | 'Request')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
            >
              <option value="Incident">Incident (System Breakdown)</option>
              <option value="Request">Service Request (Hardware/Access)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
              Priority Level *
            </label>
            <select
              value={formPriority}
              onChange={(e) => setFormPriority(e.target.value as 'Low' | 'Medium' | 'High' | 'Critical')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
            >
              <option value="Low">Low (Routine / Inquiry)</option>
              <option value="Medium">Medium (Standard SLA 24h)</option>
              <option value="High">High (Urgent SLA 8h)</option>
              <option value="Critical">Critical (Outage SLA 2h)</option>
            </select>
          </div>
        </div>

        {/* Category & Asset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
              Category *
            </label>
            <select
              required
              disabled={categories.length === 0}
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">{categories.length === 0 ? 'No categories available' : 'Select Category...'}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code ? `[${c.code}] ` : ''}{c.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                Kategori tiket belum tersedia. Silakan hubungi administrator IT.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
              Target IT Asset (Optional)
            </label>
            <select
              value={formAssetId}
              onChange={(e) => setFormAssetId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
            >
              <option value="">No Specific Asset</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetCode} - {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
            Subject / Issue Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Broken Laptop Screen or VPN Access Setup"
            value={formSubject}
            onChange={(e) => setFormSubject(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 font-medium"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-700 mb-1">
            Detailed Description & Symptoms *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Describe what happened, error codes, steps to reproduce, or requirements..."
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Creating Ticket...</span>
              </>
            ) : (
              <span>Submit IT Ticket</span>
            )}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
