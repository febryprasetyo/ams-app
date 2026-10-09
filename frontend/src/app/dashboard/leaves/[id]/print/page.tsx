'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { LeaveFormF4Document } from '@/components/leaves/LeaveFormF4Document';
import type { FullLeaveDocumentData } from '@/types/leaves';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LeavePrintPage() {
  const params = useParams();
  const id = params?.id as string;

  const [documentData, setDocumentData] = useState<FullLeaveDocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    async function fetchDoc() {
      try {
        const res = await fetch(`/api/leaves/requests/${id}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setError(json.error || 'Gagal memuat dokumen permohonan cuti');
        } else {
          const data = await res.json();
          setDocumentData(data);
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan jaringan');
      } finally {
        setIsLoading(false);
      }
    }
    fetchDoc();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span>Menyiapkan dokumen formulir cuti F4...</span>
        </div>
      </div>
    );
  }

  if (error || !documentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Dokumen Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">{error || 'Data permohonan cuti tidak dapat dimuat.'}</p>
          <Link
            href="/dashboard/leaves"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Cuti
          </Link>
        </div>
      </div>
    );
  }

  return <LeaveFormF4Document data={documentData} backHref="/dashboard/leaves" />;
}
