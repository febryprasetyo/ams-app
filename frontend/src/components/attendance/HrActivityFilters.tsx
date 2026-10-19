'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, RotateCcw, Calendar, User, Tag } from 'lucide-react';
import type { HrActivityFiltersState, HrActivityActor } from '@/lib/hr-activity/types';
import { listActors } from '@/lib/hr-activity/api';

interface HrActivityFiltersProps {
  filters: HrActivityFiltersState;
  onApply: (nextFilters: HrActivityFiltersState) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const ACTION_OPTIONS = [
  { value: '', label: 'Semua Aksi' },
  { value: 'CREATE', label: 'Tambah (CREATE)' },
  { value: 'UPDATE', label: 'Ubah (UPDATE)' },
  { value: 'DELETE', label: 'Hapus (DELETE)' },
  { value: 'IMPORT', label: 'Impor (IMPORT)' },
  { value: 'REVIEW', label: 'Review (REVIEW)' },
  { value: 'LOCK', label: 'Kunci (LOCK)' },
  { value: 'UNLOCK', label: 'Buka Kunci (UNLOCK)' },
  { value: 'ASSIGN', label: 'Tugaskan Shift (ASSIGN)' },
  { value: 'LINK', label: 'Hubungkan Identitas (LINK)' },
];

export function HrActivityFilters({
  filters,
  onApply,
  onReset,
  isLoading,
}: HrActivityFiltersProps) {
  const [localFilters, setLocalFilters] = useState<HrActivityFiltersState>(filters);
  const [actors, setActors] = useState<HrActivityActor[]>([]);
  const [isLoadingActors, setIsLoadingActors] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    let active = true;
    setIsLoadingActors(true);
    listActors(undefined, null, 100)
      .then((res) => {
        if (active) setActors(res.items);
      })
      .catch((err) => {
        console.warn('Gagal memuat daftar pelaku audit:', err);
      })
      .finally(() => {
        if (active) setIsLoadingActors(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (key: keyof HrActivityFiltersState, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(localFilters);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Tanggal Mulai */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Dari Tanggal
          </label>
          <input
            type="date"
            value={localFilters.startDate || ''}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Tanggal Sampai */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={localFilters.endDate || ''}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Jenis Aksi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            Jenis Aksi
          </label>
          <select
            value={localFilters.action || ''}
            onChange={(e) => handleChange('action', e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Pelaku */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Pelaku Aksi
          </label>
          <select
            value={localFilters.actorId || ''}
            onChange={(e) => handleChange('actorId', e.target.value)}
            disabled={isLoadingActors}
            className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">Semua Pelaku</option>
            {actors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.name} ({actor.username})
              </option>
            ))}
          </select>
        </div>

        {/* Kata Kunci */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            Cari Objek / Ringkasan
          </label>
          <input
            type="text"
            value={localFilters.q || ''}
            onChange={(e) => handleChange('q', e.target.value)}
            placeholder="ID, nama, atau keterangan..."
            className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onReset}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filter
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
        >
          <Filter className="w-3.5 h-3.5" />
          Terapkan Filter
        </button>
      </div>
    </form>
  );
}
