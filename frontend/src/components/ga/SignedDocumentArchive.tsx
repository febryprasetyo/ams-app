'use client';

import React, { useState } from 'react';
import { FileText, Upload, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { SignedDocument } from '@/types/goodsRequest';
import { api } from '@/lib/api';
import { GA_API_PATH } from '@/lib/goodsRequests';
import { useAuth } from '@/context/AuthContext';

interface SignedDocumentArchiveProps {
  requestId: string;
  documents: SignedDocument[];
  onUploaded: () => void;
}

export default function SignedDocumentArchive({
  requestId,
  documents,
  onUploaded,
}: SignedDocumentArchiveProps) {
  const { hasPermission } = useAuth();
  const canUpload = hasPermission('ga.requests.create');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran file dokumen bertanda tangan maksimal 10 MB.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const form = new FormData();
      form.append('document', file);

      await api.upload(`${GA_API_PATH}/${requestId}/signed-document`, form);
      setSuccess('Dokumen fisik bertanda tangan berhasil diunggah.');
      onUploaded();
    } catch (cause) {
      setError((cause as Error).message || 'Gagal mengunggah dokumen fisik.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function handleDownload(docId: string, fileName: string) {
    try {
      const blob = await api.download(`${GA_API_PATH}/${requestId}/signed-document/${docId}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError((cause as Error).message || 'Gagal mengunduh dokumen.');
    }
  }

  return (
    <section aria-label="Arsip Dokumen Fisik Bertanda Tangan" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText size={16} className="text-emerald-600" />
            Arsip Dokumen Fisik Bertanda Tangan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scan/foto formulir fisik yang telah ditandatangani basah oleh para pejabat.
          </p>
        </div>

        {canUpload && (
          <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100 active:scale-95 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            {uploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            {uploading ? 'Mengunggah...' : 'Unggah Scan TTD Basah'}
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              disabled={uploading}
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {error && (
        <div role="alert" className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 rounded-xl border border-rose-200 flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div role="status" className="p-3 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle size={14} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <p>Belum ada arsip dokumen fisik yang diunggah.</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Setelah dokumen dicetak dan ditandatangani lengkap, scan atau foto formulir dan unggah ke sini sebagai bukti arsip.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-slate-50/50 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/50">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {doc.fileName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {Math.ceil(doc.size / 1024)} KB · Diunggah oleh {doc.uploaderName || 'GA'} pada{' '}
                    {new Date(doc.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleDownload(doc.id, doc.fileName)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <Download size={13} /> Unduh Arsip
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
