'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Edit2,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { MasterLeaveBalanceItem } from '@/types/leaves';
import {
  filterMasterLeaveBalances,
  getLeaveBalanceStatus,
  formatIndoDays,
  LeaveBalanceStatus,
} from '@/lib/leaves/masterLeaveUtils';

interface MasterLeaveBalancesTableProps {
  balances: MasterLeaveBalanceItem[];
  isLoading?: boolean;
  onEditBalance: (item: MasterLeaveBalanceItem) => void;
  year: number;
}

export default function MasterLeaveBalancesTable({
  balances,
  isLoading = false,
  onEditBalance,
  year,
}: MasterLeaveBalancesTableProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | LeaveBalanceStatus>('ALL');

  // Extract unique departments for dropdown filter
  const departments = useMemo(() => {
    const map = new Map<number, string>();
    balances.forEach((b) => {
      if (b.departmentId !== null && b.departmentId !== undefined) {
        map.set(b.departmentId, b.department || 'Tanpa Departemen');
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [balances]);

  // Apply reactive filters
  const filteredBalances = useMemo(() => {
    return filterMasterLeaveBalances(balances, {
      search: searchTerm,
      departmentId: selectedDeptId === 'ALL' ? undefined : Number(selectedDeptId),
      status: statusFilter,
    });
  }, [balances, searchTerm, selectedDeptId, statusFilter]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Table Header & Toolbar */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Rekapitulasi Saldo Cuti Karyawan ({year})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daftar saldo cuti tahunan seluruh staf aktif beserta status dan rincian kuota
            </p>
          </div>

          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Menampilkan <span className="font-bold text-slate-900 dark:text-white">{filteredBalances.length}</span> dari {balances.length} staf
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama karyawan atau NIP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Department selector */}
          <div className="relative">
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Departemen</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status selector */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | LeaveBalanceStatus)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Status Saldo</option>
              <option value="SAFE">Aman (≥ 4 Hari)</option>
              <option value="WARNING">Menipis (1 - 3 Hari)</option>
              <option value="EXHAUSTED">Habis (0 Hari)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Karyawan</th>
              <th className="py-3 px-3 text-center">Hak Dasar</th>
              <th className="py-3 px-3 text-center">Cuti Bersama</th>
              <th className="py-3 px-3 text-center">Hak Bersih</th>
              <th className="py-3 px-3 text-center">Carry Over</th>
              <th className="py-3 px-3 text-center">Terpakai</th>
              <th className="py-3 px-4 text-center">Sisa Saldo</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3.5 px-4">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-1" />
                    <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="py-3.5 px-3 text-center"><div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                  <td className="py-3.5 px-3 text-center"><div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                  <td className="py-3.5 px-3 text-center"><div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                  <td className="py-3.5 px-3 text-center"><div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                  <td className="py-3.5 px-3 text-center"><div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                  <td className="py-3.5 px-4 text-center"><div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" /></td>
                  <td className="py-3.5 px-4 text-right"><div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                </tr>
              ))
            ) : filteredBalances.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <Users className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-semibold">Tidak Ada Data Saldo Karyawan</p>
                  <p className="text-xs mt-0.5">
                    {balances.length === 0
                      ? 'Belum ada data saldo cuti untuk tahun ini. Silakan simpan kebijakan cuti di atas.'
                      : 'Tidak ditemukan karyawan yang sesuai dengan kriteria filter pencarian.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredBalances.map((item) => {
                const status = getLeaveBalanceStatus(item.remainingQuota);
                return (
                  <tr
                    key={item.employeeId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Karyawan Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-slate-600 dark:text-slate-300">{item.employeeCode}</span>
                        <span>•</span>
                        <span>{item.department || '-'}</span>
                      </div>
                    </td>

                    {/* Kuota Dasar */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.baseQuota} Hari
                      </span>
                      {item.isCustomQuota && (
                        <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                          Khusus
                        </span>
                      )}
                    </td>

                    {/* Cuti Bersama */}
                    <td className="py-3.5 px-3 text-center text-amber-600 dark:text-amber-400 font-medium">
                      -{item.collectiveLeaveDeduction} Hari
                    </td>

                    {/* Hak Bersih */}
                    <td className="py-3.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                      {item.cleanAnnualQuota} Hari
                    </td>

                    {/* Carry Over */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        +{item.carriedOverQuota} Hari
                      </span>
                      {item.isCustomCarryForward && (
                        <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                          Khusus
                        </span>
                      )}
                    </td>

                    {/* Terpakai */}
                    <td className="py-3.5 px-3 text-center text-slate-600 dark:text-slate-400">
                      {item.usedQuota > 0 ? `-${item.usedQuota} Hari` : '0 Hari'}
                    </td>

                    {/* Sisa Cuti Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          status === 'SAFE'
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                            : status === 'WARNING'
                            ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                            : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                        }`}
                      >
                        {status === 'SAFE' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        ) : status === 'WARNING' ? (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 shrink-0" />
                        )}
                        {item.remainingQuota} Hari
                      </span>
                    </td>

                    {/* Aksi Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onEditBalance(item)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
                      >
                        <Edit2 className="h-3 w-3" />
                        Ubah Saldo
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
