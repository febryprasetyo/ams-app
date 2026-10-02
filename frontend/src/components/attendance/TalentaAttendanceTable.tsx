'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, Edit3, X } from 'lucide-react';
import { formatTalentaRow, type TalentaFormattedRow, type TalentaKpiFilterKey } from '@/lib/attendance/talentaCard';
import type { CalendarDayRow } from '@/lib/attendance/scheduleShift';
import type { AttendanceRecord } from '@/lib/attendance/types';

interface TalentaAttendanceTableProps {
  rows: CalendarDayRow[];
  canWrite: boolean;
  onEdit: (row: { date: string; existingRecord?: AttendanceRecord | null }) => void;
  activeFilter?: TalentaKpiFilterKey;
  onResetFilter?: () => void;
}

type SortField = 'date' | 'shift' | 'scheduleIn' | 'scheduleOut' | 'clockIn' | 'clockOut';
type SortDirection = 'asc' | 'desc';

const FILTER_LABELS: Record<TalentaKpiFilterKey, string> = {
  ALL: 'Semua Catatan',
  EARLY_CLOCK_OUT: 'Early clock out',
  NO_CLOCK_OUT: 'No clock out',
  NO_CLOCK_IN: 'No clock in',
  INVALID: 'Invalid',
  ABSENT: 'Absent',
  DAY_OFF: 'Day off',
  TIME_OFF: 'Time off',
  NEXT_WORKDAYS: 'Next workdays',
};

export function TalentaAttendanceTable({
  rows,
  canWrite,
  onEdit,
  activeFilter = 'ALL',
  onResetFilter,
}: TalentaAttendanceTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const formattedRows: TalentaFormattedRow[] = useMemo(() => {
    return rows.map(formatTalentaRow);
  }, [rows]);

  const sortedRows = useMemo(() => {
    const list = [...formattedRows];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'shift') cmp = a.shiftCode.localeCompare(b.shiftCode);
      else if (sortField === 'scheduleIn') cmp = a.scheduleIn.localeCompare(b.scheduleIn);
      else if (sortField === 'scheduleOut') cmp = a.scheduleOut.localeCompare(b.scheduleOut);
      else if (sortField === 'clockIn') cmp = a.clockIn.localeCompare(b.clockIn);
      else if (sortField === 'clockOut') cmp = a.clockOut.localeCompare(b.clockOut);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [formattedRows, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Active Filter Indicator Banner */}
      {activeFilter !== 'ALL' && (
        <div className="bg-blue-50/70 border-b border-blue-100/90 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-blue-900">
            <span className="font-normal text-blue-700">Filter aktif:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-blue-950 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
              {FILTER_LABELS[activeFilter]}
            </span>
            <span className="text-blue-600 font-medium">({sortedRows.length} baris)</span>
          </div>
          {onResetFilter && (
            <button
              type="button"
              onClick={onResetFilter}
              className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-medium px-2 py-1 rounded hover:bg-blue-100/70 transition-colors cursor-pointer"
            >
              <X size={13} />
              <span>Tampilkan semua</span>
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200">
              {/* Date Column with right vertical dividing line */}
              <th scope="col" className="py-3 px-4 whitespace-nowrap border-r border-slate-200">
                <button
                  type="button"
                  onClick={() => toggleSort('date')}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                >
                  <span>Date</span>
                  <ArrowUpDown size={12} className="text-slate-400" />
                </button>
              </th>

              {/* Shift Column */}
              <th scope="col" className="py-3 px-4 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => toggleSort('shift')}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                >
                  <span>Shift</span>
                  <ArrowUpDown size={12} className="text-slate-400" />
                </button>
              </th>

              <th scope="col" className="py-3 px-4 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => toggleSort('scheduleIn')}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                >
                  <span>Schedule in</span>
                  <ArrowUpDown size={12} className="text-slate-400" />
                </button>
              </th>

              <th scope="col" className="py-3 px-4 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => toggleSort('scheduleOut')}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                >
                  <span>Schedule out</span>
                  <ArrowUpDown size={12} className="text-slate-400" />
                </button>
              </th>

              <th scope="col" className="py-3 px-4 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => toggleSort('clockIn')}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                >
                  <span>Clock in</span>
                  <ArrowUpDown size={12} className="text-slate-400" />
                </button>
              </th>

              <th scope="col" className="py-3 px-4 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => toggleSort('clockOut')}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900 cursor-pointer"
                >
                  <span>Clock out</span>
                  <ArrowUpDown size={12} className="text-slate-400" />
                </button>
              </th>

              <th scope="col" className="py-3 px-4 whitespace-nowrap">
                Attendance code
              </th>

              <th scope="col" className="py-3 px-4 whitespace-nowrap">
                Time off code
              </th>

              <th scope="col" className="py-3 px-4 whitespace-nowrap">
                Overtime
              </th>

              {canWrite && (
                <th scope="col" className="py-3 px-4 whitespace-nowrap text-right">
                  Aksi
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={canWrite ? 10 : 9} className="py-12 text-center text-slate-500">
                  <p className="font-medium text-slate-700">
                    {activeFilter !== 'ALL'
                      ? `Tidak ada catatan dengan status "${FILTER_LABELS[activeFilter]}".`
                      : 'Tidak ada data absensi pada periode ini.'}
                  </p>
                  {activeFilter !== 'ALL' && onResetFilter && (
                    <button
                      type="button"
                      onClick={onResetFilter}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                    >
                      Reset filter dan tampilkan semua catatan
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {
                const isDayOff = row.isDayOff;

                return (
                  <tr
                    key={row.date}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Date with vertical dividing line separating it from Shift */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800 border-r border-slate-200">
                      {row.dateDisplay}
                    </td>

                    {/* Shift */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium">
                      {isDayOff ? (
                        <span className="text-rose-500 font-semibold lowercase">
                          dayoff
                        </span>
                      ) : (
                        <span className="text-slate-700">
                          {row.shiftCode}
                        </span>
                      )}
                    </td>

                    {/* Schedule in */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                      {row.scheduleIn}
                    </td>

                    {/* Schedule out */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                      {row.scheduleOut}
                    </td>

                    {/* Clock in */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      {row.clockIn !== '-' ? (
                        <span className="text-slate-800 font-semibold">{row.clockIn}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Clock out */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      {row.clockOut !== '-' ? (
                        <span className="text-slate-800 font-semibold">{row.clockOut}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Attendance code */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                      {row.attendanceCode}
                    </td>

                    {/* Time off code */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                      {row.timeOffCode}
                    </td>

                    {/* Overtime */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                      {row.overtime}
                    </td>

                    {/* Uniform Action Button */}
                    {canWrite && (
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => onEdit({ date: row.date, existingRecord: row.record })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/30 transition-colors font-medium cursor-pointer shadow-2xs"
                        >
                          <Edit3 size={11} className="text-slate-400 group-hover:text-blue-500" />
                          <span>Koreksi</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
