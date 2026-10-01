'use client';

import type { TalentaKpiSummary } from '@/lib/attendance/talentaCard';

interface TalentaKpiStripProps {
  kpi: TalentaKpiSummary;
}

export function TalentaKpiStrip({ kpi }: TalentaKpiStripProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        
        {/* Section 1: Exceptions & Scan Deviations (Early out, No clock out, No clock in, Invalid) */}
        <div className="md:col-span-5 p-4 flex items-center justify-around gap-2 text-left">
          <div className="flex-1 px-2">
            <span className="text-xl font-bold text-slate-900 tabular-nums block leading-tight">
              {kpi.earlyClockOut}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1 leading-tight font-normal">
              Early clock out
            </span>
          </div>

          <div className="flex-1 px-2">
            <span className="text-xl font-bold text-slate-900 tabular-nums block leading-tight">
              {kpi.noClockOut}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1 leading-tight font-normal">
              No clock out
            </span>
          </div>

          <div className="flex-1 px-2">
            <span className="text-xl font-bold text-slate-900 tabular-nums block leading-tight">
              {kpi.noClockIn}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1 leading-tight font-normal">
              No clock in
            </span>
          </div>

          <div className="flex-1 px-2">
            <span className="text-xl font-bold text-slate-900 tabular-nums block leading-tight">
              {kpi.invalid}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1 leading-tight font-normal">
              Invalid
            </span>
          </div>
        </div>

        {/* Section 2: Absences & Non-working days (Absent, Day off, Time off) */}
        <div className="md:col-span-4 p-4 flex items-center justify-around gap-2 text-left">
          <div className="flex-1 px-2">
            <span className="text-xl font-bold text-slate-900 tabular-nums block leading-tight">
              {kpi.absent}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1 leading-tight font-normal">
              Absent
            </span>
          </div>

          <div className="flex-1 px-2">
            <span className="text-xl font-bold text-slate-900 tabular-nums block leading-tight">
              {kpi.dayOff}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1 leading-tight font-normal">
              Day off
            </span>
          </div>

          <div className="flex-1 px-2">
            <span className="text-xl font-bold text-slate-900 tabular-nums block leading-tight">
              {kpi.timeOff}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1 leading-tight font-normal">
              Time off
            </span>
          </div>
        </div>

        {/* Section 3: Upcoming work days (Next workdays) */}
        <div className="md:col-span-3 p-4 flex items-center justify-start gap-4 text-left">
          <div className="px-3">
            <span className="text-xl font-bold text-slate-900 tabular-nums block leading-tight">
              {kpi.nextWorkdays}
            </span>
            <span className="text-[11px] text-slate-500 block mt-1 leading-tight font-normal">
              Next workdays
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
