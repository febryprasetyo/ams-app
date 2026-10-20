'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Printer, RefreshCw, Clock, History, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { CMC_LOGO_SRC, GoodsDocumentHeading, GoodsDocumentSignatures, goodsIdentityRowClass } from './GoodsRequestDocument';
import { api } from '@/lib/api';
import { escapeHtml } from '@/lib/printHtml';
import {
  GA_API_PATH,
  GA_BASE_PATH,
  GoodsRequest,
  StatusLog,
  requestNumber,
  rupiah,
} from '@/lib/goodsRequests';
import { getStatusBadgeConfig, getStatusLabel } from '@/lib/ga/goodsRequestStatus';
import StatusTransitionModal from './StatusTransitionModal';
import SignedDocumentArchive from './SignedDocumentArchive';

export default function GoodsRequestDetail({ id, saved = false }: { id: string; saved?: boolean }) {
  const { hasPermission } = useAuth();
  const canManageStatus = hasPermission('ga.requests.create');

  const [request, setRequest] = useState<GoodsRequest>();
  const [history, setHistory] = useState<StatusLog[]>([]);
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
    Promise.all([
      api.get<GoodsRequest>(`${GA_API_PATH}/${id}`),
      api.get<StatusLog[]>(`${GA_API_PATH}/${id}/history`).catch(() => []),
    ])
      .then(async ([reqResult, historyResult]) => {
        if (!active) return;
        setRequest(reqResult);
        setHistory(historyResult);
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
    if (!request) return;
    const popup = window.open('', '_blank');
    if (!popup) {
      setPrintError('Izinkan jendela cetak pada browser lalu coba kembali.');
      return;
    }
    setPrintError('');
    let logoSource: string;
    try {
      const response = await fetch(CMC_LOGO_SRC);
      if (!response.ok) throw new Error('Logo CMC tidak tersedia.');
      const bytes = new Uint8Array(await response.arrayBuffer());
      logoSource = 'data:image/png;base64,' + btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
    } catch {
      popup.close();
      setPrintError('Logo CMC gagal dimuat. Coba cetak kembali.');
      return;
    }

    const e = escapeHtml;
    const items = request.items || [];
    const rows = items
      .map(
        item =>
          '<tr><td>' +
          item.position +
          '</td><td>' +
          item.quantity +
          '</td><td>' +
          e(item.name) +
          '</td><td>' +
          e(rupiah(item.estimatedPrice)) +
          '</td><td>' +
          e(rupiah(item.subtotal)) +
          '</td><td>' +
          e(item.notes) +
          '</td></tr>'
      )
      .join('') +
      Array.from({ length: Math.max(0, 5 - items.length) }, () => '<tr>' + '<td style="height:20px"></td>'.repeat(6) + '</tr>').join('');

    const identity = [
      ['Nomor', requestNumber(request)],
      ['Judul', request.title || '—'],
      ['Tanggal', request.requestDate],
      ['Diajukan', request.requesterName],
      ['Jabatan', request.jobTitle],
      ['Divisi', request.division],
    ]
      .map(([label, value]) => '<div><span>' + e(label) + '</span><span>:</span><span>' + e(value) + '</span></div>')
      .join('');

    const evidence = items
      .map(
        item =>
          '<section><h3>Bukti harga item ' +
          item.position +
          ' — ' +
          e(item.name) +
          '</h3>' +
          (item.attachments || [])
            .map(file => (images[file.id] ? '<img alt="Bukti harga" src="' + e(images[file.id]) + '">' : ''))
            .join('') +
          '</section>'
      )
      .join('');

    popup.document.write(
      '<!doctype html><html lang="id"><head><title>' +
        e(requestNumber(request)) +
        '</title><style>@page{size:A4;margin:14mm}body{font:12px Arial;color:#111}h1{text-align:center;font-size:20px;text-decoration:underline;margin:0;padding:20px 8px}.document-heading{display:grid;grid-template-columns:100px 1fr 100px;border:1px solid #333;align-items:stretch}.document-logo{display:flex;align-items:center;justify-content:center;border-right:1px solid #333}.company-logo{width:72px;height:64px;object-fit:contain}.document-heading span{border-left:1px solid #333}table{border-collapse:collapse;width:100%;margin:0}th,td{border:1px solid #333;padding:8px;vertical-align:top;overflow-wrap:anywhere}tr{break-inside:avoid}section{break-inside:avoid;margin-top:20px}img{max-width:100%;max-height:220mm;object-fit:contain}th{white-space:nowrap}.signatures{table-layout:fixed;text-align:center}.signatures th,.signatures td{text-align:center}.signatures td{height:90px;vertical-align:bottom}small{display:block;margin:0;text-align:center}.identity{padding:20px 0}.identity>div{display:grid;grid-template-columns:88px 12px minmax(0,1fr);padding:6px 0;border-bottom:1px solid #ddd}</style></head><body><div class="document-heading"><div class="document-logo"><img class="company-logo" src="' +
        e(logoSource) +
        '" alt="Logo Cahaya Mas Cemerlang (CMC)"></div><h1>FORM PERMINTAAN BARANG</h1><span></span></div><div class="identity">' +
        identity +
        '</div><table><thead><tr><th>No</th><th>Qty</th><th>Nama Barang</th><th>Estimasi Harga</th><th>Subtotal Harga</th><th>Keterangan</th></tr></thead><tbody>' +
        rows +
        '</tbody></table><table class="signatures"><tr>' +
        ['Diajukan', 'Diketahui Oleh', 'Diperiksa', 'Disetujui', 'Penjual'].map(label => '<th>' + label + '</th>').join('') +
        '</tr><tr><td><small>' +
        e(request.requesterName) +
        '</small></td><td><small>(________________)</small></td><td><small>(________________)</small></td><td><small>(________________)</small></td><td><small>(________________)</small></td></tr></table>' +
        evidence +
        '</body></html>'
    );
    popup.document.close();
    void Promise.all(Array.from(popup.document.images).map(image => image.decode().catch(() => undefined))).then(() => {
      popup.focus();
      popup.print();
    });
  }

  const badge = request ? getStatusBadgeConfig(request.status) : null;

  return (
    <DashboardLayout>
      <main className="mx-auto min-w-0 max-w-5xl space-y-6 pb-12">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={GA_BASE_PATH}
            aria-label="Daftar permintaan barang"
            className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 dark:text-slate-400"
          >
            <ArrowLeft size={16} /> Kembali ke daftar permintaan barang
          </Link>

          <button
            onClick={reload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Segarkan
          </button>
        </div>

        {/* Title & Actions Bar */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {request?.title || 'Permintaan Barang'}
              </h1>
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
              <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
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
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Printer size={15} /> Cetak Formulir
              </button>
            </div>
          )}
        </div>

        {saved && !loading && !error && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
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
          <div className="space-y-6">
            {/* Document Article */}
            <article aria-label="Lembar permintaan barang" className="min-w-0 rounded-2xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
              <GoodsDocumentHeading detail title={request.title} />

              {request.purpose && (
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Alasan Pembelian:</span>
                  <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">{request.purpose}</p>
                </div>
              )}

              <dl className="grid grid-cols-1 sm:grid-cols-2 border-b border-slate-300 dark:border-slate-800 text-xs">
                {[
                  ['Tanggal', request.requestDate.split('-').reverse().join('/')],
                  ['Diajukan', request.requesterName],
                  ['Jabatan', request.jobTitle],
                  ['Divisi', request.division],
                ].map(([label, value]) => (
                  <div key={label} className={goodsIdentityRowClass}>
                    <dt className="font-medium text-slate-800 dark:text-slate-200">{label}</dt>
                    <span aria-hidden="true">:</span>
                    <dd className="break-words font-semibold text-slate-900 dark:text-white px-2">{value}</dd>
                  </div>
                ))}
              </dl>

              {/* Items Table */}
              <div className="relative overflow-x-auto">
                <table aria-label="Barang yang diajukan" className="w-full min-w-[850px] border-collapse text-left text-xs">
                  <thead>
                    <tr>
                      {['No', 'Qty', 'Nama Barang', 'Estimasi Harga', 'Subtotal Harga', 'Keterangan'].map(label => (
                        <th
                          key={label}
                          scope="col"
                          className="border border-slate-300 bg-slate-50 px-3 py-2 text-center font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(request.items || []).map(item => (
                      <tr key={item.id} className="text-slate-700 dark:text-slate-300">
                        <td className="border border-slate-300 p-3 text-center dark:border-slate-800">{item.position}</td>
                        <td className="border border-slate-300 p-3 text-center dark:border-slate-800">{item.quantity}</td>
                        <td className="max-w-72 break-words border border-slate-300 p-3 dark:border-slate-800 font-medium text-slate-900 dark:text-white">
                          {item.name}
                        </td>
                        <td className="whitespace-nowrap border border-slate-300 p-3 text-right dark:border-slate-800">
                          {rupiah(item.estimatedPrice)}
                        </td>
                        <td className="whitespace-nowrap border border-slate-300 p-3 text-right font-bold text-slate-900 dark:border-slate-800 dark:text-white">
                          {rupiah(item.subtotal)}
                        </td>
                        <td className="max-w-64 whitespace-pre-wrap break-words border border-slate-300 p-3 dark:border-slate-800 text-slate-500">
                          {item.notes || '—'}
                        </td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 5 - (request.items?.length || 0)) }, (_, index) => (
                      <tr key={`blank-${index}`} aria-hidden="true">
                        {Array.from({ length: 6 }, (_, column) => (
                          <td key={column} className="h-9 border border-slate-300 dark:border-slate-800" />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <GoodsDocumentSignatures requesterName={request.requesterName} />
              </div>

              {/* Price Evidence Gallery */}
              <div aria-label="Lampiran bukti harga" className="p-4 sm:p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bukti Perbandingan Harga
                </h3>
                {imageLoading && <p role="status" className="text-xs text-slate-500">Memuat bukti gambar...</p>}
                {imageError && (
                  <div role="alert" className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg">
                    <p>{imageError}</p>
                    <button onClick={reload} className="mt-1 underline">Muat kembali</button>
                  </div>
                )}
                {(request.items || []).map(item => (
                  <section key={item.id} className="border-b border-slate-200 pb-4 last:border-b-0 dark:border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
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
                            className="group block rounded-xl border border-slate-200 p-1.5 hover:border-emerald-500 dark:border-slate-800"
                          >
                            <img
                              src={images[file.id]}
                              alt={`Bukti harga ${item.name}`}
                              className="h-28 w-40 object-cover rounded-lg"
                            />
                            <span className="mt-1 block text-[11px] text-emerald-700 group-hover:underline dark:text-emerald-400">
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

            {/* Signed Document Physical Archive Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <SignedDocumentArchive
                requestId={request.id}
                documents={request.signedDocuments || []}
                onUploaded={reload}
              />
            </div>

            {/* Status History / Audit Trail Timeline */}
            <section aria-label="Riwayat Status Administrasi" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History size={16} className="text-emerald-600" />
                Linimasa Riwayat Administrasi
              </h3>

              {history.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada riwayat perubahan status.</p>
              ) : (
                <div className="space-y-4 border-l-2 border-emerald-500/30 ml-2 pl-4">
                  {history.map((log) => (
                    <div key={log.id} className="relative text-xs">
                      <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-white dark:ring-slate-900" />
                      <div className="flex flex-wrap items-center gap-2 font-bold text-slate-900 dark:text-white">
                        <span>{log.fromStatus ? getStatusLabel(log.fromStatus as any) : 'Awal'}</span>
                        <span>→</span>
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {getStatusLabel(log.toStatus as any)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                        {log.notes || 'Status diperbarui oleh petugas GA.'}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {log.changerName ? `Petugas GA: ${log.changerName} · ` : ''}
                        {new Date(log.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Status Transition Modal */}
        {request && (
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
