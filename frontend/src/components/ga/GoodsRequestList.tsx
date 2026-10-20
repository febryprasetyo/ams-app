'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Plus,
  Loader2,
  FileText,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
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
import { getStatusBadgeConfig, getStatusLabel } from '@/lib/ga/goodsRequestStatus';

const STATUS_TABS = [
  { key: 'all', label: 'Semua Status' },
  { key: 'draft', label: 'Draft' },
  { key: 'ready_to_print', label: 'Siap Cetak' },
  { key: 'processing', label: 'Diproses' },
  { key: 'completed', label: 'Selesai' },
  { key: 'cancelled', label: 'Batal / Ditolak' },
];

export default function GoodsRequestList() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
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

  const items = data?.items || [];
  const filteredItems = search.trim()
    ? items.filter(req =>
        (req.title || '').toLowerCase().includes(search.toLowerCase()) ||
        req.requesterName.toLowerCase().includes(search.toLowerCase()) ||
        req.division.toLowerCase().includes(search.toLowerCase()) ||
        requestNumber(req).toLowerCase().includes(search.toLowerCase())
      )
    : items;

  // Metric counts based on loaded data
  const readyCount = items.filter(i => i.status === 'ready_to_print').length;
  const purchasingCount = items.filter(i => i.status === 'processing').length;
  const completedCount = items.filter(i => i.status === 'completed').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header - Standard AMS Directory Pattern */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ClipboardList className="w-6 h-6 text-emerald-600" />
              <span>Permintaan Barang GA</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Direktori pengajuan pengadaan barang dengan alur pengesahan fisik (tanda tangan basah).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={reload}
              className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </button>
            {hasPermission('ga.requests.create') && (
              <Link
                href={`${GA_BASE_PATH}/new`}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> Buat Pengajuan
              </Link>
            )}
          </div>
        </div>

        {/* Stats Summary - Standard Emerald Enterprise Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl flex items-center gap-4 bg-white border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-slate-50 border-slate-100 text-slate-600">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Total Pengajuan</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{data?.total ?? 0}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl flex items-center gap-4 bg-white border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-emerald-50 border-emerald-100 text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Siap Cetak</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{readyCount}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl flex items-center gap-4 bg-white border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-amber-50 border-amber-100 text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Proses Beli</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{purchasingCount}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl flex items-center gap-4 bg-white border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-emerald-50 border-emerald-100 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Selesai</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{completedCount}</p>
            </div>
          </div>
        </div>

        {/* Tab List - Standard Master Navigation */}
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-px" role="tablist" aria-label="Filter status pengajuan barang">
          {STATUS_TABS.map((tab) => {
            const isSelected = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleFilterChange(tab.key)}
                className={`border-b-2 px-4 py-3 text-sm font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center gap-3 shadow-sm">
          <div className="relative flex-1 min-w-48">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor pengajuan, nama barang, pemohon, atau divisi..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>
        </div>

        {/* Table Container - Standard AMS Data Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <p role="status" className="flex items-center justify-center gap-2 p-12 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> Memuat daftar pengajuan barang...
            </p>
          ) : error ? (
            <div role="alert" className="p-6 text-xs text-rose-700">
              <p>{error}</p>
              <button
                onClick={reload}
                className="mt-3 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Coba kembali
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <p>Tidak ada pengajuan ditemukan untuk filter ini.</p>
              {hasPermission('ga.requests.create') && (
                <Link
                  href={`${GA_BASE_PATH}/new`}
                  className="mt-3 inline-flex items-center rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Buat Pengajuan Baru
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    <tr>
                      <th scope="col" className="p-4 font-semibold">Nomor & Keperluan</th>
                      <th scope="col" className="p-4 font-semibold">Tanggal</th>
                      <th scope="col" className="p-4 font-semibold">Pemohon</th>
                      <th scope="col" className="p-4 font-semibold">Divisi</th>
                      <th scope="col" className="p-4 font-semibold text-right">Total Estimasi</th>
                      <th scope="col" className="p-4 font-semibold text-center">Status Administrasi</th>
                      <th scope="col" className="p-4 font-semibold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((request) => {
                      const badge = getStatusBadgeConfig(request.status);
                      return (
                        <tr
                          key={request.id}
                          className="text-slate-700 hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="p-4">
                            <div className="font-mono font-bold text-slate-900">
                              {requestNumber(request)}
                            </div>
                            <div className="mt-0.5 line-clamp-1 text-slate-500 font-medium">
                              {request.title || 'Tanpa judul'}
                            </div>
                          </td>
                          <td className="p-4 whitespace-nowrap text-slate-600">
                            {request.requestDate.split('-').reverse().join('/')}
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-slate-900">
                              {request.requesterName}
                            </div>
                            {request.creatorName && (
                              <div className="text-[11px] text-slate-400 font-mono">
                                Petugas: {request.creatorName}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-slate-600">{request.division}</td>
                          <td className="p-4 text-right font-semibold text-slate-900">
                            {rupiah(request.totalEstimated || 0)}
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />
                              {getStatusLabel(request.status)}
                            </span>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <Link
                              href={`${GA_BASE_PATH}/${request.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" /> Detail
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.total > data.pageSize && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-xs text-slate-500">
                  <p>
                    {data.total} pengajuan · Halaman {page} dari {Math.max(1, Math.ceil(data.total / data.pageSize))}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Sebelumnya
                    </button>
                    <button
                      disabled={page * data.pageSize >= data.total}
                      onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
