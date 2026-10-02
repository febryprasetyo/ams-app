'use client';

import type { TalentaKpiSummary, TalentaKpiFilterKey } from '@/lib/attendance/talentaCard';

interface TalentaKpiStripProps {
  kpi: TalentaKpiSummary;
  activeFilter?: TalentaKpiFilterKey;
  onSelectFilter?: (key: TalentaKpiFilterKey) => void;
}

interface KpiItemConfig {
  key: TalentaKpiFilterKey;
  label: string;
  count: number;
  description: string;
}

export function TalentaKpiStrip({
  kpi,
  activeFilter = 'ALL',
  onSelectFilter,
}: TalentaKpiStripProps) {
  const handleItemClick = (key: TalentaKpiFilterKey) => {
    if (!onSelectFilter) return;
    if (activeFilter === key) {
      onSelectFilter('ALL');
    } else {
      onSelectFilter(key);
    }
  };

  const renderCardItem = (item: KpiItemConfig) => {
    const isSelected = activeFilter === item.key;
    const isInteractive = !!onSelectFilter;

    return (
      <button
        key={item.key}
        type="button"
        disabled={!isInteractive}
        onClick={() => handleItemClick(item.key)}
        className={`
          group relative flex flex-col justify-center w-full min-h-[62px] p-2 sm:p-2.5 rounded-lg text-left transition-all duration-150
          ${!isInteractive ? 'cursor-default' : 'cursor-pointer'}
          ${
            isSelected
              ? 'bg-blue-50/90 ring-1.5 ring-blue-500/90 shadow-2xs'
              : 'hover:bg-slate-50/90 border border-transparent hover:border-slate-200/60'
          }
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        `}
        title={`Filter: ${item.label} (${item.count} hari) - ${item.description}`}
        aria-pressed={isSelected}
      >
        {isSelected && (
          <span
            className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-600 ring-2 ring-blue-100"
            aria-hidden="true"
          />
        )}
        <span
          className={`text-lg sm:text-xl font-bold tabular-nums block leading-tight ${
            isSelected
              ? 'text-blue-700'
              : item.count > 0
              ? 'text-slate-900 group-hover:text-slate-950'
              : 'text-slate-700 group-hover:text-slate-900'
          }`}
        >
          {item.count}
        </span>
        <span
          className={`text-[11px] block mt-1 leading-tight font-medium ${
            isSelected
              ? 'text-blue-700 font-semibold'
              : 'text-slate-500 group-hover:text-slate-700'
          }`}
        >
          {item.label}
        </span>
      </button>
    );
  };

  // Section 1: Exceptions & Scan Deviations (Early out, No clock out, No clock in, Invalid)
  const exceptions: KpiItemConfig[] = [
    { key: 'EARLY_CLOCK_OUT', label: 'Early clock out', count: kpi.earlyClockOut, description: 'Pulang lebih awal' },
    { key: 'NO_CLOCK_OUT', label: 'No clock out', count: kpi.noClockOut, description: 'Tidak scan pulang' },
    { key: 'NO_CLOCK_IN', label: 'No clock in', count: kpi.noClockIn, description: 'Tidak scan masuk' },
    { key: 'INVALID', label: 'Invalid', count: kpi.invalid, description: 'Status absensi tidak valid' },
  ];

  // Section 2: Absences & Non-working days (Absent, Day off, Time off)
  const nonWorking: KpiItemConfig[] = [
    { key: 'ABSENT', label: 'Absent', count: kpi.absent, description: 'Tidak hadir / mangkir' },
    { key: 'DAY_OFF', label: 'Day off', count: kpi.dayOff, description: 'Hari libur mingguan / nasional' },
    { key: 'TIME_OFF', label: 'Time off', count: kpi.timeOff, description: 'Izin, cuti, atau sakit' },
  ];

  // Section 3: Upcoming work days (Next workdays)
  const upcoming: KpiItemConfig[] = [
    { key: 'NEXT_WORKDAYS', label: 'Next workdays', count: kpi.nextWorkdays, description: 'Hari kerja terjadwal mendatang' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
        
        {/* Section 1: 4 items (Early clock out, No clock out, No clock in, Invalid) */}
        <div className="lg:col-span-6 p-1.5 sm:p-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-1.5">
            {exceptions.map(renderCardItem)}
          </div>
        </div>

        {/* Section 2: 3 items (Absent, Day off, Time off) */}
        <div className="lg:col-span-4 p-1.5 sm:p-2">
          <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
            {nonWorking.map(renderCardItem)}
          </div>
        </div>

        {/* Section 3: 1 item (Next workdays) */}
        <div className="lg:col-span-2 p-1.5 sm:p-2">
          <div className="grid grid-cols-1 gap-1 sm:gap-1.5">
            {upcoming.map(renderCardItem)}
          </div>
        </div>

      </div>
    </div>
  );
}
