'use client';

import React from 'react';
import { MapPin, Pencil, Trash2, Loader2 } from 'lucide-react';

export interface LocationItem {
  id: number;
  code: string;
  name: string;
  address?: string | null;
  createdAt?: string;
}

interface LocationTableProps {
  locations: LocationItem[];
  loading: boolean;
  onEdit: (loc: LocationItem) => void;
  onDelete: (loc: LocationItem) => void;
}

export default function LocationTable({
  locations,
  loading,
  onEdit,
  onDelete,
}: LocationTableProps) {
  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500 font-mono text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-red-600" />
        <span>Fetching office locations...</span>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="p-12 text-center">
        <MapPin className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-700 font-semibold text-sm">No locations registered</p>
        <p className="text-xs text-slate-500 mt-1">
          Register warehouse, branch, or office locations to map physical assets.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-mono uppercase tracking-wider">
            <th className="py-3.5 px-5 font-semibold">Location Code</th>
            <th className="py-3.5 px-5 font-semibold">Facility Name</th>
            <th className="py-3.5 px-5 font-semibold">Physical Address / Room</th>
            <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {locations.map((loc) => (
            <tr key={loc.id} className="hover:bg-red-50/30 transition-colors group">
              <td className="py-4 px-5 font-mono">
                <span className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 font-bold">
                  {loc.code}
                </span>
              </td>
              <td className="py-4 px-5">
                <p className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                  {loc.name}
                </p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">ID: #{loc.id}</p>
              </td>
              <td className="py-4 px-5 text-slate-600 max-w-sm truncate" title={loc.address || ''}>
                {loc.address || <span className="text-slate-400 italic font-mono">No address specified</span>}
              </td>
              <td className="py-4 px-5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(loc)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                    title="Edit Location"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(loc)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                    title="Delete Location"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
