'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus, Save, Trash2, FileEdit } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { GoodsDocumentHeading, GoodsDocumentSignatures, goodsIdentityRowClass } from './GoodsRequestDocument';
import { api } from '@/lib/api';
import { compressEvidence, localEvidenceKey, GA_API_PATH, GA_BASE_PATH, rupiah } from '@/lib/goodsRequests';
import { validateFormSubmission } from '@/lib/ga/goodsFormValidation';

interface Evidence { key: string; file: File; url: string }
interface Row { key: string; name: string; quantity: string; estimatedPrice: string; notes: string; evidence: Evidence[] }
const newRow = (key = localEvidenceKey()): Row => ({ key, name: '', quantity: '1', estimatedPrice: '', notes: '', evidence: [] });
const inputClass = 'w-full min-h-11 rounded-none border-0 bg-transparent px-2 py-2 text-xs text-slate-900 focus:border-emerald-600 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';
const secondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';

export default function GoodsRequestForm() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [identity, setIdentity] = useState({
    requestDate: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
    requesterName: user?.fullName || '',
    jobTitle: '',
    division: '',
  });
  const [rows, setRows] = useState<Row[]>(() => [newRow('initial-item')]);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [invalidRows, setInvalidRows] = useState<string[]>([]);
  const urls = useRef(new Set<string>());
  const locked = useRef(false);
  const evidenceLock = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const ownedUrls = urls.current;
    return () => {
      mounted.current = false;
      ownedUrls.forEach(url => URL.revokeObjectURL(url));
      ownedUrls.clear();
    };
  }, []);

  function update(key: string, field: 'name' | 'quantity' | 'estimatedPrice' | 'notes', value: string) {
    setRows(current => current.map(row => row.key === key ? { ...row, [field]: value } : row));
  }

  function revoke(evidence: Evidence) {
    URL.revokeObjectURL(evidence.url);
    urls.current.delete(evidence.url);
  }

  async function addEvidence(rowKey: string, files: File[]) {
    if (!files.length || locked.current || evidenceLock.current) return;
    evidenceLock.current = true;
    setProcessing(true);
    setError('');
    const added: Evidence[] = [];
    try {
      const row = rows.find(row => row.key === rowKey);
      if (!row || row.evidence.length + files.length > 3) throw new Error('Maksimal 3 gambar bukti harga per item.');
      for (const source of files) {
        const file = await compressEvidence(source);
        if (!mounted.current) return;
        const url = URL.createObjectURL(file);
        urls.current.add(url);
        added.push({ key: localEvidenceKey(), file, url });
      }
      setRows(current => current.map(row => row.key === rowKey ? { ...row, evidence: [...row.evidence, ...added] } : row));
      setInvalidRows(current => current.filter(key => key !== rowKey));
    } catch (cause) {
      added.forEach(revoke);
      setError((cause as Error).message || 'Gambar gagal diproses. Silakan coba kembali.');
    } finally {
      evidenceLock.current = false;
      if (mounted.current) setProcessing(false);
    }
  }

  async function handleSubmit(isDraft: boolean) {
    if (busy || processing) return;

    setError('');
    const validation = validateFormSubmission({
      title,
      purpose,
      identity,
      rows: rows.map(r => ({
        name: r.name,
        quantity: r.quantity,
        estimatedPrice: r.estimatedPrice,
        notes: r.notes,
        evidenceCount: r.evidence.length,
      })),
    }, isDraft);

    if (!validation.isValid) {
      const missingEvidence = rows.filter(r => r.evidence.length === 0).map(r => r.key);
      setInvalidRows(missingEvidence);
      setError(validation.errors[0] || 'Periksa kembali kelengkapan formulir.');
      return;
    }

    setBusy(true);
    locked.current = true;

    try {
      const form = new FormData();
      const payload = {
        title: title.trim(),
        purpose: purpose.trim(),
        isDraft,
        status: isDraft ? 'draft' : 'ready_to_print',
        requestDate: identity.requestDate,
        requesterName: identity.requesterName.trim(),
        jobTitle: identity.jobTitle.trim(),
        division: identity.division.trim(),
        items: rows.map(row => ({
          name: row.name.trim(),
          quantity: Math.floor(Number(row.quantity)) || 1,
          estimatedPrice: Math.floor(Number(row.estimatedPrice)) || 0,
          notes: row.notes.trim(),
          attachmentKeys: row.evidence.map(e => e.key),
        })),
      };

      form.append('payload', JSON.stringify(payload));
      for (const row of rows) {
        for (const item of row.evidence) {
          form.append('evidence', item.file, item.key);
        }
      }

      const result = await api.post<{ id: string }>(GA_API_PATH, form);
      router.push(`${GA_BASE_PATH}/${result.id}`);
    } catch (cause) {
      locked.current = false;
      setBusy(false);
      setError((cause as Error).message || 'Pengajuan belum dapat disimpan. Coba kembali.');
    }
  }

  return (
    <DashboardLayout>
      <main className="mx-auto min-w-0 max-w-5xl space-y-6 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={GA_BASE_PATH}
            className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} /> Kembali ke daftar pengajuan
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              Persetujuan Tanda Tangan Basah
            </span>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit(false);
          }}
          className="space-y-6"
        >
          {/* Card Form Header & Identity */}
          <div className="rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <GoodsDocumentHeading />

            <div className="p-4 sm:p-6 space-y-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <label htmlFor="form-title" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Judul Pengajuan Kebutuhan <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-title"
                  type="text"
                  maxLength={255}
                  placeholder="Misal: Pengadaan 3 Unit Laptop Tim Engineering"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="form-purpose" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Alasan / Keperluan Pembelian
                </label>
                <textarea
                  id="form-purpose"
                  rows={2}
                  maxLength={2000}
                  placeholder="Jelaskan latar belakang kebutuhan barang ini..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Document Business Identity */}
            <div className="grid grid-cols-1 border-b border-slate-300 sm:grid-cols-2 text-xs">
              {([
                ['requestDate', 'Tanggal', 'date'],
                ['requesterName', 'Diajukan', 'text'],
                ['jobTitle', 'Jabatan', 'text'],
                ['division', 'Divisi', 'text'],
              ] as const).map(([key, label, type]) => (
                <div key={key} className={goodsIdentityRowClass}>
                  <label htmlFor={key} className="font-medium text-slate-800 dark:text-slate-200">
                    {label}
                  </label>
                  <span aria-hidden="true">:</span>
                  <input
                    id={key}
                    type={type}
                    maxLength={150}
                    value={identity[key]}
                    onChange={(e) => setIdentity(c => ({ ...c, [key]: e.target.value }))}
                    className="min-h-11 min-w-0 w-full rounded-none border-0 bg-transparent px-2 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              ))}
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table aria-label="Daftar barang" className="w-full min-w-[850px] border-collapse text-left text-xs">
                <thead>
                  <tr>
                    {['No', 'Qty', 'Nama Barang', 'Estimasi Harga', 'Subtotal Harga', 'Keterangan'].map(col => (
                      <th
                        key={col}
                        scope="col"
                        className="border border-slate-300 bg-slate-50 px-3 py-2 text-center font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.key} className="align-top">
                      <td className="w-12 border border-slate-300 p-3 text-center text-slate-700 dark:border-slate-800 dark:text-slate-300">
                        {index + 1}
                      </td>
                      <td className="w-24 border border-slate-300 p-1 dark:border-slate-800">
                        <input
                          id={`qty-${row.key}`}
                          type="number"
                          min={1}
                          max={1000000}
                          step={1}
                          value={row.quantity}
                          onChange={(e) => update(row.key, 'quantity', e.target.value)}
                          className={inputClass}
                        />
                      </td>
                      <td className="min-w-52 border border-slate-300 p-1 dark:border-slate-800">
                        <textarea
                          id={`name-${row.key}`}
                          rows={2}
                          maxLength={1000}
                          placeholder="Nama dan spesifikasi barang..."
                          value={row.name}
                          onChange={(e) => update(row.key, 'name', e.target.value)}
                          className={inputClass}
                        />
                      </td>
                      <td className="w-40 border border-slate-300 p-1 dark:border-slate-800">
                        <input
                          id={`price-${row.key}`}
                          type="number"
                          min={0}
                          max={100000000000}
                          step={1}
                          placeholder="0"
                          value={row.estimatedPrice}
                          onChange={(e) => update(row.key, 'estimatedPrice', e.target.value)}
                          className={inputClass}
                        />
                      </td>
                      <td className="whitespace-nowrap border border-slate-300 px-3 py-4 text-right font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
                        {rupiah((Number(row.quantity) || 0) * (Number(row.estimatedPrice) || 0))}
                      </td>
                      <td className="min-w-40 border border-slate-300 p-1 dark:border-slate-800">
                        <textarea
                          id={`notes-${row.key}`}
                          rows={2}
                          maxLength={2000}
                          placeholder="Catatan..."
                          value={row.notes}
                          onChange={(e) => update(row.key, 'notes', e.target.value)}
                          className={inputClass}
                        />
                        <button
                          type="button"
                          disabled={rows.length === 1}
                          className="inline-flex min-h-8 items-center gap-1.5 px-2 text-rose-600 hover:bg-rose-50 disabled:opacity-30 dark:hover:bg-rose-950/30"
                          onClick={() => {
                            row.evidence.forEach(revoke);
                            setRows(c => c.filter(item => item.key !== row.key));
                          }}
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 5 - rows.length) }, (_, i) => (
                    <tr key={`blank-${i}`} aria-hidden="true">
                      {Array.from({ length: 6 }, (_, col) => (
                        <td key={col} className="h-9 border border-slate-300 dark:border-slate-800" />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <GoodsDocumentSignatures requesterName={identity.requesterName} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 p-3 sm:px-6 dark:border-slate-800">
              <button
                type="button"
                disabled={rows.length >= 20}
                className={secondary}
                onClick={() => setRows(c => [...c, newRow()])}
              >
                <Plus size={16} /> Tambah baris barang
              </button>
              <p className="text-xs text-slate-500">
                Harga satuan dalam Rupiah · Maksimal 20 item
              </p>
            </div>

            {/* Price Evidence Upload Section */}
            <div className="p-4 sm:p-6 space-y-4" aria-label="Lampiran bukti harga">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Lampiran Bukti Harga per Barang
              </h3>
              {rows.map((row, index) => (
                <div
                  key={row.key}
                  id={`evidence-${row.key}`}
                  tabIndex={0}
                  onPaste={(event) => {
                    const files = Array.from(event.clipboardData.items)
                      .filter(item => item.type.startsWith('image/'))
                      .map(item => item.getAsFile())
                      .filter((f): f is File => !!f);
                    if (files.length) {
                      event.preventDefault();
                      void addEvidence(row.key, files);
                    }
                  }}
                  className={`rounded-xl border p-4 transition ${
                    invalidRows.includes(row.key)
                      ? 'border-rose-300 bg-rose-50/60 dark:border-rose-900/60 dark:bg-rose-950/20'
                      : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Item {index + 1}: {row.name || 'Barang baru'}{' '}
                      <span className="font-normal text-slate-500">({row.evidence.length}/3 gambar)</span>
                    </p>
                    <label className={`${secondary} relative cursor-pointer`}>
                      Pilih gambar
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        onChange={(e) => {
                          void addEvidence(row.key, Array.from(e.target.files || []));
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Klik area ini lalu Ctrl+V untuk paste screenshot, atau pilih gambar perbandingan harga.
                  </p>
                  {invalidRows.includes(row.key) && (
                    <p className="mt-2 text-xs font-semibold text-rose-600">
                      Lampiran bukti harga wajib ditambahkan untuk mode Siap Cetak.
                    </p>
                  )}
                  {row.evidence.map((file, imgIdx) => (
                    <figure key={file.key} className="mt-3 flex items-center gap-3">
                      <a href={file.url} target="_blank" rel="noreferrer">
                        <img
                          src={file.url}
                          alt={`Bukti ${imgIdx + 1}`}
                          className="h-16 w-24 rounded-lg object-cover border border-slate-200 shadow-sm"
                        />
                      </a>
                      <div className="text-xs text-slate-500">
                        <p>{Math.ceil(file.file.size / 1024)} KB</p>
                        <button
                          type="button"
                          onClick={() => {
                            revoke(file);
                            setRows(c => c.map(r => r.key === row.key ? { ...r, evidence: r.evidence.filter(e => e.key !== file.key) } : r));
                          }}
                          className="mt-1 text-rose-600 hover:underline"
                        >
                          Hapus gambar
                        </button>
                      </div>
                    </figure>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {processing && (
            <p role="status" className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 size={16} className="animate-spin text-emerald-600" /> Memproses gambar kompresi...
            </p>
          )}

          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Action Bar with Dual Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link href={GA_BASE_PATH} className={secondary}>
              Batal
            </Link>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={busy || processing}
                onClick={() => void handleSubmit(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <FileEdit size={16} /> Simpan Draft
              </button>

              <button
                type="submit"
                disabled={busy || processing}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {busy ? 'Menyimpan...' : 'Simpan & Siap Cetak'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </DashboardLayout>
  );
}
