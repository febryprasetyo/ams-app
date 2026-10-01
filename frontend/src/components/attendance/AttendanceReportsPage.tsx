'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { useAttendance } from './AttendanceWorkspace';
import { Heading, SearchInput, EmployeeName, Pagination, Empty, Totals, Status } from './shared';
import { CorrectionDialog, RecordDetails } from './RecordDialogs';
import { dateLabel, durationLabel, summarizeEmployees, filterRecords, validatePeriod, getDefaultAttendancePeriod, sortRecordsDescending } from '@/lib/attendance/domain';
import { exportAttendanceReportToExcel } from '@/lib/attendance/excelExport';
import type { AttendanceRecord } from '@/lib/attendance/types';

export default function AttendanceReportsPage({ employeeId }: { employeeId?: number }) {
  const { data, canWrite } = useAttendance();
  const defaultPeriod = useMemo(() => getDefaultAttendancePeriod(data, employeeId), [data, employeeId]);
  const [startDate, setStart] = useState(defaultPeriod.startDate);
  const [endDate, setEnd] = useState(defaultPeriod.endDate);
  const [q, setQ] = useState(''), [departmentId, setDepartment] = useState(0), [page, setPage] = useState(1);

  useEffect(() => {
    setStart(defaultPeriod.startDate);
    setEnd(defaultPeriod.endDate);
    setPage(1);
  }, [employeeId, defaultPeriod.startDate, defaultPeriod.endDate]);
  const [correcting, setCorrecting] = useState<AttendanceRecord | null>(null), [detail, setDetail] = useState<AttendanceRecord | null>(null);
  const anonymous = data.meta.role === 'REPORT_VIEWER';
  const employee = data.employees.find(e => e.id === employeeId);
  let error = ''; try { validatePeriod(startDate, endDate); } catch (err) { error = err instanceof Error ? err.message : 'Periode tidak valid.'; }
  const filter = { startDate, endDate, q: anonymous ? '' : q, departmentId: anonymous ? 0 : departmentId, employeeId };
  const reports = error ? [] : summarizeEmployees(data, filter);
  const records = error || !employeeId ? [] : sortRecordsDescending(filterRecords(data, filter));
  const count = employeeId ? records.length : reports.length;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(count / 10)));
  const from = (currentPage - 1) * 10;
  if (employeeId && !employee) return <div className="hr-panel"><Empty text="Karyawan absensi tidak ditemukan." /><Link className="hr-btn m-4" href="/dashboard/attendance/employees">Kembali ke kartu absensi</Link></div>;
  return <div className="space-y-6">
    <Heading title={employee ? employee.fullName : 'Laporan Absensi'} description={employee ? `${employee.employeeCode || 'Tanpa kode'} · ${data.departments.find(d => d.id === employee.departmentId)?.name ?? 'Tanpa departemen'} · Kartu harian dan riwayat koreksi.` : 'Rekap keterlambatan dan lembur berdasarkan catatan final pada periode yang dipilih.'}>
      {employee && <Link className="hr-btn" href="/dashboard/attendance/employees">Semua karyawan</Link>}
      <button className="hr-btn-primary" disabled={!!error || !reports.length} onClick={() => {
        exportAttendanceReportToExcel(reports, filter, {
          anonymous,
          departmentLookup: id => data.departments.find(d => d.id === id)?.name,
          dailyRecords: employee ? records : undefined,
          filename: employee
            ? `rekap-absensi-${employee.employeeCode || employee.id}-${startDate}-${endDate}.xlsx`
            : `rekap-absensi-payroll-${startDate}-${endDate}.xlsx`,
        });
      }}><Download size={15} />Ekspor Excel (.xlsx)</button>
    </Heading>
    <div className="hr-panel flex flex-wrap items-end gap-4 p-5">
      <label className="space-y-1.5 text-xs font-medium text-slate-700 w-44">
        <span>Dari tanggal</span>
        <input className="hr-input" type="date" value={startDate} onChange={e => { setStart(e.target.value); setPage(1); }} />
      </label>
      <label className="space-y-1.5 text-xs font-medium text-slate-700 w-44">
        <span>Sampai tanggal</span>
        <input className="hr-input" type="date" value={endDate} onChange={e => { setEnd(e.target.value); setPage(1); }} />
      </label>
      {!employee && !anonymous && (
        <>
          <label className="space-y-1.5 text-xs font-medium text-slate-700 min-w-48">
            <span>Departemen</span>
            <select className="hr-input" value={departmentId} onChange={e => { setDepartment(Number(e.target.value)); setPage(1); }}>
              <option value={0}>Semua departemen</option>
              {data.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <div className="ml-auto w-full sm:w-72">
            <SearchInput value={q} onChange={v => { setQ(v); setPage(1); }} />
          </div>
        </>
      )}
    </div>
    {error ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p> : <>
      <Totals late={reports.reduce((n, r) => n + r.lateMinutes, 0)} overtime={reports.reduce((n, r) => n + r.overtimeMinutes, 0)} count={reports.reduce((n, r) => n + r.recordCount, 0)} />
      <p className="text-xs text-slate-500">{dateLabel(startDate)} – {dateLabel(endDate)} · Total mencakup seluruh hasil filter. Durasi ditampilkan dalam jam dan menit.</p>
      {anonymous ? <div className="hr-panel p-6 text-sm text-slate-600">Ringkasan agregat tanpa identitas karyawan. Ekspor mengikuti cakupan ringkasan ini.</div> : <div className="hr-panel"><div className="hr-table-wrap"><table className="hr-table"><thead><tr>{(employee ? ['Tanggal', 'Jadwal', 'Scan masuk', 'Scan pulang', 'Kehadiran', 'Keterlambatan', 'Lembur', 'Aksi'] : ['Karyawan', 'Departemen', 'Catatan final', 'Total keterlambatan', 'Total lembur', 'Detail']).map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{employee ? records.slice(from, from + 10).map(r => <tr key={r.id}><td>{dateLabel(r.workDate)}{r.normalized && <p className="mt-1 text-[10px] text-red-700">Dinormalisasi</p>}</td><td>{r.scheduleIn ?? '—'} – {r.scheduleOut ?? '—'}</td><td>{r.scanIn ?? '—'}</td><td>{r.scanOut ?? '—'}</td><td><Status status={r.attendanceStatus} dayOff={r.isDayOff} /></td><td className={r.lateMinutes ? 'text-red-700' : ''}>{durationLabel(r.lateMinutes)}</td><td>{durationLabel(r.overtimeMinutes)}</td><td><div className="flex gap-2"><button className="hr-btn" onClick={() => setDetail(r)}>Riwayat</button>{canWrite && <button className="hr-btn" disabled={data.locks.some(l => l.workDate === r.workDate)} onClick={() => setCorrecting(r)}>Koreksi</button>}</div></td></tr>) : reports.slice(from, from + 10).map(r => <tr key={r.employee.id}><td><EmployeeName employee={r.employee} /></td><td>{data.departments.find(d => d.id === r.employee.departmentId)?.name ?? '—'}</td><td>{r.recordCount || <span className="text-slate-500">Belum ada data</span>}</td><td className={r.lateMinutes ? 'font-medium text-red-700' : ''}>{r.recordCount ? durationLabel(r.lateMinutes) : '—'}</td><td className="font-medium">{r.recordCount ? durationLabel(r.overtimeMinutes) : '—'}</td><td><Link className="hr-btn" href={`/dashboard/attendance/employees/${r.employee.id}`}>Lihat kartu</Link></td></tr>)}</tbody></table></div>{!count && <Empty />}<Pagination total={count} page={currentPage} onChange={setPage} /></div>}
      {employee && !records.length && <p className="text-xs text-slate-500">Belum ada catatan final pada periode ini. Kondisi ini tidak disimpulkan sebagai alpha.</p>}
    </>}
    {correcting && <CorrectionDialog record={correcting} onClose={() => setCorrecting(null)} />}{detail && <RecordDetails record={detail} onClose={() => setDetail(null)} />}
  </div>;
}
