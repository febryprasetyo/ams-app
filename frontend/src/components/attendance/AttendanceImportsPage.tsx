'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import ModalShell from '@/components/ui/ModalShell';
import { useAttendance } from './AttendanceWorkspace';
import { Heading, SearchInput, Pagination, Empty, FormDialog } from './shared';
import { parseAttendanceBiff } from '@/lib/attendance/biff';
import { computeFileHash } from '@/lib/attendance/hash';
import { dateLabel, durationLabel } from '@/lib/attendance/domain';
import type { ImportRow } from '@/lib/attendance/types';

const batchLabels = { DRAFT: 'Draft', COMMITTED: 'Tersimpan', CANCELLED: 'Dibatalkan' };
const reviewLabels = { READY: 'Siap disimpan', NEEDS_REVIEW: 'Perlu review', BLOCKED: 'Terblokir', SKIPPED: 'Dilewati' };
function UploadDialog({ onClose }: { onClose: () => void }) {
  const { data, execute } = useAttendance(); const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!file) { setError('Pilih file Excel dari mesin absensi.'); return; }
    if (file.size > 20 * 1024 * 1024) { setError('Ukuran file maksimal 20 MiB.'); return; }
    setBusy(true); setError('');
    try {
      const buffer = await file.arrayBuffer();
      const fileHash = await computeFileHash(buffer);
      const rows = parseAttendanceBiff(new Uint8Array(buffer));
      const next = await execute({ type: 'import', filename: file.name, fileHash, rows });
      onClose(); router.push(`/dashboard/attendance/imports/${next.batches.at(-1)!.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : 'File gagal dibaca.'); }
    finally { setBusy(false); }
  };
  return <ModalShell isOpen onClose={onClose} title="Impor file absensi" subtitle="Format Excel BIFF mesin absensi, sesuai asd.xls." isLoading={busy} footer={<><button className="hr-btn" onClick={onClose} disabled={busy}>Batal</button><button className="hr-btn-primary" disabled={busy || !file} onClick={submit}>{busy ? 'Membaca file…' : 'Unggah & review'}</button></>}>
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center"><FileSpreadsheet className="mx-auto mb-3 text-red-600" size={28} /><p className="text-sm font-semibold">{file?.name ?? 'Pilih file .xls dari mesin absensi'}</p><p className="mb-4 mt-2 text-xs text-slate-500">Maksimal 20 MiB · 50.000 baris</p><input ref={fileRef} className="sr-only" type="file" accept=".xls" aria-label="File Excel absensi" onChange={e => { setFile(e.target.files?.[0] ?? null); setError(''); }} /><button className="hr-btn" disabled={busy} onClick={() => fileRef.current?.click()}>Pilih file Excel</button></div>
    <div className="flex items-center justify-between text-xs text-slate-500 pt-1"><span>Contoh format acuan:</span><a href="/mock/attendance-sample.xls" download="contoh-absensi-asd.xls" className="text-red-600 hover:underline font-medium inline-flex items-center gap-1"><Download size={13} />Unduh contoh data Excel (.xls)</a></div>
    <p className="text-xs leading-5 text-slate-600">Kolom wajib: No. ID, Nama, Tanggal, Terlambat, Plg. Cepat, dan Lembur. Jadwal serta scan dibaca dari kolom Jam Masuk/Pulang dan Scan Masuk/Pulang. File XLSX atau Excel dengan struktur lain akan ditolak.</p>
    <p className="text-xs leading-5 text-slate-600">Data belum masuk rekap sampai review selesai dan disimpan. Nomor mesin baru harus dipetakan ke master karyawan.</p>
    {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700" role="alert">{error}</p>}
  </ModalShell>;
}
export default function AttendanceImportsPage({ batchId }: { batchId?: number }) {
  const { data, execute, canWrite, canReview } = useAttendance();
  const [uploadOpen, setUploadOpen] = useState(false), [q, setQ] = useState(''), [page, setPage] = useState(1);
  const [review, setReview] = useState<ImportRow | null>(null), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  const [action, setAction] = useState<'commit' | 'cancel' | 'reopen' | null>(null);
  const [reviewStatus, setReviewStatus] = useState('all');
  const batch = data.batches.find(b => b.id === batchId);
  const rows = batch?.rows.filter(r => `${r.externalNoId} ${r.employeeName ?? ''} ${data.employees.find(e => e.id === r.employeeId)?.fullName ?? ''}`.toLowerCase().includes(q.toLowerCase()) && (reviewStatus === 'all' || r.reviewStatus === reviewStatus)) ?? [];
  const batches = data.batches.filter(b => b.filename.toLowerCase().includes(q.toLowerCase())).toReversed();
  const total = batchId ? rows.length : batches.length;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(total / 10)));
  const currentRows = rows.slice((currentPage - 1) * 10, currentPage * 10);
  const blocking = batch?.rows.some(r => ['BLOCKED', 'NEEDS_REVIEW'].includes(r.reviewStatus));
  const perform = async () => {
    if (!batch || !action) return;
    setBusy(true); setError('');
    try { await execute({ type: 'batch', batchId: batch.id, action }); setAction(null); setNotice(action === 'commit' ? 'Absensi tersimpan. Rekap sudah diperbarui.' : action === 'cancel' ? 'Draft dibatalkan.' : 'Draft dibuka kembali untuk review.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Aksi gagal.'); }
    finally { setBusy(false); }
  };
  if (batchId && !batch) return <div className="hr-panel"><Empty text="Batch impor tidak ditemukan." /><Link className="hr-btn m-4" href="/dashboard/attendance/imports">Kembali ke daftar impor</Link></div>;
  return <div className="space-y-6"><Heading title={batch ? 'Review Impor Absensi' : 'Impor Absensi'} description={batch ? `${batch.filename} · ${batchLabels[batch.status]} · ${batch.rows.length} baris` : 'Unggah file mesin, periksa identitas dan anomali, lalu simpan ke data absensi.'}>
    {batch ? <><Link className="hr-btn" href="/dashboard/attendance/imports">Semua impor</Link>{canWrite && batch.status === 'DRAFT' && <><button className="hr-btn" onClick={() => { setAction('cancel'); setError(''); }}>Batalkan draft</button><button className="hr-btn-primary" disabled={blocking || batch.rows.every(r => r.reviewStatus === 'SKIPPED')} onClick={() => { setAction('commit'); setError(''); }}><CheckCircle2 size={15} />Simpan absensi</button></>}{canWrite && batch.status === 'CANCELLED' && <button className="hr-btn" onClick={() => { setAction('reopen'); setError(''); }}>Buka ulang draft</button>}</> : canReview && <button className="hr-btn-primary" onClick={() => setUploadOpen(true)}><Upload size={15} />Impor Excel</button>}
  </Heading>
  {notice && <p className="hr-notice" role="status">{notice}</p>}
  {batch && <><div className="hr-panel grid grid-cols-2 divide-x divide-slate-200 sm:grid-cols-4">{Object.entries(reviewLabels).map(([key, label]) => <button key={key} className={`p-4 text-left hover:bg-slate-50 ${reviewStatus === key ? 'bg-red-50' : ''}`} onClick={() => { setReviewStatus(reviewStatus === key ? 'all' : key); setPage(1); }}><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold">{batch.rows.filter(r => r.reviewStatus === key).length}</p></button>)}</div>{blocking && batch.status === 'DRAFT' && <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><AlertCircle size={16} className="mt-0.5 shrink-0" /><p>Periksa baris bermasalah. Pastikan No. ID atau nama karyawan sudah terdaftar di Master Data Karyawan. Untuk konflik tanggal ganda, lewati baris yang tidak digunakan.</p></div>}</>}
  <div className="flex flex-wrap items-center justify-between gap-4">
    <SearchInput value={q} onChange={v => { setQ(v); setPage(1); }} placeholder={batch ? "Cari nomor mesin atau karyawan" : "Cari nama file impor"} />
    <span className="text-xs font-medium text-slate-500">{total} {batch ? "baris data" : "file impor"}</span>
  </div>
  <div className="hr-panel"><div className="hr-table-wrap"><table className="hr-table"><thead><tr>{(batch ? ['Baris / No. ID', 'Karyawan', 'Tanggal', 'Scan sumber', 'Scan efektif', 'Terlambat', 'Lembur', 'Review', 'Aksi'] : ['File', 'Diunggah', 'Baris', 'Status', 'Aksi']).map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{batch ? currentRows.map(r => <tr key={r.id}><td><p className="font-medium">{r.externalNoId}</p><p className="mt-1 text-slate-500">Baris {r.id}</p></td><td>{data.employees.find(e => e.id === r.employeeId)?.fullName ?? r.employeeName ?? 'Belum dipetakan'}</td><td>{dateLabel(r.workDate)}</td><td>{r.rawScanIn === undefined ? r.scanIn ?? '—' : r.rawScanIn ?? '—'} / {r.rawScanOut === undefined ? r.scanOut ?? '—' : r.rawScanOut ?? '—'}</td><td>{r.scanIn ?? '—'} / {r.scanOut ?? '—'}</td><td>{durationLabel(r.lateMinutes)}</td><td>{durationLabel(r.overtimeMinutes)}</td><td className="max-w-72 !whitespace-normal"><span className={r.reviewStatus === 'READY' ? 'font-medium text-emerald-700' : r.reviewStatus === 'SKIPPED' ? 'text-slate-500' : 'font-medium text-red-700'}>{reviewLabels[r.reviewStatus]}</span><p className={`mt-1 text-[10px] leading-4 ${r.normalized ? 'text-red-700' : 'text-slate-500'}`}>{r.note}</p></td><td>{batch.status === 'DRAFT' && canReview ? <button className="hr-btn" onClick={() => setReview(r)}>Tinjau</button> : <span className="text-slate-400">Hanya baca</span>}</td></tr>) : batches.slice((currentPage - 1) * 10, currentPage * 10).map(b => <tr key={b.id}><td><div className="flex items-center gap-3"><FileSpreadsheet className="text-red-600" size={20} /><Link className="font-semibold hover:underline" href={`/dashboard/attendance/imports/${b.id}`}>{b.filename}</Link></div></td><td>{new Date(b.createdAt).toLocaleString('id-ID')}</td><td>{b.rows.length}</td><td><span className={b.status === 'COMMITTED' ? 'text-emerald-700' : b.status === 'DRAFT' ? 'text-amber-800' : 'text-slate-500'}>{batchLabels[b.status]}</span></td><td><Link className="hr-btn" href={`/dashboard/attendance/imports/${b.id}`}>{b.status === 'DRAFT' ? 'Review' : 'Lihat detail'}</Link></td></tr>)}</tbody></table></div>{!total && <Empty />}<Pagination total={total} page={currentPage} onChange={setPage} /></div>
  {review && batch && (
    <FormDialog
      title={`Review baris ${review.id}`}
      description={`${review.externalNoId} · ${dateLabel(review.workDate)} · ${review.note}`}
      fields={[
        {
          name: 'decision',
          label: 'Keputusan baris',
          type: 'select',
          value: review.reviewStatus === 'SKIPPED' ? 'skip' : 'use',
          options: [
            { value: 'use', label: 'Gunakan baris ini' },
            { value: 'skip', label: 'Lewati baris ini' },
          ],
        },
        {
          name: 'employeeId',
          label: 'Pemetaan Karyawan',
          type: 'select',
          value: review.employeeId ?? '',
          options: [
            { value: '', label: '— Pilih Karyawan —' },
            ...data.employees.map(e => ({
              value: e.id,
              label: `${e.employeeCode ? `${e.employeeCode} - ` : ''}${e.fullName}`,
            })),
          ],
          hint: 'Pilih karyawan jika baris belum terpetakan otomatis atau ingin dialihkan.',
        },
        {
          name: 'scanIn',
          label: 'Jam Masuk',
          type: 'time',
          value: review.scanIn ?? '',
          hint: 'Pilih jam masuk menggunakan time picker (HH:mm)',
        },
        {
          name: 'scanOut',
          label: 'Jam Pulang',
          type: 'time',
          value: review.scanOut ?? '',
          hint: 'Pilih jam pulang menggunakan time picker (HH:mm)',
        },
        {
          name: 'lateMinutes',
          label: 'Durasi Terlambat (menit)',
          type: 'number',
          value: review.lateMinutes ?? 0,
          hint: 'Durasi keterlambatan dalam menit (0 jika tepat waktu)',
        },
        {
          name: 'overtimeMinutes',
          label: 'Durasi Lembur (menit)',
          type: 'number',
          value: review.overtimeMinutes ?? 0,
          hint: 'Durasi lembur dalam menit (0 jika tidak ada lembur)',
        },
        {
          name: 'reason',
          label: 'Catatan review / alasan perubahan',
          type: 'textarea',
          value: review.note || 'Review manual data absensi',
          required: true,
        },
      ]}
      onClose={() => setReview(null)}
      onSubmit={async f => {
        const decision = String(f.get('decision') || 'use');
        const rawEmployeeId = f.get('employeeId');
        const empId = rawEmployeeId && String(rawEmployeeId).trim() ? Number(rawEmployeeId) : review.employeeId;
        const rawScanIn = f.get('scanIn');
        const rawScanOut = f.get('scanOut');
        const rawLate = f.get('lateMinutes');
        const rawOvertime = f.get('overtimeMinutes');

        const scanIn = rawScanIn !== null ? String(rawScanIn).trim() || null : review.scanIn;
        const scanOut = rawScanOut !== null ? String(rawScanOut).trim() || null : review.scanOut;
        const lateMinutes = rawLate !== null && String(rawLate).trim() !== '' ? Number(rawLate) : (review.lateMinutes ?? 0);
        const overtimeMinutes = rawOvertime !== null && String(rawOvertime).trim() !== '' ? Number(rawOvertime) : (review.overtimeMinutes ?? 0);

        await execute({
          type: 'review',
          batchId: batch.id,
          rowId: review.id,
          employeeId: empId,
          skipped: decision === 'skip',
          reason: String(f.get('reason') || '').trim(),
          values: {
            scanIn,
            scanOut,
            lateMinutes,
            overtimeMinutes,
          },
        });
      }}
    />
  )}
  {uploadOpen && <UploadDialog onClose={() => setUploadOpen(false)} />}
  <ModalShell isOpen={!!action} onClose={() => setAction(null)} title={action === 'commit' ? 'Simpan hasil review?' : action === 'cancel' ? 'Batalkan draft?' : 'Buka ulang draft?'} isLoading={busy} footer={<><button className="hr-btn" disabled={busy} onClick={() => setAction(null)}>Kembali</button><button className="hr-btn-primary" disabled={busy} onClick={perform}>{busy ? 'Memproses…' : 'Konfirmasi'}</button></>}><p className="text-sm text-slate-600">{action === 'commit' ? 'Hanya baris siap disimpan yang menjadi catatan final. Baris dilewati tetap tersimpan sebagai bukti. Tanggal terkunci dan duplikasi diperiksa kembali.' : 'Riwayat dan data sumber tetap dipertahankan.'}</p>{error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}</ModalShell>
  </div>;
}
