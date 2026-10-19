'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Edit2,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MasterLeaveBalanceItem } from '@/types/leaves';
import {
  getLeaveBalanceStatus,
  filterMasterLeaveBalances,
} from '@/lib/leaves/masterLeaveUtils';

interface MasterLeaveBalancesTableProps {
  balances: MasterLeaveBalanceItem[];
  isLoading?: boolean;
  onEditBalance: (balance: MasterLeaveBalanceItem) => void;
  year: number;
}

export default function MasterLeaveBalancesTable({
  balances,
  isLoading = false,
  onEditBalance,
  year,
}: MasterLeaveBalancesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SAFE' | 'WARNING' | 'EXHAUSTED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Daftar unik departemen untuk filter dropdown
  const departments = useMemo(() => {
    const set = new Set<string>();
    balances.forEach((b) => {
      if (b.department) set.add(b.department);
    });
    return Array.from(set).sort();
  }, [balances]);

  // Data hasil filter
  const filteredBalances = useMemo(() => {
    const list = filterMasterLeaveBalances(balances, {
      search: searchTerm,
      status: statusFilter,
    });
    if (departmentFilter === 'ALL') return list;
    return list.filter((b) => b.department === departmentFilter);
  }, [balances, searchTerm, departmentFilter, statusFilter]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, statusFilter, pageSize]);

  // Pagination calculation
  const totalItems = filteredBalances.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedBalances = filteredBalances.slice(startIndex, endIndex);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
      {/* Table Header & Filters */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Rekapitulasi Saldo Cuti Karyawan {year}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daftar saldo cuti bersih dan penggunaan cuti staf di tahun kalender {year}
            </p>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 self-start sm:self-auto">
            Total {filteredBalances.length} Karyawan Terdaftar
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama atau NIP karyawan..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 pl-10 pr-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              aria-label="Filter Departemen"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="ALL">Semua Departemen</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Saldo Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Filter Status Saldo"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="ALL">Semua Kondisi Saldo</option>
              <option value="SAFE">Saldo Aman (&ge; 4 Hari)</option>
              <option value="WARNING">Saldo Menipis (1 - 3 Hari)</option>
              <option value="EXHAUSTED">Saldo Habis (0 Hari)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <th className="py-3 px-4">Karyawan</th>
              <th className="py-3 px-3 text-center">Hak Dasar</th>
              <th className="py-3 px-3 text-center">Cuti Bersama</th>
              <th className="py-3 px-3 text-center">Hak Bersih</th>
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
                  <td className="py-3.5 px-4 text-center"><div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" /></td>
                  <td className="py-3.5 px-4 text-right"><div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                </tr>
              ))
            ) : paginatedBalances.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <Users className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-semibold">Tidak Ada Data Saldo Karyawan</p>
                  <p className="text-xs mt-0.5">
                    {balances.length === 0
                      ? 'Belum ada data saldo cuti untuk tahun ini. Silakan simpan kebijakan di Pengaturan Cuti.'
                      : 'Tidak ditemukan karyawan yang sesuai dengan kriteria filter pencarian.'}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedBalances.map((item) => {
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
                        <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                          Khusus
                        </span>
                      )}
                    </td>

                    {/* Cuti Bersama */}
                    <td className="py-3.5 px-3 text-center text-amber-600 dark:text-amber-400 font-medium">
                      -{item.collectiveLeaveDeduction} Hari
                    </td>

                    {/* Hak Bersih */}
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                      {item.cleanAnnualQuota} Hari
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
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3 text-slate-500" />
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

      {/* Pagination Controls */}
      {!isLoading && totalItems > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Menampilkan</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {startIndex + 1} - {endIndex}
            </span>
            <span>dari</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{totalItems}</span>
            <span>data</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value={10}>10 baris</option>
              <option value={25}>25 baris</option>
              <option value={50}>50 baris</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Sebelumnya
            </button>

            <span className="px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Berikutnya
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
