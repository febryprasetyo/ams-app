'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Printer, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import './goodsRequestPrint.css';
import { GoodsDocumentHeading, GoodsDocumentSignatures } from './GoodsRequestDocument';
import { api } from '@/lib/api';
import {
  GA_API_PATH,
  GA_BASE_PATH,
  GoodsRequest,
  requestNumber,
  rupiah,
} from '@/lib/goodsRequests';
import { getStatusBadgeConfig, getStatusLabel } from '@/lib/ga/goodsRequestStatus';
import StatusTransitionModal from './StatusTransitionModal';

export default function GoodsRequestDetail({ id, saved = false }: { id: string; saved?: boolean }) {
  const { hasPermission } = useAuth();
  const canManageStatus = hasPermission('ga.requests.create');

  const [request, setRequest] = useState<GoodsRequest>();
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');
  const [retry, setRetry] = useState(0);
  const [printError, setPrintError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const ownedUrls: string[] = [];

    setLoading(true);
    api.get<GoodsRequest>(`${GA_API_PATH}/${id}`)
      .then(async (reqResult) => {
        if (!active) return;
        setRequest(reqResult);
        setLoading(false);

        const entries: [string, string][] = [];
        const items = reqResult.items || [];
        const results = await Promise.allSettled(
          items.flatMap(item => item.attachments || []).map(async file => {
            const blob = await api.download(`${GA_API_PATH}/${id}/evidence/${file.id}`);
            if (!active) return;
            const url = URL.createObjectURL(blob);
            ownedUrls.push(url);
            entries.push([file.id, url]);
          })
        );

        if (active) {
          setImages(Object.fromEntries(entries));
          setImageLoading(false);
          if (results.some(result => result.status === 'rejected')) {
            setImageError('Sebagian bukti harga gagal dimuat. Coba muat kembali.');
          }
        }
      })
      .catch(cause => {
        if (active) {
          setError(cause.message || 'Gagal memuat pengajuan.');
          setLoading(false);
          setImageLoading(false);
        }
      });

    return () => {
      active = false;
      ownedUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [id, retry]);

  function reload() {
    setLoading(true);
    setError('');
    setImageError('');
    setImageLoading(true);
    setImages({});
    setRetry(v => v + 1);
  }

  async function print() {
    if (!request || imageLoading || imageError) return;
    setPrintError('');
    try {
      await Promise.all(Array.from(document.querySelectorAll<HTMLImageElement>('.ga-request-document img')).map(image => image.decode()));
      window.print();
    } catch {
      setPrintError('Gambar dokumen gagal dimuat. Coba cetak kembali.');
    }
  }

  const badge = request ? getStatusBadgeConfig(request.status) : null;

  return (
    <DashboardLayout>
      <main className="ga-request-detail mx-auto min-w-0 max-w-5xl space-y-4 pb-6">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={GA_BASE_PATH}
            aria-label="Daftar permintaan barang"
            className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700"
          >
            <ArrowLeft size={16} /> Kembali ke daftar permintaan barang
          </Link>

          </div>

        {/* Title & Actions Bar */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {request && badge && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />
                  {getStatusLabel(request.status)}
                </span>
              )}
            </div>
            {request && (
              <p className="mt-1 font-mono text-xs text-slate-500">
                {requestNumber(request)} · Versi {request.version || 1}
              </p>
            )}
          </div>

          {request && !loading && (
            <div className="flex items-center gap-2.5 flex-wrap">
              {canManageStatus && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                >
                  <CheckCircle2 size={15} /> Perbarui Status
                </button>
              )}

              <button
                disabled={imageLoading || !!imageError}
                onClick={print}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                <Printer size={15} /> Cetak Formulir
              </button>
            </div>
          )}
        </div>

        {saved && !loading && !error && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
            Pengajuan dan seluruh lampiran berhasil disimpan. Dokumen siap dicetak untuk ditandatangani secara basah.
          </p>
        )}

        {printError && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
            {printError}
          </p>
        )}

        {loading ? (
          <p role="status" className="flex items-center gap-2 p-12 text-sm text-slate-500 justify-center">
            <Loader2 size={18} className="animate-spin text-emerald-600" /> Memuat data pengajuan...
          </p>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            <p>{error}</p>
            <button className="mt-3 min-h-9 rounded-xl border border-slate-200 bg-white px-3 font-medium text-slate-700" onClick={reload}>
              Coba kembali
            </button>
          </div>
        ) : request && (
          <div className="ga-request-document-area space-y-6">
            {/* Document Article */}
            <article role="group" aria-label="Lembar permintaan barang" className="ga-request-document min-w-0 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <GoodsDocumentHeading headingColorClass="text-black" />

              <dl className="space-y-3 border-b border-slate-200 p-4 text-xs sm:p-6">
                {[
                  ['Tanggal', request.requestDate.split('-').reverse().join('/')],
                  ['Nama', request.requesterName],
                  ['Jabatan', request.jobTitle],
                  ['Divisi', request.division],
                ].map(([label, value]) => (
                  <div key={label} className="grid min-h-11 grid-cols-[64px_12px_minmax(0,1fr)] items-center sm:grid-cols-[100px_16px_minmax(0,1fr)]">
                    <dt className="font-medium text-slate-800">{label}</dt>
                    <span aria-hidden="true">:</span>
                    <dd className="flex min-h-11 min-w-0 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 [overflow-wrap:anywhere]">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-wrap items-start justify-between gap-3 p-4 sm:px-6">
                <h2 className="text-sm font-bold text-slate-900">Rincian barang</h2>
                <p className="text-xs text-slate-600">{request.items?.length || 0} item</p>
                <p className="w-full text-xs text-slate-600 sm:hidden">Geser tabel ke samping untuk melihat harga dan kolom pengesahan.</p>
              </div>
              <div className="mx-4 overflow-x-auto sm:mx-6">
                <table aria-label="Barang yang diajukan" className="w-full min-w-[850px] border-collapse text-left text-xs">
                  <thead>
                    <tr>
                      {['No', 'Qty', 'Nama Barang', 'Estimasi Harga', 'Subtotal Harga', 'Keterangan'].map(label => (
                        <th
                          key={label}
                          scope="col"
                          className="border border-slate-300 bg-slate-50 px-3 py-2 text-center font-semibold text-slate-800"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(request.items || []).map(item => (
                      <tr key={item.id} className="text-slate-700">
                        <td className="border border-slate-300 p-3 text-center">{item.position}</td>
                        <td className="border border-slate-300 p-3 text-center">{item.quantity}</td>
                        <td className="max-w-72 break-words border border-slate-300 p-3 font-medium text-slate-900">
                          {item.name}
                        </td>
                        <td className="whitespace-nowrap border border-slate-300 p-3 text-right">
                          {rupiah(item.estimatedPrice)}
                        </td>
                        <td className="whitespace-nowrap border border-slate-300 p-3 text-right font-bold text-slate-900">
                          {rupiah(item.subtotal)}
                        </td>
                        <td className="max-w-64 whitespace-pre-wrap break-words border border-slate-300 p-3 text-slate-500">
                          {item.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mx-4 mt-4 overflow-x-auto sm:mx-6">
                <GoodsDocumentSignatures requesterName={request.requesterName} />
              </div>

              {/* Price Evidence Gallery */}
              <div aria-label="Lampiran bukti harga" className="p-4 sm:p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Lampiran Bukti Harga per Barang
                </h3>
                {imageLoading && <p role="status" className="text-xs text-slate-500">Memuat bukti gambar...</p>}
                {imageError && (
                  <div role="alert" className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg">
                    <p>{imageError}</p>
                    <button onClick={reload} className="mt-1 underline">Muat kembali</button>
                  </div>
                )}
                {(request.items || []).map(item => (
                  <section key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <h4 className="text-xs font-semibold text-slate-800">
                      Item {item.position}: {item.name}
                    </h4>
                    <div className="mt-2 flex flex-wrap gap-4">
                      {(item.attachments || []).map((file, idx) =>
                        images[file.id] ? (
                          <a
                            key={file.id}
                            href={images[file.id]}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Buka bukti harga item ${item.position}, gambar ${idx + 1}`}
                            className="group block rounded-xl border border-slate-200 p-1.5 hover:border-emerald-500"
                          >
                            <img
                              src={images[file.id]}
                              alt={`Bukti harga ${item.name}`}
                              className="h-28 w-40 object-cover rounded-lg"
                            />
                            <span className="mt-1 block text-[11px] text-emerald-700 group-hover:underline">
                              Buka ukuran penuh ({Math.ceil(file.size / 1024)} KB)
                            </span>
                          </a>
                        ) : null
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </article>

          </div>
        )}

        {/* Status Transition Modal */}
        {request && isModalOpen && (
          <StatusTransitionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            requestId={request.id}
            currentStatus={request.status}
            onSuccess={reload}
          />
        )}
      </main>
    </DashboardLayout>
  );
}
