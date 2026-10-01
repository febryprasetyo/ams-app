'use client';

import React, { useState, useEffect } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import { api } from '@/lib/api';
import {
  HardwareAuditItem,
  CategoryOption,
  LocationOption,
  isGenericOrPlaceholderSerial,
} from '@/lib/hardware-audits/types';
import { Plus, Printer, AlertCircle, Loader2 } from 'lucide-react';

interface CreateAssetFromAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: HardwareAuditItem | null;
  categories: CategoryOption[];
  locations: LocationOption[];
  onSuccess: (message: string) => void;
}

export default function CreateAssetFromAuditModal({
  isOpen,
  onClose,
  audit,
  categories,
  locations,
  onSuccess,
}: CreateAssetFromAuditModalProps) {
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [assetName, setAssetName] = useState('');
  const [custodianName, setCustodianName] = useState('');
  const [status, setStatus] = useState<'Assigned' | 'Available'>('Assigned');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (audit) {
      const defaultCat =
        categories.find((c) => c.name.toLowerCase().trim() === 'laptop') ||
        categories.find((c) => c.name.toLowerCase().includes('laptop')) ||
        categories.find((c) => c.name.toLowerCase().includes('notebook')) ||
        categories.find(
          (c) =>
            c.name.toLowerCase().includes('desktop') || c.name.toLowerCase().includes('pc')
        ) ||
        categories[0];

      setCategoryId(defaultCat ? defaultCat.id : categories[0]?.id || null);
      setLocationId(locations[0]?.id || null);
      setAssetName([audit.manufacturer, audit.model].filter(Boolean).join(' ') || 'Laptop');
      setCustodianName(audit.custodianName || '');
      setStatus('Assigned');
      setError(null);
    }
  }, [audit, categories, locations]);

  if (!isOpen || !audit) return null;

  const handleClose = () => {
    if (!submitting) {
      setError(null);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError('Pilih kategori aset terlebih dahulu.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res: any = await api.post(`/hardware-audits/${audit.id}/create-asset`, {
        name: assetName.trim(),
        categoryId,
        locationId,
        custodianName: custodianName.trim(),
        status,
        notes: `Created from Hardware Audit (${custodianName.trim() || audit.custodianName})`,
      });

      onSuccess(
        res.message || `Aset baru ${res.assetCode || ''} berhasil didaftarkan ke inventaris!`
      );
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal membuat aset baru dari audit';
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
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Daftarkan Sebagai Aset Baru ke IT Inventory
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Membuat nomor kode aset baru otomatis dan langsung mengisi data spesifikasi hardware.
            </p>
          </div>
        </div>
      }
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-xs font-mono">
          {/* Kategori */}
          <div>
            <label className="text-slate-700 font-bold block mb-1.5">
              Kategori Inventaris *
            </label>
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(Number(e.target.value) || null)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.codePrefix || cat.code || 'CAT'})
                </option>
              ))}
            </select>
          </div>

          {/* Nama Aset */}
          <div>
            <label className="text-slate-700 font-bold block mb-1.5">Nama Perangkat / Model *</label>
            <input
              type="text"
              required
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="e.g. ThinkPad T14 Gen 2"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs"
            />
          </div>

          {/* Serial Number & Custodian (Readonly preview) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-500 block mb-1">Serial Number</label>
              <input
                type="text"
                readOnly
                value={audit.serialNumber || '(Tidak terdeteksi)'}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700 text-xs"
              />
              {isGenericOrPlaceholderSerial(audit.serialNumber) && (
                <p className="text-[10px] text-amber-600 mt-1 font-mono leading-tight">
                  * S/N Generic BIOS: Disimpan sebagai catatan (bukan S/N aset unik) agar tidak bentrok antar PC rakitan.
                </p>
              )}
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Pengguna (Custodian) *</label>
              <input
                type="text"
                required
                value={custodianName}
                onChange={(e) => setCustodianName(e.target.value)}
                placeholder="Nama Pengguna"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-red-600 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <label className="text-slate-700 font-bold block mb-1.5">Lokasi Penempatan</label>
            <select
              value={locationId || ''}
              onChange={(e) => setLocationId(Number(e.target.value) || null)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-2xs"
            >
              <option value="">-- Pilih Lokasi --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Aset */}
          <div>
            <label className="text-slate-700 font-bold block mb-1.5">Status Aset</label>
            <div className="flex gap-4 p-2 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="createStatus"
                  checked={status === 'Assigned'}
                  onChange={() => setStatus('Assigned')}
                  className="text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <span>Assigned (Diberikan ke {custodianName || audit.custodianName})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="createStatus"
                  checked={status === 'Available'}
                  onChange={() => setStatus('Available')}
                  className="text-slate-700 focus:ring-slate-500 cursor-pointer"
                />
                <span>Available (Gudang)</span>
              </label>
            </div>
          </div>

          {/* Preview Attached Peripherals if any */}
          {audit.peripherals && audit.peripherals.length > 0 && (
            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-1.5">
              <div className="font-bold text-sky-900 flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-sky-700" />
                <span>
                  Periferal Terkait ({audit.peripherals.length} unit akan didaftarkan sebagai aksesori):
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {audit.peripherals.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 bg-white rounded-lg border border-sky-200/60 text-[11px] flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-800">
                      {p.category}: {p.brandModel}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {p.serialNumber ? `S/N: ${p.serialNumber}` : '(Tanpa S/N)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2.5 text-xs font-mono font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!categoryId || submitting}
            className="px-5 py-2.5 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Daftarkan ke Inventaris</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
