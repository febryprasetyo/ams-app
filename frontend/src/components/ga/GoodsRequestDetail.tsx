'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  GA_API_PATH,
  GA_BASE_PATH,
  GoodsRequest,
  formatFormDate,
  formatRupiahNumber,
  requestNumber,
  rupiah,
} from '@/lib/goodsRequests';
import StatusTransitionModal from './StatusTransitionModal';
import { getStatusBadgeConfig, getStatusLabel } from '@/lib/ga/goodsRequestStatus';
import { GoodsDocumentHeading, GoodsDocumentSignatures } from './GoodsRequestDocument';
import './goodsRequestPrint.css';

interface GoodsRequestDetailProps {
  id: string;
  saved?: boolean;
}

export default function GoodsRequestDetail({ id, saved = false }: GoodsRequestDetailProps) {
  const { hasPermission } = useAuth();
  const [request, setRequest] = useState<GoodsRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [images, setImages] = useState<Record<string, string>>({});
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState('');
  const [printError, setPrintError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [retry, setRetry] = useState(0);

  const canManageStatus = hasPermission('ga:requests:update_status') || hasPermission('ga:requests:manage');

  useEffect(() => {
    let active = true;
    const ownedUrls: string[] = [];

    api.get<GoodsRequest>(`${GA_API_PATH}/${id}`)
      .then(async res => {
        if (!active) return;
        setRequest(res);
        setLoading(false);

        // Fetch attachments
        const files: { id: string; itemId: number }[] = [];
        (res.items || []).forEach(item => {
          (item.attachments || []).forEach(att => {
            files.push({ id: att.id, itemId: item.position });
          });
        });

        if (files.length === 0) {
          setImageLoading(false);
          return;
        }

        const urlMap: Record<string, string> = {};
        for (const file of files) {
          try {
            const blob = await api.download(`${GA_API_PATH}/${id}/evidence/${file.id}`);
            if (!active) return;
            const objectUrl = URL.createObjectURL(blob);
            ownedUrls.push(objectUrl);
            urlMap[file.id] = objectUrl;
          } catch (err) {
            console.error('Gagal mengambil gambar bukti:', err);
          }
        }
        if (active) {
          setImages(urlMap);
          setImageLoading(false);
        }
      })
      .catch(err => {
        if (!active) return;
        setError(err.message || 'Gagal memuat rincian pengajuan.');
        setLoading(false);
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
      await Promise.all(Array.from(document.querySelectorAll<HTMLImageElement>('.ga-request-document-area img')).map(image => image.decode()));
      window.print();
    } catch {
      setPrintError('Gambar dokumen gagal dimuat. Coba cetak kembali.');
    }
  }

  const badge = request ? getStatusBadgeConfig(request.status) : null;

  const allAttachments = (request?.items || []).flatMap((item) =>
    (item.attachments || []).map((att) => ({
      ...att,
      itemId: item.id,
      itemPosition: item.position,
      itemName: item.name,
    }))
  );

  const paddedRows = Array.from(
    { length: Math.max(3, request?.items?.length || 0) },
    (_, i) => request?.items?.[i] || null
  );

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
          <div className="ga-request-document-area space-y-4">
            {/* Document Article */}
            <article
              role="group"
              aria-label="Lembar permintaan barang"
              className="ga-request-document min-w-0 border border-black bg-white shadow-sm print:shadow-none"
            >
              <GoodsDocumentHeading headingColorClass="text-black" />

              {/* Form Info Identity */}
              <div className="border-b border-black text-xs text-black">
                {[
                  ['Tanggal', formatFormDate(request.requestDate)],
                  ['Nama', request.requesterName],
                  ['Jabatan', request.jobTitle],
                  ['Divisi', request.division],
                ].map(([label, value], idx, arr) => (
                  <div
                    key={label}
                    className={`grid grid-cols-[85px_16px_minmax(0,1fr)] sm:grid-cols-[110px_20px_minmax(0,1fr)] items-center px-3 sm:px-4 py-1.5 ${
                      idx < arr.length - 1 ? 'border-b border-black' : ''
                    }`}
                  >
                    <span className="font-semibold">{label}</span>
                    <span aria-hidden="true">:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table aria-label="Barang yang diajukan" className="w-full min-w-[700px] border-collapse text-left text-xs text-black">
                  <thead>
                    <tr className="border-b border-black text-center font-bold">
                      <th scope="col" className="w-10 border-r border-black py-2 px-1 text-center font-bold">No</th>
                      <th scope="col" className="w-14 border-r border-black py-2 px-1 text-center font-bold">Qty</th>
                      <th scope="col" className="border-r border-black py-2 px-2 text-left font-bold">Nama Barang</th>
                      <th scope="col" className="w-36 border-r border-black py-2 px-2 text-center font-bold">Estimasi Harga</th>
                      <th scope="col" className="w-28 border-r border-black py-2 px-2 text-center font-bold">Harga</th>
                      <th scope="col" className="w-44 py-2 px-2 text-left font-bold">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paddedRows.map((item, idx) => (
                      <tr key={idx} className="border-b border-black">
                        <td className="border-r border-black py-2 px-1 text-center font-medium">{idx + 1}</td>
                        <td className="border-r border-black py-2 px-1 text-center font-medium">{item?.quantity ?? ''}</td>
                        <td className="border-r border-black py-2 px-2 text-left font-medium break-words leading-tight">
                          {item?.name ?? ''}
                        </td>
                        <td className="border-r border-black py-2 px-2 whitespace-nowrap">
                          {item ? (
                            <div className="flex justify-between items-center w-full">
                              <span>Rp</span>
                              <span className="font-mono">{formatRupiahNumber(item.subtotal || (Number(item.estimatedPrice) * Number(item.quantity)))}</span>
                            </div>
                          ) : null}
                        </td>
                        <td className="border-r border-black py-2 px-2 text-right"></td>
                        <td className="py-2 px-2 text-left text-slate-800 break-words leading-tight">
                          {item?.notes || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures Table */}
              <div className="overflow-x-auto">
                <GoodsDocumentSignatures requesterName={request.requesterName} approverName="Jef Budiharto" />
              </div>
            </article>

            {/* Price Evidence Gallery */}
            <div aria-label="Lampiran bukti harga" className="ga-request-evidence-area mt-4 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Lampiran Bukti Harga per Barang
              </h3>
              {imageLoading && <p role="status" className="no-print text-xs text-slate-500">Memuat bukti gambar...</p>}
              {imageError && (
                <div role="alert" className="no-print text-xs text-rose-700 bg-rose-50 p-3 rounded-lg mb-2">
                  <p>{imageError}</p>
                  <button onClick={reload} className="mt-1 underline">Muat kembali</button>
                </div>
              )}
              {(request.items || []).map((item) => {
                const itemAttachments = item.attachments || [];
                if (itemAttachments.length === 0) return null;
                return (
                  <section key={item.id} className="ga-evidence-section rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <h4 className="ga-evidence-title text-xs font-semibold text-slate-800">
                      Item {item.position}: {item.name}
                    </h4>
                    <div className="mt-2 flex flex-wrap gap-4">
                      {itemAttachments.map((file, idx) =>
                        images[file.id] ? (
                          <div key={file.id} className="ga-evidence-card">
                            <a
                              href={images[file.id]}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Buka bukti harga item ${item.position}, gambar ${idx + 1}`}
                              className="group block rounded-xl border border-slate-200 bg-white p-1.5 hover:border-emerald-500 transition shadow-xs"
                            >
                              <img
                                src={images[file.id]}
                                alt={`Bukti harga ${item.name}`}
                                className="ga-evidence-img h-32 sm:h-44 w-auto max-w-full object-contain rounded-lg"
                              />
                              <span className="no-print mt-1.5 block text-center text-[11px] font-medium text-emerald-700 group-hover:underline">
                                Buka ukuran penuh ({Math.ceil(file.size / 1024)} KB)
                              </span>
                            </a>
                          </div>
                        ) : null
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
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
