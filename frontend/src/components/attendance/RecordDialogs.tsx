'use client';

import ModalShell from '@/components/ui/ModalShell';
import { useAttendance } from './AttendanceWorkspace';
import { FormDialog } from './shared';
import { dateLabel, durationLabel, statusLabels } from '@/lib/attendance/domain';
import type { AttendanceRecord, AttendanceStatus } from '@/lib/attendance/types';

export function CorrectionDialog({ record, onClose }: { record: AttendanceRecord; onClose: () => void }) {
  const { data, execute } = useAttendance();
  return <FormDialog title="Koreksi absensi" description={`${data.employees.find(e => e.id === record.employeeId)?.fullName} · ${dateLabel(record.workDate)}. Durasi berasal dari kolom file; edit scan tidak menghitung ulang durasi.`} onClose={onClose} fields={[
    { name: 'attendanceStatus', label: 'Status kehadiran', type: 'select', value: record.attendanceStatus, options: Object.entries(statusLabels).map(([value, label]) => ({ value, label })) },
    { name: 'scanIn', label: 'Scan masuk', type: 'time', value: record.scanIn ?? '' },
    { name: 'scanOut', label: 'Scan pulang', type: 'time', value: record.scanOut ?? '' },
    { name: 'lateMinutes', label: 'Keterlambatan (menit)', type: 'number', value: record.lateMinutes, required: true },
    { name: 'overtimeMinutes', label: 'Lembur (menit)', type: 'number', value: record.overtimeMinutes, required: true },
    { name: 'reason', label: 'Alasan / Catatan koreksi (opsional)', type: 'textarea', required: false },
  ]} onSubmit={async form => { await execute({ type: 'correct', recordId: record.id, expectedRevision: record.revision, reason: String(form.get('reason')), values: { attendanceStatus: String(form.get('attendanceStatus')) as AttendanceStatus, scanIn: String(form.get('scanIn')) || null, scanOut: String(form.get('scanOut')) || null, lateMinutes: Number(form.get('lateMinutes')), overtimeMinutes: Number(form.get('overtimeMinutes')) } }); }} />;
}
export function RecordDetails({ record, onClose }: { record: AttendanceRecord; onClose: () => void }) {
  const { data } = useAttendance();
  const revisions = data.revisions.filter(r => r.recordId === record.id).toReversed();
  return <ModalShell isOpen onClose={onClose} title="Detail & riwayat absensi" subtitle={`${dateLabel(record.workDate)} · revisi ${record.revision}`} maxWidthClass="max-w-2xl" footer={<button className="hr-btn" onClick={onClose}>Tutup</button>}>
    <div className="grid grid-cols-2 gap-4 text-xs">{[['Scan masuk sumber', record.rawScanIn ?? 'Tidak tersedia'], ['Scan pulang sumber', record.rawScanOut ?? 'Tidak tersedia'], ['Scan masuk efektif', record.scanIn ?? '—'], ['Scan pulang efektif', record.scanOut ?? '—'], ['Keterlambatan', durationLabel(record.lateMinutes)], ['Lembur', durationLabel(record.overtimeMinutes)]].map(([label, value]) => <div key={label}><p className="text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}</div>
    {record.normalized && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">Data Excel tidak lengkap, sudah dinormalisasi. Scan asli tetap dipertahankan.</p>}
    <h3 className="pt-2 text-sm font-semibold">Riwayat koreksi</h3>
    {revisions.length ? revisions.map(r => <article key={r.id} className="rounded-lg border border-slate-200 p-3 text-xs"><div className="flex justify-between gap-2"><strong>{r.actor}</strong><span className="text-slate-500">{new Date(r.createdAt).toLocaleString('id-ID')}</span></div><p className="my-2">{r.reason}</p><p className="text-slate-500">Terlambat: {r.before.lateMinutes} → {r.after.lateMinutes} menit · Lembur: {r.before.overtimeMinutes} → {r.after.overtimeMinutes} menit</p></article>) : <p className="text-xs text-slate-500">Belum ada koreksi. Catatan berasal dari data impor.</p>}
  </ModalShell>;
}
