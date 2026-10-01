'use client';

import { Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { OverviewMetrics } from '@/lib/attendance/overviewMetrics';

interface HrTodayKpiCardsProps {
  metrics: OverviewMetrics;
  activeFilter?: string;
  onSelectFilter?: (filterKey: string) => void;
}

export default function HrTodayKpiCards({
  metrics,
  activeFilter,
  onSelectFilter,
}: HrTodayKpiCardsProps) {
  const formatMinutes = (mins: number) => {
    if (mins <= 0) return '0 menit';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}j ${m}m` : `${m}m`;
  };

  const cards = [
    {
      key: 'all',
      label: 'Karyawan Aktif',
      count: metrics.totalActiveEmployees,
      badge: 'Headcount',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      description: 'Total tenaga kerja aktif terdaftar',
      icon: Users,
      iconColor: 'text-slate-700 bg-slate-100',
      highlightBorder: activeFilter === 'all' ? 'ring-2 ring-slate-400 bg-slate-50/50' : '',
    },
    {
      key: 'present',
      label: 'Kehadiran Hari Ini',
      count: metrics.presentCount,
      badge: `${metrics.presentRate}%`,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: `${metrics.presentCount} dari ${metrics.totalActiveEmployees} hadir`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-700 bg-emerald-100',
      highlightBorder: activeFilter === 'present' ? 'ring-2 ring-emerald-500 bg-emerald-50/40' : '',
      progressRate: metrics.presentRate,
    },
    {
      key: 'late',
      label: 'Terlambat Datang',
      count: metrics.lateCount,
      badge: metrics.totalLateMinutes > 0 ? formatMinutes(metrics.totalLateMinutes) : 'Tepat Waktu',
      badgeColor: metrics.lateCount > 0 ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100',
      description: metrics.lateCount > 0 ? `Total durasi ${formatMinutes(metrics.totalLateMinutes)}` : 'Semua hadir tepat waktu ✨',
      icon: Clock,
      iconColor: metrics.lateCount > 0 ? 'text-amber-700 bg-amber-100' : 'text-emerald-600 bg-emerald-50',
      highlightBorder: activeFilter === 'late' ? 'ring-2 ring-amber-500 bg-amber-50/40' : '',
    },
    {
      key: 'anomaly',
      label: 'Perlu Dicek / Cuti',
      count: metrics.missingScanCount + metrics.leaveCount,
      badge: metrics.missingScanCount > 0 ? `${metrics.missingScanCount} Anomali` : `${metrics.leaveCount} Cuti`,
      badgeColor: metrics.missingScanCount > 0 ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-blue-100 text-blue-800 border-blue-200',
      description: `${metrics.missingScanCount} missing scan · ${metrics.leaveCount} izin/cuti`,
      icon: AlertTriangle,
      iconColor: metrics.missingScanCount > 0 ? 'text-amber-700 bg-amber-100' : 'text-slate-600 bg-slate-100',
      highlightBorder: activeFilter === 'anomaly' ? 'ring-2 ring-amber-500 bg-amber-50/40' : '',
    },
  ];

  return (
    <section aria-label="Pantauan Kehadiran Hari Ini" className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Pantauan Hari Ini
        </h2>
        {activeFilter && activeFilter !== 'all' && onSelectFilter && (
          <button
            type="button"
            onClick={() => onSelectFilter('all')}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
          >
            Tampilkan Semua Karyawan
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onSelectFilter && onSelectFilter(c.key)}
              className={`hr-panel p-4.5 text-left transition-all duration-150 hover:shadow-sm hover:border-emerald-300 cursor-pointer ${c.highlightBorder}`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className={`p-2 rounded-xl shrink-0 ${c.iconColor}`}>
                  <Icon size={18} />
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${c.badgeColor}`}>
                  {c.badge}
                </span>
              </div>

              <div className="space-y-1">
                <span className="block text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {c.count}
                </span>
                <span className="block text-xs font-semibold text-slate-700">
                  {c.label}
                </span>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {c.description}
                </p>
              </div>

              {typeof c.progressRate === 'number' && (
                <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, c.progressRate))}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
