'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Download, ArrowLeft } from 'lucide-react';
import { useAttendance } from './AttendanceWorkspace';
import { Heading, SearchInput, EmployeeName, Pagination, Empty, Totals } from './shared';
import { UnifiedCorrectionModal } from './UnifiedCorrectionModal';
import { TalentaMonthPickerPopover } from './TalentaMonthPickerPopover';
import { TalentaKpiStrip } from './TalentaKpiStrip';
import { TalentaAttendanceTable } from './TalentaAttendanceTable';
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
  type WorkShift,
  type CalendarDayRow,
} from '@/lib/attendance/scheduleShift';
import { calculateTalentaKpi, filterTalentaRows, type TalentaKpiFilterKey } from '@/lib/attendance/talentaCard';
import { exportAttendanceReportToExcel } from '@/lib/attendance/excelExport';
import { ExportAttendanceModal } from './ExportAttendanceModal';
import type { AttendanceRecord } from '@/lib/attendance/types';

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
  const [kpiFilter, setKpiFilter] = useState<TalentaKpiFilterKey>('ALL');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCustomPeriod, setIsCustomPeriod] = useState(false);
  const [startDate, setStart] = useState(defaultPeriod.startDate);
  const [endDate, setEnd] = useState(defaultPeriod.endDate);
  const [q, setQ] = useState(''), [departmentId, setDepartment] = useState(0), [page, setPage] = useState(1);

  // Sync default period
  useEffect(() => {
    if (!isCustomPeriod && payrollMonths.length > 0) {
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
    setKpiFilter('ALL');
    setPage(1);
  }, [employeeId, defaultPeriod.startDate, defaultPeriod.endDate, isCustomPeriod, payrollMonths]);

  // Unified editing target (handles both unrecorded rows and existing records)
  const [editingTarget, setEditingTarget] = useState<{ date: string; existingRecord?: AttendanceRecord | null } | null>(null);

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

  // Generate full calendar grid (30/31 days) for employee view
  const calendarRows: CalendarDayRow[] = useMemo(() => {
    if (!employeeId || error) return [];
    return generateFullCalendarGrid(startDate, endDate, employeeShift, records);
  }, [employeeId, error, startDate, endDate, employeeShift, records]);

  // Statistics for employee card header (Talenta 3-segment KPI Strip)
  const talentaKpi = useMemo(() => {
    if (!employeeId || calendarRows.length === 0) return null;
    return calculateTalentaKpi(calendarRows);
  }, [employeeId, calendarRows]);

  // Filter calendar rows based on active KPI card filter
  const displayedCalendarRows = useMemo(() => {
    return filterTalentaRows(calendarRows, kpiFilter);
  }, [calendarRows, kpiFilter]);

  const count = employeeId ? calendarRows.length : reports.length;
  const pageSize = 10;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(count / pageSize)));
  const from = (currentPage - 1) * pageSize;

  // Selected year and month for the Talenta Month Picker Popover
  const [activeYear, activeMonth] = useMemo(() => {
    if (startDate && startDate.includes('-')) {
      const parts = startDate.split('-').map(Number);
      return [parts[0], parts[1]];
    }
    return [2026, 8];
  }, [startDate]);

  const handleSelectMonth = (year: number, month: number) => {
    const cycle = getPayrollCyclePeriod(year, month);
    setStart(cycle.startDate);
    setEnd(cycle.endDate);
    setIsCustomPeriod(false);
    setKpiFilter('ALL');
    setPage(1);

    const matchIdx = payrollMonths.findIndex(p => p.year === year && p.month === month);
    if (matchIdx !== -1) {
      setSelectedCycleIndex(matchIdx);
    }
  };

  if (employeeId && !employee) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center space-y-4">
        <Empty text="Karyawan absensi tidak ditemukan." />
        <Link className="hr-btn" href="/dashboard/attendance/employees">
          Kembali ke kartu absensi
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER SECTION */}
      {employee ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/attendance/employees"
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 -ml-1 rounded-md hover:bg-slate-100"
                title="Kembali ke semua karyawan"
              >
                <ArrowLeft size={16} />
              </Link>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {employee.fullName}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-6">
              {employee.employeeCode || 'Tanpa kode'} · {
                data.departments.find(d => d.id === employee.departmentId)?.name ?? 'Tanpa departemen'
              } · Shift: {employeeShift.name} ({employeeShift.scheduleIn} - {employeeShift.scheduleOut}, {employeeShift.workDays} Hari)
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link className="hr-btn text-xs" href="/dashboard/attendance/employees">
              Semua karyawan
            </Link>
            <button
              type="button"
              className="hr-btn-primary text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              disabled={!!error || !calendarRows.length}
              onClick={() => {
                exportAttendanceReportToExcel(reports, filter, {
                  anonymous,
                  departmentLookup: id => data.departments.find(d => d.id === id)?.name,
                  dailyRecords: records,
                  filename: `rekap-absensi-${employee.employeeCode || employee.id}-${startDate}-${endDate}.xlsx`,
                });
              }}
            >
              <Download size={13} />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>
      ) : (
        <Heading
          title="Laporan Rekap Absensi"
          description="Rekap keterlambatan, lembur, dan kehadiran karyawan berdasarkan catatan final pada siklus cut-off 21 s.d. 20."
        />
      )}

      {/* FILTER TOOLBAR: 1-Line horizontal bar (No 3-tier stacking) */}
      <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Month Popover (Talenta style: clean "Aug 2026") */}
          <TalentaMonthPickerPopover
            selectedYear={activeYear}
            selectedMonth={activeMonth}
            onSelect={handleSelectMonth}
          />

          <div className="h-4 w-px bg-slate-200 shrink-0" />

          {/* Direct Department Dropdown (Replacing All filters) */}
          {!anonymous && (
            <select
              aria-label="Filter Departemen"
              className="hr-input text-xs h-8.5 rounded-lg border-slate-200 bg-white px-2.5 font-medium text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shrink-0"
              value={departmentId}
              onChange={e => { setDepartment(Number(e.target.value)); setPage(1); }}
            >
              <option value={0}>Semua Departemen</option>
              {data.departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}

          {/* Search Input for rekap view */}
          {!employee && !anonymous && (
            <div className="w-52 shrink-0">
              <SearchInput value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Cari nama karyawan..." />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <div className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80 whitespace-nowrap">
            <span>Periode Awal: </span>
            <strong className="text-slate-800 font-semibold">{dateLabel(startDate)}</strong>
            <span className="text-slate-300 mx-1.5">|</span>
            <span>Periode Akhir: </span>
            <strong className="text-slate-800 font-semibold">{dateLabel(endDate)}</strong>
          </div>

          {!employee && (
            <button
              type="button"
              className="hr-btn-primary text-xs inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-xs cursor-pointer shrink-0"
              disabled={!!error || !reports.length}
              onClick={() => setIsExportModalOpen(true)}
            >
              <Download size={13} />
              <span>Ekspor Excel</span>
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700 border border-red-200" role="alert">
          {error}
        </div>
      ) : (
        <>
          {/* TALENTA 3-SEGMENT KPI STRIP (Neutral, un-rainbow, single container) */}
          {employee && talentaKpi && (
            <TalentaKpiStrip
              kpi={talentaKpi}
              activeFilter={kpiFilter}
              onSelectFilter={setKpiFilter}
            />
          )}

          {!employee && (
            <Totals
              late={reports.reduce((n, r) => n + r.lateMinutes, 0)}
              overtime={reports.reduce((n, r) => n + r.overtimeMinutes, 0)}
              count={reports.reduce((n, r) => n + r.recordCount, 0)}
              sakit={reports.reduce((n, r) => n + (r.sakitCount || 0), 0)}
              izin={reports.reduce((n, r) => n + (r.izinCount || 0), 0)}
              cuti={reports.reduce((n, r) => n + (r.cutiCount || 0), 0)}
            />
          )}

          {/* ATTENDANCE TABLE */}
          {employee ? (
            <TalentaAttendanceTable
              rows={displayedCalendarRows}
              canWrite={canWrite}
              onEdit={target => setEditingTarget(target)}
              activeFilter={kpiFilter}
              onResetFilter={() => setKpiFilter('ALL')}
            />
          ) : anonymous ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-600">
              Ringkasan agregat tanpa identitas karyawan. Ekspor mengikuti cakupan ringkasan ini.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Karyawan</th>
                      <th>Departemen</th>
                      <th>Hadir</th>
                      <th>Terlambat</th>
                      <th>Lembur</th>
                      <th className="text-center">Izin</th>
                      <th className="text-center">Sakit</th>
                      <th className="text-center">Cuti</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.slice(from, from + 10).map(r => (
                      <tr key={r.employee.id}>
                        <td><EmployeeName employee={r.employee} /></td>
                        <td>{data.departments.find(d => d.id === r.employee.departmentId)?.name ?? '—'}</td>
                        <td>{r.recordCount || <span className="text-slate-400">0</span>}</td>
                        <td className={r.lateMinutes ? 'font-medium text-red-700' : ''}>{r.recordCount ? durationLabel(r.lateMinutes) : '—'}</td>
                        <td className="font-medium">{r.recordCount ? durationLabel(r.overtimeMinutes) : '—'}</td>
                        <td className="text-center tabular-nums">{r.izinCount || <span className="text-slate-400">0</span>}</td>
                        <td className="text-center tabular-nums">{r.sakitCount || <span className="text-slate-400">0</span>}</td>
                        <td className="text-center tabular-nums">{r.cutiCount || <span className="text-slate-400">0</span>}</td>
                        <td className="text-right">
                          <Link className="hr-btn" href={`/dashboard/attendance/reports?employeeId=${r.employee.id}`}>
                            Lihat kartu
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!count && <Empty />}
              <Pagination total={count} page={currentPage} onChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* UNIFIED CORRECTION MODAL (Seragam untuk baris kosong maupun baris impor) */}
      {editingTarget && employee && (
        <UnifiedCorrectionModal
          employee={employee}
          date={editingTarget.date}
          existingRecord={editingTarget.existingRecord}
          shiftId={employeeShift.id}
          onClose={() => setEditingTarget(null)}
        />
      )}

      {/* EXPORT ATTENDANCE MODAL (Multi-person & Multi-divisi selection) */}
      {isExportModalOpen && (
        <ExportAttendanceModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          departments={data.departments}
          reports={reports}
          filter={filter}
          onExport={selectedReports => {
            exportAttendanceReportToExcel(selectedReports, filter, {
              anonymous,
              departmentLookup: id => data.departments.find(d => d.id === id)?.name,
              filename: `rekap-absensi-${startDate}-${endDate}.xlsx`,
            });
          }}
        />
      )}
    </div>
  );
}
