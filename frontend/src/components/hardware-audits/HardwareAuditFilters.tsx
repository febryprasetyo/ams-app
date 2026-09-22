import React from 'react';
import { Layers, Clock, CheckCircle2, Search, Trash2 } from 'lucide-react';

interface HardwareAuditFiltersProps {
  totalCount: number;
  pendingCount: number;
  syncedCount: number;
  activeTab: 'ALL' | 'PENDING' | 'SYNCED';
  onTabChange: (tab: 'ALL' | 'PENDING' | 'SYNCED') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSynced: () => void;
}

export default function HardwareAuditFilters({
  totalCount,
  pendingCount,
  syncedCount,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onClearSynced,
}: HardwareAuditFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => onTabChange('ALL')}
          className={`glass-panel cursor-pointer p-4 rounded-2xl border transition-all ${
            activeTab === 'ALL'
              ? 'bg-slate-50 border-slate-300 ring-2 ring-slate-400/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300'
          } flex items-center justify-between`}
        >
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Total Hasil Scan
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => onTabChange('PENDING')}
          className={`glass-panel cursor-pointer p-4 rounded-2xl border transition-all ${
            activeTab === 'PENDING'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300'
          } flex items-center justify-between`}
        >
          <div>
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider font-mono">
              Menunggu Review / Tindakan
            </p>
            <p className="text-2xl font-extrabold text-amber-800 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100/60 border border-amber-200 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => onTabChange('SYNCED')}
          className={`glass-panel cursor-pointer p-4 rounded-2xl border transition-all ${
            activeTab === 'SYNCED'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300'
          } flex items-center justify-between`}
        >
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider font-mono">
              Tersinkron ke Database
            </p>
            <p className="text-2xl font-extrabold text-emerald-800 mt-1">{syncedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100/60 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="glass-panel p-4 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama user, serial number, model, atau processor..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
          />
        </div>

        {syncedCount > 0 && (
          <button
            onClick={onClearSynced}
            className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Bersihkan Data yang Sudah Tersinkron ({syncedCount})</span>
          </button>
        )}
      </div>
    </div>
  );
}
