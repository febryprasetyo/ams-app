'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Download, Calendar, Filter, Clock, CheckCircle2, AlertTriangle, AlertCircle, FileText, ChevronDown } from 'lucide-react';
import { useAttendance } from './AttendanceWorkspace';
import { Heading, SearchInput, EmployeeName, Pagination, Empty, Totals, Status } from './shared';
import { CorrectionDialog, RecordDetails } from './RecordDialogs';
import { RecordAttendanceDialog } from './RecordAttendanceDialog';
import {
  dateLabel,
  durationLabel,
  summarizeEmployees,
  filterRecords,
  validatePeriod,
  getDefaultAttendancePeriod,
  sortRecordsDescending,
} from '@/lib/attendance/domain';
import {
  getPayrollCyclePeriod,
  resolveEmployeeShift,
  generateFullCalendarGrid,
  MONTH_NAMES_ID,
  type WorkShift,
  type CalendarDayRow,
} from '@/lib/attendance/scheduleShift';
import { exportAttendanceReportToExcel } from '@/lib/attendance/excelExport';
import type { AttendanceRecord, Employee } from '@/lib/attendance/types';

export default function AttendanceReportsPage({ employeeId }: { employeeId?: number }) {
  const { data, canWrite } = useAttendance();
  const defaultPeriod = useMemo(() => getDefaultAttendancePeriod(data, employeeId), [data, employeeId]);

  // Payroll cycle list (generate surrounding months around defaultPeriod)
  const payrollMonths = useMemo(() => {
    const list: { label: string; year: number; month: number; startDate: string; endDate: string }[] = [];
    const baseDate = new Date(`${defaultPeriod.endDate || '2026-09-20'}T12:00:00Z`);
    const baseYear = baseDate.getUTCFullYear();
    const baseMonth = baseDate.getUTCMonth() + 1; // 1-12

    for (let offset = -4; offset <= 3; offset++) {
      let m = baseMonth + offset;
      let y = baseYear;
      while (m < 1) { m += 12; y -= 1; }
      while (m > 12) { m -= 12; y += 1; }
      const p = getPayrollCyclePeriod(y, m);
      list.push({
        label: `Periode ${p.label} (${dateLabel(p.startDate)} – ${dateLabel(p.endDate)})`,
        year: y,
        month: m,
        startDate: p.startDate,
        endDate: p.endDate,
      });
    }
    return list.reverse();
  }, [defaultPeriod.endDate]);

  const [selectedCycleIndex, setSelectedCycleIndex] = useState<number>(0);
  const [isCustomPeriod, setIsCustomPeriod] = useState(false);
  const [startDate, setStart] = useState(defaultPeriod.startDate);
  const [endDate, setEnd] = useState(defaultPeriod.endDate);
  const [q, setQ] = useState(''), [departmentId, setDepartment] = useState(0), [page, setPage] = useState(1);

  // Sync default period
  useEffect(() => {
    if (!isCustomPeriod && payrollMonths.length > 0) {
      // Find matching cycle
      const matchIdx = payrollMonths.findIndex(p => p.startDate === defaultPeriod.startDate && p.endDate === defaultPeriod.endDate);
      if (matchIdx !== -1) {
        setSelectedCycleIndex(matchIdx);
        setStart(payrollMonths[matchIdx].startDate);
        setEnd(payrollMonths[matchIdx].endDate);
      } else {
        setStart(defaultPeriod.startDate);
        setEnd(defaultPeriod.endDate);
      }
    }
    setPage(1);
  }, [employeeId, defaultPeriod.startDate, defaultPeriod.endDate, isCustomPeriod, payrollMonths]);

  const [correcting, setCorrecting] = useState<AttendanceRecord | null>(null);
  const [detail, setDetail] = useState<AttendanceRecord | null>(null);
  const [recordingTarget, setRecordingTarget] = useState<{ date: string; existingRecord?: AttendanceRecord | null } | null>(null);

  const anonymous = data.meta.role === 'REPORT_VIEWER';
  const employee = data.employees.find(e => e.id === employeeId);

  // Resolve employee shift
  const employeeShift: WorkShift = useMemo(() => {
    return resolveEmployeeShift(employee || {}, data.shifts, data.shiftAssignments);
  }, [employee, data.shifts, data.shiftAssignments]);

  let error = '';
  try {
    validatePeriod(startDate, endDate);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Periode tidak valid.';
  }

  const filter = { startDate, endDate, q: anonymous ? '' : q, departmentId: anonymous ? 0 : departmentId, employeeId };
  const reports = error ? [] : summarizeEmployees(data, filter);
  const records = error || !employeeId ? [] : sortRecordsDescending(filterRecords(data, filter));

  // Generate full calendar grid (e.g. 31 days) for employee view
  const calendarRows: CalendarDayRow[] = useMemo(() => {
    if (!employeeId || error) return [];
    // generate grid in chronological ascending order
    return generateFullCalendarGrid(startDate, endDate, employeeShift, records);
  }, [employeeId, error, startDate, endDate, employeeShift, records]);

  // Statistics for employee card header (Talenta style)
  const employeeKpis = useMemo(() => {
    if (!employeeId || calendarRows.length === 0) return null;
    let onTime = 0;
    let late = 0;
    let early = 0;
    let missing = 0;
    let sakit = 0;
    let izinCuti = 0;
    let alpha = 0;
    let dayOff = 0;
    let totalOvertimeMinutes = 0;

    for (const row of calendarRows) {
      if (row.isDayOff) {
        dayOff++;
      }
      if (row.record) {
        const r = row.record;
        if (r.attendanceStatus === 'PRESENT') {
          if (r.lateMinutes === 0) onTime++;
          else late++;
          if (r.earlyMinutes > 0) early++;
          if (!r.scanIn || !r.scanOut) missing++;
          totalOvertimeMinutes += (r.overtimeMinutes || 0);
        } else if (r.attendanceStatus === 'SAKIT') {
          sakit++;
        } else if (['IZIN', 'CUTI'].includes(r.attendanceStatus)) {
          izinCuti++;
        } else if (r.attendanceStatus === 'ALPHA') {
          alpha++;
        }
      } else if (!row.isDayOff) {
        // Unrecorded working day
        alpha++;
      }
    }

    return { onTime, late, early, missing, sakit, izinCuti, alpha, dayOff, totalOvertimeMinutes };
  }, [employeeId, calendarRows]);

  const count = employeeId ? calendarRows.length : reports.length;
  const pageSize = employeeId ? 31 : 10;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(count / pageSize)));
  const from = (currentPage - 1) * pageSize;

  if (employeeId && !employee) {
    return (
      <div className="hr-panel">
        <Empty text="Karyawan absensi tidak ditemukan." />
        <Link className="hr-btn m-4" href="/dashboard/attendance/employees">
          Kembali ke kartu absensi
        </Link>
      </div>
    );
  }

  const handleCycleChange = (idx: number) => {
    setSelectedCycleIndex(idx);
    const p = payrollMonths[idx];
    if (p) {
      setStart(p.startDate);
      setEnd(p.endDate);
      setPage(1);
    }
  };

  return (
    <div className="space-y-6">
      <Heading
        title={employee ? employee.fullName : 'Laporan Rekap Absensi'}
        description={
          employee
            ? `${employee.employeeCode || 'Tanpa kode'} · ${
                data.departments.find(d => d.id === employee.departmentId)?.name ?? 'Tanpa departemen'
              } · Shift: ${employeeShift.name} (${employeeShift.scheduleIn} - ${employeeShift.scheduleOut}, ${employeeShift.workDays} Hari).`
            : 'Rekap keterlambatan, lembur, dan kehadiran karyawan berdasarkan catatan final pada siklus payroll.'
        }
      >
        {employee && (
          <Link className="hr-btn" href="/dashboard/attendance/employees">
            Semua karyawan
          </Link>
        )}
        <button
          className="hr-btn-primary"
          disabled={!!error || (!employee ? !reports.length : !calendarRows.length)}
          onClick={() => {
            exportAttendanceReportToExcel(reports, filter, {
              anonymous,
              departmentLookup: id => data.departments.find(d => d.id === id)?.name,
              dailyRecords: employee ? records : undefined,
              filename: employee
                ? `rekap-absensi-${employee.employeeCode || employee.id}-${startDate}-${endDate}.xlsx`
                : `rekap-absensi-payroll-${startDate}-${endDate}.xlsx`,
            });
          }}
        >
          <Download size={15} />
          Ekspor Excel (.xlsx)
        </button>
      </Heading>

      {/* FILTER PERIODE SIKLUS PAYROLL */}
      <div className="hr-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-emerald-700" />
            <span className="text-xs font-bold text-slate-800">
              Periode Siklus Payroll (Cut-off 21 s.d. 20)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCustomPeriod(!isCustomPeriod)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
          >
            {isCustomPeriod ? '← Kembali ke Pilihan Siklus Payroll' : 'Gunakan Rentang Tanggal Kustom'}
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          {!isCustomPeriod ? (
            <label className="space-y-1.5 text-xs font-medium text-slate-700 w-full sm:w-96">
              <span>Pilih Bulan Siklus Payroll</span>
              <select
                aria-label="Pilih Bulan Siklus Payroll"
                className="hr-input cursor-pointer font-semibold"
                value={selectedCycleIndex}
                onChange={e => handleCycleChange(Number(e.target.value))}
              >
                {payrollMonths.map((p, idx) => (
                  <option key={`${p.year}-${p.month}`} value={idx}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="space-y-1.5 text-xs font-medium text-slate-700 w-44">
                <span>Dari tanggal</span>
                <input
                  className="hr-input"
                  type="date"
                  value={startDate}
                  onChange={e => { setStart(e.target.value); setPage(1); }}
                />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-slate-700 w-44">
                <span>Sampai tanggal</span>
                <input
                  className="hr-input"
                  type="date"
                  value={endDate}
                  onChange={e => { setEnd(e.target.value); setPage(1); }}
                />
              </label>
            </>
          )}

          {!employee && !anonymous && (
            <>
              <label className="space-y-1.5 text-xs font-medium text-slate-700 min-w-48">
                <span>Departemen</span>
                <select
                  aria-label="Filter Departemen"
                  className="hr-input"
                  value={departmentId}
                  onChange={e => { setDepartment(Number(e.target.value)); setPage(1); }}
                >
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
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>
      ) : (
        <>
          {/* STATS HEADER: Talenta Style for Individual Employee */}
          {employee && employeeKpis && (
            <div className="hr-panel p-4.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ringkasan Absensi Periode Ini ({dateLabel(startDate)} – {dateLabel(endDate)})
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  Total {calendarRows.length} Hari Kalender
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                  <span className="text-[11px] font-bold text-emerald-800 block">Tepat Waktu</span>
                  <span className="text-lg font-extrabold text-emerald-900 tabular-nums">{employeeKpis.onTime}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                  <span className="text-[11px] font-bold text-amber-800 block">Terlambat</span>
                  <span className="text-lg font-extrabold text-amber-900 tabular-nums">{employeeKpis.late}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200/80">
                  <span className="text-[11px] font-bold text-orange-800 block">Pulang Awal</span>
                  <span className="text-lg font-extrabold text-orange-900 tabular-nums">{employeeKpis.early}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80">
                  <span className="text-[11px] font-bold text-rose-800 block">Scan Hilang</span>
                  <span className="text-lg font-extrabold text-rose-900 tabular-nums">{employeeKpis.missing}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-yellow-50/70 border border-yellow-200/80">
                  <span className="text-[11px] font-bold text-yellow-800 block">Sakit (S)</span>
                  <span className="text-lg font-extrabold text-yellow-900 tabular-nums">{employeeKpis.sakit}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
                  <span className="text-[11px] font-bold text-indigo-800 block">Cuti / Izin</span>
                  <span className="text-lg font-extrabold text-indigo-900 tabular-nums">{employeeKpis.izinCuti}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 block">Libur (Day Off)</span>
                  <span className="text-lg font-extrabold text-slate-800 tabular-nums">{employeeKpis.dayOff}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80">
                  <span className="text-[11px] font-bold text-blue-800 block">Total Lembur</span>
                  <span className="text-xs font-bold text-blue-900 tabular-nums block mt-1">
                    {durationLabel(employeeKpis.totalOvertimeMinutes)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!employee && (
            <Totals
              late={reports.reduce((n, r) => n + r.lateMinutes, 0)}
              overtime={reports.reduce((n, r) => n + r.overtimeMinutes, 0)}
              count={reports.reduce((n, r) => n + r.recordCount, 0)}
            />
          )}

          {anonymous ? (
            <div className="hr-panel p-6 text-sm text-slate-600">
              Ringkasan agregat tanpa identitas karyawan. Ekspor mengikuti cakupan ringkasan ini.
            </div>
          ) : (
            <div className="hr-panel">
              <div className="hr-table-wrap">
                <table className="hr-table">
                  <thead>
                    <tr>
                      {employee
                        ? ['Tanggal', 'Shift', 'Jadwal', 'Scan Masuk', 'Scan Pulang', 'Status Kehadiran', 'Ketidakhadiran', 'Lembur', 'Aksi']
                        : ['Karyawan', 'Departemen', 'Catatan final', 'Total keterlambatan', 'Total lembur', 'Detail']}
                    </tr>
                  </thead>
                  <tbody>
                    {employee ? (
                      calendarRows.slice(from, from + pageSize).map(row => {
                        const r = row.record;
                        return (
                          <tr key={row.date} className={row.isDayOff ? 'bg-slate-50/40 text-slate-500' : ''}>
                            <td>
                              <div className="font-semibold text-slate-900">
                                {dateLabel(row.date)}
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium block">
                                {row.dayName}
                              </span>
                            </td>
                            <td>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                                row.isDayOff
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}>
                                {row.shiftName}
                              </span>
                            </td>
                            <td className="font-mono text-slate-600">
                              {row.isDayOff ? '00:00 – 00:00' : `${row.scheduleIn} – ${row.scheduleOut}`}
                            </td>
                            <td className={r?.lateMinutes ? 'font-semibold text-amber-700 font-mono' : 'text-emerald-700 font-mono'}>
                              {r?.scanIn || '—'}
                              {r?.normalized && !r.rawScanIn && (
                                <span className="ml-1 text-amber-700" title="Scan masuk dinormalisasi">*</span>
                              )}
                            </td>
                            <td className={r?.earlyMinutes ? 'font-semibold text-orange-700 font-mono' : 'font-mono'}>
                              {r?.scanOut || '—'}
                              {r?.normalized && !r.rawScanOut && (
                                <span className="ml-1 text-amber-700" title="Scan pulang dinormalisasi">*</span>
                              )}
                            </td>
                            <td>
                              {r ? (
                                <Status status={r.attendanceStatus} dayOff={r.isDayOff} />
                              ) : row.isDayOff ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                                  Libur
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  Belum Ada Data
                                </span>
                              )}
                            </td>
                            <td>
                              {r && r.attendanceStatus !== 'PRESENT' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-100 text-yellow-900 border border-yellow-200">
                                  {r.attendanceStatus}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="font-mono">
                              {r ? durationLabel(r.overtimeMinutes) : '—'}
                            </td>
                            <td>
                              <div className="flex items-center gap-1.5">
                                {r ? (
                                  <>
                                    <button className="hr-btn" onClick={() => setDetail(r)}>
                                      Riwayat
                                    </button>
                                    {canWrite && (
                                      <button
                                        className="hr-btn"
                                        disabled={data.locks.some(l => l.workDate === r.workDate)}
                                        onClick={() => setCorrecting(r)}
                                      >
                                        Koreksi
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  canWrite && (
                                    <button
                                      type="button"
                                      className="hr-btn text-emerald-800 hover:bg-emerald-50 border-emerald-200 font-semibold"
                                      disabled={data.locks.some(l => l.workDate === row.date)}
                                      onClick={() => setRecordingTarget({ date: row.date, existingRecord: null })}
                                    >
                                      Catat / Izin
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      reports.slice(from, from + 10).map(r => (
                        <tr key={r.employee.id}>
                          <td><EmployeeName employee={r.employee} /></td>
                          <td>{data.departments.find(d => d.id === r.employee.departmentId)?.name ?? '—'}</td>
                          <td>{r.recordCount || <span className="text-slate-500">Belum ada data</span>}</td>
                          <td className={r.lateMinutes ? 'font-medium text-red-700' : ''}>{r.recordCount ? durationLabel(r.lateMinutes) : '—'}</td>
                          <td className="font-medium">{r.recordCount ? durationLabel(r.overtimeMinutes) : '—'}</td>
                          <td>
                            <Link className="hr-btn" href={`/dashboard/attendance/employees/${r.employee.id}`}>
                              Lihat kartu
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {!count && <Empty />}
              <Pagination total={count} page={currentPage} onChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* DIALOG KOREKSI & RIWAYAT */}
      {correcting && <CorrectionDialog record={correcting} onClose={() => setCorrecting(null)} />}
      {detail && <RecordDetails record={detail} onClose={() => setDetail(null)} />}

      {/* DIALOG PENCATATAN ABSENSI BARU / SAKIT / CUTI / IZIN */}
      {recordingTarget && employee && (
        <RecordAttendanceDialog
          employee={employee}
          date={recordingTarget.date}
          existingRecord={recordingTarget.existingRecord}
          shift={employeeShift}
          onClose={() => setRecordingTarget(null)}
        />
      )}
    </div>
  );
}
