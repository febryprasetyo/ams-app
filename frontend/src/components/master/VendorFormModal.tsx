'use client';

import React, { useState, useEffect } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { api } from '@/lib/api';
import type { VendorItem } from './VendorTable';
import { Loader2, Plus, Pencil, AlertCircle } from 'lucide-react';

interface VendorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: VendorItem | null;
  onSuccess: () => void;
}

export default function VendorFormModal({
  isOpen,
  onClose,
  vendor,
  onSuccess,
}: VendorFormModalProps) {
  const isEdit = Boolean(vendor);

  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (vendor) {
        setName(vendor.name);
        setContactName(vendor.contactName || '');
        setEmail(vendor.email || '');
        setPhone(vendor.phone || '');
        setAddress(vendor.address || '');
      } else {
        setName('');
        setContactName('');
        setEmail('');
        setPhone('');
        setAddress('');
      }
    }
  }, [isOpen, vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      name: name.trim(),
      contactName: contactName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
    };

    try {
      if (isEdit && vendor) {
        await api.put('/master/vendors/' + vendor.id, payload);
      } else {
        await api.post('/master/vendors', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || (isEdit ? 'Failed to update vendor' : 'Failed to register vendor'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Vendor Supplier' : 'Register New Vendor'}
      icon={
        isEdit ? (
          <Pencil className="w-5 h-5 text-red-600" />
        ) : (
          <Plus className="w-5 h-5 text-red-600" />
        )
      }
      maxWidthClass="max-w-xl"
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
            Vendor / Company Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. PT Synnex Metrodata Indonesia"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
              Contact Person
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Budi Santoso (Account Exec)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. (021) 567-8901"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
            Corporate Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. sales@vendor-domain.com"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
            HQ / Office Address
          </label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Gedung Wisma Sudirman Lt. 12, Jl. Jend. Sudirman Kav. 24, Jakarta Selatan"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 resize-none"
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
            <span>{isEdit ? 'Update Vendor' : 'Register Vendor'}</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
