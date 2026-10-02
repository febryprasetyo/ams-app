'use client';

import { useState } from 'react';
import { Building2, ChevronDown, ChevronUp } from 'lucide-react';
import type { DepartmentPresenceSummary } from '@/lib/attendance/overviewMetrics';

interface HrDepartmentSummaryProps {
  departments: DepartmentPresenceSummary[];
  initialVisible?: number;
}

export default function HrDepartmentSummary({
  departments,
  initialVisible = 4,
}: HrDepartmentSummaryProps) {
  const [showAll, setShowAll] = useState(false);

  if (departments.length === 0) {
    return null;
  }

  const visibleDepartments = showAll
    ? departments
    : departments.slice(0, initialVisible);

  const hasMore = departments.length > initialVisible;

  return (
    <div className="hr-panel p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Building2 size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Distribusi per Departemen
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                {departments.length} Divisi
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Rasio kehadiran karyawan per departemen pada tanggal aktif.
            </p>
          </div>
        </div>

        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
          >
            <span>{showAll ? 'Tampilkan Lebih Sedikit' : `Lihat Semua (${departments.length})`}</span>
            {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleDepartments.map((dept) => {
          const rate = dept.rate;
          const barColor =
            rate >= 80
              ? 'bg-emerald-500'
              : rate >= 50
              ? 'bg-amber-500'
              : 'bg-rose-500';

          const badgeColor =
            rate >= 80
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : rate >= 50
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200';

          return (
            <div
              key={dept.id}
              className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 truncate" title={dept.name}>
                  {dept.name}
                </span>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border tabular-nums ${badgeColor}`}
                >
                  {rate}%
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>{dept.presentCount} dari {dept.activeCount} hadir</span>
              </div>

              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
