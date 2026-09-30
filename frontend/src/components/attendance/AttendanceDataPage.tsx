'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, Filter, HelpCircle, LockKeyhole, UnlockKeyhole, Upload, ChevronDown } from 'lucide-react';
import ModalShell from '@/components/ui/ModalShell';
import { useAttendance } from './AttendanceWorkspace';
import { Heading, SearchInput, EmployeeName, Status, Pagination, FormDialog, Empty } from './shared';
import { CorrectionDialog, RecordDetails } from './RecordDialogs';
import { dateLabel, durationLabel, filterEmployees, filterRecords, reportCsv, summarizeEmployees, downloadText } from '@/lib/attendance/domain';
import type { AttendanceRecord } from '@/lib/attendance/types';

export default function AttendanceDataPage() {
  const { data, execute, canWrite } = useAttendance();
  const [date, setDate] = useState(data.meta.defaultDate);
  const [q, setQ] = useState(''); const [departmentId, setDepartment] = useState(0); const [locationId, setLocation] = useState(0);
  const [condition, setCondition] = useState('all'); const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1); const [selected, setSelected] = useState<number[]>([]);
  const [correcting, setCorrecting] = useState<AttendanceRecord | null>(null); const [detail, setDetail] = useState<AttendanceRecord | null>(null);
  const [lockOpen, setLockOpen] = useState(false); const [helpOpen, setHelpOpen] = useState(false);
  const locked = data.locks.some(l => l.workDate === date);
  const filter = { startDate: date, endDate: date, q, departmentId, locationId };
  const records = date ? filterRecords(data, filter) : [];
  const lookup = new Map(records.map(r => [r.employeeId, r]));
  const metrics: { key: string; label: string; test: (r: AttendanceRecord) => boolean }[] = [
    { key: 'ontime', label: 'Tepat waktu', test: r => r.attendanceStatus === 'PRESENT' && r.lateMinutes === 0 },
    { key: 'late', label: 'Terlambat', test: r => r.lateMinutes > 0 },
    { key: 'early', label: 'Pulang awal', test: r => r.earlyMinutes > 0 },
    { key: 'noout', label: 'Scan pulang kosong', test: r => r.attendanceStatus === 'PRESENT' && !r.rawScanOut },
    { key: 'noin', label: 'Scan masuk kosong', test: r => r.attendanceStatus === 'PRESENT' && !r.rawScanIn },
    { key: 'normalized', label: 'Dinormalisasi', test: r => r.normalized },
    { key: 'absent', label: 'Tidak hadir', test: r => r.attendanceStatus === 'ALPHA' },
    { key: 'off', label: 'Libur', test: r => r.isDayOff },
    { key: 'leave', label: 'Izin / sakit / cuti', test: r => ['IZIN', 'SAKIT', 'CUTI'].includes(r.attendanceStatus) },
  ];
  const activeMetric = metrics.find(m => m.key === condition);
  const employees = filterEmployees(data, filter).filter(e => !activeMetric || (lookup.has(e.id) && activeMetric.test(lookup.get(e.id)!)));
  const actualPage = Math.min(page, Math.max(1, Math.ceil(employees.length / 10)));
  const visible = employees.slice((actualPage - 1) * 10, actualPage * 10);
  const resetPage = () => { setPage(1); setSelected([]); };
  const exportRows = () => { const ids = new Set((selected.length ? employees.filter(e => selected.includes(e.id)) : employees).map(e => e.id)); downloadText(reportCsv(summarizeEmployees(data, filter).filter(r => ids.has(r.employee.id)), filter), `absensi-${date}.csv`); };
  return <div className="space-y-6">
    <Heading title="Data Absensi" description="Jadwal, catatan kehadiran, dan durasi kerja dalam satu tampilan.">
      <button className="hr-btn" onClick={() => setHelpOpen(true)}><HelpCircle size={15} />Panduan</button>
      <Link className="hr-btn" href="/dashboard/attendance/imports"><Upload size={15} />Impor absensi</Link>
      {canWrite && <button className={locked ? 'hr-btn' : 'hr-btn-primary'} disabled={!date} onClick={() => setLockOpen(true)}>{locked ? <UnlockKeyhole size={15} /> : <LockKeyhole size={15} />}{locked ? 'Buka kunci' : 'Kunci data'}</button>}
    </Heading>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2"><label><span className="sr-only">Tanggal absensi</span><input className="hr-input" type="date" value={date} onChange={e => { setDate(e.target.value); resetPage(); }} /></label><button className="hr-btn" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(v => !v)}><Filter size={14} />Semua filter{departmentId || locationId ? ' •' : ''}</button>{condition !== 'all' && <button className="hr-btn" onClick={() => { setCondition('all'); resetPage(); }}>Hapus filter status</button>}</div>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto"><SearchInput value={q} onChange={v => { setQ(v); resetPage(); }} /><button className="hr-btn" disabled={!date || !employees.length} onClick={exportRows}><Download size={15} />{selected.length ? `Ekspor ${selected.length} pilihan` : 'Ekspor'}</button></div>
    </div>
    {filtersOpen && (
      <div className="hr-panel grid gap-4 p-5 sm:grid-cols-2 bg-slate-50/50">
        <label className="space-y-1.5 text-xs font-medium text-slate-700">
          <span>Departemen</span>
          <select className="hr-input" value={departmentId} onChange={e => { setDepartment(Number(e.target.value)); resetPage(); }}>
            <option value={0}>Semua departemen</option>
            {data.departments.map(d => <option value={d.id} key={d.id}>{d.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-slate-700">
          <span>Lokasi</span>
          <select className="hr-input" value={locationId} onChange={e => { setLocation(Number(e.target.value)); resetPage(); }}>
            <option value={0}>Semua lokasi</option>
            {data.locations.map(l => <option value={l.id} key={l.id}>{l.name}</option>)}
          </select>
        </label>
      </div>
    )}
    <div className="hr-panel overflow-x-auto"><div className="grid min-w-[1050px] grid-cols-9 divide-x divide-slate-200">{metrics.map(m => <button key={m.key} aria-pressed={condition === m.key} onClick={() => { setCondition(condition === m.key ? 'all' : m.key); resetPage(); }} className={`px-4 py-5 text-left hover:bg-red-50 ${condition === m.key ? 'bg-red-50 ring-1 ring-inset ring-red-300' : ''}`}><span className="block text-lg font-bold tabular-nums text-red-700">{records.filter(m.test).length}</span><span className="mt-1 block text-[10px] leading-4 text-slate-600">{m.label}</span></button>)}</div></div>
    <div className="flex flex-wrap justify-between gap-2 text-[11px] text-slate-500"><p>{date ? dateLabel(date) : 'Pilih tanggal'} · {records.length} catatan final. Satu catatan bisa masuk beberapa indikator.</p>{locked && <span className="flex items-center gap-1 font-medium text-amber-800"><LockKeyhole size={13} />Tanggal ini dikunci</span>}</div>
    <div className="hr-panel"><div className="hr-table-wrap"><table className="hr-table"><thead><tr><th className="hr-employee-cell"><div className="flex items-center gap-3"><input type="checkbox" aria-label="Pilih semua karyawan di halaman" checked={visible.length > 0 && visible.every(e => selected.includes(e.id))} onChange={e => setSelected(e.target.checked ? [...new Set([...selected, ...visible.map(e => e.id)])] : selected.filter(id => !visible.some(e => e.id === id)))} /><span>Karyawan</span></div></th>{['Tanggal', 'Shift', 'Jadwal masuk', 'Jadwal pulang', 'Scan masuk', 'Scan pulang', 'Kehadiran', 'Lembur', 'Aksi'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{visible.map(employee => {
      const r = lookup.get(employee.id); const dept = data.departments.find(d => d.id === employee.departmentId)?.name;
      return <tr key={employee.id}><td className="hr-employee-cell"><div className="flex items-center gap-3"><input type="checkbox" aria-label={`Pilih ${employee.fullName}`} checked={selected.includes(employee.id)} onChange={e => setSelected(e.target.checked ? [...selected, employee.id] : selected.filter(id => id !== employee.id))} /><EmployeeName employee={employee} detail={dept} /></div></td><td>{date ? dateLabel(date) : '—'}</td><td>{r?.shift ?? '—'}</td><td className="text-slate-500">{r?.scheduleIn ?? '—'}</td><td className="text-slate-500">{r?.scheduleOut ?? '—'}</td><td className={r?.lateMinutes ? 'font-semibold text-red-700' : 'text-emerald-700'}>{r?.scanIn ?? '—'}{r?.normalized && !r.rawScanIn && <span className="ml-1 text-red-700" title="Scan sumber kosong, dinormalisasi">*</span>}</td><td className={r?.earlyMinutes ? 'text-red-700' : ''}>{r?.scanOut ?? '—'}{r?.normalized && !r.rawScanOut && <span className="ml-1 text-red-700" title="Scan sumber kosong, dinormalisasi">*</span>}</td><td>{r ? <Status status={r.attendanceStatus} dayOff={r.isDayOff} /> : <span className="text-slate-500">Belum ada data</span>}</td><td>{r ? durationLabel(r.overtimeMinutes) : '—'}</td><td>{r ? <details><summary className="hr-btn list-none">Aksi<ChevronDown size={13} /></summary><div className="mt-2 flex flex-col gap-1"><button className="hr-btn" onClick={() => setDetail(r)}>Detail & riwayat</button>{canWrite && <button className="hr-btn" disabled={locked} onClick={() => setCorrecting(r)}>Koreksi</button>}</div></details> : <Link className="hr-btn" href={`/dashboard/attendance/employees/${employee.id}`}>Lihat kartu</Link>}</td></tr>;
    })}</tbody></table></div>{!employees.length && <Empty />}<Pagination total={employees.length} page={actualPage} onChange={setPage} /></div>
    <p className="text-[11px] text-slate-500"><span className="text-red-700">*</span> Data Excel tidak lengkap, sudah dinormalisasi. Ketidakhadiran tidak disimpulkan dari scan kosong.</p>
    {correcting && <CorrectionDialog record={correcting} onClose={() => setCorrecting(null)} />}{detail && <RecordDetails record={detail} onClose={() => setDetail(null)} />}
    {lockOpen && <FormDialog title={locked ? 'Buka kunci data' : 'Kunci data absensi'} description={`${dateLabel(date)} · Berlaku untuk seluruh karyawan pada tanggal ini. Koreksi dan penyimpanan impor akan ditolak selama terkunci.`} fields={[{ name: 'reason', label: 'Alasan', type: 'textarea', required: true }]} onClose={() => setLockOpen(false)} onSubmit={async f => { await execute({ type: 'lock', workDate: date, locked: !locked, reason: String(f.get('reason')) }); }} submitLabel={locked ? 'Buka kunci' : 'Kunci data'} />}
    <ModalShell isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="Membaca data absensi" footer={<button className="hr-btn" onClick={() => setHelpOpen(false)}>Tutup panduan</button>}><div className="space-y-3 text-sm leading-6 text-slate-600"><p>Pilih tanggal, lalu klik indikator untuk menampilkan catatan yang sesuai. Cari berdasarkan nama atau ID karyawan.</p><p>Data awal berasal dari {data.meta.sourceFile ?? 'file sumber'} ({data.meta.sourceRows ?? data.records.length} baris). Jadwal dan durasi mengikuti isi file mesin.</p><p>Impor menerima file .xls BIFF dengan kolom No. ID, Nama, Tanggal, Terlambat, Plg. Cepat, dan Lembur. Pemetaan, normalisasi dan konflik diperiksa sebelum disimpan.</p><p>Koreksi membutuhkan alasan. Rekap hanya menghitung catatan final dan tidak menghitung nominal potongan atau upah lembur.</p></div></ModalShell>
  </div>;
}
