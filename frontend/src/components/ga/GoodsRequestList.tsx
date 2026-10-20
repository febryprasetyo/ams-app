'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Loader2, FileText, Printer, Search, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  GA_API_PATH,
  GA_BASE_PATH,
  GoodsRequest,
  requestNumber,
  rupiah,
} from '@/lib/goodsRequests';
import { filterTabs } from '@/lib/ga/catalogConfig';
import { getStatusBadgeConfig, getStatusLabel, GoodsRequestStatus } from '@/lib/ga/goodsRequestStatus';
import GAApprovalsCatalog from './GAApprovalsCatalog';

export default function GoodsRequestList() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState<{ items: GoodsRequest[]; total: number; pageSize: number }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ page: String(page) });
    if (statusFilter !== 'all') {
      query.set('status', statusFilter);
    }

    setLoading(true);
    api.get<{ items: GoodsRequest[]; total: number; pageSize: number }>(`${GA_API_PATH}?${query.toString()}`)
      .then(result => {
        if (active) {
          setData(result);
          setError('');
        }
      })
      .catch(cause => {
        if (active) setError(cause.message || 'Gagal memuat daftar pengajuan.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [page, statusFilter, retry]);

  function reload() {
    setLoading(true);
    setError('');
    setRetry(v => v + 1);
  }

  function handleFilterChange(key: string) {
    setStatusFilter(key);
    setPage(1);
  }

  function changePage(next: number) {
    setPage(next);
  }

  return (
    <DashboardLayout>
      <main className="mx-auto min-w-0 max-w-6xl space-y-8 pb-12">
        {/* Header Section */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Pengajuan General Affairs
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Katalog dan administrasi pengajuan GA dengan alur pengesahan fisik (tanda tangan basah).
            </p>
          </div>
          {hasPermission('ga.requests.create') && (
            <Link
              href={`${GA_BASE_PATH}/new`}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
            >
              <Plus size={16} /> Buat Pengajuan
            </Link>
          )}
        </div>

        {/* Odoo Approvals Category Cards */}
        <GAApprovalsCatalog />

        {/* Work Area / Table of Requests */}
        <section aria-label="Area Kerja Pengajuan" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Daftar Pengajuan Barang
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pantau proses pencatatan, cetak formulir, pengesahan manual, dan arsip fisik.
              </p>
            </div>
            <button
              onClick={reload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              title="Muat Ulang"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Segarkan
            </button>
          </div>

          {/* Filter Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {filterTabs.map((tab) => {
              const isSelected = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleFilterChange(tab.key)}
                  className={`inline-flex min-h-8 shrink-0 items-center rounded-lg px-3 py-1 text-xs font-medium transition ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {loading ? (
              <p role="status" className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
                <Loader2 size={18} className="animate-spin text-emerald-600" /> Memuat daftar pengajuan...
              </p>
            ) : error ? (
              <div role="alert" className="p-6 text-sm text-rose-700 dark:text-rose-400">
                <p>{error}</p>
                <button
                  onClick={reload}
                  className="mt-3 min-h-9 rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Coba kembali
                </button>
              </div>
            ) : !data?.items.length ? (
              <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
                <p>Tidak ada pengajuan ditemukan untuk filter ini.</p>
                {hasPermission('ga.requests.create') && (
                  <Link
                    href={`${GA_BASE_PATH}/new`}
                    className="mt-3 inline-flex min-h-9 items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    + Buat Pengajuan Baru
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                      <tr>
                        <th scope="col" className="p-4 font-semibold">Nomor & Kebutuhan</th>
                        <th scope="col" className="p-4 font-semibold">Tanggal</th>
                        <th scope="col" className="p-4 font-semibold">Pengaju Dokumen</th>
                        <th scope="col" className="p-4 font-semibold">Divisi</th>
                        <th scope="col" className="p-4 font-semibold text-right">Total Estimasi</th>
                        <th scope="col" className="p-4 font-semibold text-center">Status Administrasi</th>
                        <th scope="col" className="p-4 font-semibold text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.items.map((request) => {
                        const badge = getStatusBadgeConfig(request.status);
                        return (
                          <tr
                            key={request.id}
                            className="text-slate-700 transition hover:bg-slate-50/80 dark:text-slate-300 dark:hover:bg-slate-800/40"
                          >
                            <td className="p-4">
                              <div className="font-mono font-bold text-slate-900 dark:text-white">
                                {requestNumber(request)}
                              </div>
                              <div className="mt-0.5 line-clamp-1 text-slate-500 dark:text-slate-400">
                                {request.title || 'Tanpa judul'}
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              {request.requestDate.split('-').reverse().join('/')}
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-slate-900 dark:text-white">
                                {request.requesterName}
                              </div>
                              {request.creatorName && (
                                <div className="text-[11px] text-slate-400">
                                  Petugas GA: {request.creatorName}
                                </div>
                              )}
                            </td>
                            <td className="p-4">{request.division}</td>
                            <td className="p-4 text-right font-medium text-slate-900 dark:text-white">
                              {rupiah(request.totalEstimated || 0)}
                            </td>
                            <td className="p-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />
                                {getStatusLabel(request.status)}
                              </span>
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <Link
                                href={`${GA_BASE_PATH}/${request.id}`}
                                className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                              >
                                <FileText size={14} /> Detail
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <p>
                    {data.total} pengajuan · Halaman {page} dari {Math.max(1, Math.ceil(data.total / data.pageSize))}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => changePage(page - 1)}
                      className="min-h-8 rounded-lg border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    >
                      Sebelumnya
                    </button>
                    <button
                      disabled={page * data.pageSize >= data.total}
                      onClick={() => changePage(page + 1)}
                      className="min-h-8 rounded-lg border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}
