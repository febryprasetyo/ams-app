'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Download, SlidersHorizontal, ArrowLeft } from 'lucide-react';
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
  const [showAllFilters, setShowAllFilters] = useState(false);
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
    if (endDate && endDate.includes('-')) {
      const parts = endDate.split('-').map(Number);
      return [parts[0], parts[1]];
    }
    return [2026, 9];
  }, [endDate]);

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
              className="hr-btn text-xs inline-flex items-center gap-1.5"
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
              <Download size={13} className="text-slate-500" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>
      ) : (
        <Heading
          title="Laporan Rekap Absensi"
          description="Rekap keterlambatan, lembur, dan kehadiran karyawan berdasarkan catatan final pada siklus payroll."
        >
          <button
            className="hr-btn-primary"
            disabled={!!error || !reports.length}
            onClick={() => {
              exportAttendanceReportToExcel(reports, filter, {
                anonymous,
                departmentLookup: id => data.departments.find(d => d.id === id)?.name,
                filename: `rekap-absensi-payroll-${startDate}-${endDate}.xlsx`,
              });
            }}
          >
            <Download size={15} />
            Ekspor Excel (.xlsx)
          </button>
        </Heading>
      )}

      {/* TALENTA FILTER TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Month Popover (Talenta style) */}
          <TalentaMonthPickerPopover
            selectedYear={activeYear}
            selectedMonth={activeMonth}
            onSelect={handleSelectMonth}
          />

          {/* All Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setShowAllFilters(!showAllFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer shadow-2xs ${
              showAllFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <SlidersHorizontal size={13} className={showAllFilters ? 'text-blue-600' : 'text-slate-400'} />
            <span>All filters</span>
          </button>
        </div>

        {employee && (
          <span className="text-[11px] font-medium text-slate-400">
            Cut-off: 21 s.d. 20 ({dateLabel(startDate)} – {dateLabel(endDate)})
          </span>
        )}
      </div>

      {/* EXPANDABLE "ALL FILTERS" PANEL */}
      {showAllFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 text-xs animate-in fade-in duration-100 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800">Filter Tambahan</span>
            <button
              type="button"
              onClick={() => setIsCustomPeriod(!isCustomPeriod)}
              className="text-blue-600 hover:underline cursor-pointer font-medium"
            >
              {isCustomPeriod ? 'Gunakan Siklus Payroll Standar' : 'Gunakan Rentang Tanggal Kustom'}
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            {isCustomPeriod ? (
              <>
                <label className="space-y-1 block">
                  <span className="font-semibold text-slate-700">Dari tanggal</span>
                  <input
                    className="hr-input"
                    type="date"
                    value={startDate}
                    onChange={e => { setStart(e.target.value); setPage(1); }}
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="font-semibold text-slate-700">Sampai tanggal</span>
                  <input
                    className="hr-input"
                    type="date"
                    value={endDate}
                    onChange={e => { setEnd(e.target.value); setPage(1); }}
                  />
                </label>
              </>
            ) : (
              <label className="space-y-1 block w-full sm:w-80">
                <span className="font-semibold text-slate-700">Siklus Payroll</span>
                <select
                  aria-label="Pilih Bulan Siklus Payroll"
                  className="hr-input"
                  value={selectedCycleIndex}
                  onChange={e => {
                    const idx = Number(e.target.value);
                    setSelectedCycleIndex(idx);
                    const p = payrollMonths[idx];
                    if (p) {
                      setStart(p.startDate);
                      setEnd(p.endDate);
                      setPage(1);
                    }
                  }}
                >
                  {payrollMonths.map((p, idx) => (
                    <option key={`${p.year}-${p.month}`} value={idx}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {!employee && !anonymous && (
              <>
                <label className="space-y-1 block min-w-44">
                  <span className="font-semibold text-slate-700">Departemen</span>
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
                <div className="ml-auto w-full sm:w-64">
                  <SearchInput value={q} onChange={v => { setQ(v); setPage(1); }} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
                      <th>Catatan final</th>
                      <th>Total keterlambatan</th>
                      <th>Total lembur</th>
                      <th>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.slice(from, from + 10).map(r => (
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
    </div>
  );
}
