'use client';

import React from 'react';
import { Users, CalendarDays, Clock, CheckCircle2 } from 'lucide-react';
import { formatIndoDays } from '@/lib/leaves/masterLeaveUtils';

interface AnnualLeaveStatsCardsProps {
  totalEmployees: number;
  averageRemainingDays: number;
  totalUsedDays: number;
  totalAllocatedQuota: number;
  isLoading?: boolean;
}

export default function AnnualLeaveStatsCards({
  totalEmployees,
  averageRemainingDays,
  totalUsedDays,
  totalAllocatedQuota,
  isLoading = false,
}: AnnualLeaveStatsCardsProps) {
  const cards = [
    {
      title: 'Karyawan Aktif',
      value: `${totalEmployees} Orang`,
      description: 'Total staf terdaftar cuti',
      icon: Users,
      color: 'text-slate-700 dark:text-slate-300',
      bgColor: 'bg-slate-100 dark:bg-slate-800',
      borderColor: 'border-slate-200 dark:border-slate-800',
    },
    {
      title: 'Rata-rata Sisa Cuti',
      value: formatIndoDays(averageRemainingDays),
      description: 'Per karyawan di tahun aktif',
      icon: Clock,
      color: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-200 dark:border-emerald-900/50',
    },
    {
      title: 'Total Kuota Terpakai',
      value: formatIndoDays(totalUsedDays),
      description: 'Cuti diambil tahun ini',
      icon: CalendarDays,
      color: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      borderColor: 'border-amber-200 dark:border-amber-900/50',
    },
    {
      title: 'Total Alokasi Kuota',
      value: formatIndoDays(totalAllocatedQuota),
      description: 'Akumulasi kuota perusahaan',
      icon: CheckCircle2,
      color: 'text-emerald-800 dark:text-emerald-300',
      bgColor: 'bg-emerald-100/70 dark:bg-emerald-900/40',
      borderColor: 'border-emerald-300 dark:border-emerald-800/60',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`relative overflow-hidden rounded-2xl border ${card.borderColor} bg-white dark:bg-slate-900 p-5 shadow-2xs transition-all hover:shadow-xs`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {card.title}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  {isLoading ? (
                    <div className="h-7 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                  ) : (
                    <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {card.value}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {card.description}
                </p>
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bgColor} ${card.color}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
