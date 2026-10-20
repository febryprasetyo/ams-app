'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Laptop, Car, Building2, Wrench, Plus, ArrowRight } from 'lucide-react';
import { APPROVAL_CATEGORIES, ApprovalCategory } from '@/lib/ga/catalogConfig';
import { useAuth } from '@/context/AuthContext';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  ShoppingBag,
  Laptop,
  Car,
  Building: Building2,
  Wrench,
};

interface GAApprovalsCatalogProps {
  onNewGoodsRequest?: () => void;
}

export default function GAApprovalsCatalog({ onNewGoodsRequest }: GAApprovalsCatalogProps) {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('ga.requests.create');

  return (
    <section aria-label="Katalog Pengajuan GA" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Katalog Jenis Pengajuan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pilih kategori pengajuan administrasi General Affairs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {APPROVAL_CATEGORIES.map((category) => {
          const Icon = ICON_MAP[category.iconName] || ShoppingBag;

          if (category.active) {
            return (
              <div
                key={category.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/40 to-white p-5 shadow-sm transition hover:border-emerald-600 hover:shadow-md dark:border-emerald-500/30 dark:from-emerald-950/20 dark:to-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                      <Icon size={22} />
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                      Aktif
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                    {category.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {category.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                  {canCreate && (
                    <Link
                      href={category.createHref || '/dashboard/ga/requests/new'}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                    >
                      <Plus size={14} /> Buat Pengajuan
                    </Link>
                  )}
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    Tanda Tangan Basah
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={category.id}
              className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-5 opacity-75 dark:border-slate-800 dark:bg-slate-900/40"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <Icon size={22} />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {category.badgeText || 'Segera Hadir'}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-700 dark:text-slate-300">
                  {category.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {category.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span>Tahap berikutnya</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
