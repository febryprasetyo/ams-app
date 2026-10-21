'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GoodsRequestForm from './GoodsRequestForm';
import { api } from '@/lib/api';
import { GA_API_PATH, GA_BASE_PATH, GoodsRequest } from '@/lib/goodsRequests';
import { isRequestEditable } from '@/lib/ga/goodsRequestStatus';

export default function GoodsRequestEditWrapper({ id }: { id: string }) {
  const [request, setRequest] = useState<GoodsRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const res = await api.get<GoodsRequest>(`${GA_API_PATH}/${id}`);
        if (active) setRequest(res);
      } catch (err) {
        if (active) setError((err as Error).message || 'Gagal memuat data pengajuan.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <p role="status" className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin text-emerald-600" /> Memuat data pengajuan...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !request) {
    return (
      <DashboardLayout>
        <main className="mx-auto max-w-xl p-6">
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 space-y-4">
            <div className="flex items-center gap-2 font-bold text-base text-rose-900">
              <AlertCircle size={20} /> Gagal Membuka Formulir
            </div>
            <p>{error || 'Data permintaan barang tidak ditemukan.'}</p>
            <Link
              href={GA_BASE_PATH}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white border border-rose-200 px-4 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition"
            >
              <ArrowLeft size={15} /> Kembali ke daftar permintaan
            </Link>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (!isRequestEditable(request.status)) {
    return (
      <DashboardLayout>
        <main className="mx-auto max-w-xl p-6">
          <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 space-y-4">
            <div className="flex items-center gap-2 font-bold text-base text-amber-900">
              <AlertCircle size={20} /> Pengajuan Terkunci
            </div>
            <p>
              Permintaan barang ini sudah ditandai <strong>Disetujui</strong> atau sedang diproses, sehingga tidak dapat diedit kembali demi kepatuhan audit.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Link
                href={`${GA_BASE_PATH}/${request.id}`}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-semibold text-white hover:bg-emerald-800 transition"
              >
                Lihat Lembar Dokumen
              </Link>
              <Link
                href={GA_BASE_PATH}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white border border-slate-300 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Kembali ke Daftar
              </Link>
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return <GoodsRequestForm initialData={request} />;
}
