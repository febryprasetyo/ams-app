'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Trash2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';

interface LeaveItem {
  id: number;
  requestNumber: string;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  leaveType: string;
  reason: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  resumeWorkDate: string;
  status: string;
  createdAt: string;
}

export default function LeaveRequestsListPage() {
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states for manual HR approval & deletion
  const [confirmApproveItem, setConfirmApproveItem] = useState<LeaveItem | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<LeaveItem | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<LeaveItem[]>('/leaves/requests');
      setLeaves(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error('Failed to fetch leaves:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar permohonan cuti.';
      setToastMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // Filter & Search
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return leaves.filter((item) => (
      (item.requestNumber || '').toLowerCase().includes(q) ||
      (item.employeeName || '').toLowerCase().includes(q) ||
      (item.employeeCode || '').toLowerCase().includes(q) ||
      (item.reason || '').toLowerCase().includes(q)
    ));
  }, [leaves, searchTerm]);

  // Reset page when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // Pagination slice
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedLeaves = filtered.slice(startIndex, endIndex);

  // Action: Manual HR Approval
  const handleApprove = async () => {
    if (!confirmApproveItem) return;
    setIsProcessingAction(true);
    try {
      const res = await api.patch<{ success: boolean; message: string }>(
        `/leaves/requests/${confirmApproveItem.id}/approve`
      );
      setToastMessage({
        type: 'success',
        text: res.message || `Permohonan cuti ${confirmApproveItem.requestNumber} berhasil disetujui.`,
      });
      setConfirmApproveItem(null);
      await fetchLeaves();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyetujui permohonan cuti.';
      setToastMessage({ type: 'error', text: msg });
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Action: Delete Draft
  const handleDeleteDraft = async () => {
    if (!confirmDeleteItem) return;
    setIsProcessingAction(true);
    try {
      const res = await api.delete<{ success: boolean; message: string }>(
        `/leaves/requests/${confirmDeleteItem.id}`
      );
      setToastMessage({
        type: 'success',
        text: res.message || `Draft permohonan cuti ${confirmDeleteItem.requestNumber} berhasil dihapus.`,
      });
      setConfirmDeleteItem(null);
      await fetchLeaves();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus draft permohonan cuti.';
      setToastMessage({ type: 'error', text: msg });
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Permohonan Cuti Karyawan
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kelola pengajuan cuti tahunan dan cuti khusus (Standar Formulir F4)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchLeaves}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            Muat Ulang
          </button>

          <Link
            href="/dashboard/leaves/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Ajukan Cuti Baru
          </Link>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-fadeIn ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-2xs">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nomor permohonan, nama karyawan, NIP, atau alasan..."
          className="w-full text-xs text-slate-900 dark:text-white outline-none bg-transparent placeholder:text-slate-400"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            Hapus Filter
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4">No. Permohonan</th>
                <th className="py-3.5 px-4">Karyawan</th>
                <th className="py-3.5 px-4">Jenis Cuti</th>
                <th className="py-3.5 px-4">Periode Cuti</th>
                <th className="py-3.5 px-4 text-center">Durasi</th>
                <th className="py-3.5 px-4">Kembali Bekerja</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-1" />
                      <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800/60 rounded" />
                    </td>
                    <td className="py-4 px-4"><div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedLeaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">Belum ada permohonan cuti.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik &quot;Ajukan Cuti Baru&quot; untuk membuat permohonan cuti.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedLeaves.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {item.requestNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{item.employeeName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.employeeCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.leaveType === 'ANNUAL'
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                        }`}
                      >
                        {item.leaveType === 'ANNUAL' ? 'Cuti Tahunan' : 'Cuti Khusus'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {item.startDate} s/d {item.endDate}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                      {item.durationDays} Hari
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {item.resumeWorkDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                            : item.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                            : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                        }`}
                      >
                        {item.status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {item.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                        {item.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Action: Print (Requirement 10) */}
                        <Link
                          href={`/dashboard/leaves/${item.id}/print`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition shadow-2xs"
                          title="Pratinjau & Cetak Formulir Cuti F4"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print
                        </Link>

                        {/* Action: Approve HR Manual (Requirement 9) */}
                        {item.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => setConfirmApproveItem(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 rounded-lg transition shadow-2xs cursor-pointer"
                            title="Setujui permohonan setelah dokumen fisik ditandatangani"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approve
                          </button>
                        )}

                        {/* Action: Hapus Draft (Requirement 11) */}
                        {item.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteItem(item)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 rounded-lg transition shadow-2xs cursor-pointer"
                            title="Hapus draft pengajuan cuti yang belum disetujui"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls (Requirement 6) */}
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
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
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
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
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
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Berikutnya
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal: Approve HR Manual (Requirement 9) */}
      {confirmApproveItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Setujui Permohonan Cuti?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Anda akan menyetujui permohonan nomor <strong>{confirmApproveItem.requestNumber}</strong> atas nama <strong>{confirmApproveItem.employeeName}</strong> ({confirmApproveItem.durationDays} hari cuti). Pastikan dokumen fisik F4 telah ditandatangani pemohon dan atasan.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmApproveItem(null)}
                disabled={isProcessingAction}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessingAction}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
              >
                {isProcessingAction && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                Ya, Setujui Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Draft (Requirement 11) */}
      {confirmDeleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/50">
                <Trash2 className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Draft Permohonan?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus permohonan <strong>{confirmDeleteItem.requestNumber}</strong> ({confirmDeleteItem.employeeName})? Kuota cuti terpakai ({confirmDeleteItem.durationDays} hari) akan secara otomatis <strong>dikembalikan</strong> ke saldo karyawan.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDeleteItem(null)}
                disabled={isProcessingAction}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteDraft}
                disabled={isProcessingAction}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition flex items-center gap-2 cursor-pointer"
              >
                {isProcessingAction && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                Ya, Hapus Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
