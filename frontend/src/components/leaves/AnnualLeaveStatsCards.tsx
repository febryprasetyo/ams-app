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
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      borderColor: 'border-blue-100 dark:border-blue-900/50',
    },
    {
      title: 'Rata-rata Sisa Cuti',
      value: formatIndoDays(averageRemainingDays),
      description: 'Per karyawan di tahun aktif',
      icon: Clock,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-100 dark:border-emerald-900/50',
    },
    {
      title: 'Total Kuota Terpakai',
      value: formatIndoDays(totalUsedDays),
      description: 'Cuti diambil tahun ini',
      icon: CalendarDays,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      borderColor: 'border-amber-100 dark:border-amber-900/50',
    },
    {
      title: 'Total Kuota Diterbitkan',
      value: formatIndoDays(totalAllocatedQuota),
      description: 'Akumulasi kuota perusahaan',
      icon: CheckCircle2,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
      borderColor: 'border-indigo-100 dark:border-indigo-900/50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`relative overflow-hidden rounded-xl border ${card.borderColor} bg-white dark:bg-slate-900 p-5 shadow-sm transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {card.title}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  {isLoading ? (
                    <div className="h-7 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
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
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bgColor} ${card.color}`}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
